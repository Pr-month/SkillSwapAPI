import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @ApiProperty({
    example: 'Музыкальный инструменты',
    required: false,
    description: 'Название категории',
  })
  name?: string | undefined;

  @ApiProperty({
    required: false,
    nullable: true,
    type: String,
    example: '1',
    description: 'Id родительской категории',
  })
  parent?: string | undefined;

  @ApiProperty({
    required: false,
    type: () => [String],
    example: [],
    description: 'Id дочерних категорий',
  })
  children?: string[] | undefined;
}
