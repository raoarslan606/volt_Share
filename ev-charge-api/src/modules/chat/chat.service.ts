import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export const buildConversationId = (
  userA: string,
  userB: string,
  stationId: string,
): string => {
  return [...[userA, userB].sort(), stationId].join(':');
};

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async saveMessage(
    senderId: string,
    receiverId: string,
    stationId: string,
    text: string,
  ) {
    const conversationId = buildConversationId(senderId, receiverId, stationId);
    return this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        receiverId,
        stationId,
        text,
      },
      include: {
        sender: { select: { id: true, name: true } },
      },
    });
  }

  async getMessages(
    requesterId: string,
    userAId: string,
    userBId: string,
    stationId: string,
    cursor?: string,
    limit = 30,
  ) {
    // Security: requester must be a participant
    if (requesterId !== userAId && requesterId !== userBId) {
      throw new ForbiddenException('Access denied to this conversation');
    }

    const conversationId = buildConversationId(userAId, userBId, stationId);

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    return { messages: messages.reverse(), nextCursor: messages[0]?.id ?? null };
  }

  async markRead(requesterId: string, conversationId: string) {
    return this.prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: requesterId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  // Redis-based rate limiting: max 20 messages per 10 seconds per user
  async checkRateLimit(userId: string): Promise<boolean> {
    const key = `chat:ratelimit:${userId}`;
    const count = await this.redisService.incr(key);
    if (count === 1) {
      await this.redisService.expire(key, 10);
    }
    return count <= 20;
  }
}
