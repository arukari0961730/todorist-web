import { formatDateOnly } from '../common/utils/date';

interface TaskRecord {
  id: string;
  teamId: string;
  title: string;
  description: string | null;
  assigneeId: string | null;
  createdById: string | null;
  startDate: Date;
  deadline: Date;
  status: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  assignee?: { id: string; name: string; email: string } | null;
  createdBy?: { id: string; name: string } | null;
}

export function presentTask(task: TaskRecord) {
  return {
    id: task.id,
    teamId: task.teamId,
    title: task.title,
    description: task.description,
    assigneeId: task.assigneeId,
    createdById: task.createdById,
    startDate: formatDateOnly(task.startDate),
    deadline: formatDateOnly(task.deadline),
    status: task.status,
    version: task.version,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    assignee: task.assignee ?? null,
    createdBy: task.createdBy ?? null,
  };
}
