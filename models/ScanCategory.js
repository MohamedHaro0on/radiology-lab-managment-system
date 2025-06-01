import mongoose from 'mongoose';

const scanCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true,
        minlength: [2, 'Category name must be at least 2 characters long'],
        maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    duration: {
        type: Number, // Duration in minutes
        required: [true, 'Duration is required'],
        min: [1, 'Duration must be at least 1 minute']
    },
    preparationInstructions: {
        type: String,
        trim: true,
        maxlength: [1000, 'Preparation instructions cannot exceed 1000 characters']
    }
}, {
    timestamps: true
});

// Indexes
// scanCategorySchema.index({ name: 1 });
scanCategorySchema.index({ isActive: 1 });

// Virtual for scan count
scanCategorySchema.virtual('scanCount', {
    ref: 'Scan',
    localField: '_id',
    foreignField: 'category',
    count: true
});

// Method to get category info
scanCategorySchema.methods.info = function () {
    return {
        id: this._id,
        name: this.name,
        description: this.description,
        isActive: this.isActive,
        price: this.price,
        duration: this.duration,
        preparationInstructions: this.preparationInstructions,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

const ScanCategory = mongoose.model('ScanCategory', scanCategorySchema);

export default ScanCategory; 