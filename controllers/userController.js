import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import { errors } from '../utils/errorHandler.js';
import User from '../models/User.js';
import { executePaginatedQuery } from '../utils/pagination.js';

// Get all users with pagination and filtering
export const getAllUsers = asyncHandler(async (req, res) => {
    const { page, limit, sortBy, sortOrder, search, isActive, isSuperAdmin } = req.query;

    // Build query
    const query = {};
    if (search) {
        query.$or = [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }
    if (typeof isActive === 'boolean') query.isActive = isActive;
    if (typeof isSuperAdmin === 'boolean') query.isSuperAdmin = isSuperAdmin;

    // Execute paginated query
    const result = await executePaginatedQuery(User, query, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 },
        select: '-password -twoFactorSecret'
    });

    res.status(StatusCodes.OK).json(result);
});

// Get single user
export const getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
        .select('-password -twoFactorSecret')
        .populate('privileges.grantedBy', 'username email');

    if (!user) {
        throw errors.NotFound('User not found');
    }

    res.status(StatusCodes.OK).json(user);
});

// Update user
export const updateUser = asyncHandler(async (req, res) => {
    const { username, email, isActive, isSuperAdmin } = req.body;

    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
        throw errors.NotFound('User not found');
    }

    // Only super admin can modify super admin status
    if (typeof isSuperAdmin === 'boolean' && !req.user.isSuperAdmin) {
        throw errors.Forbidden('Only super admin can modify super admin status');
    }

    // Update user
    if (username) user.username = username;
    if (email) user.email = email;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (typeof isSuperAdmin === 'boolean' && req.user.isSuperAdmin) {
        user.isSuperAdmin = isSuperAdmin;
    }

    await user.save();

    // Return updated user without sensitive data
    const updatedUser = await User.findById(user._id)
        .select('-password -twoFactorSecret')
        .populate('privileges.grantedBy', 'username email');

    res.status(StatusCodes.OK).json(updatedUser);
});

// Delete user
export const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        throw errors.NotFound('User not found');
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user._id.toString()) {
        throw errors.BadRequest('Cannot delete your own account');
    }

    // Only super admin can delete super admin
    if (user.isSuperAdmin && !req.user.isSuperAdmin) {
        throw errors.Forbidden('Only super admin can delete super admin accounts');
    }

    await user.deleteOne();

    res.status(StatusCodes.OK).json({
        message: 'User deleted successfully'
    });
}); 