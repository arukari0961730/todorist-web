import { useEffect, useState, type FormEvent } from 'react'
import type { Task, TaskMember, TaskStatus } from './task-form.types'
import { taskStatusLabels, taskStatuses } from '../../types'

interface Props {
  task?: Task | null
  members: TaskMember[]
  pending: boolean
  onSubmit: (input: {
    title: string
    description: string | null
    assigneeId: string | null
    startDate: string
    deadline: string
    status: TaskStatus
  }) => void
  onCancel?: () => void
}

function localToday() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function TaskForm({ task, members, pending, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [startDate, setStartDate] = useState(localToday())
  const [deadline, setDeadline] = useState(localToday())
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [error, setError] = useState('')

  useEffect(() => {
    setTitle(task?.title ?? '')
    setDescription(task?.description ?? '')
    setAssigneeId(task?.assigneeId ?? '')
    setStartDate(task?.startDate ?? localToday())
    setDeadline(task?.deadline ?? localToday())
    setStatus(task?.status ?? 'todo')
    setError('')
  }, [task])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (startDate > deadline) {
      setError('締切日は開始日以降にしてください')
      return
    }
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      assigneeId: assigneeId || null,
      startDate,
      deadline,
      status,
    })
  }

  return (
    <form className="task-form form-stack" onSubmit={submit}>
      <label>
        課題名
        <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} required />
      </label>
      <label>
        詳細
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} rows={4} />
      </label>
      <div className="form-grid">
        <label>
          担当者
          <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
            <option value="">未割り当て</option>
            {members.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.name}</option>)}
          </select>
        </label>
        <label>
          状態
          <select value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
            {taskStatuses.map((value) => <option key={value} value={value}>{taskStatusLabels[value]}</option>)}
          </select>
        </label>
        <label>
          開始日
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
        </label>
        <label>
          締切日
          <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} required />
        </label>
      </div>
      {error && <p className="error-message">{error}</p>}
      <div className="button-row">
        <button className="button primary" disabled={pending}>{pending ? '保存中…' : task ? '変更を保存' : 'タスクを追加'}</button>
        {onCancel && <button type="button" className="button ghost" onClick={onCancel}>キャンセル</button>}
      </div>
    </form>
  )
}
