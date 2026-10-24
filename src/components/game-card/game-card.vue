<template>
  <view class="flex flex-col gap-3 rounded-2xl bg-white p-4" @click="emit('open', game.id)">
    <!-- 标题 + 状态 -->
    <view class="flex items-start justify-between gap-3">
      <view class="flex min-w-0 flex-col gap-1">
        <text class="text-base font-semibold text-ink">{{ game.title }}</text>
        <text class="text-[13px] text-muted">{{ game.groupName }}</text>
      </view>
      <game-status-tag :status="game.status" :full="isFull" />
    </view>

    <!-- 时间、地点 -->
    <view class="flex flex-col gap-1.5">
      <view class="flex items-center gap-1.5 text-sm text-muted">
        <wd-icon name="time" size="16px" color="#5C5C5C" />
        <text>{{ timeText }}</text>
      </view>
      <view class="flex items-center gap-1.5 text-sm text-muted">
        <wd-icon name="location" size="16px" color="#5C5C5C" />
        <text>{{ game.venue }}</text>
      </view>
    </view>

    <!-- 名额进度（未开放时不显示） -->
    <view v-if="game.status !== 'UPCOMING'" class="flex flex-col gap-1.5">
      <view class="flex justify-between text-[13px]">
        <text class="font-medium text-ink">已报名 {{ game.joinedCount }} / {{ game.capacity }}</text>
        <text class="text-muted">{{ remainText }}</text>
      </view>
      <view class="h-1.5 rounded-full bg-line">
        <view class="h-1.5 rounded-full" :class="isFull ? 'bg-warning' : 'bg-primary'" :style="{ width: `${percent}%` }" />
      </view>
    </view>

    <!-- 底部：左边是我的状态或提示，右边是操作按钮 -->
    <view class="flex min-h-11 items-center justify-between gap-3 border-t border-line-soft pt-3">
      <view v-if="game.mySignup === 'JOINED'" class="flex items-center gap-1 rounded-full bg-primary-soft px-2.5 text-[13px] leading-7 font-medium text-primary-ink">
        <wd-icon name="check" size="14px" color="#245FD9" />
        <text>你已报名</text>
      </view>
      <text v-else-if="game.mySignup === 'WAITLIST'" class="rounded-full bg-warning-soft px-2.5 text-[13px] leading-7 font-medium text-warning-ink">
        候补第 {{ game.myWaitlistRank }} 位 · 有人取消自动递补
      </text>
      <text v-else class="text-[13px] text-muted">{{ hintText }}</text>

      <!-- 包一层 @click.stop，点按钮时不会同时触发卡片的点击 -->
      <view class="shrink-0" @click.stop>
        <wd-button v-if="action === 'join'" @click="emit('join', game.id)">报名</wd-button>
        <wd-button v-else-if="action === 'waitlist'" plain @click="emit('join', game.id)">排候补</wd-button>
        <wd-button v-else-if="action === 'remind'" plain icon="notification" @click="emit('remind', game.id)">开放时提醒我</wd-button>
        <wd-button v-else type="text" @click="emit('open', game.id)">查看详情</wd-button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GameBrief } from '@/types'
import { formatDateTime, formatGameTime } from '@/utils/format'

const props = defineProps<{ game: GameBrief }>()
const emit = defineEmits<{
  open: [id: number]
  join: [id: number]
  remind: [id: number]
}>()

const isFull = computed(() => props.game.joinedCount >= props.game.capacity)
const percent = computed(() => Math.min(100, Math.round((props.game.joinedCount / props.game.capacity) * 100)))
const timeText = computed(() => formatGameTime(props.game.startAt, props.game.endAt))

const remainText = computed(() => {
  const { capacity, joinedCount, waitlistCount } = props.game
  if (!isFull.value) return `还剩 ${capacity - joinedCount} 个名额`
  return waitlistCount > 0 ? `候补 ${waitlistCount} 人` : '名额已满'
})

const hintText = computed(() => {
  const g = props.game
  if (g.status === 'UPCOMING') return `${formatDateTime(g.openAt)} 开放报名`
  if (g.status === 'OPEN') return isFull.value ? '已满员，可以排候补' : `${formatDateTime(g.deadlineAt)} 截止`
  if (g.status === 'CLOSED') return '报名已截止'
  return ''
})

/** 右侧按钮显示哪一个 */
const action = computed(() => {
  const g = props.game
  if (g.mySignup !== 'NONE') return 'detail'
  if (g.status === 'UPCOMING') return 'remind'
  if (g.status === 'OPEN') return isFull.value ? 'waitlist' : 'join'
  return 'detail'
})
</script>
