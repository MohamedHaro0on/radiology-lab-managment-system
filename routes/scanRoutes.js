import express from 'express';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';
import { checkPrivilege, autoCheckPrivileges } from '../middleware/privilege.js';
import { scanValidation } from '../validations/scanValidation.js';
import * as scanController from '../controllers/scanController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Apply auto privilege checking middleware
router.use(autoCheckPrivileges);

// Get all scans
router.get(
    '/',
    checkPrivilege('scans', 'view'),
    validate(scanValidation.search),
    scanController.getAllScans
);

// Get single scan
router.get(
    '/:id',
    checkPrivilege('scans', 'view'),
    validate(scanValidation.getById),
    scanController.getScan
);

// Create new scan
router.post(
    '/',
    checkPrivilege('scans', 'create'),
    validate(scanValidation.create),
    scanController.createScan
);

// Update scan
router.put(
    '/:id',
    checkPrivilege('scans', 'update'),
    validate(scanValidation.update),
    scanController.updateScan
);

// Delete scan
router.delete(
    '/:id',
    checkPrivilege('scans', 'delete'),
    validate(scanValidation.delete),
    scanController.deleteScan
);

// Check stock availability
router.get(
    '/:id/stock-availability',
    checkPrivilege('scans', 'view'),
    validate(scanValidation.getById),
    scanController.checkStockAvailability
);

// Get scans by patient ID
router.get(
    '/patient/:patientId',
    checkPrivilege('scans', 'view'),
    validate(scanValidation.getByPatientId),
    scanController.getScansByPatient
);

// Get scans by doctor ID
router.get(
    '/doctor/:doctorId',
    checkPrivilege('scans', 'view'),
    validate(scanValidation.getByDoctorId),
    scanController.getScansByDoctor
);

// Add image to scan
router.post(
    '/:id/images',
    checkPrivilege('scans', 'update'),
    validate(scanValidation.addImage),
    scanController.addScanImage
);

// Remove image from scan
router.delete(
    '/:id/images/:imageId',
    checkPrivilege('scans', 'update'),
    validate(scanValidation.removeImage),
    scanController.removeScanImage
);

export default router; 