import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import { errors } from '../utils/errorHandler.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import { executePaginatedQuery } from '../utils/pagination.js';
import websocketManager from '../utils/websocket.js';
import { logAudit } from '../services/auditService.js';
import { deductStockForAppointment, checkStockAvailability } from '../services/stockService.js';
import Audit from '../models/Audit.js';
import User from '../models/User.js';

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
        console.log('--- [createAppointment] Incoming request body:', req.body);
        const { radiologistId, patientId, scans, scheduledAt, notes, branch, makeHugeSale, customPrice } = req.body;

        // Log the radiologistId being searched for
        console.log('--- [createAppointment] Looking for radiologistId:', radiologistId);
        // Log all radiologists in the database for debugging
        const allRadiologists = await User.find({ userType: 'radiologist' });
        console.log('--- [createAppointment] All radiologists:', allRadiologists.map(r => ({ _id: r._id, name: r.name })));

        // Use User model for radiologist lookup
        const [radiologist, patient] = await Promise.all([
            User.findOne({ _id: radiologistId, userType: 'radiologist' }),
            Patient.findById(patientId).populate('doctorReferred')
        ]);
        console.log('--- [createAppointment] Fetched radiologist:', radiologist);
        console.log('--- [createAppointment] Fetched patient:', patient);

        if (!radiologist) {
            console.error('Radiologist not found:', radiologistId);
            throw errors.NotFound('Radiologist not found');
        }
        if (!patient) {
            console.error('Patient not found:', patientId);
            throw errors.NotFound('Patient not found');
        }

        // Get the referring doctor from the patient's doctorReferred field
        const doctor = patient.doctorReferred;
        if (!doctor) {
            console.error('Patient has no referring doctor:', patientId);
            throw errors.NotFound('Patient has no referring doctor');
        }
        console.log('--- [createAppointment] Fetched doctor from patient:', doctor);

        // Check if radiologist and doctor are active
        if (!radiologist.isActive) {
            console.error('Radiologist is not active:', radiologistId);
            throw errors.BadRequest('Radiologist is not available');
        }
        if (!doctor.isActive) {
            console.error('Doctor is not active:', doctor._id);
            throw errors.BadRequest('Referring doctor is not available');
        }

        // Check for scheduling conflicts
        const existingAppointment = await Appointment.findOne({
            radiologistId,
            scheduledAt,
            status: { $in: ['scheduled', 'in_progress'] },
            isActive: true
        });
        console.log('--- [createAppointment] Existing appointment:', existingAppointment);

        if (existingAppointment) {
            console.error('Time slot is already booked:', scheduledAt);
            throw errors.Conflict('Time slot is already booked');
        }

        // Check stock availability for the scans
        console.log('--- [createAppointment] Checking stock availability for scans:', scans);
        const stockAvailability = await checkStockAvailability(scans, branch);

        if (!stockAvailability.available) {
            console.error('--- [createAppointment] Stock not available for appointment:', stockAvailability.unavailableItems);
            throw errors.BadRequest(`Cannot create appointment: ${stockAvailability.unavailableItems.map(item => `${item.itemName} - ${item.reason}`).join(', ')}`);
        }

        console.log('--- [createAppointment] Stock availability confirmed for appointment creation');

        // Validate huge sale privilege and custom price
        if (makeHugeSale) {
            const hasHugeSalePrivilege = req.user.privileges?.some(p =>
                p.module === 'appointments' && p.operation === 'makeHugeSale'
            );
            console.log('--- [createAppointment] User has huge sale privilege:', hasHugeSalePrivilege);

            if (!hasHugeSalePrivilege) {
                console.error('User does not have huge sale privilege:', req.user);
                throw errors.Forbidden('You do not have permission to make huge sales');
            }

            if (!customPrice || customPrice <= 0) {
                console.error('Custom price invalid:', customPrice);
                throw errors.BadRequest('Custom price is required and must be greater than 0 for huge sales');
            }
        }

        const appointmentData = {
            radiologistId,
            patientId,
            branch,
            scans,
            referredBy: doctor._id, // Use the doctor from patient's doctorReferred
            scheduledAt,
            notes,
            status: 'scheduled',
            createdBy: req.user?._id || null
        };
        console.log('--- [createAppointment] Appointment data to save:', appointmentData);

        const appointment = new Appointment(appointmentData);

        // If huge sale is enabled, override the calculated price
        if (makeHugeSale && customPrice) {
            appointment.price = customPrice;
            appointment.cost = 0; // We'll calculate this based on scans
            appointment.profit = customPrice - appointment.cost;
            await appointment.save();
        } else {
            // Calculate financials normally - this no longer saves internally
            await appointment.calculateFinancials();
            await appointment.save();
        }

        console.log('--- [createAppointment] Appointment saved:', appointment);

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
        console.log('--- [createAppointment] Audit log created');

        // Increment doctor's total scans referred
        await doctor.incrementScansReferred();
        console.log('--- [createAppointment] Doctor scans referred incremented');

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
        console.log('--- [createAppointment] WebSocket notification sent');

        res.status(StatusCodes.CREATED).json({
            status: 'success',
            message: 'Appointment created successfully',
            data: appointment.info
        });
    } catch (error) {
        console.error('--- [createAppointment] Internal server error:', error);
        return res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
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
    try {
        console.log('--- [getAllAppointments] Starting with query:', req.query);

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
                { 'patientId.name': { $regex: search, $options: 'i' } },
                { 'patientId.phoneNumber': { $regex: search, $options: 'i' } },
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

        console.log('--- [getAllAppointments] Built query:', query);
        console.log('--- [getAllAppointments] Pagination options:', paginationOptions);

        const result = await executePaginatedQuery(
            Appointment,
            query,
            paginationOptions,
            [
                { path: 'patientId', select: 'name phoneNumber gender dateOfBirth' },
                { path: 'referredBy', select: 'name specialization' },
                { path: 'radiologistId', select: 'name licenseId' },
                { path: 'branch', select: 'name location' }
            ]
        );

        console.log('--- [getAllAppointments] Query executed successfully, result:', result);

        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        console.error('--- [getAllAppointments] Error:', error);
        console.error('--- [getAllAppointments] Error stack:', error.stack);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
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
//   radiologistId: ObjectId (optional),
//   patientId: ObjectId (optional),
//   scans: Array (optional),
//   scheduledAt: Date (optional),
//   notes: string (optional),
//   priority: enum['routine', 'urgent', 'emergency'] (optional),
//   makeHugeSale: boolean (optional),
//   customPrice: number (optional, required if makeHugeSale is true)
// }
// @returns Updated appointment object
// @note    Cannot update completed, cancelled, or no-show appointments
export const updateAppointment = asyncHandler(async (req, res) => {
    try {
        console.log('--- [updateAppointment] Starting update for appointment:', req.params.id);
        console.log('--- [updateAppointment] Update data:', req.body);

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

        // If updating scheduledAt, check for conflicts
        if (req.body.scheduledAt) {
            const existingAppointment = await Appointment.findOne({
                radiologistId: appointment.radiologistId,
                scheduledAt: req.body.scheduledAt,
                status: { $in: ['scheduled', 'in_progress'] },
                isActive: true,
                _id: { $ne: appointment._id }
            });

            if (existingAppointment) {
                throw errors.Conflict('Time slot conflicts with existing appointment');
            }
        }

        // Update appointment fields
        const allowedUpdates = ['radiologistId', 'patientId', 'scans', 'scheduledAt', 'notes', 'priority', 'makeHugeSale', 'customPrice'];
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                appointment[field] = req.body[field];
            }
        });

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
        console.log('--- [updateAppointment] Appointment updated successfully:', updatedAppointment._id);

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
    } catch (error) {
        console.error('--- [updateAppointment] Error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
});

// @desc    Update appointment status
// @route   PATCH /api/appointments/:id/status
// @access  Private (admin/manager/radiologist)
// @params  {
//   id: string (required, valid MongoDB ObjectId)
// }
// @body    {
//   status: enum['scheduled', 'in_progress', 'completed', 'cancelled', 'no-show'] (required),
//   notes: string (optional),
//   pdfFile: File (required when status is 'completed')
// }
// @returns Updated appointment object
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
    try {
        console.log('--- [updateAppointmentStatus] Starting status update for appointment:', req.params.id);
        console.log('--- [updateAppointmentStatus] Status update data:', req.body);

        const { status, notes, pdfFile } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            throw errors.NotFound('Appointment not found');
        }

        // Debug logging for appointment data
        console.log('--- [updateAppointmentStatus] Full appointment object:', JSON.stringify(appointment, null, 2));
        console.log('--- [updateAppointmentStatus] Request body:', req.body);
        console.log('--- [updateAppointmentStatus] Request file:', req.file);

        // Check if appointment status is defined
        if (!appointment.status) {
            console.error('--- [updateAppointmentStatus] Appointment status is undefined or null');
            throw errors.BadRequest('Appointment status is not defined');
        }

        const originalStatus = appointment.status;

        // Validate status transition
        const validTransitions = {
            'scheduled': ['in_progress', 'cancelled', 'no-show', 'confirmed', 'completed'],
            'confirmed': ['in_progress', 'cancelled', 'no-show', 'completed'],
            'pending': ['scheduled', 'in_progress', 'cancelled', 'no-show', 'completed'],
            'in_progress': ['completed', 'cancelled'],
            'completed': [],
            'cancelled': [],
            'no-show': []
        };

        // Debug logging
        console.log('--- [updateAppointmentStatus] Current appointment status:', appointment.status);
        console.log('--- [updateAppointmentStatus] Requested status:', status);
        console.log('--- [updateAppointmentStatus] Valid transitions:', validTransitions);

        // Check if current status exists in valid transitions
        if (!validTransitions[appointment.status]) {
            console.error('--- [updateAppointmentStatus] Invalid current status:', appointment.status);
            throw errors.BadRequest(`Invalid current appointment status: ${appointment.status}`);
        }

        if (!validTransitions[appointment.status].includes(status)) {
            console.error('--- [updateAppointmentStatus] Invalid transition from', appointment.status, 'to', status);
            throw errors.BadRequest(`Cannot transition from ${appointment.status} to ${status}`);
        }

        // If completing appointment, require PDF file and check stock availability
        if (status === 'completed') {
            if (!req.file) {
                throw errors.BadRequest('PDF file is required when completing an appointment');
            }

            // Check stock availability before completing
            console.log('--- [updateAppointmentStatus] Checking stock availability for completion');
            const stockAvailability = await checkStockAvailability(appointment.scans, appointment.branch);

            if (!stockAvailability.available) {
                console.error('--- [updateAppointmentStatus] Stock not available for completion:', stockAvailability.unavailableItems);
                throw errors.BadRequest(`Cannot complete appointment: ${stockAvailability.unavailableItems.map(item => `${item.itemName} - ${item.reason}`).join(', ')}`);
            }

            console.log('--- [updateAppointmentStatus] Stock availability confirmed for completion');
        }

        // Update status
        appointment.status = status;
        appointment.updatedBy = req.user._id;

        if (notes) {
            appointment.notes = notes;
        }

        // Handle PDF upload for completed appointments
        if (status === 'completed' && req.file) {
            // Save PDF file and get the file path
            const pdfPath = await savePDFFile(req.file, appointment._id);
            appointment.pdfReport = pdfPath;
        }

        await appointment.save();
        console.log('--- [updateAppointmentStatus] Appointment status updated successfully:', appointment._id);

        // Deduct stock items if appointment is completed
        let stockDeductionResult = null;
        if (status === 'completed') {
            console.log('--- [updateAppointmentStatus] Starting stock deduction for completed appointment');
            stockDeductionResult = await deductStockForAppointment(appointment.scans, appointment.branch);

            if (!stockDeductionResult.success) {
                console.error('--- [updateAppointmentStatus] Stock deduction failed:', stockDeductionResult.errors);
                // Note: We don't throw an error here because the appointment is already saved
                // The stock deduction failure will be logged in the audit trail
            } else {
                console.log('--- [updateAppointmentStatus] Stock deduction successful:', stockDeductionResult.deductedItems.length, 'items deducted');
            }
        }

        // Log audit trail
        await logAudit({
            user: req.user._id,
            action: 'STATUS_CHANGE',
            entityId: appointment._id,
            changes: {
                from: originalStatus,
                to: status,
                notes: notes || null,
                pdfUploaded: status === 'completed' ? true : false,
                stockDeduction: status === 'completed' ? {
                    success: stockDeductionResult?.success || false,
                    itemsDeducted: stockDeductionResult?.deductedItems?.length || 0,
                    totalQuantityDeducted: stockDeductionResult?.totalItemsDeducted || 0,
                    errors: stockDeductionResult?.errors || []
                } : null
            }
        });

        // Populate references for response
        await appointment.populate([
            { path: 'patientId', select: 'name phoneNumber gender dateOfBirth' },
            { path: 'referredBy', select: 'name specialization' },
            { path: 'radiologistId', select: 'name licenseId' }
        ]);

        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Appointment status updated successfully',
            data: appointment
        });
    } catch (error) {
        console.error('--- [updateAppointmentStatus] Error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Helper function to save PDF file
const savePDFFile = async (file, appointmentId) => {
    // The file is already saved by multer, we just need to return the path
    if (!file) {
        throw new Error('No file uploaded');
    }

    // Return the relative path to the uploaded file
    return `/uploads/reports/${file.filename}`;
};

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