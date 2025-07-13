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
import { Gender } from '../enums';
import { ApiProperty } from '@nestjs/swagger';

// DTO для создания пользователя при передачи данных через API
export class CreateUsersDto extends PartialType(User) {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
    description: 'Уникальный идентификатор пользователя',
  })
  id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'alex', description: 'Имя пользователя' })
  name: string;

  @IsEmail()
  @ApiProperty({
    example: 'alex@example.com',
    description: 'Email пользователя',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'qwert', description: 'Пароль' })
  password: string;

  @Min(10)
  @Max(100)
  @ApiProperty({ example: 30, description: 'Возраст' })
  age: number;

  @IsString()
  @ApiProperty({ example: 'New York', description: 'Город' })
  city: string;

  @IsString()
  @ApiProperty({ example: 'О себе', description: 'Информация о себе' })
  aboutMe: string;

  @IsEnum(Gender)
  @ApiProperty({ example: Gender.MALE, enum: Gender, description: 'Пол' })
  gender: Gender;

  @IsString()
  @ApiProperty({ example: 'refresh_token_value', description: 'Refresh Token' })
  refreshToken: string;
}
