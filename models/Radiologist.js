import mongoose from 'mongoose';

const radiologistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Radiologist name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required'],
        unique: true,
        trim: true
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
    qualifications: [{
        degree: String,
        institution: String,
        year: Number
    }],
    expertise: [{
        type: String,
        trim: true
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes (only for non-unique fields)
radiologistSchema.index({ specialization: 1 });
radiologistSchema.index({ isActive: 1 });

const Radiologist = mongoose.model('Radiologist', radiologistSchema);

export default Radiologist; 