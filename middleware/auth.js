import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import { errors } from '../utils/errorHandler.js';
import User from '../models/User.js';

// Authentication middleware
export const auth = asyncHandler(async (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw errors.Unauthorized('Authentication required: Bearer token missing');
    }
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
        throw errors.Unauthorized('Authentication required: Token missing');
    }
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        throw errors.Unauthorized('Invalid or expired token');
    }
    const user = await User.findOne({ _id: decoded.userId, isActive: true });
    if (!user) {
        throw errors.Unauthorized('User not found or inactive');
    }

    // Check if 2FA is required
    if (user.twoFactorEnabled && !decoded.twoFactorVerified) {
        throw errors.Forbidden('Two-factor authentication required');
    }

    req.user = user;
    req.token = token;
    next();
});

// Role-based access control middleware
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            throw errors.Forbidden('Access denied: Insufficient permissions');
        }
        next();
    };
};


// Refresh token middleware
export const refreshToken = asyncHandler(async (req, res, next) => {
    const token = jwt.sign(
        { userId: req.user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    req.token = token;
    next();
}); 