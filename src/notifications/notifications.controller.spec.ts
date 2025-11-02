import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from '../database/entities/notification.entity';
import { FcmToken } from '../database/entities/fcm-token.entity';
import { NotificationJob } from '../database/entities/notification-job.entity';
import { ConfigService } from '@nestjs/config';

// Integration test example for NotificationsController
describe('NotificationsController Integration', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockNotificationRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };

  const mockFcmTokenRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJobRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: getRepositoryToken(FcmToken),
          useValue: mockFcmTokenRepository,
        },
        {
          provide: getRepositoryToken(NotificationJob),
          useValue: mockJobRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get notifications for user', async () => {
    const mockNotifications = [
      {
        id: '1',
        userId: 'user-1',
        title: 'Test',
        body: 'Test body',
        isRead: false,
        isDeleted: false,
        createdAt: new Date(),
      },
    ];

    mockNotificationRepository.find.mockResolvedValue(mockNotifications);
    mockNotificationRepository.count.mockResolvedValue(1);

    const result = await controller.getNotifications(
      { user: { userId: 'user-1' } } as any,
      50,
      undefined,
    );

    expect(result.status).toBe('success');
    expect(result.data).toHaveProperty('notifications');
    expect(result.data).toHaveProperty('unreadCount');
  });
});

