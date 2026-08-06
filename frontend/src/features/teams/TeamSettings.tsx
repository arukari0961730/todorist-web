import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { teamsApi } from '../../api/teams'
import { ErrorState, LoadingState } from '../../components/States'
import type { Team, TeamMember, User } from '../../types'
import { getTeamRoleLabel } from '../../utils/teamRole'

interface Props {
  team: Team
  currentUser: User
  onTeamRemoved: () => void
}

export function TeamSettings({ team, currentUser, onTeamRemoved }: Props) {
  const client = useQueryClient()
  const [name, setName] = useState(team.name)
  const [email, setEmail] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const members = useQuery({
    queryKey: ['teams', team.id, 'members'],
    queryFn: () => teamsApi.members(team.id),
  })
  const invitations = useQuery({
    queryKey: ['teams', team.id, 'invitations'],
    queryFn: () => teamsApi.invitations(team.id),
    enabled: team.role === 'owner',
  })
  const invalidate = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['teams'] }),
      client.invalidateQueries({ queryKey: ['teams', team.id, 'members'] }),
      client.invalidateQueries({ queryKey: ['teams', team.id, 'invitations'] }),
    ])
  }
  const rename = useMutation({
    mutationFn: () => teamsApi.update(team.id, { name, version: team.version }),
    onSuccess: invalidate,
  })
  const invite = useMutation({
    mutationFn: () => teamsApi.createInvitation(team.id, email),
    onSuccess: async (result) => {
      setInviteLink(`${window.location.origin}/invite/${result.token}`)
      setEmail('')
      await invalidate()
    },
  })
  const changeRole = useMutation({
    mutationFn: (input: { member: TeamMember; role: 'owner' | 'member' }) =>
      teamsApi.updateMember(team.id, input.member.id, {
        role: input.role,
        version: input.member.version,
      }),
    onSuccess: invalidate,
  })
  const removeMember = useMutation({
    mutationFn: (member: TeamMember) =>
      teamsApi.removeMember(team.id, member.id, member.version),
    onSuccess: invalidate,
  })
  const revoke = useMutation({
    mutationFn: (invitationId: string) => teamsApi.revokeInvitation(team.id, invitationId),
    onSuccess: invalidate,
  })
  const removeTeam = useMutation({
    mutationFn: () => teamsApi.remove(team.id, team.version),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['teams'] })
      onTeamRemoved()
    },
  })
  const leave = useMutation({
    mutationFn: () => teamsApi.leave(team.id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['teams'] })
      onTeamRemoved()
    },
  })

  function submitRename(event: FormEvent) {
    event.preventDefault()
    rename.mutate()
  }
  function submitInvite(event: FormEvent) {
    event.preventDefault()
    invite.mutate()
  }

  return (
    <div className="settings-grid">
      <section className="panel">
        <div className="panel-heading"><div><p className="eyebrow">TEAM PROFILE</p><h2>チーム設定</h2></div></div>
        {team.role === 'owner' ? (
          <form className="form-stack compact" onSubmit={submitRename}>
            <label>チーム名<input value={name} onChange={(event) => setName(event.target.value)} maxLength={30} required /></label>
            {rename.error && <ErrorState error={rename.error} />}
            <button className="button primary" disabled={rename.isPending || name.trim() === team.name}>名前を変更</button>
          </form>
        ) : <p className="muted">チーム設定はリーダーのみ変更できます。</p>}
      </section>

      <section className="panel span-two">
        <div className="panel-heading"><div><p className="eyebrow">MEMBERS</p><h2>メンバー</h2></div><span className="count-pill">{members.data?.items.length ?? 0}</span></div>
        {members.isLoading && <LoadingState />}
        {members.error && <ErrorState error={members.error} />}
        <div className="member-list">
          {members.data?.items.map((member) => (
            <div className="member-row" key={member.id}>
              <div className="avatar">{member.user.name.slice(0, 1).toUpperCase()}</div>
              <div className="member-main"><strong>{member.user.name}</strong><span>{member.user.email}</span></div>
              {team.role === 'owner' ? (
                <select
                  aria-label={`${member.user.name}の権限`}
                  value={member.role}
                  disabled={changeRole.isPending}
                  onChange={(event) => changeRole.mutate({ member, role: event.target.value as 'owner' | 'member' })}
                >
                  <option value="owner">リーダー</option><option value="member">一般</option>
                </select>
              ) : <span className="role-badge">{getTeamRoleLabel(member.role)}</span>}
              {team.role === 'owner' && member.user.id !== currentUser.id && (
                <button
                  className="icon-button danger"
                  title="メンバーを削除"
                  onClick={() => window.confirm(`${member.user.name}をチームから削除しますか？`) && removeMember.mutate(member)}
                >×</button>
              )}
            </div>
          ))}
        </div>
        {(changeRole.error || removeMember.error) && <ErrorState error={(changeRole.error ?? removeMember.error)!} />}
      </section>

      {team.role === 'owner' && (
        <section className="panel span-two">
          <div className="panel-heading"><div><p className="eyebrow">INVITATIONS</p><h2>招待リンク</h2></div></div>
          <form className="inline-form" onSubmit={submitInvite}>
            <input type="email" placeholder="member@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <button className="button primary" disabled={invite.isPending}>発行</button>
          </form>
          {inviteLink && (
            <div className="invite-result"><input readOnly value={inviteLink} /><button className="button ghost" onClick={() => navigator.clipboard.writeText(inviteLink)}>コピー</button></div>
          )}
          {invite.error && <ErrorState error={invite.error} />}
          {invitations.error && <ErrorState error={invitations.error} />}
          <div className="invitation-list">
            {invitations.data?.items.map((item) => (
              <div className="invitation-row" key={item.id}>
                <div><strong>{item.email}</strong><span>期限: {new Date(item.expiresAt).toLocaleString('ja-JP')}</span></div>
                <button className="button ghost danger-text" onClick={() => revoke.mutate(item.id)}>取り消す</button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="panel danger-zone span-two">
        <p className="eyebrow">DANGER ZONE</p>
        <h2>{team.role === 'owner' ? 'チームを削除' : 'チームから退出'}</h2>
        <p className="muted">{team.role === 'owner' ? 'チーム内のタスクと関連データが完全に削除されます。' : '最後のリーダーの場合は退出できません。'}</p>
        <button
          className="button danger-button"
          disabled={removeTeam.isPending || leave.isPending}
          onClick={() => {
            const message = team.role === 'owner' ? `「${team.name}」を完全に削除しますか？` : `「${team.name}」から退出しますか？`
            if (!window.confirm(message)) return
            if (team.role === 'owner') removeTeam.mutate()
            else leave.mutate()
          }}
        >{team.role === 'owner' ? 'チームを削除' : 'チームから退出'}</button>
        {(removeTeam.error || leave.error) && <ErrorState error={(removeTeam.error ?? leave.error)!} />}
      </section>
    </div>
  )
}
