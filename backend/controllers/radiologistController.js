import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import Radiologist from '../models/Radiologist.js';
import User from '../models/User.js';
import { errors } from '../utils/errorHandler.js';
import { executePaginatedQuery } from '../utils/pagination.js';

// Create a new radiologist
export const createRadiologist = asyncHandler(async (req, res) => {
    const { name, email, contactNumber, specialization, licenseNumber, qualifications, expertise, user } = req.body;

    // Check if user exists and has appropriate role
    const userDoc = await User.findById(user);
    if (!userDoc) {
        throw errors.NotFound('User not found');
    }
    if (userDoc.role !== 'technician') {
        throw errors.BadRequest('User must have technician role');
    }

    // Check if radiologist with same email or license already exists
    const existingRadiologist = await Radiologist.findOne({
        $or: [{ email }, { licenseNumber }]
    });

    if (existingRadiologist) {
        throw errors.Conflict('Radiologist with this email or license number already exists');
    }

    const radiologist = new Radiologist({
        name,
        email,
        contactNumber,
        specialization,
        licenseNumber,
        qualifications,
        expertise,
        user
    });

    const savedRadiologist = await radiologist.save();
    res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: savedRadiologist
    });
});

// Get all radiologists
export const getRadiologists = asyncHandler(async (req, res) => {
    const { specialization, isActive, ...paginationOptions } = req.query;
    const query = {};

    if (specialization) {
        query.specialization = specialization;
    }
    if (isActive !== undefined) {
        query.isActive = isActive === 'true';
    }

    const result = await executePaginatedQuery(
        Radiologist,
        query,
        paginationOptions,
        { path: 'user', select: 'username email role' }
    );

    res.status(StatusCodes.OK).json(result);
});

// Get a single radiologist by ID
export const getRadiologist = asyncHandler(async (req, res) => {
    const radiologist = await Radiologist.findById(req.params.id)
        .populate('user', 'username email role');

    if (!radiologist) {
        throw errors.NotFound('Radiologist not found');
    }

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: radiologist
    });
});

// Update a radiologist
export const updateRadiologist = asyncHandler(async (req, res) => {
    const { name, email, contactNumber, specialization, licenseNumber, qualifications, expertise, isActive } = req.body;

    // Check if email or license number is being changed and if it already exists
    if (email || licenseNumber) {
        const existingRadiologist = await Radiologist.findOne({
            _id: { $ne: req.params.id },
            $or: [
                ...(email ? [{ email }] : []),
                ...(licenseNumber ? [{ licenseNumber }] : [])
            ]
        });

        if (existingRadiologist) {
            throw errors.Conflict('Radiologist with this email or license number already exists');
        }
    }

    const updatedRadiologist = await Radiologist.findByIdAndUpdate(
        req.params.id,
        {
            name,
            email,
            contactNumber,
            specialization,
            licenseNumber,
            qualifications,
            expertise,
            isActive
        },
        { new: true, runValidators: true }
    ).populate('user', 'username email role');

    if (!updatedRadiologist) {
        throw errors.NotFound('Radiologist not found');
    }

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: updatedRadiologist
    });
});

// Delete a radiologist
export const deleteRadiologist = asyncHandler(async (req, res) => {
    const radiologist = await Radiologist.findById(req.params.id);

    if (!radiologist) {
        throw errors.NotFound('Radiologist not found');
    }

    // Instead of deleting, mark as inactive
    radiologist.isActive = false;
    await radiologist.save();

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Radiologist marked as inactive successfully'
    });
});

// Get radiologist statistics
export const getRadiologistStats = asyncHandler(async (req, res) => {
    const stats = await Radiologist.aggregate([
        {
            $group: {
                _id: '$specialization',
                count: { $sum: 1 },
                activeCount: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                }
            }
        }
    ]);

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: stats
    });
}); 