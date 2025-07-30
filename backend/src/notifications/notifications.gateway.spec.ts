import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsGateway } from './notifications.gateway';
import { JwtWsGuard } from './ws-jwt/ws-jwt.guard';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { NotificationType } from './ws-jwt/types';
import { logger } from 'src/logger/mainLogger';
import { JwtPayload } from 'src/auth/types';

jest.mock('src/logger/mainLogger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

type SocketUserData = {
  user: JwtPayload;
};

type TypedSocket = Socket<
  Record<string, unknown>,
  Record<string, unknown>,
  Record<string, unknown>,
  SocketUserData
>;

type MockSocket = {
  id: string;
  data: SocketUserData;
  join: jest.Mock<void, [string]>;
  disconnect: jest.Mock<void, [boolean?]>;
};

type MockServer = {
  to: jest.Mock<MockServer, [string]>;
  emit: jest.Mock<void, [string, any]>;
  sockets: {
    sockets: Map<string, Socket>;
  };
};

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;

  const mockServer: MockServer = {
    to: jest.fn<MockServer, [string]>().mockReturnThis(),
    emit: jest.fn<void, [string, any]>(),
    sockets: {
      sockets: new Map<string, Socket>(),
    },
  };

  const mockVerifyToken = jest.fn<boolean, [TypedSocket]>();

  const mockJwtGuard: JwtWsGuard = {
    verifyToken: mockVerifyToken,
  } as unknown as JwtWsGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        {
          provide: JwtWsGuard,
          useValue: mockJwtGuard,
        },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);

    (gateway as unknown as { server: MockServer }).server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('вызывает verifyToken и join room при валидном пользователе', async () => {
      const mockClient: MockSocket = {
        id: 'socket123',
        data: {
          user: {
            sub: 'user123',
            email: 'test@test.com',
            role: 'user',
          },
        },
        disconnect: jest.fn<void, [boolean?]>(),
        join: jest.fn<void, [string]>(),
      };

      mockVerifyToken.mockImplementation(() => true);

      await gateway.handleConnection(mockClient as unknown as TypedSocket);

      expect(mockVerifyToken).toHaveBeenCalledWith(
        mockClient as unknown as TypedSocket,
      );
      expect(mockClient.join).toHaveBeenCalledWith('user123');
    });

    it('отключает клиента при ошибке verifyToken', async () => {
      const mockClient: MockSocket = {
        id: 'socket123',
        data: {
          user: {
            sub: 'user456',
            email: 't@t.t',
            role: 'user',
          },
        },
        disconnect: jest.fn<void, [boolean?]>(),
        join: jest.fn<void, [string]>(),
      };

      mockVerifyToken.mockImplementation(() => {
        throw new WsException('Invalid token');
      });

      await gateway.handleConnection(mockClient as unknown as TypedSocket);

      expect(mockClient.disconnect).toHaveBeenCalledWith(true);
    });
  });

  describe('handleDisconnect', () => {
    it('логирует отключение пользователя', () => {
      const mockClient: MockSocket = {
        id: 'socket123',
        data: {
          user: {
            sub: 'user456',
            email: 't@t.t',
            role: 'user',
          },
        },
        disconnect: jest.fn<void, [boolean?]>(),
        join: jest.fn<void, [string]>(),
      };

      gateway.handleDisconnect(mockClient as unknown as TypedSocket);

      expect(logger.info).toHaveBeenCalledWith(
        `[WS] Клиент socket123(id socket) отключился. Идентификатор пользователя: user456`,
      );
    });
  });

  describe('notifyUser', () => {
    it('вызывает server.to().emit с правильными параметрами', () => {
      const payload = {
        type: NotificationType.NEW_REQUEST,
        skillName: 'JavaScript',
        sender: 'Alice',
      };

      gateway.notifyUser('user123', payload);

      expect(mockServer.to).toHaveBeenCalledWith('user123');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'notificateNewRequest',
        payload,
      );
    });
  });
});
