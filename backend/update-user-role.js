import mongoose from 'mongoose';
import User from './models/User.js';

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/radiology-lab';
console.log('Connecting to MongoDB:', mongoUri);
await mongoose.connect(mongoUri);

// Update the user
const username = 'Mohamed Haroon';
const result = await User.findOneAndUpdate(
    { username },
    {
        userType: 'superAdmin',
        role: 'superAdmin',
        isSuperAdmin: true
    },
    { new: true }
);

if (result) {
    console.log('User updated successfully:');
    console.log('Username:', result.username);
    console.log('userType:', result.userType);
    console.log('role:', result.role);
    console.log('isSuperAdmin:', result.isSuperAdmin);
} else {
    console.log('User not found with username:', username);
}

await mongoose.disconnect(); 