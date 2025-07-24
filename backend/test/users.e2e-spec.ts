import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { Server } from 'http';
import { FindUserDTO } from '../src/users/dto/find.users.dto';
import { AuthResponseDto } from '../src/auth/dto/AuthResponse.dto';
import { AllExceptionFilter } from '../src/common/all-exception.filter';
import { ConfigService } from '@nestjs/config';
import { FindAllUsersResponseDto } from '../src/users/dto/find-all-users-response.dto';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let id: string;
  let accessToken: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    app.useGlobalFilters(new AllExceptionFilter(app.get(ConfigService)));
    await app.init();
    server = app.getHttpServer() as Server;
    //получаем данные админа
    const loginRes: request.Response = await request(server)
      .post('/auth/login')
      .send({ email: 'vladislav@example.com', password: 'пароль1' })
      .expect(200);
    const loginBody = loginRes.body as AuthResponseDto;
    accessToken = loginBody.accessToken;
    id = loginBody.user.id as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/GET users - получение всех пользователей', async () => {
    const res = await request(server).get('/users').expect(200);
    const users = res.body as FindAllUsersResponseDto;
    expect(users.data).toBeInstanceOf(Array);
    if (users.data.length === 0) {
      return;
    }
    const user = users.data[0];
    expect(user).not.toHaveProperty('password');
    expect(user).not.toHaveProperty('refreshToken');
  });

  it('/GET users/me - получение текущего пользователя', async () => {
    const res = await request(server)
      .get('/users/me')
      .auth(accessToken, { type: 'bearer' })
      .expect(200);
    const user = res.body as FindUserDTO;
    expect(user).not.toHaveProperty('password');
    expect(user).not.toHaveProperty('refreshToken');
    expect(user.email).toBe('vladislav@example.com');
    expect(user.name).toBe('Владислав');
  });

  it('/PATCH users/me - обновление данных текущего пользователя', async () => {
    const res = await request(server)
      .patch('/users/me')
      .auth(accessToken, { type: 'bearer' })
      .send({ name: 'newName' })
      .expect(200);
    const user = res.body as FindUserDTO;
    expect(user).not.toHaveProperty('password');
    expect(user).not.toHaveProperty('refreshToken');
    expect(user.name).toBe('newName');
  });

  it('/PATCH users/me - пустой email (400)', async () => {
    await request(server)
      .patch('/users/me')
      .auth(accessToken, { type: 'bearer' })
      .send({ email: '' })
      .expect(400);
  });

  it('/PATCH users/me - пустое поле name (400)', async () => {
    await request(server)
      .patch('/users/me')
      .auth(accessToken, { type: 'bearer' })
      .send({ name: '' })
      .expect(400);
  });

  it('/PATCH users/me - email уже существует (409)', async () => {
    await request(server)
      .patch('/users/me')
      .auth(accessToken, { type: 'bearer' })
      .send({ email: 'ekaterina@example.com' })
      .expect(409);
  });

  it('/PATCH users/me/password - обновление пароля текущего пользователя', async () => {
    const res = await request(server)
      .patch('/users/me/password')
      .auth(accessToken, { type: 'bearer' })
      .send({ password: 'newPassword' })
      .expect(200);
    const user = res.body as FindUserDTO;
    expect(user).not.toHaveProperty('password');
    expect(user).not.toHaveProperty('refreshToken');
  });

  it('/PATCH users/me/password - пароль не может быть пустым (400)', async () => {
    await request(server)
      .patch('/users/me/password')
      .auth(accessToken, { type: 'bearer' })
      .send({ password: '' })
      .expect(400);
  });

  it('/GET users/:id - получение пользователя по ID', async () => {
    const res = await request(server).get(`/users/${id}`).expect(200);
    const user = res.body as FindUserDTO;
    expect(user).not.toHaveProperty('password');
    expect(user).not.toHaveProperty('refreshToken');
    expect(user.id).toBe(id);
  });

  it('/DELETE users/:id - удаление пользователя по ID', async () => {
    const res = await request(server)
      .delete(`/users/${id}`)
      .auth(accessToken, { type: 'bearer' })
      .expect(200);
    const message = res.body as { message: string };
    expect(message).toEqual({ message: `Пользователь с id ${id} удалён` });
  });
});
