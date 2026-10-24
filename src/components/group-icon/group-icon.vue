<template>
  <view class="flex shrink-0 items-center justify-center rounded-[10px] font-semibold" :class="[sizeClass, tint.bg, tint.text]">
    <text>{{ SPORT_TEXT[sport].slice(0, 1) }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SPORT_TEXT, TINTS } from '@/constants'
import type { SportType } from '@/types'

const props = withDefaults(defineProps<{ id: number; sport: SportType; size?: 'md' | 'lg' }>(), { size: 'md' })

const tint = computed(() => TINTS[props.id % TINTS.length])
const sizeClass = computed(() => (props.size === 'lg' ? 'h-14 w-14 text-xl' : 'h-10 w-10 text-[15px]'))
</script>
