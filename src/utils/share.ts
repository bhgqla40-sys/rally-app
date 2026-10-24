import type { GameBrief } from '@/types'
import { formatGameTime } from './format'

/** 生成发到群里的邀请文案 */
export function gameInviteText(game: GameBrief) {
  const remain = game.capacity - game.joinedCount
  const seat = remain > 0 ? `还剩 ${remain} 个名额` : '已满员，可以排候补'
  return `【${game.title}】${formatGameTime(game.startAt, game.endAt)} @${game.venue}，${seat}`
}

/**
 * 分享场次。
 * H5：复制「文案 + 链接」，用户自己粘贴到微信群。
 * 小程序：用 <button open-type="share"> 转发卡片，这里先不处理，做小程序时再接。
 */
export function shareGame(game: GameBrief) {
  // #ifdef H5
  const url = `${location.href.split('#')[0]}#/pages/game/detail?id=${game.id}`
  uni.setClipboardData({
    data: `${gameInviteText(game)}，点链接报名：${url}`,
    success: () => uni.showToast({ title: '链接已复制，发到群里吧', icon: 'none' }),
  })
  // #endif
}
