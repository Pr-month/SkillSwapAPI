import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsGateway } from './notifications.gateway';
import { JwtWsGuard } from './ws-jwt/ws-jwt.guard';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { NotificationType } from './ws-jwt/types';
import { logger } from 'src/logger/mainLogger';

jest.mock('src/logger/mainLogger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

type MockSocket = {
  id: string;
  data: { user?: any };
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
  let jwtGuard: JwtWsGuard;

  const mockServer: MockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    sockets: {
      sockets: new Map<string, Socket>(),
    },
  };

  const mockJwtGuard = {
    verifyToken: jest.fn(),
  };

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
    jwtGuard = module.get<JwtWsGuard>(JwtWsGuard);

    (gateway as any).server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('должен вызывать verifyToken и join room при валидном пользователе', async () => {
      const mockClient: MockSocket = {
        id: 'socket123',
        data: { user: { sub: 'user123' } },
        join: jest.fn(),
        disconnect: jest.fn(),
      };

      mockJwtGuard.verifyToken.mockImplementation((client) => {
        client.data.user = { sub: 'user123' };
        return true;
      });

      await gateway.handleConnection(mockClient as unknown as Socket);

      expect(jwtGuard.verifyToken).toHaveBeenCalledWith(mockClient);
      expect(mockClient.join).toHaveBeenCalledWith('user123');
    });

    it('должен отключать клиента при ошибке verifyToken', async () => {
      const mockClient: MockSocket = {
        id: 'socket123',
        data: {},
        join: jest.fn(),
        disconnect: jest.fn(),
      };

      mockJwtGuard.verifyToken.mockImplementation(() => {
        throw new WsException('Invalid token');
      });

      await gateway.handleConnection(mockClient as unknown as Socket);

      expect(mockClient.disconnect).toHaveBeenCalledWith(true);
    });
  });

  describe('handleDisconnect', () => {
    it('логирует отключение пользователя', () => {
      const mockClient: MockSocket = {
        id: 'socket123',
        data: { user: { sub: 'user456' } },
        join: jest.fn(),
        disconnect: jest.fn(),
      };

      gateway.handleDisconnect(mockClient as unknown as Socket);

      expect(logger.info).toHaveBeenCalledWith(
        `[WS] Клиент socket123(id socket) отключился. Идентификатор пользователя: user456`,
      );
    });
  });

  describe('notifyUser', () => {
    it('вызывает this.server.to().emit с корректными параметрами', () => {
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
