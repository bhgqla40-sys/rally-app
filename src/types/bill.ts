import type { Member } from './common'

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
