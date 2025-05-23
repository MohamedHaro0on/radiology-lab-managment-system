import Joi from 'joi';

const doctorValidation = {
    // Create doctor validation
    createDoctor: Joi.object({
        body: Joi.object({
            name: Joi.string().required().trim().min(2).max(100)
                .messages({
                    'string.empty': 'Doctor name is required',
                    'string.min': 'Doctor name must be at least 2 characters long',
                    'string.max': 'Doctor name cannot exceed 100 characters'
                }),
            email: Joi.string().required().email().trim().lowercase()
                .messages({
                    'string.empty': 'Email is required',
                    'string.email': 'Please enter a valid email address'
                }),
            contactNumber: Joi.string().required().trim().pattern(/^[0-9+\-\s()]{10,15}$/)
                .messages({
                    'string.empty': 'Contact number is required',
                    'string.pattern.base': 'Please enter a valid contact number'
                }),
            specialization: Joi.string().required().trim().min(2).max(100)
                .messages({
                    'string.empty': 'Specialization is required',
                    'string.min': 'Specialization must be at least 2 characters long',
                    'string.max': 'Specialization cannot exceed 100 characters'
                }),
            licenseNumber: Joi.string().required().trim().min(5).max(20)
                .messages({
                    'string.empty': 'License number is required',
                    'string.min': 'License number must be at least 5 characters long',
                    'string.max': 'License number cannot exceed 20 characters'
                })
        })
    }),

    // Update doctor validation
    updateDoctor: Joi.object({
        params: Joi.object({
            id: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/)
                .messages({
                    'string.empty': 'Doctor ID is required',
                    'string.pattern.base': 'Invalid doctor ID format'
                })
        }),
        body: Joi.object({
            name: Joi.string().trim().min(2).max(100),
            email: Joi.string().email().trim().lowercase(),
            contactNumber: Joi.string().trim().pattern(/^[0-9+\-\s()]{10,15}$/),
            specialization: Joi.string().trim().min(2).max(100),
            licenseNumber: Joi.string().trim().min(5).max(20),
            isActive: Joi.boolean()
        }).min(1).messages({
            'object.min': 'At least one field must be provided for update'
        })
    }),

    // Get doctor validation
    getDoctor: Joi.object({
        params: Joi.object({
            id: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/)
                .messages({
                    'string.empty': 'Doctor ID is required',
                    'string.pattern.base': 'Invalid doctor ID format'
                })
        })
    }),

    // List doctors validation
    listDoctors: Joi.object({
        query: Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            search: Joi.string().trim().min(1).max(100),
            specialization: Joi.string().trim(),
            sortBy: Joi.string().valid('name', 'referralCount', 'createdAt').default('name'),
            sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
            isActive: Joi.boolean()
        })
    }),

    // Delete doctor validation
    deleteDoctor: Joi.object({
        params: Joi.object({
            id: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/)
                .messages({
                    'string.empty': 'Doctor ID is required',
                    'string.pattern.base': 'Invalid doctor ID format'
                })
        })
    })
};

export default doctorValidation; 