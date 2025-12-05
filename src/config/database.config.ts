import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
config();

export const databaseConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [__dirname + '/../modules/**/entities/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../infrastructure/database/migrations/*{.ts,.js}'],
    synchronize: false, // Never true in production!
    logging: process.env.NODE_ENV === 'development',
    migrationsRun: true,
    poolSize: 20,
    extra: {
        max: 20,
        connectionTimeoutMillis: 2000,
        idleTimeoutMillis: 10000,
    },
};