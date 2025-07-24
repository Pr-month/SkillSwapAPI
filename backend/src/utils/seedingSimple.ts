import {
  DataSource,
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { ConsoleLogger, LoggerService } from '@nestjs/common';
import {
  SeedMessages,
  SeedMessagesDefault,
  SeedSettings,
  SeedSettingsDefault,
} from './type';

export type SeedFn<T extends ObjectLiteral = ObjectLiteral> = (
  repository: Repository<T>,
  entityManager?: EntityManager,
) => Promise<void>;

export class SeedSimple<TRepository extends ObjectLiteral = ObjectLiteral> {
  private messages: SeedMessages;
  private repository: EntityTarget<TRepository>;
  private settings: SeedSettings;
  private logger: LoggerService;
  private dataSource: DataSource;

  constructor(
    repository: EntityTarget<TRepository>,
    messages: SeedMessages,
    settings: Partial<SeedSettings> = {},
  ) {
    this.logger = new ConsoleLogger(SeedSimple.name);
    this.repository = repository;
    this.messages = {
      ...SeedMessagesDefault,
      ...messages,
    };
    this.settings = {
      ...SeedSettingsDefault,
      ...settings,
    };

    this.dataSource = this.settings.dataSource;
  }

  private async seeding(fn: SeedFn<TRepository>) {
    let erorr: unknown = null;

    this.dataSource = await this.dataSource.initialize();
    const repository = this.dataSource.getRepository(this.repository);

    if (this.settings.clearBefore) {
      await repository.clear();
      this.logger.warn(`Data in ${repository.metadata.name} is cleared`);
    } else {
      const count = await repository.count();
      if (count !== 0) {
        await this.dataSource.destroy();
        this.logger.warn(`Data exist in ${repository.metadata.name}`);
        return;
      }
    }

    try {
      await this.dataSource.transaction(async (entityManager) => {
        await fn(repository, entityManager);
      });
      this.logger.log(this.messages.success);
    } catch (e) {
      erorr = e;
    } finally {
      await this.dataSource.destroy();
    }

    if (erorr !== null) {
      throw erorr as Error;
    }
  }

  run(fn: SeedFn<TRepository>) {
    this.seeding(fn).catch((error) => {
      this.logger.error(this.messages.error);
      console.error(error);
      process.exit(1);
    });
  }
}
