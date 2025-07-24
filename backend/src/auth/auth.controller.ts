import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.auth.dto';
import { AuthResponseDto } from './dto/AuthResponse.dto';
import { RefreshTokenGuard } from './guards/refreshToken.guard';
import { AccessTokenGuard } from './guards/accessToken.guard';
import { RegisterDto } from './dto/register.auth.dto';
import { AuthRequest } from './types';
import {
  ApiOperation,
  ApiBody,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Регистрация пользователя' })
  @ApiBody({
    description: 'Данные для регистрации пользователя',
    schema: {
      example: {
        name: 'Александр',
        email: 'alex@email.com',
        password: 'password',
        age: 27,
        city: 'Москва',
        aboutMe: 'Я',
        gender: 'Ж',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Успешная регистрация',
    type: AuthResponseDto,
  })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Авторизация пользователя',
    description: 'ЛОГИН И ПАРОЛЬ ДОЛЖНЫ БЫТЬ ТАКИМИ ЖЕ, КАК ПРИ РЕГИСТРАЦИИ',
  })
  @HttpCode(200)
  @ApiBody({
    description: 'Данные для авторизации',
    type: LoginDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Успешная авторизация',
    type: AuthResponseDto,
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @ApiBearerAuth('refresh-token')
  @ApiOperation({
    summary: 'Обновление токенов',
    description:
      'Используется для получения новых токенов доступа и обновления refresh токена',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешное обновление токенов',
    type: AuthResponseDto,
  })
  @HttpCode(200)
  refresh(@Req() req: AuthRequest) {
    return this.authService.refresh({
      id: req.user.sub,
      email: req.user.email,
      role: req.user.role,
    });
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Выход из системы',
    description: 'Удаляет refresh токен пользователя и завершает сессию',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный выход из системы',
    schema: {
      example: 'Пользователь успешно вышел из системы',
    },
  })
  @HttpCode(200)
  logout(@Req() req: AuthRequest) {
    return this.authService.logout(req.user.sub);
  }
}
