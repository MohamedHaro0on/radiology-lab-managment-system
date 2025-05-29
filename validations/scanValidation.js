import pkg from 'joi';
const Joi = pkg;
import { objectId } from './commonValidation.js';
import { errors } from '../utils/errorHandler.js';

const scanItemSchema = Joi.object({
    stockItem: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
    quantity: Joi.number().integer().min(1).required()
});

const scanSchema = Joi.object({
    name: Joi.string().required().trim().min(2).max(100),
    description: Joi.string().trim().allow(''),
    price: Joi.number().required().min(0),
    minPrice: Joi.number().required().min(0),
    maxPrice: Joi.number().required().min(0),
    items: Joi.array().items(scanItemSchema).min(1).required(),
    category: Joi.string().required().valid('X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Mammography', 'Other'),
    preparationInstructions: Joi.string().trim().allow(''),
    duration: Joi.number().integer().min(1).required(),
    isActive: Joi.boolean()
});

export const validateScan = (req, res, next) => {
    const { error } = scanSchema.validate(req.body, { abortEarly: false });

    if (error) {
        const errorMessage = error.details.map(detail => detail.message).join(', ');
        return next(createError(400, errorMessage));
    }

    // Additional validation for price range
    const { price, minPrice, maxPrice } = req.body;
    if (minPrice > maxPrice) {
        return next(createError(400, 'Minimum price cannot be greater than maximum price'));
    }
    if (price < minPrice || price > maxPrice) {
        return next(createError(400, 'Price must be between minimum and maximum price'));
    }

    next();
};

export const validateScanUpdate = (req, res, next) => {
    const updateSchema = scanSchema.fork(
        ['name', 'description', 'price', 'minPrice', 'maxPrice', 'items', 'category', 'preparationInstructions', 'duration'],
        schema => schema.optional()
    );

    const { error } = updateSchema.validate(req.body, { abortEarly: false });

    if (error) {
        const errorMessage = error.details.map(detail => detail.message).join(', ');
        return next(createError(400, errorMessage));
    }

    // Additional validation for price range if prices are being updated
    const { price, minPrice, maxPrice } = req.body;
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
        return next(createError(400, 'Minimum price cannot be greater than maximum price'));
    }
    if (price !== undefined && minPrice !== undefined && maxPrice !== undefined) {
        if (price < minPrice || price > maxPrice) {
            return next(createError(400, 'Price must be between minimum and maximum price'));
        }
    }

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