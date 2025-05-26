import express from 'express';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';
import { checkPrivilege, autoCheckPrivileges } from '../middleware/privilege.js';
import { doctorValidation } from '../validations/doctorValidation.js';
import * as doctorController from '../controllers/doctorController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Apply auto privilege checking middleware
router.use(autoCheckPrivileges);

// Create new doctor
router.post(
    '/',
    checkPrivilege('doctors', 'create'),
    validate(doctorValidation.createDoctor),
    doctorController.createDoctor
);

// Get all doctors
router.get(
    '/',
    checkPrivilege('doctors', 'view'),
    validate(doctorValidation.getAllDoctors),
    doctorController.getAllDoctors
);

// Get single doctor
router.get(
    '/:id',
    checkPrivilege('doctors', 'view'),
    validate(doctorValidation.getDoctor),
    doctorController.getDoctor
);

// Update doctor
router.patch(
    '/:id',
    checkPrivilege('doctors', 'update'),
    validate(doctorValidation.updateDoctor),
    doctorController.updateDoctor
);

// Delete doctor
router.delete(
    '/:id',
    checkPrivilege('doctors', 'delete'),
    validate(doctorValidation.deleteDoctor),
    doctorController.deleteDoctor
);

// Get top referring doctors
router.get(
    '/stats/top-referring',
    checkPrivilege('doctors', 'view'),
    validate(doctorValidation.getTopReferringDoctors),
    doctorController.getTopReferringDoctors
);

// Update doctor availability
router.patch(
    '/:id/availability',
    checkPrivilege('doctors', 'update'),
    validate(doctorValidation.updateAvailability),
    doctorController.updateAvailability
);

// Get doctor schedule
router.get(
    '/:id/schedule',
    checkPrivilege('doctors', 'view'),
    validate(doctorValidation.getDoctorSchedule),
    doctorController.getDoctorSchedule
);

export default router; 