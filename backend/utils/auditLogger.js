import Audit from '../models/Audit.js';

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @param {string} params.action - The action performed (CREATE, UPDATE, DELETE, etc.)
 * @param {string} params.entityType - The type of entity being audited
 * @param {string} params.entityId - The ID of the entity being audited
 * @param {string} params.userId - The ID of the user performing the action
 * @param {Object} params.details - Additional details about the action
 * @returns {Promise<Object>} The created audit log entry
 */
export const createAuditLog = async (params) => {
    try {
        const { action, entityType, entityId, userId, details } = params;

        const auditLog = new Audit({
            action,
            entityType,
            entityId,
            userId,
            details,
            timestamp: new Date()
        });

        await auditLog.save();
        return auditLog;
    } catch (error) {
        console.error('Error creating audit log:', error);
        // Don't throw error to avoid breaking the main operation
        return null;
    }
};

/**
 * Get audit logs with pagination and filtering
 * @param {Object} filters - Filter criteria
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} Paginated audit logs
 */
export const getAuditLogs = async (filters = {}, pagination = {}) => {
    try {
        const { page = 1, limit = 10, sortBy = 'timestamp', sortOrder = 'desc' } = pagination;
        const { entityType, entityId, userId, action, startDate, endDate } = filters;

        const query = {};

        if (entityType) query.entityType = entityType;
        if (entityId) query.entityId = entityId;
        if (userId) query.userId = userId;
        if (action) query.action = action;

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (page - 1) * limit;

        const [auditLogs, total] = await Promise.all([
            Audit.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .populate('userId', 'username email')
                .lean(),
            Audit.countDocuments(query)
        ]);

        return {
            data: auditLogs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error('Error getting audit logs:', error);
        throw error;
    }
};

/**
 * Get audit logs for a specific entity
 * @param {string} entityType - The type of entity
 * @param {string} entityId - The ID of the entity
 * @returns {Promise<Array>} Array of audit logs
 */
export const getEntityAuditLogs = async (entityType, entityId) => {
    try {
        const auditLogs = await Audit.find({
            entityType,
            entityId
        })
            .sort({ timestamp: -1 })
            .populate('userId', 'username email')
            .lean();

        return auditLogs;
    } catch (error) {
        console.error('Error getting entity audit logs:', error);
        throw error;
    }
}; 