import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { Server } from 'http';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { AppModule } from '../src/app.module';
import { AccessTokenGuard } from '../src/auth/guards/accessToken.guard';

describe('UploadsController (e2e)', () => {
  let app: INestApplication;
  let uploadedFileName: string | null = null;
  let server: Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    server = app.getHttpServer() as Server;
  }, 20_000);

  afterAll(async () => {
    // Удаляем загруженный файл после теста
    if (uploadedFileName) {
      const filePath = join(__dirname, '../public/uploads', uploadedFileName);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
      // также пробуем удалить lq-версию, если она есть
      const lqFilePath = filePath.replace(/(\.[^.]+)$/, '_lq$1');
      if (existsSync(lqFilePath)) {
        unlinkSync(lqFilePath);
      }
    }
    if (app) {
      await app.close();
    }
  });

  it('успешная загрузка изображения', async () => {
    const res = await request(server)
      .post('/uploads/upload')
      .attach('file', join(__dirname, 'fixtures/test.png'))
      .expect(HttpStatus.CREATED);

    const body = res.body as {
      publicUrl: string;
      fileName: string;
      originalName: string;
    };

    expect(body).toHaveProperty('publicUrl');
    expect(body).toHaveProperty('fileName');
    expect(body).toHaveProperty('originalName', 'test.png');

    uploadedFileName = body.fileName;
    // Проверяем, что файл действительно появился
    const filePath = join(__dirname, '../public/uploads', uploadedFileName);
    expect(
      existsSync(filePath) ||
        existsSync(filePath.replace(/(\.[^.]+)$/, '_lq$1')),
    ).toBe(true);
  });

  it('без файла возвращает 400', async () => {
    const res = await request(server)
      .post('/uploads/upload')
      .expect(HttpStatus.BAD_REQUEST);
    expect(res).toHaveProperty('body');
    expect(res.body).toHaveProperty('message', 'Файл не загружен');
  });
});
