import { PartialType } from '@nestjs/mapped-types';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { CreateUsersDto } from './create.users.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '../enums';

export class UpdateUsersDto extends PartialType(CreateUsersDto) {
  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'alex', description: 'Имя пользователя' })
  name?: string;

  @IsOptional()
  @IsEmail()
  @ApiProperty({
    example: 'alex@example.com',
    description: 'Email пользователя',
  })
  email?: string;

  @IsOptional()
  @Min(10)
  @Max(100)
  @ApiProperty({ example: 30, description: 'Возраст' })
  age?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'New York', description: 'Город' })
  city?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'О себе', description: 'Информация о себе' })
  aboutMe?: string;

  @IsOptional()
  @IsEnum(Gender)
  @ApiProperty({ example: Gender.MALE, enum: Gender, description: 'Пол' })
  gender?: Gender;
}
