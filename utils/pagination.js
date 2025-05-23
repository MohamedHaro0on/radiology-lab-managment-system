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

/**
 * @desc    Executes a paginated query and returns formatted response
 * @param   {Object} Model - Mongoose model
 * @param   {Object} query - MongoDB query object
 * @param   {Object} options - Pagination options
 * @param   {Object} populateOptions - Options for populating references
 * @returns {Promise<Object>} Paginated response
 */
export const executePaginatedQuery = async (Model, query, options = {}, populateOptions = null) => {
    // Create pagination options
    const { query: finalQuery, options: paginationOptions, metadata } = createPaginationOptions(query, options);

    // Execute query with pagination
    let queryBuilder = Model.find(finalQuery)
        .skip(paginationOptions.skip)
        .limit(paginationOptions.limit)
        .sort(paginationOptions.sort);

    // Add population if specified
    if (populateOptions) {
        if (Array.isArray(populateOptions)) {
            queryBuilder = queryBuilder.populate(populateOptions);
        } else {
            queryBuilder = queryBuilder.populate(populateOptions);
        }
    }

    // Execute query and get total count in parallel
    const [data, total] = await Promise.all([
        queryBuilder.exec(),
        Model.countDocuments(finalQuery)
    ]);

    // Return formatted response
    return createPaginatedResponse(data, total, metadata);
}; 