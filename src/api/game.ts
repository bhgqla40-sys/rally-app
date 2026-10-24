/**
 * 场次相关接口。
 * 现在用 mock 数据；后端接口完成后，把每个函数体换成注释里的 http 调用即可，页面不用改。
 */
import { ME, db, toBrief, toDetail } from '@/mock/db'
import type { GameBrief, GameDetail } from '@/types'
import { ApiError } from '@/utils/request'
import { mockRequest } from './mock'

/** 首页筛选：全部 / 我报名的 / 可报名 */
export type GameFilter = 'ALL' | 'MINE' | 'AVAILABLE'

function findGame(id: number) {
  const game = db.games.find((g) => g.id === id)
  if (!game) throw new ApiError(404, '场次不存在')
  return game
}

/** 首页列表：还没结束的场次，按开始时间排序 */
export function fetchGames(filter: GameFilter = 'ALL'): Promise<GameBrief[]> {
  // return http.get<GameBrief[]>('/games', { filter })
  return mockRequest(() =>
    db.games
      .map(toBrief)
      .filter((g) => g.status !== 'FINISHED' && g.status !== 'CANCELLED')
      .filter((g) => {
        if (filter === 'MINE') return g.mySignup !== 'NONE'
        if (filter === 'AVAILABLE') return g.status === 'OPEN' && g.mySignup === 'NONE'
        return true
      })
      .sort((a, b) => a.startAt.localeCompare(b.startAt)),
  )
}

/** 场次详情 */
export function fetchGameDetail(id: number): Promise<GameDetail> {
  // return http.get<GameDetail>(`/games/${id}`)
  return mockRequest(() => toDetail(findGame(id)))
}

/** 报名：有名额直接报上，满员了进候补 */
export function joinGame(id: number): Promise<GameDetail> {
  // return http.post<GameDetail>(`/games/${id}/signup`)
  return mockRequest(() => {
    const game = findGame(id)
    const brief = toBrief(game)
    if (brief.status !== 'OPEN') throw new ApiError(400, '当前不在报名时间内')
    if (brief.mySignup !== 'NONE') throw new ApiError(400, '你已经报过名了')
    if (game.joined.length < game.capacity) {
      game.joined.push(ME)
    } else if (game.allowWaitlist) {
      game.waitlist.push(ME)
    } else {
      throw new ApiError(400, '名额已满')
    }
    return toDetail(game)
  })
}

/** 取消报名或退出候补；空出名额时，候补第一位自动递补 */
export function cancelSignup(id: number): Promise<GameDetail> {
  // return http.delete<GameDetail>(`/games/${id}/signup`)
  return mockRequest(() => {
    const game = findGame(id)
    if (toBrief(game).status !== 'OPEN') throw new ApiError(400, '已过截止时间，不能取消了')
    const joinedIndex = game.joined.findIndex((m) => m.id === ME.id)
    if (joinedIndex >= 0) {
      game.joined.splice(joinedIndex, 1)
      if (game.autoPromote && game.waitlist.length > 0) {
        game.joined.push(game.waitlist.shift()!)
      }
    } else {
      game.waitlist = game.waitlist.filter((m) => m.id !== ME.id)
    }
    return toDetail(game)
  })
}
