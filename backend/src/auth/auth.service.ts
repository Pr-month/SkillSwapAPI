import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.auth.dto';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.auth.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly saltRounds: number;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.saltRounds = this.configService.get<number>('salt') as number;
  }

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      this.saltRounds,
    );
    const id = uuidv4();
    const tokens = await this._getTokens({
      id,
      email: registerDto.email,
    });
    const hashedRefreshToken = await bcrypt.hash(
      tokens.refreshToken,
      this.saltRounds,
    );
    const newUser = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      id,
      refreshToken: hashedRefreshToken,
    });
    return {
      message: 'Регистрация прошла успешно',
      user: newUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    const passwordMatch = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!passwordMatch) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    return await this.refresh({
      message: 'Авторизация прошла успешно',
      id: user.id as string,
      email: user.email,
      role: user.role,
    });
  }

  async refresh(user: {
    id: string;
    email: string;
    role?: string;
    message?: string;
  }) {
    const tokens = await this._getTokens(user);
    const hashedRefreshToken = await bcrypt.hash(
      tokens.refreshToken,
      this.saltRounds,
    );
    const updatedUser = await this.usersService.updateUser(user.id, {
      refreshToken: hashedRefreshToken,
    });
    return {
      message: user.message || 'Рефреш токена прошёл успешно',
      ...tokens,
      user: updatedUser,
    };
  }

  async logout(id: string) {
    await this.usersService.removeRefreshToken(id);
    return 'Пользователь успешно вышел из системы';
  }

  async _getTokens(user: { id: string; email: string; role?: string }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role || 'user',
    };
    const accessToken = await this.jwtService.signAsync(payload);

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.refreshTokenSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshTokenExpiresIn'),
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
