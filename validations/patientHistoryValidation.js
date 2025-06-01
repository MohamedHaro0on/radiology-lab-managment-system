import Joi from 'joi';
import { objectId } from './commonValidation.js';

// Validation schemas for patient history
export const patientHistoryValidation = {
    // Create patient history
    create: Joi.object({
        patient: objectId.required().messages({
            'any.required': 'Patient ID is required',
            'string.pattern.base': 'Invalid patient ID format'
        }),
        diagnosis: Joi.string().required().min(3).max(1000).messages({
            'any.required': 'Diagnosis is required',
            'string.min': 'Diagnosis must be at least 3 characters long',
            'string.max': 'Diagnosis cannot exceed 1000 characters'
        }),
        treatment: Joi.string().required().min(3).max(1000).messages({
            'any.required': 'Treatment details are required',
            'string.min': 'Treatment details must be at least 3 characters long',
            'string.max': 'Treatment details cannot exceed 1000 characters'
        }),
        notes: Joi.string().max(2000).allow('').messages({
            'string.max': 'Notes cannot exceed 2000 characters'
        }),
        attachments: Joi.array().items(
            Joi.object({
                type: Joi.string().required().valid('image', 'document', 'scan').messages({
                    'any.required': 'Attachment type is required',
                    'any.only': 'Attachment type must be image, document, or scan'
                }),
                url: Joi.string().required().uri().messages({
                    'any.required': 'Attachment URL is required',
                    'string.uri': 'Invalid attachment URL format'
                }),
                description: Joi.string().max(200).allow('').messages({
                    'string.max': 'Description cannot exceed 200 characters'
                })
            })
        ).max(10).messages({
            'array.max': 'Cannot attach more than 10 files'
        })
    }),

    // Update patient history
    update: Joi.object({
        diagnosis: Joi.string().min(3).max(1000).messages({
            'string.min': 'Diagnosis must be at least 3 characters long',
            'string.max': 'Diagnosis cannot exceed 1000 characters'
        }),
        treatment: Joi.string().min(3).max(1000).messages({
            'string.min': 'Treatment details must be at least 3 characters long',
            'string.max': 'Treatment details cannot exceed 1000 characters'
        }),
        notes: Joi.string().max(2000).allow('').messages({
            'string.max': 'Notes cannot exceed 2000 characters'
        }),
        attachments: Joi.array().items(
            Joi.object({
                type: Joi.string().required().valid('image', 'document', 'scan').messages({
                    'any.required': 'Attachment type is required',
                    'any.only': 'Attachment type must be image, document, or scan'
                }),
                url: Joi.string().required().uri().messages({
                    'any.required': 'Attachment URL is required',
                    'string.uri': 'Invalid attachment URL format'
                }),
                description: Joi.string().max(200).allow('').messages({
                    'string.max': 'Description cannot exceed 200 characters'
                })
            })
        ).max(10).messages({
            'array.max': 'Cannot attach more than 10 files'
        })
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    }),

    // Get patient history by ID
    getById: Joi.object({
        id: objectId.required().messages({
            'any.required': 'Patient history ID is required',
            'string.pattern.base': 'Invalid patient history ID format'
        })
    }),

    // Get patient history by patient ID
    getByPatientId: Joi.object({
        patientId: objectId.required().messages({
            'any.required': 'Patient ID is required',
            'string.pattern.base': 'Invalid patient ID format'
        })
    }),

    // Delete patient history
    delete: Joi.object({
        id: objectId.required().messages({
            'any.required': 'Patient history ID is required',
            'string.pattern.base': 'Invalid patient history ID format'
        })
    }),

    // Add attachment to patient history
    addAttachment: Joi.object({
        id: objectId.required().messages({
            'any.required': 'Patient history ID is required',
            'string.pattern.base': 'Invalid patient history ID format'
        }),
        attachment: Joi.object({
            type: Joi.string().required().valid('image', 'document', 'scan').messages({
                'any.required': 'Attachment type is required',
                'any.only': 'Attachment type must be image, document, or scan'
            }),
            url: Joi.string().required().uri().messages({
                'any.required': 'Attachment URL is required',
                'string.uri': 'Invalid attachment URL format'
            }),
            description: Joi.string().max(200).allow('').messages({
                'string.max': 'Description cannot exceed 200 characters'
            })
        }).required().messages({
            'any.required': 'Attachment details are required'
        })
    }),

    // Remove attachment from patient history
    removeAttachment: Joi.object({
        id: objectId.required().messages({
            'any.required': 'Patient history ID is required',
            'string.pattern.base': 'Invalid patient history ID format'
        }),
        attachmentId: objectId.required().messages({
            'any.required': 'Attachment ID is required',
            'string.pattern.base': 'Invalid attachment ID format'
        })
    })
}; 