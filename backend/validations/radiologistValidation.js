import Joi from 'joi';
import { objectId } from './commonValidation.js';
import { errors } from '../utils/errorHandler.js';

// Validation schemas for radiologists
export const radiologistValidation = {
    // Search/List radiologists
    search: Joi.object({
        query: Joi.string().trim().min(1).messages({
            'string.min': 'Search query must not be empty'
        }),
        isActive: Joi.boolean(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        sort: Joi.string().valid('name', 'age', 'createdAt', '-name', '-age', '-createdAt').default('-createdAt')
    }),

    // Create radiologist
    create: Joi.object({
        name: Joi.string().required().min(2).max(100).messages({
            'any.required': 'Name is required',
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters'
        }),
        gender: Joi.string().valid('male', 'female', 'other').required().messages({
            'any.required': 'Gender is required',
            'any.only': 'Gender must be male, female, or other'
        }),
        age: Joi.number().integer().min(18).max(150).required().messages({
            'any.required': 'Age is required',
            'number.min': 'Age must be at least 18',
            'number.max': 'Age cannot exceed 150'
        }),
        phoneNumber: Joi.string().required().pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/).messages({
            'any.required': 'Phone number is required',
            'string.pattern.base': 'Invalid phone number format'
        }),
        licenseId: Joi.string().required().min(5).max(20).messages({
            'any.required': 'License ID is required',
            'string.min': 'License ID must be at least 5 characters long',
            'string.max': 'License ID cannot exceed 20 characters'
        })
    }),

    // Update radiologist
    update: Joi.object({
        name: Joi.string().min(2).max(100).messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters'
        }),
        gender: Joi.string().valid('male', 'female', 'other').messages({
            'any.only': 'Gender must be male, female, or other'
        }),
        age: Joi.number().integer().min(18).max(150).messages({
            'number.min': 'Age must be at least 18',
            'number.max': 'Age cannot exceed 150'
        }),
        phoneNumber: Joi.string().pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/).messages({
            'string.pattern.base': 'Invalid phone number format'
        }),
        licenseId: Joi.string().min(5).max(20).messages({
            'string.min': 'License ID must be at least 5 characters long',
            'string.max': 'License ID cannot exceed 20 characters'
        }),
        isActive: Joi.boolean()
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    }),

    // Get radiologist by ID
    getById: Joi.object({
        id: objectId.required().messages({
            'any.required': 'Radiologist ID is required',
            'string.pattern.base': 'Invalid radiologist ID format'
        })
    }),

    // Delete radiologist
    delete: Joi.object({
        id: objectId.required().messages({
            'any.required': 'Radiologist ID is required',
            'string.pattern.base': 'Invalid radiologist ID format'
        })
    })
};

// Validation schema for creating radiologist
export const createRadiologistSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required()
        .messages({
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters'
        }),
    gender: Joi.string().valid('male', 'female', 'other').required()
        .messages({
            'any.only': 'Gender must be male, female, or other',
            'any.required': 'Gender is required'
        }),
    age: Joi.number().integer().min(18).max(150).required()
        .messages({
            'number.base': 'Age must be a number',
            'number.integer': 'Age must be an integer',
            'number.min': 'Age must be at least 18',
            'number.max': 'Age cannot exceed 150',
            'any.required': 'Age is required'
        }),
    phoneNumber: Joi.string().pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/).required()
        .messages({
            'string.pattern.base': 'Please provide a valid phone number',
            'any.required': 'Phone number is required'
        }),
    licenseId: Joi.string().trim().min(5).max(20).required()
        .messages({
            'string.empty': 'License ID is required',
            'string.min': 'License ID must be at least 5 characters long',
            'string.max': 'License ID cannot exceed 20 characters'
        })
});

// Validation schema for updating radiologist
export const updateRadiologistSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100)
        .messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters'
        }),
    gender: Joi.string().valid('male', 'female', 'other')
        .messages({
            'any.only': 'Gender must be male, female, or other'
        }),
    age: Joi.number().integer().min(18).max(150)
        .messages({
            'number.base': 'Age must be a number',
            'number.integer': 'Age must be an integer',
            'number.min': 'Age must be at least 18',
            'number.max': 'Age cannot exceed 150'
        }),
    phoneNumber: Joi.string().pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
        .messages({
            'string.pattern.base': 'Please provide a valid phone number'
        }),
    licenseId: Joi.string().trim().min(5).max(20)
        .messages({
            'string.min': 'License ID must be at least 5 characters long',
            'string.max': 'License ID cannot exceed 20 characters'
        }),
    isActive: Joi.boolean()
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

// Validation schema for radiologist ID parameter
export const radiologistIdSchema = Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
        .messages({
            'string.pattern.base': 'Invalid radiologist ID format',
            'any.required': 'Radiologist ID is required'
        })
});

// Validation schema for radiologist search
export const radiologistSearchSchema = Joi.object({
    query: Joi.string().trim().min(1).messages({
        'string.min': 'Search query must not be empty'
    }),
    isActive: Joi.boolean(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().valid('name', 'age', 'createdAt', '-name', '-age', '-createdAt').default('-createdAt')
});

// Middleware to validate request body
export const validateRadiologistBody = (schema) => {
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
export const validateRadiologistParams = (req, res, next) => {
    const { error, value } = radiologistIdSchema.validate(req.params, { abortEarly: false });

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