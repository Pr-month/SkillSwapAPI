import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Server } from 'http';
import { AppModule } from 'src/app.module';
import { AllExceptionFilter } from 'src/common/all-exception.filter';
import { AuthResponseDto } from 'src/auth/dto/AuthResponse.dto';
import { join } from 'path';
import { existsSync } from 'fs';

describe('SkillsController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let skillId: string;
  let accessToken: string;
  let userId: string;
  let categoryId: string;
  let skillIdOtherUser: string;
  let absolutePath: string;

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
    //получаем данные пользователя 1
    const loginRes: request.Response = await request(server)
      .post('/auth/login')
      .send({ email: 'ekaterina@example.com', password: 'пароль2' })
      .expect(200);
    const loginBody = loginRes.body as AuthResponseDto;
    accessToken = loginBody.accessToken;
    skillId = loginBody.user.skills[0].id;
    userId = loginBody.user.id as string;
    categoryId = loginBody.user.skills[0].category.id as string;
    // получаем данные пользователя 2
    const loginRes2 = await request(server)
      .post('/auth/login')
      .send({ email: 'ivan@example.com', password: 'пароль3' })
      .expect(200);
    const loginBody2 = loginRes2.body as AuthResponseDto;
    skillIdOtherUser = loginBody2.user.skills[0].id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/GET skills - Получение навыков', async () => {
    const res = await request(server).get('/skills').expect(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('totalPages');
  });

  it('/POST skills - добавление навыка', async () => {
    // Загружаем изображение для навыка
    const resUpload = await request(server)
      .post('/Uploads/upload')
      .auth(accessToken, { type: 'bearer' })
      .attach('file', join(__dirname, 'fixtures/test.png'))
      .expect(201);

    const imageAddress = resUpload.body as { publicUrl: string };
    expect(imageAddress.publicUrl).toBeDefined();

    const relativePath = imageAddress.publicUrl.startsWith('/')
      ? imageAddress.publicUrl.slice(1)
      : imageAddress.publicUrl;
    absolutePath = join(process.cwd(), relativePath);
    expect(existsSync(absolutePath)).toBe(true);

    const res = await request(server)
      .post('/skills')
      .auth(accessToken, { type: 'bearer' })
      .send({
        title: 'testSkill',
        description: 'testSkillDescription',
        category: `${categoryId}`,
        images: [imageAddress.publicUrl],
      })
      .expect(201);
    const result = res.body as {
      id: string;
      title: string;
      description: string;
      category: string;
      images: string[];
      owner: {
        id: string;
      };
      message: string;
    };
    skillId = result.id;
    expect(result.owner.id).toEqual(userId);
    expect(result.title).toEqual('testSkill');
    expect(result.message).toEqual('Навык создан');
  });

  it('/POST skills - title - пустая строка (400)', async () => {
    await request(server)
      .post('/skills')
      .auth(accessToken, { type: 'bearer' })
      .send({
        title: '',
        description: 'testSkillDescription',
        category: `${categoryId}`,
        images: [],
      })
      .expect(400);
  });

  it('/POST skills - description - пустая строка (400)', async () => {
    await request(server)
      .post('/skills')
      .auth(accessToken, { type: 'bearer' })
      .send({
        title: 'testSkill',
        description: '',
        category: `${categoryId}`,
        images: [],
      })
      .expect(400);
  });

  it('/POST skills - category - пустая строка (400)', async () => {
    await request(server)
      .post('/skills')
      .auth(accessToken, { type: 'bearer' })
      .send({
        title: 'testSkill',
        description: 'testSkillDescription',
        category: '',
        images: [],
      })
      .expect(400);
  });

  it('/PATCH skills/:id - обновление навыка по ID', async () => {
    const res = await request(server)
      .patch(`/skills/${skillId}`)
      .auth(accessToken, { type: 'bearer' })
      .send({ title: 'newName' })
      .expect(200);
    const result = res.body as {
      id: string;
      title: string;
      owner: {
        id: string;
      };
    };
    expect(result.id).toEqual(skillId);
    expect(result.title).toEqual('newName');
    expect(result.owner.id).toEqual(userId);
  });

  it('/PATCH skills/:id - title - пустая строка (400)', async () => {
    await request(server)
      .patch(`/skills/${skillId}`)
      .auth(accessToken, { type: 'bearer' })
      .send({ title: '' })
      .expect(400);
  });

  it('/PATCH skills/:id - description - пустая строка (400)', async () => {
    await request(server)
      .patch(`/skills/${skillId}`)
      .auth(accessToken, { type: 'bearer' })
      .send({ description: '' })
      .expect(400);
  });

  it('/PATCH skills/:id - category - пустая строка (400)', async () => {
    await request(server)
      .patch(`/skills/${skillId}`)
      .auth(accessToken, { type: 'bearer' })
      .send({ category: '' })
      .expect(400);
  });

  it('/PATCH skills/:id - пользователь пытыется изменить чужой навык (403)', async () => {
    const res = await request(server)
      .patch(`/skills/${skillIdOtherUser}`)
      .auth(accessToken, { type: 'bearer' })
      .send({ title: 'покер' })
      .expect(403);
    const body = res.body as { message: { message: string } };
    expect(body.message.message).toEqual(
      `Пользователь ${userId} не владеет навыком ${skillIdOtherUser}`,
    );
  });

  it('/PATCH skills/:id - навык c таким id не найден (404)', async () => {
    await request(server)
      .patch(`/skills/1`)
      .auth(accessToken, { type: 'bearer' })
      .send({ title: 'покер' })
      .expect(404);
  });

  it('/POST skills/favorite/:id - добавить навык в избранное', async () => {
    const res = await request(server)
      .post(`/skills/favorite/${skillId}`)
      .auth(accessToken, { type: 'bearer' })
      .expect(200);
    const message = res.body as { message: string };
    expect(message).toEqual({
      message: `Навык добавлен в избранное`,
    });
  });

  it('/POST skills/favorite/:id - навык уже в избранном (409)', async () => {
    const res = await request(server)
      .post(`/skills/favorite/${skillId}`)
      .auth(accessToken, { type: 'bearer' })
      .expect(409);
    const body = res.body as { message: { message: string } };
    expect(body.message.message).toEqual('Навык уже в избранном');
  });

  it('/POST skills/favorite/:id - навык c таким id не найден (404)', async () => {
    await request(server)
      .post(`/skills/favorite/1`)
      .auth(accessToken, { type: 'bearer' })
      .expect(404);
  });

  it('/DELETE skills/favorite/:id - удалить навык из избранного', async () => {
    const res = await request(server)
      .delete(`/skills/favorite/${skillId}`)
      .auth(accessToken, { type: 'bearer' })
      .expect(200);
    const message = res.body as { message: string };
    expect(message).toEqual({
      message: `Навык удалён из избранного`,
    });
  });

  it('/DELETE skills/favorite/:id - Навык уже удалён из избранного (404)', async () => {
    const res = await request(server)
      .delete(`/skills/favorite/${skillId}`)
      .auth(accessToken, { type: 'bearer' })
      .expect(404);
    const body = res.body as { message: { message: string } };
    expect(body.message.message).toEqual('Навык уже удалён из избранного');
  });

  it('/DELETE skills/favorite/:id - навык c таким id не найден (404)', async () => {
    await request(server)
      .delete(`/skills/favorite/1`)
      .auth(accessToken, { type: 'bearer' })
      .expect(404);
  });

  it('/DELETE skills/:id - удаление навыка по ID', async () => {
    const res = await request(server)
      .delete(`/skills/${skillId}`)
      .auth(accessToken, { type: 'bearer' })
      .expect(200);
    const message = res.body as { message: string };
    expect(message).toEqual({
      message: `Навык с id ${skillId} удалён у пользователя`,
    });
    expect(existsSync(absolutePath)).toBe(false);
  });

  it('/DELETE skills/:id - некорректный id (400)', async () => {
    const res = await request(server)
      .delete(`/skills/1`)
      .auth(accessToken, { type: 'bearer' })
      .expect(400);
    const body = res.body as { message: { message: string } };
    expect(body.message.message).toEqual('Некорректный UUID навыка');
  });

  it('/DELETE skills/:id - пользователь пытfается удалить чужой навык (403)', async () => {
    const res = await request(server)
      .delete(`/skills/${skillIdOtherUser}`)
      .auth(accessToken, { type: 'bearer' })
      .expect(403);
    const body = res.body as { message: { message: string } };
    expect(body.message.message).toEqual(
      `Пользователь ${userId} не владеет навыком ${skillIdOtherUser}`,
    );
  });
});
