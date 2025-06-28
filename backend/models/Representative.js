import mongoose from 'mongoose';

const representativeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Representative name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    age: {
        type: Number,
        required: [true, 'Age is required'],
        min: [18, 'Age must be at least 18'],
        max: [100, 'Age cannot exceed 100']
    },
    id: {
        type: String,
        required: [true, 'ID is required'],
        unique: true,
        trim: true,
        maxlength: [50, 'ID cannot exceed 50 characters']
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    patientsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    doctorsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    }
}, {
    timestamps: true
});

// Indexes for better query performance
representativeSchema.index({ name: 1 });
representativeSchema.index({ isActive: 1 });
representativeSchema.index({ patientsCount: -1 });
representativeSchema.index({ doctorsCount: -1 });

// Method to calculate and update patient count
representativeSchema.methods.calculatePatientsCount = async function () {
    const Patient = mongoose.model('Patient');
    const count = await Patient.countDocuments({ representative: this._id });
    this.patientsCount = count;
    await this.save();
    return count;
};

// Method to calculate and update doctor count
representativeSchema.methods.calculateDoctorsCount = async function () {
    const Doctor = mongoose.model('Doctor');
    const count = await Doctor.countDocuments({ representative: this._id });
    this.doctorsCount = count;
    await this.save();
    return count;
};

// Method to recalculate both counts
representativeSchema.methods.recalculateCounts = async function () {
    await Promise.all([
        this.calculatePatientsCount(),
        this.calculateDoctorsCount()
    ]);
    return {
        patientsCount: this.patientsCount,
        doctorsCount: this.doctorsCount
    };
};

// Static method to get top representatives
representativeSchema.statics.getTopRepresentatives = async function (limit = 10) {
    return this.find({ isActive: true })
        .sort({ patientsCount: -1, doctorsCount: -1 })
        .limit(limit)
        .select('name id patientsCount doctorsCount phoneNumber');
};

// Pre-save middleware to ensure ID uniqueness
representativeSchema.pre('save', async function (next) {
    if (this.isModified('id')) {
        const existingRep = await this.constructor.findOne({
            id: this.id,
            _id: { $ne: this._id }
        });
        if (existingRep) {
            throw new Error('Representative ID already exists');
        }
    }
    next();
});

const Representative = mongoose.model('Representative', representativeSchema);

export default Representative; 