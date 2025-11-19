import { WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { NotificationService } from '../services/notification.service';
import { JwtService } from '@nestjs/jwt';
import { NotificationDto } from '../dto/notification.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private notificationService: NotificationService,
    private jwtService: JwtService,
  ) { }

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.headers.authorization?.split(' ')[1];
      const payload = this.jwtService.verify(token);
      client.join(`user:${payload.sub}`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Cleanup
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(client: Socket, data: { notificationId: string }) {
    const token = client.handshake.headers.authorization?.split(' ')[1];
    const payload = this.jwtService.verify(token);

    await this.notificationService.markAsRead(data.notificationId, payload.sub);

    client.emit('notificationRead', { notificationId: data.notificationId });
  }

  // Method to be called from other services
  sendNotification(userId: string, notification: NotificationDto) {
    this.server.to(`user:${userId}`).emit('newNotification', notification);
  }
}