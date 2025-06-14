import Joi from 'joi';
import { objectId } from './commonValidation.js';
import { errors } from '../utils/errorHandler.js';

// Validation schema for creating stock item
export const createStockSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required()
        .messages({
            'string.empty': 'Stock name is required',
            'string.min': 'Stock name must be at least 2 characters long',
            'string.max': 'Stock name cannot exceed 100 characters'
        }),
    quantity: Joi.number().integer().min(0).required()
        .messages({
            'number.base': 'Quantity must be a number',
            'number.integer': 'Quantity must be an integer',
            'number.min': 'Quantity cannot be negative',
            'any.required': 'Quantity is required'
        }),
    minimumThreshold: Joi.number().integer().min(0).required()
        .messages({
            'number.base': 'Minimum threshold must be a number',
            'number.integer': 'Minimum threshold must be an integer',
            'number.min': 'Minimum threshold cannot be negative',
            'any.required': 'Minimum threshold is required'
        }),
    price: Joi.number().positive().required()
        .messages({
            'number.base': 'Price must be a number',
            'number.positive': 'Price must be a positive number',
            'any.required': 'Price is required'
        }),
    validUntil: Joi.date().greater('now').required()
        .messages({
            'date.base': 'Valid until must be a valid date',
            'date.greater': 'Valid until date must be in the future',
            'any.required': 'Valid until date is required'
        })
}).custom((value, helpers) => {
    // Custom validation to ensure minimum threshold is not greater than quantity
    if (value.minimumThreshold > value.quantity) {
        return helpers.error('any.invalid', { message: 'Minimum threshold cannot be greater than current quantity' });
    }
    return value;
});

// Validation schema for updating stock item
export const updateStockSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    quantity: Joi.number().integer().min(0).optional(),
    minimumThreshold: Joi.number().integer().min(0).optional(),
    price: Joi.number().positive().optional(),
    validUntil: Joi.date().greater('now').optional()
}).custom((value, helpers) => {
    // Custom validation to ensure minimum threshold is not greater than quantity when both are provided
    if (value.minimumThreshold !== undefined && value.quantity !== undefined && value.minimumThreshold > value.quantity) {
        return helpers.error('any.invalid', { message: 'Minimum threshold cannot be greater than current quantity' });
    }
    return value;
});

// Validation schema for stock ID parameter
export const stockIdSchema = Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
        .messages({
            'string.pattern.base': 'Invalid stock ID format',
            'any.required': 'Stock ID is required'
        })
});

// Validation schema for stock query parameters
export const stockQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().optional(),
    minPrice: Joi.number().positive().optional(),
    maxPrice: Joi.number().positive().optional(),
    lowStock: Joi.boolean().optional(),
    expired: Joi.boolean().optional(),
    sortBy: Joi.string().valid('name', 'quantity', 'price', 'validUntil', 'createdAt').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Validation schema for stock quantity update
export const updateStockQuantitySchema = Joi.object({
    quantity: Joi.number().integer().min(0).required()
        .messages({
            'number.base': 'Quantity must be a number',
            'number.integer': 'Quantity must be an integer',
            'number.min': 'Quantity cannot be negative',
            'any.required': 'Quantity is required'
        })
});

// Middleware to validate request body
export const validateStockBody = (schema) => {
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
export const validateStockParams = (req, res, next) => {
    const { error, value } = stockIdSchema.validate(req.params, { abortEarly: false });

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
export const validateStockQuery = (req, res, next) => {
    const { error, value } = stockQuerySchema.validate(req.query, { abortEarly: false });

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
export const stockValidation = {
    getAllStock: stockQuerySchema,
    create: createStockSchema,
    update: updateStockSchema,
    getById: stockIdSchema,
    delete: stockIdSchema,
    addQuantity: Joi.object({
        id: stockIdSchema.extract('id'),
        quantity: Joi.number().integer().min(1).required()
    }),
    removeQuantity: Joi.object({
        id: stockIdSchema.extract('id'),
        quantity: Joi.number().integer().min(1).required(),
        reason: Joi.string().max(200).required()
    })
}; 