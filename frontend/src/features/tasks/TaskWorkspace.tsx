import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi, type TaskInput } from '../../api/tasks'
import { teamsApi } from '../../api/teams'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { taskStatusLabels, taskStatuses, type Task, type Team, type User } from '../../types'
import { CalendarView } from './CalendarView'
import { DashboardView } from './DashboardView'
import { GanttView } from './GanttView'
import { KanbanView } from './KanbanView'
import { TaskForm } from './TaskForm'
import { TaskListView } from './TaskListView'
import { TaskComments } from './TaskComments'

type DeadlineFilter = '' | 'overdue' | 'today' | 'upcoming'
type TaskView = 'dashboard' | 'calendar' | 'list' | 'gantt' | 'kanban'
type SortOption =
  | 'deadline-asc'
  | 'deadline-desc'
  | 'startDate-asc'
  | 'title-asc'
  | 'assignee-asc'
  | 'status-asc'

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'deadline-asc', label: '締切日が近い順' },
  { value: 'deadline-desc', label: '締切日が遠い順' },
  { value: 'startDate-asc', label: '開始日順' },
  { value: 'title-asc', label: 'タイトル順' },
  { value: 'assignee-asc', label: '担当者順' },
  { value: 'status-asc', label: '状態順' },
]

const taskViews: Array<{ value: TaskView; label: string }> = [
  { value: 'dashboard', label: 'ダッシュボード' },
  { value: 'calendar', label: 'カレンダー' },
  { value: 'list', label: '一覧' },
  { value: 'gantt', label: 'ガント' },
  { value: 'kanban', label: 'ボード' },
]

export function TaskWorkspace({ team, currentUser }: { team: Team; currentUser: User }) {
  const client = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [view, setView] = useState<TaskView>('dashboard')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<Task['status'] | ''>('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>('')
  const [sortOption, setSortOption] = useState<SortOption>('deadline-asc')
  const [sort, order] = sortOption.split('-') as [
    'deadline' | 'startDate' | 'title' | 'assignee' | 'status',
    'asc' | 'desc',
  ]
  const tasks = useQuery({
    queryKey: ['teams', team.id, 'tasks', {
      search: debouncedSearch,
      status: statusFilter,
      assignee: assigneeFilter,
      deadline: deadlineFilter,
      sort,
      order,
    }],
    queryFn: () => tasksApi.list(team.id, {
      search: debouncedSearch,
      status: statusFilter || undefined,
      assigneeId: assigneeFilter && assigneeFilter !== 'unassigned' ? assigneeFilter : undefined,
      unassigned: assigneeFilter === 'unassigned' || undefined,
      deadlineScope: deadlineFilter || undefined,
      sort,
      order,
    }),
  })
  const summaryTasks = useQuery({
    queryKey: ['teams', team.id, 'tasks', 'summary'],
    queryFn: () => tasksApi.list(team.id),
  })
  const members = useQuery({ queryKey: ['teams', team.id, 'members'], queryFn: () => teamsApi.members(team.id) })
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['teams', team.id, 'tasks'] }),
      client.invalidateQueries({ queryKey: ['teams'] }),
    ])
  }
  const create = useMutation({
    mutationFn: (input: TaskInput) => tasksApi.create(team.id, input),
    onSuccess: async () => { setShowCreate(false); await refresh() },
  })
  const update = useMutation({
    mutationFn: ({ task, input }: { task: Task; input: TaskInput }) => tasksApi.update(task.id, { ...input, version: task.version }),
    onSuccess: async () => { setEditing(null); await refresh() },
  })
  const remove = useMutation({
    mutationFn: (task: Task) => tasksApi.remove(task.id, task.version),
    onSuccess: refresh,
  })
  const statusUpdate = useMutation({
    mutationFn: ({ task, status }: { task: Task; status: Task['status'] }) => tasksApi.update(task.id, { status, version: task.version }),
    onSuccess: refresh,
  })
  const today = todayInTimezone(team.timezone)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timeoutId)
  }, [search])

  useEffect(() => {
    setSearch('')
    setDebouncedSearch('')
    setStatusFilter('')
    setAssigneeFilter('')
    setDeadlineFilter('')
    setSortOption('deadline-asc')
    setView('dashboard')
  }, [team.id])

  const hasInputFilters = Boolean(search || statusFilter || assigneeFilter || deadlineFilter)
  const hasAppliedFilters = Boolean(debouncedSearch || statusFilter || assigneeFilter || deadlineFilter)

  function clearFilters() {
    setSearch('')
    setStatusFilter('')
    setAssigneeFilter('')
    setDeadlineFilter('')
  }

  function showAllTasks() {
    clearFilters()
    setView('list')
  }

  function showStatusTasks(status: Task['status']) {
    clearFilters()
    setStatusFilter(status)
    setView('list')
  }

  function showOverdueTasks() {
    clearFilters()
    setDeadlineFilter('overdue')
    setView('list')
  }

  return (
    <>
      <section className="workspace-heading">
        <div><p className="eyebrow">TASK WORKSPACE</p><h1>{team.name}</h1><p className="muted">制作タスクをチーム全員で共有します。</p></div>
        <button className="button primary add-button" onClick={() => setShowCreate(true)}>＋ タスク追加</button>
      </section>
      <div className="task-view-tabs" role="tablist" aria-label="タスク表示">
        {taskViews.map((item) => (
          <button
            role="tab"
            aria-selected={view === item.value}
            className={view === item.value ? 'active' : ''}
            key={item.value}
            onClick={() => setView(item.value)}
          >{item.label}</button>
        ))}
      </div>
      {view !== 'dashboard' && <div className="task-search-bar">
        <label>
          <span>タスク検索</span>
          <input
            type="search"
            value={search}
            maxLength={100}
            placeholder="課題名・詳細・担当者で検索"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="status-filter">
          <span>状態</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as Task['status'] | '')}>
            <option value="">すべて</option>
            {taskStatuses.map((status) => <option key={status} value={status}>{taskStatusLabels[status]}</option>)}
          </select>
        </label>
        <label className="assignee-filter">
          <span>担当者</span>
          <select
            value={assigneeFilter}
            disabled={members.isLoading}
            onChange={(event) => setAssigneeFilter(event.target.value)}
          >
            <option value="">すべて</option>
            <option value="unassigned">未割り当て</option>
            {members.data?.items.map((member) => (
              <option key={member.user.id} value={member.user.id}>{member.user.name}</option>
            ))}
          </select>
        </label>
        <label className="deadline-filter">
          <span>期限</span>
          <select value={deadlineFilter} onChange={(event) => setDeadlineFilter(event.target.value as DeadlineFilter)}>
            <option value="">すべて</option>
            <option value="overdue">期限切れ</option>
            <option value="today">今日</option>
            <option value="upcoming">今後</option>
          </select>
        </label>
        <label className="sort-control">
          <span>並び替え</span>
          <select value={sortOption} onChange={(event) => setSortOption(event.target.value as SortOption)}>
            {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <button
          className="button ghost"
          type="button"
          disabled={!hasInputFilters}
          onClick={clearFilters}
        >条件をクリア</button>
        <span className="search-result-count">{tasks.data ? `${tasks.data.items.length}件` : '－件'}</span>
      </div>}
      {(create.error || update.error || remove.error || statusUpdate.error) && <ErrorState error={(create.error ?? update.error ?? remove.error ?? statusUpdate.error)!} />}
      {view === 'dashboard' && summaryTasks.isLoading && <LoadingState label="集計しています…" />}
      {view === 'dashboard' && summaryTasks.error && <ErrorState error={summaryTasks.error} />}
      {view !== 'dashboard' && tasks.isLoading && <LoadingState label="タスクを読み込んでいます…" />}
      {view !== 'dashboard' && tasks.error && <ErrorState error={tasks.error} />}
      {view === 'list' && tasks.data?.items.length === 0 && (hasAppliedFilters
        ? <EmptyState title="該当するタスクはありません" detail="検索・絞り込み条件を変えて試してください。" />
        : <EmptyState title="タスクはまだありません" detail="最初の制作タスクを追加してみましょう。" />)}
      {view === 'dashboard' && summaryTasks.data && (
        <DashboardView
          tasks={summaryTasks.data.items}
          today={today}
          onShowAll={showAllTasks}
          onSelectStatus={showStatusTasks}
          onSelectOverdue={showOverdueTasks}
        />
      )}
      {view === 'list' && tasks.data && (
        <TaskListView
          tasks={tasks.data.items}
          today={today}
          statusPending={statusUpdate.isPending}
          onStatusChange={(task, status) => statusUpdate.mutate({ task, status })}
          onEdit={setEditing}
          onDelete={(task) => window.confirm(`「${task.title}」を削除しますか？`) && remove.mutate(task)}
        />
      )}
      {view === 'calendar' && tasks.data && <CalendarView key={team.id} tasks={tasks.data.items} today={today} onEdit={setEditing} />}
      {view === 'gantt' && tasks.data && <GanttView key={team.id} tasks={tasks.data.items} today={today} onEdit={setEditing} />}
      {view === 'kanban' && tasks.data && (
        <KanbanView
          tasks={tasks.data.items}
          pending={statusUpdate.isPending}
          onStatusChange={(task, status) => statusUpdate.mutate({ task, status })}
          onEdit={setEditing}
        />
      )}
      {(showCreate || editing) && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && (setShowCreate(false), setEditing(null))}>
          <section className="modal" role="dialog" aria-modal="true">
            <div className="modal-heading"><div><p className="eyebrow">{editing ? 'EDIT TASK' : 'NEW TASK'}</p><h2>{editing ? 'タスクを編集' : 'タスクを追加'}</h2></div><button className="icon-button" onClick={() => { setShowCreate(false); setEditing(null) }}>×</button></div>
            <TaskForm
              task={editing}
              members={members.data?.items ?? []}
              pending={create.isPending || update.isPending}
              onCancel={() => { setShowCreate(false); setEditing(null) }}
              onSubmit={(input) => editing ? update.mutate({ task: editing, input }) : create.mutate(input)}
            />
            {editing && <TaskComments task={editing} currentUserId={currentUser.id} />}
          </section>
        </div>
      )}
    </>
  )
}

function todayInTimezone(timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts()
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}
