import Joi from 'joi';

// Validation schema for creating/updating expense
export const createExpenseSchema = Joi.object({
    date: Joi.date().default(Date.now),
    reason: Joi.string().trim().min(3).max(500).required()
        .messages({
            'string.empty': 'Reason is required',
            'string.min': 'Reason must be at least 3 characters long',
            'string.max': 'Reason cannot exceed 500 characters'
        }),
    totalCost: Joi.number().positive().required()
        .messages({
            'number.base': 'Total cost must be a number',
            'number.positive': 'Total cost must be a positive number',
            'any.required': 'Total cost is required'
        }),
    requester: Joi.string().trim().min(2).max(100).required()
        .messages({
            'string.empty': 'Requester is required',
            'string.min': 'Requester name must be at least 2 characters long',
            'string.max': 'Requester name cannot exceed 100 characters'
        }),
    category: Joi.string().valid('operational', 'maintenance', 'supplies', 'utilities', 'salary', 'other').default('other'),
    description: Joi.string().trim().max(1000).optional(),
    paymentMethod: Joi.string().valid('cash', 'bank_transfer', 'check', 'credit_card', 'other').default('cash'),
    status: Joi.string().valid('pending', 'approved', 'rejected', 'paid').default('pending')
});

// Validation schema for updating expense
export const updateExpenseSchema = Joi.object({
    date: Joi.date().optional(),
    reason: Joi.string().trim().min(3).max(500).optional(),
    totalCost: Joi.number().positive().optional(),
    requester: Joi.string().trim().min(2).max(100).optional(),
    category: Joi.string().valid('operational', 'maintenance', 'supplies', 'utilities', 'salary', 'other').optional(),
    description: Joi.string().trim().max(1000).optional(),
    paymentMethod: Joi.string().valid('cash', 'bank_transfer', 'check', 'credit_card', 'other').optional(),
    status: Joi.string().valid('pending', 'approved', 'rejected', 'paid').optional()
});

// Validation schema for expense ID parameter
export const expenseIdSchema = Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
        .messages({
            'string.pattern.base': 'Invalid expense ID format',
            'any.required': 'Expense ID is required'
        })
});

// Validation schema for expense query parameters
export const expenseQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().optional(),
    category: Joi.string().valid('operational', 'maintenance', 'supplies', 'utilities', 'salary', 'other').optional(),
    status: Joi.string().valid('pending', 'approved', 'rejected', 'paid').optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    sortBy: Joi.string().valid('date', 'reason', 'totalCost', 'requester', 'category', 'status', 'createdAt').default('date'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Validation schema for expense statistics query
export const expenseStatsQuerySchema = Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional()
});

// Middleware to validate request body
export const validateExpenseBody = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
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
export const validateExpenseParams = (req, res, next) => {
    const { error, value } = expenseIdSchema.validate(req.params, { abortEarly: false });

    if (error) {
        const errorMessage = error.details.map(detail => detail.message).join(', ');
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
export const validateExpenseQuery = (req, res, next) => {
    const { error, value } = expenseQuerySchema.validate(req.query, { abortEarly: false });

    if (error) {
        const errorMessage = error.details.map(detail => detail.message).join(', ');
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

// Middleware to validate stats query parameters
export const validateExpenseStatsQuery = (req, res, next) => {
    const { error, value } = expenseStatsQuerySchema.validate(req.query, { abortEarly: false });

    if (error) {
        const errorMessage = error.details.map(detail => detail.message).join(', ');
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