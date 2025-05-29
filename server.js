import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
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
import privilegeRoutes from './routes/privilegeRoutes.js';
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

const app = express();

// CORS configuration
// const corsOptions = {
//     origin: process.env.FRONTEND_URL || 'http://localhost:3001',
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
//     credentials: true,
//     maxAge: 86400 // 24 hours
// };

// Apply CORS middleware
// app.use(cors(corsOptions));

// Initialize security middleware
setupSecurityMiddleware(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route for debugging request body parsing
app.post('/test-body', (req, res) => {
    res.json({ receivedBody: req.body });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/patient-history', patientHistoryRoutes);
app.use('/api/radiologists', radiologistRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/privileges', privilegeRoutes);

// API Documentation Route
app.get('/api-docs', (req, res) => {
    res.json({
        message: 'Radiology Lab API Documentation',
        version: '1.0.0',
        endpoints: {
            auth: {
                base: '/api/auth',
                routes: {
                    register: { method: 'POST', path: '/register' },
                    login: { method: 'POST', path: '/login' },
                    profile: { method: 'GET', path: '/profile' },
                    updateProfile: { method: 'PUT', path: '/profile' },
                    setupTwoFactor: { method: 'POST', path: '/2fa/setup' },
                    verifyTwoFactor: { method: 'POST', path: '/2fa/verify' },
                    disableTwoFactor: { method: 'POST', path: '/2fa/disable' }
                }
            },
            patients: {
                base: '/api/patients',
                routes: {
                    create: { method: 'POST', path: '/' },
                    getAll: { method: 'GET', path: '/' },
                    getOne: { method: 'GET', path: '/:id' },
                    update: { method: 'PUT', path: '/:id' },
                    delete: { method: 'DELETE', path: '/:id' }
                }
            },
            doctors: {
                base: '/api/doctors',
                routes: {
                    create: { method: 'POST', path: '/' },
                    getAll: { method: 'GET', path: '/' },
                    getOne: { method: 'GET', path: '/:id' },
                    update: { method: 'PUT', path: '/:id' },
                    delete: { method: 'DELETE', path: '/:id' },
                    updateAvailability: { method: 'PATCH', path: '/:id/availability' },
                    getSchedule: { method: 'GET', path: '/:id/schedule' }
                }
            },
            appointments: {
                base: '/api/appointments',
                routes: {
                    create: { method: 'POST', path: '/' },
                    getAll: { method: 'GET', path: '/' },
                    getOne: { method: 'GET', path: '/:id' },
                    update: { method: 'PUT', path: '/:id' },
                    delete: { method: 'DELETE', path: '/:id' },
                    updateStatus: { method: 'PATCH', path: '/:id/status' },
                    getByDateRange: { method: 'GET', path: '/date-range' }
                }
            },
            stock: {
                base: '/api/stock',
                routes: {
                    create: { method: 'POST', path: '/' },
                    getAll: { method: 'GET', path: '/' },
                    getOne: { method: 'GET', path: '/:id' },
                    update: { method: 'PUT', path: '/:id' },
                    delete: { method: 'DELETE', path: '/:id' },
                    updateQuantity: { method: 'PATCH', path: '/:id/quantity' },
                    getLowStock: { method: 'GET', path: '/low-stock' }
                }
            },
            patientHistory: {
                base: '/api/patient-history',
                routes: {
                    create: { method: 'POST', path: '/' },
                    getAll: { method: 'GET', path: '/' },
                    getOne: { method: 'GET', path: '/:id' },
                    update: { method: 'PUT', path: '/:id' },
                    delete: { method: 'DELETE', path: '/:id' },
                    getByPatient: { method: 'GET', path: '/patient/:patientId' }
                }
            },
            radiologists: {
                base: '/api/radiologists',
                routes: {
                    create: { method: 'POST', path: '/' },
                    getAll: { method: 'GET', path: '/' },
                    getOne: { method: 'GET', path: '/:id' },
                    update: { method: 'PUT', path: '/:id' },
                    delete: { method: 'DELETE', path: '/:id' },
                    getStats: { method: 'GET', path: '/stats' }
                }
            },
            scans: {
                base: '/api/scans',
                routes: {
                    create: { method: 'POST', path: '/' },
                    getAll: { method: 'GET', path: '/' },
                    getOne: { method: 'GET', path: '/:id' },
                    update: { method: 'PUT', path: '/:id' },
                    delete: { method: 'DELETE', path: '/:id' },
                    checkStock: { method: 'GET', path: '/:id/stock-availability' },
                    getStats: { method: 'GET', path: '/stats' }
                }
            },
            privileges: {
                description: 'Privilege management endpoints (Super Admin only)',
                basePath: '/api/privileges',
                endpoints: [
                    {
                        method: 'GET',
                        path: '/users',
                        description: 'Get all users with their privileges'
                    },
                    {
                        method: 'GET',
                        path: '/users/:userId/privileges',
                        description: 'Get privileges for a specific user'
                    },
                    {
                        method: 'POST',
                        path: '/users/:userId/privileges',
                        description: 'Grant privileges to a user',
                        body: {
                            module: 'string (required)',
                            operations: {
                                view: 'boolean',
                                create: 'boolean',
                                update: 'boolean',
                                delete: 'boolean'
                            }
                        }
                    },
                    {
                        method: 'DELETE',
                        path: '/users/:userId/privileges',
                        description: 'Revoke privileges from a user',
                        body: {
                            module: 'string (required)'
                        }
                    },
                    {
                        method: 'GET',
                        path: '/modules',
                        description: 'Get available modules and their operations'
                    }
                ]
            }
        }
    });
});

// Error handling middleware
app.use(errorHandler);

// Connect to MongoDB
mongoose.connect(config.mongodb.uri)
    .then(() => {
        // Start server
        app.listen(config.port, () => {
        });
    })
    .catch((err) => {
        process.exit(1);
    });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    // Close server & exit process
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    // Close server & exit process
    process.exit(1);
});
