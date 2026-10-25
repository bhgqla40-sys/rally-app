/** 底部原生 tabBar 的页面顺序，决定翻书动画的方向。 */
const TAB_PATHS = ['pages/index/index', 'pages/group/index', 'pages/mine/index'] as const

export type TabBookDirection = 'next' | 'prev' | 'none'

let lastTabIndex: number | null = null

/**
 * 标记当前显示的 tab，并返回它相对上一个 tab 的切换方向。
 * 记录只存在当前运行时，重新打开小程序时首次进入不会播放动画。
 */
export function resolveTabBookDirection(path: string): TabBookDirection {
  const currentIndex = TAB_PATHS.indexOf(path as (typeof TAB_PATHS)[number])
  if (currentIndex < 0) return 'none'

  const previousIndex = lastTabIndex
  lastTabIndex = currentIndex

  if (previousIndex === null || previousIndex === currentIndex) return 'none'
  return currentIndex > previousIndex ? 'next' : 'prev'
}
