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
  ApiResponse,
} from '@nestjs/swagger';
import { Skill } from './entities/skill.entity';

@Controller('skills')
export class SkillsController {
  constructor(
    private readonly skillsService: SkillsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получение всех навыков' })
  @ApiResponse({
    status: 200,
    description: 'Список всех навыков',
    type: Skill,
    isArray: true,
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
    description: 'Успешная регистрация',
    type: CreateSkillDto,
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
  @ApiBody({ type: UpdateSkillDto })
  @ApiResponse({
    status: 200,
    description: 'Успех обновление навыка',
    type: Skill,
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
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        message:
          'Навык id d0d94783-2831-45fe-88f8-b53029f45704 удалён у пользователя',
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
  @ApiResponse({ status: 200, description: 'Навык добавлен в избранное' })
  async addFavorite(@Req() req: AuthRequest, @Param('id') skillId: string) {
    return this.usersService.addFavoriteSkill(req.user.sub, skillId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AccessTokenGuard)
  @Delete('favorite/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Удалить навык из избранное' })
  @ApiResponse({ status: 200, description: 'Навык удалён из избранного' })
  async removeFavorite(@Req() req: AuthRequest, @Param('id') skillId: string) {
    return this.usersService.removeFavoriteSkill(req.user.sub, skillId);
  }
}
