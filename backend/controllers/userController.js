import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import { errors } from '../utils/errorHandler.js';
import User from '../models/User.js';
import { executePaginatedQuery } from '../utils/pagination.js';

// Get all users with pagination and filtering
export const getAllUsers = asyncHandler(async (req, res) => {
    const { page, limit, sortBy, sortOrder, search, isActive, isSuperAdmin, role } = req.query;

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
    if (role) query.userType = role;

    // Execute paginated query
    const result = await executePaginatedQuery(User, query, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 },
        select: '-password -twoFactorSecret'
    });

    // Return the correct format that frontend expects
    res.status(StatusCodes.OK).json({
        status: 'success',
        data: result.data.users || result.data,
        pagination: result.data.pagination
    });
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
    const { username, name, email, isActive, isSuperAdmin } = req.body;

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
    if (name) user.name = name;
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

// Grant privileges
export const grantPrivileges = asyncHandler(async (req, res) => {
    const { module, operations } = req.body;
    const { id: userId } = req.params;

    // Only super admin can grant privileges
    if (!req.user.isSuperAdmin) {
        throw errors.Forbidden('Only super admins can grant privileges');
    }

    const user = await User.findById(userId);
    if (!user) {
        throw errors.NotFound('User not found');
    }

    await user.grantPrivilege(module, operations, req.user._id);
    await user.save();

    res.status(StatusCodes.OK).json({
        message: 'Privileges granted successfully',
        privileges: user.privileges
    });
});

// Revoke privileges
export const revokePrivileges = asyncHandler(async (req, res) => {
    const { module, operations } = req.body;
    const { id: userId } = req.params;

    // Only super admin can revoke privileges
    if (!req.user.isSuperAdmin) {
        throw errors.Forbidden('Only super admins can revoke privileges');
    }

    const user = await User.findById(userId);
    if (!user) {
        throw errors.NotFound('User not found');
    }

    await user.revokePrivilege(module, operations);
    await user.save();

    res.status(StatusCodes.OK).json({
        message: 'Privileges revoked successfully',
        privileges: user.privileges
    });
}); 