import { ApiProperty } from '@nestjs/swagger';

export class SkillOwnerDto {
  @ApiProperty({
    example: '92230a55-a6e5-4c97-9ccf-31718e2adec3',
    description: 'Уникальный идентификатор пользователя',
  })
  id: string;

  @ApiProperty({ example: 'alex', description: 'Имя пользователя' })
  name: string;

  @ApiProperty({
    example: 'alex@example.com',
    description: 'Email пользователя',
  })
  email: string;

  @ApiProperty({ example: 30, description: 'Возраст пользователя' })
  age: number;

  @ApiProperty({ example: 'New York', description: 'Город пользователя' })
  city: string;

  @ApiProperty({ example: 'О себе', description: 'Информация о пользователе' })
  aboutMe: string;

  @ApiProperty({ example: 'М', description: 'Пол пользователя' })
  gender: string;

  @ApiProperty({
    example: [],
    description: 'Список навыков пользователя',
  })
  favoriteSkills: {
    id: string;
    title: string;
    description: string;
    images: string[];
  }[];
  @ApiProperty({ example: 'user', description: 'Роль пользователя' })
  role: string;
}

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
    type: SkillOwnerDto,
    description: 'Владелец навыка',
  })
  owner: SkillOwnerDto;
}
