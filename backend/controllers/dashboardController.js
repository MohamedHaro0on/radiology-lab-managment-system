import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import { errors } from '../utils/errorHandler.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Scan from '../models/Scan.js';
import Patient from '../models/Patient.js';
import Expense from '../models/Expense.js';
import Representative from '../models/Representative.js';

// Get dashboard analytics
export const getDashboardAnalytics = asyncHandler(async (req, res) => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    try {
        // Daily analytics
        const dailyAppointments = await Appointment.countDocuments({
            scheduledAt: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        const dailyIncome = await Appointment.aggregate([
            {
                $match: {
                    scheduledAt: {
                        $gte: startOfDay,
                        $lte: endOfDay
                    },
                    status: 'completed'
                }
            },
            {
                $unwind: '$scans'
            },
            {
                $lookup: {
                    from: 'scans',
                    localField: 'scans.scan',
                    foreignField: '_id',
                    as: 'scanDetails'
                }
            },
            {
                $unwind: '$scanDetails'
            },
            {
                $lookup: {
                    from: 'scancategories',
                    localField: 'scanDetails.category',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            {
                $unwind: '$categoryDetails'
            },
            {
                $group: {
                    _id: null,
                    totalIncome: { $sum: '$categoryDetails.price' }
                }
            }
        ]);

        // Weekly analytics
        const weeklyAppointments = await Appointment.countDocuments({
            scheduledAt: {
                $gte: startOfWeek,
                $lte: endOfWeek
            }
        });

        const weeklyIncome = await Appointment.aggregate([
            {
                $match: {
                    scheduledAt: {
                        $gte: startOfWeek,
                        $lte: endOfWeek
                    },
                    status: 'completed'
                }
            },
            {
                $unwind: '$scans'
            },
            {
                $lookup: {
                    from: 'scans',
                    localField: 'scans.scan',
                    foreignField: '_id',
                    as: 'scanDetails'
                }
            },
            {
                $unwind: '$scanDetails'
            },
            {
                $lookup: {
                    from: 'scancategories',
                    localField: 'scanDetails.category',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            {
                $unwind: '$categoryDetails'
            },
            {
                $group: {
                    _id: null,
                    totalIncome: { $sum: '$categoryDetails.price' }
                }
            }
        ]);

        // Total analytics
        const totalAppointments = await Appointment.countDocuments();

        const totalIncome = await Appointment.aggregate([
            {
                $match: {
                    status: 'completed'
                }
            },
            {
                $unwind: '$scans'
            },
            {
                $lookup: {
                    from: 'scans',
                    localField: 'scans.scan',
                    foreignField: '_id',
                    as: 'scanDetails'
                }
            },
            {
                $unwind: '$scanDetails'
            },
            {
                $lookup: {
                    from: 'scancategories',
                    localField: 'scanDetails.category',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            {
                $unwind: '$categoryDetails'
            },
            {
                $group: {
                    _id: null,
                    totalIncome: { $sum: '$categoryDetails.price' }
                }
            }
        ]);

        // Top rated doctors
        const topRatedDoctors = await Doctor.aggregate([
            {
                $lookup: {
                    from: 'appointments',
                    localField: '_id',
                    foreignField: 'doctor',
                    as: 'appointments'
                }
            },
            {
                $addFields: {
                    appointmentCount: { $size: '$appointments' },
                    completedAppointments: {
                        $size: {
                            $filter: {
                                input: '$appointments',
                                cond: { $eq: ['$$this.status', 'completed'] }
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    rating: {
                        $cond: {
                            if: { $gt: ['$appointmentCount', 0] },
                            then: {
                                $divide: ['$completedAppointments', '$appointmentCount']
                            },
                            else: 0
                        }
                    }
                }
            },
            {
                $sort: { rating: -1, appointmentCount: -1 }
            },
            {
                $limit: 5
            },
            {
                $project: {
                    name: 1,
                    specialization: 1,
                    appointmentCount: 1,
                    completedAppointments: 1,
                    rating: 1,
                    contactNumber: 1
                }
            }
        ]);

        // Most requested scans
        const mostRequestedScans = await Scan.aggregate([
            {
                $lookup: {
                    from: 'scancategories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            {
                $unwind: '$categoryDetails'
            },
            {
                $group: {
                    _id: '$category',
                    categoryName: { $first: '$categoryDetails.name' },
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$categoryDetails.price' }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 5
            }
        ]);

        // Recent appointments
        const recentAppointments = await Appointment.find()
            .populate('patientId', 'name')
            .populate('referredBy', 'name specialization')
            .populate({
                path: 'scans.scan',
                populate: {
                    path: 'category',
                    select: 'name price'
                }
            })
            .sort({ scheduledAt: -1 })
            .limit(10);

        // Top representatives
        const topRepresentatives = await Representative.getTopRepresentatives(5);

        // Monthly income trend (last 6 months)
        const monthlyIncomeTrend = await Appointment.aggregate([
            {
                $match: {
                    status: 'completed',
                    scheduledAt: {
                        $gte: new Date(today.getFullYear(), today.getMonth() - 5, 1)
                    }
                }
            },
            {
                $unwind: '$scans'
            },
            {
                $lookup: {
                    from: 'scans',
                    localField: 'scans.scan',
                    foreignField: '_id',
                    as: 'scanDetails'
                }
            },
            {
                $unwind: '$scanDetails'
            },
            {
                $lookup: {
                    from: 'scancategories',
                    localField: 'scanDetails.category',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            {
                $unwind: '$categoryDetails'
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$scheduledAt' },
                        month: { $month: '$scheduledAt' }
                    },
                    totalIncome: { $sum: '$categoryDetails.price' },
                    appointmentCount: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        res.status(StatusCodes.OK).json({
            status: 'success',
            data: {
                daily: {
                    appointments: dailyAppointments,
                    income: dailyIncome[0]?.totalIncome || 0
                },
                weekly: {
                    appointments: weeklyAppointments,
                    income: weeklyIncome[0]?.totalIncome || 0
                },
                total: {
                    appointments: totalAppointments,
                    income: totalIncome[0]?.totalIncome || 0
                },
                topRatedDoctors,
                mostRequestedScans,
                recentAppointments,
                topRepresentatives,
                monthlyIncomeTrend
            }
        });
    } catch (error) {
        console.error('Dashboard analytics error:', error);
        throw errors.InternalServerError('Error fetching dashboard analytics');
    }
});

// Get appointment statistics
export const getAppointmentStats = asyncHandler(async (req, res) => {
    const { period = 'week' } = req.query;

    let startDate, endDate;
    const today = new Date();

    switch (period) {
        case 'day':
            startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
            break;
        case 'week':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - today.getDay());
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
        default:
            startDate = new Date(today);
            startDate.setDate(today.getDate() - today.getDay());
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
    }

    try {
        const stats = await Appointment.aggregate([
            {
                $match: {
                    scheduledAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalAppointments = await Appointment.countDocuments({
            scheduledAt: {
                $gte: startDate,
                $lte: endDate
            }
        });

        res.status(StatusCodes.OK).json({
            status: 'success',
            data: {
                period,
                totalAppointments,
                statusBreakdown: stats,
                dateRange: {
                    start: startDate,
                    end: endDate
                }
            }
        });
    } catch (error) {
        console.error('Appointment stats error:', error);
        throw errors.InternalServerError('Error fetching appointment statistics');
    }
}); 