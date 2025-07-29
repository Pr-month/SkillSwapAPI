import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';
import { User } from '../users/entities/users.entity';
import { Skill } from '../skills/entities/skill.entity';
import { Repository } from 'typeorm';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestAction, RequestStatus } from './enums';
import { JwtPayload } from 'src/auth/types';

import { ObjectLiteral } from 'typeorm';

type MockRepository<T extends ObjectLiteral = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const mockRepository = <
  T extends ObjectLiteral = any,
>(): MockRepository<T> => ({
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  })),
});

const mockNotificationsGateway = {
  notifyUser: jest.fn(),
};

describe('RequestsService', () => {
  let service: RequestsService;

  let requestRepository: MockRepository<Request>;
  let userRepository: MockRepository<User>;
  let skillRepository: MockRepository<Skill>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: getRepositoryToken(Request),
          useFactory: () => mockRepository<Request>(),
        },
        {
          provide: getRepositoryToken(User),
          useFactory: () => mockRepository<User>(),
        },
        {
          provide: getRepositoryToken(Skill),
          useFactory: () => mockRepository<Skill>(),
        },
        { provide: NotificationsGateway, useValue: mockNotificationsGateway },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
    requestRepository = module.get<MockRepository<Request>>(
      getRepositoryToken(Request),
    );
    userRepository = module.get<MockRepository<User>>(getRepositoryToken(User));
    skillRepository = module.get<MockRepository<Skill>>(
      getRepositoryToken(Skill),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('должен выбросить NotFoundException, если offeredSkill или requestedSkill не найдены', async () => {
      skillRepository.findOne!.mockResolvedValueOnce(null);
      await expect(
        service.create('user1', {
          offeredSkillId: '1',
          requestedSkillId: '2',
        } as CreateRequestDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('должен выбросить NotFoundException, если отправитель не найден', async () => {
      skillRepository
        .findOne!.mockResolvedValueOnce({ id: '1', owner: { id: 'user1' } })
        .mockResolvedValueOnce({ id: '2', owner: { id: 'user2' } });
      userRepository.findOne!.mockResolvedValueOnce(null);
      await expect(
        service.create('user1', {
          offeredSkillId: '1',
          requestedSkillId: '2',
        } as CreateRequestDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('должен выбросить NotFoundException, если получатель не найден', async () => {
      skillRepository
        .findOne!.mockResolvedValueOnce({ id: '1', owner: { id: 'user1' } })
        .mockResolvedValueOnce({ id: '2', owner: { id: 'user2' } });
      userRepository
        .findOne!.mockResolvedValueOnce({ id: 'user1', skills: [{ id: '1' }] })
        .mockResolvedValueOnce(null);
      await expect(
        service.create('user1', {
          offeredSkillId: '1',
          requestedSkillId: '2',
        } as CreateRequestDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('должен вызвать notifyUser с корректными параметрами при создании', async () => {
      skillRepository
        .findOne!.mockResolvedValueOnce({
          id: '1',
          owner: { id: 'user1' },
          title: 'SkillA',
        })
        .mockResolvedValueOnce({
          id: '2',
          owner: { id: 'user2' },
          title: 'SkillB',
        });
      userRepository
        .findOne!.mockResolvedValueOnce({
          id: 'user1',
          skills: [{ id: '1' }],
          name: 'Sender',
        })
        .mockResolvedValueOnce({
          id: 'user2',
          skills: [{ id: '2' }],
          name: 'Receiver',
        });
      requestRepository.findOne!.mockResolvedValue(null);
      requestRepository.save!.mockResolvedValue({
        id: 'req2',
        receiver: { id: 'user2' },
        requestedSkill: { title: 'SkillB' },
        sender: { name: 'Sender' },
      });
      await service.create('user1', {
        offeredSkillId: '1',
        requestedSkillId: '2',
      } as CreateRequestDto);
      expect(mockNotificationsGateway.notifyUser).toHaveBeenCalledWith(
        'user2',
        {
          type: 'new_request',
          skillName: 'SkillB',
          sender: 'Sender',
        },
      );
    });

    it('должен выбросить NotFoundException, если offeredSkill или requestedSkill не существуют', async () => {
      const senderID = 'user1';
      const createRequestDto = {
        offeredSkillId: 'nonexistentSkill1',
        requestedSkillId: 'nonexistentSkill2',
      };

      skillRepository.findOne = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await expect(service.create(senderID, createRequestDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('должен выбросить BadRequestException, если заявка уже существует', async () => {
      skillRepository
        .findOne!.mockResolvedValueOnce({
          id: '1',
          owner: { id: 'user1' },
          title: 'A',
        })
        .mockResolvedValueOnce({
          id: '2',
          owner: { id: 'user2' },
          title: 'B',
        });
      userRepository
        .findOne!.mockResolvedValueOnce({
          id: 'user1',
          skills: [{ id: '1' }],
          name: 'Sender',
        })
        .mockResolvedValueOnce({
          id: 'user2',
          skills: [{ id: '2' }],
          name: 'Receiver',
        });
      requestRepository.findOne!.mockResolvedValue({ id: 'req1' });
      await expect(
        service.create('user1', {
          offeredSkillId: '1',
          requestedSkillId: '2',
        } as CreateRequestDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('должен создать и вернуть новую заявку', async () => {
      skillRepository
        .findOne!.mockResolvedValueOnce({
          id: '1',
          owner: { id: 'user1' },
          title: 'A',
        })
        .mockResolvedValueOnce({ id: '2', owner: { id: 'user2' }, title: 'B' });
      userRepository
        .findOne!.mockResolvedValueOnce({
          id: 'user1',
          skills: [{ id: '1' }],
          name: 'Sender',
        })
        .mockResolvedValueOnce({
          id: 'user2',
          skills: [{ id: '2' }],
          name: 'Receiver',
        });
      requestRepository.findOne!.mockResolvedValue(null);
      requestRepository.save!.mockResolvedValue({
        id: 'req1',
        receiver: { id: 'user2' },
        requestedSkill: { title: 'B' },
        sender: { name: 'Sender' },
      });
      const result = await service.create('user1', {
        offeredSkillId: '1',
        requestedSkillId: '2',
      } as CreateRequestDto);
      expect(result).toHaveProperty('id', 'req1');
      expect(mockNotificationsGateway.notifyUser).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    type MockQueryBuilder = {
      leftJoinAndSelect: jest.Mock<any, any>;
      orderBy: jest.Mock<any, any>;
      andWhere: jest.Mock<any, any>;
      skip: jest.Mock<any, any>;
      take: jest.Mock<any, any>;
      getManyAndCount: jest.Mock<any, any>;
    };

    let qb: MockQueryBuilder;

    beforeEach(() => {
      qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
      };

      requestRepository.createQueryBuilder = jest.fn().mockReturnValue(qb);
    });

    it('должен вернуть постраничный список заявок', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll('user1', { page: '1', limit: '10' });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 10);
      expect(requestRepository.createQueryBuilder).toHaveBeenCalledWith(
        'request',
      );
    });

    it('должен выбросить NotFoundException, если страница превышает totalPages', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 10]);
      await expect(
        service.findAll('user1', { page: '3', limit: '5' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('должен выбросить ForbiddenException, если пользователь не отправитель, не получатель и не админ', async () => {
      requestRepository.findOneOrFail!.mockResolvedValue({
        id: 'req1',
        sender: { id: 'user1' },
        receiver: { id: 'user2' },
      });
      await expect(service.findOne('user3', 'req1', 'user')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('должен вернуть заявку, если пользователь — отправитель', async () => {
      requestRepository.findOneOrFail!.mockResolvedValue({
        id: 'req1',
        sender: { id: 'user1', password: 'p', refreshToken: 'r' },
        receiver: { id: 'user2', password: 'p', refreshToken: 'r' },
      });
      const res = await service.findOne('user1', 'req1', 'user');
      expect(res).toHaveProperty('id', 'req1');
      expect(res.sender).not.toHaveProperty('password');
      expect(res.sender).not.toHaveProperty('refreshToken');
    });
  });

  describe('update', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('должен отметить заявку как прочитанную при действии READ', async () => {
      const request = {
        id: 'req1',
        status: RequestStatus.PENDING,
        isRead: false,
        sender: { id: 'user1', name: 'Sender', skills: [] },
        receiver: { id: 'user2', name: 'Receiver', skills: [] },
        offeredSkill: { id: 'skill1', title: 'Offered Skill' },
        requestedSkill: { id: 'skill2', title: 'Requested Skill' },
      };

      requestRepository.findOneOrFail!.mockResolvedValue(request);
      requestRepository.save!.mockResolvedValue({ ...request, isRead: true });

      const mockUser: JwtPayload = {
        sub: 'user2',
        role: 'user',
        email: 'user2@example.com',
      };

      const result = await service.update(
        'req1',
        { action: RequestAction.READ },
        mockUser,
      );
      expect(result.isRead).toBe(true);
      expect(mockNotificationsGateway.notifyUser).not.toHaveBeenCalled();
    });

    it('должен обновить заявку и уведомить пользователя при ACCEPT', async () => {
      const request = {
        id: 'req1',
        status: RequestStatus.PENDING,
        sender: { id: 'user1', name: 'Sender', skills: [] },
        receiver: { id: 'user2', name: 'Receiver', skills: [] },
        offeredSkill: { id: 'skill1', title: 'Offered Skill' },
        requestedSkill: { id: 'skill2', title: 'Requested Skill' },
        isRead: false,
      };
      requestRepository.findOneOrFail!.mockResolvedValue(request);
      requestRepository.save!.mockImplementation((r: typeof request) => ({
        ...r,
      }));

      const mockUser: JwtPayload = {
        sub: 'user2',
        role: 'user',
        email: 'user2@example.com',
      };

      const dto: UpdateRequestDto = { action: RequestAction.ACCEPT };

      await service.update('req1', dto, mockUser);

      expect(mockNotificationsGateway.notifyUser.mock.calls).toEqual(
        expect.arrayContaining([
          [
            'user2',
            expect.objectContaining({
              type: 'accepted_request',
              skillName: 'Requested Skill',
              sender: 'Sender',
            }),
          ],
        ]),
      );
    });

    it('должен изменить статус на REJECTED при действии REJECT', async () => {
      const request = {
        id: 'req1',
        status: RequestStatus.PENDING,
        isRead: false,
        sender: { id: 'user1', name: 'Sender', skills: [] },
        receiver: { id: 'user2', name: 'Receiver', skills: [] },
        offeredSkill: { id: 'skill1', title: 'Offered Skill' },
        requestedSkill: { id: 'skill2', title: 'Requested Skill' },
      };

      requestRepository.findOneOrFail!.mockResolvedValue(request);
      requestRepository.save!.mockImplementation(
        (r: typeof request): typeof request => r,
      );

      const mockUser: JwtPayload = {
        sub: 'user2',
        role: 'user',
        email: 'user2@example.com',
      };

      const result = await service.update(
        'req1',
        { action: RequestAction.REJECT },
        mockUser,
      );

      expect(result.status).toBe(RequestStatus.REJECTED);
      expect(result.isRead).toBe(true);
      expect(mockNotificationsGateway.notifyUser).toHaveBeenCalledWith(
        'user2',
        {
          type: 'declined_request',
          skillName: 'Requested Skill',
          sender: 'Sender',
        },
      );
    });

    it('должен выбросить ForbiddenException, если пользователь не получатель', async () => {
      const request = {
        id: 'req1',
        receiver: { id: 'user2' },
        sender: { id: 'user1' },
      };

      requestRepository.findOneOrFail!.mockResolvedValue(request);

      await expect(
        service.update(
          'req1',
          { action: RequestAction.ACCEPT },
          {
            sub: 'user3',
            role: 'user',
            email: 'user3@example.com',
          },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('должен выбросить ForbiddenException, если неавторизованный пользователь пытается обновить', async () => {
      const request = {
        id: 'req1',
        status: RequestStatus.PENDING,
        sender: { id: 'user1' },
        receiver: { id: 'user2' },
      };
      requestRepository.findOneOrFail!.mockResolvedValue(request);

      const mockUser: JwtPayload = {
        sub: 'user3',
        role: 'user',
        email: 'user3@example.com',
      };

      const dto: UpdateRequestDto = { action: RequestAction.ACCEPT };

      await expect(service.update('req1', dto, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('должен выбросить BadRequestException для некорректного действия', async () => {
      const request = {
        id: 'req1',
        status: RequestStatus.PENDING,
        sender: { id: 'user1', name: 'Sender', skills: [] },
        receiver: { id: 'user2', name: 'Receiver', skills: [] },
        offeredSkill: { id: 'skill1', title: 'Offered Skill' },
        requestedSkill: { id: 'skill2', title: 'Requested Skill' },
        isRead: false,
      };

      requestRepository.findOneOrFail!.mockResolvedValue(request);

      const dto = { action: 'INVALID' as RequestAction };

      await expect(
        service.update('req1', dto, {
          sub: 'user2',
          role: 'user',
          email: 'user2@example.com',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('должен удалить заявку, если пользователь — отправитель или получатель', async () => {
      const request = {
        id: 'req1',
        sender: { id: 'user1' },
        receiver: { id: 'user2' },
      };
      requestRepository.findOneOrFail!.mockResolvedValue(request);
      requestRepository.delete!.mockResolvedValue({ affected: 1 });

      await service.remove('req1', {
        sub: 'user1',
        role: 'user',
        email: 'user1@example.com',
      });

      expect(requestRepository.delete).toHaveBeenCalledWith('req1');
    });

    it('должен выбросить ForbiddenException, если не владелец пытается удалить заявку', async () => {
      requestRepository.findOneOrFail!.mockResolvedValue({
        id: 'req1',
        sender: { id: 'user1' },
      });

      await expect(
        service.remove('req1', {
          sub: 'user2',
          role: 'user',
          email: 'user2@example.com',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('должен выбросить ForbiddenException, если неавторизованный пользователь пытается удалить', async () => {
      const request = {
        id: 'req1',
        sender: { id: 'user1' },
        receiver: { id: 'user2' },
      };
      requestRepository.findOneOrFail!.mockResolvedValue(request);

      await expect(
        service.remove('req1', {
          sub: 'user3',
          role: 'user',
          email: 'user3@example.com',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('должен удалить заявку, если пользователь — отправитель', async () => {
      requestRepository.findOneOrFail!.mockResolvedValue({
        id: 'req1',
        sender: { id: 'user1' },
      });
      requestRepository.delete!.mockResolvedValue({});

      const result = await service.remove('req1', {
        sub: 'user1',
        role: 'user',
        email: 'user1@example.com',
      });

      expect(result).toEqual({ message: 'Заявка с id: req1 успешно удалена' });
    });
  });
});
