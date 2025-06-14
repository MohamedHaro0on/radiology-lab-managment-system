import express from 'express';
import { validate } from '../middleware/validate.js';
// import { auth } from '../middleware/auth.js'; // Temporarily disabled
// import { checkPrivilege, autoCheckPrivileges } from '../middleware/privilege.js'; // Temporarily disabled
import { radiologistValidation } from '../validations/radiologistValidation.js';
import * as radiologistController from '../controllers/radiologistController.js';

const router = express.Router();

// Apply auth middleware to all routes (temporarily disabled)
// router.use(auth);

// Apply auto privilege checking middleware (temporarily disabled)
// router.use(autoCheckPrivileges);

// Get all radiologists
router.get(
    '/',
    // checkPrivilege('radiologists', 'view'), // Temporarily disabled
    validate(radiologistValidation.search),
    radiologistController.getRadiologists
);

// Get single radiologist
router.get(
    '/:id',
    // checkPrivilege('radiologists', 'view'), // Temporarily disabled
    validate(radiologistValidation.getById),
    radiologistController.getRadiologist
);

// Create new radiologist
router.post(
    '/',
    // checkPrivilege('radiologists', 'create'), // Temporarily disabled
    validate(radiologistValidation.create),
    radiologistController.createRadiologist
);

// Update radiologist
router.put(
    '/:id',
    // checkPrivilege('radiologists', 'update'), // Temporarily disabled
    validate(radiologistValidation.update),
    radiologistController.updateRadiologist
);

// Delete radiologist
router.delete(
    '/:id',
    // checkPrivilege('radiologists', 'delete'), // Temporarily disabled
    validate(radiologistValidation.delete),
    radiologistController.deleteRadiologist
);

// Get radiologist statistics
router.get(
    '/stats',
    // checkPrivilege('radiologists', 'view'), // Temporarily disabled
    radiologistController.getRadiologistStats
);

export default router; 