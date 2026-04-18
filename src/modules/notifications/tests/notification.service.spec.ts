import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { NotificationRepository } from '../repositories/notification.repository';
import {
  Notification,
  NotificationType,
} from '../entities/notification.entity';
import { CreateNotificationDto } from '../dto/notification.dto';
import { NotificationsGateway } from '../services/websocket.gateway';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepository: Record<string, jest.Mock>;
  let notificationsGateway: Record<string, jest.Mock>;

  beforeEach(async () => {
    notificationRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      remove: jest.fn(),
      markAllReadByUser: jest.fn(),
    };

    notificationsGateway = {
      sendNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: NotificationRepository, useValue: notificationRepository },
        { provide: NotificationsGateway, useValue: notificationsGateway },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create notification and emit real-time event', async () => {
      const dto: CreateNotificationDto = {
        userId: 'u1',
        type: NotificationType.SYSTEM,
        title: 'Test',
      };
      const notification = { id: 'n1', ...dto };
      notificationRepository.create.mockResolvedValue(notification);

      const result = await service.create(dto);
      expect(result).toBe(notification);
      expect(notificationsGateway.sendNotification).toHaveBeenCalledWith(
        'u1',
        notification,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      notificationRepository.findAndCount.mockResolvedValue([[], 0]);
      const result = await service.findAll('u1', { page: 1, limit: 10 });
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should set readAt and save', async () => {
      const notification = { id: 'n1', readAt: null } as any;
      notificationRepository.findOne.mockResolvedValue(notification);
      notificationRepository.save.mockResolvedValue({
        ...notification,
        readAt: new Date(),
      });

      const result = await service.markAsRead('n1');
      expect(result.readAt).toBeDefined();
      expect(notificationRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when notification not found', async () => {
      notificationRepository.findOne.mockResolvedValue(null);
      await expect(service.markAsRead('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should delegate to repository markAllReadByUser', async () => {
      notificationRepository.markAllReadByUser.mockResolvedValue(undefined);
      await service.markAllAsRead('u1');
      expect(notificationRepository.markAllReadByUser).toHaveBeenCalledWith(
        'u1',
      );
    });
  });

  describe('remove', () => {
    it('should find then permanently delete notification', async () => {
      const notification = { id: 'n1' } as Notification;
      notificationRepository.findOneOrFail.mockResolvedValue(notification);
      notificationRepository.remove.mockResolvedValue(notification);

      await service.remove('n1');
      expect(notificationRepository.findOneOrFail).toHaveBeenCalledWith({
        id: 'n1',
      });
      expect(notificationRepository.remove).toHaveBeenCalledWith(notification);
    });

    it('should throw NotFoundException when notification not found', async () => {
      notificationRepository.findOneOrFail.mockRejectedValue(
        new NotFoundException(),
      );
      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
