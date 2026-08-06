import { Injectable } from '@nestjs/common';
import { Prisma, PullRequestStatus } from '../generated/prisma/client';
import { ApiException } from '../common/api-exception';
import { PrismaService } from '../prisma/prisma.service';
import { TeamAccessService } from '../teams/team-access.service';
import type { CreatePullRequestDto } from './dto/create-pull-request.dto';
import type { UpdatePullRequestDto } from './dto/update-pull-request.dto';

const shareInclude = {
  task: { select: { id: true, title: true } },
  assignee: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.PullRequestShareInclude;

@Injectable()
export class PullRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TeamAccessService,
  ) {}

  async list(teamId: string, userId: string) {
    await this.access.requireMember(teamId, userId);
    const items = await this.prisma.pullRequestShare.findMany({
      where: { teamId },
      include: shareInclude,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    return { items };
  }

  async create(teamId: string, userId: string, input: CreatePullRequestDto) {
    await this.access.requireMember(teamId, userId);
    await this.validateRelations(teamId, input.assigneeId, input.taskId);
    return this.prisma.pullRequestShare.create({
      data: {
        teamId,
        createdById: userId,
        title: input.title,
        url: input.url,
        assigneeId: input.assigneeId ?? null,
        taskId: input.taskId ?? null,
        status: input.status ?? PullRequestStatus.draft,
        memo: input.memo ?? null,
      },
      include: shareInclude,
    });
  }

  async update(shareId: string, userId: string, input: UpdatePullRequestDto) {
    const current = await this.prisma.pullRequestShare.findUnique({
      where: { id: shareId },
    });
    if (!current) this.throwNotFound();
    await this.access.requireMember(current.teamId, userId);
    await this.validateRelations(
      current.teamId,
      input.assigneeId,
      input.taskId,
    );

    const data: Prisma.PullRequestShareUncheckedUpdateManyInput = {
      version: { increment: 1 },
    };
    if (input.title !== undefined) data.title = input.title;
    if (input.url !== undefined) data.url = input.url;
    if (input.assigneeId !== undefined) data.assigneeId = input.assigneeId;
    if (input.taskId !== undefined) data.taskId = input.taskId;
    if (input.status !== undefined) data.status = input.status;
    if (input.memo !== undefined) data.memo = input.memo;
    if (Object.keys(data).length === 1) {
      throw new ApiException(
        400,
        'NO_CHANGES',
        '変更する項目を指定してください',
      );
    }
    const result = await this.prisma.pullRequestShare.updateMany({
      where: { id: shareId, version: input.version },
      data,
    });
    if (result.count === 0) this.throwConflict();
    return this.prisma.pullRequestShare.findUniqueOrThrow({
      where: { id: shareId },
      include: shareInclude,
    });
  }

  async remove(
    shareId: string,
    userId: string,
    version: number,
  ): Promise<void> {
    const current = await this.prisma.pullRequestShare.findUnique({
      where: { id: shareId },
      select: { id: true, teamId: true },
    });
    if (!current) this.throwNotFound();
    await this.access.requireMember(current.teamId, userId);
    const result = await this.prisma.pullRequestShare.deleteMany({
      where: { id: shareId, version },
    });
    if (result.count === 0) this.throwConflict();
  }

  private async validateRelations(
    teamId: string,
    assigneeId?: string | null,
    taskId?: string | null,
  ): Promise<void> {
    if (assigneeId) {
      const member = await this.prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: assigneeId } },
      });
      if (!member) {
        throw new ApiException(
          400,
          'INVALID_ASSIGNEE',
          '担当者は同じチームのメンバーから選択してください',
        );
      }
    }
    if (taskId) {
      const task = await this.prisma.task.findFirst({
        where: { id: taskId, teamId },
        select: { id: true },
      });
      if (!task) {
        throw new ApiException(
          400,
          'INVALID_TASK',
          '関連タスクは同じチームのタスクから選択してください',
        );
      }
    }
  }

  private throwNotFound(): never {
    throw new ApiException(
      404,
      'PULL_REQUEST_SHARE_NOT_FOUND',
      'Pull Request共有が見つかりません',
    );
  }

  private throwConflict(): never {
    throw new ApiException(
      409,
      'EDIT_CONFLICT',
      '他のユーザーが先に更新しました。最新の内容を確認してください',
    );
  }
}
