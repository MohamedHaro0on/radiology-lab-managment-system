import express from 'express';
import {
    createCategory,
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory,
    getCategoryStats
} from '../controllers/scanCategoryController.js';
import { checkPrivilege } from '../middleware/privilege.js';
import { MODULES } from '../config/privileges.js';

const router = express.Router();

// Apply privilege middleware to all routes
router.use(checkPrivilege('scanCategories', 'view'));

// Get all categories and create new category
router.route('/')
    .get(getCategories)
    .post(checkPrivilege('scanCategories', 'create'), createCategory);

// Get category statistics
router.get('/stats', checkPrivilege('scanCategories', 'view'), getCategoryStats);

// Get, update, and delete a single category
router.route('/:id')
    .get(getCategory)
    .put(checkPrivilege('scanCategories', 'update'), updateCategory)
    .delete(checkPrivilege('scanCategories', 'delete'), deleteCategory);

export default router; 