import mongoose from 'mongoose';
import { errors } from '../utils/errorHandler.js';

const appointmentSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient is required']
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: [true, 'Doctor is required']
    },
    scanType: {
        type: String,
        required: [true, 'Scan type is required'],
        trim: true
    },
    appointmentDate: {
        type: Date,
        required: [true, 'Appointment date is required']
    },
    appointmentTime: {
        type: String,
        required: [true, 'Appointment time is required'],
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide a valid time in HH:MM format']
    },
    status: {
        type: String,
        enum: {
            values: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'],
            message: 'Invalid appointment status'
        },
        default: 'scheduled'
    },
    priority: {
        type: String,
        enum: {
            values: ['routine', 'urgent', 'emergency'],
            message: 'Invalid priority level'
        },
        default: 'routine'
    },
    notes: {
        type: String,
        trim: true
    },
    scan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scan'
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

// Indexes
appointmentSchema.index({ patient: 1 });
appointmentSchema.index({ doctor: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ priority: 1 });
appointmentSchema.index({ isActive: 1 });
appointmentSchema.index({ createdBy: 1 });
appointmentSchema.index({ scan: 1 });

// Compound indexes for common queries
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1 });
appointmentSchema.index({ patient: 1, status: 1 });
appointmentSchema.index({ doctor: 1, status: 1 });
appointmentSchema.index({ appointmentDate: 1, status: 1 });
appointmentSchema.index({ isActive: 1, status: 1 });

// Virtual for appointment datetime
appointmentSchema.virtual('appointmentDateTime').get(function () {
    if (!this.appointmentDate || !this.appointmentTime) return null;

    const [hours, minutes] = this.appointmentTime.split(':');
    const date = new Date(this.appointmentDate);
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    return date;
});

// Pre-save middleware to validate appointment datetime
appointmentSchema.pre('save', function (next) {
    if (this.isModified('appointmentDate') || this.isModified('appointmentTime')) {
        const appointmentDateTime = this.appointmentDateTime;
        const now = new Date();

        if (appointmentDateTime < now) {
            next(new Error('Appointment cannot be scheduled in the past'));
            return;
        }
    }
    next();
});

// Method to check if appointment slot is available
appointmentSchema.statics.isSlotAvailable = async function (doctorId, date, time) {
    const existingAppointment = await this.findOne({
        doctor: doctorId,
        appointmentDate: date,
        appointmentTime: time,
        status: { $in: ['scheduled', 'confirmed'] },
        isActive: true
    });

    return !existingAppointment;
};

// Method to update appointment status
appointmentSchema.methods.updateStatus = async function (status, updatedBy) {
    if (!['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'].includes(status)) {
        throw errors.BadRequest('Invalid appointment status');
    }

    this.status = status;
    this.updatedBy = updatedBy;
    await this.save();
    return this;
};

// Method to cancel appointment
appointmentSchema.methods.cancel = async function (reason, updatedBy) {
    if (this.status === 'completed') {
        throw errors.BadRequest('Cannot cancel a completed appointment');
    }

    this.status = 'cancelled';
    this.notes = reason ? `${this.notes ? this.notes + '\n' : ''}Cancellation reason: ${reason}` : this.notes;
    this.updatedBy = updatedBy;
    await this.save();
    return this;
};

// Method to mark as no-show
appointmentSchema.methods.markAsNoShow = async function (updatedBy) {
    if (this.status === 'completed') {
        throw errors.BadRequest('Cannot mark a completed appointment as no-show');
    }

    this.status = 'no-show';
    this.updatedBy = updatedBy;
    await this.save();
    return this;
};

// Method to complete appointment
appointmentSchema.methods.complete = async function (scanId, updatedBy) {
    if (this.status === 'cancelled' || this.status === 'no-show') {
        throw errors.BadRequest('Cannot complete a cancelled or no-show appointment');
    }

    this.status = 'completed';
    this.scan = scanId;
    this.updatedBy = updatedBy;
    await this.save();
    return this;
};

// Static method to find active appointments
appointmentSchema.statics.findActive = function () {
    return this.find({ isActive: true });
};

// Static method to find appointments by date range
appointmentSchema.statics.findByDateRange = function (startDate, endDate) {
    return this.find({
        appointmentDate: {
            $gte: startDate,
            $lte: endDate
        },
        isActive: true
    });
};

// Static method to find appointments by status
appointmentSchema.statics.findByStatus = function (status) {
    return this.find({
        status,
        isActive: true
    });
};

// Static method to find doctor's appointments
appointmentSchema.statics.findDoctorAppointments = function (doctorId, date) {
    return this.find({
        doctor: doctorId,
        appointmentDate: date,
        isActive: true
    }).sort({ appointmentTime: 1 });
};

// Static method to find patient's appointments
appointmentSchema.statics.findPatientAppointments = function (patientId) {
    return this.find({
        patient: patientId,
        isActive: true
    }).sort({ appointmentDate: -1, appointmentTime: -1 });
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment; 