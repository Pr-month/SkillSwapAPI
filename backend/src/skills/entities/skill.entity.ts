import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { Category } from '../../categories/entities/category.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

@Entity()
export class Skill {
  @Column()
  @ApiProperty({ example: 'Читать', description: 'Название навыка' })
  title: string;

  @Column({ nullable: true, type: 'text' })
  @ApiProperty({ example: 'Умею читать книги', description: 'Описание навыка' })
  description: string;

  @ManyToOne(() => Category, { eager: true })
  @ApiProperty({
    example: { id: '20f7fcd7-c12d-4a5d-8fba-d2bd9a137108' },
    description: 'id выбранной категории для навыка',
  })
  category: Category;

  @Column('text', { array: true, nullable: true })
  @ApiProperty({
    example: ['image1.png', 'image2.png'],
    description: 'Ссылки на иконки',
  })
  images: string[];

  @ManyToOne(() => User, (user) => user.skills, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @ApiProperty({
    type: () => User,
    example: { id: '20f7fcd7-c12d-4a5d-8fba-d2bd9a137108' },
    description: 'id пользователя',
  })
  owner: User;

  @IsUUID()
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    example: '26ef3ca3-3bef-409a-85ec-a14e31f5870c',
    description: 'Уникальный идентификатор навыка',
  })
  id: string;
}
