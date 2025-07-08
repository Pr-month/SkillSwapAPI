import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, AuthRequest } from '../types';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const accessToken = request.headers['authorization'];

    if (!accessToken || !accessToken.startsWith('Bearer ')) {
      throw new UnauthorizedException('Требуется авторизация bearer');
    }

    const token = accessToken.split(' ')[1];
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.accessTokenSecret'),
      });
      request.user = payload;
    } catch {
      throw new UnauthorizedException('Требуется авторизация');
    }
    return true;
  }
}
