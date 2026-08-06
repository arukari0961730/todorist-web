import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { ApiException } from '../common/api-exception';
import { normalizeEmail } from '../common/utils/normalize';
import { PrismaService } from '../prisma/prisma.service';
import { TeamAccessService } from './team-access.service';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TeamAccessService,
  ) {}

  async list(teamId: string, userId: string) {
    await this.access.requireOwner(teamId, userId);
    const invitations = await this.prisma.teamInvitation.findMany({
      where: { teamId, expiresAt: { gt: new Date() } },
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return {
      items: invitations.map((invitation) => ({
        id: invitation.id,
        teamId: invitation.teamId,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        createdBy: invitation.createdBy,
      })),
    };
  }

  async create(teamId: string, userId: string, rawEmail: string) {
    await this.access.requireOwner(teamId, userId);
    const email = normalizeEmail(rawEmail);
    const invitedUser = await this.prisma.user.findUnique({ where: { email } });
    if (invitedUser) {
      const existingMember = await this.prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: invitedUser.id } },
      });
      if (existingMember) {
        throw new ApiException(
          409,
          'ALREADY_MEMBER',
          'このユーザーはすでにチームへ参加しています',
        );
      }
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invitation = await this.prisma.teamInvitation.upsert({
      where: { teamId_email: { teamId, email } },
      create: { teamId, email, tokenHash, expiresAt, createdById: userId },
      update: {
        tokenHash,
        expiresAt,
        createdById: userId,
        createdAt: new Date(),
      },
    });
    return {
      id: invitation.id,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
      token,
    };
  }

  async revoke(
    teamId: string,
    invitationId: string,
    userId: string,
  ): Promise<void> {
    await this.access.requireOwner(teamId, userId);
    const result = await this.prisma.teamInvitation.deleteMany({
      where: { id: invitationId, teamId },
    });
    if (result.count === 0) {
      throw new ApiException(
        404,
        'INVITATION_NOT_FOUND',
        '招待が見つかりません',
      );
    }
  }

  async accept(token: string, user: { id: string; email: string }) {
    const invitation = await this.prisma.teamInvitation.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: { team: true },
    });
    if (!invitation || invitation.expiresAt.getTime() <= Date.now()) {
      throw new ApiException(
        404,
        'INVITATION_NOT_FOUND',
        '招待が無効または期限切れです',
      );
    }
    if (invitation.email !== normalizeEmail(user.email)) {
      throw new ApiException(
        403,
        'INVITATION_EMAIL_MISMATCH',
        '招待されたメールアドレスでログインしてください',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.teamMember.upsert({
        where: {
          teamId_userId: { teamId: invitation.teamId, userId: user.id },
        },
        create: { teamId: invitation.teamId, userId: user.id },
        update: {},
      });
      await tx.teamInvitation.delete({ where: { id: invitation.id } });
    });
    return { id: invitation.team.id, name: invitation.team.name };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
