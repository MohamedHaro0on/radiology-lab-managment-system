import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import { errors } from '../utils/errorHandler.js';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import { executePaginatedQuery } from '../utils/pagination.js';

// Create a new referring doctor
export const createDoctor = asyncHandler(async (req, res) => {
    const { email, licenseNumber, contactNumber } = req.body;

    // Check for existing doctor
    const existingDoctor = await Doctor.findOne({
        $or: [
            { email },
            { licenseNumber },
            { contactNumber }
        ]
    });

    if (existingDoctor) {
        throw errors.Conflict('A doctor with this email, license number, or contact number already exists');
    }

    const doctor = await Doctor.create(req.body);

    res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: doctor
    });
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
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
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
    const { email, licenseNumber, contactNumber } = req.body;
    const doctorId = req.params.id;

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
        throw errors.NotFound('Doctor not found');
    }

    // Check for duplicate email, license number, or contact number
    if (email || licenseNumber || contactNumber) {
        const existingDoctor = await Doctor.findOne({
            _id: { $ne: doctorId },
            $or: [
                { email: email || doctor.email },
                { licenseNumber: licenseNumber || doctor.licenseNumber },
                { contactNumber: contactNumber || doctor.contactNumber }
            ]
        });

        if (existingDoctor) {
            throw errors.Conflict('A doctor with this email, license number, or contact number already exists');
        }
    }

    // Update doctor
    const updatedDoctor = await Doctor.findByIdAndUpdate(
        doctorId,
        { $set: req.body },
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