/**
 * 用户相关接口。
 * 现在用 mock 数据；后端完成后换成注释里的 http 调用即可。
 */
import { ME, db, toBrief } from '@/mock/db'
import type { MyProfile, SignupRecord } from '@/types'
import { mockRequest } from './mock'

/** 我还没付的账单数量 */
function pendingBillCount() {
  return db.bills.filter((b) => b.members.some((m) => m.member.id === ME.id && !m.paid && !m.isOrganizer)).length
}

export function fetchMyProfile(): Promise<MyProfile> {
  // return http.get<MyProfile>('/users/me')
  return mockRequest(() => ({ ...db.profile, groupCount: db.groups.length, pendingBillCount: pendingBillCount() }))
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
