import express from 'express';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';
import { checkPrivilege, autoCheckPrivileges } from '../middleware/privilege.js';
import { authValidation } from '../validations/authValidation.js';
import * as authController from '../controllers/authController.js';
import {
    authLimiter,
    passwordResetLimiter,
    twoFactorLimiter
} from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes with rate limiting
router.post('/register',
    authLimiter,
    validate(authValidation.register),
    authController.register
);

router.post('/login',
    authLimiter,
    validate(authValidation.login),
    authController.login
);

router.post('/refresh-token',
    authLimiter,
    validate(authValidation.refreshToken),
    authController.refreshToken
);

router.post('/forgot-password',
    passwordResetLimiter,
    validate(authValidation.forgotPassword),
    authController.forgotPassword
);

router.post('/reset-password',
    passwordResetLimiter,
    validate(authValidation.resetPassword),
    authController.resetPassword
);

router.post('/verify-email',
    authLimiter,
    validate(authValidation.verifyEmail),
    authController.verifyEmail
);

// Protected routes
router.use(auth);

// Apply auto privilege checking middleware
router.use(autoCheckPrivileges);

// Get current user
router.get('/me', authController.getCurrentUser);

// Update current user
router.patch('/me',
    validate(authValidation.updateProfile),
    authController.updateProfile
);

// Change password
router.post('/change-password',
    validate(authValidation.changePassword),
    authController.changePassword
);

// 2FA routes with rate limiting
router.post('/2fa/enable',
    validate(authValidation.enable2FA),
    authController.enable2FA
);

router.post('/2fa/disable',
    validate(authValidation.disable2FA),
    authController.disable2FA
);

router.post('/2fa/verify',
    twoFactorLimiter,
    validate(authValidation.verify2FA),
    authController.verify2FA
);

// User management routes (super admin only)
router.get(
    '/users',
    checkPrivilege('users', 'view'),
    validate(authValidation.getAllUsers),
    authController.getAllUsers
);

router.get(
    '/users/:id',
    checkPrivilege('users', 'view'),
    validate(authValidation.getUserById),
    authController.getUserById
);

router.patch(
    '/users/:id',
    checkPrivilege('users', 'update'),
    validate(authValidation.updateUser),
    authController.updateUser
);

router.delete(
    '/users/:id',
    checkPrivilege('users', 'delete'),
    validate(authValidation.deleteUser),
    authController.deleteUser
);

router.post('/logout', authController.logout);

export default router; 