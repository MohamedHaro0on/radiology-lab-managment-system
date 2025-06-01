import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import { errors } from '../utils/errorHandler.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import PatientHistory from '../models/PatientHistory.js';
import { executePaginatedQuery } from '../utils/pagination.js';
import websocketManager from '../utils/websocket.js';

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private (admin/manager/doctor)
// @body    {
//   patientId: ObjectId (required, ref: Patient),
//   doctorId: ObjectId (required, ref: Doctor),
//   appointmentDate: Date (required),
//   timeSlot: {
//     start: string (required, HH:MM format),
//     end: string (required, HH:MM format)
//   },
//   type: enum['X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Mammography', 'Other'] (required),
//   priority: enum['routine', 'urgent', 'emergency'] (required),
//   notes: string (optional),
//   referralSource: string (optional)
// }
// @returns Created appointment object
// @note    Increments referralCount for referring doctor if patient was referred
export const createAppointment = asyncHandler(async (req, res, next) => {
    try {
        const { patientId, doctorId, appointmentDate, timeSlot, type, priority, notes, referralSource } = req.body;

        // Check if doctor and patient exist
        const [doctor, patient] = await Promise.all([
            Doctor.findById(doctorId),
            Patient.findById(patientId)
        ]);

        if (!doctor) {
            throw errors.NotFound('Doctor not found');
        }
        if (!patient) {
            throw errors.NotFound('Patient not found');
        }

        // Check doctor availability
        if (!doctor.isActive) {
            throw errors.BadRequest('Doctor is not available');
        }

        // Check for scheduling conflicts
        const existingAppointment = await Appointment.findOne({
            doctor: doctorId,
            appointmentDate,
            timeSlot,
            status: { $in: ['scheduled', 'confirmed'] }
        });

        if (existingAppointment) {
            throw errors.Conflict('Time slot is already booked');
        }

        const appointmentData = {
            patient: patientId,
            doctor: doctorId,
            appointmentDate,
            timeSlot,
            type,
            priority,
            notes,
            referralSource,
            status: 'scheduled',
            createdBy: req.user._id
        };

        // Check if slot is available
        const isAvailable = await Appointment.isSlotAvailable(
            doctorId,
            appointmentDate,
            timeSlot
        );

        if (!isAvailable) {
            throw errors.BadRequest('Appointment slot is not available');
        }

        const appointment = await Appointment.create(appointmentData);

        // Send WebSocket notification to the assigned doctor
        websocketManager.sendNotification(doctorId.toString(), {
            type: 'new_appointment',
            data: {
                appointmentId: appointment._id,
                patientName: patient.name,
                appointmentDate: appointment.appointmentDate,
                appointmentTime: appointment.timeSlot,
                scanType: appointment.type,
                priority: appointment.priority
            }
        });

        // If this is a referral appointment (patient was referred by a doctor)
        if (patient.referredBy) {
            // Increment the referring doctor's referral count
            await Doctor.findByIdAndUpdate(patient.referredBy, {
                $inc: { referralCount: 1 }
            });
        }

        res.status(StatusCodes.CREATED).json({
            status: 'success',
            data: appointment
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get all appointments with filtering and pagination
// @route   GET /api/appointments
// @access  Private (admin/manager/doctor/staff)
// @query   {
//   page: number (default: 1),
//   limit: number (default: 10),
//   patient: ObjectId (optional, ref: Patient),
//   doctor: ObjectId (optional, ref: Doctor),
//   status: enum['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'] (optional),
//   type: string (optional),
//   priority: enum['routine', 'urgent', 'emergency'] (optional),
//   startDate: Date (optional),
//   endDate: Date (optional),
//   sortBy: string (default: 'appointmentDate'),
//   sortOrder: enum['asc', 'desc'] (default: 'asc')
// }
// @returns Paginated list of appointments with populated references
export const getAllAppointments = asyncHandler(async (req, res) => {
    const {
        search,
        status,
        startDate,
        endDate,
        patientId,
        doctorId,
        ...paginationOptions
    } = req.query;

    // Build query
    const query = {};
    if (search) {
        query.$or = [
            { 'patient.name': { $regex: search, $options: 'i' } },
            { 'patient.phone': { $regex: search, $options: 'i' } },
            { 'doctor.name': { $regex: search, $options: 'i' } }
        ];
    }
    if (status) {
        query.status = status;
    }
    if (startDate || endDate) {
        query.appointmentDate = {};
        if (startDate) {
            query.appointmentDate.$gte = new Date(startDate);
        }
        if (endDate) {
            query.appointmentDate.$lte = new Date(endDate);
        }
    }
    if (patientId) {
        query['patient._id'] = patientId;
    }
    if (doctorId) {
        query['doctor._id'] = doctorId;
    }

    const result = await executePaginatedQuery(
        Appointment,
        query,
        paginationOptions,
        [
            { path: 'patient', select: 'name phone gender dateOfBirth' },
            { path: 'doctor', select: 'name specialization' }
        ]
    );

    res.status(StatusCodes.OK).json(result);
});

// @desc    Get a single appointment by ID
// @route   GET /api/appointments/:id
// @access  Private (admin/manager/doctor/staff)
// @params  {
//   id: string (required, valid MongoDB ObjectId)
// }
// @returns Appointment object with populated references
export const getAppointment = asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id)
        .populate([
            { path: 'patient', select: 'firstName lastName email phoneNumber' },
            { path: 'doctor', select: 'firstName lastName specialization' },
            { path: 'createdBy', select: 'username email' },
            { path: 'updatedBy', select: 'username email' }
        ]);

    if (!appointment) {
        throw errors.NotFound('Appointment not found');
    }

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: appointment
    });
});

// @desc    Update appointment details
// @route   PATCH /api/appointments/:id
// @access  Private (admin/manager/doctor)
// @params  {
//   id: string (required, valid MongoDB ObjectId)
// }
// @body    {
//   appointmentDate: Date (optional),
//   timeSlot: {
//     start: string (optional, HH:MM format),
//     end: string (optional, HH:MM format)
//   },
//   type: string (optional),
//   priority: enum['routine', 'urgent', 'emergency'] (optional),
//   notes: string (optional)
// }
// @returns Updated appointment object
// @note    Cannot update completed, cancelled, or no-show appointments
export const updateAppointment = asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
        throw errors.NotFound('Appointment not found');
    }

    // Check if appointment can be updated
    if (['completed', 'cancelled', 'no-show'].includes(appointment.status)) {
        throw errors.BadRequest('Cannot update a completed, cancelled, or no-show appointment');
    }

    // If updating date or time, check for conflicts
    if (req.body.appointmentDate || req.body.timeSlot) {
        const updatedAppointment = new Appointment({
            ...appointment.toObject(),
            ...req.body,
            _id: appointment._id
        });

        const hasConflict = await updatedAppointment.hasConflict();
        if (hasConflict) {
            throw errors.Conflict('Time slot conflicts with existing appointment');
        }
    }

    // Update appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        {
            $set: {
                ...req.body,
                updatedBy: req.user._id
            }
        },
        { new: true, runValidators: true }
    ).populate([
        { path: 'patient', select: 'firstName lastName email phoneNumber' },
        { path: 'doctor', select: 'firstName lastName specialization' },
        { path: 'updatedBy', select: 'username email' }
    ]);

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: updatedAppointment
    });
});

// @desc    Update appointment status
// @route   PATCH /api/appointments/:id/status
// @access  Private (admin/manager/doctor)
// @params  {
//   id: string (required, valid MongoDB ObjectId)
// }
// @body    {
//   status: enum['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'] (required),
//   diagnosis: string (required when status is 'completed'),
//   treatment: string (required when status is 'completed'),
//   notes: string (optional)
// }
// @returns Updated appointment object
// @note    Creates patient history record when status is set to 'completed'
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
    const { status, diagnosis, treatment, notes } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
        throw errors.NotFound('Appointment not found');
    }

    // Validate status transition
    const validTransitions = {
        'scheduled': ['confirmed', 'cancelled'],
        'confirmed': ['in-progress', 'cancelled'],
        'in-progress': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': [],
        'no-show': []
    };

    if (!validTransitions[appointment.status].includes(status)) {
        throw errors.BadRequest(`Cannot transition from ${appointment.status} to ${status}`);
    }

    // If completing appointment, require diagnosis and treatment
    if (status === 'completed' && (!diagnosis || !treatment)) {
        throw errors.BadRequest('Diagnosis and treatment are required when completing an appointment');
    }

    // Update status
    appointment.status = status;
    appointment.updatedBy = req.user._id;
    await appointment.save();

    // If appointment is completed, create a patient history record
    if (status === 'completed') {
        const patientHistory = new PatientHistory({
            patientId: appointment.patient,
            doctorId: appointment.doctor,
            date: appointment.appointmentDate,
            diagnosis,
            treatment,
            notes: notes || `Appointment type: ${appointment.type}`
        });
        await patientHistory.save();
    }

    // Populate references
    await appointment.populate([
        { path: 'patient', select: 'firstName lastName email phoneNumber' },
        { path: 'doctor', select: 'firstName lastName specialization' },
        { path: 'updatedBy', select: 'username email' }
    ]);

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: appointment
    });
});

// @desc    Delete an appointment
// @route   DELETE /api/appointments/:id
// @access  Private (admin/manager)
// @params  {
//   id: string (required, valid MongoDB ObjectId)
// }
// @returns Success message
// @note    Can only delete scheduled appointments
export const deleteAppointment = asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
        throw errors.NotFound('Appointment not found');
    }

    // Only allow deletion of scheduled appointments
    if (appointment.status !== 'scheduled') {
        throw errors.BadRequest('Can only delete scheduled appointments');
    }

    await appointment.deleteOne();

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Appointment deleted successfully'
    });
});

// @desc    Get appointments by date range
// @route   GET /api/appointments/date-range
// @access  Private (admin/manager/doctor/staff)
// @query   {
//   startDate: Date (required),
//   endDate: Date (required),
//   doctor: ObjectId (optional, ref: Doctor),
//   status: enum['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'] (optional),
//   page: number (default: 1),
//   limit: number (default: 10),
//   sortBy: string (default: 'appointmentDate'),
//   sortOrder: enum['asc', 'desc'] (default: 'asc')
// }
// @returns Paginated list of appointments within date range
export const getAppointmentsByDateRange = asyncHandler(async (req, res) => {
    const { startDate, endDate, doctor, status, sortBy = 'appointmentDate', sortOrder = 'asc', ...paginationOptions } = req.query;

    if (!startDate || !endDate) {
        throw errors.BadRequest('Start date and end date are required');
    }

    const query = {
        appointmentDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };

    if (doctor) query.doctor = doctor;
    if (status) query.status = status;

    // Execute paginated query with population
    const result = await executePaginatedQuery(
        Appointment,
        query,
        { ...paginationOptions, sortBy, sortOrder },
        [
            { path: 'patient', select: 'firstName lastName email phoneNumber' },
            { path: 'doctor', select: 'firstName lastName specialization' }
        ]
    );

    res.status(StatusCodes.OK).json(result);
}); 