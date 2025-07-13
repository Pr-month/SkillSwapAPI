import { Gender, UserRole } from '../users/enums';
import { User } from '../users/entities/users.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const adminUser = {
  name: process.env.APP_ADMIN_USERNAME || 'admin',
  email: process.env.APP_ADMIN_EMAIL || 'admin@mail.com',
  password: process.env.APP_ADMIN_PASSWORD || 'admin',
  age: 30,
  city: 'Москва',
  aboutMe: 'Люблю IT и кофе',
  gender: Gender.MALE,
  skills: [],
  role: UserRole.ADMIN,
};

export const users: Array<User> = [
  adminUser,
  {
    name: 'Александр',
    email: 'alex@example.com',
    password: 'hashed_pw_1',
    age: 30,
    city: 'Москва',
    aboutMe: 'Люблю IT и кофе',
    gender: Gender.MALE,
    skills: [],
    role: UserRole.USER,
  },
  {
    name: 'Мария',
    email: 'maria@example.com',
    password: 'hashed_pw_2',
    age: 25,
    city: 'Санкт-Петербург',
    aboutMe: 'Фронтенд разработчик',
    gender: Gender.FEMALE,
    skills: [],
    role: UserRole.USER,
  },
  {
    name: 'Иван',
    email: 'ivan@example.com',
    password: 'hashed_pw_3',
    age: 28,
    city: 'Новосибирск',
    aboutMe: 'Бэкенд-энтузиаст',
    gender: Gender.MALE,
    skills: [],
    role: UserRole.USER,
  },
];
