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
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller()
@UseGuards(SessionAuthGuard)
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get('tasks/:taskId/comments')
  list(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.comments.list(taskId, user.id);
  }

  @Post('tasks/:taskId/comments')
  create(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateCommentDto,
  ) {
    return this.comments.create(taskId, user.id, input);
  }

  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.comments.remove(commentId, user.id);
  }
}
