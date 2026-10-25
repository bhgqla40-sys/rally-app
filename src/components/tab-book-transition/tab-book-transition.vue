<template>
  <view class="tab-book-transition" :class="transitionClass">
    <slot />
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { TabBookDirection } from '@/utils/tab-transition'

const props = withDefaults(
  defineProps<{
    direction?: TabBookDirection
    playKey?: number
  }>(),
  {
    direction: 'none',
    playKey: 0,
  },
)

const playing = ref(false)
let restartTimer: ReturnType<typeof setTimeout> | undefined

const transitionClass = computed(() => {
  if (!playing.value || props.direction === 'none') return ''
  return `tab-book-transition--${props.direction}`
})

function restart() {
  playing.value = false
  if (restartTimer) clearTimeout(restartTimer)
  if (props.direction === 'none') return

  // 先移除 class，再放回 class，确保连续点击相同 tab 时 CSS animation 也会重新开始。
  restartTimer = setTimeout(() => {
    void nextTick(() => {
      playing.value = true
    })
  }, 16)
}

watch(() => [props.direction, props.playKey], restart, { immediate: true })

onBeforeUnmount(() => {
  if (restartTimer) clearTimeout(restartTimer)
})
</script>

<style scoped>
.tab-book-transition {
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.tab-book-transition--next {
  animation: tab-page-enter-next 420ms cubic-bezier(0.22, 0.8, 0.25, 1) both;
}

.tab-book-transition--prev {
  animation: tab-page-enter-prev 420ms cubic-bezier(0.22, 0.8, 0.25, 1) both;
}

@keyframes tab-page-enter-next {
  0% {
    opacity: 0.78;
    transform: translateX(28px);
  }
  62% {
    opacity: 1;
    transform: translateX(-3px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes tab-page-enter-prev {
  0% {
    opacity: 0.78;
    transform: translateX(-28px);
  }
  62% {
    opacity: 1;
    transform: translateX(3px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tab-book-transition--next,
  .tab-book-transition--prev {
    animation-duration: 1ms;
  }
}
</style>
