import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { ConfigService } from '@nestjs/config';
import { AllExceptionFilter } from '../src/common/all-exception.filter';
import { AuthResponseDto } from '../src/auth/dto/AuthResponse.dto';
import { Server } from 'http';
import { AppModule } from '../src/app.module';
import { FindALLCategoryResponseDto } from '../src/categories/dto/find-all-category-response-dto';
import { CreateCategoryResponseDto } from '../src/categories/dto/create-category-response.dto';
import { CategoryResponseDto } from '../src/categories/dto/category-response-dto';

describe('CategoriesController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let accessTokenAdmin: string;
  let accessTokenUser: string;
  let categoryId: string;

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
    accessTokenAdmin = loginBody.accessToken;
    // получаем данные обычного пользователя
    const loginRes2 = await request(server)
      .post('/auth/login')
      .send({ email: 'ivan@example.com', password: 'пароль3' })
      .expect(200);
    const loginBody2 = loginRes2.body as AuthResponseDto;
    accessTokenUser = loginBody2.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/GET categories - получение всех категорий', async () => {
    const res = await request(server).get('/categories').expect(200);
    const result = res.body as FindALLCategoryResponseDto;
    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('name');
    expect(result[0]).toHaveProperty('children');
  });

  it('/POST categories - добавление категории', async () => {
    const res = await request(server)
      .post('/categories')
      .auth(accessTokenAdmin, { type: 'bearer' })
      .send({ name: 'testCategory' })
      .expect(201);
    const result = res.body as CreateCategoryResponseDto;
    categoryId = result.id;
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name', 'testCategory');
    expect(result).toHaveProperty('parent', null);
  });

  it('/POST categories - название категории - пустая строка (400)', async () => {
    await request(server)
      .post('/categories')
      .auth(accessTokenAdmin, { type: 'bearer' })
      .send({ name: '' })
      .expect(400);
  });

  it('/POST categories - название категории - слишком длинное (400)', async () => {
    await request(server)
      .post('/categories')
      .auth(accessTokenAdmin, { type: 'bearer' })
      .send({
        name: '123456789012345678901234567890123456789012jghckxhgxhgxjtxfzdfzfgdhgkjbjhvchgktyxfxfgchgvjhvfhghcfgxfrxgfchvjvhgckgxjgfxgfcjlfykufdjtdxfgcvjhkhjujyhfgdhgfggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg34567890',
      })
      .expect(400);
  });

  it('/POST categories - название категории - не строка (400)', async () => {
    await request(server)
      .post('/categories')
      .auth(accessTokenAdmin, { type: 'bearer' })
      .send({ name: 123 })
      .expect(400);
  });

  it('/POST categories - категорию пытается создать не админ (403)', async () => {
    await request(server)
      .post('/categories')
      .auth(accessTokenUser, { type: 'bearer' })
      .send({ name: 'testCategory2' })
      .expect(403);
  });

  it('/POST categories - категория с таким названием уже существует (409)', async () => {
    await request(server)
      .post('/categories')
      .auth(accessTokenAdmin, { type: 'bearer' })
      .send({ name: 'testCategory' })
      .expect(409);
  });

  it('/PATCH categories/:id - обновление категории', async () => {
    const res = await request(server)
      .patch(`/categories/${categoryId}`)
      .auth(accessTokenAdmin, { type: 'bearer' })
      .send({ name: 'newName' })
      .expect(200);
    const result = res.body as CategoryResponseDto;
    expect(result).toHaveProperty('id', categoryId);
    expect(result).toHaveProperty('name', 'newName');
    expect(result).toHaveProperty('parent', null);
  });

  it('/PATCH categories/:id - название категории - пустая строка (400)', async () => {
    await request(server)
      .patch(`/categories/${categoryId}`)
      .auth(accessTokenAdmin, { type: 'bearer' })
      .send({ name: '' })
      .expect(400);
  });

  it('/PATCH categories/:id - название категории - слишком длинное (400)', async () => {
    await request(server)
      .patch(`/categories/${categoryId}`)
      .auth(accessTokenAdmin, { type: 'bearer' })
      .send({
        name: 'uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu',
      })
      .expect(400);
  });

  it('/PATCH categories/:id - название категории - не строка (400)', async () => {
    await request(server)
      .patch(`/categories/${categoryId}`)
      .auth(accessTokenAdmin, { type: 'bearer' })
      .send({ name: 123 })
      .expect(400);
  });

  it('/PATCH categories/:id - категорию пытается обновить не админ (403)', async () => {
    await request(server)
      .patch(`/categories/${categoryId}`)
      .auth(accessTokenUser, { type: 'bearer' })
      .send({ name: 'newName2' })
      .expect(403);
  });

  it('/PATCH categories/:id - невалидный id (404)', async () => {
    await request(server)
      .patch(`/categories/1`)
      .auth(accessTokenAdmin, { type: 'bearer' })
      .send({ name: 'newName123' })
      .expect(404);
  });

  it('/DELETE categories/:id - удаление категории', async () => {
    const res = await request(server)
      .delete(`/categories/${categoryId}`)
      .auth(accessTokenAdmin, { type: 'bearer' })
      .expect(200);
    const message = res.body as { message: string };
    expect(message).toEqual({
      message: `Категория с id ${categoryId} удалена`,
    });
  });

  it('/DELETE categories/:id - категорию пытается удалить не админ (403)', async () => {
    await request(server)
      .delete(`/categories/${categoryId}`)
      .auth(accessTokenUser, { type: 'bearer' })
      .expect(403);
  });

  it('/DELETE categories/:id - невалидный id (404)', async () => {
    await request(server)
      .delete(`/categories/1`)
      .auth(accessTokenAdmin, { type: 'bearer' })
      .expect(404);
  });
});
