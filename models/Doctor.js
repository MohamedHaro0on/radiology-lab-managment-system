import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Doctor name is required'],
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
    referralCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    patientsCount: { type: Number, default: 0 }
}, {
    timestamps: true
});

// Index for faster queries
doctorSchema.index({ licenseNumber: 1, contactNumber: 1 });

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor; 