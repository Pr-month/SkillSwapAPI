import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Gender, UserRole } from './enums';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { Skill } from '../skills/entities/skill.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import * as bcrypt from 'bcrypt';
import { CreateUsersDto } from './dto/create.users.dto';
import { configuration } from 'src/config/configuration';
import { FindAllUsersQueryDto } from './dto/find-all-users.dto';

jest.mock('bcrypt');

interface MockQueryBuilder {
  leftJoinAndSelect: jest.Mock;
  where: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  getManyAndCount: jest.Mock;
  relation: jest.Mock;
  of: jest.Mock;
  add: jest.Mock;
  remove: jest.Mock;
}

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: {
    save: jest.Mock;
    update: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findOneOrFail: jest.Mock;
    findOneByOrFail: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let skillRepository: {
    findOneOrFail: jest.Mock;
  };
  let notificationsGateway: {
    notifyUser: jest.Mock;
  };
  let configService: {
    salt: number;
  };
  const users = [
    {
      id: '1',
      name: 'Владислав',
      email: 'vladislav@example.com',
      password: 'пароль',
      age: 30,
      city: 'Владивосток',
      aboutMe: 'О себе',
      gender: Gender.MALE,
      refreshToken: 'refresh_token_value',
      skills: [],
      favoriteSkills: [],
      role: UserRole.USER,
    },
    {
      id: '2',
      name: 'Екатерина',
      email: 'ekaterina@example.com',
      password: 'пароль',
      age: 35,
      city: 'Екатеринбург',
      aboutMe: 'О себе',
      gender: Gender.FEMALE,
      refreshToken: 'refresh_token_value_2',
      skills: [],
      favoriteSkills: [],
      role: UserRole.USER,
    },
  ];

  const userWithoutPasswordMock = [
    {
      id: '1',
      name: 'Владислав',
      email: 'vladislav@example.com',
      age: 30,
      city: 'Владивосток',
      aboutMe: 'О себе',
      gender: Gender.MALE,
      skills: [],
      favoriteSkills: [],
      role: UserRole.USER,
    },
    {
      id: '2',
      name: 'Екатерина',
      email: 'ekaterina@example.com',
      age: 35,
      city: 'Екатеринбург',
      aboutMe: 'О себе',
      gender: Gender.FEMALE,
      skills: [],
      favoriteSkills: [],
      role: UserRole.USER,
    },
  ];
  const skill = {
    id: 'skill1',
    title: 'Читать',
    description: 'Умею читать книги',
    category: { id: 'category1' },
    images: ['image1.png', 'image2.png'],
    owner: '1',
  };

  beforeEach(async () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([users, users.length]),
      relation: jest.fn().mockReturnThis(),
      of: jest.fn().mockReturnThis(),
      add: jest.fn(),
      remove: jest.fn(),
    };

    userRepository = {
      save: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      findOneByOrFail: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    skillRepository = {
      findOneOrFail: jest.fn(),
    };

    notificationsGateway = {
      notifyUser: jest.fn(),
    };

    (bcrypt.hash as jest.Mock).mockImplementation((data) => `hashed-${data}`);

    configService = {
      salt: 10,
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Skill),
          useValue: skillRepository,
        },
        {
          provide: configuration.KEY,
          useValue: configService,
        },
        {
          provide: NotificationsGateway,
          useValue: notificationsGateway,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('успешно создан', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('успешное создание пользователя', async () => {
      const createUserDto: CreateUsersDto = { ...users[0] };
      userRepository.save.mockResolvedValue(users[0]);
      const result = await service.create(createUserDto);
      expect(userRepository.save).toHaveBeenCalledWith(createUserDto);
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshToken');
      expect(result).toEqual(userWithoutPasswordMock[0]);
    });
  });

  describe('findAll', () => {
    it('успешно находит всех пользователей с пагинацией', async () => {
      const query: FindAllUsersQueryDto = {
        page: '1',
        limit: '10',
        search: '',
      };
      const result = await service.findAll(query);
      const oneUser = result.data[0];
      expect(userRepository.createQueryBuilder).toHaveBeenCalled();
      expect(result.data).toEqual(userWithoutPasswordMock);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(oneUser).not.toHaveProperty('password');
      expect(oneUser).not.toHaveProperty('refreshToken');
    });
    it('возвращает пустой массив, если пользователей нет', async () => {
      const mockQueryBuilder =
        userRepository.createQueryBuilder() as MockQueryBuilder;
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const query: FindAllUsersQueryDto = {
        page: '1',
        limit: '10',
        search: '',
      };
      const result = await service.findAll(query);
      expect(userRepository.createQueryBuilder).toHaveBeenCalled();
      expect(result.data).toEqual([]);
      expect(result.totalPages).toBe(0);
    });
    it('вызывает поиск по имени', async () => {
      const mockQueryBuilder =
        userRepository.createQueryBuilder() as MockQueryBuilder;

      const query: FindAllUsersQueryDto = {
        page: '1',
        limit: '10',
        search: 'владислав',
      };
      await service.findAll(query);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'LOWER(user.name) LIKE :search OR LOWER(user.email) LIKE :search',
        { search: '%владислав%' },
      );
    });
  });

  describe('findOne', () => {
    it('успешно находит пользователя по id', async () => {
      userRepository.findOneOrFail.mockResolvedValue(users[0]);
      const result = await service.findOne('1');
      expect(userRepository.findOneOrFail).toHaveBeenCalled();
      expect(result).toEqual(userWithoutPasswordMock[0]);
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('выбрасывает ошибку, если пользователь не найден', async () => {
      userRepository.findOneOrFail.mockRejectedValue(
        new Error('Пользователь не найден'),
      );
      await expect(service.findOne('3')).rejects.toThrow(
        'Пользователь не найден',
      );
    });
  });

  describe('updateUser', () => {
    it('успешно обновляет пользователя', async () => {
      const updatedUser = { ...users[0], name: 'Арчибальд' };
      userRepository.findOneOrFail.mockResolvedValue(updatedUser);
      userRepository.update.mockResolvedValue(undefined);
      const result = await service.updateUser('1', { name: 'Арчибальд' });
      expect(userRepository.update).toHaveBeenCalledWith('1', {
        name: 'Арчибальд',
      });
      expect(userRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        ...userWithoutPasswordMock[0],
        name: 'Арчибальд',
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('выбрасывает ошибку, если пользователь не найден', async () => {
      userRepository.findOneOrFail.mockRejectedValue(
        new Error('Пользователь не найден'),
      );
      await expect(
        service.updateUser('3', { name: 'Арчибальд' }),
      ).rejects.toThrow('Пользователь не найден');
    });
  });

  describe('updatePassword', () => {
    it('успешно обновляет пароль пользователя', async () => {
      const newPassword = 'новый_пароль';
      const hashedPassword = bcrypt.hash(newPassword, configService.salt);
      const updatedUser = {
        ...users[0],
        password: hashedPassword,
      };
      userRepository.findOneByOrFail.mockResolvedValue(users[0]);
      userRepository.save.mockResolvedValue(updatedUser);
      const result = await service.updatePassword('1', newPassword);
      expect(userRepository.findOneByOrFail).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual(userWithoutPasswordMock[0]);
    });

    it('выбрасывает ошибку, если пользователь не найден', async () => {
      userRepository.findOneByOrFail.mockRejectedValue(
        new Error('Пользователь не найден'),
      );
      await expect(service.updatePassword('3', 'новый_пароль')).rejects.toThrow(
        'Пользователь не найден',
      );
    });

    it('выбрасывает ошибку, если новый пароль пустой', async () => {
      await expect(service.updatePassword('1', '')).rejects.toThrow(
        'Пароль не может быть пустым',
      );
    });
  });

  describe('remove', () => {
    it('успешно удаляет пользователя', async () => {
      const result = await service.remove('1');
      expect(userRepository.delete).toHaveBeenCalledWith('1');
      expect(result).toEqual({ message: 'Пользователь с id 1 удалён' });
    });
  });

  describe('findByEmail', () => {
    it('успешно находит пользователя по email', async () => {
      userRepository.findOne.mockResolvedValue(users[0]);
      const result = await service.findByEmail('vladislav@example.com');
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(users[0]);
    });

    it('возвращает null, если пользователь не найден', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const result = await service.findByEmail('test@example.com');
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });

  describe('removeRefreshToken', () => {
    it('успешно удаляет refreshToken пользователя', async () => {
      userRepository.findOneByOrFail.mockResolvedValue(users[0]);
      const result = await service.removeRefreshToken('1');
      expect(userRepository.findOneByOrFail).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledWith({
        ...users[0],
        refreshToken: '',
      });
      expect(result).toEqual({
        message: `Refresh token для пользователя с id 1 удален`,
      });
    });

    it('выбрасывает ошибку, если пользователь не найден', async () => {
      userRepository.findOneByOrFail.mockRejectedValue(
        new Error('Пользователь не найден'),
      );
      await expect(service.removeRefreshToken('3')).rejects.toThrow(
        'Пользователь не найден',
      );
    });
  });

  describe('addFavoriteSkill', () => {
    it('успешно добавляет навык в избранное', async () => {
      userRepository.findOneOrFail.mockResolvedValue(users[0]);
      skillRepository.findOneOrFail.mockResolvedValue(skill);
      const result = await service.addFavoriteSkill('1', 'skill1');
      expect(userRepository.findOneOrFail).toHaveBeenCalled();
      expect(skillRepository.findOneOrFail).toHaveBeenCalled();
      expect(userRepository.createQueryBuilder).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Навык добавлен в избранное' });
    });

    it('выбрасывает ошибку, если пользователь не найден', async () => {
      userRepository.findOneOrFail.mockRejectedValue(
        new Error('Пользователь не найден'),
      );
      await expect(service.addFavoriteSkill('3', 'skill1')).rejects.toThrow(
        'Пользователь не найден',
      );
    });

    it('выбрасывает ошибку, если навык не найден', async () => {
      userRepository.findOneOrFail.mockResolvedValue(users[0]);
      skillRepository.findOneOrFail.mockRejectedValue(
        new Error('Навык не найден'),
      );
      await expect(service.addFavoriteSkill('1', 'skill2')).rejects.toThrow(
        'Навык не найден',
      );
    });

    it('выбрасывает ошибку, если навык уже в избранном', async () => {
      userRepository.findOneOrFail.mockResolvedValue({
        ...users[0],
        favoriteSkills: [{ id: 'skill1' }],
      });
      skillRepository.findOneOrFail.mockResolvedValue(skill);
      await expect(service.addFavoriteSkill('1', 'skill1')).rejects.toThrow(
        'Навык уже в избранном',
      );
    });
  });

  describe('removeFavoriteSkill', () => {
    it('успешно удаляет навык из избранного', async () => {
      userRepository.findOneOrFail.mockResolvedValue({
        ...users[0],
        favoriteSkills: [{ id: 'skill1' }],
      });
      skillRepository.findOneOrFail.mockResolvedValue(skill);
      const result = await service.removeFavoriteSkill('1', 'skill1');
      expect(userRepository.findOneOrFail).toHaveBeenCalled();
      expect(skillRepository.findOneOrFail).toHaveBeenCalled();
      expect(userRepository.createQueryBuilder).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Навык удалён из избранного' });
    });

    it('выбрасывает ошибку, если пользователь не найден', async () => {
      userRepository.findOneOrFail.mockRejectedValue(
        new Error('Пользователь не найден'),
      );
      await expect(service.removeFavoriteSkill('3', 'skill1')).rejects.toThrow(
        'Пользователь не найден',
      );
    });

    it('выбрасывает ошибку, если навык не найден', async () => {
      userRepository.findOneOrFail.mockResolvedValue(users[0]);
      skillRepository.findOneOrFail.mockRejectedValue(
        new Error('Навык не найден'),
      );
      await expect(service.removeFavoriteSkill('1', 'skill2')).rejects.toThrow(
        'Навык не найден',
      );
    });

    it('выбрасывает ошибку, если навык уже удалён из избранного', async () => {
      userRepository.findOneOrFail.mockResolvedValue(users[0]);
      skillRepository.findOneOrFail.mockResolvedValue(skill);
      await expect(service.removeFavoriteSkill('1', 'skill1')).rejects.toThrow(
        'Навык уже удалён из избранного',
      );
    });
  });
});
