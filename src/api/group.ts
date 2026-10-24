/**
 * 群组相关接口。
 * - fetchMyGroups / fetchGroupDetail / joinGroupByCode / createGroup  ✅ 已接入后端（rally-server：GroupController）
 * - 群组管理（下面那一段）还是 mock，后端做完后换成注释里的 http 调用
 */
import { ME, db, membersOf } from '@/mock/db'
import type { GameBrief, Group, GroupMember, GroupRole, Member } from '@/types'
import { ApiError, http } from '@/utils/request'
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
  return http.get<Group[]>('/groups/mine')
}

/** 群组详情 */
export function fetchGroupDetail(id: number): Promise<GroupDetail> {
  return http.get<GroupDetail>(`/groups/${id}`)
}

/** 用邀请码加入群组 */
export function joinGroupByCode(code: string): Promise<Group> {
  return http.post<Group>('/groups/join', { code })
}

/** 创建群组 */
export function createGroup(name: string, sport: Group['sport']): Promise<Group> {
  return http.post<Group>('/groups', { name, sport })
}

// ---------------- 群组管理（群主 / 管理员） ----------------

/** 我能管理这个群吗：群主和管理员可以 */
/** 群组管理接口后端还没做：真实群组在 mock 里找不到，给一个明确的提示 */
const NOT_READY = '群组管理接口后端还在开发中'

function findManagedGroup(id: number) {
  const group = db.groups.find((g) => g.id === id)
  if (!group) throw new ApiError(501, NOT_READY)
  if (group.myRole === 'MEMBER') throw new ApiError(403, '只有群主和管理员可以操作')
  return group
}

/** 群成员名单（带角色） */
export function fetchGroupMembers(groupId: number): Promise<GroupMember[]> {
  // return http.get<GroupMember[]>(`/groups/${groupId}/members`)
  return mockRequest(() => {
    if (!db.groups.some((g) => g.id === groupId)) throw new ApiError(501, NOT_READY)
    return membersOf(groupId)
  })
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
