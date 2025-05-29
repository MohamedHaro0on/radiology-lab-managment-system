import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { errors } from '../utils/errorHandler.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Modules to grant view access to
const MODULES_TO_GRANT = ['stock', 'appointments', 'doctors', 'patients'];

// Find a super admin to grant privileges
async function findSuperAdmin() {
    const superAdmin = await User.findOne({ isSuperAdmin: true });
    if (!superAdmin) {
        throw new Error('No super admin found to grant privileges');
    }
    return superAdmin;
}

// Grant view privileges to all users
async function grantViewPrivileges() {
    try {
        const superAdmin = await findSuperAdmin();
        const users = await User.find({ isActive: true });

        console.log(`Found ${users.length} active users`);

        for (const user of users) {
            console.log(`Processing user: ${user.username}`);

            for (const module of MODULES_TO_GRANT) {
                try {
                    await user.grantPrivilege(module, ['view'], superAdmin._id);
                    console.log(`Granted view privilege for ${module} to ${user.username}`);
                } catch (error) {
                    console.error(`Error granting privilege for ${module} to ${user.username}:`, error.message);
                }
            }
        }

        console.log('Finished granting privileges');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the script
grantViewPrivileges(); 