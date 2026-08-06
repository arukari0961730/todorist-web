import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { VersionQueryDto } from '../teams/dto/version-query.dto';
import { CreatePullRequestDto } from './dto/create-pull-request.dto';
import { UpdatePullRequestDto } from './dto/update-pull-request.dto';
import { PullRequestsService } from './pull-requests.service';

@Controller()
@UseGuards(SessionAuthGuard)
export class PullRequestsController {
  constructor(private readonly pullRequests: PullRequestsService) {}

  @Get('teams/:teamId/pull-requests')
  list(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pullRequests.list(teamId, user.id);
  }

  @Post('teams/:teamId/pull-requests')
  create(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreatePullRequestDto,
  ) {
    return this.pullRequests.create(teamId, user.id, input);
  }

  @Patch('pull-requests/:shareId')
  update(
    @Param('shareId', ParseUUIDPipe) shareId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdatePullRequestDto,
  ) {
    return this.pullRequests.update(shareId, user.id, input);
  }

  @Delete('pull-requests/:shareId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('shareId', ParseUUIDPipe) shareId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: VersionQueryDto,
  ) {
    return this.pullRequests.remove(shareId, user.id, query.version);
  }
}
