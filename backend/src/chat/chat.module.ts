import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TeamsModule } from '../teams/teams.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [AuthModule, TeamsModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
