import { JwtService } from '@nestjs/jwt';
import { RefreshTokenGuard } from './refreshToken.guard';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

type MockAuthRequest = {
  headers: { authorization?: string };
  user?: unknown;
};

describe('RefreshTokenGuard', () => {
  let guard: RefreshTokenGuard;
  let jwtService: { verify: jest.Mock };
  let configService: { get: jest.Mock };

  const mockRequest = (authorization?: string): MockAuthRequest => ({
    headers: { authorization },
    user: undefined,
  });

  const mockContext = (request: MockAuthRequest): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  beforeEach(() => {
    jwtService = {
      verify: jest.fn(),
    };

    configService = {
      get: jest.fn().mockReturnValue('test_refresh_secret'),
    };

    guard = new RefreshTokenGuard(
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  it('должен быть определен', () => {
    expect(guard).toBeDefined();
  });

  describe('валидный refresh токен', () => {
    it('должен пропускать запрос и устанавливать пользователя', () => {
      const validToken = 'valid_refresh_token';
      const request = mockRequest(`Bearer ${validToken}`);
      const context = mockContext(request);
      const payload = { userId: 1, username: 'test', refreshToken: true };

      jwtService.verify.mockReturnValue(payload);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toEqual(payload);
      expect(jwtService.verify).toHaveBeenCalledWith(validToken, {
        secret: 'test_refresh_secret',
      });
      expect(configService.get).toHaveBeenCalledWith('jwt.refreshTokenSecret');
    });
  });

  describe('refresh токен не передан', () => {
    it('должен выбрасывать UnauthorizedException', () => {
      const request = mockRequest();
      const context = mockContext(request);

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow(
        'Требуется refreshToken',
      );
    });
  });

  describe('отсутствует Bearer', () => {
    it('должен выбрасывать UnauthorizedException при неправильном формате', () => {
      const request = mockRequest('InvalidTokenFormat');
      const context = mockContext(request);

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow(
        'Требуется refreshToken',
      );
    });

    it('должен выбрасывать UnauthorizedException при только слове Bearer', () => {
      const request = mockRequest('Bearer');
      const context = mockContext(request);

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow(
        'Требуется refreshToken',
      );
    });
  });

  describe('невалидный refresh токен', () => {
    it('должен выбрасывать UnauthorizedException при ошибке верификации', () => {
      const invalidToken = 'invalid_refresh_token';
      const request = mockRequest(`Bearer ${invalidToken}`);
      const context = mockContext(request);

      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow(
        'Невалидный refreshToken',
      );
      expect(jwtService.verify).toHaveBeenCalledWith(invalidToken, {
        secret: 'test_refresh_secret',
      });
    });
  });
});
