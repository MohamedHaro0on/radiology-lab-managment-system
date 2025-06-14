import express from 'express';
import { auth } from '../middleware/auth.js';
import { checkPrivilege } from '../middleware/privilege.js';
import * as dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

// Apply authentication middleware (temporarily disabled)
// router.use(auth);

// Get dashboard analytics (privilege check temporarily disabled)
router.get('/analytics',
    // checkPrivilege('appointments', 'view'),
    dashboardController.getDashboardAnalytics
);

// Get appointment statistics
router.get('/appointment-stats',
    // checkPrivilege('appointments', 'view'),
    dashboardController.getAppointmentStats
);

export default router; 