import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { commonDataSource } from './configuration';

dotenv.config();

export const AppDataSource = new DataSource(commonDataSource);
