import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required']
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: [true, 'Gender is required']
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: false }
}, {
    timestamps: true
});

// Indexes for faster queries
patientSchema.index({ phoneNumber: 1 });
patientSchema.index({ firstName: 1, lastName: 1 });

const Patient = mongoose.model('Patient', patientSchema);

export default Patient; 