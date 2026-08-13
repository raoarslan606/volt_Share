import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        client.emit('error', { message: 'No token provided' });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      client.userId = payload.sub;
      // Auto-join personal room for receiving messages
      client.join(`user:${payload.sub}`);
      this.logger.log(`Client connected: ${payload.sub}`);
    } catch {
      client.emit('error', { message: 'Invalid token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.userId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    payload: { receiverId: string; stationId: string; text: string },
  ) {
    if (!client.userId) {
      throw new WsException('Unauthorized');
    }

    // Validate text
    const text = payload.text?.trim();
    if (!text || text.length < 1 || text.length > 2000) {
      throw new WsException('Message must be 1-2000 characters');
    }

    // Rate limit check
    const allowed = await this.chatService.checkRateLimit(client.userId);
    if (!allowed) {
      throw new WsException('Rate limit exceeded: max 20 messages per 10 seconds');
    }

    // Always use server-side senderId — never trust client
    const message = await this.chatService.saveMessage(
      client.userId,
      payload.receiverId,
      payload.stationId,
      text,
    );

    // Emit to receiver's room
    this.server.to(`user:${payload.receiverId}`).emit('receiveMessage', message);

    // Confirm to sender
    client.emit('messageSent', message);

    return message;
  }
}
