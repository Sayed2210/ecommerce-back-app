import { Injectable, NotFoundException } from '@nestjs/common';
import { Notification } from '../entities/notification.entity';
import { CreateNotificationDto } from '../dto/notification.dto';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { PaginatedResponseDto } from '../../../common/dtos/paginated-response.dto';
import {
  NotificationSocketDto,
  NotificationsGateway,
} from './websocket.gateway';
import { Inject, forwardRef } from '@nestjs/common';
import { NotificationRepository } from '../repositories/notification.repository';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const savedNotification = await this.notificationRepository.create({
      ...createNotificationDto,
      data: createNotificationDto.metadata || {},
      user: { id: createNotificationDto.userId },
    });

    // Emit real-time event
    this.notificationsGateway.sendNotification(
      createNotificationDto.userId,
      this.toSocketDto(savedNotification, createNotificationDto.userId),
    );

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

    return new PaginatedResponseDto(data, page, limit, total);
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      id,
      user: { id: userId },
    } as any);
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.markAllReadByUser(userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOneOrFail({
      id,
      user: { id: userId },
    } as any);
    await this.notificationRepository.remove(notification);
  }

  private toSocketDto(
    notification: Notification,
    userId: string,
  ): NotificationSocketDto {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
      data: notification.data,
      readAt: notification.readAt,
      userId,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}
