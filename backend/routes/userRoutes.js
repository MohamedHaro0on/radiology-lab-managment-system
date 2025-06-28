import express from 'express';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';
import { checkPrivilege, autoCheckPrivileges } from '../middleware/privilege.js';
import { userValidation } from '../validations/userValidation.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Apply auto privilege checking middleware
router.use(autoCheckPrivileges);

// Get all users (super admin only)
router.get(
    '/',
    checkPrivilege('users', 'view'),
    validate(userValidation.getAllUsers),
    userController.getAllUsers
);

// Get single user
router.get(
    '/:id',
    checkPrivilege('users', 'view'),
    validate(userValidation.getUser),
    userController.getUser
);

// Update user
router.patch(
    '/:id',
    checkPrivilege('users', 'update'),
    validate(userValidation.updateUser),
    userController.updateUser
);

// Delete user
router.delete(
    '/:id',
    checkPrivilege('users', 'delete'),
    validate(userValidation.deleteUser),
    userController.deleteUser
);

// Grant privileges (super admin only)
router.post(
    '/:id/privileges',
    checkPrivilege('users', 'update'), // Or a more specific privilege
    validate(userValidation.grantPrivileges),
    userController.grantPrivileges
);

// Revoke privileges (super admin only)
router.delete(
    '/:id/privileges',
    checkPrivilege('users', 'update'), // Or a more specific privilege
    validate(userValidation.revokePrivileges),
    userController.revokePrivileges
);

export default router; 