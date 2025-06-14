import express from 'express';
import { validate } from '../middleware/validate.js';
// import { auth } from '../middleware/auth.js'; // Temporarily disabled
// import { checkPrivilege, autoCheckPrivileges } from '../middleware/privilege.js'; // Temporarily disabled
import { stockValidation } from '../validations/stockValidation.js';
import * as stockController from '../controllers/stockController.js';
import Joi from 'joi';

const router = express.Router();

// Apply authentication middleware (temporarily disabled)
// router.use(auth);

// Apply auto privilege checking middleware (temporarily disabled)
// router.use(autoCheckPrivileges);

// Get all stock items
router.get('/',
    // checkPrivilege('stock', 'view'), // Temporarily disabled
    validate(stockValidation.getAllStock),
    stockController.getAllStock
);

// // Get stock item by ID
// router.get('/:id',
//     // checkPrivilege('stock', 'view'), // Temporarily disabled
//     validate(stockValidation.getStockById),
//     stockController.getStockById
// );

// Create new stock item
router.post('/',
    // checkPrivilege('stock', 'create'), // Temporarily disabled
    validate(stockValidation.create),
    stockController.createStock
);

// Update stock item
router.patch('/:id',
    // checkPrivilege('stock', 'update'), // Temporarily disabled
    validate(stockValidation.update),
    stockController.updateStock
);

// Update stock quantity
router.patch('/:id/quantity',
    // checkPrivilege('stock', 'update'), // Temporarily disabled
    validate({
        params: stockValidation.delete, // Using delete schema for params (both need id)
        body: Joi.object({
            quantity: Joi.number().integer().min(1).required(),
            operation: Joi.string().valid('add', 'subtract').required()
        })
    }),
    stockController.updateQuantity
);

// Delete stock item
router.delete('/:id',
    // checkPrivilege('stock', 'delete'), // Temporarily disabled
    (req, res, next) => {
        console.log('Delete route hit with params:', req.params);
        console.log('Delete route hit with id:', req.params.id);

        // Basic validation
        if (!req.params.id) {
            return res.status(400).json({
                success: false,
                message: 'Stock ID is required'
            });
        }

        // Check if it's a valid ObjectId
        if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid stock ID format'
            });
        }

        next();
    },
    stockController.deleteStock
);

// @route   GET /api/stock/check-low-stock
// @desc    Check for low stock items and send notifications
// @access  Private (Admin)
router.get(
    '/check-low-stock',
    // checkPrivilege('stock', 'update'),
    stockController.checkLowStock
);

export default router; 