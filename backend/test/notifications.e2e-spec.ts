import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Server } from 'http';
import { AppModule } from 'src/app.module';
import { AllExceptionFilter } from 'src/common/all-exception.filter';
import { AuthResponseDto } from 'src/auth/dto/AuthResponse.dto';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { io, Socket } from 'socket.io-client';
import { NotificationType } from 'src/notifications/ws-jwt/types';
import { logger } from 'src/logger/mainLogger';

describe('Notification (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let accessToken: string;
  let userId: string;
  let user2AccessToken: string;
  //let user2Id: string;
  // let notificationId: string;
  let socket: Socket;
  let socket2: Socket;

  interface payloadType {
    type: NotificationType;
    skillName: string;
    sender: string;
  }
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
    // user2Id = loginBody2.user.id as string;
  }, 20000);
  afterAll(async () => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
    if (socket2 && socket2.connected) {
      socket2.disconnect();
    }
    await app.close();
  });

  describe('Уведомления WebSocket', () => {
    beforeEach(async () => {
      const port = process.env.WS_PORT
        ? parseInt(process.env.WS_PORT, 10)
        : 4000;

      socket = io(`http://localhost:${port}`, {
        query: {
          token: accessToken,
        },
        transports: ['websocket'],
      });

      socket2 = io(`http://localhost:${port}`, {
        query: {
          token: user2AccessToken,
        },
        transports: ['websocket'],
      });

      // Ждем, пока оба сокета подключатся
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          socket.on('connect', () => {
            logger.info('User 1 Socket connected (beforeEach)');
            resolve();
          });
          socket.on('connect_error', (err) => {
            logger.error('User 1 Socket connection error (beforeEach):', err);
            reject(err);
          });
        }),
        new Promise<void>((resolve, reject) => {
          socket2.on('connect', () => {
            logger.info('User 2 Socket connected (beforeEach)');
            resolve();
          });
          socket2.on('connect_error', (err) => {
            logger.error('User 2 Socket connection error (beforeEach):', err);
            reject(err);
          });
        }),
      ]);
    }, 10000);

    afterEach(async () => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
      if (socket2 && socket2.connected) {
        socket2.disconnect();
      }
      socket.off('notificateNewRequest');
      socket2.off('notificateNewRequest');

      await new Promise((resolve) => setTimeout(resolve, 1000));
    });

    it('должен получать уведомление в реальном времени, когда новое уведомление создается для пользователя 1', (done) => {
      socket.on('notificateNewRequest', (payload: payloadType) => {
        expect(payload).toBeDefined();
        expect(payload.type).toEqual('newRequest');
        expect(payload.skillName).toEqual('Test Skill');
        expect(payload.sender).toEqual('Test Sender');
        done();
      });

      request(server)
        .post('/notifications/test-create')
        .auth(accessToken, { type: 'bearer' })
        .send({
          recipientId: userId,
          type: 'newRequest',
          skillName: 'Test Skill',
          sender: 'Test Sender',
        })
        .expect(201)
        .catch(done);
    }, 2000);

    it('не должен получать уведомления для других пользователей (пользователь 2 не должен получать уведомление пользователя 1)', (done) => {
      let notificationReceivedByUser2 = false;

      socket2.on('notificateNewRequest', () => {
        notificationReceivedByUser2 = true;
      });

      request(server)
        .post('/notifications/test-create')
        .auth(accessToken, { type: 'bearer' })
        .send({
          recipientId: userId,
          type: 'someOtherType',
          skillName: 'Another Skill',
          sender: 'Another Sender',
        })
        .expect(201)
        .then(() => {
          setTimeout(() => {
            expect(notificationReceivedByUser2).toBe(false);
            done();
          }, 500);
        })
        .catch(done);
    }, 5000);

    it('должен отклонять WebSocket соединение без токена', (done) => {
      const port = process.env.WS_PORT
        ? parseInt(process.env.WS_PORT, 10)
        : 4000;

      let wasConnected = false;
      let disconnectReason: string | undefined;

      const invalidSocket = io(`http://localhost:${port}`, {
        transports: ['websocket'],
        forceNew: true,
        autoConnect: false,
      });

      invalidSocket.once('connect', () => {
        logger.info(
          '[Test] Нежелательное подключение произошло. Ожидаем отключение.',
        );
        wasConnected = true;
      });

      invalidSocket.once('connect_error', (err: Error) => {
        logger.info(`[Test] Получена ошибка подключения: ${err.message}`);
        expect(err.message).toContain('Требуется авторизация');
        invalidSocket.disconnect();
        done();
      });

      invalidSocket.once('disconnect', (reason: string) => {
        logger.info(`[Test] Сокет отключен по причине: ${reason}`);
        disconnectReason = reason;

        if (wasConnected) {
          expect(disconnectReason).toContain('io server disconnect');
          done();
        } else {
          expect(disconnectReason).toContain('io server disconnect');
          done();
        }
      });

      const testTimeout = setTimeout(() => {
        invalidSocket.disconnect();
        done(
          new Error(
            'Таймаут истек, сокет не подключился и не отключился ожидаемым образом.',
          ),
        );
      }, 4000);

      invalidSocket.once('connect_error', () => clearTimeout(testTimeout));
      invalidSocket.once('disconnect', () => clearTimeout(testTimeout));

      logger.info('[Test] Инициирую подключение без токена.');
      invalidSocket.connect();
    }, 5000);

    it('должен отклонять WebSocket соединение с недействительным токеном', (done) => {
      const port = process.env.WS_PORT
        ? parseInt(process.env.WS_PORT, 10)
        : 4000;

      let wasConnected = false;
      let disconnectReason: string | undefined;

      const invalidSocket = io(`http://localhost:${port}`, {
        query: {
          token: 'invalid.jwt.token',
        },
        transports: ['websocket'],
        forceNew: true,
        autoConnect: false,
      });

      invalidSocket.once('connect', () => {
        logger.info(
          '[Test] Нежелательное подключение произошло с недействительным токеном. Ожидаем отключение.',
        );
        wasConnected = true;
      });

      invalidSocket.once('connect_error', (err: Error) => {
        logger.info(
          `[Test] Получена ошибка подключения с недействительным токеном: ${err.message}`,
        );

        expect(err.message).toContain('Некорректный JWT');
        invalidSocket.disconnect();
        done();
      });

      invalidSocket.once('disconnect', (reason: string) => {
        logger.info(
          `[Test] Сокет отключен по причине (недействительный токен): ${reason}`,
        );
        disconnectReason = reason;

        if (wasConnected) {
          expect(disconnectReason).toContain('io server disconnect');
          done();
        } else {
          expect(disconnectReason).toContain('io server disconnect');
          done();
        }
      });

      const testTimeout = setTimeout(() => {
        invalidSocket.disconnect();
        done(
          new Error(
            'Таймаут истек, сокет не подключился/отключился ожидаемым образом с недействительным токеном.',
          ),
        );
      }, 4000);

      invalidSocket.once('connect_error', () => clearTimeout(testTimeout));
      invalidSocket.once('disconnect', () => clearTimeout(testTimeout));

      logger.info('[Test] Инициирую подключение с недействительным токеном.');
      invalidSocket.connect();
    }, 5000);

    it('должен корректно обрабатывать отключение клиента', (done) => {
      const port = process.env.WS_PORT
        ? parseInt(process.env.WS_PORT, 10)
        : 4000;

      const tempSocket = io(`http://localhost:${port}`, {
        query: {
          token: accessToken,
        },
        transports: ['websocket'],
        forceNew: true,
        autoConnect: false,
      });

      tempSocket.once('connect', () => {
        logger.info(
          '[Test] tempSocket успешно подключен, инициирую отключение.',
        );

        tempSocket.disconnect();
      });

      tempSocket.once('disconnect', (reason: string) => {
        logger.info(`[Test] tempSocket отключен по причине: ${reason}`);

        expect(reason).toBe('io client disconnect');
        done();
      });

      tempSocket.once('connect_error', (err: Error) => {
        logger.error(
          '[Test] Ошибка при подключении tempSocket, тест провален:',
          err,
        );
        tempSocket.disconnect();
        done(new Error(`Ошибка подключения tempSocket: ${err.message}`));
      });

      const testTimeout = setTimeout(() => {
        tempSocket.disconnect();
        done(
          new Error(
            'Таймаут истек, tempSocket не подключился или не отключился ожидаемым образом.',
          ),
        );
      }, 4000);

      tempSocket.once('disconnect', () => clearTimeout(testTimeout));
      tempSocket.once('connect_error', () => clearTimeout(testTimeout));

      logger.info(
        '[Test] Инициирую подключение tempSocket для теста отключения.',
      );
      tempSocket.connect();
    }, 5000);
  });
});
