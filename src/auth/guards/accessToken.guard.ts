import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

// фейковая стуктура payload JWT токена
export interface JwtPayload {
  sub: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthRequest extends Request {
  user: JwtPayload;
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    console.log('JWT request.headers:', request.headers);
    const accessToken = request.headers['authorization'];
    console.log('JWT accessToken:', accessToken);

    if (!accessToken || !accessToken.startsWith('Bearer ')) {
      throw new UnauthorizedException('Требуется авторизация bearer');
    }

    const token = accessToken.split(' ')[1];
    console.log('JWT token:', token);
    try {
      console.log('JWT token2:', token);
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.accessTokenSecret'),
      });
      console.log('JWT payload:', payload);
      request.user = payload;
    } catch {
      throw new UnauthorizedException('Требуется авторизацияdd');
    }
    return true;
  }
}