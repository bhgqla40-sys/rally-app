/**
 * 场次相关接口  ✅ 已全部接入后端（rally-server：GameController）
 * 场次状态由后端按时间算出来：UPCOMING 未开放 / OPEN 报名中 / CLOSED 已截止 / FINISHED 已结束 / CANCELLED 已取消
 */
import type { GameBrief, GameDetail } from '@/types'
import { http } from '@/utils/request'

/** 首页筛选：全部 / 我报名的 / 可报名 */
export type GameFilter = 'ALL' | 'MINE' | 'AVAILABLE'

/** 首页列表：我所在的群里还没结束、没取消的场次，按开始时间排序 */
export function fetchGames(filter: GameFilter = 'ALL'): Promise<GameBrief[]> {
  return http.get<GameBrief[]>('/games', { filter })
}

/** 场次详情（不在群里的人也能看，方便分享链接报名） */
export function fetchGameDetail(id: number): Promise<GameDetail> {
  return http.get<GameDetail>(`/games/${id}`)
}

/**
 * 报名：有名额直接报上，满员了进候补，返回最新的详情。
 * 不在这个群里的人通过分享链接报名，会自动加入这个群。
 */
export function joinGame(id: number): Promise<GameDetail> {
  return http.post<GameDetail>(`/games/${id}/signup`)
}

/** 取消报名或退出候补；空出名额时，候补第一位自动递补 */
export function cancelSignup(id: number): Promise<GameDetail> {
  return http.delete<GameDetail>(`/games/${id}/signup`)
}

/** 组织者把某人移出报名名单或候补；空出名额时候补第一位自动递补 */
export function removeSignup(gameId: number, memberId: number): Promise<GameDetail> {
  return http.delete<GameDetail>(`/games/${gameId}/signups/${memberId}`)
}

/** 组织者取消这一场（开始前才能取消），reason 必填，最多 100 个字 */
export function cancelGame(gameId: number, reason: string): Promise<GameDetail> {
  return http.post<GameDetail>(`/games/${gameId}/cancel`, { reason })
}

/** 结束后组织者确认出勤：传入没来的人（鸽子）的 id，可以重复提交来修改 */
export function confirmAttendance(gameId: number, noShowIds: number[]): Promise<GameDetail> {
  return http.put<GameDetail>(`/games/${gameId}/attendance`, { noShowIds })
}
