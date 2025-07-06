import Joi from 'joi';

export const createRepresentativeSchema = Joi.object({
    name: Joi.string()
        .required()
        .trim()
        .min(2)
        .max(100)
        .messages({
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters'
        }),
    age: Joi.number()
        .required()
        .min(18)
        .max(100)
        .messages({
            'number.base': 'Age must be a number',
            'number.min': 'Age must be at least 18',
            'number.max': 'Age cannot exceed 100'
        }),
    id: Joi.string()
        .required()
        .trim()
        .max(50)
        .messages({
            'string.empty': 'ID is required',
            'string.max': 'ID cannot exceed 50 characters'
        }),
    phoneNumber: Joi.string()
        .required()
        .trim()
        .pattern(/^[\+]?[1-9][\d]{0,15}$/)
        .messages({
            'string.empty': 'Phone number is required',
            'string.pattern.base': 'Please enter a valid phone number'
        }),
    notes: Joi.string()
        .optional()
        .allow('')
        .trim()
        .max(500)
        .messages({
            'string.max': 'Notes cannot exceed 500 characters'
        })
});

export const updateRepresentativeSchema = Joi.object({
    name: Joi.string()
        .optional()
        .trim()
        .min(2)
        .max(100)
        .messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters'
        }),
    age: Joi.number()
        .optional()
        .min(18)
        .max(100)
        .messages({
            'number.base': 'Age must be a number',
            'number.min': 'Age must be at least 18',
            'number.max': 'Age cannot exceed 100'
        }),
    id: Joi.string()
        .optional()
        .trim()
        .max(50)
        .messages({
            'string.max': 'ID cannot exceed 50 characters'
        }),
    phoneNumber: Joi.string()
        .optional()
        .trim()
        .pattern(/^[\+]?[1-9][\d]{0,15}$/)
        .messages({
            'string.pattern.base': 'Please enter a valid phone number'
        }),
    isActive: Joi.boolean()
        .optional()
        .messages({
            'boolean.base': 'isActive must be a boolean'
        }),
    notes: Joi.string()
        .optional()
        .trim()
        .max(500)
        .messages({
            'string.max': 'Notes cannot exceed 500 characters'
        })
});

export const representativeIdSchema = Joi.object({
    id: Joi.string()
        .required()
        .messages({
            'string.empty': 'Representative ID is required'
        })
});

export const representativeQuerySchema = Joi.object({
    page: Joi.number()
        .optional()
        .min(1)
        .default(1)
        .messages({
            'number.base': 'Page must be a number',
            'number.min': 'Page must be at least 1'
        }),
    limit: Joi.number()
        .optional()
        .min(1)
        .max(100)
        .default(10)
        .messages({
            'number.base': 'Limit must be a number',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100'
        }),
    search: Joi.string()
        .optional()
        .trim()
        .max(100)
        .messages({
            'string.max': 'Search term cannot exceed 100 characters'
        }),
    isActive: Joi.boolean()
        .optional()
        .messages({
            'boolean.base': 'isActive must be a boolean'
        }),
    sortBy: Joi.string()
        .optional()
        .valid('name', 'age', 'patientsCount', 'doctorsCount', 'createdAt')
        .default('createdAt')
        .messages({
            'any.only': 'Sort by must be one of: name, age, patientsCount, doctorsCount, createdAt'
        }),
    sortOrder: Joi.string()
        .optional()
        .valid('asc', 'desc')
        .default('desc')
        .messages({
            'any.only': 'Sort order must be either asc or desc'
        })
}); 