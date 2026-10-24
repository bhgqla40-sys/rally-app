/**
 * 固定局相关接口。
 * 现在用 mock 数据；后端完成后换成注释里的 http 调用即可。
 */
import dayjs from 'dayjs'
import { SPORT_TEXT } from '@/constants'
import { ME, db } from '@/mock/db'
import type { GameDetail, GameTemplateBrief, GameTemplateForm } from '@/types'
import { ApiError } from '@/utils/request'
import { weekdayText } from '@/utils/format'
import { mockRequest } from './mock'

/**
 * 第一场的开局时间：取最近一个「还来得及报名」的日子。
 * 比如今天就是周六，但已经过了截止时间，那第一场就排到下周六。
 */
function firstStart(weekday: number, startTime: string, deadlineHoursBefore: number) {
  const [h, m] = startTime.split(':').map(Number)
  const now = dayjs()
  const todayWeekday = now.day() === 0 ? 7 : now.day()
  let start = now.startOf('day').add(weekday - todayWeekday, 'day').hour(h).minute(m)
  while (!start.subtract(deadlineHoursBefore, 'hour').isAfter(now)) start = start.add(7, 'day')
  return start
}

/** 创建固定局，并生成第一场，返回第一场的 id */
export function createGameTemplate(form: GameTemplateForm): Promise<{ firstGameId: number }> {
  // return http.post<{ firstGameId: number }>('/game-templates', form)
  return mockRequest(() => {
    const group = db.groups.find((g) => g.id === form.groupId)
    if (!group) throw new ApiError(404, '群组不存在')
    const [oh, om] = form.openTime.split(':').map(Number)
    const start = firstStart(form.weekday, form.startTime, form.deadlineHoursBefore)
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
    db.templates.push({
      id: Math.max(0, ...db.templates.map((t) => t.id)) + 1,
      groupId: group.id,
      name: game.title,
      sport: form.sport,
      venue: form.venue,
      weekday: form.weekday,
      startTime: form.startTime,
      durationMinutes: form.durationMinutes,
      capacity: form.capacity,
      active: true,
    })
    group.scheduleText = `每${weekdayText(start)}`
    return { firstGameId: game.id }
  })
}

/** 某个群的固定局列表 */
export function fetchGroupTemplates(groupId: number): Promise<GameTemplateBrief[]> {
  // return http.get<GameTemplateBrief[]>(`/groups/${groupId}/game-templates`)
  return mockRequest(() => db.templates.filter((t) => t.groupId === groupId))
}

/** 暂停 / 恢复固定局：暂停后不再每周自动开局，已经生成的场次不受影响 */
export function setTemplateActive(templateId: number, active: boolean): Promise<GameTemplateBrief> {
  // return http.put<GameTemplateBrief>(`/game-templates/${templateId}`, { active })
  return mockRequest(() => {
    const template = db.templates.find((t) => t.id === templateId)
    if (!template) throw new ApiError(404, '固定局不存在')
    const group = db.groups.find((g) => g.id === template.groupId)
    if (!group || group.myRole === 'MEMBER') throw new ApiError(403, '只有群主和管理员可以操作')
    template.active = active
    return template
  })
}
