import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/radiology_lab';
await mongoose.connect(mongoUri);

// Import User model
const User = (await import('./backend/models/User.js')).default;

// Check for user
const username = 'mohamedharoon186';
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