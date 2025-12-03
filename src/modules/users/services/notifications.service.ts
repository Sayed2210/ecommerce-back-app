import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '@modules/notifications/entities/notification.entity';

@Injectable()
export class UserNotificationsService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
    ) { }

    async getUserNotifications(userId: string, page = 1, limit = 20) {
        const [notifications, total] = await this.notificationRepository.findAndCount({
            where: { user: { id: userId }, isDeleted: false },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            data: notifications,
            total,
            page,
            limit,
            unreadCount: notifications.filter(n => !n.isRead).length,
        };
    }

    async markAsRead(notificationId: string, userId: string) {
        await this.notificationRepository.update(
            { id: notificationId, user: { id: userId } },
            { isRead: true },
        );
    }

    async markAllAsRead(userId: string) {
        await this.notificationRepository.update(
            { user: { id: userId }, isRead: false },
            { isRead: true },
        );
    }
}