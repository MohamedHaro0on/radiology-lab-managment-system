import express from 'express';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';
import { checkPrivilege, autoCheckPrivileges } from '../middleware/privilege.js';
import { appointmentValidation } from '../validations/appointmentValidation.js';
import * as appointmentController from '../controllers/appointmentController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Apply auto privilege checking middleware
router.use(autoCheckPrivileges);

// Create new appointment
router.post(
    '/',
    checkPrivilege('appointments', 'create'),
    validate(appointmentValidation.createAppointment),
    appointmentController.createAppointment
);

// Get all appointments
router.get(
    '/',
    checkPrivilege('appointments', 'view'),
    validate(appointmentValidation.getAllAppointments),
    appointmentController.getAllAppointments
);

// Get appointments by date range
router.get(
    '/date-range',
    checkPrivilege('appointments', 'view'),
    validate(appointmentValidation.getAppointmentsByDateRange),
    appointmentController.getAppointmentsByDateRange
);

// Get single appointment
router.get(
    '/:id',
    checkPrivilege('appointments', 'view'),
    validate(appointmentValidation.getAppointment),
    appointmentController.getAppointment
);

// Update appointment
router.patch(
    '/:id',
    checkPrivilege('appointments', 'update'),
    validate(appointmentValidation.updateAppointment),
    appointmentController.updateAppointment
);

// Update appointment status
router.patch(
    '/:id/status',
    checkPrivilege('appointments', 'update'),
    validate(appointmentValidation.updateAppointmentStatus),
    appointmentController.updateAppointmentStatus
);

// Delete appointment
router.delete(
    '/:id',
    checkPrivilege('appointments', 'delete'),
    validate(appointmentValidation.deleteAppointment),
    appointmentController.deleteAppointment
);

export default router; 