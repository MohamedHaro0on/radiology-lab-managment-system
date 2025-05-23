import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import config from '../config/index.js';
import speakeasy from 'speakeasy';

// Load environment variables
dotenv.config();

const createAdminUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.mongodb.uri);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@example.com' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create admin user (without 2FA secret first)
        const admin = new User({
            username: 'admin',
            email: 'admin@example.com',
            password: 'admin123',
            role: 'admin',
            isActive: true
        });

        await admin.save(); // This will hash the password

        // Now generate and set the 2FA secret
        const secret = admin.generateTwoFactorSecret();
        await admin.save();

        console.log('Admin user created successfully with 2FA');
        console.log('2FA Secret:', secret.base32);
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
};

createAdminUser(); 