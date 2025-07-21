import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { UpdateUsersDto } from './dto/update.users.dto';
import { UsersService } from './users.service';
import { AuthRequest } from '../auth/types';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { User } from './entities/users.entity';
import { RoleGuard } from '../auth/guards/role-guard.guard';
import { FindAllUsersQueryDto } from './dto/find-all-users.dto';
import { FindAllUsersResponseDto } from './dto/find-all-users-response.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Получение всех пользователей' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: String,
    description: 'Номер страницы (строка с цифрами)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: String,
    description: 'Лимит на страницу (строка с цифрами)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Строка поиска по имени и email',
  })
  @ApiResponse({
    status: 200,
    description: 'Список пользователей с пагинацией',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(User) },
        },
        page: { type: 'number', example: 1 },
        totalPages: { type: 'number', example: 10 },
      },
    },
  })
  async findAll(
    @Query() query: FindAllUsersQueryDto,
  ): Promise<FindAllUsersResponseDto> {
    return this.usersService.findAll(query);
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

  @ApiBearerAuth('access-token')
  @UseGuards(AccessTokenGuard)
  @Patch('me')
  @ApiOperation({
    summary: 'Обновление данных текущего пользователя',
    description: 'ТОКЕН БЕРЁМ ИЗ ОТВЕТА ПРИ РЕГИСТРАЦИИ',
  })
  @ApiBody({
    type: UpdateUsersDto,
    description: 'Данные для обновления пользователя',
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

  @ApiBearerAuth('access-token')
  @UseGuards(AccessTokenGuard, RoleGuard)
  @Delete(':id')
  @ApiOperation({
    summary: 'Удаление пользователя по ID',
    description: 'Удалить пользователя может только админ',
  })
  @ApiParam({
    name: 'id',
    description: 'Уникальный идентификатор пользователя для тестовой базы',
    example: 'e59c23dc-b405-4eae-9bae-c8e3a2078d44',
  })
  @ApiResponse({
    status: 200,
    description: 'Сообщение об удалении пользователя',
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
