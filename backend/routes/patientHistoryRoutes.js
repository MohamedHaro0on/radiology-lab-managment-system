import express from 'express';
import { validate } from '../middleware/validate.js';
// import { auth } from '../middleware/auth.js'; // Temporarily disabled
// import { checkPrivilege, autoCheckPrivileges } from '../middleware/privilege.js'; // Temporarily disabled
import { patientHistoryValidation } from '../validations/patientHistoryValidation.js';
import * as patientHistoryController from '../controllers/patientHistoryController.js';

const router = express.Router();

// Apply auth middleware to all routes (temporarily disabled)
// router.use(auth);

// Apply auto privilege checking middleware (temporarily disabled)
// router.use(autoCheckPrivileges);

// Create new patient history
router.post(
    '/',
    // checkPrivilege('patientHistory', 'create'), // Temporarily disabled
    validate(patientHistoryValidation.createPatientHistory),
    patientHistoryController.createPatientHistory
);

// Get all patient histories
router.get(
    '/',
    // checkPrivilege('patientHistory', 'view'), // Temporarily disabled
    validate(patientHistoryValidation.getAllPatientHistories),
    patientHistoryController.getAllPatientHistories
);

// Get single patient history
router.get(
    '/:id',
    // checkPrivilege('patientHistory', 'view'), // Temporarily disabled
    validate(patientHistoryValidation.getPatientHistoryById),
    patientHistoryController.getPatientHistoryById
);

// Update patient history
router.patch(
    '/:id',
    // checkPrivilege('patientHistory', 'update'), // Temporarily disabled
    validate(patientHistoryValidation.updatePatientHistory),
    patientHistoryController.updatePatientHistory
);

// Delete patient history
router.delete(
    '/:id',
    // checkPrivilege('patientHistory', 'delete'), // Temporarily disabled
    validate(patientHistoryValidation.deletePatientHistory),
    patientHistoryController.deletePatientHistory
);

export default router; 