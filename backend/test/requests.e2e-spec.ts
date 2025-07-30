import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Server } from 'http';
import { AppModule } from 'src/app.module';
import { AllExceptionFilter } from 'src/common/all-exception.filter';
import { AuthResponseDto } from 'src/auth/dto/AuthResponse.dto';
import { Request } from 'src/requests/entities/request.entity';

describe('RequestsController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let accessToken: string;
  let adminId: string;
  let userId: string;
  let offeredSkillId: string;
  let requestedSkillId: string;
  let requestId: string;
  let accessTokenOtherUser: string;

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
    const loginBodyAdmin = loginRes.body as AuthResponseDto;
    accessToken = loginBodyAdmin.accessToken;
    adminId = loginBodyAdmin.user.id as string;
    offeredSkillId = loginBodyAdmin.user.skills[0].id;
    // получаем данные обычного пользователя
    const loginResUser = await request(server)
      .post('/auth/login')
      .send({ email: 'ivan@example.com', password: 'пароль3' })
      .expect(200);
    const loginBodyUser = loginResUser.body as AuthResponseDto;
    requestedSkillId = loginBodyUser.user.skills[0].id;
    userId = loginBodyUser.user.id as string;
    // получаем не участвующего в заявке польлзователя
    const loginResOtherUser = await request(server)
      .post('/auth/login')
      .send({ email: 'ekaterina@example.com', password: 'пароль2' })
      .expect(200);
    const loginBodyOtherUser = loginResOtherUser.body as AuthResponseDto;
    accessTokenOtherUser = loginBodyOtherUser.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/GET requests - получение всех заявок', async () => {
    const res = await request(server)
      .get('/requests')
      .auth(accessToken, { type: 'bearer' })
      .expect(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body).toHaveProperty('total');
  });

  it('/GET requests - номер запрашиваемой страницы больше, чем общее количество страниц(404)', async () => {
    await request(server)
      .get('/requests?page=100')
      .auth(accessToken, { type: 'bearer' })
      .expect(404);
  });

  it('/POST requests - Создание заявки', async () => {
    const res = await request(server)
      .post('/requests')
      .auth(accessToken, { type: 'bearer' })
      .send({
        offeredSkillId: `${offeredSkillId}`,
        requestedSkillId: `${requestedSkillId}`,
      })
      .expect(201);
    const result = res.body as Request;
    requestId = result.id;
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('updatedAt');
    expect(result).toHaveProperty('sender');
    expect(result.sender.id).toEqual(adminId);
    expect(result).toHaveProperty('receiver');
    expect(result.receiver.id).toEqual(userId);
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('offeredSkill');
    expect(result).toHaveProperty('requestedSkill');
    expect(result).toHaveProperty('isRead', false);
  });

  it('/POST requests - offeredSkillId - пустая строка (400)', async () => {
    await request(server)
      .post('/requests')
      .auth(accessToken, { type: 'bearer' })
      .send({
        offeredSkillId: '',
        requestedSkillId: `${requestedSkillId}`,
      })
      .expect(400);
  });

  it('/POST requests - requestedSkillId - пустая строка (400)', async () => {
    await request(server)
      .post('/requests')
      .auth(accessToken, { type: 'bearer' })
      .send({
        offeredSkillId: `${offeredSkillId}`,
        requestedSkillId: '',
      })
      .expect(400);
  });

  it('/POST requests - заявка уже существует (400)', async () => {
    await request(server)
      .post('/requests')
      .auth(accessToken, { type: 'bearer' })
      .send({
        offeredSkillId: `${offeredSkillId}`,
        requestedSkillId: `${requestedSkillId}`,
      })
      .expect(400);
  });

  it('/POST requests - запрашиваемого навыка не существует (404)', async () => {
    await request(server)
      .post('/requests')
      .auth(accessToken, { type: 'bearer' })
      .send({
        offeredSkillId: `${offeredSkillId}`,
        requestedSkillId: '1',
      })
      .expect(404);
  });

  it('/POST requests - предлагаемого навыка не существует (404)', async () => {
    await request(server)
      .post('/requests')
      .auth(accessToken, { type: 'bearer' })
      .send({
        offeredSkillId: '1',
        requestedSkillId: `${requestedSkillId}`,
      })
      .expect(404);
  });

  it('/GET requests/:id - получение заявки по id', async () => {
    const res = await request(server)
      .get(`/requests/${requestId}`)
      .auth(accessToken, { type: 'bearer' })
      .expect(200);
    const result = res.body as Request;
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('updatedAt');
    expect(result).toHaveProperty('sender');
    expect(result.sender.id).toEqual(adminId);
    expect(result.sender).not.toHaveProperty('password');
    expect(result.sender).not.toHaveProperty('refreshToken');
    expect(result).toHaveProperty('receiver');
    expect(result.receiver.id).toEqual(userId);
    expect(result.receiver).not.toHaveProperty('password');
    expect(result.receiver).not.toHaveProperty('refreshToken');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('isRead');
  });

  it('/GET requests/:id - пользователь не отправитель, не получатель и не админ (403)', async () => {
    await request(server)
      .get(`/requests/${requestId}`)
      .auth(accessTokenOtherUser, { type: 'bearer' })
      .expect(403);
  });

  it('/GET requests/:id - заявки не существует (404)', async () => {
    await request(server)
      .get('/requests/1')
      .auth(accessToken, { type: 'bearer' })
      .expect(404);
  });

  it('/PATCH requests/:id - обновление заявки по id', async () => {
    const res = await request(server)
      .patch(`/requests/${requestId}`)
      .auth(accessToken, { type: 'bearer' })
      .send({ action: 'accept' })
      .expect(200);
    const result = res.body as Request;
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('updatedAt');
    expect(result).toHaveProperty('sender');
    expect(result.sender.id).toEqual(adminId);
    expect(result).toHaveProperty('receiver');
    expect(result.receiver.id).toEqual(userId);
    expect(result).toHaveProperty('offeredSkill');
    expect(result).toHaveProperty('requestedSkill');
    expect(result).toHaveProperty('status', 'accepted');
    expect(result).toHaveProperty('isRead', true);
  });

  it('/PATCH requests/:id - action - невалидное значение (400)', async () => {
    await request(server)
      .patch(`/requests/${requestId}`)
      .auth(accessToken, { type: 'bearer' })
      .send({ action: 'invalid' })
      .expect(400);
  });

  it('/PATCH requests/:id - пользователь не админ и не получатель (403)', async () => {
    await request(server)
      .patch(`/requests/${requestId}`)
      .auth(accessTokenOtherUser, { type: 'bearer' })
      .send({ action: 'accept' })
      .expect(403);
  });

  it('/PATCH requests/:id - заявка не существует (404)', async () => {
    await request(server)
      .patch('/requests/1')
      .auth(accessToken, { type: 'bearer' })
      .send({ action: 'accept' })
      .expect(404);
  });

  it('/DELETE requests/:id - пользователь не админ и не отправитель (403)', async () => {
    await request(server)
      .delete(`/requests/${requestId}`)
      .auth(accessTokenOtherUser, { type: 'bearer' })
      .expect(403);
  });

  it('/DELETE requests/:id - удаление заявки по id', async () => {
    const res = await request(server)
      .delete(`/requests/${requestId}`)
      .auth(accessToken, { type: 'bearer' })
      .expect(200);
    const result = res.body as { message: string };
    expect(result).toEqual({
      message: `Заявка с id: ${requestId} успешно удалена`,
    });
  });

  it('/DELETE requests/:id - заявки не существует (404)', async () => {
    await request(server)
      .delete('/requests/1')
      .auth(accessToken, { type: 'bearer' })
      .expect(404);
  });
});
