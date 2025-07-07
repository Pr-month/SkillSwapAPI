import {
  BadRequestException,
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

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request) private requestRepository: Repository<Request>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Skill) private skillRepository: Repository<Skill>,
  ) {}

  async create(senderID: string, createRequestDto: CreateRequestDto) {
    const { offeredSkillId, requestedSkillId } = createRequestDto;

    const offeredSkill = await this.skillRepository.findOneBy({
      id: offeredSkillId,
    });
    const requestedSkill = await this.skillRepository.findOneBy({
      id: requestedSkillId,
    });

    if (offeredSkill == null || requestedSkill == null)
      throw new BadRequestException(
        `Предлагаемый / запрашиваемый навык не существует`,
      );

    const senderId = offeredSkill.owner.id;
    const receiverId = requestedSkill.owner.id;

    if (senderID !== senderId)
      throw new BadRequestException(
        `Заявка сгенерирована не от имени авторизированного пользователя`,
      );
    const sender = await this.userRepository.findOneBy({ id: senderId });
    const receiver = await this.userRepository.findOneBy({ id: receiverId });
    if (sender == null)
      throw new BadRequestException(
        `Заявка сгенерирована  несуществующим пользователем`,
      );

    if (receiver == null)
      throw new BadRequestException(
        `Заявка адресована  несуществующему пользователю`,
      );

    const senderHasOfferedSkill = sender.skills.some(
      (skill) => skill.id === offeredSkillId,
    );

    if (!senderHasOfferedSkill) {
      throw new BadRequestException(
        `Авторизированный пользователь не обладает предлагаемым навыком.`,
      );
    }

    const receiverHasRequestedSkill = receiver.skills.some(
      (skill) => skill.id === requestedSkillId,
    );

    if (!receiverHasRequestedSkill) {
      throw new BadRequestException(
        `Получатель не обладает запрашиваемым навыком.`,
      );
    }

    const newRequest = new Request();

    newRequest.sender = sender;
    newRequest.receiver = receiver;
    newRequest.offeredSkill = offeredSkill;
    newRequest.requestedSkill = requestedSkill;

    return await this.requestRepository.save(newRequest);
  }

  async findAll(
    senderID: string,
    query: {
      type?: RequestType;
      status?: RequestStatus;
      isRead?: boolean;
      page?: string;
      limit?: string;
    },
  ) {
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

  findOne(id: string) {
    return `This action returns a #${id} request`;
  }

  async update(id: string, dto: UpdateRequestDto) {
    const request = await this.requestRepository.findOneOrFail({
      where: { id },
      relations: ['sender', 'receiver', 'offeredSkill', 'requestedSkill'],
    });

    const action = dto.action;

    switch (action) {
      case RequestAction.READ: {
        request.isRead = true;
        break;
      }

      case RequestAction.ACCEPT: {
        request.status = RequestStatus.ACCEPTED;
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
        request.status =
          request.status === RequestStatus.PENDING
            ? RequestStatus.REJECTED
            : RequestStatus.PENDING;
        break;
      }

      default:
        throw new BadRequestException('Неверное действие');
    }

    return await this.requestRepository.save(request);
  }

  remove(id: string) {
    return `This action removes a #${id} request`;
  }
}
