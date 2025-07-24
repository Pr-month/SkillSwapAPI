import { DataSource } from 'typeorm';
import { commonDataSource } from './configuration';

const config = {
  ...commonDataSource,
  port: parseInt(process.env.EXTERNAL_DATABASE_PORT ?? '5432'),
  synchronize: true,
};

export default new DataSource(config);
