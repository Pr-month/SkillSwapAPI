import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    example: '12345678-90ab-cd00-0000-f1752408d831',
    description: 'Уникальный идентификатор',
  })
  id?: string;

  @Column({
    length: 100,
    nullable: false,
  })
  @ApiProperty({
    example: 'Барабаны',
    description: 'Название категории',
  })
  name: string;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  parent?: Category | null;

  @OneToMany(() => Category, (category) => category.parent, {
    cascade: true,
  })
  children?: Category[];
}
