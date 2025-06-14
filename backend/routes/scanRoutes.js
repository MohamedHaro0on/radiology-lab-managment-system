import express from 'express';
import { validate } from '../middleware/validate.js';
// import { auth } from '../middleware/auth.js'; // Temporarily disabled
// import { checkPrivilege, autoCheckPrivileges } from '../middleware/privilege.js'; // Temporarily disabled
import { scanValidation } from '../validations/scanValidation.js';
import * as scanController from '../controllers/scanController.js';
import Joi from 'joi';

const router = express.Router();

// Apply authentication middleware (temporarily disabled)
// router.use(auth);

// Apply auto privilege checking middleware (temporarily disabled)
// router.use(autoCheckPrivileges);

// Get all scans
router.get('/',
    // checkPrivilege('scans', 'view'), // Temporarily disabled
    validate(scanValidation.getAllScans || Joi.object({
        query: Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            search: Joi.string().trim().optional(),
            category: Joi.string().optional(),
            minPrice: Joi.number().positive().optional(),
            maxPrice: Joi.number().positive().optional(),
            isActive: Joi.boolean().optional()
        })
    })),
    scanController.getAllScans
);

// Get scan by ID
router.get('/:id',
    // checkPrivilege('scans', 'view'), // Temporarily disabled
    validate({
        params: Joi.object({
            id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
                .messages({
                    'string.pattern.base': 'Invalid scan ID format',
                    'any.required': 'Scan ID is required'
                })
        })
    }),
    scanController.getScan
);

// Create new scan
router.post('/',
    // checkPrivilege('scans', 'create'), // Temporarily disabled
    validate({
        body: Joi.object({
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
            items: Joi.array().items(
                Joi.object({
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
                })
            ).min(1).required()
                .messages({
                    'array.min': 'At least one item is required',
                    'any.required': 'Items are required'
                }),
            description: Joi.string().trim().max(500).optional()
                .messages({
                    'string.max': 'Description cannot exceed 500 characters'
                })
        })
    }),
    scanController.createScan
);

// Update scan
router.patch('/:id',
    // checkPrivilege('scans', 'update'), // Temporarily disabled
    validate({
        params: Joi.object({
            id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
                .messages({
                    'string.pattern.base': 'Invalid scan ID format',
                    'any.required': 'Scan ID is required'
                })
        }),
        body: Joi.object({
            name: Joi.string().trim().min(2).max(100).optional(),
            actualCost: Joi.number().positive().optional(),
            minPrice: Joi.number().positive().optional(),
            items: Joi.array().items(
                Joi.object({
                    item: Joi.string().trim().required(),
                    quantity: Joi.number().integer().min(1).required()
                })
            ).min(1).optional(),
            description: Joi.string().trim().max(500).optional()
        })
    }),
    scanController.updateScan
);

// Delete scan
router.delete('/:id',
    // checkPrivilege('scans', 'delete'), // Temporarily disabled
    validate({
        params: Joi.object({
            id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
                .messages({
                    'string.pattern.base': 'Invalid scan ID format',
                    'any.required': 'Scan ID is required'
                })
        })
    }),
    scanController.deleteScan
);

// Check stock availability
router.get(
    '/:id/stock-availability',
    // checkPrivilege('scans', 'view'), // Temporarily disabled
    validate({
        params: Joi.object({
            id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
                .messages({
                    'string.pattern.base': 'Invalid scan ID format',
                    'any.required': 'Scan ID is required'
                })
        })
    }),
    scanController.checkStockAvailability
);

// Get scans by patient ID
router.get(
    '/patient/:patientId',
    // checkPrivilege('scans', 'view'), // Temporarily disabled
    validate({
        params: Joi.object({
            patientId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
                .messages({
                    'string.pattern.base': 'Invalid patient ID format',
                    'any.required': 'Patient ID is required'
                })
        })
    }),
    scanController.getScansByPatient
);

// Get scans by doctor ID
router.get(
    '/doctor/:doctorId',
    // checkPrivilege('scans', 'view'), // Temporarily disabled
    validate({
        params: Joi.object({
            doctorId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
                .messages({
                    'string.pattern.base': 'Invalid doctor ID format',
                    'any.required': 'Doctor ID is required'
                })
        })
    }),
    scanController.getScansByDoctor
);

// Add image to scan
router.post(
    '/:id/images',
    // checkPrivilege('scans', 'update'), // Temporarily disabled
    validate({
        params: Joi.object({
            id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
                .messages({
                    'string.pattern.base': 'Invalid scan ID format',
                    'any.required': 'Scan ID is required'
                })
        }),
        body: Joi.object({
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
        })
    }),
    scanController.addScanImage
);

// Remove image from scan
router.delete(
    '/:id/images/:imageId',
    // checkPrivilege('scans', 'update'), // Temporarily disabled
    validate({
        params: Joi.object({
            id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
                .messages({
                    'string.pattern.base': 'Invalid scan ID format',
                    'any.required': 'Scan ID is required'
                }),
            imageId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
                .messages({
                    'string.pattern.base': 'Invalid image ID format',
                    'any.required': 'Image ID is required'
                })
        })
    }),
    scanController.removeScanImage
);

export default router; 