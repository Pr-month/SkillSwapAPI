import { ConfigType, registerAs } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { DataSourceOptions } from 'typeorm';
dotenv.config();

export const configuration = registerAs('APP_CONFIG', () => ({
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    accessTokenSecretExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'accessToken',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'refreshToken',
  },
  salt: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
  upload: {
    dir: process.env.UPLOAD_DIR || './public/uploads',
    fileSizeMax: Number(process.env.UPLOAD_FILE_SIZE_MAX || 2 * 1024 * 1024),
  },
}));

export type IConfig = ConfigType<typeof configuration>;

export const commonDataSource: DataSourceOptions = {
  name: 'default',
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.EXTERNAL_DATABASE_PORT ?? '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'skillswap',
  synchronize: process.env.NODE_ENV !== 'production',
  dropSchema: process.env.DROP_SCHEMA === 'true',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
};
