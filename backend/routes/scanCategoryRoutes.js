import express from 'express';
import { auth } from '../middleware/auth.js';
import { autoCheckPrivileges } from '../middleware/privilege.js';
import {
    createCategory,
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory,
    getCategoryStats
} from '../controllers/scanCategoryController.js';
import { MODULES } from '../config/privileges.js';

const router = express.Router();

router.use(auth);
router.use(autoCheckPrivileges);

// Get all categories and create new category
router.route('/')
    .get(getCategories)
    .post(createCategory);

// Get category statistics
router.get('/stats', getCategoryStats);

// Get, update, and delete a single category
router.route('/:id')
    .get(getCategory)
    .put(updateCategory)
    .delete(deleteCategory);

export default router; 