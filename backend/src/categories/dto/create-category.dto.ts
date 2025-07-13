import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({
    example: 'Музыкальный инструменты',
    description: 'Название категории',
  })
  name: string;

  @IsOptional()
  @IsUUID()
  @ApiProperty({
    nullable: true,
    type: String,
    example: '1',
    description: 'Id родительской категории',
  })
  parent?: string;

  @IsArray()
  @IsUUID('all', { each: true })
  @ApiProperty({
    type: () => [String],
    example: [],
    description: 'Id дочерних категорий',
  })
  children: string[];
}
