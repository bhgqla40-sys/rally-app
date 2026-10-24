import type { Member, SportType } from './common'

/** 我在群组里的角色 */
export type GroupRole = 'OWNER' | 'ADMIN' | 'MEMBER'

/** 群组 */
export interface Group {
  id: number
  name: string
  sport: SportType
  memberCount: number
  myRole: GroupRole
  /** 例如「每周六」，由固定局规则生成 */
  scheduleText: string
  inviteCode?: string
}

/** 群成员（群组管理页用） */
export interface GroupMember {
  member: Member
  role: GroupRole
  joinedAt: string
}
