import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { commentsApi } from '../../api/comments'
import { ErrorState, LoadingState } from '../../components/States'
import type { Task } from '../../types'

export function TaskComments({ task, currentUserId }: { task: Task; currentUserId: string }) {
  const client = useQueryClient()
  const [message, setMessage] = useState('')
  const queryKey = ['tasks', task.id, 'comments']
  const comments = useQuery({ queryKey, queryFn: () => commentsApi.list(task.id) })
  const create = useMutation({
    mutationFn: () => commentsApi.create(task.id, message),
    onSuccess: async () => {
      setMessage('')
      await client.invalidateQueries({ queryKey })
    },
  })
  const remove = useMutation({
    mutationFn: commentsApi.remove,
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
    <section className="task-comments">
      <div className="panel-heading">
        <div><p className="eyebrow">COMMENTS</p><h3>コメント</h3></div>
        <span className="count-pill">{comments.data?.items.length ?? 0}</span>
      </div>
      {comments.isLoading && <LoadingState label="コメントを読み込んでいます…" />}
      {comments.error && <ErrorState error={comments.error} />}
      <div className="comment-list">
        {comments.data?.items.length === 0 && <p className="comment-empty">コメントはまだありません</p>}
        {comments.data?.items.map((comment) => (
          <article className="comment-item" key={comment.id}>
            <div className="comment-meta">
              <div className="avatar">{comment.user?.name.slice(0, 1).toUpperCase() ?? '退'}</div>
              <div><strong>{comment.user?.name ?? '退会済みユーザー'}</strong><time>{new Date(comment.createdAt).toLocaleString('ja-JP')}</time></div>
              {comment.user?.id === currentUserId && (
                <button
                  className="button ghost danger-text comment-delete"
                  disabled={remove.isPending}
                  onClick={() => window.confirm('このコメントを削除しますか？') && remove.mutate(comment.id)}
                >削除</button>
              )}
            </div>
            <p>{comment.message}</p>
          </article>
        ))}
      </div>
      <form className="comment-form" onSubmit={submit}>
        <label>
          コメントを追加
          <textarea
            value={message}
            rows={3}
            maxLength={2000}
            placeholder="コメントを入力（Ctrl + Enterで投稿）"
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
          />
        </label>
        {create.error && <ErrorState error={create.error} />}
        {remove.error && <ErrorState error={remove.error} />}
        <button className="button primary" disabled={create.isPending || !message.trim()}>{create.isPending ? '投稿中…' : 'コメントを投稿'}</button>
      </form>
    </section>
  )
}
