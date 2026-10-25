/**
 * 用户相关接口。
 * - fetchMyProfile / updateMyProfile / uploadAvatar  ✅ 已接入后端（rally-server：UserController）
 * - fetchMySignups  还是 mock，后端做完报名模块后换成注释里的 http 调用
 */
import { ME, db, toBrief } from '@/mock/db'
import type { GameStatus, MySignupStatus, MyProfile, SignupRecord, SignupRecordStatus } from '@/types'
import { http, upload } from '@/utils/request'
import { mockRequest } from './mock'

export function fetchMyProfile(): Promise<MyProfile> {
  return http.get<MyProfile>('/users/me')
}

export interface UpdateProfileForm {
  /** 昵称，最多 12 个字 */
  nickname: string
  /** 个人介绍，最多 100 个字；不传表示不改，传空字符串表示清空 */
  bio?: string
}

/** 修改昵称和个人介绍，返回修改后的「我的」数据 */
export function updateMyProfile(form: UpdateProfileForm): Promise<MyProfile> {
  return http.put<MyProfile>('/users/me', form)
}

/**
 * 上传头像，返回修改后的「我的」数据（avatar 是新头像地址）。
 * filePath：uni.chooseImage 拿到的临时路径；小程序也可以用 <button open-type="chooseAvatar"> 拿微信头像。
 * 只支持 JPG / PNG / WEBP / GIF，不超过 2MB，选图时建议加 sizeType: ['compressed']。
 */
export function uploadAvatar(filePath: string): Promise<MyProfile> {
  return upload<MyProfile>({ url: '/users/me/avatar', filePath })
}

/** 场次状态 + 我的报名状态 → 报名记录里显示的状态 */
function recordStatus(status: GameStatus, mySignup: MySignupStatus, noShowIds?: number[]): SignupRecordStatus {
  if (status === 'CANCELLED') return 'CANCELLED'
  if (status === 'FINISHED') return noShowIds?.includes(ME.id) ? 'NO_SHOW' : 'ATTENDED'
  return mySignup === 'WAITLIST' ? 'WAITLIST' : 'JOINED'
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
        status: recordStatus(g.status, g.mySignup, db.games.find((x) => x.id === g.id)?.noShowIds),
        waitlistRank: g.myWaitlistRank,
      }))
    const all = [...fromGames, ...db.historyRecords]
    const finished = (r: SignupRecord) => ['ATTENDED', 'NO_SHOW', 'CANCELLED'].includes(r.status)
    return scope === 'UPCOMING'
      ? all.filter((r) => !finished(r)).sort((a, b) => a.startAt.localeCompare(b.startAt))
      : all.filter(finished).sort((a, b) => b.startAt.localeCompare(a.startAt))
  })
}
