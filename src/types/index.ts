/**
 * 前后端共用的数据结构。
 * 后端定接口时以这里的字段名为准；后端改了字段，这里同步改。
 *
 * 约定：
 * - 时间一律用 ISO 8601 字符串，例如 2026-10-31T19:00:00+08:00
 * - 金额一律用「分」为单位的整数，避免小数精度问题（¥35 = 3500）
 */

/** 运动类型 */
export type SportType = 'BADMINTON' | 'BASKETBALL' | 'FOOTBALL' | 'FRISBEE' | 'OTHER'

/**
 * 场次状态
 * UPCOMING 未开放 → OPEN 报名中 → CLOSED 已截止 → FINISHED 已结束；CANCELLED 已取消
 */
export type GameStatus = 'UPCOMING' | 'OPEN' | 'CLOSED' | 'FINISHED' | 'CANCELLED'

/** 我在某一场的报名状态：未报名 / 已报名 / 候补中 */
export type MySignupStatus = 'NONE' | 'JOINED' | 'WAITLIST'

/** 收费方式：AA 分摊 / 固定每人 */
export type FeeMode = 'AA' | 'FIXED'

/** 我在群组里的角色 */
export type GroupRole = 'OWNER' | 'ADMIN' | 'MEMBER'

/** 用户（列表、名单里展示用的精简信息） */
export interface Member {
  id: number
  nickname: string
  avatar?: string
}

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

/** 群组 */
export interface Group {
  id: number
  name: string
  sport: SportType
  memberCount: number
  myRole: GroupRole
  /** 例如「每周六」，由固定局规则生成 */
  scheduleText: string
  inviteCode?: string
}

/** 费用项 */
export interface BillItem {
  id: number
  name: string
  /** 金额（分） */
  amount: number
}

/** 账单里每个人的应付情况 */
export interface BillMember {
  member: Member
  /** 应付金额（分） */
  amount: number
  paid: boolean
  paidAt?: string
  /** 组织者：已经垫付了全部费用，自己不用转账 */
  isOrganizer: boolean
  /** 成员自己点了「我已转账」的时间，等组织者确认；组织者标记已付后这个字段就没用了 */
  claimedAt?: string
}

/** 一场的费用账单 */
export interface Bill {
  id: number
  gameId: number
  gameTitle: string
  gameStartAt: string
  groupName: string
  items: BillItem[]
  members: BillMember[]
}

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

/** 待付款：我在某个账单里还没付的那一笔 */
export interface PendingBill {
  billId: number
  gameId: number
  gameTitle: string
  gameStartAt: string
  groupName: string
  organizer: Member
  /** 我应付的金额（分） */
  amount: number
  /** 我点「我已转账」的时间，等组织者确认 */
  claimedAt?: string
}
