import { JwtService } from '@nestjs/jwt';
import { JwtWsGuard } from './ws-jwt.guard';
import { IConfig } from '../../config/configuration';
import { JwtPayload } from '../../auth/types';
import { SocketWithUser } from './types';
import { WsException } from '@nestjs/websockets';

describe('JwtWsGuard', () => {
  let guard: JwtWsGuard;
  let jwtService: { verify: jest.Mock };
  let config: { jwt: { accessTokenSecret: string } };
  let mockClient: SocketWithUser;

  const mockPayload: JwtPayload = {
    sub: '1',
    email: 'email',
    role: 'user',
  };

  beforeEach(() => {
    config = { jwt: { accessTokenSecret: 'test_secret' } };
    jwtService = {
      verify: jest.fn(),
    };
    guard = new JwtWsGuard(
      jwtService as unknown as JwtService,
      config as unknown as Pick<IConfig, 'jwt'>,
    );
  });

  it('должен быть определен', () => {
    expect(guard).toBeDefined();
  });

  it('должен пропускать запрос и устанавливать пользователя', () => {
    jwtService.verify.mockReturnValue(mockPayload);
    mockClient = {
      handshake: {
        query: { token: 'valid_token' },
      },
      data: { user: null },
    } as unknown as SocketWithUser;
    const result = guard.verifyToken(mockClient);
    expect(result).toBe(true);
    expect(mockClient.data.user).toEqual(mockPayload);
  });

  it('должен пропускать запрос и устанавливать пользователя, если токен в виде массива', () => {
    jwtService.verify.mockReturnValue(mockPayload);
    mockClient = {
      handshake: {
        query: { token: ['valid_token', '0'] },
      },
      data: { user: null },
    } as unknown as SocketWithUser;
    const result = guard.verifyToken(mockClient);
    expect(result).toBe(true);
    expect(mockClient.data.user).toEqual(mockPayload);
  });

  it('должен выбрасывать исключение, если токен не предоставлен', () => {
    mockClient.handshake.query = {};
    expect(() => guard.verifyToken(mockClient)).toThrow(WsException);
    expect(() => guard.verifyToken(mockClient)).toThrow(
      'Требуется авторизация: JWT-токен не предоставлен.',
    );
  });

  it('должен выбрасывать исключение, если токен некорректен', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });
    mockClient.handshake.query = { token: 'invalid_token' };
    expect(() => guard.verifyToken(mockClient)).toThrow(WsException);
    expect(() => guard.verifyToken(mockClient)).toThrow('Некорректный JWT ');
    expect(jwtService.verify).toHaveBeenCalledWith('invalid_token', {
      secret: 'test_secret',
    });
  });
});
