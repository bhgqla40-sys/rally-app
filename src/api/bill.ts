/**
 * 费用结算接口。
 * 现在用 mock 数据；后端完成后换成注释里的 http 调用即可。
 *
 * 金额全部用「分」计算。AA 分摊除不尽时，余下的几分钱由前几个人各多出 1 分，
 * 保证每个人的应付金额加起来正好等于总费用。
 */
import dayjs from 'dayjs'
import { db } from '@/mock/db'
import type { Bill, BillItem } from '@/types'
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

function findBill(id: number) {
  const bill = db.bills.find((b) => b.id === id)
  if (!bill) throw new ApiError(404, '账单不存在')
  return bill
}

/** 某一场的账单；还没有就新建一个空账单（到场成员 = 报名名单） */
export function fetchBillByGame(gameId: number): Promise<Bill> {
  // return http.get<Bill>(`/games/${gameId}/bill`)
  return mockRequest(() => {
    let bill = db.bills.find((b) => b.gameId === gameId)
    if (!bill) {
      const game = db.games.find((g) => g.id === gameId)
      if (!game) throw new ApiError(404, '场次不存在')
      bill = {
        id: Math.max(0, ...db.bills.map((b) => b.id)) + 1,
        gameId,
        gameTitle: game.title,
        gameStartAt: game.startAt,
        groupName: game.groupName,
        items: [],
        members: game.joined.map((m) => ({ member: m, amount: 0, paid: m.id === game.organizer.id, isOrganizer: m.id === game.organizer.id })),
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
    return bill
  })
}
