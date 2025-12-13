import { WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { JwtService } from '@nestjs/jwt';
import { NotificationDto } from '../dto/notification.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
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
    client.leave(`user:${client.handshake.auth.userId}`);
  }



  // Method to be called from other services
  sendNotification(userId: string, notification: NotificationDto) {
    this.server.to(`user:${userId}`).emit('newNotification', notification);
  }

  sendCartUpdate(userId: string, cart: any) {
    this.server.to(`user:${userId}`).emit('cart_updated', cart);
  }
}