import express from 'express';
import {
    createBranch,
    getAllBranches,
    getActiveBranches,
    getBranchById,
    updateBranch,
    deleteBranch
} from '../controllers/branchController.js';
import { auth } from '../middleware/auth.js';
import { checkPrivilege } from '../middleware/privilege.js';
import {
    validateBranchBody,
    validateBranchParams,
    validateBranchQuery,
    createBranchSchema,
    updateBranchSchema
} from '../validations/branchValidation.js';

const router = express.Router();

// Public route
router.get('/active', getActiveBranches);

// Protected routes
router.use(auth);

router.route('/')
    .post(
        checkPrivilege('branches', 'create'),
        validateBranchBody(createBranchSchema),
        createBranch
    )
    .get(
        checkPrivilege('branches', 'view'),
        validateBranchQuery,
        getAllBranches
    );

router.route('/:id')
    .get(
        checkPrivilege('branches', 'view'),
        validateBranchParams,
        getBranchById
    )
    .patch(
        checkPrivilege('branches', 'update'),
        validateBranchParams,
        validateBranchBody(updateBranchSchema),
        updateBranch
    )
    .delete(
        checkPrivilege('branches', 'delete'),
        validateBranchParams,
        deleteBranch
    );

export default router; 