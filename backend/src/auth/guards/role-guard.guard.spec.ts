import { RoleGuard } from './role-guard.guard';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';

describe('RoleGuard', () => {
  let guard: RoleGuard;

  beforeEach(() => {
    guard = new RoleGuard();
  });

  it('успешно создаётся', () => {
    expect(guard).toBeDefined();
  });

  it('пропускает пользователя с ролью admin', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'admin' } }),
      }),
    } as unknown as ExecutionContext;
    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('выбрасывает ForbiddenException для пользователя без роли admin', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: 'user' } }),
      }),
    } as unknown as ExecutionContext;
    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(mockContext)).toThrow(
      'Доступ запрещен: требуется роль администратора',
    );
  });

  it('выбрасывает ForbiddenException если пользователь не определён', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;
    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(mockContext)).toThrow(
      'Доступ запрещен: требуется роль администратора',
    );
  });
});
