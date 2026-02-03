import { AppDataSource } from '../../../../ormconfig';
import { User, UserRole } from '../../../modules/auth/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
    try {
        await AppDataSource.initialize();
        console.log('Data Source has been initialized!');

        const userRepository = AppDataSource.getRepository(User);

        const adminEmail = 'admin@ecommerce.com';
        const existingAdmin = await userRepository.findOneBy({ email: adminEmail });

        if (existingAdmin) {
            console.log('Admin user already exists.');
        } else {
            const admin = new User();
            admin.email = adminEmail;
            admin.firstName = 'System';
            admin.lastName = 'Admin';
            admin.role = UserRole.ADMIN;
            admin.isActive = true;
            admin.isEmailVerified = true;
            
            // Hash password
            const password = 'adminPassword123';
            admin.passwordHash = await bcrypt.hash(password, 10);

            await userRepository.save(admin);
            console.log('Default admin user created successfully!');
            console.log('Email: admin@ecommerce.com');
            console.log('Password: adminPassword123');
        }

        await AppDataSource.destroy();
    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
}

seed();
