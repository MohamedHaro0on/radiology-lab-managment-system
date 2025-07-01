import Joi from 'joi';

// Validation schema for creating patient
export const createPatientSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required()
        .messages({
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters'
        }),
    dateOfBirth: Joi.date().max('now').required()
        .messages({
            'date.base': 'Date of birth must be a valid date',
            'date.max': 'Date of birth cannot be in the future',
            'any.required': 'Date of birth is required'
        }),
    gender: Joi.string().valid('male', 'female', 'other').required()
        .messages({
            'any.only': 'Gender must be male, female, or other',
            'any.required': 'Gender is required'
        }),
    phoneNumber: Joi.string().pattern(/^(|\+20\d{10})$/).optional().allow('')
        .messages({
            'string.pattern.base': 'Phone number must be in the format +20 followed by 10 digits.'
        }),
    socialNumber: Joi.string().trim().min(5).max(20).optional()
        .messages({
            'string.min': 'Social number must be at least 5 characters long',
            'string.max': 'Social number cannot exceed 20 characters'
        }),
    doctorReferred: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
        .messages({
            'string.pattern.base': 'Invalid doctor ID format',
            'any.required': 'Doctor referral is required'
        }),
    medicalHistory: Joi.array().items(Joi.string().trim()).default([])
        .messages({
            'array.base': 'Medical history must be an array'
        }),
    address: Joi.object({
        street: Joi.string().trim().optional().allow(''),
        city: Joi.string().trim().optional().allow(''),
        state: Joi.string().trim().optional().allow(''),
        postalCode: Joi.string().trim().optional().allow(''),
        country: Joi.string().trim().default('India')
    }).optional()
});

// Validation schema for updating patient
export const updatePatientSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    dateOfBirth: Joi.date().max('now').optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    phoneNumber: Joi.string().pattern(/^(|\+20\d{10})$/).optional().allow('')
        .messages({
            'string.pattern.base': 'Phone number must be in the format +20 followed by 10 digits.'
        }),
    socialNumber: Joi.string().trim().min(5).max(20).optional(),
    doctorReferred: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    medicalHistory: Joi.array().items(Joi.string().trim()).optional(),
    address: Joi.object({
        street: Joi.string().trim().optional().allow(''),
        city: Joi.string().trim().optional().allow(''),
        state: Joi.string().trim().optional().allow(''),
        postalCode: Joi.string().trim().optional().allow(''),
        country: Joi.string().trim().optional()
    }).optional()
});

// Validation schema for patient ID parameter
export const patientIdSchema = Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
        .messages({
            'string.pattern.base': 'Invalid patient ID format',
            'any.required': 'Patient ID is required'
        })
});

// Validation schema for patient query parameters
export const patientQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    doctorId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
    sortBy: Joi.string().valid('name', 'dateOfBirth', 'createdAt', 'updatedAt').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Middleware to validate request body
export const validatePatientBody = (schema) => {
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
export const validatePatientParams = (req, res, next) => {
    const { error, value } = patientIdSchema.validate(req.params, { abortEarly: false });

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
export const validatePatientQuery = (req, res, next) => {
    const { error, value } = patientQuerySchema.validate(req.query, { abortEarly: false });

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

// Legacy validation schemas (keeping for backward compatibility)
export const patientValidation = {
    createPatient: {
        body: createPatientSchema
    },
    getAllPatients: {
        query: patientQuerySchema
    },
    getPatient: {
        params: patientIdSchema
    },
    updatePatient: {
        params: patientIdSchema,
        body: updatePatientSchema
    },
    deletePatient: {
        params: patientIdSchema
    }
};

export default {
    patientValidation,
    createPatientSchema,
    updatePatientSchema,
    patientIdSchema,
    patientQuerySchema,
    validatePatientBody,
    validatePatientParams,
    validatePatientQuery
}; 