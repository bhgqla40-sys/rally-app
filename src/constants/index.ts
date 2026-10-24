import type { SportType } from '@/types'

export const SPORT_OPTIONS: { value: SportType; label: string }[] = [
  { value: 'BADMINTON', label: '羽毛球' },
  { value: 'BASKETBALL', label: '篮球' },
  { value: 'FOOTBALL', label: '足球' },
  { value: 'FRISBEE', label: '飞盘' },
  { value: 'OTHER', label: '其他' },
]

export const SPORT_TEXT = Object.fromEntries(SPORT_OPTIONS.map((o) => [o.value, o.label])) as Record<SportType, string>

/** 头像、群组图标的配色，按 id 轮流取，保证同一个人每次颜色一样 */
export const TINTS = [
  { bg: 'bg-primary-soft', text: 'text-primary-ink' },
  { bg: 'bg-success-soft', text: 'text-success-ink' },
  { bg: 'bg-warning-soft', text: 'text-warning-ink' },
  { bg: 'bg-purple-soft', text: 'text-purple-ink' },
]
