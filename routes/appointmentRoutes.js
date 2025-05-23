import express from 'express';
import { validate } from '../middleware/validate.js';
import { authorize } from '../middleware/auth.js';
import { appointmentValidation } from '../validations/appointmentValidation.js';
import {
    createAppointment,
    getAllAppointments,
    getAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    getAppointmentsByDateRange
} from '../controllers/appointmentController.js';

const router = express.Router();

// Protect all routes
router.use(authorize('admin', 'manager', 'doctor'));

// Create appointment
router.post(
    '/',
    validate(appointmentValidation.createAppointment),
    createAppointment
);

// Get all appointments
router.get(
    '/',
    validate(appointmentValidation.listAppointments),
    getAllAppointments
);

// Get appointments by date range
router.get(
    '/date-range',
    validate(appointmentValidation.listAppointments),
    getAppointmentsByDateRange
);

// Get single appointment
router.get(
    '/:id',
    validate(appointmentValidation.getAppointment),
    getAppointment
);

// Update appointment
router.patch(
    '/:id',
    validate(appointmentValidation.updateAppointment),
    updateAppointment
);

// Update appointment status
router.patch(
    '/:id/status',
    validate(appointmentValidation.updateStatus),
    updateAppointmentStatus
);

// Delete appointment
router.delete(
    '/:id',
    validate(appointmentValidation.deleteAppointment),
    deleteAppointment
);

export default router; 