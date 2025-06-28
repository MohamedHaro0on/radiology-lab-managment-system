import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import { MODULES, OPERATIONS } from '../config/privileges.js';

const userId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    .messages({
        'string.pattern.base': 'Invalid user ID format',
        'any.required': 'User ID is required'
    });

const paginationSchema = {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('username', 'email', 'createdAt', 'lastLogin').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
};

export const userValidation = {
    getAllUsers: {
        query: Joi.object({
            ...paginationSchema,
            search: Joi.string().min(1).max(50),
            isActive: Joi.boolean(),
            isSuperAdmin: Joi.boolean()
        })
    },

    getUser: {
        params: Joi.object({
            id: userId
        })
    },

    updateUser: {
        params: Joi.object({
            id: userId
        }),
        body: Joi.object({
            username: Joi.string().min(3).max(30),
            email: Joi.string().email(),
            isActive: Joi.boolean(),
            isSuperAdmin: Joi.boolean()
        }).min(1).messages({
            'object.min': 'At least one field must be provided for update'
        })
    },

    deleteUser: {
        params: Joi.object({
            id: userId
        })
    },

    grantPrivileges: {
        body: Joi.object({
            module: Joi.string()
                .valid(...Object.keys(MODULES))
                .required()
                .messages({
                    'string.empty': 'Module is required',
                    'any.only': 'Invalid module name'
                }),
            operations: Joi.array()
                .items(Joi.string().valid(...OPERATIONS))
                .min(1)
                .required()
                .messages({
                    'array.min': 'At least one operation must be specified',
                    'any.only': 'Invalid operation'
                })
        })
    },

    revokePrivileges: {
        body: Joi.object({
            module: Joi.string()
                .valid(...Object.keys(MODULES))
                .required()
                .messages({
                    'string.empty': 'Module is required',
                    'any.only': 'Invalid module name'
                }),
            operations: Joi.array()
                .items(Joi.string().valid(...OPERATIONS))
                .messages({
                    'any.only': 'Invalid operation'
                })
        })
    }
}; 