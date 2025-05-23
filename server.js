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

const app = express();

// Middleware
app.use(cors({
    origin: config.cors.origin,
    methods: config.cors.methods,
    credentials: config.cors.credentials
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route for debugging request body parsing
app.post('/test-body', (req, res) => {
    console.log('Test route - Request body:', req.body);
    console.log('Test route - Content-Type:', req.headers['content-type']);
    res.json({ receivedBody: req.body });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/patient-history', patientHistoryRoutes);

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
            }
        }
    });
});

// Error handling middleware
app.use(errorHandler);

// Connect to MongoDB
mongoose.connect(config.mongodb.uri)
    .then(() => {
        console.log('Connected to MongoDB');
        // Start server
        app.listen(config.port, () => {
            console.log(`Server is running in ${config.env} mode on port ${config.port}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    // Close server & exit process
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Close server & exit process
    process.exit(1);
});
