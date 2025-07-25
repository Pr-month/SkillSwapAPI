import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import { CreateNotificationDto } from './ws-jwt/types';
import { NotificationsGateway } from './notifications.gateway';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationsGateway: NotificationsGateway) {}

  @Post('test-create')
  @ApiBody({ type: CreateNotificationDto })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    this.notificationsGateway.notifyUser(createNotificationDto.recipientId, {
      type: createNotificationDto.type,
      skillName: createNotificationDto.skillName,
      sender: createNotificationDto.sender,
    });

    return {
      message: 'Уведоление успешно отправлено',
      recipientId: createNotificationDto.recipientId,
      payload: {
        type: createNotificationDto.type,
        skillName: createNotificationDto.skillName,
        sender: createNotificationDto.sender,
      },
    };
  }
}
