import { StatusCodes } from 'http-status-codes';
import Joi from 'joi';
import mongoose from 'mongoose';
import { errors } from '../utils/errorHandler.js';

// Custom error handler middleware
export const errorHandler = (err, req, res, next) => {

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            status: 'error',
            message: 'Invalid token. Please log in again'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            status: 'error',
            message: 'Token expired. Please log in again'
        });
    }

    // Handle Joi validation errors
    if (err instanceof Joi.ValidationError) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            status: 'error',
            message: 'Validation error',
            errors: err.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }))
        });
    }

    // Handle Mongoose validation errors
    if (err instanceof mongoose.Error.ValidationError) {
        const validationErrors = Object.values(err.errors).map(error => ({
            field: error.path,
            message: error.message
        }));

        return res.status(StatusCodes.BAD_REQUEST).json({
            status: 'error',
            message: 'Validation error',
            errors: validationErrors
        });
    }

    // Handle Mongoose duplicate key errors
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(StatusCodes.CONFLICT).json({
            status: 'error',
            message: `Duplicate value for ${field}. Please use another value.`
        });
    }

    // Handle custom API errors
    if (err instanceof errors.ApiError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
            ...(err.errors && { errors: err.errors })
        });
    }

    // Handle rate limiter errors
    if (err.type === 'entity.too.large') {
        return res.status(StatusCodes.REQUEST_TOO_LONG).json({
            status: 'error',
            message: 'Request entity too large'
        });
    }

    // Handle multer errors
    if (err.name === 'MulterError') {
        return res.status(StatusCodes.BAD_REQUEST).json({
            status: 'error',
            message: `File upload error: ${err.message}`
        });
    }

    // Default error
    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = err.message || 'Something went wrong';

    res.status(statusCode).json({
        status: 'error',
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}; 