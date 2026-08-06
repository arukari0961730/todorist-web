import { Injectable } from '@nestjs/common';
import { TeamRole } from '../generated/prisma/enums';
import { ApiException } from '../common/api-exception';
import { normalizeTeamName } from '../common/utils/normalize';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTeamDto } from './dto/create-team.dto';
import type { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import type { UpdateTeamDto } from './dto/update-team.dto';
import { TeamAccessService } from './team-access.service';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TeamAccessService,
  ) {}

  async list(userId: string) {
    const memberships = await this.prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: { _count: { select: { members: true, tasks: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return {
      items: memberships.map((membership) => ({
        ...this.presentTeam(membership.team),
        role: membership.role,
        membershipId: membership.id,
        memberCount: membership.team._count.members,
        taskCount: membership.team._count.tasks,
      })),
    };
  }

  async create(userId: string, input: CreateTeamDto) {
    const name = input.name.trim();
    const normalizedName = normalizeTeamName(name);
    const timezone = input.timezone ?? 'Asia/Tokyo';
    this.validateTimezone(timezone);

    const team = await this.prisma.$transaction(async (tx) => {
      const created = await tx.team.create({
        data: { name, normalizedName, timezone, createdById: userId },
      });
      await tx.teamMember.create({
        data: { teamId: created.id, userId, role: TeamRole.owner },
      });
      return created;
    });
    return { ...this.presentTeam(team), role: TeamRole.owner };
  }

  async get(teamId: string, userId: string) {
    const membership = await this.access.requireMember(teamId, userId);
    return { ...this.presentTeam(membership.team), role: membership.role };
  }

  async update(teamId: string, userId: string, input: UpdateTeamDto) {
    await this.access.requireOwner(teamId, userId);
    const data: {
      name?: string;
      normalizedName?: string;
      timezone?: string;
      version: { increment: number };
    } = {
      version: { increment: 1 },
    };
    if (input.name !== undefined) {
      data.name = input.name.trim();
      data.normalizedName = normalizeTeamName(data.name);
    }
    if (input.timezone !== undefined) {
      this.validateTimezone(input.timezone);
      data.timezone = input.timezone;
    }
    if (data.name === undefined && data.timezone === undefined) {
      throw new ApiException(
        400,
        'NO_CHANGES',
        '変更する項目を指定してください',
      );
    }

    const result = await this.prisma.team.updateMany({
      where: { id: teamId, version: input.version },
      data,
    });
    if (result.count === 0) this.throwConflict();
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: teamId },
    });
    return this.presentTeam(team);
  }

  async remove(teamId: string, userId: string, version: number): Promise<void> {
    await this.access.requireOwner(teamId, userId);
    const result = await this.prisma.team.deleteMany({
      where: { id: teamId, version },
    });
    if (result.count === 0) this.throwConflict();
  }

  async listMembers(teamId: string, userId: string) {
    await this.access.requireMember(teamId, userId);
    const members = await this.prisma.teamMember.findMany({
      where: { teamId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
    return {
      items: members.map((member) => ({
        id: member.id,
        role: member.role,
        version: member.version,
        createdAt: member.createdAt,
        user: member.user,
      })),
    };
  }

  async updateMemberRole(
    teamId: string,
    memberId: string,
    userId: string,
    input: UpdateMemberRoleDto,
  ) {
    await this.access.requireOwner(teamId, userId);
    return this.prisma.$transaction(async (tx) => {
      const target = await tx.teamMember.findFirst({
        where: { id: memberId, teamId },
      });
      if (!target)
        throw new ApiException(
          404,
          'MEMBER_NOT_FOUND',
          'メンバーが見つかりません',
        );
      if (target.version !== input.version) this.throwConflict();
      if (target.role === TeamRole.owner && input.role === TeamRole.member) {
        const ownerCount = await tx.teamMember.count({
          where: { teamId, role: TeamRole.owner },
        });
        if (ownerCount <= 1) this.throwLastOwner();
      }
      return tx.teamMember.update({
        where: { id: target.id },
        data: { role: input.role, version: { increment: 1 } },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    });
  }

  async removeMember(
    teamId: string,
    memberId: string,
    userId: string,
    version: number,
  ): Promise<void> {
    await this.access.requireOwner(teamId, userId);
    await this.prisma.$transaction(async (tx) => {
      const target = await tx.teamMember.findFirst({
        where: { id: memberId, teamId },
      });
      if (!target)
        throw new ApiException(
          404,
          'MEMBER_NOT_FOUND',
          'メンバーが見つかりません',
        );
      if (target.userId === userId) {
        throw new ApiException(
          400,
          'USE_LEAVE_ENDPOINT',
          '自分の退出操作を使用してください',
        );
      }
      if (target.version !== version) this.throwConflict();
      if (target.role === TeamRole.owner) {
        const ownerCount = await tx.teamMember.count({
          where: { teamId, role: TeamRole.owner },
        });
        if (ownerCount <= 1) this.throwLastOwner();
      }
      await tx.teamMember.delete({ where: { id: target.id } });
    });
  }

  async leave(teamId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const membership = await tx.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId } },
      });
      if (!membership)
        throw new ApiException(404, 'TEAM_NOT_FOUND', 'チームが見つかりません');
      if (membership.role === TeamRole.owner) {
        const ownerCount = await tx.teamMember.count({
          where: { teamId, role: TeamRole.owner },
        });
        if (ownerCount <= 1) this.throwLastOwner();
      }
      await tx.teamMember.delete({ where: { id: membership.id } });
    });
  }

  private validateTimezone(value: string): void {
    try {
      new Intl.DateTimeFormat('ja-JP', { timeZone: value }).format();
    } catch {
      throw new ApiException(
        400,
        'INVALID_TIMEZONE',
        '有効なIANAタイムゾーンを指定してください',
      );
    }
  }

  private presentTeam(team: {
    id: string;
    name: string;
    timezone: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: team.id,
      name: team.name,
      timezone: team.timezone,
      version: team.version,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }

  private throwConflict(): never {
    throw new ApiException(
      409,
      'EDIT_CONFLICT',
      '他のユーザーが先に更新しました。最新の内容を確認してください',
    );
  }

  private throwLastOwner(): never {
    throw new ApiException(
      409,
      'LAST_OWNER_REQUIRED',
      '最後のownerは降格・削除・退出できません',
    );
  }
}
