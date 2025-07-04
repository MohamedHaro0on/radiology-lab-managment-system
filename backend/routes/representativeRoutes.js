import express from 'express';
import { auth } from '../middleware/auth.js';
import {
    createRepresentative,
    getAllRepresentatives,
    getRepresentativeById,
    updateRepresentative,
    deleteRepresentative,
    getTopRepresentatives,
    getRepresentativeStats,
    recalculateCounts,
    getRepresentativesForDropdown
} from '../controllers/representativeController.js';
import {
    createRepresentativeSchema,
    updateRepresentativeSchema,
    representativeIdSchema,
    representativeQuerySchema
} from '../validations/representativeValidation.js';
import { validate } from '../middleware/validate.js';
import { checkPrivilege } from '../middleware/privilege.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Create representative
router.post('/',
    validate(createRepresentativeSchema),
    checkPrivilege('representatives', 'create'),
    createRepresentative
);

// Get all representatives with pagination and filtering
router.get('/',
    validate({ query: representativeQuerySchema }),
    checkPrivilege('representatives', 'view'),
    getAllRepresentatives
);

// Get top representatives (must come before /:id route)
router.get('/top/representatives',
    checkPrivilege('representatives', 'view'),
    getTopRepresentatives
);

// Get representatives for dropdown (active only) (must come before /:id route)
router.get('/dropdown/representatives',
    checkPrivilege('representatives', 'view'),
    getRepresentativesForDropdown
);

// Get representative by ID
router.get('/:id',
    validate({ params: representativeIdSchema }),
    checkPrivilege('representatives', 'view'),
    getRepresentativeById
);

// Update representative
router.put('/:id',
    validate({ params: representativeIdSchema, body: updateRepresentativeSchema }),
    checkPrivilege('representatives', 'update'),
    updateRepresentative
);

// Delete representative
router.delete('/:id',
    validate({ params: representativeIdSchema }),
    checkPrivilege('representatives', 'delete'),
    deleteRepresentative
);

// Get representative statistics
router.get('/:id/stats',
    validate({ params: representativeIdSchema }),
    checkPrivilege('representatives', 'view'),
    getRepresentativeStats
);

// Recalculate representative counts
router.post('/:id/recalculate',
    validate({ params: representativeIdSchema }),
    checkPrivilege('representatives', 'update'),
    recalculateCounts
);

export default router; 