import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import { errors } from '../utils/errorHandler.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import { paginateResults, formatPaginatedResponse } from '../middleware/pagination.js';
import { executePaginatedQuery } from '../utils/pagination.js';

// @desc    Create a new patient
// @route   POST /api/patients
// @access  Private (admin/manager only)
// @body    {
//   name: string (required),
//   gender: enum['male', 'female', 'other'] (required),
//   age: number (required),
//   phoneNumber: string (required),
//   socialNumber: string (required, unique),
//   doctorReferred: ObjectId (required, ref: Doctor),
//   address: {
//     street: string,
//     city: string,
//     state: string,
//     postalCode: string,
//     country: string
//   }
// }
// @returns Created patient object
export const createPatient = asyncHandler(async (req, res) => {
    const { socialNumber, doctorReferred } = req.body;

    // Check for existing patient with same social number only if socialNumber is provided
    if (socialNumber) {
        const existingPatient = await Patient.findOne({ socialNumber });
        if (existingPatient) {
            throw errors.Conflict('Patient with this social number already exists');
        }
    }

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorReferred);
    if (!doctor) {
        throw errors.NotFound('Referred doctor not found');
    }

    const patient = new Patient({
        ...req.body,
        createdBy: req.user?._id || null // Handle case where user might not exist
    });

    // Save the patient
    await patient.save();

    // Increment doctor's total patients referred
    await doctor.incrementPatientsReferred();

    res.status(StatusCodes.CREATED).json({
        status: 'success',
        message: 'Patient created successfully',
        data: patient
    });
});

// @desc    Get all patients with filtering and pagination
// @route   GET /api/patients
// @access  Private (admin/manager/doctor/staff)
// @query   {
//   page: number (default: 1),
//   limit: number (default: 10, max: 100),
//   search: string (optional),
//   gender: enum['male', 'female', 'other'] (optional),
//   doctorId: ObjectId (optional, ref: Doctor),
//   sortBy: string (default: 'createdAt'),
//   sortOrder: enum['asc', 'desc'] (default: 'desc')
// }
// @returns Paginated list of patients
export const getAllPatients = asyncHandler(async (req, res) => {
    const {
        search,
        gender,
        doctorReferred,
        ...paginationOptions
    } = req.query;

    const query = { isActive: true }; // Only show active patients
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } },
            { socialNumber: { $regex: search, $options: 'i' } }
        ];
    }
    if (gender) {
        query.gender = gender;
    }
    if (doctorReferred) {
        query.doctorReferred = doctorReferred;
    }

    const result = await executePaginatedQuery(
        Patient,
        query,
        paginationOptions,
        { path: 'doctorReferred', select: 'name specialization' } // Select only name and specialization
    );

    res.status(StatusCodes.OK).json(result);
});

// @desc    Get a single patient by ID
// @route   GET /api/patients/:id
// @access  Private (admin/manager/doctor/staff)
// @params  {
//   id: string (required, valid MongoDB ObjectId)
// }
// @returns Patient object
export const getPatient = asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({
        _id: req.params.id,
        isActive: true
    }).populate({ path: 'doctorReferred', select: 'name specialization' }); // Select only name and specialization

    if (!patient) {
        throw errors.NotFound('Patient not found');
    }

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: patient
    });
});

// @desc    Update a patient's information
// @route   PUT /api/patients/:id
// @access  Private (admin/manager only)
// @params  {
//   id: string (required, valid MongoDB ObjectId)
// }
// @body    {
//   name: string (optional),
//   gender: enum['male', 'female', 'other'] (optional),
//   age: number (optional),
//   phoneNumber: string (optional),
//   socialNumber: string (optional, unique),
//   doctorReferred: ObjectId (optional, ref: Doctor),
//   address: {
//     street: string (optional),
//     city: string (optional),
//     state: string (optional),
//     postalCode: string (optional),
//     country: string (optional)
//   }
// }
// @returns Updated patient object
export const updatePatient = asyncHandler(async (req, res) => {
    const { socialNumber, doctorReferred } = req.body;
    const patient = await Patient.findOne({
        _id: req.params.id,
        isActive: true
    });

    if (!patient) {
        throw errors.NotFound('Patient not found');
    }

    // Check for duplicate social number if being updated
    if (socialNumber && socialNumber !== patient.socialNumber) {
        const existingPatient = await Patient.findOne({
            socialNumber,
            _id: { $ne: patient._id },
            isActive: true
        });

        if (existingPatient) {
            throw errors.Conflict('Patient with this social number already exists');
        }
    }

    // Check if doctor exists if being updated
    if (doctorReferred) {
        const doctor = await Doctor.findById(doctorReferred);
        if (!doctor) {
            throw errors.NotFound('Referred doctor not found');
        }
    }

    // Update patient
    const updatedPatient = await Patient.findByIdAndUpdate(
        req.params.id,
        {
            $set: {
                ...req.body,
                updatedBy: req.user?._id || null // Handle case where user might not exist
            }
        },
        { new: true, runValidators: true }
    ).populate('doctorReferred', 'name specialization');

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Patient updated successfully',
        data: updatedPatient
    });
});

// @desc    Delete a patient
// @route   DELETE /api/patients/:id
// @access  Private (admin only)
// @params  {
//   id: string (required, valid MongoDB ObjectId)
// }
// @returns Success message
// @note    Cannot delete patients with active appointments
export const deletePatient = asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({
        _id: req.params.id,
        isActive: true
    });

    if (!patient) {
        throw errors.NotFound('Patient not found');
    }

    // Check if patient has any active appointments
    const hasActiveAppointments = await Appointment.exists({
        patientId: patient._id,
        status: { $in: ['scheduled', 'in_progress'] }
    });

    if (hasActiveAppointments) {
        throw errors.BadRequest('Cannot delete patient with active appointments');
    }

    // Soft delete
    patient.isActive = false;
    patient.updatedBy = req.user?._id || null; // Handle case where user might not exist
    await patient.save();

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Patient deleted successfully'
    });
});

export default {
    createPatient,
    getAllPatients,
    getPatient,
    updatePatient,
    deletePatient
}; 