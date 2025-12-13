import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { Notification, NotificationType } from '../entities/notification.entity';
import { CreateNotificationDto } from '../dto/notification.dto';

import { NotificationsGateway } from '../services/websocket.gateway';

describe('NotificationService', () => {
    let service: NotificationService;
    let notificationRepository: Record<string, jest.Mock>;
    let notificationsGateway: Record<string, jest.Mock>;
    let queryBuilder: any;

    beforeEach(async () => {
        queryBuilder = {
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            execute: jest.fn(),
        };

        notificationRepository = {
            create: jest.fn(),
            save: jest.fn(),
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
        };

        notificationsGateway = {
            sendNotification: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationService,
                { provide: getRepositoryToken(Notification), useValue: notificationRepository },
                { provide: NotificationsGateway, useValue: notificationsGateway },
            ],
        }).compile();

        service = module.get<NotificationService>(NotificationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create notification', async () => {
            const dto: CreateNotificationDto = { userId: 'u1', type: NotificationType.SYSTEM, title: 'Test' };
            const notification = { id: 'n1', ...dto };
            notificationRepository.create.mockReturnValue(notification);
            notificationRepository.save.mockResolvedValue(notification);

            const result = await service.create(dto);
            expect(result).toBe(notification);
            expect(notificationsGateway.sendNotification).toHaveBeenCalledWith('u1', notification);
        });
    });

    describe('findAll', () => {
        it('should return paginated notifications', async () => {
            notificationRepository.findAndCount.mockResolvedValue([[], 0]);
            const result = await service.findAll('u1', { page: 1, limit: 10 });
            expect(result.data).toEqual([]);
        });
    });

    describe('markAsRead', () => {
        it('should mark as read', async () => {
            const notification = { id: 'n1', readAt: null };
            notificationRepository.findOne.mockResolvedValue(notification);
            notificationRepository.save.mockResolvedValue({ ...notification, readAt: new Date() });

            const result = await service.markAsRead('n1');
            expect(result.readAt).toBeDefined();
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all as read', async () => {
            await service.markAllAsRead('u1');
            expect(notificationRepository.createQueryBuilder).toHaveBeenCalled();
            expect(queryBuilder.update).toHaveBeenCalled();
            expect(queryBuilder.execute).toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        it('should hard delete', async () => {
            const notification = { id: 'n1' };
            notificationRepository.findOne.mockResolvedValue(notification);

            await service.remove('n1');
            expect(notificationRepository.remove).toHaveBeenCalledWith(notification);
        });
    });
});
