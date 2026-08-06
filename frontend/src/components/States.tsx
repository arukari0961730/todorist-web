import { ApiError } from '../api/client'

export function LoadingState({ label = '読み込み中…' }: { label?: string }) {
  return <div className="state-card"><span className="spinner" />{label}</div>
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><div className="empty-icon">✓</div><h3>{title}</h3><p>{detail}</p></div>
}

export function ErrorState({ error }: { error: Error }) {
  return <p className="error-message">{error instanceof ApiError ? error.message : '処理に失敗しました'}</p>
}
