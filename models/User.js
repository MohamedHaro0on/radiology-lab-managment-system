import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'doctor', 'receptionist', 'technician'],
        required: true
    },
    twoFactorSecret: {
        type: String,
        required: false,
        select: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        console.log('DEBUG comparePassword - this.password:', this.password);
        console.log('DEBUG comparePassword - candidatePassword:', candidatePassword);
        const result = await bcrypt.compare(candidatePassword, this.password);
        console.log('DEBUG comparePassword - result:', result);
        return result;
    } catch (error) {
        console.error('DEBUG comparePassword - error:', error);
        throw error;
    }
};

// Generate 2FA secret
userSchema.methods.generateTwoFactorSecret = function () {
    const secret = speakeasy.generateSecret({
        name: `RadiologyLab:${this.email}`
    });

    this.twoFactorSecret = secret.base32;
    return secret;
};

// Verify 2FA token
userSchema.methods.verifyTwoFactorToken = function (token) {
    return speakeasy.totp.verify({
        secret: this.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 1 // Allow 30 seconds clock skew
    });
};

// Indexes for faster queries
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

export default User; 