import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: ['src/modules/**/entities/*.entity.ts'],
    migrations: ['src/infrastructure/database/migrations/*.ts'],
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
});
