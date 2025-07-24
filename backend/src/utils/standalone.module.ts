import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import AppDataSource from '../config/ormconfig-migration';
import { configuration, IConfig } from '../config/configuration';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        ...AppDataSource.options,
        retryAttempts: 2,
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [configuration.KEY],
      global: true,
      useFactory: (config: IConfig) => ({
        global: true,
        secret: config.jwt.accessTokenSecret,
        signOptions: {
          expiresIn: config.jwt.accessTokenSecretExpiresIn,
        },
      }),
    }),
  ],
})
export class StandaloneDatabaseModule {}
