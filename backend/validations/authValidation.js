import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import { MODULES, OPERATIONS } from '../config/privileges.js';

const passwordSchema = Joi.string()
    .min(8)
    .max(100)
    .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password cannot exceed 100 characters'
    });

export const authValidation = {
    register: {
        body: Joi.object({
            username: Joi.string()
                .min(3)
                .max(30)
                .required()
                .messages({
                    'string.min': 'Username must be at least 3 characters long',
                    'string.max': 'Username cannot exceed 30 characters',
                    'any.required': 'Username is required'
                }),
            name: Joi.string()
                .min(3)
                .max(100)
                .required()
                .messages({
                    'string.min': 'Name must be at least 3 characters long',
                    'string.max': 'Name cannot exceed 100 characters',
                    'any.required': 'Name is required'
                }),
            email: Joi.string()
                .email()
                .required()
                .messages({
                    'string.email': 'Please provide a valid email address',
                    'any.required': 'Email is required'
                }),
            password: passwordSchema.required(),
            role: Joi.string()
                .valid('doctor', 'receptionist', 'superAdmin', 'radiologist')
                .default('receptionist')
                .messages({
                    'any.only': "Role must be one of: doctor, receptionist, superAdmin, radiologist"
                }),
            // confirmPassword: Joi.string()
            // .valid(Joi.ref('password'))
            // .required()
            // .messages({
            // 'any.only': 'Passwords do not match',
            // 'any.required': 'Please confirm your password'
            // })
        })
    },

    login: {
        body: Joi.object({
            username: Joi.string()
                .required()
                .messages({
                    'any.required': 'Username is required'
                }),
            password: Joi.string()
                .required()
                .messages({
                    'any.required': 'Password is required'
                })
        })
    },

    refreshToken: {
        body: Joi.object({
            refreshToken: Joi.string()
                .required()
                .messages({
                    'any.required': 'Refresh token is required'
                })
        })
    },

    forgotPassword: {
        body: Joi.object({
            email: Joi.string()
                .email()
                .required()
                .messages({
                    'string.email': 'Please provide a valid email address',
                    'any.required': 'Email is required'
                })
        })
    },

    resetPassword: {
        body: Joi.object({
            token: Joi.string()
                .required()
                .messages({
                    'any.required': 'Reset token is required'
                }),
            password: passwordSchema.required(),
            // confirmPassword: Joi.string()
            //     .valid(Joi.ref('password'))
            //     .required()
            //     .messages({
            //         'any.only': 'Passwords do not match',
            //         'any.required': 'Please confirm your password'
            //     })
        })
    },

    changePassword: {
        body: Joi.object({
            currentPassword: Joi.string()
                .required()
                .messages({
                    'any.required': 'Current password is required'
                }),
            newPassword: passwordSchema.required(),
            confirmPassword: Joi.string()
                .valid(Joi.ref('newPassword'))
                .required()
                .messages({
                    'any.only': 'Passwords do not match',
                    'any.required': 'Please confirm your password'
                })
        })
    },

    enable2FA: {
        body: Joi.object({
            password: Joi.string()
                .required()
                .messages({
                    'any.required': 'Password is required for security verification'
                })
        })
    },

    verify2FA: {
        body: Joi.object({
            token: Joi.string()
                .length(6)
                .pattern(/^[0-9]+$/)
                .required()
                .messages({
                    'string.length': 'Token must be 6 digits',
                    'string.pattern.base': 'Token must contain only numbers',
                    'any.required': 'Token is required'
                })
        })
    },

    verifyLogin2FA: {
        body: Joi.object({
            token: Joi.string()
                .length(6)
                .pattern(/^[0-9]+$/)
                .required()
                .messages({
                    'string.length': 'Token must be 6 digits',
                    'string.pattern.base': 'Token must contain only numbers',
                    'any.required': 'Token is required'
                }),
            twoFactorToken: Joi.string()
                .required()
                .messages({
                    'any.required': 'Two-factor token is required'
                })
        })
    },

    disable2FA: {
        body: Joi.object({
            password: Joi.string()
                .required()
                .messages({
                    'any.required': 'Password is required for security verification'
                }),
            token: Joi.string()
                .length(6)
                .pattern(/^[0-9]+$/)
                .required()
                .messages({
                    'string.length': 'Token must be 6 digits',
                    'string.pattern.base': 'Token must contain only numbers',
                    'any.required': 'Token is required'
                })
        })
    },

    verifyEmail: {
        body: Joi.object({
            token: Joi.string()
                .required()
                .messages({
                    'any.required': 'Verification token is required'
                })
        })
    },

    updateProfile: {
        body: Joi.object({
            username: Joi.string()
                .min(3)
                .max(30)
                .trim()
                .messages({
                    'string.min': 'Username must be at least 3 characters long',
                    'string.max': 'Username cannot exceed 30 characters',
                    'string.empty': 'Username cannot be empty'
                }),
            email: Joi.string()
                .email()
                .trim()
                .lowercase()
                .messages({
                    'string.email': 'Please provide a valid email address',
                    'string.empty': 'Email cannot be empty'
                }),
            phoneNumber: Joi.string()
                .pattern(/^\+?[\d\s-]{10,}$/)
                .trim()
                .messages({
                    'string.pattern.base': 'Please provide a valid phone number'
                }),
            address: Joi.object({
                street: Joi.string().trim().max(200),
                city: Joi.string().trim().max(100),
                state: Joi.string().trim().max(100),
                country: Joi.string().trim().max(100),
                postalCode: Joi.string().trim().max(20)
            }),
            preferences: Joi.object({
                language: Joi.string().valid('en', 'ar').default('en'),
                theme: Joi.string().valid('light', 'dark', 'system').default('system'),
                notifications: Joi.object({
                    email: Joi.boolean().default(true),
                    push: Joi.boolean().default(true)
                })
            })
        }).min(1).messages({
            'object.min': 'At least one field must be provided for update'
        })
    },

    verifyRegistration2FA: {
        body: Joi.object({
            userId: Joi.string().required().messages({
                'any.required': 'User ID is required'
            }),
            token: Joi.string()
                .length(6)
                .pattern(/^[0-9]+$/)
                .required()
                .messages({
                    'string.length': 'Token must be 6 digits',
                    'string.pattern.base': 'Token must contain only numbers',
                    'any.required': 'Token is required'
                })
        })
    }
}; 