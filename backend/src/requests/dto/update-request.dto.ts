import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RequestAction } from '../enums';

export class UpdateRequestDto {
  @ApiProperty({
    description: 'Действие с заявкой: прочитать, принять или отклонить',
    enum: RequestAction,
    example: RequestAction.ACCEPT,
  })
  @IsEnum(RequestAction, {
    message: 'action должно быть одним из: read, accept, reject',
  })
  action: RequestAction;
}
