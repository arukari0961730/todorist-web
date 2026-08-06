import { useQuery } from '@tanstack/react-query'
import { authApi } from './api/auth'
import { useLocationPath } from './app/navigation'
import { LoadingState } from './components/States'
import { AuthPage } from './features/auth/AuthPage'
import { AcceptInvitationPage } from './features/teams/AcceptInvitationPage'
import { WorkspacePage } from './features/teams/WorkspacePage'
import './App.css'

function App() {
  const path = useLocationPath()
  const auth = useQuery({ queryKey: ['auth', 'me'], queryFn: authApi.me, retry: false })
  if (auth.isLoading) return <main className="center-page"><LoadingState label="ログイン状態を確認しています…" /></main>

  const user = auth.data?.user
  const inviteMatch = path.match(/^\/invite\/([^/]+)$/)

  if (!user) {
    if (path === '/register') return <AuthPage mode="register" />
    if (path !== '/login') {
      const next = inviteMatch ? `?next=${encodeURIComponent(path)}` : ''
      window.history.replaceState(null, '', `/login${next}`)
    }
    return <AuthPage mode="login" />
  }

  if (path === '/login' || path === '/register') {
    window.history.replaceState(null, '', '/')
  }
  if (inviteMatch) return <AcceptInvitationPage token={decodeURIComponent(inviteMatch[1])} />
  return <WorkspacePage user={user} />
}

export default App
