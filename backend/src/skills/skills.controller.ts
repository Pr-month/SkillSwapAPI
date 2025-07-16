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
} from '@nestjs/swagger';
import { ResponseSkillDto } from './dto/response-skill.dto';

@Controller('skills')
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
    example: 'гитара',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Список навыков',
    schema: {
      example: {
        data: [
          {
            id: '1e3a912b-72d5-4857-82ba-af32f5fbb797',
            title: 'Гитара',
            description: 'Умею играть на гитаре',
            category: {
              id: 'eef411af-86d5-46b1-bbe7-91f6d35ad7fc',
              name: 'Гитара',
            },
            images: [
              'https://loremflickr.com/1674/1791?lock=8857178983692165',
              'https://loremflickr.com/85/3926?lock=1178754522388319',
              'https://picsum.photos/seed/bb7OegHjS/956/2321',
            ],
            owner: {
              id: 'e1961192-5aa9-4616-8234-ff290e9ef066',
              name: 'Екатерина',
              email: 'ekaterina@example.com',
              age: 37,
              city: 'Екатеринбург',
              aboutMe: 'О себе',
              gender: 'Ж',
              role: 'user',
            },
          },
        ],
        page: 1,
        totalPages: 1,
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
    schema: {
      example: {
        title: 'Читать',
        description: 'Умею читать книги',
        category: {
          id: '3f2a1b4c-5d6e-7f8g-9h0i-1j2k3l4m5n6o',
        },
        images: ['image1.png', 'image2.png'],
        owner: {
          id: '985b2def-496c-4cef-afca-cc2e912bdb6b',
        },
        message: 'Навык создан',
        id: '5f185cd4-d025-4bfd-ac84-5315b911c859',
      },
    },
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
