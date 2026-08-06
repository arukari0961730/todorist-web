import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { TeamAccessService } from './team-access.service';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  imports: [AuthModule],
  controllers: [TeamsController, InvitationsController],
  providers: [TeamsService, InvitationsService, TeamAccessService],
  exports: [TeamAccessService],
})
export class TeamsModule {}
