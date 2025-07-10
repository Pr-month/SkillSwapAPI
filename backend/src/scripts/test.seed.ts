import { SeedSimple } from '../utils/seedingSimple';
import { User } from '../users/entities/users.entity';
import { Skill } from '../skills/entities/skill.entity';
import { Gender, UserRole } from '../users/enums';
import { RequestStatus } from '../requests/enums';
import { Request } from '../requests/entities/request.entity';
import { Category } from '../categories/entities/category.entity';

const userSeed = new SeedSimple(User, {
  success: 'Тестовые данные загружены',
});

userSeed.run(async (repository) => {
  const users = await repository.save([
    {
      name: 'Владислав',
      email: 'vladislav@example.com',
      password: '$2b$10$jYWEZCkNjy0lGIXK5N4Ya.vrYd/h2u9opZwjfjMP9QYcgTTFw/qV2', // 'пароль1'
      age: 30,
      city: 'Владивосток',
      aboutMe: 'О себе',
      gender: Gender.MALE,
      role: UserRole.USER,
      refreshToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyY2FmODhlYi00ZmM4LTQ5ZWItYmM3Zi01MjA5YzI2MjI4YWQiLCJlbWFpbCI6InZsYWRpc2xhdkBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzUyMTgxNzIzLCJleHAiOjE3NTI3ODY1MjN9.zrjuWpQ6IbVLE2LW35r8YbBmNqw0RfXGFkTsNNe11NQ',
    },
    {
      name: 'Екатерина',
      email: 'ekaterina@example.com',
      password: '$2b$10$IfLKGxMRA8FHzK5SeTNec./13.Qe2AdpXRXErYfd5LtSCaYzHGFGu', // 'пароль2'
      age: 37,
      city: 'Екатеринбург',
      aboutMe: 'О себе',
      gender: Gender.FEMALE,
      role: UserRole.USER,
      refreshToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZDFhMWE3Mi0wMzA4LTRmZTAtYjlmZS0xZmJiMzliMzYxZjUiLCJlbWFpbCI6ImVrYXRlcmluYUBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzUyMTgyMDg5LCJleHAiOjE3NTI3ODY4ODl9.xHItHubNrkOIhjRQS-ZJAw2PRgHD00uOjJ7E48C0IRg',
    },
    {
      name: 'Иван',
      email: 'ivan@example.com',
      password: '$2b$10$YVFnqG/20IjnFCYmgEgAkuKwGAvysrkdsZQu4LVyAniZHU..GL/KK', // 'пароль3'
      age: 27,
      city: 'Иваново',
      aboutMe: 'О себе',
      gender: Gender.MALE,
      role: UserRole.USER,
      refreshToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzM2FkNjdiZi00MmJmLTQxY2EtOTRhNi1lZTdiYTI3ZTI1NDMiLCJlbWFpbCI6Iml2YW5AZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc1MjE4MjE4NiwiZXhwIjoxNzUyNzg2OTg2fQ.NlLB5H0Im4MCvs6pCboyn1TsL5A8W1avPh-VMri8ONk',
    },
  ]);

  const skillRepository = repository.manager.getRepository(Skill);
  const categories = await repository.manager.getRepository(Category).find();

  const skills = await skillRepository.save([
    {
      title: 'Барабаны',
      description: 'Умею играть на барабанах',
      category: categories[2],
      images: ['image1.png'],
      owner: users[0],
    },
    {
      title: 'Гитара',
      description: 'Умею играть на гитаре',
      images: ['image2.png', 'image3.png'],
      category: categories[3],
      owner: users[1],
    },
    {
      title: 'Пасьянс',
      description: 'Умею раскладывать пасьянс',
      images: [],
      category: categories[5],
      owner: users[2],
    },
  ]);

  const requestRepository = repository.manager.getRepository(Request);
  await requestRepository.save([
    {
      sender: users[0],
      receiver: users[1],
      status: RequestStatus.PENDING,
      offeredSkill: skills[0],
      requestedSkill: skills[1],
      isRead: false,
    },
    {
      sender: users[1],
      receiver: users[2],
      status: RequestStatus.ACCEPTED,
      offeredSkill: skills[1],
      requestedSkill: skills[2],
      isRead: true,
    },
    {
      sender: users[2],
      receiver: users[0],
      status: RequestStatus.DONE,
      offeredSkill: skills[2],
      requestedSkill: skills[0],
      isRead: true,
    },
  ]);
});
