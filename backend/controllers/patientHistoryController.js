import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import { errors } from '../utils/errorHandler.js';
import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import { executePaginatedQuery } from '../utils/pagination.js';

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

// Get all patient histories with filtering and pagination
export const getAllPatientHistories = asyncHandler(async (req, res) => {
    const {
        search,
        patientId,
        scanType,
        ...paginationOptions
    } = req.query;

    // Build query
    const query = {};
    if (search) {
        query.$or = [
            { 'patientId.name': { $regex: search, $options: 'i' } },
            { 'patientId.phoneNumber': { $regex: search, $options: 'i' } },
            { diagnosis: { $regex: search, $options: 'i' } }
        ];
    }
    if (patientId) {
        query.patientId = patientId;
    }
    if (scanType) {
        query.scanType = scanType;
    }

    const result = await executePaginatedQuery(
        PatientHistory,
        query,
        paginationOptions,
        [
            { path: 'patientId', select: 'name phoneNumber gender dateOfBirth' },
            { path: 'doctorId', select: 'name specialization' },
            { path: 'appointmentId', select: 'scheduledAt status scans' }
        ]
    );

    res.status(StatusCodes.OK).json(result);
});

// Get patient history by patient ID (from appointments collection)
export const getPatientHistoryByPatientId = asyncHandler(async (req, res) => {
    const { patientId } = req.params;

    console.log('--- [getPatientHistoryByPatientId] Fetching history for patient:', patientId);

    // Find all completed appointments for this patient
    const appointments = await Appointment.find({
        patientId: patientId,
        status: 'completed'
    })
        .populate([
            { path: 'patientId', select: 'name phoneNumber gender dateOfBirth' },
            { path: 'referredBy', select: 'name specialization' },
            { path: 'radiologistId', select: 'name licenseId' },
            { path: 'branch', select: 'name location' }
        ])
        .sort({ scheduledAt: -1 });

    console.log('--- [getPatientHistoryByPatientId] Found appointments:', appointments.length);

    // Transform appointments into patient history format
    const patientHistory = appointments.map(appointment => ({
        id: appointment._id,
        patientId: appointment.patientId,
        doctorId: appointment.referredBy,
        appointmentId: appointment._id,
        date: appointment.scheduledAt,
        diagnosis: 'Radiology scan completed',
        treatment: 'Scan results available',
        notes: appointment.notes || 'Appointment completed',
        pdfReport: appointment.pdfReport,
        scans: appointment.scans,
        price: appointment.price,
        status: appointment.status,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt
    }));

    res.status(StatusCodes.OK).json({
        status: "success",
        data: patientHistory
    });
});

// Get a single patient history record by id (from appointments collection)
export const getPatientHistoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    console.log('--- [getPatientHistoryById] Fetching history for appointment:', id);

    const appointment = await Appointment.findOne({
        _id: id,
        status: 'completed'
    })
        .populate([
            { path: 'patientId', select: 'name phoneNumber gender dateOfBirth' },
            { path: 'referredBy', select: 'name specialization' },
            { path: 'radiologistId', select: 'name licenseId' },
            { path: 'branch', select: 'name location' }
        ]);

    if (!appointment) {
        throw errors.NotFound("Patient history record not found");
    }

    // Transform appointment to patient history format
    const patientHistory = {
        id: appointment._id,
        patientId: appointment.patientId,
        doctorId: appointment.referredBy,
        appointmentId: appointment._id,
        date: appointment.scheduledAt,
        diagnosis: 'Radiology scan completed',
        treatment: 'Scan results available',
        notes: appointment.notes || 'Appointment completed',
        pdfReport: appointment.pdfReport,
        scans: appointment.scans,
        price: appointment.price,
        status: appointment.status,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt
    };

    res.status(StatusCodes.OK).json({
        status: "success",
        data: patientHistory
    });
});

// Update a patient history record (update appointment notes)
export const updatePatientHistory = asyncHandler(async (req, res) => {
    const { notes } = req.body;
    const { id } = req.params;

    console.log('--- [updatePatientHistory] Updating notes for appointment:', id);

    const appointment = await Appointment.findOne({
        _id: id,
        status: 'completed'
    });

    if (!appointment) {
        throw errors.NotFound("Patient history record not found");
    }

    if (notes) {
        appointment.notes = notes;
    }

    await appointment.save();

    res.status(StatusCodes.OK).json({
        status: "success",
        message: "Patient history updated successfully",
        data: appointment
    });
});

// Delete a patient history record (delete completed appointment)
export const deletePatientHistory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    console.log('--- [deletePatientHistory] Deleting completed appointment:', id);

    const appointment = await Appointment.findOne({
        _id: id,
        status: 'completed'
    });

    if (!appointment) {
        throw errors.NotFound("Patient history record not found");
    }

    await appointment.deleteOne();

    res.status(StatusCodes.OK).json({
        status: "success",
        message: "Patient history deleted successfully"
    });
});

export default {
    createPatientHistory,
    getAllPatientHistories,
    getPatientHistoryById,
    updatePatientHistory,
    deletePatientHistory,
    getPatientHistoryByPatientId
}; 