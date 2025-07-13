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
  category: string;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    example: ['image1.png', 'image2.png'],
    description: 'Ссылки на иконки',
  })
  images: string[];
}
