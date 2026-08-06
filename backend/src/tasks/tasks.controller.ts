import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { VersionQueryDto } from '../teams/dto/version-query.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller()
@UseGuards(SessionAuthGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get('teams/:teamId/tasks')
  list(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListTasksQueryDto,
  ) {
    return this.tasks.list(teamId, user.id, query);
  }

  @Post('teams/:teamId/tasks')
  create(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateTaskDto,
  ) {
    return this.tasks.create(teamId, user.id, input);
  }

  @Get('tasks/:taskId')
  get(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasks.get(taskId, user.id);
  }

  @Patch('tasks/:taskId')
  update(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdateTaskDto,
  ) {
    return this.tasks.update(taskId, user.id, input);
  }

  @Delete('tasks/:taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: VersionQueryDto,
  ) {
    return this.tasks.remove(taskId, user.id, query.version);
  }
}
