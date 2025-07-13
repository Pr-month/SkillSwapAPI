import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { Category } from '../../categories/entities/category.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

@Entity()
export class Skill {
  @IsUUID()
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    example: '26ef3ca3-3bef-409a-85ec-a14e31f5870c',
    description: 'Уникальный идентификатор навыка',
  })
  id: string;

  @Column()
  @ApiProperty({ example: 'Читать', description: 'Название навыка' })
  title: string;

  @Column({ nullable: true, type: 'text' })
  @ApiProperty({ example: 'Умею читать книги', description: 'Описание навыка' })
  description: string;

  @ManyToOne(() => Category, { nullable: false })
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
  owner: User;
}
