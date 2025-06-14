import mongoose from 'mongoose';
import { errors } from '../utils/errorHandler.js';

const scanItemSchema = new mongoose.Schema({
    item: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
    }
});

const scanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Scan name is required'],
        trim: true,
        minlength: [2, 'Scan name must be at least 2 characters long'],
        maxlength: [100, 'Scan name cannot exceed 100 characters']
    },
    actualCost: {
        type: Number,
        required: [true, 'Actual cost is required'],
        min: [0, 'Actual cost cannot be negative']
    },
    minPrice: {
        type: Number,
        required: [true, 'Minimum price is required'],
        min: [0, 'Minimum price cannot be negative']
    },
    items: [scanItemSchema],
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['dicom', 'jpeg', 'png'],
            default: 'jpeg'
        },
        description: {
            type: String,
            maxlength: [200, 'Description cannot exceed 200 characters']
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
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
scanSchema.index({ name: 1 });
scanSchema.index({ isActive: 1 });
scanSchema.index({ actualCost: 1 });
scanSchema.index({ minPrice: 1 });

// Virtual for scan info
scanSchema.virtual('info').get(function () {
    return {
        id: this._id,
        name: this.name,
        actualCost: this.actualCost,
        minPrice: this.minPrice,
        items: this.items,
        description: this.description,
        isActive: this.isActive,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
});

// Method to add item to scan
scanSchema.methods.addItem = async function (item, quantity) {
    if (!item || !quantity) {
        throw errors.BadRequest('Item name and quantity are required');
    }

    this.items.push({ item, quantity });
    await this.save();
    return this;
};

// Method to update item quantity
scanSchema.methods.updateItemQuantity = async function (itemName, quantity) {
    const item = this.items.find(i => i.item === itemName);
    if (!item) {
        throw errors.NotFound('Item not found in scan');
    }

    item.quantity = quantity;
    await this.save();
    return this;
};

// Method to remove item from scan
scanSchema.methods.removeItem = async function (itemName) {
    this.items = this.items.filter(i => i.item !== itemName);
    await this.save();
    return this;
};

// Method to calculate total cost from items
scanSchema.methods.calculateTotalCost = function () {
    return this.items.reduce((total, item) => total + (item.quantity || 0), 0);
};

// Static method to find active scans
scanSchema.statics.findActive = function () {
    return this.find({ isActive: true });
};

// Static method to search scans
scanSchema.statics.search = function (query) {
    return this.find({
        $or: [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ],
        isActive: true
    });
};

const Scan = mongoose.model('Scan', scanSchema);

export default Scan; 