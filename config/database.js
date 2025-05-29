import mongoose from 'mongoose';
import { errors } from '../utils/errorHandler.js';
import config from './index.js';

const MONGODB_URI = config.mongodb.uri;
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds

// Connection options - removed deprecated options
const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
    maxPoolSize: 10,
    minPoolSize: 5,
    maxIdleTimeMS: 60000,
    connectTimeoutMS: 10000,
    heartbeatFrequencyMS: 10000,
    retryWrites: true,
    retryReads: true
};

// Handle connection events
mongoose.connection.on('connected', () => {
    // Connection successful
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    // Connection disconnected
});

mongoose.connection.on('reconnected', () => {
    // Connection reestablished
});

// Handle process termination
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Error during MongoDB disconnection:', err);
        process.exit(1);
    }
});

// Connection retry logic
const connectWithRetry = async (retryCount = 0) => {
    try {
        if (!MONGODB_URI) {
            throw new Error('MongoDB URI is not defined');
        }
        await mongoose.connect(MONGODB_URI, options);
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            setTimeout(() => connectWithRetry(retryCount + 1), RETRY_INTERVAL);
        } else {
            console.error('MongoDB connection failed after max retries:', error);
            throw new Error('Database connection failed. Please try again later.');
        }
    }
};

// Database health check
export const checkDatabaseHealth = async () => {
    try {
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database not connected');
        }
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

        // Only enable debug mode for actual queries in development, not index creation
        if (config.env === 'development') {
            mongoose.set('debug', (collectionName, method, query, doc) => {
                // Only log actual queries, not index creation or connection events
                if (method !== 'createIndex' && method !== 'connect') {
                    console.log(`${collectionName}.${method}`, JSON.stringify(query), doc);
                }
            });
        }

        mongoose.connection.on('error', (error) => {
            console.error('Mongoose error:', error);
        });

    } catch (error) {
        console.error('Failed to initialize database:', error);
        throw new Error('Database initialization failed. Please try again later.');
    }
};

// Export mongoose instance
export default mongoose; 