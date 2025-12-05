import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './services/notification.service';
import { NotificationsController } from './controllers/notifications.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Notification])],
    controllers: [NotificationsController],
    providers: [NotificationService],
    exports: [NotificationService],
})
export class NotificationsModule { }
