import express from 'express';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';
import { checkPrivilege } from '../middleware/privilege.js';
import * as auditController from '../controllers/auditController.js';
import Joi from 'joi';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Validation schemas
const auditQuerySchema = {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('createdAt', 'action', 'user').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    action: Joi.string().valid('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', '').optional().allow(''),
    userId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow(''),
    startDate: Joi.string().optional().allow(''),
    endDate: Joi.string().optional().allow('')
};

const auditStatsQuerySchema = {
    startDate: Joi.string().optional().allow(''),
    endDate: Joi.string().optional().allow('')
};

// Get appointment audit logs (super admin only)
router.get(
    '/appointments',
    checkPrivilege('appointments', 'view'),
    validate({ query: Joi.object(auditQuerySchema) }),
    auditController.getAppointmentAuditLogs
);

// Get audit statistics (super admin only)
router.get(
    '/stats',
    checkPrivilege('appointments', 'view'),
    validate({ query: Joi.object(auditStatsQuerySchema) }),
    auditController.getAuditStats
);

export default router; 