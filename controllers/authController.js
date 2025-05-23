import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import { errors } from '../utils/errorHandler.js';
import User from '../models/User.js';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';

// Register new user (public endpoint – for testing only)
const register = asyncHandler(async (req, res) => {
    const { username, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (existingUser) {
        throw errors.Conflict('User with this email or username already exists');
    }

    // Generate 2FA secret during registration (for testing, we're not enforcing admin-only registration)
    const user = new User({
        username,
        email,
        password,
        role
    });

    // Generate and set 2FA secret
    const secret = user.generateTwoFactorSecret();
    await user.save();

    // Generate QR code for initial setup
    const otpauth = secret.otpauth_url;
    const qrCode = await QRCode.toDataURL(otpauth);

    res.status(StatusCodes.CREATED).json({
        status: 'success',
        message: 'User registered successfully (public endpoint – for testing). Please scan QR code to complete 2FA setup.',
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        },
        qrCode,
        secret: secret.base32
    });
});

// Login user
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    console.log('DEBUG Login attempt for:', email);

    // Find user and explicitly select password field
    const user = await User.findOne({ email }).select('+password +twoFactorSecret');
    console.log('DEBUG User found:', user ? 'yes' : 'no');
    console.log('DEBUG User document:', JSON.stringify(user, null, 2));

    if (!user) {
        throw errors.Unauthorized('Invalid credentials');
    }

    // Check password directly using bcrypt
    console.log('DEBUG About to compare passwords');
    console.log('DEBUG Candidate password:', password);
    console.log('DEBUG Stored password:', user.password);

    try {
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('DEBUG Password match:', isMatch);

        if (!isMatch) {
            throw errors.Unauthorized('Invalid credentials');
        }
    } catch (error) {
        console.error('DEBUG Password comparison error:', error);
        throw error;
    }

    // Check if user is active
    if (!user.isActive) {
        throw errors.Unauthorized('Account is inactive');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token (requires 2FA verification)
    const token = jwt.sign(
        {
            userId: user._id,
            role: user.role,
            twoFactorVerified: false
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Login successful, 2FA verification required',
        token,
        requiresTwoFactor: true,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }
    });
});

// Setup 2FA (Initial setup only)
const setupTwoFactor = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('+twoFactorSecret');

    // Generate new secret
    const secret = user.generateTwoFactorSecret();
    await user.save();

    // Generate QR code
    const otpauth = secret.otpauth_url;
    const qrCode = await QRCode.toDataURL(otpauth);

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Please scan QR code to complete 2FA setup.',
        secret: secret.base32,
        qrCode
    });
});

// Verify 2FA token
const verifyTwoFactor = asyncHandler(async (req, res) => {
    const { token } = req.body;
    const user = await User.findById(req.user._id).select('+twoFactorSecret');

    const isValid = user.verifyTwoFactorToken(token);
    if (!isValid) {
        throw errors.BadRequest('Invalid token');
    }

    // Generate new token with 2FA verified
    const newToken = jwt.sign(
        {
            userId: user._id,
            role: user.role,
            twoFactorVerified: true
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: '2FA verification successful',
        token: newToken,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }
    });
});

// Get current user profile
const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password -twoFactorSecret');
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
            role: user.role
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

export {
    register,
    login,
    setupTwoFactor,
    verifyTwoFactor,
    getProfile,
    updateProfile
}; 