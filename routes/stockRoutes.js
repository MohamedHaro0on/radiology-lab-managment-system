import express from 'express';
import { auth, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import stockValidation from '../validations/stockValidation.js';
import {
    createStock,
    getAllStock,
    getStock,
    updateStock,
    deleteStock,
    getLowStock,
    getExpiredItems
} from '../controllers/stockController.js';

const router = express.Router();

// CRUD routes
router.post('/', auth, authorize('admin', 'technician'), validate(stockValidation.createStock.body), createStock);
router.get('/', auth, authorize('admin', 'technician', 'receptionist'), validate(stockValidation.listStock.query), getAllStock);
router.get('/low', auth, authorize('admin', 'technician'), getLowStock);
router.get('/expired', auth, authorize('admin', 'technician'), getExpiredItems);
router.get('/:id', auth, authorize('admin', 'technician', 'receptionist'), validate(stockValidation.getStock.params), getStock);
router.patch('/:id', auth, authorize('admin', 'technician'), validate(stockValidation.updateStock.params), validate(stockValidation.updateStock.body), updateStock);
router.delete('/:id', auth, authorize('admin'), validate(stockValidation.deleteStock.params), deleteStock);

export default router; 