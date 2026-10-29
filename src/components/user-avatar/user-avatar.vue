<template>
  <view class="flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold" :class="[sizeClass, colorClass]">
    <image v-if="src && !broken" :src="src" class="h-full w-full" mode="aspectFill" @error="broken = true" />
    <text v-else>{{ initial }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { TINTS } from '@/constants'
import type { Member } from '@/types'
import { assetUrl } from '@/utils/request'

const props = withDefaults(
  defineProps<{
    member: Member
    size?: 'sm' | 'md' | 'lg' | 'xl'
    /** 是不是我自己：用主色实心突出显示 */
    self?: boolean
  }>(),
  { size: 'md', self: false },
)

const src = computed(() => assetUrl(props.member.avatar))

/** 图片加载失败（比如文件被删了）就退回显示名字 */
const broken = ref(false)
watch(src, () => (broken.value = false))

/** 没有头像时显示名字的最后一个字，比如「阿杰」显示「杰」 */
const initial = computed(() => props.member.nickname.slice(-1))

const sizeClass = computed(
  () =>
    ({
      sm: 'h-9 w-9 text-sm',
      md: 'h-11 w-11 text-base',
      lg: 'h-16 w-16 text-2xl',
      xl: 'h-20 w-20 text-3xl',
    })[props.size],
)

const colorClass = computed(() => {
  if (props.self) return 'bg-primary text-white'
  const tint = TINTS[props.member.id % TINTS.length]
  return `${tint.bg} ${tint.text}`
})
</script>
