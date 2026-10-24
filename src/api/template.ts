/**
 * 固定局相关接口。
 * 现在用 mock 数据；后端完成后换成注释里的 http 调用即可。
 */
import dayjs from 'dayjs'
import { SPORT_TEXT } from '@/constants'
import { ME, db } from '@/mock/db'
import type { GameDetail, GameTemplateForm } from '@/types'
import { ApiError } from '@/utils/request'
import { weekdayText } from '@/utils/format'
import { mockRequest } from './mock'

/** 下一次开局时间：本周这一天还没到就是本周，否则是下周 */
function nextStart(weekday: number, startTime: string) {
  const [h, m] = startTime.split(':').map(Number)
  const now = dayjs()
  const todayWeekday = now.day() === 0 ? 7 : now.day()
  let start = now.startOf('day').add(weekday - todayWeekday, 'day').hour(h).minute(m)
  if (!start.isAfter(now)) start = start.add(7, 'day')
  return start
}

/** 创建固定局，并生成第一场，返回第一场的 id */
export function createGameTemplate(form: GameTemplateForm): Promise<{ firstGameId: number }> {
  // return http.post<{ firstGameId: number }>('/game-templates', form)
  return mockRequest(() => {
    const group = db.groups.find((g) => g.id === form.groupId)
    if (!group) throw new ApiError(404, '群组不存在')
    const [oh, om] = form.openTime.split(':').map(Number)
    const start = nextStart(form.weekday, form.startTime)
    const game: GameDetail = {
      id: Math.max(...db.games.map((g) => g.id)) + 1,
      title: form.name || `${weekdayText(start)}${SPORT_TEXT[form.sport]}`,
      groupId: group.id,
      groupName: group.name,
      sport: form.sport,
      venue: form.venue,
      startAt: start.format(),
      endAt: start.add(form.durationMinutes, 'minute').format(),
      openAt: start.subtract(form.openDaysBefore, 'day').hour(oh).minute(om).format(),
      deadlineAt: start.subtract(form.deadlineHoursBefore, 'hour').format(),
      capacity: form.capacity,
      joinedCount: 0,
      waitlistCount: 0,
      status: 'OPEN',
      mySignup: 'NONE',
      organizer: ME,
      feeMode: form.feeMode,
      feePerPerson: form.feeMode === 'FIXED' ? form.fixedFee : undefined,
      allowWaitlist: form.allowWaitlist,
      autoPromote: form.autoPromote,
      joined: [],
      waitlist: [],
      rules: [`开局前 ${form.deadlineHoursBefore} 小时停止报名和取消`, '截止后临时请假，会记一次「鸽子」'],
    }
    db.games.push(game)
    group.scheduleText = `每${weekdayText(start)}`
    return { firstGameId: game.id }
  })
}
