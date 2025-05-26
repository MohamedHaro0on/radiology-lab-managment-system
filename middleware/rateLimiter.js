import rateLimit from 'express-rate-limit';
import { errors } from '../utils/errorHandler.js';

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    handler: (req, res) => {
        throw errors.TooManyRequests('Too many requests from this IP, please try again later');
    }
});

// Stricter limiter for auth routes
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later',
    handler: (req, res) => {
        throw errors.TooManyRequests('Too many authentication attempts, please try again later');
    }
});

// Password reset limiter
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 requests per windowMs
    message: 'Too many password reset attempts, please try again later',
    handler: (req, res) => {
        throw errors.TooManyRequests('Too many password reset attempts, please try again later');
    }
});

// 2FA verification limiter
export const twoFactorLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many 2FA verification attempts, please try again later',
    handler: (req, res) => {
        throw errors.TooManyRequests('Too many 2FA verification attempts, please try again later');
    }
}); 