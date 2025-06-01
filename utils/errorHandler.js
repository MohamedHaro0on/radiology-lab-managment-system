import { StatusCodes } from 'http-status-codes';

// Custom error classes
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Predefined errors
export const errors = {
    BadRequest: (message) => new AppError(message, StatusCodes.BAD_REQUEST),
    Unauthorized: (message) => new AppError(message, StatusCodes.UNAUTHORIZED),
    Forbidden: (message) => new AppError(message, StatusCodes.FORBIDDEN),
    NotFound: (message) => new AppError(message, StatusCodes.NOT_FOUND),
    Conflict: (message) => new AppError(message, StatusCodes.CONFLICT),
    ValidationError: (message) => new AppError(message, StatusCodes.UNPROCESSABLE_ENTITY),
    InternalServerError: (message) => new AppError(message, StatusCodes.INTERNAL_SERVER_ERROR),
    ServiceUnavailable: (message) => new AppError(message, StatusCodes.SERVICE_UNAVAILABLE)
};

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    err.status = err.status || 'error';

    // Development error response
    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
        return;
    }

    // Production error response
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
        return;
    }

    // Programming or unknown errors
    console.error('ERROR 💥', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Something went wrong'
    });
};

// Handle specific error types
export const handleSpecificErrors = (err) => {
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(el => el.message);
        return errors.ValidationError(`Invalid input data. ${errors.join('. ')}`);
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return errors.Conflict(`Duplicate field value: ${field}. Please use another value`);
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return errors.BadRequest(`Invalid ${err.path}: ${err.value}`);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return errors.Unauthorized('Invalid token. Please log in again');
    }
    if (err.name === 'TokenExpiredError') {
        return errors.Unauthorized('Your token has expired. Please log in again');
    }

    return err;
}; 