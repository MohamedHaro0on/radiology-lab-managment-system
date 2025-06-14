import Expense from '../models/Expense.js';
import { errors } from '../utils/errorHandler.js';
import { validatePrivilege } from '../config/privileges.js';
import { paginateResults, formatPaginatedResponse } from '../middleware/pagination.js';

// Create new expense
export const createExpense = async (req, res, next) => {
    try {
        const { user } = req;

        // Check if user has create privilege for expenses
        if (!user.hasPrivilege('expenses', 'create')) {
            throw errors.Forbidden('You do not have permission to create expenses');
        }

        const expenseData = {
            ...req.body,
            createdBy: user._id
        };

        const expense = new Expense(expenseData);
        await expense.save();

        res.status(201).json({
            success: true,
            message: 'Expense created successfully',
            data: expense.info
        });
    } catch (error) {
        next(error);
    }
};

// Get all expenses with pagination and filtering
export const getExpenses = async (req, res, next) => {
    try {
        const { user } = req;

        // Check if user has view privilege for expenses
        if (!user.hasPrivilege('expenses', 'view')) {
            throw errors.Forbidden('You do not have permission to view expenses');
        }

        const { pagination } = req;
        const { search, category, status, startDate, endDate } = req.query;

        // Build query
        const query = { isActive: true };

        // Add search filter
        if (search) {
            query.$or = [
                { reason: { $regex: search, $options: 'i' } },
                { requester: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Add category filter
        if (category) {
            query.category = category;
        }

        // Add status filter
        if (status) {
            query.status = status;
        }

        // Add date range filter
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // Use pagination helper
        const result = await paginateResults(Expense, query, {
            page: pagination.page,
            limit: pagination.limit,
            sortBy: pagination.sortBy,
            sortOrder: pagination.sortOrder === -1 ? 'desc' : 'asc',
            populate: [
                { path: 'createdBy', select: 'username' },
                { path: 'approvedBy', select: 'username' }
            ]
        });

        // Format response
        const response = formatPaginatedResponse(
            result.data.map(expense => expense.info),
            result.pagination,
            'Expenses retrieved successfully'
        );

        res.json(response);
    } catch (error) {
        next(error);
    }
};

// Get expense by ID
export const getExpenseById = async (req, res, next) => {
    try {
        const { user } = req;
        const { id } = req.params;

        // Check if user has view privilege for expenses
        if (!user.hasPrivilege('expenses', 'view')) {
            throw errors.Forbidden('You do not have permission to view expenses');
        }

        const expense = await Expense.findById(id)
            .populate('createdBy', 'username')
            .populate('approvedBy', 'username');

        if (!expense) {
            throw errors.NotFound('Expense not found');
        }

        res.json({
            success: true,
            data: expense.info
        });
    } catch (error) {
        next(error);
    }
};

// Update expense
export const updateExpense = async (req, res, next) => {
    try {
        const { user } = req;
        const { id } = req.params;

        // Check if user has update privilege for expenses
        if (!user.hasPrivilege('expenses', 'update')) {
            throw errors.Forbidden('You do not have permission to update expenses');
        }

        const expense = await Expense.findById(id);
        if (!expense) {
            throw errors.NotFound('Expense not found');
        }

        // Only allow updates if expense is not approved or paid
        if (expense.status === 'approved' || expense.status === 'paid') {
            throw errors.BadRequest('Cannot update approved or paid expenses');
        }

        const updateData = {
            ...req.body,
            updatedBy: user._id
        };

        Object.assign(expense, updateData);
        await expense.save();

        res.json({
            success: true,
            message: 'Expense updated successfully',
            data: expense.info
        });
    } catch (error) {
        next(error);
    }
};

// Delete expense (soft delete)
export const deleteExpense = async (req, res, next) => {
    try {
        const { user } = req;
        const { id } = req.params;

        // Check if user has delete privilege for expenses
        if (!user.hasPrivilege('expenses', 'delete')) {
            throw errors.Forbidden('You do not have permission to delete expenses');
        }

        const expense = await Expense.findById(id);
        if (!expense) {
            throw errors.NotFound('Expense not found');
        }

        expense.isActive = false;
        expense.updatedBy = user._id;
        await expense.save();

        res.json({
            success: true,
            message: 'Expense deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Approve expense
export const approveExpense = async (req, res, next) => {
    try {
        const { user } = req;
        const { id } = req.params;

        // Check if user has update privilege for expenses
        if (!user.hasPrivilege('expenses', 'update')) {
            throw errors.Forbidden('You do not have permission to approve expenses');
        }

        const expense = await Expense.findById(id);
        if (!expense) {
            throw errors.NotFound('Expense not found');
        }

        await expense.approve(user._id);

        res.json({
            success: true,
            message: 'Expense approved successfully',
            data: expense.info
        });
    } catch (error) {
        next(error);
    }
};

// Reject expense
export const rejectExpense = async (req, res, next) => {
    try {
        const { user } = req;
        const { id } = req.params;

        // Check if user has update privilege for expenses
        if (!user.hasPrivilege('expenses', 'update')) {
            throw errors.Forbidden('You do not have permission to reject expenses');
        }

        const expense = await Expense.findById(id);
        if (!expense) {
            throw errors.NotFound('Expense not found');
        }

        await expense.reject(user._id);

        res.json({
            success: true,
            message: 'Expense rejected successfully',
            data: expense.info
        });
    } catch (error) {
        next(error);
    }
};

// Mark expense as paid
export const markExpenseAsPaid = async (req, res, next) => {
    try {
        const { user } = req;
        const { id } = req.params;

        // Check if user has update privilege for expenses
        if (!user.hasPrivilege('expenses', 'update')) {
            throw errors.Forbidden('You do not have permission to mark expenses as paid');
        }

        const expense = await Expense.findById(id);
        if (!expense) {
            throw errors.NotFound('Expense not found');
        }

        await expense.markAsPaid(user._id);

        res.json({
            success: true,
            message: 'Expense marked as paid successfully',
            data: expense.info
        });
    } catch (error) {
        next(error);
    }
};

// Get expense statistics
export const getExpenseStats = async (req, res, next) => {
    try {
        const { user } = req;

        // Check if user has view privilege for expenses
        if (!user.hasPrivilege('expenses', 'view')) {
            throw errors.Forbidden('You do not have permission to view expense statistics');
        }

        const { startDate, endDate } = req.query;
        const query = { isActive: true };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const [
            totalExpenses,
            totalCost,
            pendingExpenses,
            approvedExpenses,
            paidExpenses,
            rejectedExpenses,
            categoryStats
        ] = await Promise.all([
            Expense.countDocuments(query),
            Expense.aggregate([
                { $match: query },
                { $group: { _id: null, total: { $sum: '$totalCost' } } }
            ]),
            Expense.countDocuments({ ...query, status: 'pending' }),
            Expense.countDocuments({ ...query, status: 'approved' }),
            Expense.countDocuments({ ...query, status: 'paid' }),
            Expense.countDocuments({ ...query, status: 'rejected' }),
            Expense.aggregate([
                { $match: query },
                { $group: { _id: '$category', count: { $sum: 1 }, total: { $sum: '$totalCost' } } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                totalExpenses,
                totalCost: totalCost[0]?.total || 0,
                pendingExpenses,
                approvedExpenses,
                paidExpenses,
                rejectedExpenses,
                categoryStats
            }
        });
    } catch (error) {
        next(error);
    }
}; 