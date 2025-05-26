import mongoose from 'mongoose';
import { errors } from '../utils/errorHandler.js';

const MONGODB_URI = process.env.MONGODB_URI;
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds

// Connection options
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    family: 4, // Use IPv4, skip trying IPv6
    maxPoolSize: 10, // Maximum number of connections in the pool
    minPoolSize: 5, // Minimum number of connections in the pool
    maxIdleTimeMS: 60000, // Close idle connections after 60s
    connectTimeoutMS: 10000, // Give up initial connection after 10s
    heartbeatFrequencyMS: 10000, // Check server status every 10s
    retryWrites: true,
    retryReads: true
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
});

// Handle process termination
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    } catch (err) {
        console.error('Error during MongoDB disconnection:', err);
        process.exit(1);
    }
});

// Connection retry logic
const connectWithRetry = async (retryCount = 0) => {
    try {
        await mongoose.connect(MONGODB_URI, options);
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            console.warn(`MongoDB connection failed. Retrying in ${RETRY_INTERVAL / 1000}s... (${retryCount + 1}/${MAX_RETRIES})`);
            setTimeout(() => connectWithRetry(retryCount + 1), RETRY_INTERVAL);
        } else {
            console.error('MongoDB connection failed after max retries:', error);
            throw errors.ServiceUnavailable('Database connection failed. Please try again later.');
        }
    }
};

// Database health check
export const checkDatabaseHealth = async () => {
    try {
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database not connected');
        }

        // Check if we can perform a simple operation
        await mongoose.connection.db.admin().ping();
        return true;
    } catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
};

// Initialize database connection
export const initializeDatabase = async () => {
    try {
        await connectWithRetry();

        // Set up global error handler for mongoose operations
        mongoose.set('debug', process.env.NODE_ENV === 'development');

        // Handle mongoose errors globally
        mongoose.connection.on('error', (error) => {
            console.error('Mongoose error:', error);
            // You might want to notify your error tracking service here
        });

        // Handle mongoose query errors
        mongoose.set('debug', (collectionName, method, query, doc) => {
            console.log(`${collectionName}.${method}`, JSON.stringify(query), doc);
        });

    } catch (error) {
        console.error('Failed to initialize database:', error);
        throw errors.ServiceUnavailable('Database initialization failed. Please try again later.');
    }
};

// Export mongoose instance
export default mongoose; 