import { Gender, UserRole } from '../users/enums';
import { User } from '../users/entities/users.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export const users: Array<User> = [
  {
    name: process.env.APP_ADMIN_USERNAME || 'admin',
    email: process.env.APP_ADMIN_EMAIL || 'admin@mail.com',
    password: process.env.APP_ADMIN_PASSWORD || 'admin',
    age: 30,
    city: 'Москва',
    aboutMe: 'Люблю IT и кофе',
    gender: Gender.MALE,
    skills: [],
    role: UserRole.ADMIN,
  },
];
