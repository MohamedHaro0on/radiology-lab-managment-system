import Joi from 'joi';
import { objectId } from './commonValidation.js';
import { errors } from '../utils/errorHandler.js';

// Validation schemas for doctors
export const doctorValidation = {
    // Get all doctors
    getAllDoctors: Joi.object({
        search: Joi.string().trim(),
        specialization: Joi.string().trim(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        sortBy: Joi.string().valid('name', 'specialization', 'createdAt', 'updatedAt').default('createdAt'),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    }),

    // Get single doctor
    getDoctor: Joi.object({
        id: objectId.required().messages({
            'any.required': 'Doctor ID is required',
            'string.pattern.base': 'Invalid doctor ID format'
        })
    }),

    // Get top referring doctors
    getTopReferringDoctors: Joi.object({
        limit: Joi.number().integer().min(1).max(100).default(10).messages({
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100'
        })
    }),

    // Get doctor schedule
    getDoctorSchedule: Joi.object({
        id: objectId.required().messages({
            'any.required': 'Doctor ID is required',
            'string.pattern.base': 'Invalid doctor ID format'
        }),
        startDate: Joi.date().iso().required().messages({
            'any.required': 'Start date is required',
            'date.base': 'Invalid start date format',
            'date.format': 'Start date must be in ISO format'
        }),
        endDate: Joi.date().iso().min(Joi.ref('startDate')).required().messages({
            'any.required': 'End date is required',
            'date.base': 'Invalid end date format',
            'date.format': 'End date must be in ISO format',
            'date.min': 'End date must be after start date'
        })
    }),

    // Create doctor
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
        // email: Joi.string().required().email().messages({
        //     'any.required': 'Email is required',
        //     'string.email': 'Invalid email format'
        // }),
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
        ).optional().messages({
            'array.min': 'At least one qualification is required'
        }),
        experience: Joi.number().integer().min(0).required().messages({
            'any.required': 'Experience is required',
            'number.min': 'Experience cannot be negative'
        }),
        isActive: Joi.boolean().default(true)
    }),

    // Update doctor
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
        // email: Joi.string().email().messages({
        //     'string.email': 'Invalid email format'
        // }),
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
        isActive: Joi.boolean()
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    }),

    // Get doctor by ID
    getById: Joi.object({
        id: objectId.required().messages({
            'any.required': 'Doctor ID is required',
            'string.pattern.base': 'Invalid doctor ID format'
        })
    }),

    // Delete doctor
    delete: Joi.object({
        id: objectId.required().messages({
            'any.required': 'Doctor ID is required',
            'string.pattern.base': 'Invalid doctor ID format'
        })
    }),

    // Add qualification
    addQualification: Joi.object({
        id: objectId.required().messages({
            'any.required': 'Doctor ID is required',
            'string.pattern.base': 'Invalid doctor ID format'
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
            'any.required': 'Doctor ID is required',
            'string.pattern.base': 'Invalid doctor ID format'
        }),
        qualificationId: objectId.required().messages({
            'any.required': 'Qualification ID is required',
            'string.pattern.base': 'Invalid qualification ID format'
        })
    })
};

// Validation schema for creating doctor
export const createDoctorSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required()
        .messages({
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters'
        }),
    specialization: Joi.string().trim().required()
        .messages({
            'string.empty': 'Specialization is required',
            'any.required': 'Specialization is required'
        }),
    licenseNumber: Joi.string().min(3).max(50).optional().messages({
        'string.min': 'License number must be at least 3 characters long',
        'string.max': 'License number cannot exceed 50 characters'
    }),
    contactNumber: Joi.string().pattern(/^\+?[\d\s-]{10,}$/).required()
        .messages({
            'string.pattern.base': 'Please provide a valid contact number',
            'any.required': 'Contact number is required'
        }),
    address: Joi.object({
        street: Joi.string().trim().optional(),
        city: Joi.string().trim().optional(),
        state: Joi.string().trim().optional(),
        postalCode: Joi.string().trim().optional(),
        country: Joi.string().trim().default('egypt').optional()
    }).optional(),
    experience: Joi.number().integer().min(0).optional().messages({
        'number.min': 'Experience cannot be negative'
    }),
    isActive: Joi.boolean().default(true).optional()
});

// Validation schema for updating doctor
export const updateDoctorSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    specialization: Joi.string().trim().optional(),
    phoneNumber: Joi.string().pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/).optional(),
    address: Joi.object({
        street: Joi.string().trim().optional(),
        city: Joi.string().trim().optional(),
        state: Joi.string().trim().optional(),
        postalCode: Joi.string().trim().optional(),
        country: Joi.string().trim().optional()
    }).optional()
});

// Validation schema for doctor ID parameter
export const doctorIdSchema = Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
        .messages({
            'string.pattern.base': 'Invalid doctor ID format',
            'any.required': 'Doctor ID is required'
        })
});

// Validation schema for doctor query parameters
export const doctorQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().trim().optional(),
    specialization: Joi.string().trim().optional(),
    sortBy: Joi.string().valid('name', 'specialization', 'totalPatientsReferred', 'totalScansReferred', 'createdAt').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Middleware to validate request body
export const validateDoctorBody = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            console.log("this is the Error", error)
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
export const validateDoctorParams = (req, res, next) => {
    const { error, value } = doctorIdSchema.validate(req.params, { abortEarly: false });

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
export const validateDoctorQuery = (req, res, next) => {
    const { error, value } = doctorQuerySchema.validate(req.query, { abortEarly: false });

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