import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Gender, UserRole } from '../users/enums';
import { Skill } from './entities/skill.entity';
import { SkillsService } from './skills.service';

const mockSkillRepository = () => ({
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
  findOne: jest.fn(),
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
      // 1. Мокируем userIsOwner
      jest.spyOn(service, 'userIsOwner').mockResolvedValue(fakeSkill);

      // 2. Мокируем save
      const updatedSkillFromSave = {
        ...fakeSkill,
        title: 'Обновлённое имя',
        description: 'Обновлённое описание',
      };
      skillRepository.save.mockResolvedValue(updatedSkillFromSave);

      // 3. Мокируем findOneOrFail для findFullSkill
      const fullSkillToReturn = {
        ...updatedSkillFromSave,
        owner: { id: 'user1' },
        category: { id: 'category1', parent: null },
      };
      skillRepository.findOneOrFail.mockResolvedValue(fullSkillToReturn);

      const result = await service.update('user1', '1', {
        title: 'Обновлённое имя',
      });

      // Проверяем что findFullSkill был вызван с правильным ID
      expect(skillRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: fakeSkill.id },
        relations: ['owner', 'category', 'category.parent'],
      });

      // Проверяем результат
      expect(result).toHaveProperty('title', 'Обновлённое имя');
    });
    it('должен выбросить ошибку если пользователь не владелец', async () => {
      jest.spyOn(service, 'userIsOwner').mockImplementation(() => {
        throw new ForbiddenException();
      });
      await expect(
        service.update('user2', '1', { title: 'не важно' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('должен выбросить ошибку если навык не найден', async () => {
      jest.spyOn(service, 'userIsOwner').mockImplementation(() => {
        throw new NotFoundException();
      });
      await expect(
        service.update('user1', 'notfound', { title: 'не важно' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('должен успешно удалить навык', async () => {
      jest.spyOn(service, 'userIsOwner').mockResolvedValue(fakeSkill);
      skillRepository.delete.mockResolvedValue({});
      const result = await service.remove(fakeSkill.id, fakeSkill.owner.id);
      expect(result).toHaveProperty('message');
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
    });
  });

  describe('userIsOwner', () => {
    it('должен вернуть навык если пользователь владелец', async () => {
      skillRepository.findOneOrFail.mockResolvedValue({
        ...fakeSkill,
        owner: { id: fakeSkill.owner.id },
        category: fakeSkill.category || null,
      });

      const result = await service.userIsOwner(
        fakeSkill.id,
        fakeSkill.owner.id,
      );

      expect(skillRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: fakeSkill.id },
        relations: ['owner', 'category'],
      });

      expect(result).toHaveProperty('id', fakeSkill.id);
    });

    it('должен бросить исключение если пользователь не владелец', async () => {
      const notOwnerId = 'not-owner-id';

      skillRepository.findOneOrFail.mockResolvedValue({
        ...fakeSkill,
        owner: { id: fakeSkill.owner.id },
        category: fakeSkill.category || null,
      });

      await expect(service.userIsOwner(fakeSkill.id, notOwnerId))
        .rejects
        .toThrow(ForbiddenException);
    });

    it('должен выбросить ошибку если навык не найден', async () => {
      skillRepository.findOneOrFail.mockRejectedValue(new NotFoundException('Skill', '1'));

      await expect(service.userIsOwner('1', 'user1'))
        .rejects
        .toThrow(NotFoundException);
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
