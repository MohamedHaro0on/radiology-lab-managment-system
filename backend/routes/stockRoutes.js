import express from 'express';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';
import { autoCheckPrivileges } from '../middleware/privilege.js';
import { stockValidation } from '../validations/stockValidation.js';
import * as stockController from '../controllers/stockController.js';
import Joi from 'joi';

const router = express.Router();

// Apply authentication middleware
router.use(auth);

// Apply auto privilege checking middleware
router.use(autoCheckPrivileges);

// Get all stock items
router.get('/',
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
    validate(stockValidation.create),
    stockController.createStock
);

// Update stock item
router.patch('/:id',
    validate(stockValidation.update),
    stockController.updateStock
);

// Update stock quantity
router.patch('/:id/quantity',
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
    stockController.checkLowStock
);

export default router; 