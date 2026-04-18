import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const isCompiled = __filename.endsWith('.js');

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: isCompiled
        ? ['dist/modules/**/entities/*.entity.js']
        : ['src/modules/**/entities/*.entity.ts'],
    migrations: isCompiled
        ? ['dist/infrastructure/database/migrations/*.js']
        : ['src/infrastructure/database/migrations/*.ts'],
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
});
