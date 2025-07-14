import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, AuthRequest } from '../types';
import { configuration, IConfig } from '../../config/configuration';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @Inject(configuration.KEY)
    private readonly config: Pick<IConfig, 'jwt'>,
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
        secret: this.config.jwt.refreshTokenSecret,
      });
      request.user = payload;
    } catch {
      throw new UnauthorizedException('Невалидный refreshToken');
    }
    return true;
  }
}
