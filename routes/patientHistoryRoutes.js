import express from 'express';
import { auth, authorize } from '../middleware/auth.js';
import { createPatientHistory, getAllPatientHistories, getPatientHistoryById, updatePatientHistory, deletePatientHistory } from '../controllers/patientHistoryController.js';

const router = express.Router();

// Create a new patient history record (admin or doctor only)
router.post('/', auth, authorize('admin', 'doctor'), createPatientHistory);

// Get all patient history records (with filtering and pagination) (authenticated users only)
router.get('/', auth, getAllPatientHistories);

// Get a single patient history record (authenticated users only)
router.get('/:id', auth, getPatientHistoryById);

// Update a patient history record (admin or doctor only)
router.patch('/:id', auth, authorize('admin', 'doctor'), updatePatientHistory);

// Delete a patient history record (admin or doctor only)
router.delete('/:id', auth, authorize('admin', 'doctor'), deletePatientHistory);

export default router; 