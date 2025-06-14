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

// Test password
const testPassword = async () => {
    try {
        // Find admin user
        const adminUser = await User.findOne({ username: 'admin' }).select('+password');

        if (!adminUser) {
            console.log('Admin user not found');
            return;
        }

        console.log('Admin user found:', {
            id: adminUser._id,
            username: adminUser.username,
            email: adminUser.email,
            passwordHash: adminUser.password ? adminUser.password.substring(0, 20) + '...' : 'No password'
        });

        // Test password comparison
        const testPassword = 'admin';
        const isMatch = await adminUser.comparePassword(testPassword);
        console.log('Password match result:', isMatch);

        // Test with bcrypt directly
        const directMatch = await bcrypt.compare(testPassword, adminUser.password);
        console.log('Direct bcrypt match result:', directMatch);

        // Test the findByCredentials method
        try {
            const userByCredentials = await User.findByCredentials(adminUser.email, testPassword);
            console.log('findByCredentials result:', userByCredentials ? 'Success' : 'Failed');
        } catch (error) {
            console.log('findByCredentials error:', error.message);
        }

    } catch (error) {
        console.error('Error testing password:', error);
    }
};

// Main function
const main = async () => {
    await connectDB();
    await testPassword();

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