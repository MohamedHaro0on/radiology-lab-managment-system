import mongoose from 'mongoose';
import { errors } from '../utils/errorHandler.js';

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Doctor name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    specialization: {
        type: String,
        required: [true, 'Specialization is required'],
        trim: true
    },
    licenseNumber: {
        type: String,
        trim: true, // Assuming it's not always required or can be optional
        minlength: [3, 'License number must be at least 3 characters long'],
        maxlength: [50, 'License number cannot exceed 50 characters']
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required'],
        match: [/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Please provide a valid contact number']
    },
    totalPatientsReferred: {
        type: Number,
        default: 0,
        min: [0, 'Total patients referred cannot be negative']
    },
    totalScansReferred: {
        type: Number,
        default: 0,
        min: [0, 'Total scans referred cannot be negative']
    },
    address: {
        street: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            trim: true
        },
        state: {
            type: String,
            trim: true
        },
        postalCode: {
            type: String,
            trim: true
        },
        country: {
            type: String,
            trim: true,
            default: 'Egypt'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    experience: {
        type: Number,
        default: 0,
        min: [0, 'Experience cannot be negative']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Making it optional if not always linked to a user creation
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    representative: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Representative',
        required: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
doctorSchema.index({ name: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ isActive: 1 });
doctorSchema.index({ contactNumber: 1, isActive: 1 });
doctorSchema.index({ licenseNumber: 1 }, { unique: true, sparse: true }); // Add unique index for licenseNumber
doctorSchema.index({ representative: 1 }); // Add index for representative

// Virtual for full address
doctorSchema.virtual('fullAddress').get(function () {
    const parts = [
        this.address?.street,
        this.address?.city,
        this.address?.state,
        this.address?.postalCode,
        this.address?.country
    ].filter(Boolean);

    return parts.join(', ');
});

// Method to increment total patients referred
doctorSchema.methods.incrementPatientsReferred = async function () {
    this.totalPatientsReferred += 1;
    await this.save();
    return this;
};

// Method to increment total scans referred
doctorSchema.methods.incrementScansReferred = async function () {
    this.totalScansReferred += 1;
    await this.save();
    return this;
};

// Static method to find active doctors
// doctorSchema.statics.findActive = function () {
//     return this.find({ isActive: true });
// };

// Static method to find doctors by specialization
doctorSchema.statics.findBySpecialization = function (specialization) {
    return this.find({
        specialization: { $regex: specialization, $options: 'i' },
        isActive: true
    });
};

// Static method to search doctors
doctorSchema.statics.search = function (query) {
    return this.find({
        $or: [
            { name: { $regex: query, $options: 'i' } },
            { specialization: { $regex: query, $options: 'i' } },
            { contactNumber: { $regex: query, $options: 'i' } },
            { licenseNumber: { $regex: query, $options: 'i' } }, // Add licenseNumber to search
            { representative: { $regex: query, $options: 'i' } } // Add representative to search
        ],
        isActive: true
    });
};

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor; 