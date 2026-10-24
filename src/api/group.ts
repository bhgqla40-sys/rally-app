/**
 * 群组相关接口。
 * 现在用 mock 数据；后端完成后换成注释里的 http 调用即可。
 */
import { ME, db, membersOf, toBrief } from '@/mock/db'
import type { GameBrief, Group, GroupMember, GroupRole, Member } from '@/types'
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
    const members = membersOf(id)
    return {
      ...group,
      owner: members.find((m) => m.role === 'OWNER')!.member,
      members: members.slice(0, 10).map((m) => m.member),
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

// ---------------- 群组管理（群主 / 管理员） ----------------

/** 我能管理这个群吗：群主和管理员可以 */
function findManagedGroup(id: number) {
  const group = db.groups.find((g) => g.id === id)
  if (!group) throw new ApiError(404, '群组不存在')
  if (group.myRole === 'MEMBER') throw new ApiError(403, '只有群主和管理员可以操作')
  return group
}

/** 群成员名单（带角色） */
export function fetchGroupMembers(groupId: number): Promise<GroupMember[]> {
  // return http.get<GroupMember[]>(`/groups/${groupId}/members`)
  return mockRequest(() => membersOf(groupId))
}

/** 修改群名称 */
export function updateGroup(groupId: number, data: { name: string }): Promise<Group> {
  // return http.put<Group>(`/groups/${groupId}`, data)
  return mockRequest(() => {
    const group = findManagedGroup(groupId)
    group.name = data.name
    db.games.filter((g) => g.groupId === groupId).forEach((g) => (g.groupName = data.name))
    return group
  })
}

/** 重新生成邀请码，旧的立即失效 */
export function resetInviteCode(groupId: number): Promise<{ inviteCode: string }> {
  // return http.post<{ inviteCode: string }>(`/groups/${groupId}/invite-code`)
  return mockRequest(() => {
    const group = findManagedGroup(groupId)
    group.inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase()
    return { inviteCode: group.inviteCode }
  })
}

/** 群主设置 / 取消管理员 */
export function setMemberRole(groupId: number, memberId: number, role: Exclude<GroupRole, 'OWNER'>): Promise<GroupMember[]> {
  // return http.put<GroupMember[]>(`/groups/${groupId}/members/${memberId}`, { role })
  return mockRequest(() => {
    const group = findManagedGroup(groupId)
    if (group.myRole !== 'OWNER') throw new ApiError(403, '只有群主可以设置管理员')
    const target = membersOf(groupId).find((m) => m.member.id === memberId)
    if (!target || target.role === 'OWNER') throw new ApiError(400, '不能修改群主的角色')
    target.role = role
    return membersOf(groupId)
  })
}

/** 移出群组：群主可以移出任何人，管理员只能移出普通成员 */
export function removeGroupMember(groupId: number, memberId: number): Promise<GroupMember[]> {
  // return http.delete<GroupMember[]>(`/groups/${groupId}/members/${memberId}`)
  return mockRequest(() => {
    const group = findManagedGroup(groupId)
    const list = membersOf(groupId)
    const target = list.find((m) => m.member.id === memberId)
    if (!target) throw new ApiError(404, '这个人不在群里')
    if (target.role === 'OWNER' || memberId === ME.id) throw new ApiError(400, '不能移出群主或自己')
    if (group.myRole === 'ADMIN' && target.role === 'ADMIN') throw new ApiError(403, '管理员不能移出其他管理员')
    list.splice(list.indexOf(target), 1)
    group.memberCount = Math.max(1, group.memberCount - 1)
    return list
  })
}
