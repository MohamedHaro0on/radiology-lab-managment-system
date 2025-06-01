import express from 'express';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';
import { checkPrivilege, autoCheckPrivileges } from '../middleware/privilege.js';
import { patientValidation } from '../validations/patientValidation.js';
import * as patientController from '../controllers/patientController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Apply auto privilege checking middleware
router.use(autoCheckPrivileges);

// Create new patient
router.post(
    '/',
    checkPrivilege('patients', 'create'),
    validate(patientValidation.createPatient),
    patientController.createPatient
);

// Get all patients
router.get(
    '/',
    checkPrivilege('patients', 'view'),
    validate(patientValidation.getAllPatients),
    patientController.getAllPatients
);

// Get single patient
router.get(
    '/:id',
    checkPrivilege('patients', 'view'),
    validate(patientValidation.getPatient),
    patientController.getPatient
);

// Update patient
router.patch(
    '/:id',
    checkPrivilege('patients', 'update'),
    validate(patientValidation.updatePatient),
    patientController.updatePatient
);

// Delete patient
router.delete(
    '/:id',
    checkPrivilege('patients', 'delete'),
    validate(patientValidation.deletePatient),
    patientController.deletePatient
);

export default router; 