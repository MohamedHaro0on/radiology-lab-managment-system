import Joi from 'joi';

// Validation schema for appointment scan items
const appointmentScanSchema = Joi.object({
    scan: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
        .messages({
            'string.pattern.base': 'Invalid scan ID format',
            'any.required': 'Scan is required'
        }),
    quantity: Joi.number().integer().min(1).default(1)
        .messages({
            'number.base': 'Quantity must be a number',
            'number.integer': 'Quantity must be an integer',
            'number.min': 'Quantity must be at least 1'
        })
});

// Validation schema for creating appointment
export const createAppointmentSchema = Joi.object({
    radiologistId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
        .messages({
            'string.pattern.base': 'Invalid radiologist ID format',
            'any.required': 'Radiologist is required'
        }),
    patientId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
        .messages({
            'string.pattern.base': 'Invalid patient ID format',
            'any.required': 'Patient is required'
        }),
    scans: Joi.array().items(appointmentScanSchema).min(1).required()
        .messages({
            'array.min': 'At least one scan is required',
            'any.required': 'Scans are required'
        }),
    referredBy: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
        .messages({
            'string.pattern.base': 'Invalid doctor ID format',
            'any.required': 'Referring doctor is required'
        }),
    scheduledAt: Joi.date().greater('now').required()
        .messages({
            'date.base': 'Scheduled time must be a valid date',
            'date.greater': 'Scheduled time must be in the future',
            'any.required': 'Scheduled time is required'
        }),
    notes: Joi.string().trim().max(1000).optional()
        .messages({
            'string.max': 'Notes cannot exceed 1000 characters'
        })
});

// Validation schema for updating appointment
export const updateAppointmentSchema = Joi.object({
    radiologistId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    patientId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    scans: Joi.array().items(appointmentScanSchema).min(1).optional(),
    referredBy: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    scheduledAt: Joi.date().greater('now').optional(),
    notes: Joi.string().trim().max(1000).optional()
});

// Validation schema for appointment ID parameter
export const appointmentIdSchema = Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
        .messages({
            'string.pattern.base': 'Invalid appointment ID format',
            'any.required': 'Appointment ID is required'
        })
});

// Validation schema for appointment query parameters
export const appointmentQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().optional(),
    status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show').optional(),
    patientId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    radiologistId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    doctorId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    sortBy: Joi.string().valid('scheduledAt', 'status', 'createdAt').default('scheduledAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
});

// Validation schema for appointment status update
export const updateAppointmentStatusSchema = Joi.object({
    status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show').required()
        .messages({
            'any.only': 'Invalid appointment status',
            'any.required': 'Status is required'
        }),
    notes: Joi.string().trim().max(1000).optional()
});

// Validation schema for appointment cancellation
export const cancelAppointmentSchema = Joi.object({
    cancellationReason: Joi.string().trim().max(500).required()
        .messages({
            'string.empty': 'Cancellation reason is required',
            'string.max': 'Cancellation reason cannot exceed 500 characters',
            'any.required': 'Cancellation reason is required'
        })
});

// Middleware to validate request body
export const validateAppointmentBody = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }

        req.body = value;
        next();
    };
};

// Middleware to validate request parameters
export const validateAppointmentParams = (req, res, next) => {
    const { error, value } = appointmentIdSchema.validate(req.params, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }))
        });
    }

    req.params = value;
    next();
};

// Middleware to validate query parameters
export const validateAppointmentQuery = (req, res, next) => {
    const { error, value } = appointmentQuerySchema.validate(req.query, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }))
        });
    }

    req.query = value;
    next();
};

// Export all validation schemas and middleware as an object
export const appointmentValidation = {
    createAppointmentSchema,
    updateAppointmentSchema,
    appointmentIdSchema,
    appointmentQuerySchema,
    updateAppointmentStatusSchema,
    cancelAppointmentSchema,
    validateAppointmentBody,
    validateAppointmentParams,
    validateAppointmentQuery
};

export default appointmentValidation; 