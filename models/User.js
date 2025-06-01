import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { errors } from '../utils/errorHandler.js';
import { MODULES, OPERATIONS, validatePrivilege } from '../config/privileges.js';

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
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false
    },
    phoneNumber: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s-]{10,}$/, 'Please provide a valid phone number']
    },
    address: {
        street: { type: String, trim: true, maxlength: 200 },
        city: { type: String, trim: true, maxlength: 100 },
        state: { type: String, trim: true, maxlength: 100 },
        country: { type: String, trim: true, maxlength: 100 },
        postalCode: { type: String, trim: true, maxlength: 20 }
    },
    preferences: {
        language: {
            type: String,
            enum: ['en', 'ar'],
            default: 'en'
        },
        theme: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'system'
        },
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true }
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isSuperAdmin: {
        type: Boolean,
        default: false
    },
    privileges: [{
        module: {
            type: String,
            required: true,
            enum: Object.keys(MODULES)
        },
        operations: [{
            type: String,
            enum: OPERATIONS
        }],
        grantedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        grantedAt: {
            type: Date,
            default: Date.now
        }
    }],
    twoFactorSecret: {
        type: String,
        select: false
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date
    },
    passwordChangedAt: {
        type: Date
    },
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        select: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes (only for non-unique fields)
userSchema.index({ 'privileges.module': 1, 'privileges.operations': 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isSuperAdmin: 1 });

// Virtual for full user info (excluding sensitive data)
userSchema.virtual('info').get(function () {
    return {
        id: this._id,
        username: this.username,
        email: this.email,
        isActive: this.isActive,
        isSuperAdmin: this.isSuperAdmin,
        privileges: this.privileges,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
});

// Pre-save middleware to hash password
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

// Pre-save middleware to update passwordChangedAt
userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after password change
    next();
});

// Method to check if password is correct
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw errors.InternalServerError('Error comparing passwords');
    }
};

// Method to check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Method to check if user has privilege
userSchema.methods.hasPrivilege = function (module, operation) {
    if (this.isSuperAdmin) return true;

    // Validate module and operation first
    if (!MODULES[module]) {
        throw new Error(`Invalid module: ${module}`);
    }
    if (!OPERATIONS.includes(operation)) {
        throw new Error(`Invalid operation: ${operation}`);
    }

    // Check if user has the privilege
    const privilege = this.privileges.find(p => p.module === module);
    return privilege?.operations.includes(operation) || false;
};

// Method to grant privilege
userSchema.methods.grantPrivilege = async function (module, operations, grantedBy) {
    if (!this.isActive) {
        throw errors.BadRequest('Cannot grant privileges to inactive user');
    }

    try {
        // Validate module and operations
        validatePrivilege(module, operations[0]); // Check first operation to validate module
        operations.forEach(op => validatePrivilege(module, op));

        const existingPrivilege = this.privileges.find(p => p.module === module);
        if (existingPrivilege) {
            existingPrivilege.operations = [...new Set([...existingPrivilege.operations, ...operations])];
            existingPrivilege.grantedBy = grantedBy;
            existingPrivilege.grantedAt = Date.now();
        } else {
            this.privileges.push({
                module,
                operations,
                grantedBy,
                grantedAt: Date.now()
            });
        }

        await this.save();
        return this;
    } catch (error) {
        throw errors.BadRequest(error.message);
    }
};

// Method to revoke privilege
userSchema.methods.revokePrivilege = async function (module, operations) {
    try {
        if (operations) {
            // Validate module and operations
            validatePrivilege(module, operations[0]); // Check first operation to validate module
            operations.forEach(op => validatePrivilege(module, op));
        } else {
            validatePrivilege(module, 'view'); // Just validate module exists
        }

        const privilege = this.privileges.find(p => p.module === module);
        if (!privilege) {
            throw errors.NotFound(`No privileges found for module: ${module}`);
        }

        if (operations) {
            privilege.operations = privilege.operations.filter(op => !operations.includes(op));
            if (privilege.operations.length === 0) {
                this.privileges = this.privileges.filter(p => p.module !== module);
            }
        } else {
            this.privileges = this.privileges.filter(p => p.module !== module);
        }

        await this.save();
        return this;
    } catch (error) {
        throw errors.BadRequest(error.message);
    }
};

// Static method to find user by credentials
userSchema.statics.findByCredentials = async function (email, password) {
    const user = await this.findOne({ email }).select('+password');
    if (!user) {
        throw errors.Unauthorized('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw errors.Unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
        throw errors.Forbidden('Account is inactive');
    }

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    return user;
};

// Default privileges for new users (view privileges for stock, appointments, doctors, patients)
const DEFAULT_VIEW_PRIVILEGES = [
    { module: 'stock', operations: ['view'] },
    { module: 'appointments', operations: ['view'] },
    { module: 'doctors', operations: ['view'] },
    { module: 'patients', operations: ['view'] }
];

// Pre-save hook: grant default view privileges to new users (granted by the user's own _id)
userSchema.pre('save', function (next) {
    if (this.isNew && (!this.privileges || this.privileges.length === 0)) {
        this.privileges = DEFAULT_VIEW_PRIVILEGES.map(priv => ({
            ...priv,
            grantedBy: this._id,
            grantedAt: new Date()
        }));
    }
    next();
});

const User = mongoose.model('User', userSchema);

export default User; 