import mongoose from 'mongoose';

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
    appointmentDate: {
        type: Date,
        required: [true, 'Appointment date is required']
    },
    timeSlot: {
        start: {
            type: String,
            required: [true, 'Start time is required'],
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format']
        },
        end: {
            type: String,
            required: [true, 'End time is required'],
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format']
        }
    },
    type: {
        type: String,
        required: [true, 'Appointment type is required'],
        enum: ['X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Mammography', 'Other'],
        trim: true
    },
    status: {
        type: String,
        required: true,
        enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
        default: 'scheduled'
    },
    priority: {
        type: String,
        enum: ['routine', 'urgent', 'emergency'],
        default: 'routine'
    },
    notes: {
        type: String,
        trim: true
    },
    referralSource: {
        type: String,
        trim: true
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
appointmentSchema.index({ appointmentDate: 1, 'timeSlot.start': 1, 'timeSlot.end': 1 });
appointmentSchema.index({ patient: 1, status: 1 });
appointmentSchema.index({ doctor: 1, status: 1 });
appointmentSchema.index({ status: 1 });

// Virtual for checking if appointment is in the past
appointmentSchema.virtual('isPast').get(function () {
    const appointmentDateTime = new Date(this.appointmentDate);
    const [hours, minutes] = this.timeSlot.start.split(':');
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));
    return appointmentDateTime < new Date();
});

// Virtual for checking if appointment is today
appointmentSchema.virtual('isToday').get(function () {
    const today = new Date();
    const appointmentDate = new Date(this.appointmentDate);
    return appointmentDate.toDateString() === today.toDateString();
});

// Pre-save middleware to validate time slot
appointmentSchema.pre('save', function (next) {
    const start = this.timeSlot.start.split(':').map(Number);
    const end = this.timeSlot.end.split(':').map(Number);

    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];

    if (endMinutes <= startMinutes) {
        next(new Error('End time must be after start time'));
    }

    // Check if appointment is in the past
    const appointmentDateTime = new Date(this.appointmentDate);
    appointmentDateTime.setHours(start[0], start[1]);
    if (appointmentDateTime < new Date()) {
        next(new Error('Cannot create appointment in the past'));
    }

    next();
});

// Method to check for scheduling conflicts
appointmentSchema.methods.hasConflict = async function () {
    const conflictingAppointment = await this.constructor.findOne({
        _id: { $ne: this._id },
        doctor: this.doctor,
        appointmentDate: this.appointmentDate,
        status: { $nin: ['cancelled', 'no-show'] },
        $or: [
            {
                'timeSlot.start': { $lt: this.timeSlot.end },
                'timeSlot.end': { $gt: this.timeSlot.start }
            }
        ]
    });

    return !!conflictingAppointment;
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment; 