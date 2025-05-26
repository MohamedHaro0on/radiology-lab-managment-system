import { errors } from '../utils/errorHandler.js';
import { MODULES, OPERATIONS, validatePrivilege } from '../config/privileges.js';
import { getModuleFromPath } from './auth.js';

// Middleware to check if user has required privileges
export const checkPrivilege = (module, operation) => {
    if (!MODULES[module]) {
        throw new Error(`Invalid module: ${module}`);
    }
    if (!OPERATIONS.includes(operation)) {
        throw new Error(`Invalid operation: ${operation}`);
    }

    return (req, res, next) => {
        if (!req.user) {
            throw errors.Unauthorized('Authentication required');
        }

        if (req.user.isSuperAdmin) {
            return next();
        }

        if (!req.user.hasPrivilege(module, operation)) {
            throw errors.Forbidden(
                `Access denied. Insufficient privileges for ${operation} operation on ${module} module.`
            );
        }
        next();
    };
};

// Middleware to automatically check privileges based on request method and path
export const autoCheckPrivileges = (req, res, next) => {
    // Skip privilege checks for auth routes
    if (req.path.startsWith('/api/auth')) {
        return next();
    }

    const module = getModuleFromPath(req.path);
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

    return checkPrivilege(module, operation)(req, res, next);
}; 