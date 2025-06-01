import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import { errors } from '../utils/errorHandler.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import { executePaginatedQuery } from '../utils/pagination.js';

// @desc    Create a new patient
// @route   POST /api/patients
// @access  Private (admin/manager only)
// @body    {
//   firstName: string (required),
//   lastName: string (required),
//   email: string (required, unique),
//   phoneNumber: string (required, unique),
//   dateOfBirth: Date (required),
//   gender: enum['male', 'female', 'other'] (required),
//   address: {
//     street: string,
//     city: string,
//     state: string,
//     zipCode: string,
//     country: string
//   },
//   referredBy: ObjectId (optional, ref: Doctor)
// }
// @returns Created patient object
export const createPatient = asyncHandler(async (req, res) => {
    const { email, phoneNumber, referredBy } = req.body;

    // Check for existing patient with same email or phone
    const existingPatient = await Patient.findOne({
        $or: [{ email }, { phoneNumber }]
    });

    if (existingPatient) {
        throw errors.Conflict('Patient with this email or phone number already exists');
    }

    const patient = new Patient(req.body);

    // If patient is referred by a doctor, set the reference
    if (referredBy) {
        patient.referredBy = referredBy;
    }

    // Save the patient first
    await patient.save();

    // Update the doctor's patientsCount
    if (referredBy) {
        await Doctor.findByIdAndUpdate(referredBy, {
            $inc: { patientsCount: 1 }
        });
    }

    res.status(StatusCodes.CREATED).json({
        status: 'success',
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
//   sortBy: string (default: 'createdAt'),
//   sortOrder: enum['asc', 'desc'] (default: 'desc')
// }
// @returns Paginated list of patients
export const getAllPatients = asyncHandler(async (req, res) => {
    const {
        search,
        gender,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        ...paginationOptions
    } = req.query;

    // Build query
    const query = {};
    if (gender) query.gender = gender;
    if (search) {
        query.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } }
        ];
    }

    // Execute paginated query
    const result = await executePaginatedQuery(
        Patient,
        query,
        { ...paginationOptions, sortBy, sortOrder },
        { path: 'referredBy', select: 'firstName lastName specialization' }
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
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
        throw errors.NotFound('Patient not found');
    }

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: patient
    });
});

// @desc    Update a patient's information
// @route   PATCH /api/patients/:id
// @access  Private (admin/manager only)
// @params  {
//   id: string (required, valid MongoDB ObjectId)
// }
// @body    {
//   firstName: string (optional),
//   lastName: string (optional),
//   email: string (optional, unique),
//   phoneNumber: string (optional, unique),
//   dateOfBirth: Date (optional),
//   gender: enum['male', 'female', 'other'] (optional),
//   address: {
//     street: string (optional),
//     city: string (optional),
//     state: string (optional),
//     zipCode: string (optional),
//     country: string (optional)
//   }
// }
// @returns Updated patient object
export const updatePatient = asyncHandler(async (req, res) => {
    const { email, phoneNumber } = req.body;
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
        throw errors.NotFound('Patient not found');
    }

    // Check for duplicate email or phone if being updated
    if (email || phoneNumber) {
        const existingPatient = await Patient.findOne({
            $and: [
                { _id: { $ne: patient._id } },
                {
                    $or: [
                        ...(email ? [{ email }] : []),
                        ...(phoneNumber ? [{ phoneNumber }] : [])
                    ]
                }
            ]
        });

        if (existingPatient) {
            throw errors.Conflict('Patient with this email or phone number already exists');
        }
    }

    // Update patient
    const updatedPatient = await Patient.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
    );

    res.status(StatusCodes.OK).json({
        status: 'success',
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
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
        throw errors.NotFound('Patient not found');
    }

    // Check if patient has any active appointments
    const hasActiveAppointments = await Appointment.exists({
        patient: patient._id,
        status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
    });

    if (hasActiveAppointments) {
        throw errors.BadRequest('Cannot delete patient with active appointments');
    }

    await patient.deleteOne();

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