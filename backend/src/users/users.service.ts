import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateUsersDto } from './dto/create.users.dto';
import { UpdateUsersDto } from './dto/update.users.dto';
import { User } from './entities/users.entity';
import { ConfigService } from '@nestjs/config';
import { Skill } from 'src/skills/entities/skill.entity';
import { FindUserDTO } from './dto/find.users.dto';

import { logger } from 'src/logger/mainLogger';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { NotificationType } from 'src/notifications/ws-jwt/types';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Skill) private skillRepository: Repository<Skill>,
    private readonly configService: ConfigService,
    private notificationsGateway: NotificationsGateway,
  ) {}
  async create(createUserDto: CreateUsersDto) {
    const user = (await this.userRepository.save(createUserDto)) as User;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll() {
    const users = await this.userRepository.find({
      relations: ['skills'],
    });
    const usersWithoutPassword = users.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, refreshToken, ...userWithoutPassword } = user;
      return userWithoutPassword as FindUserDTO;
    });
    return usersWithoutPassword;
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

  testfindOne(id: string) {
    logger.info(`отправляем сообщение пользователю  ${id}`);
    this.notificationsGateway.notifyUser(id, {
      type: NotificationType.NEW_REQUEST,
      skillName: 'полет',
      sender: '454fgf',
    });
    //return userWithoutPassword;
  }

  async updateUser(id: string, updateUserDto: UpdateUsersDto) {
    const user = await this.userRepository.findOneOrFail({
      where: { id },
      relations: ['skills'],
    });
    const updatedUser = await this.userRepository.save({
      ...user,
      ...updateUserDto,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async updatePassword(id: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(
      newPassword,
      this.configService.get<number>('salt') as number,
    );
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

    if (user.favoriteSkills.some((s) => s.id === skill.id)) {
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

    if (!user.favoriteSkills.some((s) => s.id === skill.id)) {
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
