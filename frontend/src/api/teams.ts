import { apiRequest } from './client'
import type { Invitation, Team, TeamMember, TeamRole } from '../types'

export const teamsApi = {
  list: () => apiRequest<{ items: Team[] }>('/teams'),
  create: (input: { name: string; timezone?: string }) =>
    apiRequest<Team>('/teams', { method: 'POST', body: JSON.stringify(input) }),
  update: (teamId: string, input: { name?: string; timezone?: string; version: number }) =>
    apiRequest<Team>(`/teams/${teamId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  remove: (teamId: string, version: number) =>
    apiRequest<void>(`/teams/${teamId}?version=${version}`, { method: 'DELETE' }),
  members: (teamId: string) =>
    apiRequest<{ items: TeamMember[] }>(`/teams/${teamId}/members`),
  updateMember: (
    teamId: string,
    memberId: string,
    input: { role: TeamRole; version: number },
  ) =>
    apiRequest<TeamMember>(`/teams/${teamId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  removeMember: (teamId: string, memberId: string, version: number) =>
    apiRequest<void>(`/teams/${teamId}/members/${memberId}?version=${version}`, {
      method: 'DELETE',
    }),
  leave: (teamId: string) =>
    apiRequest<void>(`/teams/${teamId}/leave`, { method: 'POST' }),
  invitations: (teamId: string) =>
    apiRequest<{ items: Invitation[] }>(`/teams/${teamId}/invitations`),
  createInvitation: (teamId: string, email: string) =>
    apiRequest<{ id: string; email: string; expiresAt: string; token: string }>(
      `/teams/${teamId}/invitations`,
      { method: 'POST', body: JSON.stringify({ email }) },
    ),
  revokeInvitation: (teamId: string, invitationId: string) =>
    apiRequest<void>(`/teams/${teamId}/invitations/${invitationId}`, {
      method: 'DELETE',
    }),
  acceptInvitation: (token: string) =>
    apiRequest<{ id: string; name: string }>(`/invitations/${token}/accept`, {
      method: 'POST',
    }),
}
