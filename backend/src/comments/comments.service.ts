import { Injectable } from '@nestjs/common';
import { ApiException } from '../common/api-exception';
import { PrismaService } from '../prisma/prisma.service';
import { TeamAccessService } from '../teams/team-access.service';
import type { CreateCommentDto } from './dto/create-comment.dto';

const commentInclude = {
  user: { select: { id: true, name: true } },
} as const;

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TeamAccessService,
  ) {}

  async list(taskId: string, userId: string) {
    await this.requireTaskMember(taskId, userId);
    const items = await this.prisma.taskComment.findMany({
      where: { taskId },
      include: commentInclude,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return { items };
  }

  async create(taskId: string, userId: string, input: CreateCommentDto) {
    await this.requireTaskMember(taskId, userId);
    return this.prisma.taskComment.create({
      data: { taskId, userId, message: input.message },
      include: commentInclude,
    });
  }

  async remove(commentId: string, userId: string): Promise<void> {
    const comment = await this.prisma.taskComment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true, task: { select: { teamId: true } } },
    });
    if (!comment) {
      throw new ApiException(
        404,
        'COMMENT_NOT_FOUND',
        'コメントが見つかりません',
      );
    }
    await this.access.requireMember(comment.task.teamId, userId);
    if (comment.userId !== userId) {
      throw new ApiException(
        403,
        'COMMENT_DELETE_FORBIDDEN',
        '自分のコメントだけ削除できます',
      );
    }
    await this.prisma.taskComment.delete({ where: { id: commentId } });
  }

  private async requireTaskMember(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, teamId: true },
    });
    if (!task) {
      throw new ApiException(404, 'TASK_NOT_FOUND', 'タスクが見つかりません');
    }
    await this.access.requireMember(task.teamId, userId);
    return task;
  }
}
