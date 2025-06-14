import mongoose from 'mongoose';
import { errors } from '../utils/errorHandler.js';

const radiologistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Radiologist name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: {
            values: ['male', 'female', 'other'],
            message: 'Gender must be either male, female, or other'
        }
    },
    age: {
        type: Number,
        required: [true, 'Age is required'],
        min: [18, 'Age must be at least 18'],
        max: [150, 'Age cannot exceed 150']
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Please provide a valid phone number']
    },
    licenseId: {
        type: String,
        required: [true, 'License ID is required'],
        unique: true,
        trim: true,
        minlength: [5, 'License ID must be at least 5 characters long'],
        maxlength: [20, 'License ID cannot exceed 20 characters']
    },
    totalScansPerformed: {
        type: Number,
        default: 0,
        min: [0, 'Total scans performed cannot be negative']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for faster queries
radiologistSchema.index({ name: 1 });
radiologistSchema.index({ gender: 1 });
radiologistSchema.index({ isActive: 1 });
radiologistSchema.index({ phoneNumber: 1, isActive: 1 });
radiologistSchema.index({ licenseId: 1, isActive: 1 });

// Method to increment total scans performed
radiologistSchema.methods.incrementScansPerformed = async function () {
    this.totalScansPerformed += 1;
    await this.save();
    return this;
};

// Static method to find active radiologists
radiologistSchema.statics.findActive = function () {
    return this.find({ isActive: true });
};

// Static method to search radiologists
radiologistSchema.statics.search = function (query) {
    return this.find({
        $or: [
            { name: { $regex: query, $options: 'i' } },
            { phoneNumber: { $regex: query, $options: 'i' } },
            { licenseId: { $regex: query, $options: 'i' } }
        ],
        isActive: true
    });
};

const Radiologist = mongoose.model('Radiologist', radiologistSchema);

export default Radiologist; 