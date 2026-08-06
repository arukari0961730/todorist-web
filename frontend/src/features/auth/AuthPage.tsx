import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/auth'
import { ApiError } from '../../api/client'
import { queryClient } from '../../app/query-client'
import { navigate } from '../../app/navigation'

interface AuthPageProps {
  mode: 'login' | 'register'
}

export function AuthPage({ mode }: AuthPageProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const mutation = useMutation({
    mutationFn: () =>
      mode === 'login'
        ? authApi.login({ email, password })
        : authApi.register({
            name,
            email,
            password,
            passwordConfirmation: confirmation,
          }),
    onSuccess: async (data) => {
      queryClient.setQueryData(['auth', 'me'], data)
      const next = new URLSearchParams(window.location.search).get('next')
      navigate(next && next.startsWith('/') ? next : '/')
    },
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-mark">T</div>
        <p className="eyebrow">GAME PRODUCTION WORKSPACE</p>
        <h1>{mode === 'login' ? 'おかえりなさい' : 'アカウント作成'}</h1>
        <p className="muted">
          {mode === 'login'
            ? 'チームの制作作業を続けましょう。'
            : '無料で制作チームの管理を始められます。'}
        </p>
        <form className="form-stack" onSubmit={submit}>
          {mode === 'register' && (
            <label>
              名前
              <input value={name} onChange={(event) => setName(event.target.value)} maxLength={50} required />
            </label>
          )}
          <label>
            メールアドレス
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            パスワード
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} maxLength={128} required />
          </label>
          {mode === 'register' && (
            <label>
              パスワード確認
              <input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={10} maxLength={128} required />
            </label>
          )}
          {mutation.error && <ErrorText error={mutation.error} />}
          <button className="button primary" disabled={mutation.isPending}>
            {mutation.isPending ? '処理中…' : mode === 'login' ? 'ログイン' : '登録する'}
          </button>
        </form>
        <p className="auth-switch">
          {mode === 'login' ? '初めて利用しますか？' : 'すでにアカウントがありますか？'}{' '}
          <a href={mode === 'login' ? '/register' : '/login'}>
            {mode === 'login' ? '新規登録' : 'ログイン'}
          </a>
        </p>
      </section>
    </main>
  )
}

function ErrorText({ error }: { error: Error }) {
  const message = error instanceof ApiError ? error.message : '処理に失敗しました'
  return <p className="error-message">{message}</p>
}
