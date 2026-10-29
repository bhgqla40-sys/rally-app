/**
 * 费用结算接口  ✅ 已全部接入后端（rally-server：BillController）
 *
 * 金额全部用「分」计算。AA 分摊除不尽时，余下的几分钱由排在前面的人各多出 1 分，
 * 保证每个人的应付金额加起来正好等于总费用（分摊在后端算）。
 * 到场成员 = 报名名单 - 鸽子；组织者确认出勤后，已建好的账单会跟着更新。
 */
import type { Bill, BillItem, PendingBill } from '@/types'
import { http } from '@/utils/request'

/**
 * 某一场的账单；还没有就新建一个空账单。
 * - 只有组织者、群主 / 管理员能新建，而且这一场要已经结束，否则 400「结束后才能结算费用」
 * - 其他群成员在账单建好之前打开，返回 404「组织者还没开始结算这一场」
 */
export function fetchBillByGame(gameId: number): Promise<Bill> {
  return http.get<Bill>(`/games/${gameId}/bill`)
}

/** 添加费用项（组织者）：名称最多 20 个字，金额 1 分 ～ 10 万元，最多 20 项 */
export function addBillItem(billId: number, item: Omit<BillItem, 'id'>): Promise<Bill> {
  return http.post<Bill>(`/bills/${billId}/items`, item)
}

/** 删除费用项（组织者） */
export function removeBillItem(billId: number, itemId: number): Promise<Bill> {
  return http.delete<Bill>(`/bills/${billId}/items/${itemId}`)
}

/** 组织者标记某人已付 / 未付（memberId 是用户 id）；标记已付时会清掉他的「我已转账」 */
export function setPaid(billId: number, memberId: number, paid: boolean): Promise<Bill> {
  return http.put<Bill>(`/bills/${billId}/members/${memberId}`, { paid })
}

/** 我的待付款：我在账单里、还没付、不是组织者、金额大于 0；最近的场次在前 */
export function fetchMyPendingBills(): Promise<PendingBill[]> {
  return http.get<PendingBill[]>('/users/me/pending-bills')
}

/** 成员点「我已转账」：只是通知组织者，真正算已付要组织者确认 */
export function claimPaid(billId: number): Promise<void> {
  return http.post<void>(`/bills/${billId}/claim`)
}
