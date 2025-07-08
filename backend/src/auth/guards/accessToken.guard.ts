import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, AuthRequest } from '../types';
import { configuration, IConfig } from '../../config/configuration';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @Inject(configuration.KEY)
    private readonly config: Pick<IConfig, 'jwt'>,
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
        secret: this.config.jwt.accessTokenSecret,
      });
      request.user = payload;
    } catch {
      throw new UnauthorizedException('Требуется авторизация');
    }
    return true;
  }
}
