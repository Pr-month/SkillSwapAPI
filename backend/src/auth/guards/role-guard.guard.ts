import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthRequest } from '../types';

@Injectable()
export class RoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = request.user;
    if (user.role !== 'admin') {
      throw new ForbiddenException(
        'Доступ запрещен: требуется роль администратора',
      );
    }
    return true;
  }
}
