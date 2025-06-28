import express from 'express';
import {
    createExpense,
    getExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense,
    approveExpense,
    rejectExpense,
    markExpenseAsPaid,
    getExpenseStats
} from '../controllers/expenseController.js';
import { auth } from '../middleware/auth.js';
import { autoCheckPrivileges } from '../middleware/privilege.js';
import {
    validateExpenseBody,
    validateExpenseParams,
    validateExpenseQuery,
    validateExpenseStatsQuery,
    createExpenseSchema,
    updateExpenseSchema
} from '../validations/expenseValidation.js';
import { paginate } from '../middleware/pagination.js';
import Joi from 'joi';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);
router.use(autoCheckPrivileges);

// Create new expense
router.post('/', validateExpenseBody(createExpenseSchema), createExpense);

// Get all expenses with pagination and filtering
router.get('/', paginate({
    category: Joi.string().valid('operational', 'maintenance', 'supplies', 'utilities', 'salary', 'other').optional(),
    status: Joi.string().valid('pending', 'approved', 'rejected', 'paid').optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional()
}), getExpenses);

// Get expense statistics
router.get('/stats', validateExpenseStatsQuery, getExpenseStats);

// Get expense by ID
router.get('/:id', validateExpenseParams, getExpenseById);

// Update expense
router.put('/:id', validateExpenseParams, validateExpenseBody(updateExpenseSchema), updateExpense);

// Delete expense (soft delete)
router.delete('/:id', validateExpenseParams, deleteExpense);

// Approve expense
router.patch('/:id/approve', validateExpenseParams, approveExpense);

// Reject expense
router.patch('/:id/reject', validateExpenseParams, rejectExpense);

// Mark expense as paid
router.patch('/:id/mark-paid', validateExpenseParams, markExpenseAsPaid);

export default router; 