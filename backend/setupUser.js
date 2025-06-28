import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const setupUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if user exists
        const existingUser = await User.findOne({ email: 'test@example.com' });

        if (existingUser) {
            console.log('User already exists, updating privileges...');
            existingUser.isSuperAdmin = true;
            existingUser.privileges = [
                {
                    module: 'dashboard',
                    operations: ['view'],
                    grantedBy: existingUser._id,
                    grantedAt: new Date()
                },
                {
                    module: 'patients',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: existingUser._id,
                    grantedAt: new Date()
                },
                {
                    module: 'doctors',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: existingUser._id,
                    grantedAt: new Date()
                },
                {
                    module: 'appointments',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: existingUser._id,
                    grantedAt: new Date()
                },
                {
                    module: 'scans',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: existingUser._id,
                    grantedAt: new Date()
                },
                {
                    module: 'stock',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: existingUser._id,
                    grantedAt: new Date()
                },
                {
                    module: 'radiologists',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: existingUser._id,
                    grantedAt: new Date()
                },
                {
                    module: 'patientHistory',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: existingUser._id,
                    grantedAt: new Date()
                },
                {
                    module: 'scanCategories',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: existingUser._id,
                    grantedAt: new Date()
                },
                {
                    module: 'expenses',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: existingUser._id,
                    grantedAt: new Date()
                },
                {
                    module: 'users',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: existingUser._id,
                    grantedAt: new Date()
                },
                {
                    module: 'branches',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: existingUser._id,
                    grantedAt: new Date()
                },
                {
                    module: 'audit',
                    operations: ['view'],
                    grantedBy: existingUser._id,
                    grantedAt: new Date()
                },
                {
                    module: 'representatives',
                    operations: ['view', 'create', 'update', 'delete'],
                    grantedBy: existingUser._id,
                    grantedAt: new Date()
                }
            ];
            await existingUser.save();
            console.log('User privileges updated successfully');
        } else {
            console.log('Creating new test user...');
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                isSuperAdmin: true,
                privileges: [
                    {
                        module: 'dashboard',
                        operations: ['view'],
                        grantedBy: null, // Will be set after user creation
                        grantedAt: new Date()
                    },
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
                        module: 'scans',
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
                        module: 'radiologists',
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
                        module: 'scanCategories',
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
                    },
                    {
                        module: 'audit',
                        operations: ['view'],
                        grantedBy: null,
                        grantedAt: new Date()
                    },
                    {
                        module: 'representatives',
                        operations: ['view', 'create', 'update', 'delete'],
                        grantedBy: null,
                        grantedAt: new Date()
                    }
                ]
            });
            await user.save();

            // Update grantedBy references
            user.privileges.forEach(privilege => {
                privilege.grantedBy = user._id;
            });
            await user.save();

            console.log('Test user created successfully');
        }

        console.log('Setup completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Setup failed:', error);
        process.exit(1);
    }
};

setupUser(); 