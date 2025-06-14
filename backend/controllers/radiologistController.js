import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import Radiologist from '../models/Radiologist.js';
import { errors } from '../utils/errorHandler.js';
import { executePaginatedQuery } from '../utils/pagination.js';

// Create a new radiologist
export const createRadiologist = asyncHandler(async (req, res) => {
    const { name, gender, age, phoneNumber, licenseId } = req.body;

    // Check if radiologist with same license ID already exists
    const existingRadiologist = await Radiologist.findOne({ licenseId });

    if (existingRadiologist) {
        throw errors.Conflict('Radiologist with this license ID already exists');
    }

    const radiologist = new Radiologist({
        name,
        gender,
        age,
        phoneNumber,
        licenseId,
        createdBy: req.user?._id || '000000000000000000000000' // Default user ID if auth is disabled
    });

    const savedRadiologist = await radiologist.save();
    res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: savedRadiologist
    });
});

// Get all radiologists
export const getRadiologists = asyncHandler(async (req, res) => {
    const { isActive, ...paginationOptions } = req.query;
    const query = { isActive: true }; // Only show active radiologists by default

    if (isActive !== undefined) {
        query.isActive = isActive === 'true';
    }

    const result = await executePaginatedQuery(
        Radiologist,
        query,
        paginationOptions,
        { path: 'createdBy', select: 'username email role' }
    );

    res.status(StatusCodes.OK).json(result);
});

// Get a single radiologist by ID
export const getRadiologist = asyncHandler(async (req, res) => {
    const radiologist = await Radiologist.findOne({
        _id: req.params.id,
        isActive: true
    }).populate('createdBy', 'username email role');

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
    const { name, gender, age, phoneNumber, licenseId, isActive } = req.body;

    // Check if license ID is being changed and if it already exists
    if (licenseId) {
        const existingRadiologist = await Radiologist.findOne({
            _id: { $ne: req.params.id },
            licenseId,
            isActive: true
        });

        if (existingRadiologist) {
            throw errors.Conflict('Radiologist with this license ID already exists');
        }
    }

    const updatedRadiologist = await Radiologist.findOneAndUpdate(
        {
            _id: req.params.id,
            isActive: true
        },
        {
            name,
            gender,
            age,
            phoneNumber,
            licenseId,
            isActive,
            updatedBy: req.user?._id || '000000000000000000000000'
        },
        { new: true, runValidators: true }
    ).populate('createdBy', 'username email role');

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
    const radiologist = await Radiologist.findOne({
        _id: req.params.id,
        isActive: true
    });

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
                _id: '$gender',
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