import mongoose from 'mongoose';

const patientHistorySchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    date: { type: Date, required: true },
    diagnosis: { type: String, required: true },
    treatment: { type: String, required: true },
    notes: { type: String },
    pdfReport: { type: String, trim: true }
}, { timestamps: true });

export default mongoose.model('PatientHistory', patientHistorySchema); 