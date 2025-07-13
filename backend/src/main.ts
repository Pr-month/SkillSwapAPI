import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { AllExceptionFilter } from './common/all-exception.filter';
import { WinstonLoggerService } from './logger/winston-logger.service';
import { logger } from './logger/mainLogger';
import { HttpLoggerMiddleware } from './logger/http-logger.middleware';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { IConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new WinstonLoggerService(),
  });
  const configService = app.get(ConfigService);
  const config = configService.get<IConfig>('APP_CONFIG')!;

  app.use(cookieParser());
  app.useGlobalFilters(new AllExceptionFilter(config));
  app.use(new HttpLoggerMiddleware().use);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useWebSocketAdapter(new IoAdapter(app));
  const documentConfig = new DocumentBuilder()
    .setTitle('SkillSwap API')
    .setDescription('API')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'refresh-token',
    )
    .build();
  const documentFactory = () =>
    SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup('api/doc', app, documentFactory);
  await app.listen(config.port);
  logger.info(`app listen port: ${config.port}`);
}
bootstrap().catch((err) => {
  logger.error(err);
  process.exit(1);
});
