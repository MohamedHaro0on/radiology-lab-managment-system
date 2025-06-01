import express from 'express';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';
import { checkPrivilege, autoCheckPrivileges } from '../middleware/privilege.js';
import { stockValidation } from '../validations/stockValidation.js';
import * as stockController from '../controllers/stockController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Apply auto privilege checking middleware
router.use(autoCheckPrivileges);

// Create new stock item
router.post(
    '/',
    checkPrivilege('stock', 'create'),
    validate(stockValidation.createStock),
    stockController.createStock
);

// Get all stock items
router.get(
    '/',
    // checkPrivilege('stock', 'view'),
    validate(stockValidation.getAllStock),
    stockController.getAllStock
);

// Get low stock items
router.get(
    '/low',
    checkPrivilege('stock', 'view'),
    validate(stockValidation.getLowStock),
    stockController.getLowStock
);

// Get expired items
router.get(
    '/expired',
    checkPrivilege('stock', 'view'),
    validate(stockValidation.getExpiredItems),
    stockController.getExpiredItems
);

// Get single stock item
router.get(
    '/:id',
    checkPrivilege('stock', 'view'),
    validate(stockValidation.getStock),
    stockController.getStock
);

// Update stock item
router.patch(
    '/:id',
    checkPrivilege('stock', 'update'),
    validate(stockValidation.updateStock),
    stockController.updateStock
);

// Update stock quantity
router.patch(
    '/:id/quantity',
    checkPrivilege('stock', 'update'),
    validate(stockValidation.updateQuantity),
    stockController.updateQuantity
);

// Delete stock item
router.delete(
    '/:id',
    checkPrivilege('stock', 'delete'),
    validate(stockValidation.deleteStock),
    stockController.deleteStock
);

// @route   GET /api/stock/check-low-stock
// @desc    Check for low stock items and send notifications
// @access  Private (Admin)
router.get(
    '/check-low-stock',
    checkPrivilege('stock', 'update'),
    stockController.checkLowStock
);

export default router; 