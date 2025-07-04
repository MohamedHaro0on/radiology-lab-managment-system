import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import { errors } from '../utils/errorHandler.js';
import Stock from '../models/Stock.js';
import { executePaginatedQuery } from '../utils/pagination.js';
import websocketManager from '../utils/websocket.js';
import User from '../models/User.js';

// Create new stock item
export const createStock = asyncHandler(async (req, res) => {
    const stockData = {
        ...req.body,
        createdBy: req.user?._id || null // Make createdBy optional when auth is disabled
    };

    const stock = await Stock.create(stockData);

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
        branch,
        lowStock,
        expired,
        ...paginationOptions
    } = req.query;

    // Build query
    const query = {};
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } }
        ];
    }
    if (category) {
        query.category = category;
    }
    if (branch) {
        query.branch = branch;
    }
    if (lowStock === 'true') {
        query.$expr = { $lte: ['$quantity', '$minimumThreshold'] };
    }
    if (expired === 'true') {
        query.validUntil = { $lt: new Date() };
    }

    const result = await executePaginatedQuery(
        Stock,
        query,
        paginationOptions,
        { path: 'updatedBy branch', select: 'username email name' }
    );

    res.status(StatusCodes.OK).json(result);
});

// Get single stock item
export const getStock = asyncHandler(async (req, res) => {
    const stock = await Stock.findById(req.params.id)
        .populate('updatedBy', 'username email');

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
    if (req.body.quantity !== undefined && req.body.minimumThreshold !== undefined) {
        if (req.body.minimumThreshold > req.body.quantity) {
            throw errors.BadRequest('Minimum quantity cannot be greater than current quantity');
        }
    }

    const updatedStock = await Stock.findByIdAndUpdate(
        req.params.id,
        {
            $set: {
                ...req.body,
                updatedBy: req.user?._id || null // Make updatedBy optional when auth is disabled
            }
        },
        { new: true, runValidators: true }
    ).populate('updatedBy', 'username email');

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
                updatedBy: req.user?._id || null // Make updatedBy optional when auth is disabled
            }
        },
        { new: true, runValidators: true }
    ).populate('updatedBy', 'username email');

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: updatedStock
    });
});

// Delete stock item
export const deleteStock = asyncHandler(async (req, res) => {
    console.log('DeleteStock controller called with params:', req.params);
    console.log('DeleteStock controller called with id:', req.params.id);

    const stock = await Stock.findById(req.params.id);
    console.log('Found stock item:', stock);

    if (!stock) {
        throw errors.NotFound('Stock item not found');
    }

    // Check if stock has any quantity
    // console.log('Stock quantity:', stock.quantity);
    // if (stock.quantity > 0) {
    //     throw errors.Conflict('Cannot delete stock item with remaining quantity');
    // }

    await stock.deleteOne();
    console.log('Stock item deleted successfully');

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Stock item deleted successfully'
    });
});

// Get low stock items
export const getLowStock = asyncHandler(async (req, res) => {
    const { branch, ...paginationOptions } = req.query;
    const query = {
        $expr: { $lte: ['$quantity', '$minimumThreshold'] }
    };
    if (branch) {
        query.branch = branch;
    }

    const result = await executePaginatedQuery(
        Stock,
        query,
        paginationOptions,
        { path: 'updatedBy branch', select: 'username email name' }
    );

    res.status(StatusCodes.OK).json(result);
});

// Get expired items
export const getExpiredItems = asyncHandler(async (req, res) => {
    const { branch, ...paginationOptions } = req.query;
    const query = {
        validUntil: { $lt: new Date() }
    };
    if (branch) {
        query.branch = branch;
    }

    const result = await executePaginatedQuery(
        Stock,
        query,
        paginationOptions,
        { path: 'updatedBy branch', select: 'username email name' }
    );

    res.status(StatusCodes.OK).json(result);
});

// Check for low stock items and send notifications
export const checkLowStock = asyncHandler(async (req, res) => {
    try {
        const lowStockItems = await Stock.find({
            $expr: { $lte: ['$quantity', '$minimumThreshold'] },
            isActive: true
        }).populate('updatedBy', 'username email');

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
                        name: item.name,
                        quantity: item.quantity,
                        minimumThreshold: item.minimumThreshold,
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