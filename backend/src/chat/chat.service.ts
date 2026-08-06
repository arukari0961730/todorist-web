import { Injectable } from '@nestjs/common';
import { ApiException } from '../common/api-exception';
import { PrismaService } from '../prisma/prisma.service';
import { TeamAccessService } from '../teams/team-access.service';
import type { CreateChatMessageDto } from './dto/create-chat-message.dto';

const messageInclude = {
  user: { select: { id: true, name: true } },
} as const;

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TeamAccessService,
  ) {}

  async list(teamId: string, userId: string) {
    await this.access.requireMember(teamId, userId);
    const items = await this.prisma.chatMessage.findMany({
      where: { teamId },
      include: messageInclude,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return { items };
  }

  async create(teamId: string, userId: string, input: CreateChatMessageDto) {
    await this.access.requireMember(teamId, userId);
    return this.prisma.chatMessage.create({
      data: { teamId, userId, message: input.message },
      include: messageInclude,
    });
  }

  async remove(messageId: string, userId: string): Promise<void> {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { id: true, teamId: true, userId: true },
    });
    if (!message) {
      throw new ApiException(
        404,
        'CHAT_MESSAGE_NOT_FOUND',
        'チャットメッセージが見つかりません',
      );
    }
    await this.access.requireMember(message.teamId, userId);
    if (message.userId !== userId) {
      throw new ApiException(
        403,
        'CHAT_MESSAGE_DELETE_FORBIDDEN',
        '自分のチャットメッセージだけ削除できます',
      );
    }
    await this.prisma.chatMessage.delete({ where: { id: messageId } });
  }
}
