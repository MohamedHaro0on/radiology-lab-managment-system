import express from 'express';
import { validate } from '../middleware/validate.js';
// import { auth } from '../middleware/auth.js'; // Temporarily disabled
// import { checkPrivilege, autoCheckPrivileges } from '../middleware/privilege.js'; // Temporarily disabled
import { appointmentValidation } from '../validations/appointmentValidation.js';
import {
    createAppointmentSchema,
    updateAppointmentSchema,
    appointmentIdSchema,
    appointmentQuerySchema,
    updateAppointmentStatusSchema,
    validateAppointmentBody,
    validateAppointmentParams,
    validateAppointmentQuery
} from '../validations/appointmentValidation.js';
import * as appointmentController from '../controllers/appointmentController.js';

const router = express.Router();

// Apply authentication middleware (temporarily disabled)
// router.use(auth);

// Apply auto privilege checking middleware (temporarily disabled)
// router.use(autoCheckPrivileges);

// Create new appointment
router.post(
    '/',
    // checkPrivilege('appointments', 'create'), // Temporarily disabled
    validateAppointmentBody(createAppointmentSchema),
    appointmentController.createAppointment
);

// Get all appointments
router.get(
    '/',
    // checkPrivilege('appointments', 'view'), // Temporarily disabled
    validateAppointmentQuery,
    appointmentController.getAllAppointments
);

// Get appointments by date range
router.get(
    '/date-range',
    // checkPrivilege('appointments', 'view'), // Temporarily disabled
    validateAppointmentQuery,
    appointmentController.getAppointmentsByDateRange
);

// Get single appointment
router.get(
    '/:id',
    // checkPrivilege('appointments', 'view'), // Temporarily disabled
    validateAppointmentParams,
    appointmentController.getAppointment
);

// Update appointment
router.patch(
    '/:id',
    // checkPrivilege('appointments', 'update'), // Temporarily disabled
    validateAppointmentParams,
    validateAppointmentBody(updateAppointmentSchema),
    appointmentController.updateAppointment
);

// Update appointment status
router.patch(
    '/:id/status',
    // checkPrivilege('appointments', 'update'), // Temporarily disabled
    validateAppointmentParams,
    validateAppointmentBody(updateAppointmentStatusSchema),
    appointmentController.updateAppointmentStatus
);

// Delete appointment
router.delete(
    '/:id',
    // checkPrivilege('appointments', 'delete'), // Temporarily disabled
    validateAppointmentParams,
    appointmentController.deleteAppointment
);

export default router; 