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
        required: [true, 'Date of birth is required']
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: {
            values: ['male', 'female', 'other'],
            message: 'Gender must be either male, female, or other'
        }
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required'],
        match: [/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Please provide a valid contact number']
    },
    email: {
        type: String,
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
    medicalHistory: [{
        condition: {
            type: String,
            required: true,
            trim: true
        },
        diagnosis: {
            type: String,
            trim: true
        },
        treatment: {
            type: String,
            trim: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        notes: {
            type: String,
            trim: true
        }
    }],
    allergies: [{
        type: String,
        trim: true
    }],
    bloodGroup: {
        type: String,
        enum: {
            values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            message: 'Invalid blood group'
        }
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
patientSchema.index({ name: 1 });
patientSchema.index({ specialization: 1 });
patientSchema.index({ isActive: 1 });
patientSchema.index({ contactNumber: 1, isActive: 1 });
patientSchema.index({ email: 1, isActive: 1 });

// Virtual for patient's age
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

// Method to add medical history
patientSchema.methods.addMedicalHistory = async function (history) {
    if (!history.condition) {
        throw errors.BadRequest('Medical condition is required');
    }

    this.medicalHistory.push({
        ...history,
        date: history.date || Date.now()
    });

    await this.save();
    return this;
};

// Method to update medical history
patientSchema.methods.updateMedicalHistory = async function (historyId, updates) {
    const history = this.medicalHistory.id(historyId);
    if (!history) {
        throw errors.NotFound('Medical history entry not found');
    }

    Object.assign(history, updates);
    await this.save();
    return this;
};

// Method to remove medical history
patientSchema.methods.removeMedicalHistory = async function (historyId) {
    const history = this.medicalHistory.id(historyId);
    if (!history) {
        throw errors.NotFound('Medical history entry not found');
    }

    history.remove();
    await this.save();
    return this;
};

// Method to add allergy
patientSchema.methods.addAllergy = async function (allergy) {
    if (!allergy) {
        throw errors.BadRequest('Allergy is required');
    }

    if (!this.allergies.includes(allergy)) {
        this.allergies.push(allergy);
        await this.save();
    }

    return this;
};

// Method to remove allergy
patientSchema.methods.removeAllergy = async function (allergy) {
    this.allergies = this.allergies.filter(a => a !== allergy);
    await this.save();
    return this;
};

// Static method to find active patients
patientSchema.statics.findActive = function () {
    return this.find({ isActive: true });
};

// Static method to search patients
patientSchema.statics.search = function (query) {
    return this.find({
        $or: [
            { name: { $regex: query, $options: 'i' } },
            { contactNumber: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
        ],
        isActive: true
    });
};

const Patient = mongoose.model('Patient', patientSchema);

export default Patient; 