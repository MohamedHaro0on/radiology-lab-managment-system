import mongoose from 'mongoose';
import { errors } from '../utils/errorHandler.js';

const appointmentSchema = new mongoose.Schema({
    radiologistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Radiologist',
        required: [true, 'Radiologist is required']
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: [true, 'Branch is required']
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient is required']
    },
    scans: [{
        scan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Scan',
            required: [true, 'Scan is required']
        },
        quantity: {
            type: Number,
            default: 1,
            min: [1, 'Quantity must be at least 1']
        }
    }],
    cost: {
        type: Number,
        required: true,
        min: [0, 'Cost cannot be negative']
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    },
    profit: {
        type: Number,
        required: true
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: [true, 'Referring doctor is required']
    },
    representative: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Representative',
        required: false
    },
    scheduledAt: {
        type: Date,
        required: [true, 'Scheduled time is required']
    },
    status: {
        type: String,
        enum: {
            values: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no-show'],
            message: 'Status must be one of: scheduled, in_progress, completed, cancelled, no-show'
        },
        default: 'scheduled'
    },
    priority: {
        type: String,
        enum: {
            values: ['routine', 'urgent', 'emergency'],
            message: 'Priority must be one of: routine, urgent, emergency'
        },
        default: 'routine'
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
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
    makeHugeSale: {
        type: Boolean,
        default: false
    },
    customPrice: {
        type: Number,
        min: [0, 'Custom price cannot be negative']
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
appointmentSchema.index({ radiologistId: 1 });
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ referredBy: 1 });
appointmentSchema.index({ scheduledAt: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ isActive: 1 });
appointmentSchema.index({ createdBy: 1 });
appointmentSchema.index({ branch: 1 });
appointmentSchema.index({ representative: 1 });

// Virtual for appointment info
appointmentSchema.virtual('info').get(function () {
    return {
        id: this._id,
        radiologistId: this.radiologistId,
        patientId: this.patientId,
        branch: this.branch,
        scans: this.scans,
        cost: this.cost,
        price: this.price,
        profit: this.profit,
        referredBy: this.referredBy,
        scheduledAt: this.scheduledAt,
        status: this.status,
        priority: this.priority,
        notes: this.notes,
        makeHugeSale: this.makeHugeSale,
        customPrice: this.customPrice,
        cancelledAt: this.cancelledAt,
        cancelledBy: this.cancelledBy,
        cancellationReason: this.cancellationReason,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
});

// Method to calculate cost, price, and profit
appointmentSchema.methods.calculateFinancials = async function () {
    const Scan = mongoose.model('Scan');
    let totalCost = 0;
    let totalPrice = 0;

    for (const scanItem of this.scans) {
        const scan = await Scan.findById(scanItem.scan);
        if (scan) {
            totalCost += scan.actualCost * scanItem.quantity;
            totalPrice += scan.minPrice * scanItem.quantity;
        }
    }

    this.cost = totalCost;
    this.price = totalPrice;
    this.profit = totalPrice - totalCost;

    await this.save();
    return this;
};

// Method to add scan to appointment
appointmentSchema.methods.addScan = async function (scanId, quantity = 1) {
    const existingScan = this.scans.find(s => s.scan.toString() === scanId.toString());
    if (existingScan) {
        existingScan.quantity += quantity;
    } else {
        this.scans.push({ scan: scanId, quantity });
    }

    await this.calculateFinancials();
    return this;
};

// Method to remove scan from appointment
appointmentSchema.methods.removeScan = async function (scanId) {
    this.scans = this.scans.filter(s => s.scan.toString() !== scanId.toString());
    await this.calculateFinancials();
    return this;
};

// Method to update appointment status
appointmentSchema.methods.updateStatus = async function (status, updatedBy) {
    if (!['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'].includes(status)) {
        throw errors.BadRequest('Invalid appointment status');
    }

    this.status = status;
    this.updatedBy = updatedBy;
    await this.save();
    return this;
};

// Method to cancel appointment
appointmentSchema.methods.cancel = async function (reason, cancelledBy) {
    if (this.status === 'completed') {
        throw errors.BadRequest('Cannot cancel a completed appointment');
    }

    this.status = 'cancelled';
    this.cancellationReason = reason;
    this.cancelledAt = new Date();
    this.cancelledBy = cancelledBy;
    this.updatedBy = cancelledBy;
    await this.save();
    return this;
};

// Method to complete appointment
appointmentSchema.methods.complete = async function (updatedBy) {
    if (this.status === 'cancelled' || this.status === 'no_show') {
        throw errors.BadRequest('Cannot complete a cancelled or no-show appointment');
    }

    this.status = 'completed';
    this.updatedBy = updatedBy;
    await this.save();
    return this;
};

// Pre-save middleware to calculate financials
appointmentSchema.pre('save', async function (next) {
    if (this.isModified('scans')) {
        try {
            await this.calculateFinancials();
        } catch (error) {
            return next(error);
        }
    }
    next();
});

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

// Static method to find appointments by doctor
appointmentSchema.statics.findByDoctor = function (doctorId) {
    return this.find({
        referredBy: doctorId,
        isActive: true
    });
};

// Static method to find appointments by radiologist
appointmentSchema.statics.findByRadiologist = function (radiologistId) {
    return this.find({
        radiologistId,
        isActive: true
    });
};

// Static method to find appointments by patient
appointmentSchema.statics.findByPatient = function (patientId) {
    return this.find({
        patientId,
        isActive: true
    });
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment; 