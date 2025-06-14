import Joi from 'joi';
import { objectId } from './commonValidation.js';
import { errors } from '../utils/errorHandler.js';

// Validation schema for scan items
const scanItemSchema = Joi.object({
    item: Joi.string().trim().required()
        .messages({
            'string.empty': 'Item name is required',
            'any.required': 'Item name is required'
        }),
    quantity: Joi.number().integer().min(1).required()
        .messages({
            'number.base': 'Quantity must be a number',
            'number.integer': 'Quantity must be an integer',
            'number.min': 'Quantity must be at least 1',
            'any.required': 'Quantity is required'
        })
});

// Validation schema for creating scan
export const createScanSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required()
        .messages({
            'string.empty': 'Scan name is required',
            'string.min': 'Scan name must be at least 2 characters long',
            'string.max': 'Scan name cannot exceed 100 characters'
        }),
    actualCost: Joi.number().positive().required()
        .messages({
            'number.base': 'Actual cost must be a number',
            'number.positive': 'Actual cost must be a positive number',
            'any.required': 'Actual cost is required'
        }),
    minPrice: Joi.number().positive().required()
        .messages({
            'number.base': 'Minimum price must be a number',
            'number.positive': 'Minimum price must be a positive number',
            'any.required': 'Minimum price is required'
        }),
    items: Joi.array().items(scanItemSchema).min(1).required()
        .messages({
            'array.min': 'At least one item is required',
            'any.required': 'Items are required'
        }),
    description: Joi.string().trim().max(500).optional()
        .messages({
            'string.max': 'Description cannot exceed 500 characters'
        })
});

// Validation schema for updating scan
export const updateScanSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    actualCost: Joi.number().positive().optional(),
    minPrice: Joi.number().positive().optional(),
    items: Joi.array().items(scanItemSchema).min(1).optional(),
    description: Joi.string().trim().max(500).optional()
});

// Validation schema for scan ID parameter
export const scanIdSchema = Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
        .messages({
            'string.pattern.base': 'Invalid scan ID format',
            'any.required': 'Scan ID is required'
        })
});

// Validation schema for scan query parameters
export const scanQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().optional(),
    minPrice: Joi.number().positive().optional(),
    maxPrice: Joi.number().positive().optional(),
    sortBy: Joi.string().valid('name', 'actualCost', 'minPrice', 'createdAt').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Middleware to validate request body
export const validateScanBody = (schema) => {
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
export const validateScanParams = (req, res, next) => {
    const { error, value } = scanIdSchema.validate(req.params, { abortEarly: false });

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
export const validateScanQuery = (req, res, next) => {
    const { error, value } = scanQuerySchema.validate(req.query, { abortEarly: false });

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

// Validation schemas for scans
export const scanValidation = {
    // Create scan
    create: Joi.object({
        patient: objectId.required().messages({
            'any.required': 'Patient ID is required',
            'string.pattern.base': 'Invalid patient ID format'
        }),
        doctor: objectId.required().messages({
            'any.required': 'Doctor ID is required',
            'string.pattern.base': 'Invalid doctor ID format'
        }),
        scanType: Joi.string().required().min(2).max(100).messages({
            'any.required': 'Scan type is required',
            'string.min': 'Scan type must be at least 2 characters long',
            'string.max': 'Scan type cannot exceed 100 characters'
        }),
        appointment: objectId.required().messages({
            'any.required': 'Appointment ID is required',
            'string.pattern.base': 'Invalid appointment ID format'
        }),
        status: Joi.string().valid('pending', 'in-progress', 'completed', 'cancelled').default('pending').messages({
            'any.only': 'Invalid scan status'
        }),
        priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium').messages({
            'any.only': 'Invalid priority level'
        }),
        notes: Joi.string().max(1000).allow('').messages({
            'string.max': 'Notes cannot exceed 1000 characters'
        }),
        images: Joi.array().items(
            Joi.object({
                url: Joi.string().required().uri().messages({
                    'any.required': 'Image URL is required',
                    'string.uri': 'Invalid image URL format'
                }),
                type: Joi.string().required().valid('dicom', 'jpeg', 'png').messages({
                    'any.required': 'Image type is required',
                    'any.only': 'Image type must be dicom, jpeg, or png'
                }),
                description: Joi.string().max(200).allow('').messages({
                    'string.max': 'Description cannot exceed 200 characters'
                })
            })
        ).max(20).messages({
            'array.max': 'Cannot upload more than 20 images'
        }),
        findings: Joi.string().max(2000).allow('').messages({
            'string.max': 'Findings cannot exceed 2000 characters'
        }),
        recommendations: Joi.string().max(1000).allow('').messages({
            'string.max': 'Recommendations cannot exceed 1000 characters'
        }),
        price: Joi.number().required().min(0).messages({
            'any.required': 'Price is required',
            'number.min': 'Price cannot be negative'
        }),
        minPrice: Joi.number().required().min(0).messages({
            'any.required': 'Minimum price is required',
            'number.min': 'Minimum price cannot be negative'
        }),
        maxPrice: Joi.number().required().min(0).custom((value, helpers) => {
            const { minPrice } = helpers.state.ancestors[0];
            if (minPrice && value < minPrice) {
                return helpers.error('number.min', { message: 'Maximum price must be greater than minimum price' });
            }
            return value;
        }).messages({
            'any.required': 'Maximum price is required',
            'number.min': 'Maximum price cannot be negative'
        })
    }),

    // Update scan
    update: Joi.object({
        status: Joi.string().valid('pending', 'in-progress', 'completed', 'cancelled').messages({
            'any.only': 'Invalid scan status'
        }),
        priority: Joi.string().valid('low', 'medium', 'high', 'urgent').messages({
            'any.only': 'Invalid priority level'
        }),
        notes: Joi.string().max(1000).allow('').messages({
            'string.max': 'Notes cannot exceed 1000 characters'
        }),
        images: Joi.array().items(
            Joi.object({
                url: Joi.string().required().uri().messages({
                    'any.required': 'Image URL is required',
                    'string.uri': 'Invalid image URL format'
                }),
                type: Joi.string().required().valid('dicom', 'jpeg', 'png').messages({
                    'any.required': 'Image type is required',
                    'any.only': 'Image type must be dicom, jpeg, or png'
                }),
                description: Joi.string().max(200).allow('').messages({
                    'string.max': 'Description cannot exceed 200 characters'
                })
            })
        ).max(20).messages({
            'array.max': 'Cannot upload more than 20 images'
        }),
        findings: Joi.string().max(2000).allow('').messages({
            'string.max': 'Findings cannot exceed 2000 characters'
        }),
        recommendations: Joi.string().max(1000).allow('').messages({
            'string.max': 'Recommendations cannot exceed 1000 characters'
        }),
        price: Joi.number().min(0).custom((value, helpers) => {
            const { minPrice, maxPrice } = helpers.state.ancestors[0];
            if (minPrice && maxPrice && (value < minPrice || value > maxPrice)) {
                return helpers.error('number.range', { message: 'Price must be between minimum and maximum price' });
            }
            return value;
        }).messages({
            'number.min': 'Price cannot be negative',
            'number.range': 'Price must be between minimum and maximum price'
        }),
        minPrice: Joi.number().min(0).custom((value, helpers) => {
            const { maxPrice } = helpers.state.ancestors[0];
            if (maxPrice && value > maxPrice) {
                return helpers.error('number.max', { message: 'Minimum price cannot be greater than maximum price' });
            }
            return value;
        }).messages({
            'number.min': 'Minimum price cannot be negative',
            'number.max': 'Minimum price cannot be greater than maximum price'
        }),
        maxPrice: Joi.number().min(0).custom((value, helpers) => {
            const { minPrice } = helpers.state.ancestors[0];
            if (minPrice && value < minPrice) {
                return helpers.error('number.min', { message: 'Maximum price must be greater than minimum price' });
            }
            return value;
        }).messages({
            'number.min': 'Maximum price cannot be negative'
        })
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    }),

    // Get scan by ID
    getById: Joi.object({
        id: objectId.required().messages({
            'any.required': 'Scan ID is required',
            'string.pattern.base': 'Invalid scan ID format'
        })
    }),

    // Get scans by patient ID
    getByPatientId: Joi.object({
        patientId: objectId.required().messages({
            'any.required': 'Patient ID is required',
            'string.pattern.base': 'Invalid patient ID format'
        })
    }),

    // Get scans by doctor ID
    getByDoctorId: Joi.object({
        doctorId: objectId.required().messages({
            'any.required': 'Doctor ID is required',
            'string.pattern.base': 'Invalid doctor ID format'
        })
    }),

    // Delete scan
    delete: Joi.object({
        id: objectId.required().messages({
            'any.required': 'Scan ID is required',
            'string.pattern.base': 'Invalid scan ID format'
        })
    }),

    // Add image to scan
    addImage: Joi.object({
        id: objectId.required().messages({
            'any.required': 'Scan ID is required',
            'string.pattern.base': 'Invalid scan ID format'
        }),
        image: Joi.object({
            url: Joi.string().required().uri().messages({
                'any.required': 'Image URL is required',
                'string.uri': 'Invalid image URL format'
            }),
            type: Joi.string().required().valid('dicom', 'jpeg', 'png').messages({
                'any.required': 'Image type is required',
                'any.only': 'Image type must be dicom, jpeg, or png'
            }),
            description: Joi.string().max(200).allow('').messages({
                'string.max': 'Description cannot exceed 200 characters'
            })
        }).required().messages({
            'any.required': 'Image details are required'
        })
    }),

    // Remove image from scan
    removeImage: Joi.object({
        id: objectId.required().messages({
            'any.required': 'Scan ID is required',
            'string.pattern.base': 'Invalid scan ID format'
        }),
        imageId: objectId.required().messages({
            'any.required': 'Image ID is required',
            'string.pattern.base': 'Invalid image ID format'
        })
    })
}; 