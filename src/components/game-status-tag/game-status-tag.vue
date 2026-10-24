<template>
  <text class="inline-block shrink-0 rounded-md px-2 text-xs leading-[22px] font-medium" :class="view.cls">{{ view.text }}</text>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GameStatus } from '@/types'

const props = defineProps<{
  status: GameStatus
  /** 名额是否已满（报名中 + 满员时显示「已满员」） */
  full?: boolean
}>()

const view = computed(() => {
  switch (props.status) {
    case 'UPCOMING':
      return { text: '未开放', cls: 'bg-line-soft text-ink-2' }
    case 'OPEN':
      return props.full
        ? { text: '已满员', cls: 'bg-warning-soft text-warning-ink' }
        : { text: '报名中', cls: 'bg-success-soft text-success-ink' }
    case 'CLOSED':
      return { text: '已截止', cls: 'bg-line-soft text-ink-2' }
    case 'FINISHED':
      return { text: '已结束', cls: 'bg-line-soft text-muted' }
    default:
      return { text: '已取消', cls: 'bg-danger-soft text-danger' }
  }
})
</script>
