import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE']
    },
    entity: {
        type: String,
        required: true,
        default: 'Appointment'
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    changes: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

auditSchema.index({ user: 1 });
auditSchema.index({ entityId: 1 });

const Audit = mongoose.model('Audit', auditSchema);

export default Audit; 