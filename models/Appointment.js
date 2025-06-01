import mongoose from 'mongoose';
import { errors } from '../utils/errorHandler.js';

const appointmentSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    scans: [{
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ScanCategory',
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'cancelled'],
            default: 'pending'
        },
        notes: String,
        scheduledAt: Date
    }],
    scheduledAt: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // Duration in minutes
        required: true,
        min: [15, 'Duration must be at least 15 minutes']
    },
    status: {
        type: String,
        enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
        default: 'scheduled'
    },
    type: {
        type: String,
        enum: ['regular', 'urgent', 'emergency'],
        default: 'regular'
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    totalAmount: {
        type: Number,
        required: true,
        min: [0, 'Total amount cannot be negative']
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'partial', 'paid'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'insurance', 'other'],
        required: true
    },
    insuranceInfo: {
        provider: String,
        policyNumber: String,
        coverage: Number // Percentage of coverage
    },
    cancelledAt: {
        type: Date
    },
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancellationReason: {
        type: String,
        trim: true,
        maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
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
appointmentSchema.index({ scheduledAt: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ 'scans.category': 1 });
appointmentSchema.index({ createdAt: -1 });
appointmentSchema.index({ createdBy: 1 });

// Virtual for appointment info
appointmentSchema.virtual('info').get(function () {
    return {
        id: this._id,
        patient: this.patient,
        doctor: this.doctor,
        scans: this.scans,
        scheduledAt: this.scheduledAt,
        duration: this.duration,
        status: this.status,
        type: this.type,
        notes: this.notes,
        totalAmount: this.totalAmount,
        paymentStatus: this.paymentStatus,
        paymentMethod: this.paymentMethod,
        insuranceInfo: this.insuranceInfo,
        cancelledAt: this.cancelledAt,
        cancelledBy: this.cancelledBy,
        cancellationReason: this.cancellationReason,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
});

// Method to check if appointment can be cancelled
appointmentSchema.methods.canBeCancelled = function () {
    return ['scheduled', 'confirmed'].includes(this.status);
};

// Method to check if appointment can be rescheduled
appointmentSchema.methods.canBeRescheduled = function () {
    return ['scheduled', 'confirmed'].includes(this.status);
};

// Method to calculate total amount based on scans
appointmentSchema.methods.calculateTotalAmount = async function () {
    const ScanCategory = mongoose.model('ScanCategory');
    let total = 0;

    for (const scan of this.scans) {
        const category = await ScanCategory.findById(scan.category);
        if (category) {
            total += category.price;
        }
    }

    this.totalAmount = total;
    return total;
};

// Pre-save middleware to calculate total amount
appointmentSchema.pre('save', async function (next) {
    if (this.isModified('scans')) {
        await this.calculateTotalAmount();
    }
    next();
});

// Method to check if appointment slot is available
appointmentSchema.statics.isSlotAvailable = async function (doctorId, date, time) {
    const existingAppointment = await this.findOne({
        doctor: doctorId,
        scheduledAt: date,
        scheduledAt: time,
        status: { $in: ['scheduled', 'confirmed'] },
        isActive: true
    });

    return !existingAppointment;
};

// Method to update appointment status
appointmentSchema.methods.updateStatus = async function (status, updatedBy) {
    if (!['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'].includes(status)) {
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
    this.cancellationReason = reason ? `${this.cancellationReason ? this.cancellationReason + '\n' : ''}Cancellation reason: ${reason}` : this.cancellationReason;
    this.cancelledAt = new Date();
    this.cancelledBy = updatedBy;
    await this.save();
    return this;
};

// Method to mark as no-show
appointmentSchema.methods.markAsNoShow = async function (updatedBy) {
    if (this.status === 'completed') {
        throw errors.BadRequest('Cannot mark a completed appointment as no-show');
    }

    this.status = 'no_show';
    this.updatedBy = updatedBy;
    await this.save();
    return this;
};

// Method to complete appointment
appointmentSchema.methods.complete = async function (scanId, updatedBy) {
    if (this.status === 'cancelled' || this.status === 'no_show') {
        throw errors.BadRequest('Cannot complete a cancelled or no-show appointment');
    }

    this.status = 'completed';
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
        scheduledAt: {
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
        scheduledAt: date,
        isActive: true
    }).sort({ scheduledAt: 1 });
};

// Static method to find patient's appointments
appointmentSchema.statics.findPatientAppointments = function (patientId) {
    return this.find({
        patient: patientId,
        isActive: true
    }).sort({ scheduledAt: -1 });
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment; 