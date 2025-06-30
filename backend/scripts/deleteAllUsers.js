import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { initializeDatabase } from '../config/database.js';

dotenv.config();

const deleteAllUsers = async () => {
    try {
        await initializeDatabase();
        console.log('Deleting all non-superadmin users...');
        const users = await User.find({});

        console.log("this is the users ", users);
        const result = await User.deleteMany({});

        console.log(`${result.deletedCount} users have been deleted.`);
    } catch (error) {
        console.error('Error deleting users:', error);
    } finally {
        mongoose.disconnect();
        console.log('Database connection closed.');
    }
};

deleteAllUsers(); 