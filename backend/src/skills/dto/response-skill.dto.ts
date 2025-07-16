import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { User } from '../../users/entities/users.entity';

export class ResponseSkillDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    example: '26ef3ca3-3bef-409a-85ec-a14e31f5870c',
    description: 'Уникальный идентификатор навыка',
  })
  id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Читать', description: 'Название навыка' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Умею читать книги', description: 'Описание навыка' })
  description: string;

  @IsNotEmpty()
  @ApiProperty({
    example: {
      id: 'eef411af-86d5-46b1-bbe7-91f6d35ad7fc',
      name: 'Искусство',
      parent: {
        id: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
        name: 'Творчество',
      },
    },
    description: 'Категория навыка',
  })
  category: {
    id: string;
    name: string;
    parent: {
      id: string;
      name: string;
    };
  };

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    example: ['image1.png', 'image2.png'],
    description: 'Ссылки на иконки',
  })
  images: string[];

  @ApiProperty({
    description: 'Владелец навыка',
    nullable: true,
    type: () => User,
  })
  owner: User | null;
}
