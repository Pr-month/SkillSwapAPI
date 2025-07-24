import { Module } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { StandaloneDatabaseModule } from '../utils/standalone.module';
import { SeedByApp } from '../utils/seedingByApp';
import { User } from '../users/entities/users.entity';
import { users } from './users.data';
import { RegisterDto } from '../auth/dto/register.auth.dto';

@Module({
  imports: [StandaloneDatabaseModule, UsersModule, AuthModule],
})
export class StandaloneAppModule {}

const usersSeed = new SeedByApp(User, StandaloneAppModule, {
  success: 'Данные о пользователях загружены',
});

usersSeed.run(async (app) => {
  const authService = app.get(AuthService);

  await Promise.all(
    users.map((user) => {
      return authService.register(user as RegisterDto);
    }),
  );
});
