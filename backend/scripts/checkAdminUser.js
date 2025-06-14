import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to database
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/radiology_lab';
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Check admin user
const checkAdminUser = async () => {
    try {
        // Find admin user by username
        const adminByUsername = await User.findOne({ username: 'admin' }).select('+password');
        console.log('Admin user by username:', adminByUsername ? {
            id: adminByUsername._id,
            username: adminByUsername.username,
            email: adminByUsername.email,
            isActive: adminByUsername.isActive,
            isSuperAdmin: adminByUsername.isSuperAdmin,
            hasPassword: !!adminByUsername.password
        } : 'Not found');

        // Find admin user by email
        const adminByEmail = await User.findOne({ email: 'admin@laboratory.com' }).select('+password');
        console.log('Admin user by email:', adminByEmail ? {
            id: adminByEmail._id,
            username: adminByEmail.username,
            email: adminByEmail.email,
            isActive: adminByEmail.isActive,
            isSuperAdmin: adminByEmail.isSuperAdmin,
            hasPassword: !!adminByEmail.password
        } : 'Not found');

        // List all users
        const allUsers = await User.find({}).select('username email isActive isSuperAdmin');
        console.log('All users:', allUsers);

    } catch (error) {
        console.error('Error checking admin user:', error);
    }
};

// Main function
const main = async () => {
    await connectDB();
    await checkAdminUser();

    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
};

// Run the script
main().catch((error) => {
    console.error('Script error:', error);
    process.exit(1);
}); 