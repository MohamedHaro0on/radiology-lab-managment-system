import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/radiology-lab';
console.log('Connecting to MongoDB:', mongoUri);
await mongoose.connect(mongoUri);

// Check which database we're connected to
const dbName = mongoose.connection.db.databaseName;
console.log('Connected to database:', dbName);

// List all collections
const collections = await mongoose.connection.db.listCollections().toArray();
console.log('Collections in database:', collections.map(c => c.name));

// Check for user
const username = 'Mohamed Haroon';
const user = await User.findOne({ username }).select('+password');

console.log('User found:', !!user);
if (user) {
    console.log('User details:', {
        _id: user._id,
        username: user.username,
        email: user.email,
        userType: user.userType,
        role: user.role,
        isActive: user.isActive,
        hasPassword: !!user.password
    });

    // Test password
    const testPassword = 'Admin123&';
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log('Password match:', isMatch);
} else {
    console.log('No user found with username:', username);

    // List all users
    const allUsers = await User.find({}).select('username email userType role');
    console.log('All users in database:', allUsers);
}

await mongoose.disconnect(); 