import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    example: '1',
    description: 'Уникальный идентификатор категории',
  })
  id: string;

  @Column({ length: 100 })
  @ApiProperty({
    example: 'Музыкальный инструменты',
    description: 'Название категории',
  })
  name: string;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @ApiProperty({
    nullable: true,
    type: () => Category,
    description: 'Родительская категория',
  })
  parent: Category;

  @OneToMany(() => Category, (category) => category.parent)
  @ApiProperty({
    type: () => [Category],
    description: 'Дочерние категории',
    example: [],
  })
  children: Category[];
}
