/**
 * 群组相关接口。
 * 现在用 mock 数据；后端完成后换成注释里的 http 调用即可。
 */
import { ME, PEOPLE, db, toBrief } from '@/mock/db'
import type { GameBrief, Group, Member } from '@/types'
import { ApiError } from '@/utils/request'
import { mockRequest } from './mock'

export interface GroupDetail extends Group {
  owner: Member
  /** 成员预览（前几位） */
  members: Member[]
  /** 这个群接下来的场次 */
  upcomingGames: GameBrief[]
  /** 最近结束的场次（组织者在这里进入费用结算） */
  recentFinishedGames: GameBrief[]
}

/** 我加入的群组 */
export function fetchMyGroups(): Promise<Group[]> {
  // return http.get<Group[]>('/groups/mine')
  return mockRequest(() => db.groups)
}

/** 群组详情 */
export function fetchGroupDetail(id: number): Promise<GroupDetail> {
  // return http.get<GroupDetail>(`/groups/${id}`)
  return mockRequest(() => {
    const group = db.groups.find((g) => g.id === id)
    if (!group) throw new ApiError(404, '群组不存在')
    const games = db.games.filter((g) => g.groupId === id)
    const owner = group.myRole === 'OWNER' ? ME : games[0]?.organizer ?? PEOPLE[0]
    return {
      ...group,
      owner,
      members: [owner, ...PEOPLE.filter((p) => p.id !== owner.id).slice(id * 2, id * 2 + 9)],
      upcomingGames: games
        .map(toBrief)
        .filter((g) => g.status !== 'FINISHED' && g.status !== 'CANCELLED')
        .sort((a, b) => a.startAt.localeCompare(b.startAt)),
      recentFinishedGames: games
        .map(toBrief)
        .filter((g) => g.status === 'FINISHED')
        .sort((a, b) => b.startAt.localeCompare(a.startAt))
        .slice(0, 3),
    }
  })
}

/** 用邀请码加入群组 */
export function joinGroupByCode(code: string): Promise<Group> {
  // return http.post<Group>('/groups/join', { code })
  return mockRequest(() => {
    const normalized = code.trim().toUpperCase()
    const joined = db.groups.find((g) => g.inviteCode === normalized)
    if (joined) throw new ApiError(400, `你已经在「${joined.name}」里了`)
    const index = db.otherGroups.findIndex((g) => g.inviteCode === normalized)
    if (index < 0) throw new ApiError(404, '邀请码不正确，请向群主确认')
    const [group] = db.otherGroups.splice(index, 1)
    group.memberCount += 1
    db.groups.push(group)
    db.profile.groupCount = db.groups.length
    return group
  })
}

/** 创建群组 */
export function createGroup(name: string, sport: Group['sport']): Promise<Group> {
  // return http.post<Group>('/groups', { name, sport })
  return mockRequest(() => {
    const group: Group = {
      id: Math.max(...db.groups.map((g) => g.id)) + 1,
      name,
      sport,
      memberCount: 1,
      myRole: 'OWNER',
      scheduleText: '还没有固定局',
      inviteCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
    }
    db.groups.push(group)
    db.profile.groupCount = db.groups.length
    return group
  })
}
