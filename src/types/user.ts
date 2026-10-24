/** 我的页面数据 */
export interface MyProfile {
  id: number
  nickname: string
  avatar?: string
  groupCount: number
  monthAttendance: number
  totalAttendance: number
  /** 截止后临时请假的次数 */
  noShowCount: number
  pendingBillCount: number
}

/**
 * 报名记录里的状态
 * JOINED 已报名（还没开始）/ WAITLIST 候补中 / ATTENDED 已出勤 / NO_SHOW 鸽子（截止后请假）/ CANCELLED 截止前取消了
 */
export type SignupRecordStatus = 'JOINED' | 'WAITLIST' | 'ATTENDED' | 'NO_SHOW' | 'CANCELLED'

/** 我的报名记录 */
export interface SignupRecord {
  gameId: number
  title: string
  groupName: string
  venue: string
  startAt: string
  endAt: string
  status: SignupRecordStatus
  /** 候补第几位，status 为 WAITLIST 时才有 */
  waitlistRank?: number
}
