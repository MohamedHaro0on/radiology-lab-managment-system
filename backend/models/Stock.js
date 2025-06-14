import mongoose from 'mongoose';
import { errors } from '../utils/errorHandler.js';

const stockSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Stock name is required'],
        trim: true,
        minlength: [2, 'Stock name must be at least 2 characters long'],
        maxlength: [100, 'Stock name cannot exceed 100 characters']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative']
    },
    minimumThreshold: {
        type: Number,
        required: [true, 'Minimum threshold is required'],
        min: [0, 'Minimum threshold cannot be negative']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    validUntil: {
        type: Date,
        required: [true, 'Valid until date is required']
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

// Indexes for faster queries
stockSchema.index({ name: 1 });
stockSchema.index({ quantity: 1 });
stockSchema.index({ isActive: 1 });
stockSchema.index({ validUntil: 1 });

// Virtual for checking if item is low in stock
stockSchema.virtual('isLowStock').get(function () {
    return this.quantity <= this.minimumThreshold;
});

// Virtual for checking if item is expired
stockSchema.virtual('isExpired').get(function () {
    return new Date() > this.validUntil;
});

// Method to update quantity
stockSchema.methods.updateQuantity = async function (newQuantity) {
    if (newQuantity < 0) {
        throw errors.BadRequest('Quantity cannot be negative');
    }

    this.quantity = newQuantity;
    await this.save();
    return this;
};

// Method to add quantity
stockSchema.methods.addQuantity = async function (amount) {
    if (amount < 0) {
        throw errors.BadRequest('Amount to add cannot be negative');
    }

    this.quantity += amount;
    await this.save();
    return this;
};

// Method to subtract quantity
stockSchema.methods.subtractQuantity = async function (amount) {
    if (amount < 0) {
        throw errors.BadRequest('Amount to subtract cannot be negative');
    }

    if (this.quantity < amount) {
        throw errors.BadRequest('Insufficient stock quantity');
    }

    this.quantity -= amount;
    await this.save();
    return this;
};

// Pre-save middleware to ensure minimum threshold is not greater than quantity
stockSchema.pre('save', function (next) {
    if (this.minimumThreshold > this.quantity) {
        next(new Error('Minimum threshold cannot be greater than current quantity'));
    }
    next();
});

// Static method to find active stock items
stockSchema.statics.findActive = function () {
    return this.find({ isActive: true });
};

// Static method to find low stock items
stockSchema.statics.findLowStock = function () {
    return this.find({
        $expr: { $lte: ['$quantity', '$minimumThreshold'] },
        isActive: true
    });
};

// Static method to find expired items
stockSchema.statics.findExpired = function () {
    return this.find({
        validUntil: { $lt: new Date() },
        isActive: true
    });
};

// Static method to search stock items
stockSchema.statics.search = function (query) {
    return this.find({
        name: { $regex: query, $options: 'i' },
        isActive: true
    });
};

const Stock = mongoose.model('Stock', stockSchema);

export default Stock; 