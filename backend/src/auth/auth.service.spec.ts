import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Gender, UserRole } from '../users/enums';
import { RegisterDto } from './dto/register.auth.dto';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    create: jest.Mock;
    findByEmail: jest.Mock;
    updateUser: jest.Mock;
    removeRefreshToken: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };
  let configService: {
    get: jest.Mock<10 | 'refresh-secret' | '7d' | undefined, [string]>;
  };

  const user = {
    id: '11111',
    email: 'test@email.com',
    password: 'пароль',
    name: 'Иван',
    age: 30,
    city: 'Москва',
    aboutMe: 'Обо мне',
    gender: Gender.MALE,
    skills: [],
    favoriteSkills: [],
    role: UserRole.USER,
    refreshToken: 'токен обновления',
  };

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      updateUser: jest.fn(),
      removeRefreshToken: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('это подписанный токен'),
    };
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'salt') return 10;
        if (key === 'jwt.refreshTokenSecret') return 'refresh-secret';
        if (key === 'jwt.refreshTokenExpiresIn') return '7d';
        return undefined;
      }),
    };
    (bcrypt.hash as jest.Mock).mockImplementation((data) => `hashed-${data}`);
    (bcrypt.compare as jest.Mock).mockImplementation(
      (a, b) => a === 'password' && b === 'пароль',
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('успешно создаётся', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('успешная регистрация', async () => {
      usersService.create.mockResolvedValue({ ...user });
      const dto: RegisterDto = { ...user };
      const result = await service.register(dto);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken', 'это подписанный токен');
      expect(result).toHaveProperty('refreshToken', 'это подписанный токен');
      expect(usersService.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('успешный логин', async () => {
      usersService.findByEmail.mockResolvedValue(user);
      jest.spyOn(service, 'refresh').mockResolvedValue({
        message: 'ok',
        accessToken: 'это подписанный токен',
        refreshToken: 'это подписанный токен',
        user,
      });
      const dto = { email: user.email, password: 'password' };
      const result = await service.login(dto);
      expect(result).toHaveProperty('accessToken');
      expect(usersService.findByEmail).toHaveBeenCalledWith(user.email);
    });

    it('ошибка если пользователь не найден', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'notfound', password: 'password' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('ошибка если пароль неверный', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...user,
        password: 'пароль',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(
        service.login({ email: user.email, password: 'не правильный пароль' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('успешный refresh', async () => {
      usersService.updateUser.mockResolvedValue(user);
      const result = await service.refresh({ id: user.id, email: user.email });
      expect(result).toHaveProperty('accessToken', 'это подписанный токен');
      expect(result).toHaveProperty('refreshToken', 'это подписанный токен');
      expect(result).toHaveProperty('user');
      expect(usersService.updateUser).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({ refreshToken: expect.any(String) as string }),
      );
    });
  });

  describe('logout', () => {
    it('успешный выход', async () => {
      usersService.removeRefreshToken.mockResolvedValue(undefined);
      const result = await service.logout(user.id);
      expect(result).toBe('Пользователь успешно вышел из системы');
      expect(usersService.removeRefreshToken).toHaveBeenCalledWith(user.id);
    });
  });
});
