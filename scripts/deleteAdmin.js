import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import config from '../config/index.js';

dotenv.config();

const deleteAdminUser = async () => {
    try {
        await mongoose.connect(config.mongodb.uri);
        const result = await User.deleteOne({ email: 'admin@example.com' });
        console.log('Deleted admin:', result);
        process.exit(0);
    } catch (err) {
        console.error('Error deleting admin:', err);
        process.exit(1);
    }
};

deleteAdminUser(); 