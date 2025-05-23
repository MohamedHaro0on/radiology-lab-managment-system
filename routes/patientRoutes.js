import express from 'express';
import { auth, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
    createPatient,
    getAllPatients,
    getPatient,
    updatePatient,
    deletePatient
} from '../controllers/patientController.js';
import { patientValidation } from '../validations/patientValidation.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Patient CRUD routes
router.post(
    '/',
    authorize(['admin', 'manager']),
    validate(patientValidation.createPatient),
    createPatient
);

router.get(
    '/',
    authorize(['admin', 'manager', 'doctor', 'staff']),
    validate(patientValidation.getAllPatients),
    getAllPatients
);

router.get(
    '/:id',
    authorize(['admin', 'manager', 'doctor', 'staff']),
    validate(patientValidation.getPatient),
    getPatient
);

router.patch(
    '/:id',
    authorize(['admin', 'manager']),
    validate(patientValidation.updatePatient),
    updatePatient
);

router.delete(
    '/:id',
    authorize(['admin']),
    validate(patientValidation.deletePatient),
    deletePatient
);

export default router; 