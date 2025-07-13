import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { validate as isUuid } from 'uuid';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { unlink } from 'node:fs';
import * as path from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from './entities/skill.entity';
import { User } from 'src/users/entities/users.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Skill) private skillRepository: Repository<Skill>,
  ) {}

  async create(userId: string, createSkillDto: CreateSkillDto) {
    return await this.skillRepository.save({
      ...createSkillDto,
      category: { id: createSkillDto.category },
      owner: { id: userId },
      message: 'Навык создан',
    });
  }

  async find(query: { page?: string; limit?: string; search?: string }) {
    const page = Math.max(parseInt(query.page ?? '1'), 1);
    const limit = Math.min(Math.max(parseInt(query.limit ?? '20'), 1), 100);
    const search = (query.search || '').trim().toLowerCase();
    const qb = this.skillRepository
      .createQueryBuilder('skill')
      .leftJoinAndSelect('skill.category', 'category');

    if (search) {
      qb.where('LOWER(skill.title) LIKE :search', { search: `%${search}%` });
    }

    const [skills, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .leftJoinAndSelect('skill.owner', 'owner')
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    if (page > totalPages && totalPages !== 0) {
      throw new NotFoundException('Страница не найдена');
    }

    return {
      data: skills,
      page,
      totalPages,
    };
  }

  async update(userId: string, id: string, updateSkillDto: UpdateSkillDto) {
    const skill = await this.userIsOwner(id, userId);

    const category = updateSkillDto.category
      ? { id: updateSkillDto.category }
      : skill.category;

    return await this.skillRepository.save({
      ...updateSkillDto,
      category,
    });
  }

  async remove(skillId: string, userId: string) {
    if (!isUuid(skillId)) {
      throw new BadRequestException('Некорректный UUID навыка');
    }
    const skill = await this.userIsOwner(skillId, userId);
    skill.images.forEach((image) => {
      const relativePath = image.startsWith('/') ? image.slice(1) : image;
      const absolutePath = path.join(process.cwd(), relativePath);
      unlink(absolutePath, (err) => {
        if (err) {
          throw new BadRequestException('err');
        }
      });
    });
    await this.skillRepository.delete(skillId);
    return { message: `Навык с id ${skillId} удалён у пользователя` };
  }

  async userIsOwner(skillId: string, userId: string) {
    const skill = await this.skillRepository.findOne({
      where: { id: skillId },
      relations: ['owner'],
    });
    if (!skill) throw new NotFoundException('Навык не найден');
    if (skill.owner.id !== userId) {
      throw new ForbiddenException(
        `Пользователь ${userId} пытается обновить навык ${skillId}, которым не владеет`,
      );
    }
    return skill;
  }
}
