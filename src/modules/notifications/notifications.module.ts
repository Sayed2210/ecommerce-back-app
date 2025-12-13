import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './services/notification.service';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsGateway } from './services/websocket.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Notification]),
        AuthModule,
    ],
    controllers: [NotificationsController],
    providers: [NotificationService, NotificationsGateway],
    exports: [NotificationService, NotificationsGateway],
})
export class NotificationsModule { }
