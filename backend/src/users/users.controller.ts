import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { FindUserDTO } from './dto/find.users.dto';
import { UpdateUsersDto } from './dto/update.users.dto';
import { UsersService } from './users.service';
import { AuthRequest } from '../auth/types';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { User } from './entities/users.entity';

//Создание точки входа для работы с пользователями
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Получение всех пользователей' })
  @ApiResponse({
    status: 200,
    description: 'Список пользователей',
    type: User,
    isArray: true,
  })
  findAll(): Promise<FindUserDTO[]> {
    return this.usersService.findAll();
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AccessTokenGuard)
  @Get('me')
  @ApiOperation({
    summary: 'Получение текущего пользователя',
    description: 'ТОКЕН БЕРЁМ ИЗ ОТВЕТА ПРИ РЕГИСТРАЦИИ',
  })
  @ApiResponse({
    status: 200,
    description: 'Данные текущего пользователя',
    type: User,
  })
  findCurrentUser(@Req() req: AuthRequest) {
    return this.usersService.findOne(req.user.sub);
  }

  @UseGuards(AccessTokenGuard)
  @Get('test')
  testUser(@Req() req: AuthRequest) {
    return this.usersService.testfindOne(req.user.sub);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AccessTokenGuard)
  @Patch('me')
  @ApiOperation({
    summary: 'Обновление данных текущего пользователя',
    description: 'ТОКЕН БЕРЁМ ИЗ ОТВЕТА ПРИ РЕГИСТРАЦИИ',
  })
  @ApiResponse({
    status: 200,
    description: 'Данные текущего пользователя',
    type: User,
  })
  updateUser(@Req() req: AuthRequest, @Body() updateUserDto: UpdateUsersDto) {
    return this.usersService.updateUser(req.user.sub, updateUserDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AccessTokenGuard)
  @Patch('me/password')
  @ApiOperation({
    summary: 'Обновление пароля текущего пользователя',
    description: 'ТОКЕН БЕРЁМ ИЗ ОТВЕТА ПРИ РЕГИСТРАЦИИ',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        password: {
          type: 'string',
          example: 'newPassword',
          description: 'Новый пароль пользователя',
        },
      },
      required: ['password'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Данные текущего пользователя',
    type: User,
  })
  updatePassword(@Req() req: AuthRequest, @Body('password') password: string) {
    return this.usersService.updatePassword(req.user.sub, password);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получение пользователя по ID',
    description: 'ID берём из GET/users',
  })
  @ApiParam({
    name: 'id',
    description: 'Уникальный идентификатор пользователя для тестовой базы',
    example: 'e59c23dc-b405-4eae-9bae-c8e3a2078d44',
  })
  @ApiResponse({
    status: 200,
    description: 'Данные пользователя',
    type: User,
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Удаление пользователя по ID',
    description: 'ID берём из GET/users',
  })
  @ApiParam({
    name: 'id',
    description: 'Уникальный идентификатор пользователя для тестовой базы',
    example: 'e59c23dc-b405-4eae-9bae-c8e3a2078d44',
  })
  @ApiResponse({
    status: 200,
    description: 'Данные пользователя',
    schema: {
      example: {
        message:
          'Пользователь с id e59c23dc-b405-4eae-9bae-c8e3a2078d44 удалён',
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
