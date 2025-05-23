import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['X-Ray Film', 'Contrast Media', 'Medical Supplies', 'Equipment', 'Other'],
        trim: true
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative']
    },
    unit: {
        type: String,
        required: [true, 'Unit is required'],
        enum: ['Box', 'Piece', 'Pack', 'Bottle', 'Kit'],
        trim: true
    },
    minimumQuantity: {
        type: Number,
        required: [true, 'Minimum quantity is required'],
        min: [0, 'Minimum quantity cannot be negative']
    },
    supplier: {
        name: {
            type: String,
            required: [true, 'Supplier name is required'],
            trim: true
        },
        contactPerson: {
            type: String,
            trim: true
        },
        phoneNumber: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
        }
    },
    expiryDate: {
        type: Date
    },
    batchNumber: {
        type: String,
        trim: true
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes for faster queries
stockSchema.index({ itemName: 1, category: 1 });
stockSchema.index({ expiryDate: 1 });
stockSchema.index({ quantity: 1 });

// Virtual for checking if item is low in stock
stockSchema.virtual('isLowStock').get(function () {
    return this.quantity <= this.minimumQuantity;
});

// Method to check if item is expired
stockSchema.methods.isExpired = function () {
    if (!this.expiryDate) return false;
    return new Date() > this.expiryDate;
};

// Pre-save middleware to ensure minimum quantity is not greater than quantity
stockSchema.pre('save', function (next) {
    if (this.minimumQuantity > this.quantity) {
        next(new Error('Minimum quantity cannot be greater than current quantity'));
    }
    next();
});

const Stock = mongoose.model('Stock', stockSchema);

export default Stock; 