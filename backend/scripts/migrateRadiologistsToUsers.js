// Migration script: Move all radiologists to the User collection as users with role 'radiologist'.
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Radiologist from '../models/Radiologist.js';
import User from '../models/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/radiology_lab';

async function migrate() {
    await mongoose.connect(MONGODB_URI);
    const radiologists = await Radiologist.find();
    for (const rad of radiologists) {
        // Check if user already exists with this email or phone
        const exists = await User.findOne({
            $or: [
                { email: rad.email },
                { phoneNumber: rad.phoneNumber },
                { username: rad.username || rad.name }
            ]
        });
        if (exists) {
            console.log(`User already exists for radiologist: ${rad.name}`);
            continue;
        }
        const user = new User({
            username: rad.username || rad.name,
            name: rad.name,
            email: rad.email || undefined,
            phoneNumber: rad.phoneNumber,
            role: 'radiologist',
            gender: rad.gender,
            age: rad.age,
            licenseId: rad.licenseId,
            isActive: rad.isActive !== false,
            // Add any other fields as needed
        });
        await user.save();
        console.log(`Migrated radiologist: ${rad.name}`);
    }
    await mongoose.disconnect();
    console.log('Migration complete.');
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
}); 