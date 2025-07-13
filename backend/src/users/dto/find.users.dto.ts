import { PartialType } from '@nestjs/mapped-types';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { User } from '../entities/users.entity';
import { Gender, UserRole } from '../enums';
import { Skill } from 'src/skills/entities/skill.entity';

// DTO для создания пользователя при передачи данных через API
export class FindUserDTO extends PartialType(User) {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @Min(10)
  @Max(100)
  age: number;

  @IsString()
  city: string;

  @IsString()
  aboutMe: string;

  @IsEnum(Gender)
  gender: Gender;

  skills: Skill[];

  favoriteSkills: Skill[];

  role: UserRole;
}
