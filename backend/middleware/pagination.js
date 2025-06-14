import Joi from 'joi';

// Default pagination schema
const defaultPaginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    search: Joi.string().trim().allow('').optional()
});

// Pagination middleware
export const paginate = (customSchema = {}) => {
    return (req, res, next) => {
        // Create the complete schema by merging default and custom schemas
        const schema = defaultPaginationSchema.keys(customSchema);

        const { error, value } = schema.validate(req.query, { abortEarly: false });

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Pagination validation error',
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }

        // Set pagination options
        req.pagination = {
            page: parseInt(value.page),
            limit: parseInt(value.limit),
            skip: (parseInt(value.page) - 1) * parseInt(value.limit),
            sortBy: value.sortBy,
            sortOrder: value.sortOrder === 'desc' ? -1 : 1,
            search: value.search && value.search.trim() ? value.search.trim() : undefined
        };

        // Set sort options
        req.sortOptions = {};
        req.sortOptions[value.sortBy] = value.sortOrder === 'desc' ? -1 : 1;

        next();
    };
};

// Generic pagination helper function
export const paginateResults = async (Model, query = {}, options = {}) => {
    const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        populate = [],
        select = null
    } = options;

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Build the query
    let dbQuery = Model.find(query);

    // Apply population if specified
    if (populate.length > 0) {
        populate.forEach(pop => {
            dbQuery = dbQuery.populate(pop);
        });
    }

    // Apply field selection if specified
    if (select) {
        dbQuery = dbQuery.select(select);
    }

    // Execute queries in parallel
    const [data, total] = await Promise.all([
        dbQuery
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean(),
        Model.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? page + 1 : null,
            prevPage: hasPrevPage ? page - 1 : null
        }
    };
};

// Response formatter for paginated results
export const formatPaginatedResponse = (data, pagination, message = 'Data retrieved successfully') => {
    return {
        success: true,
        message,
        data,
        pagination
    };
};

// Export default pagination schema for reuse
export const paginationSchema = defaultPaginationSchema; 