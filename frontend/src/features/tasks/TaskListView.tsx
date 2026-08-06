import { taskStatusLabels, taskStatuses, type Task } from '../../types'

interface Props {
  tasks: Task[]
  today: string
  statusPending: boolean
  onStatusChange: (task: Task, status: Task['status']) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export function TaskListView({ tasks, today, statusPending, onStatusChange, onEdit, onDelete }: Props) {
  return (
    <div className="task-grid">
      {tasks.map((task) => {
        const overdue = task.status !== 'done' && task.deadline < today
        return (
          <article className="task-card" key={task.id}>
            <div className="task-card-top">
              <span className={`status-badge status-${task.status}`}>{taskStatusLabels[task.status]}</span>
              {overdue && <span className="overdue-badge">期限切れ</span>}
            </div>
            <h3>{task.title}</h3>
            <p className="task-description">{task.description || '詳細はありません'}</p>
            <dl className="task-meta">
              <div><dt>担当</dt><dd>{task.assignee?.name ?? '未割り当て'}</dd></div>
              <div><dt>期間</dt><dd>{task.startDate} → {task.deadline}</dd></div>
            </dl>
            <select
              className="status-select"
              value={task.status}
              disabled={statusPending}
              onChange={(event) => onStatusChange(task, event.target.value as Task['status'])}
            >
              {taskStatuses.map((status) => <option key={status} value={status}>{taskStatusLabels[status]}</option>)}
            </select>
            <div className="task-actions">
              <button className="button ghost" onClick={() => onEdit(task)}>編集</button>
              <button className="button ghost danger-text" onClick={() => onDelete(task)}>削除</button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
