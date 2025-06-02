import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import { errors } from '../utils/errorHandler.js';
import User from '../models/User.js';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import { sendPasswordResetEmail } from '../services/emailService.js';

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
};

// Register new user
export const register = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        throw errors.Conflict('User with this email or username already exists');
    }

    // Create user
    const user = await User.create({
        username,
        email,
        password,
        createdBy: req.user?._id // If registering through admin
    });

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Return user info and tokens
    res.status(StatusCodes.CREATED).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            token
        }
    });
});

// Login user
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user and check password
    const user = await User.findByCredentials(email, password);

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Return user info and tokens
    res.json({
        user: user.info,
        token,
        refreshToken
    });
});

// Refresh token
export const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Check if user exists
        const user = await User.findById(decoded.id);
        if (!user || !user.isActive) {
            throw errors.Unauthorized('Invalid refresh token');
        }

        // Generate new tokens
        const newToken = generateToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);

        res.json({
            token: newToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        throw errors.Unauthorized('Invalid refresh token');
    }
});

// Logout user
export const logout = asyncHandler(async (req, res) => {
    // In a real application, you might want to blacklist the token
    // For now, we'll just send a success response
    res.json({ message: 'Logged out successfully' });
});

// Forgot password
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
        // Don't reveal that the user doesn't exist
        return res.json({ message: 'If your email is registered, you will receive a password reset link' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    // Save reset token
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save({ validateBeforeSave: false });

    try {
        // Send reset email
        await sendPasswordResetEmail(user.email, resetToken);

        res.json({
            message: 'If your email is registered, you will receive a password reset link'
        });
    } catch (error) {
        // If email sending fails, remove the reset token
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        throw errors.InternalServerError('Error sending reset email. Please try again later.');
    }
});

// Reset password
export const resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user
        const user = await User.findById(decoded.id);
        if (!user || user.passwordResetToken !== token || user.passwordResetExpires < Date.now()) {
            throw errors.BadRequest('Invalid or expired reset token');
        }

        // Update password
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // Generate new tokens
        const newToken = generateToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);

        res.json({
            message: 'Password reset successful',
            token: newToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        // Log the specific error for debugging
        console.error('Reset password token verification failed:', error);
        throw errors.BadRequest('Invalid or expired reset token');
    }
});

// Change password
export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        throw errors.BadRequest('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
});

// Enable 2FA
export const enable2FA = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const user = req.user;

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw errors.BadRequest('Password is incorrect');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
        name: `RadiologyLab:${user.email}`
    });

    // Save secret
    user.twoFactorSecret = secret.base32;
    await user.save({ validateBeforeSave: false });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
        secret: secret.base32,
        qrCode
    });
});

// Verify 2FA
export const verify2FA = asyncHandler(async (req, res) => {
    const { token } = req.body;
    const user = req.user;

    // Verify token
    const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token
    });

    if (!verified) {
        throw errors.BadRequest('Invalid token');
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    await user.save();

    res.json({ message: '2FA enabled successfully' });
});

// Disable 2FA
export const disable2FA = asyncHandler(async (req, res) => {
    const { password, token } = req.body;
    const user = req.user;

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw errors.BadRequest('Password is incorrect');
    }

    // Verify token
    const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token
    });

    if (!verified) {
        throw errors.BadRequest('Invalid token');
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    res.json({ message: '2FA disabled successfully' });
});

// Get current user profile
const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .select('-password -twoFactorSecret')
        .populate('privileges.grantedBy', 'username email');

    if (!user) {
        throw errors.NotFound('User not found');
    }

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: user
    });
});

// Update user profile
const updateProfile = asyncHandler(async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['username', 'email', 'password'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        throw errors.BadRequest('Invalid updates');
    }

    const user = req.user;
    updates.forEach(update => user[update] = req.body[update]);
    await user.save();

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Profile updated successfully',
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            isSuperAdmin: user.isSuperAdmin
        }
    });
});

// Get all users (admin only)
export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}, '-password -twoFactorSecret');
    res.status(StatusCodes.OK).json({ status: 'success', data: users });
});

// Get user by ID (admin only)
export const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id, '-password -twoFactorSecret');
    if (!user) throw errors.NotFound('User not found');
    res.status(StatusCodes.OK).json({ status: 'success', data: user });
});

// Verify email
export const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.body;

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user
        const user = await User.findById(decoded.id);
        if (!user) {
            throw errors.BadRequest('Invalid verification token');
        }

        // Check if email is already verified
        if (user.isEmailVerified) {
            return res.json({ message: 'Email is already verified' });
        }

        // Update user
        user.isEmailVerified = true;
        await user.save();

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        throw errors.BadRequest('Invalid or expired verification token');
    }
});

// Get current user
export const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .select('-password -twoFactorSecret')
        .populate('privileges.grantedBy', 'username email');

    if (!user) {
        throw errors.NotFound('User not found');
    }

    res.json({
        user: user.info
    });
});

// Update user by ID (admin only)
export const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = Object.keys(req.body);
    const allowedUpdates = ['username', 'email', 'isActive'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        throw errors.BadRequest('Invalid updates');
    }

    const user = await User.findById(id);
    if (!user) {
        throw errors.NotFound('User not found');
    }

    // Don't allow updating super admin status through this endpoint
    if (user.isSuperAdmin && !req.user.isSuperAdmin) {
        throw errors.Forbidden('Cannot update super admin user');
    }

    updates.forEach(update => user[update] = req.body[update]);
    await user.save();

    res.json({
        message: 'User updated successfully',
        user: user.info
    });
});

// Delete user by ID (admin only)
export const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
        throw errors.NotFound('User not found');
    }

    // Don't allow deleting super admin
    if (user.isSuperAdmin) {
        throw errors.Forbidden('Cannot delete super admin user');
    }

    // Don't allow deleting self
    if (user._id.equals(req.user._id)) {
        throw errors.Forbidden('Cannot delete your own account');
    }

    await user.deleteOne();

    res.json({
        message: 'User deleted successfully'
    });
});

export {
    getProfile,
    updateProfile
}; 