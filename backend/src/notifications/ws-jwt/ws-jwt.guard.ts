import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SocketWithUser } from './types';
import { WsException } from '@nestjs/websockets';
import { logger } from 'src/logger/mainLogger';
import { JwtPayload } from 'src/auth/types';
import { configuration, IConfig } from '../../config/configuration';

@Injectable()
export class JwtWsGuard {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(configuration.KEY)
    private readonly config: Pick<IConfig, 'jwt'>,
  ) {}

  verifyToken(client: SocketWithUser) {
    let accessToken = client.handshake.query?.token;

    if (!accessToken) {
      throw new WsException(
        'Требуется авторизация: JWT-токен не предоставлен.',
      );
    }

    if (Array.isArray(accessToken)) {
      accessToken = accessToken[0];
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(accessToken, {
        secret: this.config.jwt.accessTokenSecret,
      });
      client.data.user = payload;

      return true;
    } catch (error) {
      if (error instanceof Error) {
        logger.info('Ошибка верификации JWT для WebSocket:', error.message);
      } else {
        logger.info('Неизвестная ошибка верификации JWT для WebSocket:', error);
      }
      throw new WsException('Некорректный JWT ');
    }
  }
}
