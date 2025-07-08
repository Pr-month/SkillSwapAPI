import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';

import { Server } from 'socket.io';

import { logger } from 'src/logger/mainLogger';
import { JwtWsGuard } from './ws-jwt/ws-jwt.guard';

import { NotificationType, SocketWithUser } from './ws-jwt/types';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway(Number(process.env.WS_PORT) || 4000, {
  cors: {
    origin: '*', // Разрешить запросы от любых источников (для разработки).
    credentials: true, // Разрешить передачу учетных данных (например, куки, авторизационные заголовки)
  },
})
@Injectable()
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly jwtGuard: JwtWsGuard,
    private readonly configService: ConfigService,
  ) {}
  @WebSocketServer() server: Server;

  onModuleInit() {
    logger.info(
      `webSocket listen port: ${Number(process.env.WS_PORT) || 4000}`,
    );
  }

  async handleConnection(client: SocketWithUser) {
    try {
      this.jwtGuard.verifyToken(client);
      const userId = client.data.user?.sub;

      if (!userId) {
        logger.warn(
          `[WS] Идентификатор пользователя не найден в полезной нагрузке токена.`,
        );
        throw new WsException(
          '[WS] Не удалось получить идентификатор пользователя из токена.',
        );
      }

      await client.join(userId);
      logger.info(
        `[WS] Клиент ${client.id}(id socket) подключен и присоединен к комнате: ${userId}(id пользователя)`,
      );
    } catch (error) {
      if (error instanceof WsException) {
        logger.warn(
          `[WS] Сбой подключения для клиента ${client.id}: ${error.message}`,
        );
      } else if (error instanceof Error) {
        logger.error(
          `[WS] Необработанная ошибка во время подключения для клиента ${client.id}: ${error.message}`,
          error.stack,
        );
      } else {
        logger.error(
          `[WS] Неизвестная ошибка во время подключения для клиента ${client.id}: ${JSON.stringify(error)}`,
        );
      }
      client.disconnect(true);
    }
  }

  handleDisconnect(client: SocketWithUser) {
    const userId = client.data.user.sub;
    logger.info(
      `[WS] Клиент ${client.id}(id socket) отключился. Идентификатор пользователя: ${userId || 'N/A'}`,
    );
  }

  notifyUser(
    userId: string, // кому посылаем сообщение
    payload: { type: NotificationType; skillName: string; sender: string }, //sender - от кого сообщение
  ) {
    logger.info(
      `[WS] Попытка отправить уведомление пользователю ${userId} с полезной нагрузкой: ${JSON.stringify(payload)}`,
    );

    this.server.to(userId).emit('notificateNewRequest', payload);

    logger.info(
      `[WS] Уведомление 'notificateNewRequest' отправлено в комнату ${userId}. Полезная нагрузка: ${JSON.stringify(payload)}`,
    );
  }
}
