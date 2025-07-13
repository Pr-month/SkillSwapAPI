import { Socket } from 'socket.io';
import { JwtPayload } from 'src/auth/types';

export interface SocketWithUser extends Socket {
  data: {
    user: JwtPayload;
  };
}

export enum NotificationType {
  NEW_REQUEST = 'new_request',
  ACCEPTED_REQUEST = 'accepted_request',
  DECLINED_REQUEST = 'declined_request',
}
