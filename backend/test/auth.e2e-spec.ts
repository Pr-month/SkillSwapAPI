import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { Server } from 'http';
import { Response } from 'supertest';
import { AllExceptionFilter } from '../src/common/all-exception.filter';
import { ConfigService } from '@nestjs/config';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let server: Server;

  const registerDto = {
    name: 'Тестовый',
    email: 'testuser2@email.com',
    password: 'password123',
    age: 25,
    city: 'Москва',
    aboutMe: 'Тестовый пользователь',
    gender: 'М',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    app.useGlobalFilters(new AllExceptionFilter(app.get(ConfigService)));
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  let accessToken: string;
  let refreshToken: string;

  it('/auth/register (POST) — успешная регистрация', async () => {
    const res: Response = await request(server)
      .post('/auth/register')
      .send(registerDto)
      .expect(201);

    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('/auth/register (POST) — пустой email (400)', async () => {
    await request(server)
      .post('/auth/register')
      .send({ ...registerDto, email: '' })
      .expect(400);
  });

  it('/auth/register (POST) — не валидный email (400)', async () => {
    await request(server)
      .post('/auth/register')
      .send({ ...registerDto, email: 'ddd' })
      .expect(400);
  });

  it('/auth/register (POST) — пустой password (400)', async () => {
    await request(server)
      .post('/auth/register')
      .send({ ...registerDto, password: '' })
      .expect(400);
  });

  it('/auth/register (POST) — повторная регистрация (409)', async () => {
    await request(server).post('/auth/register').send(registerDto).expect(409);
  });

  it('/auth/login (POST) — неверный пароль (401)', async () => {
    await request(server)
      .post('/auth/login')
      .send({ email: registerDto.email, password: 'не верный пароль' })
      .expect(401);
  });

  it('/auth/login (POST) — пустой пароль и email (400)', async () => {
    await request(server)
      .post('/auth/login')
      .send({ email: '', password: '' })
      .expect(400);
  });

  it('/auth/login (POST) — успешный логин', async () => {
    const res: Response = await request(server)
      .post('/auth/login')
      .send({ email: registerDto.email, password: registerDto.password })
      .expect(200);

    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');

    type AuthResponse = {
      user: unknown;
      accessToken: string;
      refreshToken: string;
    };

    const body = res.body as AuthResponse;
    accessToken = body.accessToken;
    refreshToken = body.refreshToken;
  });

  it('/auth/refresh (POST) — нет токена (401)', async () => {
    await request(server).post('/auth/refresh').expect(401);
  });

  it('/auth/refresh (POST) — не Bearer токен (401)', async () => {
    await request(server)
      .post('/auth/refresh')
      .set('Authorization', refreshToken)
      .expect(401);
  });

  it('/auth/refresh (POST) — невалидный refreshToken (401)', async () => {
    await request(server)
      .post('/auth/refresh')
      .set('Authorization', 'Bearer xxx')
      .expect(401);
  });

  it('/auth/refresh (POST) — успешный refresh', async () => {
    const res: Response = await request(server)
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('/auth/logout (POST) — без accessToken (401)', async () => {
    await request(server).post('/auth/logout').expect(401);
  });

  it('/auth/logout (POST) — невалидный accessToken (401)', async () => {
    await request(server)
      .post('/auth/logout')
      .set('Authorization', 'Bearer xxx')
      .expect(401);
  });

  it('/auth/logout (POST) — успешный logout', async () => {
    const res: Response = await request(server)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.text).toContain('Пользователь успешно вышел из системы');
  });
});
