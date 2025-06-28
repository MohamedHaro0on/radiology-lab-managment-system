import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import Branch from '../models/Branch.js';
import { errors } from '../utils/errorHandler.js';
import { logAudit } from '../services/auditService.js';

// @desc    Create a new branch
// @route   POST /api/branches
// @access  Private (Admin/Manager)
// @body    {
//   name: string (required),
//   location: string (required),
//   address: string (required),
//   phone: string (required),
//   email: string (required),
//   manager: string (required),
//   isActive: boolean (optional, default: true)
// }
export const createBranch = asyncHandler(async (req, res) => {
    const { name, location, address, phone, email, manager, isActive = true } = req.body;

    // Check if branch with same name already exists
    const existingBranch = await Branch.findOne({ name });
    if (existingBranch) {
        throw errors.Conflict('A branch with this name already exists');
    }

    // Check if branch with same email already exists
    const existingEmail = await Branch.findOne({ email });
    if (existingEmail) {
        throw errors.Conflict('A branch with this email already exists');
    }

    const branch = await Branch.create({
        name,
        location,
        address,
        phone,
        email,
        manager,
        isActive
    });

    // Log audit trail
    await logAudit({
        user: req.user._id,
        action: 'CREATE',
        entityId: branch._id,
        changes: branch.toObject()
    });

    res.status(StatusCodes.CREATED).json({
        status: 'success',
        message: 'Branch created successfully',
        data: branch.info
    });
});

// @desc    Get all branches with filtering and pagination
// @route   GET /api/branches
// @access  Private (Admin/Manager)
// @query   {
//   page: number (default: 1),
//   limit: number (default: 10),
//   search: string (optional),
//   status: string (optional, 'active', 'inactive', 'all'),
//   sortBy: string (optional, 'name', 'location', 'manager', 'createdAt'),
//   sortOrder: string (optional, 'asc', 'desc')
// }
export const getAllBranches = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        search,
        status = 'all',
        sortBy = 'name',
        sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = {};

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } },
            { address: { $regex: search, $options: 'i' } },
            { manager: { $regex: search, $options: 'i' } }
        ];
    }

    if (status !== 'all') {
        query.isActive = status === 'active';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const [branches, total] = await Promise.all([
        Branch.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
        Branch.countDocuments(query)
    ]);

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: branches.map(branch => ({
            ...branch,
            id: branch._id
        })),
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    });
});

// @desc    Get all active branches
// @route   GET /api/branches/active
// @access  Public
export const getActiveBranches = asyncHandler(async (req, res) => {
    const branches = await Branch.find({ isActive: true })
        .select('name location address phone email manager')
        .sort({ name: 1 });

    res.status(StatusCodes.OK).json({
        status: 'success',
        count: branches.length,
        data: branches.map(branch => ({
            ...branch.toObject(),
            id: branch._id
        }))
    });
});

// @desc    Get a single branch by ID
// @route   GET /api/branches/:id
// @access  Private (Admin/Manager)
export const getBranchById = asyncHandler(async (req, res) => {
    const branch = await Branch.findById(req.params.id);

    if (!branch) {
        throw errors.NotFound('Branch not found');
    }

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: branch.info
    });
});

// @desc    Update a branch
// @route   PATCH /api/branches/:id
// @access  Private (Admin/Manager)
// @body    {
//   name: string (optional),
//   location: string (optional),
//   address: string (optional),
//   phone: string (optional),
//   email: string (optional),
//   manager: string (optional),
//   isActive: boolean (optional)
// }
export const updateBranch = asyncHandler(async (req, res) => {
    const { name, location, address, phone, email, manager, isActive } = req.body;

    const branch = await Branch.findById(req.params.id);
    if (!branch) {
        throw errors.NotFound('Branch not found');
    }

    // Store original document for comparison
    const originalBranch = branch.toObject();

    // Check if another branch with the new name already exists
    if (name && name !== branch.name) {
        const existingBranch = await Branch.findOne({ name });
        if (existingBranch) {
            throw errors.Conflict('A branch with this name already exists');
        }
    }

    // Check if another branch with the new email already exists
    if (email && email !== branch.email) {
        const existingEmail = await Branch.findOne({ email });
        if (existingEmail) {
            throw errors.Conflict('A branch with this email already exists');
        }
    }

    // Update fields
    if (name !== undefined) branch.name = name;
    if (location !== undefined) branch.location = location;
    if (address !== undefined) branch.address = address;
    if (phone !== undefined) branch.phone = phone;
    if (email !== undefined) branch.email = email;
    if (manager !== undefined) branch.manager = manager;
    if (isActive !== undefined) branch.isActive = isActive;

    const updatedBranch = await branch.save();

    // Log audit trail
    await logAudit({
        user: req.user._id,
        action: 'UPDATE',
        entityId: updatedBranch._id,
        changes: {
            before: originalBranch,
            after: updatedBranch.toObject()
        }
    });

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Branch updated successfully',
        data: updatedBranch.info
    });
});

// @desc    Delete a branch
// @route   DELETE /api/branches/:id
// @access  Private (Admin)
export const deleteBranch = asyncHandler(async (req, res) => {
    const branch = await Branch.findById(req.params.id);

    if (!branch) {
        throw errors.NotFound('Branch not found');
    }

    // TODO: Add check to see if the branch is being used by appointments or stock
    // For now, we'll allow deletion but log it for audit purposes

    const deletedBranch = branch.toObject();
    await branch.deleteOne();

    // Log audit trail
    await logAudit({
        user: req.user._id,
        action: 'DELETE',
        entityId: deletedBranch._id,
        changes: {
            deleted: deletedBranch
        }
    });

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Branch deleted successfully'
    });
}); 