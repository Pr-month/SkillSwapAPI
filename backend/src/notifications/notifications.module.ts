import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { JwtWsGuard } from './ws-jwt/ws-jwt.guard';

@Module({
  providers: [NotificationsGateway, JwtWsGuard],
  exports: [NotificationsGateway],
})
export class NotificationsModule {}
