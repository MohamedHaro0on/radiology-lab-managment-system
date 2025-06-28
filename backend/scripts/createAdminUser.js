import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to database
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/laboratory-management';
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Create admin user
const createAdminUser = async () => {
    try {
        // Check if admin user already exists
        const existingAdmin = await User.findOne({ username: 'admin' });

        if (existingAdmin) {
            console.log('Admin user already exists');
            return;
        }

        // Create admin user
        const adminUser = new User({
            username: 'admin',
            password: 'admin',
            email: 'admin@laboratory.com',
            isSuperAdmin: true,
            isActive: true,
            privileges: [
                {
                    module: 'patients',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: null,
                    grantedAt: new Date()
                },
                {
                    module: 'doctors',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: null,
                    grantedAt: new Date()
                },
                {
                    module: 'appointments',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: null,
                    grantedAt: new Date()
                },
                {
                    module: 'radiologists',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: null,
                    grantedAt: new Date()
                },
                {
                    module: 'scans',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: null,
                    grantedAt: new Date()
                },
                {
                    module: 'scanCategories',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: null,
                    grantedAt: new Date()
                },
                {
                    module: 'stock',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: null,
                    grantedAt: new Date()
                },
                {
                    module: 'expenses',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: null,
                    grantedAt: new Date()
                },
                {
                    module: 'patientHistory',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: null,
                    grantedAt: new Date()
                },
                {
                    module: 'users',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: null,
                    grantedAt: new Date()
                },
                {
                    module: 'branches',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: null,
                    grantedAt: new Date()
                }
            ]
        });

        await adminUser.save();

        console.log('Admin user created successfully');
        console.log('Username: admin');
        console.log('Password: admin');
        console.log('Super Admin: true');

    } catch (error) {
        console.error('Error creating admin user:', error);
    }
};

// Main function
const main = async () => {
    await connectDB();
    await createAdminUser();

    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
};

// Run the script
main().catch((error) => {
    console.error('Script error:', error);
    process.exit(1);
}); 