import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateSkillDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Читать', description: 'Название навыка' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Умею читать книги', description: 'Описание навыка' })
  description: string;

  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    example: '3f2a1b4c-5d6e-7f8g-9h0i-1j2k3l4m5n6o',
    description: 'ID категории навыка',
  })
  category: string;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    example: ['image1.png', 'image2.png'],
    description: 'Ссылки на иконки',
  })
  images: string[];
}
