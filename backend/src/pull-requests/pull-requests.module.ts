import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TeamsModule } from '../teams/teams.module';
import { PullRequestsController } from './pull-requests.controller';
import { PullRequestsService } from './pull-requests.service';

@Module({
  imports: [AuthModule, TeamsModule],
  controllers: [PullRequestsController],
  providers: [PullRequestsService],
})
export class PullRequestsModule {}
