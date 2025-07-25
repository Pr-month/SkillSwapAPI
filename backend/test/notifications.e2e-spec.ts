import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Server } from 'http';
import { AppModule } from 'src/app.module';
import { AllExceptionFilter } from 'src/common/all-exception.filter';
import { AuthResponseDto } from 'src/auth/dto/AuthResponse.dto';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { join } from 'path';
import { existsSync } from 'fs';
import { io, Socket } from 'socket.io-client';

describe('SkillsController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let accessToken: string;
  let userId: string;
  let user2AccessToken: string;
  let user2Id: string;
  let notificationId: string;
  let socket: Socket;
  let socket2: Socket;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    app.useGlobalFilters(new AllExceptionFilter(app.get(ConfigService)));
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.init();
    server = app.getHttpServer() as Server;

    const loginRes: request.Response = await request(server)
      .post('/auth/login')
      .send({ email: 'ekaterina@example.com', password: 'пароль2' })
      .expect(200);
    const loginBody = loginRes.body as AuthResponseDto;
    accessToken = loginBody.accessToken;
    userId = loginBody.user.id as string;

    const loginRes2: request.Response = await request(server)
      .post('/auth/login')
      .send({ email: 'ivan@example.com', password: 'пароль3' })
      .expect(200);
    const loginBody2 = loginRes2.body as AuthResponseDto;
    user2AccessToken = loginBody2.accessToken;
    user2Id = loginBody2.user.id as string;

    const port = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 4000;

    socket = io(`http://localhost:${port}`, {
      extraHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      transports: ['websocket'],
    });

    socket2 = io(`http://localhost:${port}`, {
      extraHeaders: {
        Authorization: `Bearer ${user2AccessToken}`,
      },
      transports: ['websocket'],
    });

    // Wait for both sockets to connect
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        socket.on('connect', () => {
          console.log('User 1 Socket connected');
          resolve();
        });
        socket.on('connect_error', (err) => {
          console.error('User 1 Socket connection error:', err);
          reject(err);
        });
      }),
      new Promise<void>((resolve, reject) => {
        socket2.on('connect', () => {
          console.log('User 2 Socket connected');
          resolve();
        });
        socket2.on('connect_error', (err) => {
          console.error('User 2 Socket connection error:', err);
          reject(err);
        });
      }),
    ]);
  }, 20000); // Increased timeout for socket connections
  afterAll(async () => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
    if (socket2 && socket2.connected) {
      socket2.disconnect();
    }
    await app.close();
  });









  // --- Группа тестов для WebSocket уведомлений ---
  describe('Уведомления WebSocket', () => {
    it('должен получать уведомление в реальном времени, когда новое уведомление создается для пользователя 1', (done) => {
      // Подписываемся на событие 'notificateNewRequest' на сокете первого пользователя
      socket.on('notificateNewRequest', (payload) => {
        // Проверяем, что полезная нагрузка определена и соответствует ожидаемой структуре
        expect(payload).toBeDefined();
        expect(payload.type).toEqual('newRequest');
        expect(payload.skillName).toEqual('Test Skill');
        expect(payload.sender).toEqual('Test Sender');
        done(); // Завершаем тест, так как уведомление успешно получено
      });

      // Отправляем HTTP-запрос на тестовый эндпоинт, который инициирует отправку WS-уведомления
      request(server)
        .post('/notifications/test-create')
        .auth(accessToken, { type: 'bearer' })
        .send({
          recipientId: userId, // Отправляем уведомление первому пользователю
          type: 'newRequest',
          skillName: 'Test Skill',
          sender: 'Test Sender',
        })
        .expect(201) // Ожидаем успешное создание
        .then(response => {
          // Вы можете добавить проверку тела ответа, если ваш эндпоинт возвращает что-то
          expect(response.body.message).toEqual('Test notification initiated successfully via WebSocket.');
        })
        .catch(done); // Если HTTP-запрос завершился ошибкой, тест провален
    }, 5000); // Таймаут для этого теста 5 секунд

    it('не должен получать уведомления для других пользователей (пользователь 2 не должен получать уведомление пользователя 1)', (done) => {
      let notificationReceivedByUser2 = false;
      // Подписываем сокет второго пользователя на событие
      socket2.on('notificateNewRequest', (payload) => {
        notificationReceivedByUser2 = true; // Если событие пришло, устанавливаем флаг
      });

      // Инициируем создание уведомления для user 1
      request(server)
        .post('/notifications/test-create')
        .auth(accessToken, { type: 'bearer' })
        .send({
          recipientId: userId, // Уведомление отправляется user 1
          type: 'someOtherType',
          skillName: 'Another Skill',
          sender: 'Another Sender',
        })
        .expect(201)
        .then(() => {
          // Даем небольшую задержку, чтобы убедиться, что уведомление НЕ пришло к user 2
          setTimeout(() => {
            expect(notificationReceivedByUser2).toBe(false); // Проверяем, что флаг остался false
            done();
          }, 500); // Таймаут для ожидания, если вдруг придет нежелательное уведомление
        })
        .catch(done);
    }, 5000);

    it('должен отклонять WebSocket соединение без токена', (done) => {
      const port = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 4000;
      // Попытка подключения без заголовка Authorization
      const invalidSocket = io(`http://localhost:${port}`, {
        transports: ['websocket'],
      });

      // Ожидаем ошибку подключения
      invalidSocket.on('connect_error', (err: Error) => {
        // Проверяем, что сообщение об ошибке содержит "Unauthorized" или аналогичный текст
        expect(err.message).toContain('Unauthorized'); // Ваше WsException сообщение
        invalidSocket.disconnect();
        done();
      });

      // Если сокет каким-то образом подключился, это провал теста
      invalidSocket.on('connect', () => {
        invalidSocket.disconnect();
        done(new Error('Сокет подключился без токена, чего не должно быть.'));
      });
    }, 5000);

    it('должен отклонять WebSocket соединение с недействительным токеном', (done) => {
      const port = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 4000;
      // Попытка подключения с невалидным токеном
      const invalidSocket = io(`http://localhost:${port}`, {
        extraHeaders: {
          Authorization: `Bearer invalid.jwt.token`, // Явно невалидный токен
        },
        transports: ['websocket'],
      });

      invalidSocket.on('connect_error', (err: Error) => {
        expect(err.message).toContain('Unauthorized'); // Ваше WsException сообщение
        invalidSocket.disconnect();
        done();
      });

      invalidSocket.on('connect', () => {
        invalidSocket.disconnect();
        done(new Error('Сокет подключился с недействительным токеном, чего не должно быть.'));
      });
    }, 5000);

    it('должен корректно обрабатывать отключение клиента', (done) => {
      const port = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 4000;
      // Создаем временный сокет для этого теста
      const tempSocket = io(`http://localhost:${port}`, {
        extraHeaders: { Authorization: `Bearer ${accessToken}` },
        transports: ['websocket'],
      });

      // После подключения, сразу отключаем его
      tempSocket.on('connect', () => {
        tempSocket.disconnect();
      });

      // Ожидаем событие 'disconnect' и проверяем причину
      tempSocket.on('disconnect', (reason: string) => {
        expect(reason).toBe('io client disconnect'); // Ожидаем, что отключение инициировано клиентом
        done();
      });

      tempSocket.on('connect_error', (err: Error) => {
        done(err); // Если произошла ошибка при подключении, тест провален
      });
    }, 5000);
  });




});
