import { Injectable } from '@nestjs/common';
import { Prisma, TaskStatus } from '../generated/prisma/client';
import { ApiException } from '../common/api-exception';
import { parseDateOnly } from '../common/utils/date';
import { PrismaService } from '../prisma/prisma.service';
import { TeamAccessService } from '../teams/team-access.service';
import type { CreateTaskDto } from './dto/create-task.dto';
import type { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import type { UpdateTaskDto } from './dto/update-task.dto';
import { presentTask } from './task.presenter';

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.TaskInclude;

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: TeamAccessService,
  ) {}

  async list(teamId: string, userId: string, query: ListTasksQueryDto) {
    const membership = await this.access.requireMember(teamId, userId);
    const where = this.buildWhere(teamId, membership.team.timezone, query);
    const limit = query.limit ?? 50;
    const order = query.order ?? 'asc';
    const sort = query.sort ?? 'deadline';
    const orderBy = this.buildOrderBy(sort, order);
    const cursorId = query.cursor ? this.decodeCursor(query.cursor) : undefined;

    const tasks = await this.prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy,
      take: limit + 1,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    });
    const hasNext = tasks.length > limit;
    if (hasNext) tasks.pop();
    return {
      items: tasks.map(presentTask),
      nextCursor:
        hasNext && tasks.length > 0
          ? this.encodeCursor(tasks[tasks.length - 1].id)
          : null,
    };
  }

  async create(teamId: string, userId: string, input: CreateTaskDto) {
    await this.access.requireMember(teamId, userId);
    this.validateDateRange(input.startDate, input.deadline);
    await this.validateAssignee(teamId, input.assigneeId);
    const task = await this.prisma.task.create({
      data: {
        teamId,
        title: input.title.trim(),
        description: input.description ?? null,
        assigneeId: input.assigneeId ?? null,
        createdById: userId,
        startDate: parseDateOnly(input.startDate),
        deadline: parseDateOnly(input.deadline),
        status: input.status ?? TaskStatus.todo,
      },
      include: taskInclude,
    });
    return presentTask(task);
  }

  async get(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: taskInclude,
    });
    if (!task) this.throwNotFound();
    await this.access.requireMember(task.teamId, userId);
    return presentTask(task);
  }

  async update(taskId: string, userId: string, input: UpdateTaskDto) {
    const current = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!current) this.throwNotFound();
    await this.access.requireMember(current.teamId, userId);

    const startDate =
      input.startDate ?? current.startDate.toISOString().slice(0, 10);
    const deadline =
      input.deadline ?? current.deadline.toISOString().slice(0, 10);
    this.validateDateRange(startDate, deadline);
    if (input.assigneeId !== undefined) {
      await this.validateAssignee(current.teamId, input.assigneeId);
    }

    const data: Prisma.TaskUncheckedUpdateManyInput = {
      version: { increment: 1 },
    };
    if (input.title !== undefined) data.title = input.title.trim();
    if (input.description !== undefined) data.description = input.description;
    if (input.assigneeId !== undefined) data.assigneeId = input.assigneeId;
    if (input.startDate !== undefined)
      data.startDate = parseDateOnly(input.startDate);
    if (input.deadline !== undefined)
      data.deadline = parseDateOnly(input.deadline);
    if (input.status !== undefined) data.status = input.status;

    if (Object.keys(data).length === 1) {
      throw new ApiException(
        400,
        'NO_CHANGES',
        '変更する項目を指定してください',
      );
    }
    const result = await this.prisma.task.updateMany({
      where: { id: taskId, version: input.version },
      data,
    });
    if (result.count === 0) this.throwConflict();
    const task = await this.prisma.task.findUniqueOrThrow({
      where: { id: taskId },
      include: taskInclude,
    });
    return presentTask(task);
  }

  async remove(taskId: string, userId: string, version: number): Promise<void> {
    const current = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!current) this.throwNotFound();
    await this.access.requireMember(current.teamId, userId);
    const result = await this.prisma.task.deleteMany({
      where: { id: taskId, version },
    });
    if (result.count === 0) this.throwConflict();
  }

  private buildWhere(
    teamId: string,
    timezone: string,
    query: ListTasksQueryDto,
  ): Prisma.TaskWhereInput {
    const where: Prisma.TaskWhereInput = { teamId };
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { assignee: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }
    if (query.status) {
      const statuses = query.status.split(',').filter(Boolean);
      const valid = new Set(Object.values(TaskStatus));
      if (statuses.some((status) => !valid.has(status as TaskStatus))) {
        throw new ApiException(
          400,
          'INVALID_STATUS',
          '定義済みの状態を指定してください',
        );
      }
      where.status = { in: statuses as TaskStatus[] };
    }
    if (query.assigneeId) where.assigneeId = query.assigneeId;
    if (query.unassigned) where.assigneeId = null;
    if (query.startDateFrom || query.startDateTo) {
      where.startDate = {
        ...(query.startDateFrom
          ? { gte: parseDateOnly(query.startDateFrom) }
          : {}),
        ...(query.startDateTo ? { lte: parseDateOnly(query.startDateTo) } : {}),
      };
    }
    if (query.deadlineFrom || query.deadlineTo) {
      where.deadline = {
        ...(query.deadlineFrom
          ? { gte: parseDateOnly(query.deadlineFrom) }
          : {}),
        ...(query.deadlineTo ? { lte: parseDateOnly(query.deadlineTo) } : {}),
      };
    }
    if (query.deadlineScope) {
      const today = parseDateOnly(this.todayInTimezone(timezone));
      if (query.deadlineScope === 'overdue') {
        where.deadline = { lt: today };
        where.AND = [{ status: { not: TaskStatus.done } }];
      } else if (query.deadlineScope === 'today') {
        where.deadline = today;
      } else {
        where.deadline = { gt: today };
      }
    }
    return where;
  }

  private buildOrderBy(
    sort: NonNullable<ListTasksQueryDto['sort']>,
    order: 'asc' | 'desc',
  ): Prisma.TaskOrderByWithRelationInput[] {
    if (sort === 'assignee') {
      return [{ assignee: { name: order } }, { id: order }];
    }
    return [
      { [sort]: order },
      { id: order },
    ] as Prisma.TaskOrderByWithRelationInput[];
  }

  private async validateAssignee(
    teamId: string,
    assigneeId?: string | null,
  ): Promise<void> {
    if (!assigneeId) return;
    const membership = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: assigneeId } },
    });
    if (!membership) {
      throw new ApiException(
        400,
        'INVALID_ASSIGNEE',
        '担当者は同じチームのメンバーから選択してください',
      );
    }
  }

  private validateDateRange(startDate: string, deadline: string): void {
    try {
      parseDateOnly(startDate);
      parseDateOnly(deadline);
    } catch {
      throw new ApiException(
        400,
        'INVALID_DATE',
        '実在する日付をYYYY-MM-DD形式で指定してください',
      );
    }
    if (startDate > deadline) {
      throw new ApiException(
        400,
        'INVALID_DATE_RANGE',
        '締切日は開始日以降にしてください',
      );
    }
  }

  private todayInTimezone(timezone: string): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts();
    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );
    return `${values.year}-${values.month}-${values.day}`;
  }

  private encodeCursor(id: string): string {
    return Buffer.from(id).toString('base64url');
  }

  private decodeCursor(cursor: string): string {
    const id = Buffer.from(cursor, 'base64url').toString('utf8');
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      )
    ) {
      throw new ApiException(
        400,
        'INVALID_CURSOR',
        'カーソルが正しくありません',
      );
    }
    return id;
  }

  private throwNotFound(): never {
    throw new ApiException(404, 'TASK_NOT_FOUND', 'タスクが見つかりません');
  }

  private throwConflict(): never {
    throw new ApiException(
      409,
      'EDIT_CONFLICT',
      '他のユーザーが先に更新しました。最新の内容を確認してください',
    );
  }
}
