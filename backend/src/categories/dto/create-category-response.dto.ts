import { ApiProperty } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

export class CategoryResponseDto extends CreateCategoryDto {
  @ApiProperty({
    example: 'd6c5f4e8-1a90-4b1c-b3d2-6e7g8h9i0000',
    description: 'Уникальный идентификатор категории',
  })
  id: string;
}
