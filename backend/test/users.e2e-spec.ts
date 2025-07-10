import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { Server } from 'http';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/GET users - получение всех пользователей', async () => {
    const res = await request(server).get('/users').expect(200);

    expect(res.body).toBeInstanceOf(Array);
  });
  it('/GET users/me - получение текущего пользователя', async () => {});
  it('/GET users/test - отправка уведомления пользователю', async () => {});
  it('/PATCH users/me - обновление данных текущего пользователя', async () => {});
  it('/PATCH users/me/password - обновление пароля текущего пользователя', async () => {});
  it('/GET users/:id - получение пользователя по ID', async () => {});
  it('/DELETE users/:id - удаление пользователя по ID', async () => {});
});
