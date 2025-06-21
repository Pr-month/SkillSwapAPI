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

//Данные пользователя для базы
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  age: number;

  @Column()
  city: string;

  //о себе
  @Column()
  aboutMe: string;

  @Column({
    type: 'enum',
    enum: Gender,
  })
  gender: Gender;

  // Навыки, созданные пользователем
  @OneToMany(() => Skill, (skill) => skill.owner)
  skills: Skill[];

  // //отдельный entity для категорий
  // @Column()
  // wantToLearn: string;

  // Навыки, добавленные в избранное
  @ManyToMany(() => Skill, { eager: true })
  @JoinTable()
  favoriteSkills: Skill[];

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ 
    type: 'varchar', 
    length: 255, 
    nullable: true,
    default: null,
  })
  refreshToken: string | null;
}
