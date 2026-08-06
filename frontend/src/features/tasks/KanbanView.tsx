import type { DragEvent } from 'react'
import { taskStatusLabels, taskStatuses, type Task } from '../../types'

interface Props {
  tasks: Task[]
  pending: boolean
  onStatusChange: (task: Task, status: Task['status']) => void
  onEdit: (task: Task) => void
}

export function KanbanView({ tasks, pending, onStatusChange, onEdit }: Props) {
  function drop(event: DragEvent, status: Task['status']) {
    event.preventDefault()
    const task = tasks.find((item) => item.id === event.dataTransfer.getData('text/task-id'))
    if (task && task.status !== status && !pending) onStatusChange(task, status)
  }

  return (
    <div className="kanban-scroll">
      <div className="kanban-board">
        {taskStatuses.map((status) => {
          const columnTasks = tasks.filter((task) => task.status === status)
          return (
            <section className={`kanban-column kanban-${status}`} key={status} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, status)}>
              <div className="kanban-heading">
                <h3>{taskStatusLabels[status]}</h3><span>{columnTasks.length}</span>
              </div>
              <div className="kanban-items">
                {columnTasks.length === 0 && <p className="kanban-empty">なし</p>}
                {columnTasks.map((task) => (
                  <article
                    className="kanban-task"
                    key={task.id}
                    draggable={!pending}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'move'
                      event.dataTransfer.setData('text/task-id', task.id)
                    }}
                  >
                    <button onClick={() => onEdit(task)}><strong>{task.title}</strong></button>
                    <span>{task.assignee?.name ?? '未割り当て'}</span>
                    <small>締切 {task.deadline}</small>
                    <select
                      aria-label={`${task.title}の状態`}
                      value={task.status}
                      disabled={pending}
                      onChange={(event) => onStatusChange(task, event.target.value as Task['status'])}
                    >
                      {taskStatuses.map((nextStatus) => (
                        <option key={nextStatus} value={nextStatus}>{taskStatusLabels[nextStatus]}</option>
                      ))}
                    </select>
                  </article>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
