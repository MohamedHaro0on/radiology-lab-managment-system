import mongoose from 'mongoose';

const scanItemSchema = new mongoose.Schema({
    stockItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock',
        required: [true, 'Stock item is required']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
    }
});

const imageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: [true, 'Image URL is required']
    },
    type: {
        type: String,
        required: [true, 'Image type is required'],
        enum: ['dicom', 'jpeg', 'png']
    },
    description: {
        type: String,
        maxlength: [200, 'Description cannot exceed 200 characters']
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

const scanSchema = new mongoose.Schema({
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
    radiologist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Radiologist'
    },
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: [true, 'Appointment is required']
    },
    name: {
        type: String,
        required: [true, 'Scan name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    scanType: {
        type: String,
        required: [true, 'Scan type is required'],
        trim: true,
        minlength: [2, 'Scan type must be at least 2 characters long'],
        maxlength: [100, 'Scan type cannot exceed 100 characters']
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'in-progress', 'completed', 'cancelled'],
            message: 'Invalid scan status'
        },
        default: 'pending'
    },
    priority: {
        type: String,
        enum: {
            values: ['low', 'medium', 'high', 'urgent'],
            message: 'Invalid priority level'
        },
        default: 'medium'
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    minPrice: {
        type: Number,
        required: [true, 'Minimum price is required'],
        min: [0, 'Minimum price cannot be negative']
    },
    maxPrice: {
        type: Number,
        required: [true, 'Maximum price is required'],
        min: [0, 'Maximum price cannot be negative']
    },
    items: [scanItemSchema],
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Mammography', 'Other'],
        trim: true
    },
    preparationInstructions: {
        type: String,
        trim: true
    },
    duration: {
        type: Number, // Duration in minutes
        required: [true, 'Duration is required'],
        min: [1, 'Duration must be at least 1 minute']
    },
    notes: {
        type: String,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    images: [imageSchema],
    findings: {
        type: String,
        maxlength: [2000, 'Findings cannot exceed 2000 characters']
    },
    recommendations: {
        type: String,
        maxlength: [1000, 'Recommendations cannot exceed 1000 characters']
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
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes for faster queries
scanSchema.index({ name: 1 });
scanSchema.index({ patient: 1 });
scanSchema.index({ doctor: 1 });
scanSchema.index({ radiologist: 1 });
scanSchema.index({ appointment: 1 });
scanSchema.index({ status: 1 });
scanSchema.index({ category: 1 });
scanSchema.index({ isActive: 1 });
scanSchema.index({ createdAt: -1 });

// Method to check stock availability
scanSchema.methods.checkStockAvailability = async function () {
    for (const item of this.items) {
        const stockItem = await mongoose.model('Stock').findById(item.stockItem);
        if (!stockItem || stockItem.quantity < item.quantity) {
            return false;
        }
    }
    return true;
};

// Validate price range
scanSchema.pre('save', function (next) {
    if (this.minPrice > this.maxPrice) {
        next(new Error('Minimum price cannot be greater than maximum price'));
    }
    if (this.price < this.minPrice || this.price > this.maxPrice) {
        next(new Error('Price must be between minimum and maximum price'));
    }
    next();
});

const Scan = mongoose.model('Scan', scanSchema);

export default Scan; 