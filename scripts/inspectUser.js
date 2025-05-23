import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import config from '../config/index.js';

dotenv.config();

const inspectUser = async (email) => {
    try {
        await mongoose.connect(config.mongodb.uri);
        const user = await User.findOne({ email }).select('+password +twoFactorSecret');
        console.log('User document:', JSON.stringify(user, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('Error inspecting user:', err);
        process.exit(1);
    }
};

// Get email from command line argument
const email = process.argv[2];
if (!email) {
    console.error('Please provide an email address');
    process.exit(1);
}

inspectUser(email); 