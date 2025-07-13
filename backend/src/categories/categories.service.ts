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
    const { parent, children } = createCategoryDto;
    return await this.categoryRepository.save({
      ...createCategoryDto,
      parent: parent ? { id: parent } : undefined,
      children: children.length > 0 ? children.map((id) => ({ id })) : [],
    });
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { parent: IsNull() },
      relations: ['children'],
    });
  }

  findOne(id: string) {
    return `This action returns a #${id} category`;
  }

  update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return `This action updates a #${id} category: ${updateCategoryDto?.name}`;
  }

  async remove(id: string) {
    await this.categoryRepository.delete(id);
    return `This action removes a #${id} category`;
  }
}
