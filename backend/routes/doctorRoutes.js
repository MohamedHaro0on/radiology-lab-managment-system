import express from 'express';
import { validate } from '../middleware/validate.js';
// import { auth } from '../middleware/auth.js'; // Temporarily disabled
import { doctorValidation } from '../validations/doctorValidation.js';
import {
    validateDoctorBody,
    validateDoctorParams,
    createDoctorSchema,
    updateDoctorSchema
} from '../validations/doctorValidation.js';
import * as doctorController from '../controllers/doctorController.js';

const router = express.Router();

// Apply authentication middleware to all routes
// router.use(auth);

// Create new doctor
router.post('/', validateDoctorBody(createDoctorSchema), doctorController.createDoctor);

// Get all doctors
router.get('/', doctorController.getAllDoctors);

// Get single doctor
router.get('/:id', validateDoctorParams, doctorController.getDoctor);

// Update doctor
router.put('/:id', validateDoctorParams, validateDoctorBody(updateDoctorSchema), doctorController.updateDoctor);

// Delete doctor
router.delete('/:id', validateDoctorParams, doctorController.deleteDoctor);

// Get top referring doctors
router.get(
    '/stats/top-referring',
    validate(doctorValidation.getTopReferringDoctors),
    doctorController.getTopReferringDoctors
);

// Update doctor availability
router.patch(
    '/:id/availability',
    validate(doctorValidation.updateAvailability),
    doctorController.updateAvailability
);

// Get doctor schedule
router.get(
    '/:id/schedule',
    validate(doctorValidation.getDoctorSchedule),
    doctorController.getDoctorSchedule
);

export default router; 