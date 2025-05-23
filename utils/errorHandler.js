import { StatusCodes } from 'http-status-codes';

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Common error types
const errors = {
    BadRequest: (message) => new AppError(message, StatusCodes.BAD_REQUEST),
    Unauthorized: (message) => new AppError(message, StatusCodes.UNAUTHORIZED),
    Forbidden: (message) => new AppError(message, StatusCodes.FORBIDDEN),
    NotFound: (message) => new AppError(message, StatusCodes.NOT_FOUND),
    Conflict: (message) => new AppError(message, StatusCodes.CONFLICT),
    InternalServer: (message) => new AppError(message, StatusCodes.INTERNAL_SERVER_ERROR)
};

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        // Production mode
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        } else {
            // Programming or unknown errors
            console.error('ERROR 💥', err);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                message: 'Something went wrong!'
            });
        }
    }
};

export { AppError, errors, errorHandler }; 