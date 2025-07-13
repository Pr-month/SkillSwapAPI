import { PickType } from '@nestjs/mapped-types';
import { CreateUsersDto } from 'src/users/dto/create.users.dto';

export class RegisterDto extends PickType(CreateUsersDto, [
  'name',
  'email',
  'password',
  'age',
  'city',
  'aboutMe',
  'gender',
] as const) {}
