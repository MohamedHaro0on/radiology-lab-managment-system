import rateLimit from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';
import { errors } from '../utils/errorHandler.js';

// Custom error handler for rate limiters
const rateLimitHandler = (req, res, next) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
        status: 'error',
        message: 'Too many requests, please try again later'
    });
};

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: rateLimitHandler
});

// Stricter limiter for auth routes
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler
});

// Password reset limiter
export const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Greatly increased limit to effectively disable for testing
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    message: 'Too many password reset attempts. Please try again in 15 minutes.'
});

// 2FA verification limiter
export const twoFactorLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler
}); 