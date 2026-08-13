import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':userAId/:userBId/:stationId')
  @ApiOperation({ summary: 'Get paginated chat history (cursor-based)' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMessages(
    @CurrentUser() user: User,
    @Param('userAId', ParseUUIDPipe) userAId: string,
    @Param('userBId', ParseUUIDPipe) userBId: string,
    @Param('stationId', ParseUUIDPipe) stationId: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit?: number,
  ) {
    return this.chatService.getMessages(
      user.id,
      userAId,
      userBId,
      stationId,
      cursor,
      limit,
    );
  }

  @Patch(':conversationId/read')
  @ApiOperation({ summary: 'Mark all messages in conversation as read' })
  markRead(
    @CurrentUser() user: User,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatService.markRead(user.id, conversationId);
  }
}
