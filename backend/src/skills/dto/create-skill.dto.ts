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
    example: '20f7fcd7-c12d-4a5d-8fba-d2bd9a137108',
    description: 'id выбранной категори для навыка',
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
