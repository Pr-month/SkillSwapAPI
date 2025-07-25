import {
  Controller,
  Get,
  Post,
  Body,
  // Patch,
  Param,
  Delete,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { AccessTokenGuard } from 'src/auth/guards/accessToken.guard';
import { RoleGuard } from 'src/auth/guards/role-guard.guard';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CategoryResponseDto } from './dto/category-response-dto';
import { FindALLCategoryResponseDto } from './dto/find-all-category-response-dto';
import { CreateCategoryResponseDto } from './dto/create-category-response.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Создание категории',
    description: 'Создать категорию может только админ',
  })
  @ApiBody({
    type: CreateCategoryDto,
    description: 'Указание parent не обязательно',
  })
  @ApiResponse({
    status: 201,
    description: 'Созданная категория',
    type: CreateCategoryResponseDto,
  })
  @UseGuards(AccessTokenGuard, RoleGuard)
  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @ApiOperation({
    summary: 'Получение всех категорий',
  })
  @ApiResponse({
    status: 200,
    description: 'Список всех категорий',
    type: FindALLCategoryResponseDto,
    isArray: true,
  })
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Обновление категории',
    description: 'Обновить категорию может только админ',
  })
  @ApiBody({
    type: UpdateCategoryDto,
    description: 'Для обновления указываются поля что и при создании',
  })
  @ApiParam({
    name: 'id',
    description: 'id категории, которую нужно обновить',
    example: 'd6c5f4e8-1a90-4b1c-b3d2-6e7g8h9i0000',
  })
  @ApiResponse({
    status: 200,
    description: 'Обновленная категория',
    type: CategoryResponseDto,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AccessTokenGuard, RoleGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Удаление категории',
    description: 'Удалить категорию может только админ',
  })
  @ApiParam({
    name: 'id',
    description: 'id категории, которую нужно удалить',
    example: 'd6c5f4e8-1a90-4b1c-b3d2-6e7g8h9i0000',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        message: 'Категория с id d6c5f4e8-1a90-4b1c-b3d2-6e7g8h9i0000 удалена',
      },
    },
  })
  @UseGuards(AccessTokenGuard, RoleGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
