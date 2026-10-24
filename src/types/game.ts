import type { Member, SportType } from './common'

/**
 * 场次状态
 * UPCOMING 未开放 → OPEN 报名中 → CLOSED 已截止 → FINISHED 已结束；CANCELLED 已取消
 */
export type GameStatus = 'UPCOMING' | 'OPEN' | 'CLOSED' | 'FINISHED' | 'CANCELLED'

/** 我在某一场的报名状态：未报名 / 已报名 / 候补中 */
export type MySignupStatus = 'NONE' | 'JOINED' | 'WAITLIST'

/** 收费方式：AA 分摊 / 固定每人 */
export type FeeMode = 'AA' | 'FIXED'

/** 场次：列表页用 */
export interface GameBrief {
  id: number
  title: string
  groupId: number
  groupName: string
  sport: SportType
  venue: string
  startAt: string
  endAt: string
  /** 开放报名时间 */
  openAt: string
  /** 截止报名时间（截止后不能报名，也不能取消） */
  deadlineAt: string
  capacity: number
  joinedCount: number
  waitlistCount: number
  status: GameStatus
  mySignup: MySignupStatus
  /** 我在候补里排第几位，mySignup 为 WAITLIST 时才有 */
  myWaitlistRank?: number
}

/** 场次：详情页用 */
export interface GameDetail extends GameBrief {
  organizer: Member
  feeMode: FeeMode
  /** 预计每人费用（分）；AA 时是估算值，固定收费时是确定值 */
  feePerPerson?: number
  allowWaitlist: boolean
  /** 有人取消时是否自动从候补递补 */
  autoPromote: boolean
  /** 报名名单，按报名先后排序 */
  joined: Member[]
  /** 候补名单，按排队先后排序 */
  waitlist: Member[]
  /** 群规，每条一句话 */
  rules: string[]
}

/** 固定局规则（每周按这个规则自动生成场次） */
export interface GameTemplateForm {
  groupId: number
  name: string
  sport: SportType
  venue: string
  /** 每周几：1 = 周一 … 7 = 周日 */
  weekday: number
  /** 开始时间，HH:mm */
  startTime: string
  durationMinutes: number
  capacity: number
  /** 提前几天开放报名 */
  openDaysBefore: number
  /** 开放报名的时刻，HH:mm */
  openTime: string
  /** 开局前几小时截止报名 */
  deadlineHoursBefore: number
  allowWaitlist: boolean
  autoPromote: boolean
  feeMode: FeeMode
  /** 固定收费时每人金额（分） */
  fixedFee?: number
}
