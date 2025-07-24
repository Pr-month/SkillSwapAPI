import { User } from '../entities/users.entity';

export class FindAllUsersResponseDto {
  data: Omit<User, 'password' | 'refreshToken'>[];

  page: number;

  totalPages: number;
}
