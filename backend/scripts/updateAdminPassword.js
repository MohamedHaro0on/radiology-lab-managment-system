import mongoose from 'mongoose';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
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

// Update admin password
const updateAdminPassword = async () => {
    try {
        // Find admin user
        const adminUser = await User.findOne({ username: 'admin' });

        if (!adminUser) {
            console.log('Admin user not found');
            return;
        }

        console.log('Admin user found:', {
            id: adminUser._id,
            username: adminUser.username,
            email: adminUser.email
        });

        // Update password to 'admin123' (8 characters)
        adminUser.password = 'admin123';
        await adminUser.save();

        console.log('Admin password updated successfully');

        // Test the new password
        const isMatch = await adminUser.comparePassword('admin123');
        console.log('New password test result:', isMatch);

    } catch (error) {
        console.error('Error updating admin password:', error);
    }
};

// Main function
const main = async () => {
    await connectDB();
    await updateAdminPassword();

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