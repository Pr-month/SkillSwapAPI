import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/entities/users.entity';

export class AuthResponseDto extends PartialType(User) {
  @ApiProperty()
  message: string;

  @ApiProperty({ type: User })
  user: User;

  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}
