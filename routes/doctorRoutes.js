import express from 'express';
import { validate } from '../middleware/validate.js';
import { auth, authorize } from '../middleware/auth.js';
import doctorValidation from '../validations/doctorValidation.js';
import {
    createDoctor,
    getAllDoctors,
    getDoctor,
    updateDoctor,
    deleteDoctor,
    getTopReferringDoctors
} from '../controllers/doctorController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Create doctor (admin only)
router.post(
    '/',
    authorize(['admin']),
    validate(doctorValidation.createDoctor),
    createDoctor
);

// Get all doctors
router.get(
    '/',
    validate(doctorValidation.listDoctors),
    getAllDoctors
);

// Get top referring doctors
router.get(
    '/top',
    validate(doctorValidation.listDoctors),
    getTopReferringDoctors
);

// Get single doctor
router.get(
    '/:id',
    validate(doctorValidation.getDoctor),
    getDoctor
);

// Update doctor (admin only)
router.put(
    '/:id',
    authorize(['admin']),
    validate(doctorValidation.updateDoctor),
    updateDoctor
);

// Delete doctor (admin only)
router.delete(
    '/:id',
    authorize(['admin']),
    validate(doctorValidation.deleteDoctor),
    deleteDoctor
);

export default router; 