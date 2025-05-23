import Joi from 'joi';

const stockValidation = {
    // Create stock validation
    createStock: Joi.object({
        body: Joi.object({
            itemName: Joi.string().required().trim().min(2).max(100)
                .messages({
                    'string.empty': 'Item name is required',
                    'string.min': 'Item name must be at least 2 characters long',
                    'string.max': 'Item name cannot exceed 100 characters'
                }),
            category: Joi.string().required().valid('X-Ray Film', 'Contrast Media', 'Medical Supplies', 'Equipment', 'Other')
                .messages({
                    'string.empty': 'Category is required',
                    'any.only': 'Invalid category'
                }),
            quantity: Joi.number().required().min(0)
                .messages({
                    'number.base': 'Quantity must be a number',
                    'number.min': 'Quantity cannot be negative'
                }),
            unit: Joi.string().required().valid('Box', 'Piece', 'Pack', 'Bottle', 'Kit')
                .messages({
                    'string.empty': 'Unit is required',
                    'any.only': 'Invalid unit'
                }),
            minimumQuantity: Joi.number().required().min(0)
                .messages({
                    'number.base': 'Minimum quantity must be a number',
                    'number.min': 'Minimum quantity cannot be negative'
                }),
            supplier: Joi.object({
                name: Joi.string().required().trim().min(2).max(100)
                    .messages({
                        'string.empty': 'Supplier name is required',
                        'string.min': 'Supplier name must be at least 2 characters long',
                        'string.max': 'Supplier name cannot exceed 100 characters'
                    }),
                contactPerson: Joi.string().trim().min(2).max(100),
                phoneNumber: Joi.string().trim().pattern(/^[0-9+\-\s()]{10,15}$/),
                email: Joi.string().email().trim().lowercase()
            }).required(),
            expiryDate: Joi.date().min('now'),
            batchNumber: Joi.string().trim().min(2).max(50),
            location: Joi.string().required().trim().min(2).max(100)
                .messages({
                    'string.empty': 'Location is required',
                    'string.min': 'Location must be at least 2 characters long',
                    'string.max': 'Location cannot exceed 100 characters'
                }),
            notes: Joi.string().trim().max(500)
        })
    }),

    // Update stock validation
    updateStock: Joi.object({
        params: Joi.object({
            id: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/)
                .messages({
                    'string.empty': 'Stock ID is required',
                    'string.pattern.base': 'Invalid stock ID format'
                })
        }),
        body: Joi.object({
            itemName: Joi.string().trim().min(2).max(100),
            category: Joi.string().valid('X-Ray Film', 'Contrast Media', 'Medical Supplies', 'Equipment', 'Other'),
            quantity: Joi.number().min(0),
            unit: Joi.string().valid('Box', 'Piece', 'Pack', 'Bottle', 'Kit'),
            minimumQuantity: Joi.number().min(0),
            supplier: Joi.object({
                name: Joi.string().trim().min(2).max(100),
                contactPerson: Joi.string().trim().min(2).max(100),
                phoneNumber: Joi.string().trim().pattern(/^[0-9+\-\s()]{10,15}$/),
                email: Joi.string().email().trim().lowercase()
            }),
            expiryDate: Joi.date().min('now'),
            batchNumber: Joi.string().trim().min(2).max(50),
            location: Joi.string().trim().min(2).max(100),
            notes: Joi.string().trim().max(500)
        }).min(1).messages({
            'object.min': 'At least one field must be provided for update'
        })
    }),

    // Update quantity validation
    updateQuantity: Joi.object({
        params: Joi.object({
            id: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/)
                .messages({
                    'string.empty': 'Stock ID is required',
                    'string.pattern.base': 'Invalid stock ID format'
                })
        }),
        body: Joi.object({
            quantity: Joi.number().required().min(0)
                .messages({
                    'number.base': 'Quantity must be a number',
                    'number.min': 'Quantity cannot be negative'
                }),
            operation: Joi.string().required().valid('add', 'subtract')
                .messages({
                    'string.empty': 'Operation is required',
                    'any.only': 'Operation must be either add or subtract'
                })
        })
    }),

    // Get stock validation
    getStock: Joi.object({
        params: Joi.object({
            id: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/)
                .messages({
                    'string.empty': 'Stock ID is required',
                    'string.pattern.base': 'Invalid stock ID format'
                })
        })
    }),

    // List stock validation
    listStock: Joi.object({
        query: Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            search: Joi.string().trim().min(1).max(100),
            category: Joi.string().valid('X-Ray Film', 'Contrast Media', 'Medical Supplies', 'Equipment', 'Other'),
            sortBy: Joi.string().valid('itemName', 'quantity', 'expiryDate', 'createdAt').default('itemName'),
            sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
            lowStock: Joi.boolean(),
            expired: Joi.boolean()
        })
    }),

    // Delete stock validation
    deleteStock: Joi.object({
        params: Joi.object({
            id: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/)
                .messages({
                    'string.empty': 'Stock ID is required',
                    'string.pattern.base': 'Invalid stock ID format'
                })
        })
    })
};

export default stockValidation; 