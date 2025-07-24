import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import {
  ConsoleLogger,
  INestApplicationContext,
  LoggerService,
  Type,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  SeedMessages,
  SeedMessagesDefault,
  SeedSettings,
  SeedSettingsDefault,
} from './type';

export type SeedFn<T extends ObjectLiteral = ObjectLiteral> = (
  app: INestApplicationContext,
  repository?: Repository<T>,
) => Promise<void>;

export class SeedByApp<TRepository extends ObjectLiteral = ObjectLiteral> {
  private messages: SeedMessages;
  private repository: EntityTarget<TRepository>;
  private settings: SeedSettings;
  private logger: LoggerService;
  private dataSource: DataSource;

  private module: Type<any>;

  constructor(
    repository: EntityTarget<TRepository>,
    module: Type<any>,
    messages: SeedMessages,
    settings: Partial<SeedSettings> = {},
  ) {
    this.module = module;

    this.logger = new ConsoleLogger(SeedByApp.name);
    this.repository = repository;
    this.messages = {
      ...SeedMessagesDefault,
      ...messages,
    };
    this.settings = {
      ...SeedSettingsDefault,
      ...settings,
    };
  }

  private async seeding(fn: SeedFn<TRepository>) {
    const app = await NestFactory.createApplicationContext(this.module);
    this.dataSource = app.get(DataSource);
    let erorr: unknown = null;

    const repository = this.dataSource.getRepository(this.repository);

    if (this.settings.clearBefore) {
      await repository.clear();
      this.logger.warn(`Data in ${repository.metadata.name} is cleared`);
    } else {
      const count = await repository.count();
      if (count !== 0) {
        await app.close();
        this.logger.warn(`Data exist in ${repository.metadata.name}`);
        return;
      }
    }

    try {
      await fn(app, repository);
      this.logger.log(this.messages.success);
    } catch (e) {
      erorr = e;
    } finally {
      await app.close();
    }

    if (erorr !== null) {
      throw erorr as Error;
    }
  }

  run(fn: SeedFn<TRepository>) {
    this.seeding(fn).catch((e) => {
      this.logger.error(this.messages.error);
      console.error(e);
      process.exit(1);
    });
  }
}
