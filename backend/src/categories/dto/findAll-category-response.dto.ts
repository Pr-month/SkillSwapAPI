import { ApiProperty, PickType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

export class FindALLCategoryResponseDto extends PickType(CreateCategoryDto, ['name', 'children']) {
  @ApiProperty({
    example: 'd6c5f4e8-1a90-4b1c-b3d2-6e7g8h9i0000',
    description: 'Уникальный идентификатор категории'
  })
  id: string;
}
