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
        specialization: Joi.string().trim(),
        isActive: Joi.boolean(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        sort: Joi.string().valid('name', 'specialization', 'createdAt', '-name', '-specialization', '-createdAt').default('-createdAt')
    }),

    // Create radiologist
    create: Joi.object({
        name: Joi.string().required().min(2).max(100).messages({
            'any.required': 'Name is required',
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters'
        }),
        specialization: Joi.string().required().min(2).max(100).messages({
            'any.required': 'Specialization is required',
            'string.min': 'Specialization must be at least 2 characters long',
            'string.max': 'Specialization cannot exceed 100 characters'
        }),
        licenseNumber: Joi.string().required().min(3).max(50).messages({
            'any.required': 'License number is required',
            'string.min': 'License number must be at least 3 characters long',
            'string.max': 'License number cannot exceed 50 characters'
        }),
        contactNumber: Joi.string().required().pattern(/^\+?[\d\s-]{10,}$/).messages({
            'any.required': 'Contact number is required',
            'string.pattern.base': 'Invalid contact number format'
        }),
        email: Joi.string().required().email().messages({
            'any.required': 'Email is required',
            'string.email': 'Invalid email format'
        }),
        address: Joi.object({
            street: Joi.string().required().min(3).max(200).messages({
                'any.required': 'Street address is required',
                'string.min': 'Street address must be at least 3 characters long',
                'string.max': 'Street address cannot exceed 200 characters'
            }),
            city: Joi.string().required().min(2).max(100).messages({
                'any.required': 'City is required',
                'string.min': 'City must be at least 2 characters long',
                'string.max': 'City cannot exceed 100 characters'
            }),
            state: Joi.string().required().min(2).max(100).messages({
                'any.required': 'State is required',
                'string.min': 'State must be at least 2 characters long',
                'string.max': 'State cannot exceed 100 characters'
            }),
            country: Joi.string().required().min(2).max(100).messages({
                'any.required': 'Country is required',
                'string.min': 'Country must be at least 2 characters long',
                'string.max': 'Country cannot exceed 100 characters'
            }),
            postalCode: Joi.string().required().min(3).max(20).messages({
                'any.required': 'Postal code is required',
                'string.min': 'Postal code must be at least 3 characters long',
                'string.max': 'Postal code cannot exceed 20 characters'
            })
        }).required().messages({
            'any.required': 'Address is required'
        }),
        qualifications: Joi.array().items(
            Joi.object({
                degree: Joi.string().required().min(2).max(100).messages({
                    'any.required': 'Degree is required',
                    'string.min': 'Degree must be at least 2 characters long',
                    'string.max': 'Degree cannot exceed 100 characters'
                }),
                institution: Joi.string().required().min(2).max(200).messages({
                    'any.required': 'Institution is required',
                    'string.min': 'Institution must be at least 2 characters long',
                    'string.max': 'Institution cannot exceed 200 characters'
                }),
                year: Joi.number().integer().min(1900).max(new Date().getFullYear()).required().messages({
                    'any.required': 'Year is required',
                    'number.min': 'Year must be after 1900',
                    'number.max': 'Year cannot be in the future'
                })
            })
        ).min(1).required().messages({
            'any.required': 'At least one qualification is required',
            'array.min': 'At least one qualification is required'
        }),
        experience: Joi.number().integer().min(0).required().messages({
            'any.required': 'Experience is required',
            'number.min': 'Experience cannot be negative'
        }),
        expertise: Joi.array().items(Joi.string().trim()).min(1).required().messages({
            'any.required': 'At least one area of expertise is required',
            'array.min': 'At least one area of expertise is required'
        }),
        user: objectId.required().messages({
            'any.required': 'User ID is required',
            'string.pattern.base': 'Invalid user ID format'
        })
    }),

    // Update radiologist
    update: Joi.object({
        name: Joi.string().min(2).max(100).messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters'
        }),
        specialization: Joi.string().min(2).max(100).messages({
            'string.min': 'Specialization must be at least 2 characters long',
            'string.max': 'Specialization cannot exceed 100 characters'
        }),
        licenseNumber: Joi.string().min(3).max(50).messages({
            'string.min': 'License number must be at least 3 characters long',
            'string.max': 'License number cannot exceed 50 characters'
        }),
        contactNumber: Joi.string().pattern(/^\+?[\d\s-]{10,}$/).messages({
            'string.pattern.base': 'Invalid contact number format'
        }),
        email: Joi.string().email().messages({
            'string.email': 'Invalid email format'
        }),
        address: Joi.object({
            street: Joi.string().min(3).max(200).messages({
                'string.min': 'Street address must be at least 3 characters long',
                'string.max': 'Street address cannot exceed 200 characters'
            }),
            city: Joi.string().min(2).max(100).messages({
                'string.min': 'City must be at least 2 characters long',
                'string.max': 'City cannot exceed 100 characters'
            }),
            state: Joi.string().min(2).max(100).messages({
                'string.min': 'State must be at least 2 characters long',
                'string.max': 'State cannot exceed 100 characters'
            }),
            country: Joi.string().min(2).max(100).messages({
                'string.min': 'Country must be at least 2 characters long',
                'string.max': 'Country cannot exceed 100 characters'
            }),
            postalCode: Joi.string().min(3).max(20).messages({
                'string.min': 'Postal code must be at least 3 characters long',
                'string.max': 'Postal code cannot exceed 20 characters'
            })
        }),
        qualifications: Joi.array().items(
            Joi.object({
                degree: Joi.string().required().min(2).max(100).messages({
                    'any.required': 'Degree is required',
                    'string.min': 'Degree must be at least 2 characters long',
                    'string.max': 'Degree cannot exceed 100 characters'
                }),
                institution: Joi.string().required().min(2).max(200).messages({
                    'any.required': 'Institution is required',
                    'string.min': 'Institution must be at least 2 characters long',
                    'string.max': 'Institution cannot exceed 200 characters'
                }),
                year: Joi.number().integer().min(1900).max(new Date().getFullYear()).required().messages({
                    'any.required': 'Year is required',
                    'number.min': 'Year must be after 1900',
                    'number.max': 'Year cannot be in the future'
                })
            })
        ).min(1).messages({
            'array.min': 'At least one qualification is required'
        }),
        experience: Joi.number().integer().min(0).messages({
            'number.min': 'Experience cannot be negative'
        }),
        expertise: Joi.array().items(Joi.string().trim()).min(1).messages({
            'array.min': 'At least one area of expertise is required'
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
    }),

    // Add qualification
    addQualification: Joi.object({
        id: objectId.required().messages({
            'any.required': 'Radiologist ID is required',
            'string.pattern.base': 'Invalid radiologist ID format'
        }),
        qualification: Joi.object({
            degree: Joi.string().required().min(2).max(100).messages({
                'any.required': 'Degree is required',
                'string.min': 'Degree must be at least 2 characters long',
                'string.max': 'Degree cannot exceed 100 characters'
            }),
            institution: Joi.string().required().min(2).max(200).messages({
                'any.required': 'Institution is required',
                'string.min': 'Institution must be at least 2 characters long',
                'string.max': 'Institution cannot exceed 200 characters'
            }),
            year: Joi.number().integer().min(1900).max(new Date().getFullYear()).required().messages({
                'any.required': 'Year is required',
                'number.min': 'Year must be after 1900',
                'number.max': 'Year cannot be in the future'
            })
        }).required().messages({
            'any.required': 'Qualification details are required'
        })
    }),

    // Remove qualification
    removeQualification: Joi.object({
        id: objectId.required().messages({
            'any.required': 'Radiologist ID is required',
            'string.pattern.base': 'Invalid radiologist ID format'
        }),
        qualificationId: objectId.required().messages({
            'any.required': 'Qualification ID is required',
            'string.pattern.base': 'Invalid qualification ID format'
        })
    })
}; 