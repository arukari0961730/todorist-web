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
import { SessionAuthGuard } from '../auth/session-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationsService } from './invitations.service';

@Controller()
@UseGuards(SessionAuthGuard)
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Get('teams/:teamId/invitations')
  list(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invitations.list(teamId, user.id);
  }

  @Post('teams/:teamId/invitations')
  create(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateInvitationDto,
  ) {
    return this.invitations.create(teamId, user.id, input.email);
  }

  @Delete('teams/:teamId/invitations/:invitationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invitations.revoke(teamId, invitationId, user.id);
  }

  @Post('invitations/:token/accept')
  accept(
    @Param('token') token: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invitations.accept(token, user);
  }
}
