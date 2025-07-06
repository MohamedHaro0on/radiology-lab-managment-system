import express from 'express';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';
import { autoCheckPrivileges } from '../middleware/privilege.js';
import { patientHistoryValidation } from '../validations/patientHistoryValidation.js';
import * as patientHistoryController from '../controllers/patientHistoryController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Apply auto privilege checking middleware
router.use(autoCheckPrivileges);

// Create new patient history
router.post(
    '/',
    validate(patientHistoryValidation.createPatientHistory),
    patientHistoryController.createPatientHistory
);

// Get all patient histories
router.get(
    '/',
    validate(patientHistoryValidation.getAllPatientHistories),
    patientHistoryController.getAllPatientHistories
);

// Get patient history by patient ID
router.get(
    '/patient/:patientId',
    patientHistoryController.getPatientHistoryByPatientId
);

// Get single patient history
router.get(
    '/:id',
    validate(patientHistoryValidation.getPatientHistoryById),
    patientHistoryController.getPatientHistoryById
);

// Update patient history
router.patch(
    '/:id',
    validate(patientHistoryValidation.updatePatientHistory),
    patientHistoryController.updatePatientHistory
);

// Delete patient history
router.delete(
    '/:id',
    validate(patientHistoryValidation.deletePatientHistory),
    patientHistoryController.deletePatientHistory
);

export default router; 