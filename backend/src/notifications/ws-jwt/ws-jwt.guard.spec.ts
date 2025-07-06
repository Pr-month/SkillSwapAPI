import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtWsGuard } from './ws-jwt.guard';

describe('AccessTokenGuard', () => {
  const jwtService = {
    verify: jest.fn(),
  };

  const configService = {
    get: jest.fn().mockReturnValue('test_secret'),
  };

  const guard = new JwtWsGuard(
    jwtService as unknown as JwtService,
    configService as unknown as ConfigService,
  );
  it('должен быть определен', () => {
    expect(guard).toBeDefined();
  });
});
