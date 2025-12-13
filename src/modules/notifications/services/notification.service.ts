import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { CreateNotificationDto } from '../dto/notification.dto';
import { PaginationDto } from '../../../common/dtos/pagination.dto';

import { NotificationsGateway } from './websocket.gateway';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class NotificationService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
        @Inject(forwardRef(() => NotificationsGateway))
        private readonly notificationsGateway: NotificationsGateway,
    ) { }

    async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
        const notification = this.notificationRepository.create({
            ...createNotificationDto,
            data: createNotificationDto.metadata || {}, // Map metadata to data if needed
            user: { id: createNotificationDto.userId },
        });
        const savedNotification = await this.notificationRepository.save(notification);

        // Emit real-time event
        this.notificationsGateway.sendNotification(createNotificationDto.userId, savedNotification as any);

        return savedNotification;
    }

    async findAll(userId: string, pagination: PaginationDto) {
        const { page = 1, limit = 10 } = pagination;
        const [data, total] = await this.notificationRepository.findAndCount({
            where: { user: { id: userId } },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, total, page, limit };
    }

    async markAsRead(id: string, userId?: string): Promise<Notification> {
        const where: any = { id };
        if (userId) {
            where.user = { id: userId };
        }
        const notification = await this.notificationRepository.findOne({ where });
        if (!notification) {
            throw new NotFoundException(`Notification with ID ${id} not found`);
        }
        notification.readAt = new Date();
        return this.notificationRepository.save(notification);
    }

    async markAllAsRead(userId: string): Promise<void> {
        // TypeORM update with relation might require query builder or simple where id IN...
        // Assuming simple update works on columns, but relation filter in update?
        // update({ user: { id: userId }, readAt: IsNull() }, { readAt: new Date() })
        // TypeORM update syntax: conditions, partialEntity.
        await this.notificationRepository.createQueryBuilder()
            .update(Notification)
            .set({ readAt: new Date() })
            .where('user_id = :userId', { userId })
            .andWhere('read_at IS NULL')
            .execute();
    }

    async remove(id: string): Promise<void> {
        const notification = await this.notificationRepository.findOne({ where: { id } });
        if (!notification) {
            throw new NotFoundException(`Notification with ID ${id} not found`);
        }
        await this.notificationRepository.remove(notification);
    }
}
