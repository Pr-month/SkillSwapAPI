import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  HttpCode,
  UseInterceptors,
} from '@nestjs/common';
import { FindSkillsQueryDto } from './dto/find-skill.dto';
import { SkillsService } from './skills.service';
import { UsersService } from 'src/users/users.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { AccessTokenGuard } from 'src/auth/guards/accessToken.guard';
import { AuthRequest } from 'src/auth/types';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiParam,
  getSchemaPath,
} from '@nestjs/swagger';
import { Skill } from './entities/skill.entity';
import { UserPasswordFilter } from '../common/userPassword.filter';

@Controller('skills')
@UseInterceptors(UserPasswordFilter)
export class SkillsController {
  constructor(
    private readonly skillsService: SkillsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получение навыков' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Номер страницы для пагинации',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Количество навыков на странице',
    example: 20,
    type: Number,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Поиск по названию навыка',
    example: 'Читать',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Список навыков',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            $ref: getSchemaPath(ResponseSkillDto),
          },
        },
        page: {
          type: 'number',
          example: 1,
        },
        totalPages: {
          type: 'number',
          example: 5,
        },
      },
    },
  })
  find(@Query() query: FindSkillsQueryDto) {
    return this.skillsService.find(query);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Добавление навыка для авторизованного пользователя',
    description: 'берём access-token',
  })
  @ApiBody({ type: CreateSkillDto })
  @ApiResponse({
    status: 201,
    description: 'Успешное создание навыка',
    type: ResponseSkillWithMessageDto,
  })
  @UseGuards(AccessTokenGuard)
  @Post()
  create(@Req() req: AuthRequest, @Body() createSkillDto: CreateSkillDto) {
    return this.skillsService.create(req.user.sub, createSkillDto);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Обновление навыка авторизованного пользователя',
    description: 'Поиск по ID навыка',
  })
  @ApiParam({
    name: 'id',
    description: 'ID навыка',
    example: '26ef3ca3-3bef-409a-85ec-a14e31f5870c',
  })
  @ApiBody({ type: UpdateSkillDto })
  @ApiResponse({
    status: 200,
    description: 'Успешное обновление навыка',
    type: ResponseSkillDto,
  })
  @UseGuards(AccessTokenGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body() updateSkillDto: UpdateSkillDto,
  ) {
    return this.skillsService.update(req.user.sub, id, updateSkillDto);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Удаление навыка авторизованного пользователя',
    description: 'Поиск по ID навыка',
  })
  @ApiParam({
    name: 'id',
    description: 'ID навыка',
    example: '26ef3ca3-3bef-409a-85ec-a14e31f5870c',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        message:
          'Навык с id 26ef3ca3-3bef-409a-85ec-a14e31f5870c удалён у пользователя',
      },
    },
  })
  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.skillsService.remove(id, req.user.sub);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AccessTokenGuard)
  @Post('favorite/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Добавить навык в избранное' })
  @ApiParam({
    name: 'id',
    description: 'ID навыка',
    example: '26ef3ca3-3bef-409a-85ec-a14e31f5870c',
  })
  @ApiResponse({
    status: 200,
    description: 'Навык добавлен в избранное',
    schema: {
      example: {
        message: 'Навык добавлен в избранное',
      },
    },
  })
  async addFavorite(@Req() req: AuthRequest, @Param('id') skillId: string) {
    return this.usersService.addFavoriteSkill(req.user.sub, skillId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AccessTokenGuard)
  @Delete('favorite/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Удалить навык из избранного' })
  @ApiParam({
    name: 'id',
    description: 'ID навыка',
    example: '26ef3ca3-3bef-409a-85ec-a14e31f5870c',
  })
  @ApiResponse({
    status: 200,
    description: 'Навык удалён из избранного',
    schema: {
      example: {
        message: 'Навык удалён из избранного',
      },
    },
  })
  async removeFavorite(@Req() req: AuthRequest, @Param('id') skillId: string) {
    return this.usersService.removeFavoriteSkill(req.user.sub, skillId);
  }
}
