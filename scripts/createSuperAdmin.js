import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Create or update super admin user
async function createSuperAdmin() {
    try {
        // Find existing admin user
        let adminUser = await User.findOne({ username: 'admin' });

        if (adminUser) {
            // Update existing admin to super admin
            adminUser.isSuperAdmin = true;
            adminUser.isActive = true;
            await adminUser.save();
            console.log('Updated existing admin to super admin:', adminUser.username);
        } else {
            // Create new super admin user
            const hashedPassword = await bcrypt.hash('admin123', 12);
            adminUser = await User.create({
                username: 'admin',
                email: 'admin@radiology-lab.com',
                password: hashedPassword,
                isSuperAdmin: true,
                isActive: true
            });
            console.log('Created new super admin:', adminUser.username);
        }
    } catch (error) {
        console.error('Error managing super admin:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the script
createSuperAdmin(); 