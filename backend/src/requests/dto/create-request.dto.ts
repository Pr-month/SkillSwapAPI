import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Request } from '../entities/request.entity';

// DTO для создания заявки
export class CreateRequestDto extends PartialType(Request) {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    description: 'Уникальный идентификатор предлагаемого навыка',
  })
  offeredSkillId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    description: 'Уникальный идентификатор предлагаемого навыка',
  })
  requestedSkillId: string;
}
