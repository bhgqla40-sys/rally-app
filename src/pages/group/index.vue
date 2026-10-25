<template>
  <tab-book-transition :direction="tabDirection" :play-key="tabPlayKey">
    <view class="min-h-screen bg-canvas px-4 pt-3 pb-6">
      <view class="grid grid-cols-2 gap-3">
        <view class="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-white text-sm font-medium text-ink" @click="go('/pages/group/join')">
          <wd-icon name="usergroup-add" size="18px" color="#2F6BE6" />
          <text>用邀请码加入</text>
        </view>
        <view class="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-white text-sm font-medium text-ink" @click="go('/pages/group/create')">
          <wd-icon name="add-circle" size="18px" color="#2F6BE6" />
          <text>创建群组</text>
        </view>
      </view>

      <view v-if="loading && groups.length === 0" class="flex justify-center py-24">
        <wd-loading />
      </view>

      <view v-else-if="groups.length === 0" class="flex flex-col items-center gap-3 py-24">
        <wd-icon name="usergroup" size="48px" color="#B8BCC6" />
        <text class="text-sm text-muted">还没有加入群组，找群主要个邀请码吧</text>
      </view>

      <view v-else class="mt-4 flex flex-col gap-3">
        <text class="text-[13px] text-muted">我加入的群组（{{ groups.length }}）</text>
        <view
          v-for="g in groups"
          :key="g.id"
          class="flex items-center gap-3 rounded-2xl bg-white p-4"
          @click="go(`/pages/group/detail?id=${g.id}`)"
        >
          <group-icon :id="g.id" :sport="g.sport" size="lg" />
          <view class="flex min-w-0 flex-1 flex-col gap-1">
            <view class="flex items-center gap-1.5">
              <text class="truncate text-base font-semibold text-ink">{{ g.name }}</text>
              <text v-if="g.myRole === 'OWNER'" class="shrink-0 rounded bg-primary-soft px-1.5 text-[11px] leading-[18px] font-medium text-primary-ink">群主</text>
            </view>
            <text class="text-[13px] text-muted">{{ g.memberCount }} 人 · {{ SPORT_TEXT[g.sport] }} · {{ g.scheduleText }}</text>
          </view>
          <wd-icon name="arrow-right" size="16px" color="#5C5C5C" />
        </view>
      </view>
    </view>
  </tab-book-transition>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { fetchMyGroups } from '@/api/group'
import { SPORT_TEXT } from '@/constants'
import type { Group } from '@/types'
import { resolveTabBookDirection, type TabBookDirection } from '@/utils/tab-transition'

const groups = ref<Group[]>([])
const loading = ref(false)
const tabDirection = ref<TabBookDirection>('none')
const tabPlayKey = ref(0)

onShow(async () => {
  const direction = resolveTabBookDirection('pages/group/index')
  tabDirection.value = direction
  if (direction !== 'none') tabPlayKey.value += 1
  loading.value = true
  try {
    groups.value = await fetchMyGroups()
  } finally {
    loading.value = false
  }
})

function go(url: string) {
  uni.navigateTo({ url })
}
</script>
