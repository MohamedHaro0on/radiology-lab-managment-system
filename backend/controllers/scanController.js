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
        price,
        minPrice,
        maxPrice,
        items,
        category,
        preparationInstructions,
        duration
    } = req.body;

    // Validate stock items
    for (const item of items) {
        const stockItem = await Stock.findById(item.stockItem);
        if (!stockItem) {
            throw errors.NotFound(`Stock item with ID ${item.stockItem} not found`);
        }
    }

    const scan = new Scan({
        name,
        description,
        price,
        minPrice,
        maxPrice,
        items,
        category,
        preparationInstructions,
        duration,
        createdBy: req.user.id,
        updatedBy: req.user.id
    });

    const savedScan = await scan.save();
    res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: savedScan
    });
});

// Get all scans
export const getScans = asyncHandler(async (req, res) => {
    const { category, isActive, minPrice, maxPrice, ...paginationOptions } = req.query;
    const query = {};

    if (category) {
        query.category = category;
    }
    if (isActive !== undefined) {
        query.isActive = isActive === 'true';
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};
        if (minPrice !== undefined) query.price.$gte = Number(minPrice);
        if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    const result = await executePaginatedQuery(
        Scan,
        query,
        paginationOptions,
        [
            { path: 'items.stockItem', select: 'itemName category quantity' },
            { path: 'createdBy', select: 'username' },
            { path: 'updatedBy', select: 'username' }
        ]
    );

    res.status(StatusCodes.OK).json(result);
});

// Get a single scan by ID
export const getScan = asyncHandler(async (req, res) => {
    const scan = await Scan.findById(req.params.id)
        .populate('items.stockItem', 'itemName category quantity')
        .populate('createdBy', 'username')
        .populate('updatedBy', 'username');

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
        price,
        minPrice,
        maxPrice,
        items,
        category,
        preparationInstructions,
        duration,
        isActive
    } = req.body;

    // Validate stock items if items are being updated
    if (items) {
        for (const item of items) {
            const stockItem = await Stock.findById(item.stockItem);
            if (!stockItem) {
                throw errors.NotFound(`Stock item with ID ${item.stockItem} not found`);
            }
        }
    }

    const updatedScan = await Scan.findByIdAndUpdate(
        req.params.id,
        {
            name,
            description,
            price,
            minPrice,
            maxPrice,
            items,
            category,
            preparationInstructions,
            duration,
            isActive,
            updatedBy: req.user.id
        },
        { new: true, runValidators: true }
    )
        .populate('items.stockItem', 'itemName category quantity')
        .populate('createdBy', 'username')
        .populate('updatedBy', 'username');

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
    const scan = await Scan.findById(req.params.id);

    if (!scan) {
        throw errors.NotFound('Scan not found');
    }

    // Instead of deleting, mark as inactive
    scan.isActive = false;
    scan.updatedBy = req.user.id;
    await scan.save();

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Scan marked as inactive successfully'
    });
});

// Check stock availability for a scan
export const checkStockAvailability = asyncHandler(async (req, res) => {
    const scan = await Scan.findById(req.params.id)
        .populate('items.stockItem', 'itemName category quantity');

    if (!scan) {
        throw errors.NotFound('Scan not found');
    }

    const availability = await scan.checkStockAvailability();
    const stockStatus = [];

    for (const item of scan.items) {
        const stockItem = item.stockItem;
        stockStatus.push({
            itemName: stockItem.itemName,
            required: item.quantity,
            available: stockItem.quantity,
            sufficient: stockItem.quantity >= item.quantity
        });
    }

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: {
            scanId: scan._id,
            scanName: scan.name,
            available: availability,
            stockStatus
        }
    });
});

// Get scan statistics
export const getScanStats = asyncHandler(async (req, res) => {
    const stats = await Scan.aggregate([
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                activeCount: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        }
    ]);

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: stats
    });
});

// Get all scans with search and filtering
export const getAllScans = asyncHandler(async (req, res) => {
    const { query, category, minQuantity, maxQuantity, supplier, isActive, ...paginationOptions } = req.query;
    const searchQuery = {};

    if (query) {
        searchQuery.$or = [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ];
    }
    if (category) {
        searchQuery.category = category;
    }
    if (minQuantity !== undefined || maxQuantity !== undefined) {
        searchQuery.quantity = {};
        if (minQuantity !== undefined) searchQuery.quantity.$gte = Number(minQuantity);
        if (maxQuantity !== undefined) searchQuery.quantity.$lte = Number(maxQuantity);
    }
    if (supplier) {
        searchQuery.supplier = { $regex: supplier, $options: 'i' };
    }
    if (isActive !== undefined) {
        searchQuery.isActive = isActive === 'true';
    }

    const result = await executePaginatedQuery(
        Scan,
        searchQuery,
        paginationOptions,
        [
            { path: 'items.stockItem', select: 'name category quantity' },
            { path: 'createdBy', select: 'username' },
            { path: 'updatedBy', select: 'username' }
        ]
    );

    res.status(StatusCodes.OK).json(result);
});

// Get scans by patient ID
export const getScansByPatient = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { ...paginationOptions } = req.query;

    const result = await executePaginatedQuery(
        Scan,
        { patient: patientId },
        paginationOptions,
        [
            { path: 'doctor', select: 'name specialization' },
            { path: 'radiologist', select: 'name specialization' },
            { path: 'createdBy', select: 'username' }
        ]
    );

    res.status(StatusCodes.OK).json(result);
});

// Get scans by doctor ID
export const getScansByDoctor = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { ...paginationOptions } = req.query;

    const result = await executePaginatedQuery(
        Scan,
        { doctor: doctorId },
        paginationOptions,
        [
            { path: 'patient', select: 'name gender dateOfBirth' },
            { path: 'radiologist', select: 'name specialization' },
            { path: 'createdBy', select: 'username' }
        ]
    );

    res.status(StatusCodes.OK).json(result);
});

// Add image to scan
export const addScanImage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { image } = req.body;

    const scan = await Scan.findById(id);
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
        uploadedBy: req.user.id,
        uploadedAt: Date.now()
    });

    scan.updatedBy = req.user.id;
    await scan.save();

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: scan
    });
});

// Remove image from scan
export const removeScanImage = asyncHandler(async (req, res) => {
    const { id, imageId } = req.params;

    const scan = await Scan.findById(id);
    if (!scan) {
        throw errors.NotFound('Scan not found');
    }

    const imageIndex = scan.images.findIndex(img => img._id.toString() === imageId);
    if (imageIndex === -1) {
        throw errors.NotFound('Image not found in scan');
    }

    scan.images.splice(imageIndex, 1);
    scan.updatedBy = req.user.id;
    await scan.save();

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Image removed successfully'
    });
}); 