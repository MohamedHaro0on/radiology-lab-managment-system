import Joi from 'joi';
import { objectId } from './commonValidation.js';
import { errors } from '../utils/errorHandler.js';

// Validation schemas for stock
export const stockValidation = {
    // Get all stock items
    getAllStock: Joi.object({
        search: Joi.string().trim(),
        category: Joi.string().valid('X-Ray Film', 'Contrast Media', 'Medical Supplies', 'Equipment', 'Other'),
        lowStock: Joi.boolean(),
        expired: Joi.boolean(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        sortBy: Joi.string().valid('itemName', 'category', 'quantity', 'createdAt', 'updatedAt').default('createdAt'),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    }),

    // Create stock item
    create: Joi.object({
        name: Joi.string().required().min(2).max(100).messages({
            'any.required': 'Name is required',
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters'
        }),
        description: Joi.string().max(500).allow('').messages({
            'string.max': 'Description cannot exceed 500 characters'
        }),
        category: Joi.string().required().valid('X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Mammography', 'Other').messages({
            'any.required': 'Category is required',
            'any.only': 'Invalid category'
        }),
        quantity: Joi.number().integer().min(0).required().messages({
            'any.required': 'Quantity is required',
            'number.min': 'Quantity cannot be negative'
        }),
        unit: Joi.string().required().valid('piece', 'box', 'pack', 'bottle', 'kit').messages({
            'any.required': 'Unit is required',
            'any.only': 'Invalid unit'
        }),
        price: Joi.number().min(0).required().messages({
            'any.required': 'Price is required',
            'number.min': 'Price cannot be negative'
        }),
        minQuantity: Joi.number().integer().min(0).required().messages({
            'any.required': 'Minimum quantity is required',
            'number.min': 'Minimum quantity cannot be negative'
        }),
        supplier: Joi.string().required().min(2).max(100).messages({
            'any.required': 'Supplier is required',
            'string.min': 'Supplier name must be at least 2 characters long',
            'string.max': 'Supplier name cannot exceed 100 characters'
        }),
        expiryDate: Joi.date().min('now').allow(null).messages({
            'date.min': 'Expiry date must be in the future',
            'date.base': 'Invalid expiry date format'
        }),
        batchNumber: Joi.string().max(50).allow('').messages({
            'string.max': 'Batch number cannot exceed 50 characters'
        }),
        location: Joi.string().max(100).allow('').messages({
            'string.max': 'Location cannot exceed 100 characters'
        }),
        isActive: Joi.boolean().default(true)
    }),

    // Update stock item
    update: Joi.object({
        name: Joi.string().min(2).max(100).messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters'
        }),
        description: Joi.string().max(500).allow('').messages({
            'string.max': 'Description cannot exceed 500 characters'
        }),
        category: Joi.string().valid('X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Mammography', 'Other').messages({
            'any.only': 'Invalid category'
        }),
        quantity: Joi.number().integer().min(0).messages({
            'number.min': 'Quantity cannot be negative'
        }),
        unit: Joi.string().valid('piece', 'box', 'pack', 'bottle', 'kit').messages({
            'any.only': 'Invalid unit'
        }),
        price: Joi.number().min(0).messages({
            'number.min': 'Price cannot be negative'
        }),
        minQuantity: Joi.number().integer().min(0).messages({
            'number.min': 'Minimum quantity cannot be negative'
        }),
        supplier: Joi.string().min(2).max(100).messages({
            'string.min': 'Supplier name must be at least 2 characters long',
            'string.max': 'Supplier name cannot exceed 100 characters'
        }),
        expiryDate: Joi.date().min('now').allow(null).messages({
            'date.min': 'Expiry date must be in the future',
            'date.base': 'Invalid expiry date format'
        }),
        batchNumber: Joi.string().max(50).allow('').messages({
            'string.max': 'Batch number cannot exceed 50 characters'
        }),
        location: Joi.string().max(100).allow('').messages({
            'string.max': 'Location cannot exceed 100 characters'
        }),
        isActive: Joi.boolean()
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    }),

    // Get stock item by ID
    getById: Joi.object({
        id: objectId.required().messages({
            'any.required': 'Stock item ID is required',
            'string.pattern.base': 'Invalid stock item ID format'
        })
    }),

    // Delete stock item
    delete: Joi.object({
        id: objectId.required().messages({
            'any.required': 'Stock item ID is required',
            'string.pattern.base': 'Invalid stock item ID format'
        })
    }),

    // Add stock quantity
    addQuantity: Joi.object({
        id: objectId.required().messages({
            'any.required': 'Stock item ID is required',
            'string.pattern.base': 'Invalid stock item ID format'
        }),
        quantity: Joi.number().integer().min(1).required().messages({
            'any.required': 'Quantity is required',
            'number.min': 'Quantity must be at least 1'
        }),
        batchNumber: Joi.string().max(50).allow('').messages({
            'string.max': 'Batch number cannot exceed 50 characters'
        }),
        expiryDate: Joi.date().min('now').allow(null).messages({
            'date.min': 'Expiry date must be in the future',
            'date.base': 'Invalid expiry date format'
        })
    }),

    // Remove stock quantity
    removeQuantity: Joi.object({
        id: objectId.required().messages({
            'any.required': 'Stock item ID is required',
            'string.pattern.base': 'Invalid stock item ID format'
        }),
        quantity: Joi.number().integer().min(1).required().messages({
            'any.required': 'Quantity is required',
            'number.min': 'Quantity must be at least 1'
        }),
        reason: Joi.string().max(200).required().messages({
            'any.required': 'Reason is required',
            'string.max': 'Reason cannot exceed 200 characters'
        })
    }),

    // Search stock items
    search: Joi.object({
        query: Joi.string().min(1).max(100).required().messages({
            'any.required': 'Search query is required',
            'string.min': 'Search query must be at least 1 character long',
            'string.max': 'Search query cannot exceed 100 characters'
        }),
        category: Joi.string().valid('X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Mammography', 'Other').messages({
            'any.only': 'Invalid category'
        }),
        minQuantity: Joi.number().integer().min(0).messages({
            'number.min': 'Minimum quantity cannot be negative'
        }),
        maxQuantity: Joi.number().integer().min(0).custom((value, helpers) => {
            const { minQuantity } = helpers.state.ancestors[0];
            if (minQuantity && value < minQuantity) {
                return helpers.error('number.min', { message: 'Maximum quantity must be greater than minimum quantity' });
            }
            return value;
        }).messages({
            'number.min': 'Maximum quantity cannot be negative'
        }),
        supplier: Joi.string().min(2).max(100).messages({
            'string.min': 'Supplier name must be at least 2 characters long',
            'string.max': 'Supplier name cannot exceed 100 characters'
        }),
        isActive: Joi.boolean()
    })
}; 