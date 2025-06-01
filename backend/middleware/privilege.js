import asyncHandler from 'express-async-handler';
import { errors } from '../utils/errorHandler.js';
import { MODULES, OPERATIONS, validatePrivilege } from '../config/privileges.js';

// Map API paths to module names
const PATH_TO_MODULE = {
    '/api/patients': 'patients',
    '/api/doctors': 'doctors',
    '/api/appointments': 'appointments',
    '/api/radiologists': 'radiologists',
    '/api/scans': 'scans',
    '/api/stock': 'stock',
    '/api/patient-history': 'patientHistory',
    '/api/users': 'users',
    '/api/privileges': 'users' // Privilege management is part of user management
};

// Middleware to check if user has required privileges
export const checkPrivilege = (module, operation) => {
    if (!MODULES[module]) {
        throw new Error(`Invalid module: ${module}`);
    }
    if (!OPERATIONS.includes(operation)) {
        throw new Error(`Invalid operation: ${operation}`);
    }

    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            throw errors.Unauthorized('Authentication required');
        }

        if (req.user.isSuperAdmin) {
            return next();
        }

        // Ensure user has privileges field
        if (!req.user.privileges) {
            console.error('User privileges not loaded:', {
                userId: req.user._id,
                username: req.user.username
            });
            throw errors.InternalServerError('User privileges not loaded');
        }

        try {
            const hasPrivilege = req.user.hasPrivilege(module, operation);
            if (!hasPrivilege) {
                throw errors.Forbidden(
                    `Access denied. Insufficient privileges for ${operation} operation on ${module} module.`
                );
            }
            next();
        } catch (error) {
            // If it's a validation error from hasPrivilege, convert it to a BadRequest
            if (error.message.startsWith('Invalid module:') || error.message.startsWith('Invalid operation:')) {
                throw errors.BadRequest(error.message);
            }
            // If it's a Forbidden error, pass it through
            if (error.name === 'Forbidden') {
                throw error;
            }
            // Log the actual error for debugging
            console.error('Privilege check error:', {
                userId: req.user._id,
                username: req.user.username,
                module,
                operation,
                error: error.message
            });
            throw errors.InternalServerError(`Error checking privileges: ${error.message}`);
        }
    });
};

// Middleware to automatically check privileges based on request method and path
export const autoCheckPrivileges = asyncHandler(async (req, res, next) => {
    // Skip privilege checks for auth routes
    if (req.path.startsWith('/api/auth')) {
        return next();
    }

    // Get base path (e.g., /api/patients from /api/patients/123)
    const basePath = '/' + req.path.split('/').slice(1, 3).join('/');
    const module = PATH_TO_MODULE[basePath];

    if (!module) {
        return next();
    }

    const operation = {
        GET: 'view',
        POST: 'create',
        PUT: 'update',
        PATCH: 'update',
        DELETE: 'delete'
    }[req.method];

    if (!operation) {
        return next();
    }

    try {
        await checkPrivilege(module, operation)(req, res, next);
    } catch (error) {
        next(error);
    }
}); 