import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'src/requests/entities/request.entity';
import { Skill } from 'src/skills/entities/skill.entity';
import { User } from 'src/users/entities/users.entity';
import { Repository } from 'typeorm';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestAction, RequestStatus, RequestType } from './enums';
import { FindRequestQueryDto } from './dto/find-request.dto';
import { JwtPayload } from '../auth/types';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationType } from '../notifications/ws-jwt/types';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request) private requestRepository: Repository<Request>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Skill) private skillRepository: Repository<Skill>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(senderID: string, createRequestDto: CreateRequestDto) {
    const { offeredSkillId, requestedSkillId } = createRequestDto;

    const offeredSkill = await this.skillRepository.findOne({
      where: { id: offeredSkillId },
      relations: ['owner'],
    });

    const requestedSkill = await this.skillRepository.findOne({
      where: { id: requestedSkillId },
      relations: ['owner'],
    });

    if (offeredSkill == null || requestedSkill == null)
      throw new NotFoundException(
        `Предлагаемый / запрашиваемый навык не существует`,
      );

    const senderId = offeredSkill.owner.id;
    const receiverId = requestedSkill.owner.id;

    if (senderID !== senderId)
      throw new ForbiddenException(
        `Заявка сгенерирована не от имени авторизированного пользователя`,
      );
    const sender = await this.userRepository.findOne({
      where: { id: senderId },
      relations: ['skills'],
    });
    const receiver = await this.userRepository.findOne({
      where: { id: receiverId },
      relations: ['skills'],
    });
    if (sender == null)
      throw new NotFoundException(
        `Заявка сгенерирована  несуществующим пользователем`,
      );

    if (receiver == null)
      throw new NotFoundException(
        `Заявка адресована  несуществующему пользователю`,
      );

    const senderHasOfferedSkill = sender.skills.some(
      (skill) => skill.id === offeredSkillId,
    );

    if (!senderHasOfferedSkill) {
      throw new ForbiddenException(
        `Авторизированный пользователь не обладает предлагаемым навыком.`,
      );
    }

    const receiverHasRequestedSkill = receiver.skills.some(
      (skill) => skill.id === requestedSkillId,
    );

    if (!receiverHasRequestedSkill) {
      throw new ConflictException(
        `Получатель не обладает запрашиваемым навыком.`,
      );
    }

    const existingRequest = await this.requestRepository.findOne({
      where: {
        sender: { id: sender.id },
        offeredSkill: { id: offeredSkill.id },
        requestedSkill: { id: requestedSkill.id },
      },
    });

    if (existingRequest) {
      throw new BadRequestException(
        `Такая заявка уже существует. Пользователь уже отправил запрос на обмен "${offeredSkill.title}" на "${requestedSkill.title}".`,
      );
    }

    const newRequest = new Request();

    newRequest.sender = sender;
    newRequest.receiver = receiver;
    newRequest.offeredSkill = offeredSkill;
    newRequest.requestedSkill = requestedSkill;

    const createdRequest = await this.requestRepository.save(newRequest);
    this.notificationsGateway.notifyUser(createdRequest.receiver.id!, {
      type: NotificationType.NEW_REQUEST,
      skillName: createdRequest.requestedSkill.title,
      sender: createdRequest.sender.name,
    });
    return createdRequest;
  }

  async findAll(senderID: string, query: FindRequestQueryDto) {
    const page = Math.max(parseInt(query.page ?? '1'), 1);
    const limit = Math.min(Math.max(parseInt(query.limit ?? '20'), 1), 100);

    const qb = this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.sender', 'sender')
      .leftJoinAndSelect('request.receiver', 'receiver')
      .leftJoinAndSelect('request.offeredSkill', 'offeredSkill')
      .leftJoinAndSelect('request.requestedSkill', 'requestedSkill')
      .orderBy('request.createdAt', 'DESC');

    if (query.type) {
      if (query.type === RequestType.INCOMING) {
        qb.andWhere('receiver.id = :currentUserId', {
          currentUserId: senderID,
        });
      } else if (query.type === RequestType.OUTGOING) {
        qb.andWhere('sender.id = :currentUserId', { currentUserId: senderID });
      }
    } else {
      qb.andWhere(
        '(sender.id = :currentUserId OR receiver.id = :currentUserId)',
        { currentUserId: senderID },
      );
    }

    if (query.status) {
      qb.andWhere('request.status = :status', { status: query.status });
    }

    if (query.isRead !== undefined && query.isRead !== null) {
      qb.andWhere('request.isRead = :isRead', { isRead: query.isRead });
    }

    const [requests, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    if (page > totalPages && totalPages !== 0) {
      throw new NotFoundException('Страница не найдена');
    }

    return {
      data: requests,
      page,
      limit,
      totalPages,
      total,
    };
  }

  async findOne(userid: string, id: string, role: string) {
    const request = await this.requestRepository.findOneOrFail({
      where: { id },
      relations: ['sender', 'receiver'],
    });

    if (
      request.sender.id !== userid &&
      request.receiver.id !== userid &&
      role !== 'admin'
    ) {
      throw new ForbiddenException('Доступ запрещён');
    }

    const { sender, receiver, ...restRequest } = request;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cleanSender = (({ password, refreshToken, ...rest }) => rest)(sender);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cleanReceiver = (({ password, refreshToken, ...rest }) => rest)(
      receiver,
    );

    return {
      ...restRequest,
      sender: cleanSender,
      receiver: cleanReceiver,
    };
  }

  async update(id: string, dto: UpdateRequestDto, user: JwtPayload) {
    const request = await this.requestRepository.findOneOrFail({
      where: { id },
      relations: ['sender', 'receiver', 'offeredSkill', 'requestedSkill'],
    });

    if (user.role === 'user' && user.sub !== request.receiver.id) {
      throw new ForbiddenException(
        `Пользователь не может обновить заявку, если он не является её получателем`,
      );
    }

    const action = dto.action;

    switch (action) {
      case RequestAction.READ: {
        request.isRead = true;
        break;
      }

      case RequestAction.ACCEPT: {
        request.status = RequestStatus.ACCEPTED;
        request.isRead = true;
        const { sender, receiver, offeredSkill, requestedSkill } = request;

        const senderHasRequested = sender.skills?.some(
          (s) => s.id === requestedSkill.id,
        );
        if (!senderHasRequested) {
          sender.skills = [...(sender.skills || []), requestedSkill];
          await this.userRepository.save(sender);
        }

        const receiverHasOffered = receiver.skills?.some(
          (s) => s.id === offeredSkill.id,
        );
        if (!receiverHasOffered) {
          receiver.skills = [...(receiver.skills || []), offeredSkill];
          await this.userRepository.save(receiver);
        }
        break;
      }

      case RequestAction.REJECT: {
        request.isRead = true;
        request.status =
          request.status === RequestStatus.PENDING
            ? RequestStatus.REJECTED
            : RequestStatus.PENDING;
        break;
      }

      default:
        throw new BadRequestException('Неверное действие');
    }

    const updatedRequest = await this.requestRepository.save(request);

    const requestToNotificationMap = {
      [RequestAction.READ]: undefined,
      [RequestAction.ACCEPT]: NotificationType.ACCEPTED_REQUEST,
      [RequestAction.REJECT]: NotificationType.DECLINED_REQUEST,
    };

    const notificationType = requestToNotificationMap[action];
    if (notificationType) {
      this.notificationsGateway.notifyUser(updatedRequest.receiver.id!, {
        type: notificationType,
        skillName: updatedRequest.requestedSkill.title,
        sender: updatedRequest.sender.name,
      });
    }
    return updatedRequest;
  }

  async remove(id: string, user: JwtPayload) {
    const request = await this.requestRepository.findOneOrFail({
      where: { id },
      relations: ['sender'], //sender(пользователь создавший заявку),
    });

    if (user.role === 'user' && user.sub !== request.sender.id) {
      throw new ForbiddenException(
        `Пользователь не может удалить заявку, созданную другим пользователем`,
      );
    }
    await this.requestRepository.delete(id);
    return { message: `Заявка с id: ${id} успешно удалена` };
  }
}
