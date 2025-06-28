import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import { errors } from '../utils/errorHandler.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import PatientHistory from '../models/PatientHistory.js';
import { executePaginatedQuery } from '../utils/pagination.js';
import websocketManager from '../utils/websocket.js';
import Radiologist from '../models/Radiologist.js';
import { logAudit } from '../services/auditService.js';
import Audit from '../models/Audit.js';

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private (admin/manager/doctor)
// @body    {
//   radiologistId: ObjectId (required, ref: Radiologist),
//   patientId: ObjectId (required, ref: Patient),
//   scans: [{
//     scan: ObjectId (required, ref: Scan),
//     quantity: number (default: 1)
//   }],
//   referredBy: ObjectId (required, ref: Doctor),
//   scheduledAt: Date (required),
//   notes: string (optional),
//   makeHugeSale: boolean (optional),
//   customPrice: number (optional, required if makeHugeSale is true)
// }
// @returns Created appointment object
// @note    Increments totalScansReferred for referring doctor
export const createAppointment = asyncHandler(async (req, res, next) => {
    try {
        const { radiologistId, patientId, scans, referredBy, scheduledAt, notes, branch, makeHugeSale, customPrice } = req.body;

        // Check if radiologist, patient, and doctor exist
        const [radiologist, patient, doctor] = await Promise.all([
            Radiologist.findById(radiologistId),
            Patient.findById(patientId),
            Doctor.findById(referredBy)
        ]);

        if (!radiologist) {
            throw errors.NotFound('Radiologist not found');
        }
        if (!patient) {
            throw errors.NotFound('Patient not found');
        }
        if (!doctor) {
            throw errors.NotFound('Referring doctor not found');
        }

        // Check if radiologist and doctor are active
        if (!radiologist.isActive) {
            throw errors.BadRequest('Radiologist is not available');
        }
        if (!doctor.isActive) {
            throw errors.BadRequest('Referring doctor is not available');
        }

        // Check for scheduling conflicts
        const existingAppointment = await Appointment.findOne({
            radiologistId,
            scheduledAt,
            status: { $in: ['scheduled', 'in_progress'] },
            isActive: true
        });

        if (existingAppointment) {
            throw errors.Conflict('Time slot is already booked');
        }

        // Validate huge sale privilege and custom price
        if (makeHugeSale) {
            const hasHugeSalePrivilege = req.user.privileges?.some(p =>
                p.module === 'appointments' && p.operation === 'makeHugeSale'
            );

            if (!hasHugeSalePrivilege) {
                throw errors.Forbidden('You do not have permission to make huge sales');
            }

            if (!customPrice || customPrice <= 0) {
                throw errors.BadRequest('Custom price is required and must be greater than 0 for huge sales');
            }
        }

        const appointmentData = {
            radiologistId,
            patientId,
            branch,
            scans,
            referredBy,
            scheduledAt,
            notes,
            status: 'scheduled',
            createdBy: req.user?._id || null
        };

        const appointment = new Appointment(appointmentData);

        // If huge sale is enabled, override the calculated price
        if (makeHugeSale && customPrice) {
            appointment.price = customPrice;
            appointment.cost = 0; // We'll calculate this based on scans
            appointment.profit = customPrice - appointment.cost;
        } else {
            // Calculate financials normally
            await appointment.calculateFinancials();
        }

        await appointment.save();

        // Log audit trail
        await logAudit({
            user: req.user._id,
            action: 'CREATE',
            entityId: appointment._id,
            changes: {
                ...appointment.toObject(),
                makeHugeSale: makeHugeSale || false,
                customPrice: customPrice || null
            }
        });

        // Increment doctor's total scans referred
        await doctor.incrementScansReferred();

        // Send WebSocket notification to the assigned radiologist
        websocketManager.sendNotification(radiologistId.toString(), {
            type: 'new_appointment',
            data: {
                appointmentId: appointment._id,
                patientName: patient.name,
                scheduledAt: appointment.scheduledAt,
                scans: appointment.scans
            }
        });

        res.status(StatusCodes.CREATED).json({
            status: 'success',
            message: 'Appointment created successfully',
            data: appointment.info
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
        representativeId,
        ...paginationOptions
    } = req.query;

    // Build query
    const query = { isActive: true };
    if (search) {
        query.$or = [
            { 'patient.name': { $regex: search, $options: 'i' } },
            { 'patient.phoneNumber': { $regex: search, $options: 'i' } },
            { 'referredBy.name': { $regex: search, $options: 'i' } }
        ];
    }
    if (status) {
        query.status = status;
    }
    if (startDate || endDate) {
        query.scheduledAt = {};
        if (startDate) {
            query.scheduledAt.$gte = new Date(startDate);
        }
        if (endDate) {
            query.scheduledAt.$lte = new Date(endDate);
        }
    }
    if (patientId) {
        query.patientId = patientId;
    }
    if (doctorId) {
        query.referredBy = doctorId;
    }
    if (representativeId) {
        query.representative = representativeId;
    }

    const result = await executePaginatedQuery(
        Appointment,
        query,
        paginationOptions,
        [
            { path: 'patientId', select: 'name phoneNumber gender dateOfBirth', ref: 'Patient' },
            { path: 'referredBy', select: 'name specialization', ref: 'Doctor' },
            { path: 'radiologistId', select: 'name licenseId', ref: 'Radiologist' }
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
//   notes: string (optional),
//   makeHugeSale: boolean (optional),
//   customPrice: number (optional, required if makeHugeSale is true)
// }
// @returns Updated appointment object
// @note    Cannot update completed, cancelled, or no-show appointments
export const updateAppointment = asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
        throw errors.NotFound('Appointment not found');
    }

    // Store original document for comparison
    const originalAppointment = appointment.toObject();

    // Check if appointment can be updated
    if (['completed', 'cancelled', 'no-show'].includes(appointment.status)) {
        throw errors.BadRequest('Cannot update a completed, cancelled, or no-show appointment');
    }

    // Validate huge sale privilege and custom price if provided
    const { makeHugeSale, customPrice } = req.body;
    if (makeHugeSale) {
        const hasHugeSalePrivilege = req.user.privileges?.some(p =>
            p.module === 'appointments' && p.operation === 'makeHugeSale'
        );

        if (!hasHugeSalePrivilege) {
            throw errors.Forbidden('You do not have permission to make huge sales');
        }

        if (!customPrice || customPrice <= 0) {
            throw errors.BadRequest('Custom price is required and must be greater than 0 for huge sales');
        }
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
    Object.assign(appointment, req.body);
    appointment.updatedBy = req.user._id;

    // Handle huge sale pricing
    if (makeHugeSale && customPrice) {
        appointment.price = customPrice;
        // Recalculate cost based on scans
        await appointment.calculateFinancials();
        appointment.price = customPrice; // Override the calculated price
        appointment.profit = customPrice - appointment.cost;
    } else if (req.body.scans) {
        // If scans were updated, recalculate financials
        await appointment.calculateFinancials();
    }

    const updatedAppointment = await appointment.save();

    // Log audit trail
    await logAudit({
        user: req.user._id,
        action: 'UPDATE',
        entityId: updatedAppointment._id,
        changes: {
            before: originalAppointment,
            after: {
                ...updatedAppointment.toObject(),
                makeHugeSale: makeHugeSale || false,
                customPrice: customPrice || null
            }
        }
    });

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Appointment updated successfully',
        data: updatedAppointment.info
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

    const originalStatus = appointment.status;

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

    // Log audit trail
    await logAudit({
        user: req.user._id,
        action: 'STATUS_CHANGE',
        entityId: appointment._id,
        changes: {
            from: originalStatus,
            to: status
        }
    });

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

    const deletedAppointment = appointment.toObject();
    await appointment.deleteOne();

    // Log audit trail
    await logAudit({
        user: req.user._id,
        action: 'DELETE',
        entityId: deletedAppointment._id,
        changes: {
            deleted: deletedAppointment
        }
    });

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

// @desc    Get audit history for an appointment
// @route   GET /api/appointments/:id/history
// @access  Private
export const getAppointmentHistory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const history = await Audit.find({ entityId: id })
        .populate('user', 'username email')
        .sort({ createdAt: 'desc' });

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: history
    });
}); 