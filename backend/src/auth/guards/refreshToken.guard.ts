import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, AuthRequest } from '../types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const refreshToken = request.headers['authorization'];

    if (!refreshToken || !refreshToken.startsWith('Bearer ')) {
      throw new UnauthorizedException('Требуется refreshToken');
    }

    const token = refreshToken.split(' ')[1];

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.refreshTokenSecret'),
      });
      request.user = payload;
    } catch {
      throw new UnauthorizedException('Невалидный refreshToken');
    }
    return true;
  }
}
