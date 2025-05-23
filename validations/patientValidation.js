import Joi from 'joi';

export const patientValidation = {
    createPatient: {
        body: Joi.object({
            firstName: Joi.string().required().trim().messages({
                'string.empty': 'First name is required',
                'any.required': 'First name is required'
            }),
            lastName: Joi.string().required().trim().messages({
                'string.empty': 'Last name is required',
                'any.required': 'Last name is required'
            }),
            email: Joi.string().required().email().trim().lowercase().messages({
                'string.email': 'Please provide a valid email address',
                'string.empty': 'Email is required',
                'any.required': 'Email is required'
            }),
            phoneNumber: Joi.string().required().trim().messages({
                'string.empty': 'Phone number is required',
                'any.required': 'Phone number is required'
            }),
            dateOfBirth: Joi.date().required().max('now').messages({
                'date.base': 'Please provide a valid date of birth',
                'date.max': 'Date of birth cannot be in the future',
                'any.required': 'Date of birth is required'
            }),
            gender: Joi.string().required().valid('male', 'female', 'other').messages({
                'any.only': 'Gender must be male, female, or other',
                'any.required': 'Gender is required'
            }),
            address: Joi.object({
                street: Joi.string().trim(),
                city: Joi.string().trim(),
                state: Joi.string().trim(),
                zipCode: Joi.string().trim(),
                country: Joi.string().trim()
            })
        })
    },

    getAllPatients: {
        query: Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            search: Joi.string().trim(),
            gender: Joi.string().valid('male', 'female', 'other'),
            sortBy: Joi.string().valid('firstName', 'lastName', 'email', 'createdAt').default('createdAt'),
            sortOrder: Joi.string().valid('asc', 'desc').default('desc')
        })
    },

    getPatient: {
        params: Joi.object({
            id: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/).messages({
                'string.pattern.base': 'Invalid patient ID format',
                'any.required': 'Patient ID is required'
            })
        })
    },

    updatePatient: {
        params: Joi.object({
            id: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/).messages({
                'string.pattern.base': 'Invalid patient ID format',
                'any.required': 'Patient ID is required'
            })
        }),
        body: Joi.object({
            firstName: Joi.string().trim(),
            lastName: Joi.string().trim(),
            email: Joi.string().email().trim().lowercase().messages({
                'string.email': 'Please provide a valid email address'
            }),
            phoneNumber: Joi.string().trim(),
            dateOfBirth: Joi.date().max('now').messages({
                'date.base': 'Please provide a valid date of birth',
                'date.max': 'Date of birth cannot be in the future'
            }),
            gender: Joi.string().valid('male', 'female', 'other'),
            address: Joi.object({
                street: Joi.string().trim(),
                city: Joi.string().trim(),
                state: Joi.string().trim(),
                zipCode: Joi.string().trim(),
                country: Joi.string().trim()
            })
        }).min(1).messages({
            'object.min': 'At least one field must be provided for update'
        })
    },

    deletePatient: {
        params: Joi.object({
            id: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/).messages({
                'string.pattern.base': 'Invalid patient ID format',
                'any.required': 'Patient ID is required'
            })
        })
    }
};

export const medicalHistoryValidation = {
    addMedicalHistory: {
        params: Joi.object({
            patientId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/).messages({
                'string.pattern.base': 'Invalid patient ID format',
                'any.required': 'Patient ID is required'
            })
        }),
        body: Joi.object({
            condition: Joi.string().required().trim().messages({
                'string.empty': 'Medical condition is required',
                'any.required': 'Medical condition is required'
            }),
            diagnosis: Joi.string().required().trim().messages({
                'string.empty': 'Diagnosis is required',
                'any.required': 'Diagnosis is required'
            }),
            treatment: Joi.string().required().trim().messages({
                'string.empty': 'Treatment is required',
                'any.required': 'Treatment is required'
            }),
            date: Joi.date().required().max('now').messages({
                'date.base': 'Please provide a valid date',
                'date.max': 'Date cannot be in the future',
                'any.required': 'Date is required'
            }),
            notes: Joi.string().trim(),
            attachments: Joi.array().items(Joi.string().trim())
        })
    },

    getMedicalHistory: {
        params: Joi.object({
            patientId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/).messages({
                'string.pattern.base': 'Invalid patient ID format',
                'any.required': 'Patient ID is required'
            })
        }),
        query: Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            sortBy: Joi.string().valid('date', 'createdAt').default('date'),
            sortOrder: Joi.string().valid('asc', 'desc').default('desc')
        })
    }
};

export default {
    patientValidation,
    medicalHistoryValidation
}; 