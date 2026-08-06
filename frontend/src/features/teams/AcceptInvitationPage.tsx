import { useMutation } from '@tanstack/react-query'
import { teamsApi } from '../../api/teams'
import { ErrorState } from '../../components/States'
import { queryClient } from '../../app/query-client'
import { navigate } from '../../app/navigation'

export function AcceptInvitationPage({ token }: { token: string }) {
  const accept = useMutation({
    mutationFn: () => teamsApi.acceptInvitation(token),
    onSuccess: async (team) => {
      await queryClient.invalidateQueries({ queryKey: ['teams'] })
      localStorage.setItem('todorist:pendingSelectedTeamId', team.id)
      navigate('/')
    },
  })
  return <main className="auth-shell"><section className="auth-card"><div className="brand-mark">T</div><p className="eyebrow">TEAM INVITATION</p><h1>チームへ参加</h1><p className="muted">招待されたメールアドレスのアカウントで参加してください。</p>{accept.error && <ErrorState error={accept.error} />}<button className="button primary" disabled={accept.isPending || !token} onClick={() => accept.mutate()}>{accept.isPending ? '参加中…' : '招待を承認する'}</button><a className="button ghost" href="/">戻る</a></section></main>
}
