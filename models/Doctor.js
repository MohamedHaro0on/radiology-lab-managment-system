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
        required: [true, 'License number is required'],
        unique: true,
        trim: true
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required'],
        match: [/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Please provide a valid contact number']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
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
            default: 'India'
        }
    },
    qualifications: [{
        degree: {
            type: String,
            required: true,
            trim: true
        },
        institution: {
            type: String,
            required: true,
            trim: true
        },
        year: {
            type: Number,
            required: true,
            min: [1900, 'Year must be after 1900'],
            max: [new Date().getFullYear(), 'Year cannot be in the future']
        }
    }],
    experience: {
        type: Number,
        min: [0, 'Experience cannot be negative'],
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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

// Indexes (only for non-unique fields)
doctorSchema.index({ name: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ isActive: 1 });
doctorSchema.index({ email: 1, isActive: 1 });

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

// Method to add qualification
doctorSchema.methods.addQualification = async function (qualification) {
    if (!qualification.degree || !qualification.institution || !qualification.year) {
        throw errors.BadRequest('Degree, institution, and year are required for qualification');
    }

    this.qualifications.push(qualification);
    await this.save();
    return this;
};

// Method to update qualification
doctorSchema.methods.updateQualification = async function (qualificationId, updates) {
    const qualification = this.qualifications.id(qualificationId);
    if (!qualification) {
        throw errors.NotFound('Qualification not found');
    }

    Object.assign(qualification, updates);
    await this.save();
    return this;
};

// Method to remove qualification
doctorSchema.methods.removeQualification = async function (qualificationId) {
    const qualification = this.qualifications.id(qualificationId);
    if (!qualification) {
        throw errors.NotFound('Qualification not found');
    }

    qualification.remove();
    await this.save();
    return this;
};

// Static method to find active doctors
doctorSchema.statics.findActive = function () {
    return this.find({ isActive: true });
};

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
            { licenseNumber: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
        ],
        isActive: true
    });
};

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor; 