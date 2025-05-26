import express from 'express';
import dotenv from 'dotenv';
import { setupSecurityMiddleware } from './config/security.js';
import { initializeDatabase, checkDatabaseHealth } from './config/database.js';
import { errors } from './utils/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();

// Initialize security middleware
setupSecurityMiddleware(app);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const dbHealth = await checkDatabaseHealth();
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: dbHealth ? 'connected' : 'disconnected',
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(503).json({
            status: 'error',
            message: 'Service unhealthy',
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
import scanRoutes from './routes/scanRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import radiologistRoutes from './routes/radiologistRoutes.js';
import patientHistoryRoutes from './routes/patientHistoryRoutes.js';

// Apply routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/radiologists', radiologistRoutes);
app.use('/api/patient-history', patientHistoryRoutes);

// Error handling middleware
app.use((req, res, next) => {
    next(errors.NotFound('Route not found'));
});

app.use((err, req, res, next) => {
    console.error(err.stack);

    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        return res.status(400).json({
            status: 'error',
            message: 'Validation Error',
            errors
        });
    }

    // Handle mongoose duplicate key errors
    if (err.code === 11000) {
        return res.status(400).json({
            status: 'error',
            message: 'Duplicate field value entered',
            field: Object.keys(err.keyPattern)[0]
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
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
    res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
});

// Initialize database and start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Initialize database connection
        await initializeDatabase();

        // Start server
        app.listen(PORT, () => {
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
startServer(); 