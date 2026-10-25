/**
 * 群组相关接口。✅ 全部已接入后端（rally-server：GroupController）
 */
import type { GameBrief, Group, GroupMember, GroupRole, Member } from '@/types'
import { http } from '@/utils/request'

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
// 权限由后端校验：普通成员调用会返回「只有群主和管理员可以操作」等提示

/** 群成员名单（带角色）：群成员都能看 */
export function fetchGroupMembers(groupId: number): Promise<GroupMember[]> {
  return http.get<GroupMember[]>(`/groups/${groupId}/members`)
}

/** 修改群名称 */
export function updateGroup(groupId: number, data: { name: string }): Promise<Group> {
  return http.put<Group>(`/groups/${groupId}`, data)
}

/** 重新生成邀请码，旧的立即失效 */
export function resetInviteCode(groupId: number): Promise<{ inviteCode: string }> {
  return http.post<{ inviteCode: string }>(`/groups/${groupId}/invite-code`)
}

/** 群主设置 / 取消管理员 */
export function setMemberRole(groupId: number, memberId: number, role: Exclude<GroupRole, 'OWNER'>): Promise<GroupMember[]> {
  return http.put<GroupMember[]>(`/groups/${groupId}/members/${memberId}`, { role })
}

/** 移出群组：群主可以移出任何人，管理员只能移出普通成员；不能移出群主和自己 */
export function removeGroupMember(groupId: number, memberId: number): Promise<GroupMember[]> {
  return http.delete<GroupMember[]>(`/groups/${groupId}/members/${memberId}`)
}
