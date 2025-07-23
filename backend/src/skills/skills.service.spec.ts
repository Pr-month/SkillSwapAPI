import { Test, TestingModule } from '@nestjs/testing';
import { SkillsService } from './skills.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Skill } from './entities/skill.entity';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Gender, UserRole } from '../users/enums';

const mockSkillRepository = () => ({
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
  delete: jest.fn(),
  findOneOrFail: jest.fn(),
});

const fakeSkill = {
  id: 'd0d94783-2831-45fe-88f8-b53029f45707',
  title: 'Супер быстрый тестер',
  description: 'desc',
  images: [],
  category: { id: '1', name: 'Тестирование', parent: null, children: [] },
  owner: {
    id: 'user1',
    name: 'fast',
    email: 'fast@test.com',
    password: '*****',
    age: 20,
    city: 'Москва',
    aboutMe: '',
    gender: Gender.MALE,
    skills: [],
    role: UserRole.USER,
  },
};

describe('SkillsService', () => {
  let service: SkillsService;
  let skillRepository: ReturnType<typeof mockSkillRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        { provide: getRepositoryToken(Skill), useFactory: mockSkillRepository },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
    skillRepository = module.get(getRepositoryToken(Skill));
  });

  it('успешно создаётся', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('должен успешно создать навык', async () => {
      skillRepository.save.mockResolvedValue({
        message: 'Навык создан',
        ...fakeSkill,
      });
      const result = await service.create('user1', {
        title: 'Test',
        description: 'desc',
        category: 'cat1',
        images: [],
      });
      expect(result).toHaveProperty('message', 'Навык создан');
      expect(skillRepository.save).toHaveBeenCalled();
    });
  });

  describe('find', () => {
    const createFakeQueryBuilder = (
      skill: Partial<Skill> | null,
      totalPages: number,
    ) => {
      return {
        where: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([skill ? [skill] : [], totalPages]),
      };
    };

    it('должен вернуть список навыков', async () => {
      const mockedQb = createFakeQueryBuilder({ id: '1', title: 'Test' }, 1);
      skillRepository.createQueryBuilder.mockReturnValue(mockedQb);
      const result = await service.find({ page: '1', limit: '10', search: '' });
      expect(result.data.length).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('должен вернуть пустой ответ если нет записей', async () => {
      const mockedQb = createFakeQueryBuilder(null, 0);
      skillRepository.createQueryBuilder.mockReturnValue(mockedQb);
      const result = await service.find({ page: '0', limit: '1', search: '' });
      expect(result).toEqual({ data: [], page: 1, totalPages: 0 });
    });

    it('должен выбросить ошибку если страница не найдена', async () => {
      const mockedQb = createFakeQueryBuilder(fakeSkill, 1);
      skillRepository.createQueryBuilder.mockReturnValue(mockedQb);
      await expect(
        service.find({ page: '333', limit: '1', search: '' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('должен успешно обновить навык', async () => {
      const updatedSkill = {
        ...fakeSkill,
        title: 'Обновлённое имя',
        description: 'Обновлённое описание',
      };
      jest.spyOn(service, 'userIsOwner').mockResolvedValue(fakeSkill);
      skillRepository.save.mockResolvedValue(updatedSkill);
      jest.spyOn(service, 'findFullSkill').mockResolvedValue(updatedSkill);
      const result = await service.update('user1', '1', {
        title: 'Обновлённое имя',
        description: 'Обновлённое описание',
      });
      expect(result).toHaveProperty('title', 'Обновлённое имя');
      expect(result).toHaveProperty('description', 'Обновлённое описание');

      jest.spyOn(service, 'userIsOwner').mockRestore();
      jest.spyOn(service, 'findFullSkill').mockRestore();
    });

    it('должен выбросить ошибку если пользователь не владелец', async () => {
      jest.spyOn(service, 'userIsOwner').mockImplementation(() => {
        throw new ForbiddenException();
      });
      await expect(
        service.update('user2', '1', { title: 'не важно' }),
      ).rejects.toThrow(ForbiddenException);

      jest.spyOn(service, 'userIsOwner').mockRestore();
    });

    it('должен выбросить ошибку если навык не найден', async () => {
      jest.spyOn(service, 'userIsOwner').mockImplementation(() => {
        throw new NotFoundException();
      });
      await expect(
        service.update('user1', 'notfound', { title: 'не важно' }),
      ).rejects.toThrow(NotFoundException);

      jest.spyOn(service, 'userIsOwner').mockRestore();
    });
  });

  describe('remove', () => {
    it('должен успешно удалить навык', async () => {
      jest.spyOn(service, 'userIsOwner').mockResolvedValue(fakeSkill);
      skillRepository.delete.mockResolvedValue({});
      const result = await service.remove(fakeSkill.id, fakeSkill.owner.id);
      expect(result).toHaveProperty('message');

      jest.spyOn(service, 'userIsOwner').mockRestore();
    });

    it('должен выбросить ошибку при невалидном UUID', async () => {
      await expect(service.remove('not-uuid', 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('должен выбросить ошибку если пользователь не владелец', async () => {
      jest.spyOn(service, 'userIsOwner').mockImplementation(() => {
        throw new ForbiddenException();
      });
      await expect(
        service.remove('1b4e28ba-2fa1-11d2-883f-0016d3cca427', 'user2'),
      ).rejects.toThrow(ForbiddenException);

      jest.spyOn(service, 'userIsOwner').mockRestore();
    });
  });

  describe('userIsOwner', () => {
    it('должен вернуть навык если пользователь владелец', async () => {
      skillRepository.findOneOrFail.mockResolvedValue(fakeSkill);
      const result = await service.userIsOwner(
        fakeSkill.id,
        fakeSkill.owner.id,
      );
      expect(result).toHaveProperty('id', fakeSkill.id);
    });

    it('должен выбросить ошибку если навык не найден', async () => {
      skillRepository.findOneOrFail.mockRejectedValue(
        new Error('Навык не найден'),
      );
      await expect(service.userIsOwner('1', 'user1')).rejects.toThrow(
        'Навык не найден',
      );
    });

    it('должен выбросить ошибку если пользователь не владелец', async () => {
      skillRepository.findOneOrFail.mockResolvedValue(fakeSkill);
      await expect(service.userIsOwner(fakeSkill.id, 'user2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findFullSkill', () => {
    it('должен вернуть навык с данными о категории и ее родителе, о владельце навыка', async () => {
      skillRepository.findOneOrFail.mockResolvedValue(fakeSkill);
      const result = await service.findFullSkill(fakeSkill.id);
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('owner');
      expect(result).toHaveProperty('category.parent');
    });
  });
});
