import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import { errors } from '../utils/errorHandler.js';
import PatientHistory from '../models/PatientHistory.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';

// Create a new patient history record
export const createPatientHistory = asyncHandler(async (req, res) => {
    const { patientId, doctorId, date, diagnosis, treatment, notes } = req.body;
    // Check that patient and doctor exist
    const patient = await Patient.findById(patientId);
    if (!patient) throw errors.NotFound("Patient not found");
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) throw errors.NotFound("Doctor not found");
    const history = new PatientHistory({ patientId, doctorId, date, diagnosis, treatment, notes });
    await history.save();
    res.status(StatusCodes.CREATED).json({ status: "success", data: history });
});

// Get all patient history records (with filtering and pagination)
export const getAllPatientHistories = asyncHandler(async (req, res) => {
    const { patientId, doctorId, date, page = 1, limit = 10, sortBy = "date", sortOrder = "desc" } = req.query;
    const query = {};
    if (patientId) query.patientId = patientId;
    if (doctorId) query.doctorId = doctorId;
    if (date) query.date = new Date(date);
    const skip = (page - 1) * limit;
    const histories = await PatientHistory.find(query).sort({ [sortBy]: (sortOrder === "asc" ? 1 : -1) }).skip(skip).limit(parseInt(limit));
    const total = await PatientHistory.countDocuments(query);
    res.status(StatusCodes.OK).json({ status: "success", data: histories, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
});

// Get a single patient history record by id
export const getPatientHistoryById = asyncHandler(async (req, res) => {
    const history = await PatientHistory.findById(req.params.id);
    if (!history) throw errors.NotFound("Patient history record not found");
    res.status(StatusCodes.OK).json({ status: "success", data: history });
});

// Update a patient history record (only update diagnosis, treatment, and notes)
export const updatePatientHistory = asyncHandler(async (req, res) => {
    const { diagnosis, treatment, notes } = req.body;
    const history = await PatientHistory.findById(req.params.id);
    if (!history) throw errors.NotFound("Patient history record not found");
    if (diagnosis) history.diagnosis = diagnosis;
    if (treatment) history.treatment = treatment;
    if (notes) history.notes = notes;
    await history.save();
    res.status(StatusCodes.OK).json({ status: "success", data: history });
});

// Delete a patient history record
export const deletePatientHistory = asyncHandler(async (req, res) => {
    const history = await PatientHistory.findById(req.params.id);
    if (!history) throw errors.NotFound("Patient history record not found");
    await history.deleteOne();
    res.status(StatusCodes.OK).json({ status: "success", message: "Patient history deleted successfully" });
});

export default { createPatientHistory, getAllPatientHistories, getPatientHistoryById, updatePatientHistory, deletePatientHistory }; 