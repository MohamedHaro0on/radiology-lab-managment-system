import Representative from '../models/Representative.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import { executePaginatedQuery } from '../utils/pagination.js';
import { errors } from '../utils/errorHandler.js';
import { createAuditLog } from '../utils/auditLogger.js';

// Create a new representative
export const createRepresentative = async (req, res) => {
    try {
        const { name, age, id, phoneNumber, notes } = req.body;
        const userId = req.user.id;

        // Check if representative ID already exists
        const existingRep = await Representative.findOne({ id });
        if (existingRep) {
            throw errors.BadRequest('Representative ID already exists');
        }

        const representative = new Representative({
            name,
            age,
            id,
            phoneNumber,
            notes
        });

        await representative.save();

        // Create audit log
        await createAuditLog({
            action: 'CREATE',
            entityType: 'Representative',
            entityId: representative._id,
            userId,
            details: {
                name: representative.name,
                id: representative.id,
                phoneNumber: representative.phoneNumber
            }
        });

        res.status(201).json({
            success: true,
            message: 'Representative created successfully',
            data: representative
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all representatives with pagination and filtering
export const getAllRepresentatives = async (req, res) => {
    try {
        // Provide defaults and parse safely
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const search = req.query.search || '';
        const isActive = req.query.isActive;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        const query = {};

        // Add search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { id: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } }
            ];
        }

        // Add active filter
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const sortOptions = {};
        if (sortBy) sortOptions[sortBy] = sortOrder;

        const result = await executePaginatedQuery(
            Representative,
            query,
            {
                page,
                limit,
                sort: sortOptions
            }
        );

        res.json({
            success: true,
            message: 'Representatives retrieved successfully',
            data: result
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Get representative by ID
export const getRepresentativeById = async (req, res) => {
    try {
        const { id } = req.params;

        const representative = await Representative.findById(id);
        if (!representative) {
            throw errors.NotFound('Representative not found');
        }

        res.json({
            success: true,
            message: 'Representative retrieved successfully',
            data: representative
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Update representative
export const updateRepresentative = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const userId = req.user.id;

        const representative = await Representative.findById(id);
        if (!representative) {
            throw errors.NotFound('Representative not found');
        }

        // Check if ID is being updated and if it already exists
        if (updateData.id && updateData.id !== representative.id) {
            const existingRep = await Representative.findOne({
                id: updateData.id,
                _id: { $ne: id }
            });
            if (existingRep) {
                throw errors.BadRequest('Representative ID already exists');
            }
        }

        // Store old values for audit
        const oldValues = {
            name: representative.name,
            age: representative.age,
            id: representative.id,
            phoneNumber: representative.phoneNumber,
            isActive: representative.isActive,
            notes: representative.notes
        };

        Object.assign(representative, updateData);
        await representative.save();

        // Create audit log
        await createAuditLog({
            action: 'UPDATE',
            entityType: 'Representative',
            entityId: representative._id,
            userId,
            details: {
                oldValues,
                newValues: updateData
            }
        });

        res.json({
            success: true,
            message: 'Representative updated successfully',
            data: representative
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete representative
export const deleteRepresentative = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const representative = await Representative.findById(id);
        if (!representative) {
            throw errors.NotFound('Representative not found');
        }

        // Check if representative has associated doctors or patients
        const doctorCount = await Doctor.countDocuments({ representative: id });
        const patientCount = await Patient.countDocuments({ representative: id });

        if (doctorCount > 0 || patientCount > 0) {
            throw errors.BadRequest(
                `Cannot delete representative. Associated with ${doctorCount} doctors and ${patientCount} patients.`
            );
        }

        await Representative.findByIdAndDelete(id);

        // Create audit log
        await createAuditLog({
            action: 'DELETE',
            entityType: 'Representative',
            entityId: id,
            userId,
            details: {
                name: representative.name,
                id: representative.id
            }
        });

        res.json({
            success: true,
            message: 'Representative deleted successfully'
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Get top representatives
export const getTopRepresentatives = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const representatives = await Representative.getTopRepresentatives(parseInt(limit));

        res.json({
            success: true,
            message: 'Top representatives retrieved successfully',
            data: representatives
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Get representative statistics
export const getRepresentativeStats = async (req, res) => {
    try {
        const { id } = req.params;

        const representative = await Representative.findById(id);
        if (!representative) {
            throw errors.NotFound('Representative not found');
        }

        // Get associated doctors
        const doctors = await Doctor.find({ representative: id })
            .select('name specialization contactNumber totalPatientsReferred totalScansReferred');

        // Get associated patients
        const patients = await Patient.find({ representative: id })
            .select('name phoneNumber dateOfBirth gender');

        // Get appointments for this representative
        const appointments = await Appointment.find({ representative: id })
            .populate('patientId', 'name')
            .populate('referredBy', 'name')
            .select('scheduledAt status cost price profit');

        // Calculate total revenue
        const totalRevenue = appointments.reduce((sum, apt) => sum + apt.price, 0);
        const totalProfit = appointments.reduce((sum, apt) => sum + apt.profit, 0);

        // Calculate monthly stats
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

        const monthlyStats = await Appointment.aggregate([
            {
                $match: {
                    representative: representative._id,
                    scheduledAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$scheduledAt' },
                        month: { $month: '$scheduledAt' }
                    },
                    count: { $sum: 1 },
                    revenue: { $sum: '$price' },
                    profit: { $sum: '$profit' }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        const stats = {
            representative: {
                name: representative.name,
                id: representative.id,
                phoneNumber: representative.phoneNumber,
                patientsCount: representative.patientsCount,
                doctorsCount: representative.doctorsCount
            },
            doctors: doctors,
            patients: patients,
            appointments: {
                total: appointments.length,
                totalRevenue,
                totalProfit,
                monthlyStats
            },
            summary: {
                totalDoctors: doctors.length,
                totalPatients: patients.length,
                totalAppointments: appointments.length,
                averageRevenuePerAppointment: appointments.length > 0 ? totalRevenue / appointments.length : 0,
                averageProfitPerAppointment: appointments.length > 0 ? totalProfit / appointments.length : 0
            }
        };

        res.json({
            success: true,
            message: 'Representative statistics retrieved successfully',
            data: stats
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Recalculate representative counts
export const recalculateCounts = async (req, res) => {
    try {
        const { id } = req.params;

        const representative = await Representative.findById(id);
        if (!representative) {
            throw errors.NotFound('Representative not found');
        }

        const counts = await representative.recalculateCounts();

        res.json({
            success: true,
            message: 'Representative counts recalculated successfully',
            data: counts
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all representatives for dropdown (active only)
export const getRepresentativesForDropdown = async (req, res) => {
    try {
        const representatives = await Representative.find({ isActive: true })
            .select('name id phoneNumber')
            .sort({ name: 1 });

        res.json({
            success: true,
            message: 'Representatives retrieved successfully',
            data: representatives
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
}; 