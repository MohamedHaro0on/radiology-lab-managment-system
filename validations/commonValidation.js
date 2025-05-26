import Joi from 'joi';
import mongoose from 'mongoose';

// MongoDB ObjectId validation
export const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

// Pagination validation
export const pagination = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().pattern(/^[a-zA-Z0-9_]+:(asc|desc)$/).default('createdAt:desc')
});

// Search validation
export const search = Joi.object({
    query: Joi.string().min(1).max(100).required(),
    fields: Joi.array().items(Joi.string()).min(1).default(['name', 'description'])
});

// Date range validation
export const dateRange = Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
});

// Helper function to validate MongoDB ObjectId
export const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// Helper function to validate date range
export const isValidDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end;
};

// Helper function to validate pagination parameters
export const validatePagination = (page, limit) => {
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));
    return { page: validatedPage, limit: validatedLimit };
}; 