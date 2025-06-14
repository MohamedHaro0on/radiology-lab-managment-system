import express from 'express';
// import { auth } from '../middleware/auth.js'; // Temporarily disabled
import {
    validatePatientBody,
    validatePatientParams,
    validatePatientQuery,
    createPatientSchema,
    updatePatientSchema
} from '../validations/patientValidation.js';
import { paginate } from '../middleware/pagination.js';
import * as patientController from '../controllers/patientController.js';
import Joi from 'joi';

const router = express.Router();

// Apply authentication middleware to all routes
// router.use(auth);

// Create new patient
router.post('/', validatePatientBody(createPatientSchema), patientController.createPatient);

// Get all patients with pagination and filtering
router.get('/', paginate({
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    doctorReferred: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional()
}), patientController.getAllPatients);

// Get single patient
router.get('/:id', validatePatientParams, patientController.getPatient);

// Update patient
router.put('/:id', validatePatientParams, validatePatientBody(updatePatientSchema), patientController.updatePatient);

// Delete patient
router.delete('/:id', validatePatientParams, patientController.deletePatient);

export default router; 