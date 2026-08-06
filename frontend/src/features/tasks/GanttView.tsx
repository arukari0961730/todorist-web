import { useState, type CSSProperties } from 'react'
import { type Task } from '../../types'
import { addUtcMonths, daysInUtcMonth, parseDateOnly } from './dateUtils'
import { ViewMonthHeader } from './CalendarView'

export function GanttView({ tasks, today, onEdit }: { tasks: Task[]; today: string; onEdit: (task: Task) => void }) {
  const [month, setMonth] = useState(() => {
    const date = parseDateOnly(today)
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
  })
  const days = daysInUtcMonth(month)
  const monthStart = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1))
  const monthEnd = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), days))
  const visibleTasks = tasks.filter((task) => parseDateOnly(task.startDate) <= monthEnd && parseDateOnly(task.deadline) >= monthStart)
  const gridStyle = { '--gantt-days': days, minWidth: `${220 + days * 32}px` } as CSSProperties

  return (
    <section>
      <ViewMonthHeader
        title={`${month.getUTCFullYear()}年${month.getUTCMonth() + 1}月`}
        onPrevious={() => setMonth((current) => addUtcMonths(current, -1))}
        onToday={() => {
          const date = parseDateOnly(today)
          setMonth(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)))
        }}
        onNext={() => setMonth((current) => addUtcMonths(current, 1))}
      />
      <div className="gantt-scroll">
        <div className="gantt-chart" style={gridStyle}>
          <div className="gantt-header gantt-label-cell">タスク</div>
          {Array.from({ length: days }, (_, index) => {
            const day = index + 1
            const date = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), day))
            const value = `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            return <div className={`gantt-header gantt-date weekday-${date.getUTCDay()}${value === today ? ' today' : ''}`} key={day}>{day}</div>
          })}
          {visibleTasks.map((task, rowIndex) => {
            const taskStart = parseDateOnly(task.startDate)
            const taskEnd = parseDateOnly(task.deadline)
            const visibleStart = taskStart < monthStart ? monthStart : taskStart
            const visibleEnd = taskEnd > monthEnd ? monthEnd : taskEnd
            const row = rowIndex + 2
            return (
              <div className="gantt-row" key={task.id} style={{ gridRow: row }}>
                <button className="gantt-task-label" onClick={() => onEdit(task)}><strong>{task.title}</strong><span>{task.assignee?.name ?? '未割り当て'}</span></button>
                {Array.from({ length: days }, (_, index) => {
                  const date = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), index + 1))
                  return <span className={`gantt-day-cell weekday-${date.getUTCDay()}`} key={index} style={{ gridColumn: index + 2, gridRow: 1 }} />
                })}
                <button
                  className={`gantt-bar status-${task.status}`}
                  title={`${task.startDate} → ${task.deadline}`}
                  onClick={() => onEdit(task)}
                  style={{ gridColumn: `${visibleStart.getUTCDate() + 1} / ${visibleEnd.getUTCDate() + 2}`, gridRow: 1 }}
                >{task.title}</button>
              </div>
            )
          })}
          {visibleTasks.length === 0 && <div className="gantt-no-tasks">この月に重なるタスクはありません</div>}
        </div>
      </div>
    </section>
  )
}
