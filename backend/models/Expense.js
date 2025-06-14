import mongoose from 'mongoose';
import { errors } from '../utils/errorHandler.js';

const expenseSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now
    },
    reason: {
        type: String,
        required: [true, 'Reason is required'],
        trim: true,
        minlength: [3, 'Reason must be at least 3 characters long'],
        maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    totalCost: {
        type: Number,
        required: [true, 'Total cost is required'],
        min: [0, 'Total cost cannot be negative']
    },
    requester: {
        type: String,
        required: [true, 'Requester is required'],
        trim: true,
        minlength: [2, 'Requester name must be at least 2 characters long'],
        maxlength: [100, 'Requester name cannot exceed 100 characters']
    },
    category: {
        type: String,
        enum: ['operational', 'maintenance', 'supplies', 'utilities', 'salary', 'other'],
        default: 'other',
        trim: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'bank_transfer', 'check', 'credit_card', 'other'],
        default: 'cash'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'paid'],
        default: 'pending'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: {
        type: Date
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
expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ requester: 1 });
expenseSchema.index({ isActive: 1 });
expenseSchema.index({ createdBy: 1 });

// Virtual for expense info
expenseSchema.virtual('info').get(function () {
    return {
        id: this._id,
        date: this.date,
        reason: this.reason,
        totalCost: this.totalCost,
        requester: this.requester,
        category: this.category,
        description: this.description,
        paymentMethod: this.paymentMethod,
        status: this.status,
        approvedBy: this.approvedBy,
        approvedAt: this.approvedAt,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
});

// Method to approve expense
expenseSchema.methods.approve = async function (approvedBy) {
    if (this.status !== 'pending') {
        throw errors.BadRequest('Expense is not pending approval');
    }

    this.status = 'approved';
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
    this.updatedBy = approvedBy;
    await this.save();
    return this;
};

// Method to reject expense
expenseSchema.methods.reject = async function (updatedBy) {
    if (this.status !== 'pending') {
        throw errors.BadRequest('Expense is not pending approval');
    }

    this.status = 'rejected';
    this.updatedBy = updatedBy;
    await this.save();
    return this;
};

// Method to mark as paid
expenseSchema.methods.markAsPaid = async function (updatedBy) {
    if (this.status !== 'approved') {
        throw errors.BadRequest('Expense must be approved before marking as paid');
    }

    this.status = 'paid';
    this.updatedBy = updatedBy;
    await this.save();
    return this;
};

// Static method to find active expenses
expenseSchema.statics.findActive = function () {
    return this.find({ isActive: true });
};

// Static method to find expenses by date range
expenseSchema.statics.findByDateRange = function (startDate, endDate) {
    return this.find({
        date: {
            $gte: startDate,
            $lte: endDate
        },
        isActive: true
    });
};

// Static method to find expenses by category
expenseSchema.statics.findByCategory = function (category) {
    return this.find({
        category,
        isActive: true
    });
};

// Static method to search expenses
expenseSchema.statics.search = function (query) {
    return this.find({
        $or: [
            { reason: { $regex: query, $options: 'i' } },
            { requester: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ],
        isActive: true
    });
};

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense; 