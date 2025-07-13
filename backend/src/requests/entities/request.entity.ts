import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/entities/users.entity';
import { Skill } from 'src/skills/entities/skill.entity';
import { RequestStatus } from '../enums';

@Entity()
export class Request {
  @PrimaryGeneratedColumn('uuid') // Используем UUID для id, как в User
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    description: 'Уникальный идентификатор заявки',
  })
  id: string;

  @CreateDateColumn()
  @ApiProperty({
    example: '2024-06-24T12:00:00.000Z',
    description: 'Время создания заявки',
  })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({
    example: '2024-07-24T12:00:00.000Z',
    description: 'Время обновления заявки',
  })
  updatedAt: Date;

  // Связь с User (отправитель)

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @ApiProperty({
    type: () => User,
    description: 'Пользователь, создавший заявку (отправитель)',
  })
  sender: User;

  // Связь с User (получатель)

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @ApiProperty({
    type: () => User,
    description: 'Пользователь, которому предложили (получатель)',
  })
  receiver: User;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING, // Статус по умолчанию при создании
  })
  @ApiProperty({
    example: RequestStatus.PENDING,
    enum: RequestStatus,
    description: 'Статус заявки',
  })
  status: RequestStatus;

  @ManyToOne(() => Skill, { nullable: false, onDelete: 'RESTRICT' }) // Навык, который предлагает отправитель
  @ApiProperty({
    type: () => Skill,
    description: 'Навык, который предлагает отправитель',
  })
  offeredSkill: Skill;

  @ManyToOne(() => Skill, { nullable: false, onDelete: 'RESTRICT' }) // Навык, который отправитель хочет получить
  @ApiProperty({
    type: () => Skill,
    description: 'Навык, который отправитель хочет получить',
  })
  requestedSkill: Skill;

  @Column({ default: false }) // Прочитана ли получателем
  @ApiProperty({
    example: false,
    description: 'Прочитана ли заявка получателем',
  })
  isRead: boolean;
}
