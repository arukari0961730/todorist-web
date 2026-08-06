import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../../api/auth'
import { teamsApi } from '../../api/teams'
import { navigate } from '../../app/navigation'
import { ErrorState, LoadingState } from '../../components/States'
import type { Team, User } from '../../types'
import { getTeamRoleLabel } from '../../utils/teamRole'
import { ChatWorkspace } from '../chat/ChatWorkspace'
import { PullRequestsWorkspace } from '../pull-requests/PullRequestsWorkspace'
import { TaskWorkspace } from '../tasks/TaskWorkspace'
import { CreateTeamForm } from './CreateTeamForm'
import { TeamSettings } from './TeamSettings'

type WorkspaceTab = 'tasks' | 'chat' | 'pullRequests' | 'settings'

export function WorkspacePage({ user }: { user: User }) {
  const client = useQueryClient()
  const [tab, setTab] = useState<WorkspaceTab>('tasks')
  const storageKey = `todorist:selectedTeamId:${user.id}`
  const [selectedId, setSelectedId] = useState(() => {
    const pending = localStorage.getItem('todorist:pendingSelectedTeamId')
    if (pending) {
      localStorage.removeItem('todorist:pendingSelectedTeamId')
      return pending
    }
    return localStorage.getItem(storageKey) ?? ''
  })
  const teams = useQuery({ queryKey: ['teams'], queryFn: teamsApi.list })
  const create = useMutation({
    mutationFn: (name: string) => teamsApi.create({ name }),
    onSuccess: async (team) => {
      setSelectedId(team.id)
      localStorage.setItem(storageKey, team.id)
      await client.invalidateQueries({ queryKey: ['teams'] })
    },
  })
  const logout = useMutation({
    mutationFn: authApi.logout,
    onSuccess: async () => {
      client.clear()
      navigate('/login')
    },
  })

  useEffect(() => {
    if (!teams.data) return
    const valid = teams.data.items.some((team) => team.id === selectedId)
    if (!valid) {
      const next = teams.data.items[0]?.id ?? ''
      setSelectedId(next)
      if (next) localStorage.setItem(storageKey, next)
      else localStorage.removeItem(storageKey)
    }
  }, [selectedId, storageKey, teams.data])

  const selectedTeam = teams.data?.items.find((team) => team.id === selectedId)

  function selectTeam(team: Team) {
    setSelectedId(team.id)
    localStorage.setItem(storageKey, team.id)
    setTab('tasks')
  }

  function renderWorkspace(team: Team) {
    if (tab === 'chat') return <ChatWorkspace team={team} currentUser={user} />
    if (tab === 'pullRequests') return <PullRequestsWorkspace key={team.id} team={team} />
    if (tab === 'settings') {
      return <TeamSettings team={team} currentUser={user} onTeamRemoved={() => setSelectedId('')} />
    }
    return <TaskWorkspace team={team} currentUser={user} />
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark small">T</span>
          <div><strong>todorist</strong><span>game production</span></div>
        </div>
        <div className="sidebar-section">
          <p className="sidebar-label">TEAMS</p>
          <nav className="team-nav">
            {teams.data?.items.map((team) => (
              <button key={team.id} className={team.id === selectedId ? 'active' : ''} onClick={() => selectTeam(team)}>
                <span>{team.name.slice(0, 1).toUpperCase()}</span>
                <div>{team.name}<small>{getTeamRoleLabel(team.role)}</small></div>
              </button>
            ))}
          </nav>
        </div>
        <CreateTeamForm onCreate={(name) => create.mutate(name)} pending={create.isPending} />
        {create.error && <ErrorState error={create.error} />}
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
            <div><strong>{user.name}</strong><span>{user.email}</span></div>
          </div>
          <button className="button ghost full" onClick={() => logout.mutate()}>ログアウト</button>
        </div>
      </aside>
      <main className="main-content">
        {teams.isLoading && <LoadingState label="チームを読み込んでいます…" />}
        {teams.error && <ErrorState error={teams.error} />}
        {!teams.isLoading && teams.data?.items.length === 0 && (
          <section className="welcome-panel">
            <div className="brand-mark">T</div>
            <p className="eyebrow">WELCOME</p>
            <h1>最初のチームを作成しましょう</h1>
            <p className="muted">左側の入力欄からゲーム制作チームを追加できます。</p>
          </section>
        )}
        {selectedTeam && (
          <>
            <header className="topbar">
              <div className="tab-list">
                <button className={tab === 'tasks' ? 'active' : ''} onClick={() => setTab('tasks')}>タスク</button>
                <button className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>チャット</button>
                <button className={tab === 'pullRequests' ? 'active' : ''} onClick={() => setTab('pullRequests')}>PR共有</button>
                <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>チーム設定</button>
              </div>
              <span className="role-badge">{getTeamRoleLabel(selectedTeam.role)}</span>
            </header>
            <div className="content-inner">{renderWorkspace(selectedTeam)}</div>
          </>
        )}
      </main>
    </div>
  )
}
