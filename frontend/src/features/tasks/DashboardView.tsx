import { taskStatusLabels, taskStatuses, type Task } from '../../types'

interface Props {
  tasks: Task[]
  today: string
  onShowAll: () => void
  onSelectStatus: (status: Task['status']) => void
  onSelectOverdue: () => void
}

export function DashboardView({ tasks, today, onShowAll, onSelectStatus, onSelectOverdue }: Props) {
  const overdue = tasks.filter((task) => task.status !== 'done' && task.deadline < today).length

  return (
    <section>
      <div className="section-heading">
        <div><p className="eyebrow">DASHBOARD</p><h2>進捗サマリー</h2></div>
        <span className="muted">チーム全体のタスク状況</span>
      </div>
      <div className="dashboard-grid">
        <button className="dashboard-card total" onClick={onShowAll}>
          <span>全体</span><strong>{tasks.length}</strong><small>すべてのタスク</small>
        </button>
        {taskStatuses.map((status) => (
          <button className={`dashboard-card status-card-${status}`} key={status} onClick={() => onSelectStatus(status)}>
            <span>{taskStatusLabels[status]}</span>
            <strong>{tasks.filter((task) => task.status === status).length}</strong>
            <small>該当タスクを表示</small>
          </button>
        ))}
        <button className="dashboard-card overdue" onClick={onSelectOverdue}>
          <span>期限切れ</span><strong>{overdue}</strong><small>未完了のみ</small>
        </button>
      </div>
    </section>
  )
}
