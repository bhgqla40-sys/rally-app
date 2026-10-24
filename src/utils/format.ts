import dayjs, { type Dayjs } from 'dayjs'

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** 周六 */
export function weekdayText(t: string | Dayjs) {
  return WEEKDAYS[dayjs(t).day()]
}

/** 10月31日 周六 19:00 – 21:00 */
export function formatGameTime(startAt: string, endAt: string) {
  const s = dayjs(startAt)
  const e = dayjs(endAt)
  return `${s.format('M月D日')} ${weekdayText(s)} ${s.format('HH:mm')} – ${e.format('HH:mm')}`
}

/** 10月31日 13:00 */
export function formatDateTime(t: string) {
  return dayjs(t).format('M月D日 HH:mm')
}

/** 金额（分）转成展示文字：3500 → ¥35，3550 → ¥35.5 */
export function formatMoney(cents: number) {
  const yuan = cents / 100
  if (Number.isInteger(yuan)) return `¥${yuan}`
  return `¥${yuan.toFixed(2).replace(/0$/, '')}`
}

/** 所在周的周一 00:00 */
export function startOfWeek(t: string | Dayjs) {
  const d = dayjs(t).startOf('day')
  return d.subtract((d.day() + 6) % 7, 'day')
}

/** 本周 · 10月26日 – 11月1日 */
export function weekLabel(weekStart: Dayjs) {
  const diff = weekStart.diff(startOfWeek(dayjs()), 'week')
  const name = ({ [-1]: '上周', 0: '本周', 1: '下周' } as Record<number, string>)[diff]
  const range = `${weekStart.format('M月D日')} – ${weekStart.add(6, 'day').format('M月D日')}`
  return name ? `${name} · ${range}` : range
}
