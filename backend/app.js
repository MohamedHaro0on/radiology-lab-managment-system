import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { setupSecurityMiddleware } from './config/security.js';
import { initializeDatabase, checkDatabaseHealth } from './config/database.js';
import { errors } from './utils/errorHandler.js';
import { StatusCodes } from 'http-status-codes';
import { createServer } from 'http';
import websocketManager from './utils/websocket.js';
// import cors from 'cors';
// import helmet from 'helmet';
// import morgan from 'morgan';
// import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';
// import { errorHandler } from './middleware/errorHandler.js';

// Get current file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();

// Initialize security middleware
setupSecurityMiddleware(app);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const dbStatus = await checkDatabaseHealth();
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Service is healthy',
            data: {
                uptime: process.uptime(),
                timestamp: Date.now(),
                database: dbStatus
            }
        });
    } catch (error) {
        res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
            status: 'error',
            message: 'Service is unhealthy',
            error: error.message
        });
    }
});

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import patientHistoryRoutes from './routes/patientHistoryRoutes.js';
import scanRoutes from './routes/scanRoutes.js';
import scanCategoryRoutes from './routes/scanCategoryRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import metaRoutes from './routes/metaRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import representativeRoutes from './routes/representativeRoutes.js';

// Apply routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/patient-history', patientHistoryRoutes);
app.use('/api/scan-categories', scanCategoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/representatives', representativeRoutes);

// Error handling middleware
app.use((req, res, next) => {
    next(errors.NotFound('Route not found'));
});

app.use((err, req, res, next) => {

    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        return res.status(StatusCodes.BAD_REQUEST).json({
            status: 'error',
            message: 'Validation Error',
            errors
        });
    }

    // Handle mongoose duplicate key errors
    if (err.code === 11000) {
        return res.status(StatusCodes.CONFLICT).json({
            status: 'error',
            message: 'Duplicate field value entered',
            field: Object.keys(err.keyPattern)[0]
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            status: 'error',
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            status: 'error',
            message: 'Token expired'
        });
    }

    // Handle custom errors
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message
        });
    }

    // Handle all other errors
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Internal server error'
    });
});

// Initialize database and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await initializeDatabase();
        const server = createServer(app);
        websocketManager.initialize(server);
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    process.exit(1);
});

// Start the server
startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
}); 