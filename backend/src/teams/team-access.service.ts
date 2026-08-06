import { Injectable } from '@nestjs/common';
import { TeamRole } from '../generated/prisma/enums';
import { ApiException } from '../common/api-exception';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async requireMember(teamId: string, userId: string) {
    const membership = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
      include: { team: true },
    });
    if (!membership) {
      throw new ApiException(404, 'TEAM_NOT_FOUND', 'チームが見つかりません');
    }
    return membership;
  }

  async requireOwner(teamId: string, userId: string) {
    const membership = await this.requireMember(teamId, userId);
    if (membership.role !== TeamRole.owner) {
      throw new ApiException(403, 'OWNER_REQUIRED', 'owner権限が必要です');
    }
    return membership;
  }
}
