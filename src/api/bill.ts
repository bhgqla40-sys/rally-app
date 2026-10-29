/**
 * 费用结算接口。
 * 现在用 mock 数据；后端完成后换成注释里的 http 调用即可。
 * 场次已经接入后端，真实场次在 mock 里找不到，会提示「后端还在开发中」（mock 场次的 id 从 9000 开始，不会和真实场次撞上）。
 *
 * 金额全部用「分」计算。AA 分摊除不尽时，余下的几分钱由前几个人各多出 1 分，
 * 保证每个人的应付金额加起来正好等于总费用。
 */
import dayjs from 'dayjs'
import { ME, db } from '@/mock/db'
import type { Bill, BillItem, PendingBill } from '@/types'
import { ApiError } from '@/utils/request'
import { mockRequest } from './mock'

/** 按到场人数平均分摊，返回每个人应付多少分 */
export function splitEvenly(total: number, count: number): number[] {
  if (count <= 0) return []
  const base = Math.floor(total / count)
  const remainder = total - base * count
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0))
}

function recalc(bill: Bill) {
  const total = bill.items.reduce((sum, item) => sum + item.amount, 0)
  const shares = splitEvenly(total, bill.members.length)
  bill.members.forEach((m, i) => {
    m.amount = shares[i]
  })
}

export const BILL_NOT_READY = 501

function findBill(id: number) {
  const bill = db.bills.find((b) => b.id === id)
  if (!bill) throw new ApiError(404, '账单不存在')
  return bill
}

/** 某一场的账单；还没有就新建一个空账单（到场成员 = 报名名单 - 鸽子） */
export function fetchBillByGame(gameId: number): Promise<Bill> {
  // return http.get<Bill>(`/games/${gameId}/bill`)
  return mockRequest(() => {
    let bill = db.bills.find((b) => b.gameId === gameId)
    if (!bill) {
      const game = db.games.find((g) => g.id === gameId)
      if (!game) throw new ApiError(BILL_NOT_READY, '费用结算接口后端还在开发中')
      bill = {
        id: Math.max(0, ...db.bills.map((b) => b.id)) + 1,
        gameId,
        gameTitle: game.title,
        gameStartAt: game.startAt,
        groupName: game.groupName,
        items: [],
        // 到场成员 = 报名名单 - 组织者确认的鸽子
        members: game.joined
          .filter((m) => !game.noShowIds?.includes(m.id))
          .map((m) => ({ member: m, amount: 0, paid: m.id === game.organizer.id, isOrganizer: m.id === game.organizer.id })),
      }
      db.bills.push(bill)
    }
    return bill
  })
}

export function addBillItem(billId: number, item: Omit<BillItem, 'id'>): Promise<Bill> {
  // return http.post<Bill>(`/bills/${billId}/items`, item)
  return mockRequest(() => {
    const bill = findBill(billId)
    bill.items.push({ ...item, id: Math.max(0, ...bill.items.map((i) => i.id)) + 1 })
    recalc(bill)
    return bill
  })
}

export function removeBillItem(billId: number, itemId: number): Promise<Bill> {
  // return http.delete<Bill>(`/bills/${billId}/items/${itemId}`)
  return mockRequest(() => {
    const bill = findBill(billId)
    bill.items = bill.items.filter((i) => i.id !== itemId)
    recalc(bill)
    return bill
  })
}

/** 组织者标记某人已付 / 未付 */
export function setPaid(billId: number, memberId: number, paid: boolean): Promise<Bill> {
  // return http.put<Bill>(`/bills/${billId}/members/${memberId}`, { paid })
  return mockRequest(() => {
    const bill = findBill(billId)
    const target = bill.members.find((m) => m.member.id === memberId)
    if (!target) throw new ApiError(404, '这个人不在账单里')
    target.paid = paid
    target.paidAt = paid ? dayjs().format() : undefined
    if (paid) target.claimedAt = undefined
    return bill
  })
}

/** 我的待付款：我在账单里、还没付、也不是组织者 */
export function fetchMyPendingBills(): Promise<PendingBill[]> {
  // return http.get<PendingBill[]>('/users/me/pending-bills')
  return mockRequest(() =>
    db.bills.flatMap((b) => {
      const mine = b.members.find((m) => m.member.id === ME.id)
      const organizer = b.members.find((m) => m.isOrganizer)
      if (!mine || mine.paid || mine.isOrganizer || !organizer) return []
      return [
        {
          billId: b.id,
          gameId: b.gameId,
          gameTitle: b.gameTitle,
          gameStartAt: b.gameStartAt,
          groupName: b.groupName,
          organizer: organizer.member,
          amount: mine.amount,
          claimedAt: mine.claimedAt,
        },
      ]
    }),
  )
}

/** 成员点「我已转账」：只是通知组织者，真正算已付要组织者确认 */
export function claimPaid(billId: number): Promise<void> {
  // return http.post<void>(`/bills/${billId}/claim`)
  return mockRequest(() => {
    const mine = findBill(billId).members.find((m) => m.member.id === ME.id)
    if (!mine) throw new ApiError(404, '你不在这个账单里')
    mine.claimedAt = dayjs().format()
  })
}
