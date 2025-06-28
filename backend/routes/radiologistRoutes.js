import express from 'express';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js'; // Temporarily disabled
import { autoCheckPrivileges } from '../middleware/privilege.js'; // Temporarily disabled
import { radiologistValidation } from '../validations/radiologistValidation.js';
import * as radiologistController from '../controllers/radiologistController.js';

const router = express.Router();

// Apply auth middleware to all routes (temporarily disabled)
router.use(auth);

// Apply auto privilege checking middleware (temporarily disabled)
router.use(autoCheckPrivileges);

// Get all radiologists
router.get(
    '/',
    validate(radiologistValidation.search),
    radiologistController.getRadiologists
);

// Get single radiologist
router.get(
    '/:id',
    validate(radiologistValidation.getById),
    radiologistController.getRadiologist
);

// Create new radiologist
router.post(
    '/',
    validate(radiologistValidation.create),
    radiologistController.createRadiologist
);

// Update radiologist
router.put(
    '/:id',
    validate(radiologistValidation.update),
    radiologistController.updateRadiologist
);

// Delete radiologist
router.delete(
    '/:id',
    validate(radiologistValidation.delete),
    radiologistController.deleteRadiologist
);

// Get radiologist statistics
router.get(
    '/stats',
    radiologistController.getRadiologistStats
);

export default router; 