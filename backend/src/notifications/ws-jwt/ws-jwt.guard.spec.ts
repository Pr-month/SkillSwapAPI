import { JwtService } from '@nestjs/jwt';
import { IConfig } from 'src/config/configuration';
import { JwtWsGuard } from './ws-jwt.guard';
//todo
describe('AccessTokenGuard', () => {
  const jwtService = {
    verify: jest.fn(),
  };

  const configService: Pick<IConfig, 'jwt'> = {
    jwt: {
      accessTokenSecret: 'test_secret',
      refreshTokenSecret: '',
      accessTokenSecretExpiresIn: '',
      refreshTokenExpiresIn: '',
    },
  };

  const guard = new JwtWsGuard(
    jwtService as unknown as JwtService,
    configService,
  );
  it('должен быть определен', () => {
    expect(guard).toBeDefined();
  });
});
