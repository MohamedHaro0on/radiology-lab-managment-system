import express from 'express';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';
import { checkPrivilege, autoCheckPrivileges } from '../middleware/privilege.js';
import { radiologistValidation } from '../validations/radiologistValidation.js';
import * as radiologistController from '../controllers/radiologistController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Apply auto privilege checking middleware
router.use(autoCheckPrivileges);

// Get all radiologists
router.get(
    '/',
    checkPrivilege('radiologists', 'view'),
    validate(radiologistValidation.search),
    radiologistController.getRadiologists
);

// Get single radiologist
router.get(
    '/:id',
    checkPrivilege('radiologists', 'view'),
    validate(radiologistValidation.getById),
    radiologistController.getRadiologist
);

// Create new radiologist
router.post(
    '/',
    checkPrivilege('radiologists', 'create'),
    validate(radiologistValidation.create),
    radiologistController.createRadiologist
);

// Update radiologist
router.put(
    '/:id',
    checkPrivilege('radiologists', 'update'),
    validate(radiologistValidation.update),
    radiologistController.updateRadiologist
);

// Delete radiologist
router.delete(
    '/:id',
    checkPrivilege('radiologists', 'delete'),
    validate(radiologistValidation.delete),
    radiologistController.deleteRadiologist
);

// Get radiologist statistics
router.get(
    '/stats',
    checkPrivilege('radiologists', 'view'),
    radiologistController.getRadiologistStats
);

export default router; 