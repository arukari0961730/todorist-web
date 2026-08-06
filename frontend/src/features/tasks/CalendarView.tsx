import { useState } from 'react'
import { taskStatusLabels, type Task } from '../../types'
import { addUtcDays, addUtcMonths, formatDateOnly, parseDateOnly } from './dateUtils'

const weekdays = ['日', '月', '火', '水', '木', '金', '土']

export function CalendarView({ tasks, today, onEdit }: { tasks: Task[]; today: string; onEdit: (task: Task) => void }) {
  const [month, setMonth] = useState(() => {
    const date = parseDateOnly(today)
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
  })
  const first = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1))
  const gridStart = addUtcDays(first, -first.getUTCDay())
  const cells = Array.from({ length: 42 }, (_, index) => addUtcDays(gridStart, index))
  const tasksByDeadline = new Map<string, Task[]>()
  for (const task of tasks) {
    const items = tasksByDeadline.get(task.deadline) ?? []
    items.push(task)
    tasksByDeadline.set(task.deadline, items)
  }

  return (
    <section className="calendar-view">
      <ViewMonthHeader
        title={`${month.getUTCFullYear()}年${month.getUTCMonth() + 1}月`}
        onPrevious={() => setMonth((current) => addUtcMonths(current, -1))}
        onToday={() => {
          const date = parseDateOnly(today)
          setMonth(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)))
        }}
        onNext={() => setMonth((current) => addUtcMonths(current, 1))}
      />
      <div className="calendar-grid">
        {weekdays.map((weekday, index) => <div className={`calendar-weekday weekday-${index}`} key={weekday}>{weekday}</div>)}
        {cells.map((date) => {
          const value = formatDateOnly(date)
          const dayTasks = tasksByDeadline.get(value) ?? []
          const outside = date.getUTCMonth() !== month.getUTCMonth()
          return (
            <div className={`calendar-day weekday-${date.getUTCDay()}${outside ? ' outside' : ''}${value === today ? ' today' : ''}`} key={value}>
              <span className="calendar-date">{date.getUTCDate()}</span>
              <div className="calendar-tasks">
                {dayTasks.map((task) => (
                  <button className={`calendar-task status-${task.status}`} key={task.id} title={`${task.title}（${taskStatusLabels[task.status]}）`} onClick={() => onEdit(task)}>
                    {task.title}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function ViewMonthHeader({ title, onPrevious, onToday, onNext }: { title: string; onPrevious: () => void; onToday: () => void; onNext: () => void }) {
  return (
    <div className="view-toolbar">
      <h2>{title}</h2>
      <div className="button-row">
        <button className="button ghost month-arrow" aria-label="前月" title="前月" onClick={onPrevious}>←</button>
        <button className="button ghost" onClick={onToday}>今日</button>
        <button className="button ghost month-arrow" aria-label="次月" title="次月" onClick={onNext}>→</button>
      </div>
    </div>
  )
}
