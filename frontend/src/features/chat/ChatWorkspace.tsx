import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chatApi } from '../../api/chat'
import { ErrorState, LoadingState } from '../../components/States'
import type { Team, User } from '../../types'

export function ChatWorkspace({ team, currentUser }: { team: Team; currentUser: User }) {
  const client = useQueryClient()
  const [message, setMessage] = useState('')
  const queryKey = ['teams', team.id, 'messages']
  const messages = useQuery({ queryKey, queryFn: () => chatApi.list(team.id) })
  const create = useMutation({
    mutationFn: () => chatApi.create(team.id, message),
    onSuccess: async () => {
      setMessage('')
      await client.invalidateQueries({ queryKey })
    },
  })
  const remove = useMutation({
    mutationFn: chatApi.remove,
    onSuccess: () => client.invalidateQueries({ queryKey }),
  })

  function submit(event?: FormEvent) {
    event?.preventDefault()
    if (!message.trim() || create.isPending) return
    create.mutate()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <section className="chat-workspace">
      <div className="workspace-heading chat-heading">
        <div>
          <p className="eyebrow">TEAM CHAT</p>
          <h1>{team.name}のチャット</h1>
          <p className="muted">チームメンバーと制作状況を共有します。</p>
        </div>
        <button className="button ghost" disabled={messages.isFetching} onClick={() => messages.refetch()}>
          {messages.isFetching ? '更新中…' : '更新'}
        </button>
      </div>

      <div className="chat-panel">
        {messages.isLoading && <LoadingState label="メッセージを読み込んでいます…" />}
        {messages.error && <ErrorState error={messages.error} />}
        <div className="chat-message-list" aria-live="polite">
          {messages.data?.items.length === 0 && (
            <div className="chat-empty">
              <strong>メッセージはまだありません</strong>
              <span>最初のメッセージを送ってみましょう。</span>
            </div>
          )}
          {messages.data?.items.map((item) => {
            const mine = item.user?.id === currentUser.id
            return (
              <article className={`chat-message${mine ? ' mine' : ''}`} key={item.id}>
                <div className="avatar">{item.user?.name.slice(0, 1).toUpperCase() ?? '退'}</div>
                <div className="chat-bubble-wrap">
                  <div className="chat-meta">
                    <strong>{item.user?.name ?? '退会済みユーザー'}</strong>
                    <time>{new Date(item.createdAt).toLocaleString('ja-JP')}</time>
                    {mine && (
                      <button
                        className="chat-delete"
                        disabled={remove.isPending}
                        onClick={() => window.confirm('このメッセージを削除しますか？') && remove.mutate(item.id)}
                      >削除</button>
                    )}
                  </div>
                  <p>{item.message}</p>
                </div>
              </article>
            )
          })}
        </div>

        <form className="chat-form" onSubmit={submit}>
          <label htmlFor="chat-message">メッセージ</label>
          <textarea
            id="chat-message"
            value={message}
            rows={4}
            maxLength={2000}
            placeholder="メッセージを入力（Ctrl + Enterで送信）"
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="chat-form-footer">
            <span>{message.length} / 2000</span>
            <button className="button primary" disabled={create.isPending || !message.trim()}>
              {create.isPending ? '送信中…' : '送信'}
            </button>
          </div>
          {create.error && <ErrorState error={create.error} />}
          {remove.error && <ErrorState error={remove.error} />}
        </form>
      </div>
    </section>
  )
}
