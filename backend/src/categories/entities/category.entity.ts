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
    example: '12345678-90ab-cd00-0000-f1752408d831',
    description: 'Уникальный идентификатор категории',
  })
  id?: string;

  @Column({
    length: 100,
    nullable: false,
  })
  @ApiProperty({
    example: 'Музыкальные инструменты',
    description: 'Название категории',
  })
  name: string;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @ApiProperty({
    nullable: true,
    type: () => Category,
    description: 'Родительская категория',
  })
  parent?: Category | null;

  @OneToMany(() => Category, (category) => category.parent, {
    cascade: ['insert'],
  })
  // @ApiProperty({
  //   type: () => [Category],
  //   description: 'Дочерние категории',
  //   example: [],
  // })
  children?: Category[];
}
