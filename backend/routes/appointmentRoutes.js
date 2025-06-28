import express from 'express';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';
import { autoCheckPrivileges } from '../middleware/privilege.js';
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
import { checkPrivilege } from '../middleware/privilege.js';

const router = express.Router();

// Apply authentication middleware
router.use(auth);

// Apply auto privilege checking middleware
router.use(autoCheckPrivileges);

// Create new appointment
router.post(
    '/',
    validateAppointmentBody(createAppointmentSchema),
    appointmentController.createAppointment
);

// Get all appointments
router.get(
    '/',
    validateAppointmentQuery,
    appointmentController.getAllAppointments
);

// Get appointments by date range
router.get(
    '/date-range',
    validateAppointmentQuery,
    appointmentController.getAppointmentsByDateRange
);

// Get single appointment
router.get(
    '/:id',
    validateAppointmentParams,
    appointmentController.getAppointment
);

// Update appointment
router.patch(
    '/:id',
    validateAppointmentParams,
    validateAppointmentBody(updateAppointmentSchema),
    appointmentController.updateAppointment
);

// Update appointment status
router.patch(
    '/:id/status',
    validateAppointmentParams,
    validateAppointmentBody(updateAppointmentStatusSchema),
    appointmentController.updateAppointmentStatus
);

// Delete appointment
router.delete(
    '/:id',
    validateAppointmentParams,
    appointmentController.deleteAppointment
);

router.route('/:id/history')
    .get(checkPrivilege('appointments', 'view'), appointmentController.getAppointmentHistory);

export default router; 