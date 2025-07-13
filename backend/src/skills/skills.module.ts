import { forwardRef, Module } from '@nestjs/common';
import { SkillsService } from './skills.service';
import { SkillsController } from './skills.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Skill } from './entities/skill.entity';
import { User } from 'src/users/entities/users.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Skill, User]),
    forwardRef(() => UsersModule),
  ],
  exports: [TypeOrmModule],
  controllers: [SkillsController],
  providers: [SkillsService],
})
export class SkillsModule {}
