import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const { parent, ...rest } = createCategoryDto;

    const category = this.categoryRepository.create({
      ...rest,
      parent: parent ? { id: parent } : null,
    });
    return await this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { parent: IsNull() },
      relations: ['children'],
    });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryRepository.findOneOrFail({
      where: { id: id },
      relations: ['parent', 'children'],
    });

    if (updateCategoryDto.name !== undefined) {
      category.name = updateCategoryDto.name;
    }

    if (updateCategoryDto.parent !== undefined) {
      category.parent = updateCategoryDto.parent
        ? ({ id: updateCategoryDto.parent } as Category)
        : null;
    }

    return this.categoryRepository.save(category);
  }

  async remove(id: string) {
    await this.categoryRepository.delete(id);
    return { message: `Категория с id ${id} удалена` };
  }
}
