import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { JwtService } from '@nestjs/jwt';

type JwtPayload = {
  sub?: string;
};

export type NotificationSocketDto = {
  id: string;
  type: string;
  title: string;
  message?: string;
  actionUrl?: string;
  data: Record<string, unknown>;
  readAt?: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

@WebSocketGateway({
  cors: {
    origin: [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001',
    ].filter(Boolean),
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}

  handleConnection(client: Socket) {
    try {
      const authorization = client.handshake.headers.authorization;
      const token = authorization?.startsWith('Bearer ')
        ? authorization.slice(7)
        : undefined;

      if (!token) {
        throw new Error('Missing token');
      }

      const payload = this.jwtService.verify<JwtPayload>(token);
      if (!payload?.sub) {
        throw new Error('Invalid token payload');
      }

      client.data.userId = payload.sub;
      void client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      void client.leave(`user:${userId}`);
    }
  }

  sendNotification(userId: string, notification: NotificationSocketDto) {
    this.server.to(`user:${userId}`).emit('newNotification', notification);
  }

  sendCartUpdate(userId: string, cart: object) {
    this.server.to(`user:${userId}`).emit('cart_updated', cart);
  }
}
