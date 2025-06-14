import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import Scan from '../models/Scan.js';
import Stock from '../models/Stock.js';
import { errors } from '../utils/errorHandler.js';
import { executePaginatedQuery } from '../utils/pagination.js';

// Create a new scan
export const createScan = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        actualCost,
        minPrice,
        items
    } = req.body;

    const scanData = {
        name,
        description,
        actualCost,
        minPrice,
        items,
        createdBy: req.user?._id || null // Make createdBy optional when auth is disabled
    };

    const scan = new Scan(scanData);
    const savedScan = await scan.save();

    res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: savedScan
    });
});

// Get all scans
export const getAllScans = asyncHandler(async (req, res) => {
    const { search, category, minPrice, maxPrice, isActive, ...paginationOptions } = req.query;
    const query = { isActive: true }; // Only show active scans by default

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }
    if (category) {
        query.category = category;
    }
    if (isActive !== undefined) {
        query.isActive = isActive === 'true';
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
        query.minPrice = {};
        if (minPrice !== undefined) query.minPrice.$gte = Number(minPrice);
        if (maxPrice !== undefined) query.minPrice.$lte = Number(maxPrice);
    }

    const result = await executePaginatedQuery(
        Scan,
        query,
        paginationOptions,
        { path: 'createdBy', select: 'username email' }
    );

    res.status(StatusCodes.OK).json(result);
});

// Get a single scan by ID
export const getScan = asyncHandler(async (req, res) => {
    const scan = await Scan.findOne({
        _id: req.params.id,
        isActive: true
    }).populate('createdBy', 'username email');

    if (!scan) {
        throw errors.NotFound('Scan not found');
    }

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: scan
    });
});

// Update a scan
export const updateScan = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        actualCost,
        minPrice,
        items
    } = req.body;

    const updatedScan = await Scan.findOneAndUpdate(
        {
            _id: req.params.id,
            isActive: true
        },
        {
            $set: {
                ...req.body,
                updatedBy: req.user?._id || null // Make updatedBy optional when auth is disabled
            }
        },
        { new: true, runValidators: true }
    )
        .populate('createdBy', 'username email');

    if (!updatedScan) {
        throw errors.NotFound('Scan not found');
    }

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: updatedScan
    });
});

// Delete a scan
export const deleteScan = asyncHandler(async (req, res) => {
    const scan = await Scan.findOne({
        _id: req.params.id,
        isActive: true
    });

    if (!scan) {
        throw errors.NotFound('Scan not found');
    }

    // Instead of deleting, mark as inactive
    scan.isActive = false;
    scan.updatedBy = req.user?._id || null; // Make updatedBy optional when auth is disabled
    await scan.save();

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Scan marked as inactive successfully'
    });
});

// Check stock availability for a scan
export const checkStockAvailability = asyncHandler(async (req, res) => {
    const scan = await Scan.findOne({
        _id: req.params.id,
        isActive: true
    });

    if (!scan) {
        throw errors.NotFound('Scan not found');
    }

    const stockStatus = [];

    for (const item of scan.items) {
        // For now, we'll just return the item details since we don't have stock integration
        stockStatus.push({
            itemName: item.item,
            required: item.quantity,
            available: 'N/A', // This would be populated from stock system
            sufficient: true // This would be calculated from stock system
        });
    }

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: {
            scanId: scan._id,
            scanName: scan.name,
            available: true, // This would be calculated from stock system
            stockStatus
        }
    });
});

// Get scan statistics
export const getScanStats = asyncHandler(async (req, res) => {
    const stats = await Scan.aggregate([
        {
            $group: {
                _id: null,
                count: { $sum: 1 },
                activeCount: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
                avgActualCost: { $avg: '$actualCost' },
                avgMinPrice: { $avg: '$minPrice' },
                minPrice: { $min: '$minPrice' },
                maxPrice: { $max: '$minPrice' }
            }
        }
    ]);

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: stats[0] || {
            count: 0,
            activeCount: 0,
            avgActualCost: 0,
            avgMinPrice: 0,
            minPrice: 0,
            maxPrice: 0
        }
    });
});

// Get scans by patient ID
export const getScansByPatient = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { ...paginationOptions } = req.query;

    const result = await executePaginatedQuery(
        Scan,
        { patient: patientId, isActive: true },
        paginationOptions,
        { path: 'createdBy', select: 'username email' }
    );

    res.status(StatusCodes.OK).json(result);
});

// Get scans by doctor ID
export const getScansByDoctor = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { ...paginationOptions } = req.query;

    const result = await executePaginatedQuery(
        Scan,
        { doctor: doctorId, isActive: true },
        paginationOptions,
        { path: 'createdBy', select: 'username email' }
    );

    res.status(StatusCodes.OK).json(result);
});

// Add image to scan
export const addScanImage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { image } = req.body;

    const scan = await Scan.findOne({
        _id: id,
        isActive: true
    });
    if (!scan) {
        throw errors.NotFound('Scan not found');
    }

    if (!scan.images) {
        scan.images = [];
    }

    if (scan.images.length >= 20) {
        throw errors.BadRequest('Cannot add more than 20 images to a scan');
    }

    scan.images.push({
        ...image,
        uploadedBy: req.user?._id || null, // Make uploadedBy optional when auth is disabled
        uploadedAt: Date.now()
    });

    scan.updatedBy = req.user?._id || null; // Make updatedBy optional when auth is disabled
    await scan.save();

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: scan
    });
});

// Remove image from scan
export const removeScanImage = asyncHandler(async (req, res) => {
    const { id, imageId } = req.params;

    const scan = await Scan.findOne({
        _id: id,
        isActive: true
    });
    if (!scan) {
        throw errors.NotFound('Scan not found');
    }

    const imageIndex = scan.images.findIndex(img => img._id.toString() === imageId);
    if (imageIndex === -1) {
        throw errors.NotFound('Image not found in scan');
    }

    scan.images.splice(imageIndex, 1);
    scan.updatedBy = req.user?._id || null; // Make updatedBy optional when auth is disabled
    await scan.save();

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Image removed successfully'
    });
}); 