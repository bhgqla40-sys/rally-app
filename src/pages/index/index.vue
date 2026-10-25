<template>
  <tab-book-transition :direction="tabDirection" :play-key="tabPlayKey">
    <view class="min-h-screen bg-canvas px-4 pt-3 pb-4">
      <!-- 筛选 -->
      <view class="flex gap-2">
        <view
          v-for="f in FILTERS"
          :key="f.value"
          class="h-9 rounded-full px-4 text-sm leading-9"
          :class="filter === f.value ? 'bg-primary font-semibold text-white' : 'bg-white text-ink'"
          @click="changeFilter(f.value)"
        >
          {{ f.label }}
        </view>
      </view>

      <!-- 首次加载 -->
      <view v-if="loading && games.length === 0" class="flex justify-center py-24">
        <wd-loading />
      </view>

      <!-- 空状态 -->
      <view v-else-if="games.length === 0" class="flex flex-col items-center gap-3 py-24">
        <wd-icon name="calendar" size="48px" color="#B8BCC6" />
        <text class="text-sm text-muted">{{ emptyText }}</text>
      </view>

      <!-- 按周分组的球局列表 -->
      <view v-else>
        <view v-for="section in sections" :key="section.key" class="flex flex-col gap-3">
          <text class="mt-4 text-[13px] text-muted">{{ section.label }}</text>
          <game-card
            v-for="g in section.games"
            :key="g.id"
            :game="g"
            @open="openDetail"
            @join="onJoin"
            @remind="onRemind"
          />
        </view>
      </view>

      <wd-toast />
    </view>
  </tab-book-transition>
</template>

<script setup lang="ts">
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { fetchGames, joinGame, type GameFilter } from '@/api/game'
import type { GameBrief } from '@/types'
import { startOfWeek, weekLabel } from '@/utils/format'
import { resolveTabBookDirection, type TabBookDirection } from '@/utils/tab-transition'

const FILTERS: { label: string; value: GameFilter }[] = [
  { label: '全部', value: 'ALL' },
  { label: '我报名的', value: 'MINE' },
  { label: '可报名', value: 'AVAILABLE' },
]

const toast = useToast()
const filter = ref<GameFilter>('ALL')
const games = ref<GameBrief[]>([])
const loading = ref(false)
const tabDirection = ref<TabBookDirection>('none')
const tabPlayKey = ref(0)

async function load() {
  loading.value = true
  try {
    games.value = await fetchGames(filter.value)
  } finally {
    loading.value = false
  }
}

// onShow：第一次进入和从详情页返回时都会刷新，保证报名状态是最新的。
// 只有从另一个底部 tab 切入时才播放翻书动画。
onShow(() => {
  const direction = resolveTabBookDirection('pages/index/index')
  tabDirection.value = direction
  if (direction !== 'none') tabPlayKey.value += 1
  load()
})

onPullDownRefresh(async () => {
  await load()
  uni.stopPullDownRefresh()
})

function changeFilter(value: GameFilter) {
  if (filter.value === value) return
  filter.value = value
  games.value = []
  load()
}

/** 按「周」分组：本周、下周…… */
const sections = computed(() => {
  const map = new Map<string, { key: string; label: string; games: GameBrief[] }>()
  for (const g of games.value) {
    const weekStart = startOfWeek(g.startAt)
    const key = weekStart.format('YYYY-MM-DD')
    if (!map.has(key)) map.set(key, { key, label: weekLabel(weekStart), games: [] })
    map.get(key)!.games.push(g)
  }
  return Array.from(map.values())
})

const emptyText = computed(
  () =>
    ({
      ALL: '最近没有球局，去群组里看看吧',
      MINE: '你还没有报名任何球局',
      AVAILABLE: '暂时没有可以报名的球局',
    })[filter.value],
)

function openDetail(id: number) {
  uni.navigateTo({ url: `/pages/game/detail?id=${id}` })
}

async function onJoin(id: number) {
  const detail = await joinGame(id)
  toast.success(detail.mySignup === 'WAITLIST' ? '已加入候补' : '报名成功')
  load()
}

function onRemind() {
  // 小程序里会改成订阅消息；H5 先给个提示
  toast.info('开放报名时会提醒你')
}
</script>
