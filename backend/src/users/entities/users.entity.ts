import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Skill } from '../../skills/entities/skill.entity';
import { Gender, UserRole } from '../enums';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

//Данные пользователя для базы
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    example: 1,
    description: 'Уникальный идентификатор пользователя',
  })
  id?: string;

  @Column({ length: 100 })
  @ApiProperty({ example: 'alex', description: 'Имя пользователя' })
  name: string;

  @Column({ unique: true })
  @ApiProperty({
    example: 'alex@example.com',
    description: 'Email пользователя',
  })
  email: string;

  @Column()
  password: string;

  @Column()
  @ApiProperty({ example: 30, description: 'Возраст' })
  age: number;

  @Column()
  @ApiProperty({ example: 'New York', description: 'Город' })
  city: string;

  //о себе
  @Column()
  @ApiProperty({ example: 'О себе', description: 'Информация о себе' })
  aboutMe?: string;

  @Column({
    type: 'enum',
    enum: Gender,
  })
  @ApiProperty({ example: Gender.MALE, enum: Gender, description: 'Пол' })
  gender: Gender;

  // Навыки, созданные пользователем
  @OneToMany(() => Skill, (skill) => skill.owner)
  @ApiProperty({ type: () => [Skill], description: 'Навыки пользователя' })
  skills: Skill[];

  // //отдельный entity для категорий
  // @Column()
  // wantToLearn: string;

  // Навыки, добавленные в избранное
  @ManyToMany(() => Skill, { eager: true })
  @JoinTable()
  @ApiProperty({
    type: () => [Skill],
    description: 'Избранные навыки пользователя',
    example: [
      { id: 'uuid', title: 'Название', description: 'Описание', images: [] },
    ],
  })
  favoriteSkills?: Skill[];

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  @ApiProperty({
    example: UserRole.USER,
    enum: UserRole,
    description: 'Роль пользователя',
  })
  role: UserRole;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    default: null,
  })
  refreshToken?: string | null;
}
