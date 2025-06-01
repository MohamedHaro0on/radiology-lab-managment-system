import asyncHandler from 'express-async-handler';
import ScanCategory from '../models/ScanCategory.js';
import { errors } from '../utils/errorHandler.js';

// Create a new scan category
export const createCategory = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        price,
        duration,
        preparationInstructions,
        isActive = true
    } = req.body;

    // Check if category with same name exists
    const existingCategory = await ScanCategory.findOne({ name });
    if (existingCategory) {
        throw errors.Conflict('A category with this name already exists');
    }

    const category = await ScanCategory.create({
        name,
        description,
        price,
        duration,
        preparationInstructions,
        isActive
    });

    res.status(201).json({
        success: true,
        data: category.info
    });
});

// Get all scan categories
export const getCategories = asyncHandler(async (req, res) => {
    const { isActive, search } = req.query;
    const query = {};

    if (isActive !== undefined) {
        query.isActive = isActive === 'true';
    }

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    const categories = await ScanCategory.find(query)
        .sort({ name: 1 });

    res.json({
        success: true,
        count: categories.length,
        data: categories.map(category => category.info)
    });
});

// Get a single scan category
export const getCategory = asyncHandler(async (req, res) => {
    const category = await ScanCategory.findById(req.params.id);
    if (!category) {
        throw errors.NotFound('Scan category not found');
    }

    res.json({
        success: true,
        data: category.info
    });
});

// Update a scan category
export const updateCategory = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        price,
        duration,
        preparationInstructions,
        isActive
    } = req.body;

    const category = await ScanCategory.findById(req.params.id);
    if (!category) {
        throw errors.NotFound('Scan category not found');
    }

    // If name is being changed, check for duplicates
    if (name && name !== category.name) {
        const existingCategory = await ScanCategory.findOne({ name });
        if (existingCategory) {
            throw errors.Conflict('A category with this name already exists');
        }
    }

    // Update fields
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (price !== undefined) category.price = price;
    if (duration !== undefined) category.duration = duration;
    if (preparationInstructions !== undefined) category.preparationInstructions = preparationInstructions;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.json({
        success: true,
        data: category.info
    });
});

// Delete a scan category
export const deleteCategory = asyncHandler(async (req, res) => {
    const category = await ScanCategory.findById(req.params.id);
    if (!category) {
        throw errors.NotFound('Scan category not found');
    }

    // Check if category is in use
    const Scan = mongoose.model('Scan');
    const scanCount = await Scan.countDocuments({ category: category._id });
    if (scanCount > 0) {
        throw errors.Conflict('Cannot delete category that is associated with existing scans');
    }

    await category.deleteOne();

    res.json({
        success: true,
        data: {}
    });
});

// Get category statistics
export const getCategoryStats = asyncHandler(async (req, res) => {
    const stats = await ScanCategory.aggregate([
        {
            $lookup: {
                from: 'scans',
                localField: '_id',
                foreignField: 'category',
                as: 'scans'
            }
        },
        {
            $project: {
                name: 1,
                scanCount: { $size: '$scans' },
                totalRevenue: {
                    $reduce: {
                        input: '$scans',
                        initialValue: 0,
                        in: { $add: ['$$value', '$price'] }
                    }
                }
            }
        },
        {
            $sort: { scanCount: -1 }
        }
    ]);

    res.json({
        success: true,
        data: stats
    });
}); 