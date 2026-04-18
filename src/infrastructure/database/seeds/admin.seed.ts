import { AppDataSource } from '../../../../ormconfig';
import { User, UserRole } from '../../../modules/auth/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');

    const userRepository = AppDataSource.getRepository(User);

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error(
        'ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set',
      );
    }

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

      admin.passwordHash = await bcrypt.hash(adminPassword, 12);

      await userRepository.save(admin);
      console.log('Default admin user created successfully.');
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

void seed();
