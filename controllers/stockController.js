import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import { errors } from '../utils/errorHandler.js';
import Stock from '../models/Stock.js';

// Create new stock item
export const createStock = asyncHandler(async (req, res) => {
    const stock = await Stock.create({
        ...req.body,
        lastUpdatedBy: req.user._id
    });

    res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: stock
    });
});

// Get all stock items with filtering and pagination
export const getAllStock = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        search,
        category,
        sortBy = 'itemName',
        sortOrder = 'asc',
        lowStock,
        expired
    } = req.query;

    // Build query
    const query = {};
    if (search) {
        query.$or = [
            { itemName: { $regex: search, $options: 'i' } },
            { 'supplier.name': { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } }
        ];
    }
    if (category) {
        query.category = category;
    }
    if (lowStock === 'true') {
        query.$expr = { $lte: ['$quantity', '$minimumQuantity'] };
    }
    if (expired === 'true') {
        query.expiryDate = { $lt: new Date() };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination and sorting
    const stock = await Stock.find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('lastUpdatedBy', 'username email');

    // Get total count for pagination
    const total = await Stock.countDocuments(query);

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: stock,
        pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        }
    });
});

// Get single stock item
export const getStock = asyncHandler(async (req, res) => {
    const stock = await Stock.findById(req.params.id)
        .populate('lastUpdatedBy', 'username email');

    if (!stock) {
        throw errors.NotFound('Stock item not found');
    }

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: stock
    });
});

// Update stock item
export const updateStock = asyncHandler(async (req, res) => {
    const stock = await Stock.findById(req.params.id);

    if (!stock) {
        throw errors.NotFound('Stock item not found');
    }

    // Ensure minimum quantity is not greater than new quantity if both are being updated
    if (req.body.quantity !== undefined && req.body.minimumQuantity !== undefined) {
        if (req.body.minimumQuantity > req.body.quantity) {
            throw errors.BadRequest('Minimum quantity cannot be greater than current quantity');
        }
    }

    const updatedStock = await Stock.findByIdAndUpdate(
        req.params.id,
        {
            $set: {
                ...req.body,
                lastUpdatedBy: req.user._id
            }
        },
        { new: true, runValidators: true }
    ).populate('lastUpdatedBy', 'username email');

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: updatedStock
    });
});

// Update stock quantity
export const updateQuantity = asyncHandler(async (req, res) => {
    const { quantity, operation } = req.body;
    const stock = await Stock.findById(req.params.id);

    if (!stock) {
        throw errors.NotFound('Stock item not found');
    }

    let newQuantity;
    if (operation === 'add') {
        newQuantity = stock.quantity + quantity;
    } else {
        newQuantity = stock.quantity - quantity;
        if (newQuantity < 0) {
            throw errors.BadRequest('Cannot reduce quantity below zero');
        }
    }

    const updatedStock = await Stock.findByIdAndUpdate(
        req.params.id,
        {
            $set: {
                quantity: newQuantity,
                lastUpdatedBy: req.user._id
            }
        },
        { new: true, runValidators: true }
    ).populate('lastUpdatedBy', 'username email');

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: updatedStock
    });
});

// Delete stock item
export const deleteStock = asyncHandler(async (req, res) => {
    const stock = await Stock.findById(req.params.id);

    if (!stock) {
        throw errors.NotFound('Stock item not found');
    }

    // Check if stock has any quantity
    if (stock.quantity > 0) {
        throw errors.Conflict('Cannot delete stock item with remaining quantity');
    }

    await stock.deleteOne();

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Stock item deleted successfully'
    });
});

// Get low stock items
export const getLowStock = asyncHandler(async (req, res) => {
    const lowStock = await Stock.find({
        $expr: { $lte: ['$quantity', '$minimumQuantity'] }
    }).populate('lastUpdatedBy', 'username email');

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: lowStock
    });
});

// Get expired items
export const getExpiredItems = asyncHandler(async (req, res) => {
    const expiredItems = await Stock.find({
        expiryDate: { $lt: new Date() }
    }).populate('lastUpdatedBy', 'username email');

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: expiredItems
    });
}); 