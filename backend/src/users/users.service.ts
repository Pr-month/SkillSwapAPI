import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Skill } from 'src/skills/entities/skill.entity';
import { Repository } from 'typeorm';
import { configuration, IConfig } from '../config/configuration';
import { CreateUsersDto } from './dto/create.users.dto';
import { FindAllUsersResponseDto } from './dto/find-all-users-response.dto';
import { FindAllUsersQueryDto } from './dto/find-all-users.dto';
import { UpdateUsersDto } from './dto/update.users.dto';
import { User } from './entities/users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Skill) private skillRepository: Repository<Skill>,
    @Inject(configuration.KEY)
    private readonly config: IConfig,
  ) {}
  async create(createUserDto: CreateUsersDto) {
    const user = (await this.userRepository.save(createUserDto)) as User;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll(query: FindAllUsersQueryDto): Promise<FindAllUsersResponseDto> {
    const page = Math.max(parseInt(query.page ?? '1'), 1);
    const limit = Math.min(Math.max(parseInt(query.limit ?? '20'), 1), 100);
    const search = (query.search || '').trim().toLowerCase();

    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.skills', 'skills');

    if (search) {
      qb.where(
        'LOWER(user.name) LIKE :search OR LOWER(user.email) LIKE :search',
        { search: `%${search}%` },
      );
    }

    const [users, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    if (page > totalPages && totalPages !== 0) {
      throw new NotFoundException('Страница не найдена');
    }

    const usersWithoutPassword = users.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, refreshToken, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return {
      data: usersWithoutPassword,
      page,
      totalPages,
    };
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOneOrFail({
      where: { id },
      relations: ['skills'],
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(id: string, updateUserDto: UpdateUsersDto) {
    await this.userRepository.update(id, updateUserDto);
    const updatedUser = await this.userRepository.findOneOrFail({
      where: { id },
      relations: ['skills', 'skills.category'],
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async updatePassword(id: string, newPassword: string) {
    if (newPassword.length === 0) {
      throw new BadRequestException('Пароль не может быть пустым');
    }
    const hashedPassword = await bcrypt.hash(newPassword, this.config.salt);
    const user = await this.userRepository.findOneByOrFail({ id });
    const updatedUser = await this.userRepository.save({
      ...user,
      password: hashedPassword,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async remove(id: string) {
    await this.userRepository.delete(id);
    return { message: `Пользователь с id ${id} удалён` };
  }

  async findByEmail(email: string) {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async removeRefreshToken(id: string) {
    const user = await this.userRepository.findOneByOrFail({ id });
    user.refreshToken = '';
    await this.userRepository.save(user);
    return { message: `Refresh token для пользователя с id ${id} удален` };
  }

  async addFavoriteSkill(userId: string, skillId: string) {
    const user = await this.userRepository.findOneOrFail({
      where: { id: userId },
      relations: ['favoriteSkills'],
    });

    const skill = await this.skillRepository.findOneOrFail({
      where: { id: skillId },
    });

    if (user.favoriteSkills?.some((s) => s.id === skill.id)) {
      throw new ConflictException('Навык уже в избранном');
    }

    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'favoriteSkills')
      .of(userId)
      .add(skillId);

    return { message: 'Навык добавлен в избранное' };
  }

  async removeFavoriteSkill(userId: string, skillId: string) {
    const user = await this.userRepository.findOneOrFail({
      where: { id: userId },
      relations: ['favoriteSkills'],
    });

    const skill = await this.skillRepository.findOneOrFail({
      where: { id: skillId },
    });

    if (!user.favoriteSkills?.some((s) => s.id === skill.id)) {
      throw new NotFoundException('Навык уже удалён из избранного');
    }

    user.favoriteSkills = user.favoriteSkills.filter((s) => s.id !== skill.id);
    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'favoriteSkills')
      .of(userId)
      .remove(skillId);

    return { message: 'Навык удалён из избранного' };
  }
}
