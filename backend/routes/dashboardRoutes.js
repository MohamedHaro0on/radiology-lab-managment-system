import express from 'express';
import { auth } from '../middleware/auth.js';
import { autoCheckPrivileges } from '../middleware/privilege.js';
import * as dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

// Apply authentication middleware
router.use(auth);
router.use(autoCheckPrivileges);

// Get dashboard analytics
router.get('/analytics',
    dashboardController.getDashboardAnalytics
);

// Get appointment statistics
router.get('/appointment-stats',
    dashboardController.getAppointmentStats
);

export default router; 