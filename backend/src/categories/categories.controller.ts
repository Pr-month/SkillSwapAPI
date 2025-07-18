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
// import { UpdateCategoryDto } from './dto/update-category.dto';
import { AccessTokenGuard } from 'src/auth/guards/accessToken.guard';
import { RoleGuard } from 'src/auth/guards/role-guard.guard';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @UseGuards(AccessTokenGuard, RoleGuard)
  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @UseGuards(AccessTokenGuard, RoleGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @UseGuards(AccessTokenGuard, RoleGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
