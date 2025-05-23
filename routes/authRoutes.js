import express from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { auth, authorize } from '../middleware/auth.js';
import {
    register,
    login,
    setupTwoFactor,
    verifyTwoFactor,
    getProfile,
    updateProfile,
    getAllUsers,
    getUserById
} from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/login', validate(schemas.userLogin), login);

// Public (for testing) – register endpoint (no auth)
router.post('/register', auth, validate(schemas.userCreate), register);

router.get('/profile', auth, getProfile);
router.patch('/profile', auth, updateProfile);

// 2FA routes
router.post('/2fa/setup', auth, setupTwoFactor);
router.post('/2fa/verify', auth, verifyTwoFactor);

// Admin-only user management routes
router.get('/users', auth, authorize('admin'), getAllUsers);
router.get('/users/:id', auth, authorize('admin'), getUserById);

export default router; 