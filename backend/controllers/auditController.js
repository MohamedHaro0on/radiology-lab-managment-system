import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import { errors } from '../utils/errorHandler.js';
import Audit from '../models/Audit.js';
import { executePaginatedQuery } from '../utils/pagination.js';

// Get all appointment audit logs with pagination and filtering
export const getAppointmentAuditLogs = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        action,
        userId,
        startDate,
        endDate
    } = req.query;

    // Build query for appointment audits only
    const query = { entity: 'Appointment' };

    // Filter by action (only if not empty)
    if (action && action.trim() !== '') {
        query.action = action;
    }

    // Filter by user (only if not empty)
    if (userId && userId.trim() !== '') {
        query.user = userId;
    }

    // Filter by date range (only if dates are provided and not empty)
    if ((startDate && startDate.trim() !== '') || (endDate && endDate.trim() !== '')) {
        query.createdAt = {};
        if (startDate && startDate.trim() !== '') {
            query.createdAt.$gte = new Date(startDate);
        }
        if (endDate && endDate.trim() !== '') {
            query.createdAt.$lte = new Date(endDate);
        }
    }

    // Execute paginated query with user population
    const result = await executePaginatedQuery(
        Audit,
        query,
        {
            page: parseInt(page),
            limit: parseInt(limit),
            sortBy: sortBy,
            sortOrder: sortOrder
        },
        [
            { path: 'user', select: 'username email' },
            { path: 'entityId', select: 'patientId radiologistId scheduledAt status', model: 'Appointment' }
        ]
    );

    // Format the audit logs for better readability
    const formattedLogs = result.data.audits.map(log => ({
        id: log._id,
        action: log.action,
        user: log.user ? {
            id: log.user._id,
            username: log.user.username,
            email: log.user.email
        } : null,
        appointment: log.entityId ? {
            id: log.entityId._id,
            scheduledAt: log.entityId.scheduledAt,
            status: log.entityId.status
        } : null,
        changes: log.changes,
        timestamp: log.createdAt,
        formattedTimestamp: new Date(log.createdAt).toLocaleString()
    }));

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: {
            logs: formattedLogs,
            pagination: result.data.pagination
        }
    });
});

// Get audit log statistics
export const getAuditStats = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    // Build date filter (only if dates are provided and not empty)
    const dateFilter = {};
    if ((startDate && startDate.trim() !== '') || (endDate && endDate.trim() !== '')) {
        dateFilter.createdAt = {};
        if (startDate && startDate.trim() !== '') dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate && endDate.trim() !== '') dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get action counts
    const actionStats = await Audit.aggregate([
        { $match: { entity: 'Appointment', ...dateFilter } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    // Get user activity counts
    const userStats = await Audit.aggregate([
        { $match: { entity: 'Appointment', ...dateFilter } },
        { $group: { _id: '$user', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'userInfo'
            }
        },
        { $unwind: '$userInfo' },
        {
            $project: {
                username: '$userInfo.username',
                email: '$userInfo.email',
                count: 1
            }
        }
    ]);

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: {
            actionStats,
            userStats,
            totalLogs: await Audit.countDocuments({ entity: 'Appointment', ...dateFilter })
        }
    });
});

// Get detailed audit log by ID
export const getAuditLogById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const auditLog = await Audit.findById(id)
        .populate('user', 'username email')
        .populate('entityId', 'patientId radiologistId scheduledAt status price cost');

    if (!auditLog) {
        throw errors.NotFound('Audit log not found');
    }

    if (auditLog.entity !== 'Appointment') {
        throw errors.BadRequest('This audit log is not for an appointment');
    }

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: auditLog
    });
}); 