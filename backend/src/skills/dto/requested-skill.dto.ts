import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/entities/users.entity';

export class RequestedSkillDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    description: 'Уникальный идентификатор навыка',
  })
  id: string;

  @ApiProperty({
    example: 'Писать',
    description: 'Название навыка',
  })
  title: string;

  @ApiProperty({
    example: 'Умею писать книги',
    description: 'Описание навыка',
  })
  description: string;

  @ApiProperty({
    example: ['image1.jpg', 'image2.jpg'],
    description: 'Изображения, связанные с навыком',
  })
  images: string[];

  @ApiProperty({
    type: User,
    description: 'Владелец навыка',
  })
  owner: User;
}
