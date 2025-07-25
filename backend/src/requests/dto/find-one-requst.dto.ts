import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/entities/users.entity';
import { RequestStatus } from '../enums';

export class FindOneRequestDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    description: 'Уникальный идентификатор заявки',
  })
  id: string;

  @ApiProperty({
    example: '2024-06-24T12:00:00.000Z',
    description: 'Время создания заявки',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-07-24T12:00:00.000Z',
    description: 'Время обновления заявки',
  })
  updatedAt: Date;

  @ApiProperty({
    type: () => User,
    description: 'Пользователь, создавший заявку (отправитель)',
  })
  sender: User;

  @ApiProperty({
    type: () => User,
    description: 'Пользователь, которому предложили (получатель)',
  })
  receiver: User;

  @ApiProperty({
    example: RequestStatus.PENDING,
    enum: RequestStatus,
    description: 'Статус заявки',
  })
  status: RequestStatus;

  @ApiProperty({
    example: false,
    description: 'Прочитана ли заявка получателем',
  })
  isRead: boolean;
}
