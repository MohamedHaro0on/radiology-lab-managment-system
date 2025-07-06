import mongoose from 'mongoose';
import { errors } from '../utils/errorHandler.js';

const patientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Patient name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required'],
        max: [new Date(), 'Date of birth cannot be in the future']
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: {
            values: ['male', 'female', 'other'],
            message: 'Gender must be either male, female, or other'
        }
    },
    phoneNumber: {
        type: String,
        required: false,
        match: [/^(|\+20\d{10})$/, 'Please provide a valid phone number (+20 followed by 10 digits)']
    },
    socialNumber: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
        trim: true,
        minlength: [5, 'Social number must be at least 5 characters long'],
        maxlength: [20, 'Social number cannot exceed 20 characters']
    },
    doctorReferred: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: [true, 'Doctor referral is required']
    },
    representative: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Representative',
        required: false
    },
    medicalHistory: [{
        type: String,
        trim: true
    }],
    scansHistory: [{
        scan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Scan',
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'cancelled'],
            default: 'pending'
        },
        notes: {
            type: String,
            trim: true
        }
    }],
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
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
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

// Virtual for age calculation
patientSchema.virtual('age').get(function () {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
});

// Indexes (only for non-unique fields)
patientSchema.index({ name: 1 });
patientSchema.index({ gender: 1 });
patientSchema.index({ isActive: 1 });
patientSchema.index({ phoneNumber: 1, isActive: 1 });
patientSchema.index({ doctorReferred: 1 });
patientSchema.index({ representative: 1 });
patientSchema.index({ dateOfBirth: 1 });

// Virtual for full address
patientSchema.virtual('fullAddress').get(function () {
    const parts = [
        this.address?.street,
        this.address?.city,
        this.address?.state,
        this.address?.postalCode,
        this.address?.country
    ].filter(Boolean);

    return parts.join(', ');
});

// Method to add scan to history
patientSchema.methods.addScanToHistory = async function (scanId, notes = '') {
    const existingScan = this.scansHistory.find(scan => scan.scan.toString() === scanId.toString());
    if (existingScan) {
        throw errors.BadRequest('Scan already exists in patient history');
    }

    this.scansHistory.push({
        scan: scanId,
        date: new Date(),
        status: 'pending',
        notes
    });

    await this.save();
    return this;
};

// Method to update scan status in history
patientSchema.methods.updateScanStatus = async function (scanId, status, notes = '') {
    const scanHistory = this.scansHistory.find(scan => scan.scan.toString() === scanId.toString());
    if (!scanHistory) {
        throw errors.NotFound('Scan not found in patient history');
    }

    scanHistory.status = status;
    if (notes) {
        scanHistory.notes = notes;
    }
    scanHistory.date = new Date();

    await this.save();
    return this;
};

// Method to remove scan from history
patientSchema.methods.removeScanFromHistory = async function (scanId) {
    this.scansHistory = this.scansHistory.filter(scan => scan.scan.toString() !== scanId.toString());
    await this.save();
    return this;
};

// Static method to find active patients
patientSchema.statics.findActive = function () {
    return this.find({ isActive: true });
};

// Static method to find patients by doctor
patientSchema.statics.findByDoctor = function (doctorId) {
    return this.find({
        doctorReferred: doctorId,
        isActive: true
    });
};

// Static method to search patients
patientSchema.statics.search = function (query) {
    return this.find({
        $or: [
            { name: { $regex: query, $options: 'i' } },
            { phoneNumber: { $regex: query, $options: 'i' } },
            { socialNumber: { $regex: query, $options: 'i' } }
        ],
        isActive: true
    });
};

const Patient = mongoose.model('Patient', patientSchema);

export default Patient; 