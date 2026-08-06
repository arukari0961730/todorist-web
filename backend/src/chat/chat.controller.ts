import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';

@Controller()
@UseGuards(SessionAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('teams/:teamId/messages')
  list(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chat.list(teamId, user.id);
  }

  @Post('teams/:teamId/messages')
  create(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateChatMessageDto,
  ) {
    return this.chat.create(teamId, user.id, input);
  }

  @Delete('messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chat.remove(messageId, user.id);
  }
}
