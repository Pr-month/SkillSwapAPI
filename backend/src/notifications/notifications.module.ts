import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { JwtWsGuard } from './ws-jwt/ws-jwt.guard';
import { NotificationController } from './notifications.controller';

@Module({
  providers: [NotificationsGateway, JwtWsGuard],
  controllers: [NotificationController],
  exports: [NotificationsGateway],
})
export class NotificationsModule {}
