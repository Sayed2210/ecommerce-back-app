import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './services/notification.service';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsGateway } from './services/websocket.gateway';

@Module({
    imports: [
        TypeOrmModule.forFeature([Notification]),
        // AuthModule is needed for JwtService/JwtStrategy usually, assuming JwtService is available globally or via AuthModule
        // If JwtService is in AuthModule and it exports it.
    ],
    controllers: [NotificationsController],
    providers: [NotificationService, NotificationsGateway],
    exports: [NotificationService, NotificationsGateway],
})
export class NotificationsModule { }
