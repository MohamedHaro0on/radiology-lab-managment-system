import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import { errors } from '../utils/errorHandler.js';
import User from '../models/User.js';
import { MODULES } from '../config/privileges.js';

// Authentication middleware
export const auth = asyncHandler(async (req, res, next) => {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        throw errors.Unauthorized('No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists and is active
        const user = await User.findById(decoded.id)
            .select('+passwordChangedAt +privileges')
            .populate('privileges.grantedBy', 'username email');

        if (!user) {
            throw errors.Unauthorized('User no longer exists');
        }

        if (!user.isActive) {
            throw errors.Forbidden('Account is inactive');
        }

        // Check if user changed password after token was issued
        if (user.changedPasswordAfter(decoded.iat)) {
            throw errors.Unauthorized('User recently changed password. Please log in again');
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw errors.Unauthorized('Invalid token. Please log in again');
        } else if (error.name === 'TokenExpiredError') {
            throw errors.Unauthorized('Token expired. Please log in again');
        }
        throw error;
    }
});

// Middleware to check if user is super admin
export const isSuperAdmin = asyncHandler(async (req, res, next) => {
    if (!req.user?.isSuperAdmin) {
        throw errors.Forbidden('Access denied. Super admin privileges required.');
    }
    next();
});

// Helper function to get module from path
export const getModuleFromPath = (path) => {
    const pathParts = path.split('/');
    if (pathParts.length < 3) return null;

    const module = pathParts[2].replace(/^api-/, '').replace(/s$/, '');
    return Object.keys(MODULES).includes(module) ? module : null;
};

// Refresh token middleware
export const refreshToken = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw errors.BadRequest('Refresh token is required');
    }

    try {
        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Check if user still exists and is active
        const user = await User.findOne({ _id: decoded.id, isActive: true });
        if (!user) {
            throw errors.Unauthorized('User not found or inactive');
        }

        // Generate new access token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        req.token = token;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw errors.Unauthorized('Refresh token has expired');
        }
        throw errors.Unauthorized('Invalid refresh token');
    }
}); 