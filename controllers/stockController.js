import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import { errors } from '../utils/errorHandler.js';
import Stock from '../models/Stock.js';
import { executePaginatedQuery } from '../utils/pagination.js';
import websocketManager from '../utils/websocket.js';
import User from '../models/User.js';

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
        search,
        category,
        lowStock,
        expired,
        ...paginationOptions
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

    const result = await executePaginatedQuery(
        Stock,
        query,
        paginationOptions,
        { path: 'lastUpdatedBy', select: 'username email' }
    );

    res.status(StatusCodes.OK).json(result);
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
    const { ...paginationOptions } = req.query;
    const query = {
        $expr: { $lte: ['$quantity', '$minimumQuantity'] }
    };

    const result = await executePaginatedQuery(
        Stock,
        query,
        paginationOptions,
        { path: 'lastUpdatedBy', select: 'username email' }
    );

    res.status(StatusCodes.OK).json(result);
});

// Get expired items
export const getExpiredItems = asyncHandler(async (req, res) => {
    const { ...paginationOptions } = req.query;
    const query = {
        expiryDate: { $lt: new Date() }
    };

    const result = await executePaginatedQuery(
        Stock,
        query,
        paginationOptions,
        { path: 'lastUpdatedBy', select: 'username email' }
    );

    res.status(StatusCodes.OK).json(result);
});

// Check for low stock items and send notifications
export const checkLowStock = asyncHandler(async (req, res) => {
    try {
        const lowStockItems = await Stock.find({
            $expr: { $lte: ['$quantity', '$minimumQuantity'] },
            isActive: true
        }).populate('lastUpdatedBy', 'username email');

        // Send notifications to all admin users
        const adminUsers = await User.find({
            'privileges.module': 'stock',
            'privileges.operations': { $in: ['manage', 'update'] }
        });

        if (lowStockItems.length > 0) {
            const notification = {
                type: 'low_stock_alert',
                data: {
                    items: lowStockItems.map(item => ({
                        id: item._id,
                        name: item.itemName,
                        quantity: item.quantity,
                        minimumQuantity: item.minimumQuantity,
                        category: item.category,
                        unit: item.unit
                    }))
                }
            };

            // Send notification to all admin users
            adminUsers.forEach(admin => {
                websocketManager.sendNotification(admin._id.toString(), notification);
            });
        }

        res.json({
            success: true,
            data: {
                lowStockItems,
                count: lowStockItems.length
            }
        });
    } catch (error) {
        next(error);
    }
}); 