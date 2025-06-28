import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function checkSuperAdmin() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database');

        // Check if there are any super admin users
        const superAdmins = await User.find({ isSuperAdmin: true });
        console.log(`Found ${superAdmins.length} super admin(s):`);

        superAdmins.forEach(admin => {
            console.log(`- ${admin.username} (${admin.email}) - isSuperAdmin: ${admin.isSuperAdmin}`);
        });

        if (superAdmins.length === 0) {
            console.log('\nNo super admin users found. Creating one...');

            // Create a super admin user
            const superAdmin = await User.create({
                username: 'superadmin',
                email: 'superadmin@example.com',
                password: 'SuperAdmin123!',
                isSuperAdmin: true,
                isActive: true,
                twoFactorEnabled: false
            });

            console.log(`✅ Super admin created: ${superAdmin.username} (${superAdmin.email})`);
            console.log('Password: SuperAdmin123!');
        } else {
            console.log('\n✅ Super admin user(s) already exist');
        }

        // Also check the user with email mohamedharoon286@gmail.com
        const user = await User.findOne({ email: 'mohamedharoon286@gmail.com' });
        if (user) {
            console.log(`\nUser ${user.email}:`);
            console.log(`- Username: ${user.username}`);
            console.log(`- isSuperAdmin: ${user.isSuperAdmin}`);
            console.log(`- isActive: ${user.isActive}`);

            if (!user.isSuperAdmin) {
                console.log('\nMaking this user a super admin...');
                user.isSuperAdmin = true;
                await user.save();
                console.log('✅ User is now a super admin');
            }
        } else {
            console.log('\nUser with email mohamedharoon286@gmail.com not found');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database');
    }
}

checkSuperAdmin(); 