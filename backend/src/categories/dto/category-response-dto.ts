import { ApiProperty } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

export class CategoryResponseDto extends CreateCategoryDto {
  @ApiProperty({
    example: 'd6c5f4e8-1a90-4b1c-b3d2-6e7g8h9i0000',
    description: 'Уникальный идентификатор категории',
  })
  id: string;

  @ApiProperty({
    type: () => [ChildrenCategoryDto],
    description: 'Id дочерних категорий',
    required: false,
  })
  children?: ChildrenCategoryDto[];
}
class ChildrenCategoryDto {
  @ApiProperty({
    example: '80316101-cc6a-4bbd-a412-7ebaef2da1e8',
    description: 'ID дочерней категории',
    type: String,
  })
  id: string;

  @ApiProperty({
    example: 'Гитара',
    description: 'Название дочерней категории',
  })
  name: string;
}
