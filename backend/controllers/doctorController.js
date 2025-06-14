import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import { errors } from '../utils/errorHandler.js';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js'; // Keeping User import as Doctor model references it for createdBy/updatedBy
import { executePaginatedQuery } from '../utils/pagination.js';
// import { MODULES, OPERATIONS } from '../config/privileges.js'; // No longer needed for doctor creation only

// Create a new referring doctor
export const createDoctor = asyncHandler(async (req, res) => {
    // Destructure specifically the fields that belong to the Doctor model
    const {
        name, specialization, contactNumber, licenseNumber,
        totalPatientsReferred, totalScansReferred, address, isActive, experience,
        // Explicitly exclude email and createdBy as they are not for Doctor model directly in this context
        email, createdBy, ...otherFields // Catch any other unexpected fields
    } = req.body;

    // Construct the doctor data with only the relevant fields for Doctor model
    const doctorData = {
        name, specialization, contactNumber, licenseNumber,
        totalPatientsReferred, totalScansReferred, address, isActive, experience,
        // You can assign createdBy if you have an authenticated user and want to track it
        // createdBy: req.user?._id
    };

    console.log("we are here");
    // Check for existing doctor
    const existingDoctor = await Doctor.findOne({
        $or: [
            { licenseNumber },
            { contactNumber }
        ]
    });
    console.log("we are here");

    if (existingDoctor) {
        throw errors.Conflict('A doctor with this license number or contact number already exists');
    }
    console.log("this is the request.body after filtering: ", doctorData);

    try {
        const doctor = await Doctor.create(doctorData);
        console.log("Doctor created successfully: ", doctor);

        res.status(StatusCodes.CREATED).json({
            status: 'success',
            data: doctor
        });
    } catch (error) {
        console.error("Error during doctor creation or response sending:", error);
        // More specific error handling can be added here based on error.name or error.code
        throw errors.InternalServerError('Failed to create doctor due to an internal error.');
    }
});

// Get all doctors with filtering and pagination
export const getAllDoctors = asyncHandler(async (req, res) => {
    const {
        search,
        specialization,
        ...paginationOptions
    } = req.query;

    // Build query
    const query = {};
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { contactNumber: { $regex: search, $options: 'i' } },
            { licenseNumber: { $regex: search, $options: 'i' } } // Added licenseNumber to search
        ];
    }
    if (specialization) {
        query.specialization = specialization;
    }

    const result = await executePaginatedQuery(
        Doctor,
        query,
        paginationOptions
    );

    res.status(StatusCodes.OK).json(result);
});

// Get a single referring doctor
export const getDoctor = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
        throw errors.NotFound('Doctor not found');
    }

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: doctor
    });
});

// Update a referring doctor
export const updateDoctor = asyncHandler(async (req, res) => {
    // Explicitly exclude email when destructuring req.body for update
    const { licenseNumber, contactNumber, email, ...updateFields } = req.body;
    const doctorId = req.params.id;

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
        throw errors.NotFound('Doctor not found');
    }

    // Check for duplicate license number or contact number
    if (licenseNumber || contactNumber) {
        const existingDoctor = await Doctor.findOne({
            _id: { $ne: doctorId },
            $or: [
                { licenseNumber: licenseNumber || doctor.licenseNumber },
                { contactNumber: contactNumber || doctor.contactNumber }
            ]
        });

        if (existingDoctor) {
            throw errors.Conflict('A doctor with this license number or contact number already exists');
        }
    }

    // Update doctor with only allowed fields (excluding email)
    const updatedDoctor = await Doctor.findByIdAndUpdate(
        doctorId,
        { $set: updateFields },
        { new: true, runValidators: true }
    );

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: updatedDoctor
    });
});

// Delete a referring doctor
export const deleteDoctor = asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
        throw errors.NotFound('Doctor not found');
    }

    // Check if doctor has any referrals
    if (doctor.referralCount > 0) {
        throw errors.Conflict('Cannot delete doctor with existing referrals');
    }

    await doctor.deleteOne();

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Doctor deleted successfully'
    });
});

// Get top referring doctors
export const getTopReferringDoctors = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const topDoctors = await Doctor.find({ isActive: true })
        .sort({ referralCount: -1 })
        .limit(parseInt(limit))
        .select('name specialization referralCount');

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: topDoctors
    });
});

// Update doctor availability
export const updateAvailability = asyncHandler(async (req, res) => {
    const { availability } = req.body;

    const doctor = await Doctor.findByIdAndUpdate(
        req.params.id,
        { $set: { availability } },
        { new: true, runValidators: true }
    );

    if (!doctor) {
        throw errors.NotFound('Doctor not found');
    }

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: doctor
    });
});

// Get doctor schedule
export const getDoctorSchedule = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const doctor = await Doctor.findById(req.params.id)
        .populate({
            path: 'appointments',
            match: {
                date: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            },
            populate: {
                path: 'patient',
                select: 'firstName lastName contactNumber'
            }
        });

    if (!doctor) {
        throw errors.NotFound('Doctor not found');
    }

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: {
            doctor: {
                id: doctor._id,
                name: `${doctor.firstName} ${doctor.lastName}`,
                specialization: doctor.specialization
            },
            availability: doctor.availability,
            appointments: doctor.appointments
        }
    });
}); 