import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Branch name is required'],
        trim: true,
        unique: true,
        maxlength: [100, 'Branch name cannot exceed 100 characters']
    },
    location: {
        type: String,
        required: [true, 'Branch location is required'],
        trim: true,
        maxlength: [200, 'Location cannot exceed 200 characters']
    },
    address: {
        type: String,
        required: [true, 'Branch address is required'],
        trim: true,
        maxlength: [500, 'Address cannot exceed 500 characters']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    email: {
        type: String,
        required: [true, 'Email address is required'],
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    manager: {
        type: String,
        required: [true, 'Branch manager is required'],
        trim: true,
        maxlength: [100, 'Manager name cannot exceed 100 characters']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for branch info
branchSchema.virtual('info').get(function () {
    return {
        id: this._id,
        name: this.name,
        location: this.location,
        address: this.address,
        phone: this.phone,
        email: this.email,
        manager: this.manager,
        isActive: this.isActive,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
});

// Indexes for faster queries
// branchSchema.index({ name: 1 }); // Removed duplicate index
branchSchema.index({ location: 1 });
branchSchema.index({ isActive: 1 });
branchSchema.index({ manager: 1 });

const Branch = mongoose.model('Branch', branchSchema);

export default Branch; 