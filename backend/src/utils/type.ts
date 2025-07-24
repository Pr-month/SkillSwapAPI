import { DataSource } from 'typeorm';
import AppDataSource from '../config/ormconfig-migration';

export type SeedMessages = {
  success: string;
  error?: string;
};

export const SeedMessagesDefault: Required<Pick<SeedMessages, 'error'>> = {
  error: 'Ошибка сидирования',
};

export type SeedSettings = {
  dataSource: DataSource;
  clearBefore: boolean;
};

export const SeedSettingsDefault: SeedSettings = {
  dataSource: AppDataSource,
  clearBefore: false,
};
