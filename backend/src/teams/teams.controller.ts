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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { VersionQueryDto } from './dto/version-query.dto';
import { TeamsService } from './teams.service';

@Controller('teams')
@UseGuards(SessionAuthGuard)
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.teams.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateTeamDto) {
    return this.teams.create(user.id, input);
  }

  @Get(':teamId')
  get(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teams.get(teamId, user.id);
  }

  @Patch(':teamId')
  update(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdateTeamDto,
  ) {
    return this.teams.update(teamId, user.id, input);
  }

  @Delete(':teamId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: VersionQueryDto,
  ) {
    return this.teams.remove(teamId, user.id, query.version);
  }

  @Get(':teamId/members')
  listMembers(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teams.listMembers(teamId, user.id);
  }

  @Patch(':teamId/members/:memberId')
  updateMember(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdateMemberRoleDto,
  ) {
    return this.teams.updateMemberRole(teamId, memberId, user.id, input);
  }

  @Delete(':teamId/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: VersionQueryDto,
  ) {
    return this.teams.removeMember(teamId, memberId, user.id, query.version);
  }

  @Post(':teamId/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  leave(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teams.leave(teamId, user.id);
  }
}
