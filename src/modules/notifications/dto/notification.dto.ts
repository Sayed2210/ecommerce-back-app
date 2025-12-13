import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean, IsObject, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
    @ApiProperty({ enum: NotificationType, example: NotificationType.SYSTEM, description: 'Type of notification' })
    @IsEnum(NotificationType)
    @IsNotEmpty()
    type: NotificationType;

    @ApiProperty({ example: 'New Order', description: 'Notification title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: 'You have a new order #123', description: 'Notification message', required: false })
    @IsString()
    @IsOptional()
    message?: string;

    @ApiProperty({ example: '/orders/123', description: 'Action URL', required: false })
    @IsUrl()
    @IsOptional()
    actionUrl?: string;

    @ApiProperty({ example: { orderId: '123' }, description: 'Additional metadata', required: false })
    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;

    @ApiProperty({ example: 'user-uuid', description: 'User ID' })
    @IsString()
    @IsNotEmpty()
    userId: string;
}

export class NotificationDto extends CreateNotificationDto { }

export class UpdateNotificationDto {
    @ApiProperty({ example: true, description: 'Is notification read?', required: false })
    @IsBoolean()
    @IsOptional()
    isRead?: boolean;

    @ApiProperty({ example: false, description: 'Is notification deleted?', required: false })
    @IsBoolean()
    @IsOptional()
    isDeleted?: boolean;
}
