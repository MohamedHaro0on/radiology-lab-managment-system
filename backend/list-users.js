import mongoose from 'mongoose';
import User from './models/User.js';

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/radiology_lab';
console.log('Connecting to MongoDB:', mongoUri);
await mongoose.connect(mongoUri);

// List all users
const users = await User.find({}).select('username email userType isSuperAdmin');
console.log('All users in database:');
users.forEach((user, index) => {
    console.log(`${index + 1}. Username: "${user.username}"`);
    console.log(`   Email: ${user.email}`);
    console.log(`   userType: ${user.userType}`);
    console.log(`   isSuperAdmin: ${user.isSuperAdmin}`);
    console.log('---');
});

await mongoose.disconnect(); 