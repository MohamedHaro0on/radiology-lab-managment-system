import Joi from 'joi';

// Validation schema for creating a branch
export const createBranchSchema = Joi.object({
    name: Joi.string()
        .required()
        .min(3)
        .max(100)
        .trim()
        .messages({
            'string.empty': 'Branch name is required',
            'string.min': 'Branch name must be at least 3 characters',
            'string.max': 'Branch name cannot exceed 100 characters',
            'any.required': 'Branch name is required'
        }),
    location: Joi.string()
        .required()
        .min(5)
        .max(200)
        .trim()
        .messages({
            'string.empty': 'Location is required',
            'string.min': 'Location must be at least 5 characters',
            'string.max': 'Location cannot exceed 200 characters',
            'any.required': 'Location is required'
        }),
    address: Joi.string()
        .required()
        .min(10)
        .max(500)
        .trim()
        .messages({
            'string.empty': 'Address is required',
            'string.min': 'Address must be at least 10 characters',
            'string.max': 'Address cannot exceed 500 characters',
            'any.required': 'Address is required'
        }),
    phone: Joi.string()
        .required()
        .pattern(/^\\+20\d{10}$/)
        .trim()
        .messages({
            'string.empty': 'Phone number is required',
            'string.pattern.base': 'Phone number must be in the format +20 followed by 10 digits.',
            'any.required': 'Phone number is required'
        }),
    email: Joi.string()
        .required()
        .email({ tlds: { allow: false } })
        .trim()
        .lowercase()
        .messages({
            'string.empty': 'Email address is required',
            'string.email': 'Please enter a valid email address',
            'any.required': 'Email address is required'
        }),
    manager: Joi.string()
        .required()
        .min(2)
        .max(100)
        .trim()
        .messages({
            'string.empty': 'Manager name is required',
            'string.min': 'Manager name must be at least 2 characters',
            'string.max': 'Manager name cannot exceed 100 characters',
            'any.required': 'Manager name is required'
        }),
    isActive: Joi.boolean()
        .default(true)
        .messages({
            'boolean.base': 'isActive must be a boolean value'
        })
});

// Validation schema for updating a branch
export const updateBranchSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(100)
        .trim()
        .messages({
            'string.empty': 'Branch name cannot be empty',
            'string.min': 'Branch name must be at least 3 characters',
            'string.max': 'Branch name cannot exceed 100 characters'
        }),
    location: Joi.string()
        .min(5)
        .max(200)
        .trim()
        .messages({
            'string.empty': 'Location cannot be empty',
            'string.min': 'Location must be at least 5 characters',
            'string.max': 'Location cannot exceed 200 characters'
        }),
    address: Joi.string()
        .min(10)
        .max(500)
        .trim()
        .messages({
            'string.empty': 'Address cannot be empty',
            'string.min': 'Address must be at least 10 characters',
            'string.max': 'Address cannot exceed 500 characters'
        }),
    phone: Joi.string()
        .pattern(/^\\+20\d{10}$/)
        .trim()
        .messages({
            'string.empty': 'Phone number cannot be empty',
            'string.pattern.base': 'Phone number must be in the format +20 followed by 10 digits.'
        }),
    email: Joi.string()
        .email({ tlds: { allow: false } })
        .trim()
        .lowercase()
        .messages({
            'string.empty': 'Email address cannot be empty',
            'string.email': 'Please enter a valid email address'
        }),
    manager: Joi.string()
        .min(2)
        .max(100)
        .trim()
        .messages({
            'string.empty': 'Manager name cannot be empty',
            'string.min': 'Manager name must be at least 2 characters',
            'string.max': 'Manager name cannot exceed 100 characters'
        }),
    isActive: Joi.boolean()
        .messages({
            'boolean.base': 'isActive must be a boolean value'
        })
});

// Validation schema for branch ID parameter
export const branchIdSchema = Joi.object({
    id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid branch ID format',
            'any.required': 'Branch ID is required'
        })
});

// Validation schema for branch query parameters
export const branchQuerySchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
            'number.base': 'Page must be a number',
            'number.integer': 'Page must be an integer',
            'number.min': 'Page must be at least 1'
        }),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
        .messages({
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be an integer',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100'
        }),
    search: Joi.string()
        .trim()
        .max(100)
        .messages({
            'string.max': 'Search term cannot exceed 100 characters'
        }),
    status: Joi.string()
        .valid('active', 'inactive', 'all')
        .default('all')
        .messages({
            'any.only': 'Status must be one of: active, inactive, all'
        }),
    sortBy: Joi.string()
        .valid('name', 'location', 'manager', 'createdAt', 'updatedAt')
        .default('name')
        .messages({
            'any.only': 'Sort by must be one of: name, location, manager, createdAt, updatedAt'
        }),
    sortOrder: Joi.string()
        .valid('asc', 'desc')
        .default('asc')
        .messages({
            'any.only': 'Sort order must be one of: asc, desc'
        })
});

// Middleware to validate request body
export const validateBranchBody = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

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
export const validateBranchParams = (req, res, next) => {
    const { error, value } = branchIdSchema.validate(req.params, { abortEarly: false });

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
export const validateBranchQuery = (req, res, next) => {
    const { error, value } = branchQuerySchema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true
    });

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
export const branchValidation = {
    createBranchSchema,
    updateBranchSchema,
    branchIdSchema,
    branchQuerySchema,
    validateBranchBody,
    validateBranchParams,
    validateBranchQuery
};

export default branchValidation; 