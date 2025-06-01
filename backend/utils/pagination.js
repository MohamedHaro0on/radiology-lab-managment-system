import { StatusCodes } from 'http-status-codes';
import { errors } from './errorHandler.js';

/**
 * @desc    Creates pagination options and metadata for MongoDB queries
 * @param   {Object} query - MongoDB query object
 * @param   {Object} options - Pagination options
 * @param   {number} options.page - Page number (default: 1)
 * @param   {number} options.limit - Items per page (default: 10)
 * @param   {string} options.sortBy - Field to sort by (default: 'createdAt')
 * @param   {string} options.sortOrder - Sort order ('asc' or 'desc', default: 'desc')
 * @returns {Object} Pagination options and metadata
 */
export const createPaginationOptions = (query, options = {}) => {
    const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = options;

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Create sort object
    const sort = {
        [sortBy]: sortOrder === 'asc' ? 1 : -1
    };

    return {
        query,
        options: {
            skip,
            limit: parseInt(limit),
            sort
        },
        metadata: {
            page: parseInt(page),
            limit: parseInt(limit)
        }
    };
};

/**
 * @desc    Creates paginated response with metadata
 * @param   {Array} data - Array of documents
 * @param   {number} total - Total number of documents
 * @param   {Object} metadata - Pagination metadata
 * @returns {Object} Paginated response object
 */
export const createPaginatedResponse = (data, total, metadata) => {
    const { page, limit } = metadata;
    const pages = Math.ceil(total / limit);

    return {
        status: 'success',
        data,
        pagination: {
            total,
            page,
            limit,
            pages,
            hasNext: page < pages,
            hasPrev: page > 1
        }
    };
};

// Helper function to get model name in plural form
const getModelName = (Model) => {
    return Model.modelName.toLowerCase() + 's';
};

// Execute paginated query with optional population
export const executePaginatedQuery = async (
    Model,
    query = {},
    options = {},
    populate = []
) => {
    const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        select = '-__v'
    } = options;

    // Validate pagination parameters
    if (page < 1) {
        throw errors.BadRequest('Page number must be greater than 0');
    }
    if (limit < 1 || limit > 100) {
        throw errors.BadRequest('Limit must be between 1 and 100');
    }

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Execute query with pagination
    const [total, data] = await Promise.all([
        Model.countDocuments(query),
        Model.find(query)
            .select(select)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate(populate)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Get model name for response
    const modelName = getModelName(Model);

    return {
        status: 'success',
        data: {
            [modelName]: data,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages,
                hasNextPage,
                hasPrevPage
            }
        }
    };
};

/**
 * Create a pagination middleware
 * @param {Object} defaultOptions - Default pagination options
 * @returns {Function} Express middleware
 */
export const paginationMiddleware = (defaultOptions = {}) => {
    return (req, res, next) => {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Parse and validate pagination parameters
        const parsedPage = parseInt(page);
        const parsedLimit = parseInt(limit);

        if (isNaN(parsedPage) || parsedPage < 1) {
            throw errors.BadRequest('Invalid page number');
        }
        if (isNaN(parsedLimit) || parsedLimit < 1) {
            throw errors.BadRequest('Invalid limit');
        }
        if (parsedLimit > 100) {
            throw errors.BadRequest('Limit cannot exceed 100 items per page');
        }

        // Set pagination options
        req.pagination = {
            page: parsedPage,
            limit: parsedLimit,
            sortBy,
            sortOrder: sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc',
            ...defaultOptions
        };

        next();
    };
}; 