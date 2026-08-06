import type { TeamRole } from '../types'

const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  owner: 'リーダー',
  member: '一般',
}

export function getTeamRoleLabel(role: TeamRole) {
  return TEAM_ROLE_LABELS[role]
}
