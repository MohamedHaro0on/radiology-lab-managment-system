import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger.js';
import config from './config/index.js';
import { errors, AppError, errorHandler } from './utils/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import patientHistoryRoutes from './routes/patientHistoryRoutes.js';
import radiologistRoutes from './routes/radiologistRoutes.js';
import scanRoutes from './routes/scanRoutes.js';
import scanCategoryRoutes from './routes/scanCategoryRoutes.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { setupSecurityMiddleware } from './config/security.js';
import { initializeDatabase, checkDatabaseHealth } from './config/database.js';

// Get current file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Apply security middleware
setupSecurityMiddleware(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Radiology Lab API Documentation'
}));

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const dbStatus = await checkDatabaseHealth();
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: dbStatus
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            error: error.message
        });
    }
});

// Apply routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/scan-categories', scanCategoryRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/radiologists', radiologistRoutes);
app.use('/api/patient-history', patientHistoryRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    try {
        await initializeDatabase();
        console.log(`Server is running on port ${PORT}`);
        console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
});

export default app;
