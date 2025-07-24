import {
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
    example: 'Музыкальные инструменты',
    description: 'Название категории',
  })
  name: string;

  @IsOptional()
  @IsUUID()
  @ApiProperty({
    required: false,
    type: String,
    example: '80316101-cc6a-4bbd-a412-7ebaef2da1e8',
    description: 'Id родительской категории',
  })
  parent?: string | null;
}
