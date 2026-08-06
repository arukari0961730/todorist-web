import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pullRequestsApi, type PullRequestInput } from '../../api/pull-requests'
import { tasksApi } from '../../api/tasks'
import { teamsApi } from '../../api/teams'
import { ErrorState, LoadingState } from '../../components/States'
import {
  pullRequestStatuses,
  pullRequestStatusLabels,
  type PullRequestShare,
  type Team,
} from '../../types'

const emptyInput: PullRequestInput = {
  title: '',
  url: '',
  assigneeId: null,
  taskId: null,
  status: 'draft',
  memo: null,
}

export function PullRequestsWorkspace({ team }: { team: Team }) {
  const client = useQueryClient()
  const queryKey = ['teams', team.id, 'pull-requests']
  const [input, setInput] = useState<PullRequestInput>(emptyInput)
  const [editing, setEditing] = useState<PullRequestShare | null>(null)
  const shares = useQuery({ queryKey, queryFn: () => pullRequestsApi.list(team.id) })
  const members = useQuery({ queryKey: ['teams', team.id, 'members'], queryFn: () => teamsApi.members(team.id) })
  const tasks = useQuery({ queryKey: ['tasks', team.id], queryFn: () => tasksApi.list(team.id) })
  const save = useMutation({
    mutationFn: () => editing
      ? pullRequestsApi.update(editing.id, { ...input, version: editing.version })
      : pullRequestsApi.create(team.id, input),
    onSuccess: async () => {
      resetForm()
      await client.invalidateQueries({ queryKey })
    },
  })
  const remove = useMutation({
    mutationFn: (share: PullRequestShare) => pullRequestsApi.remove(share.id, share.version),
    onSuccess: async () => {
      resetForm()
      await client.invalidateQueries({ queryKey })
    },
  })

  function resetForm() {
    setEditing(null)
    setInput(emptyInput)
  }

  function beginEdit(share: PullRequestShare) {
    setEditing(share)
    setInput({
      title: share.title,
      url: share.url,
      assigneeId: share.assigneeId,
      taskId: share.taskId,
      status: share.status,
      memo: share.memo,
    })
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!input.title.trim() || !input.url.trim() || save.isPending) return
    save.mutate()
  }

  return (
    <section className="pr-workspace">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">PULL REQUESTS</p>
          <h1>Pull Request共有</h1>
          <p className="muted">レビュー状況や関連タスクをチームで共有します。</p>
        </div>
        <span className="count-pill">{shares.data?.items.length ?? 0}</span>
      </div>

      <div className="pr-layout">
        <form className="panel pr-form" onSubmit={submit}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{editing ? 'EDIT SHARE' : 'NEW SHARE'}</p>
              <h2>{editing ? 'PR共有を編集' : 'PR共有を登録'}</h2>
            </div>
            {editing && <button type="button" className="button ghost" onClick={resetForm}>キャンセル</button>}
          </div>
          <label>PRタイトル
            <input required maxLength={200} value={input.title} onChange={(event) => setInput({ ...input, title: event.target.value })} />
          </label>
          <label>PRのURL
            <input required type="url" maxLength={2048} placeholder="https://github.com/.../pull/123" value={input.url} onChange={(event) => setInput({ ...input, url: event.target.value })} />
          </label>
          <div className="form-grid">
            <label>状態
              <select value={input.status} onChange={(event) => setInput({ ...input, status: event.target.value as PullRequestInput['status'] })}>
                {pullRequestStatuses.map((status) => <option key={status} value={status}>{pullRequestStatusLabels[status]}</option>)}
              </select>
            </label>
            <label>担当者
              <select value={input.assigneeId ?? ''} onChange={(event) => setInput({ ...input, assigneeId: event.target.value || null })}>
                <option value="">未設定</option>
                {members.data?.items.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.name}</option>)}
              </select>
            </label>
          </div>
          <label>関連タスク
            <select value={input.taskId ?? ''} onChange={(event) => setInput({ ...input, taskId: event.target.value || null })}>
              <option value="">関連タスクなし</option>
              {tasks.data?.items.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
            </select>
          </label>
          <label>メモ
            <textarea rows={5} maxLength={5000} value={input.memo ?? ''} onChange={(event) => setInput({ ...input, memo: event.target.value || null })} />
          </label>
          {save.error && <ErrorState error={save.error} />}
          <button className="button primary full" disabled={save.isPending || !input.title.trim() || !input.url.trim()}>
            {save.isPending ? '保存中…' : editing ? '変更を保存' : 'PRを登録'}
          </button>
        </form>

        <div className="pr-list-section">
          <div className="pr-list-heading">
            <h2>共有されたPR</h2>
            <span>{shares.data?.items.length ?? 0}件</span>
          </div>
          {shares.isLoading && <LoadingState label="Pull Requestを読み込んでいます…" />}
          {shares.error && <ErrorState error={shares.error} />}
          {remove.error && <ErrorState error={remove.error} />}
          <div className="pr-list">
            {shares.data?.items.length === 0 && <p className="empty-state">共有されたPull Requestはまだありません。</p>}
            {shares.data?.items.map((share) => (
              <article className="pr-card" key={share.id}>
                <div className="pr-card-top">
                  <span className={`pr-status ${share.status}`}>{pullRequestStatusLabels[share.status]}</span>
                  <time>{new Date(share.updatedAt).toLocaleString('ja-JP')}</time>
                </div>
                <h3>{share.title}</h3>
                <a href={share.url} target="_blank" rel="noreferrer">GitHubで開く ↗</a>
                <dl>
                  <div><dt>担当者</dt><dd>{share.assignee?.name ?? '未設定'}</dd></div>
                  <div><dt>関連タスク</dt><dd>{share.task?.title ?? 'なし'}</dd></div>
                  <div><dt>登録者</dt><dd>{share.createdBy?.name ?? '退会済みユーザー'}</dd></div>
                </dl>
                {share.memo && <p className="pr-memo">{share.memo}</p>}
                <div className="pr-card-actions">
                  <button className="button ghost" onClick={() => beginEdit(share)}>編集</button>
                  <button className="button danger" disabled={remove.isPending} onClick={() => window.confirm('このPR共有を削除しますか？') && remove.mutate(share)}>削除</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
