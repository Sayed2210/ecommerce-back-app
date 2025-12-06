import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean, IsObject, IsUrl } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
    @IsEnum(NotificationType)
    @IsNotEmpty()
    type: NotificationType;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    message?: string;

    @IsUrl()
    @IsOptional()
    actionUrl?: string;

    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;

    @IsString()
    @IsNotEmpty()
    userId: string;
}

export class NotificationDto extends CreateNotificationDto { }

export class UpdateNotificationDto {
    @IsBoolean()
    @IsOptional()
    isRead?: boolean;

    @IsBoolean()
    @IsOptional()
    isDeleted?: boolean;
}
