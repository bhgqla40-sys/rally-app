/**
 * 用户相关接口。
 * - fetchMyProfile  ✅ 已接入后端（rally-server：UserController）
 * - fetchMySignups  还是 mock，后端做完报名模块后换成注释里的 http 调用
 */
import { db, toBrief } from '@/mock/db'
import type { MyProfile, SignupRecord } from '@/types'
import { http } from '@/utils/request'
import { mockRequest } from './mock'

export function fetchMyProfile(): Promise<MyProfile> {
  return http.get<MyProfile>('/users/me')
}

/** 报名记录：UPCOMING 还没结束的，HISTORY 已经结束的 */
export type SignupScope = 'UPCOMING' | 'HISTORY'

export function fetchMySignups(scope: SignupScope): Promise<SignupRecord[]> {
  // return http.get<SignupRecord[]>('/users/me/signups', { scope })
  return mockRequest(() => {
    const fromGames: SignupRecord[] = db.games
      .map(toBrief)
      .filter((g) => g.mySignup !== 'NONE')
      .map((g) => ({
        gameId: g.id,
        title: g.title,
        groupName: g.groupName,
        venue: g.venue,
        startAt: g.startAt,
        endAt: g.endAt,
        status: g.status === 'FINISHED' ? 'ATTENDED' : g.mySignup === 'WAITLIST' ? 'WAITLIST' : 'JOINED',
        waitlistRank: g.myWaitlistRank,
      }))
    const all = [...fromGames, ...db.historyRecords]
    const finished = (r: SignupRecord) => ['ATTENDED', 'NO_SHOW', 'CANCELLED'].includes(r.status)
    return scope === 'UPCOMING'
      ? all.filter((r) => !finished(r)).sort((a, b) => a.startAt.localeCompare(b.startAt))
      : all.filter(finished).sort((a, b) => b.startAt.localeCompare(a.startAt))
  })
}
