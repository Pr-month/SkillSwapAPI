import { PartialType } from '@nestjs/mapped-types';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { CreateUsersDto } from './create.users.dto';
import { ApiProperty } from '@nestjs/swagger';

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
}
