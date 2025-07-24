import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration, IConfig } from './config/configuration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from './auth/guards/accessToken.guard';
import { WinstonLoggerService } from './logger/winston-logger.service';
import { SkillsModule } from './skills/skills.module';
import { UploadsModule } from './uploads/uploads.module';
import { RequestsModule } from './requests/requests.module';
import { CategoriesModule } from './categories/categories.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    //загружаем переменные окружения
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
    // подключаем TypeORM с настройками из ormconfig.ts
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [configuration.KEY],
      useFactory: (config: IConfig) => ({
        ...config.database,
        autoLoadEntities: true,
      }),
    }),
    UsersModule,
    AuthModule,
    SkillsModule,
    UploadsModule,
    RequestsModule,
    CategoriesModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, AccessTokenGuard, WinstonLoggerService],
  exports: [AccessTokenGuard],
})
export class AppModule {}
