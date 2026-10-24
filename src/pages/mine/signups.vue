<template>
  <view class="min-h-screen bg-canvas px-4 pt-3 pb-6">
    <view class="flex gap-2">
      <view
        v-for="t in TABS"
        :key="t.value"
        class="h-9 rounded-full px-4 text-sm leading-9"
        :class="scope === t.value ? 'bg-primary font-semibold text-white' : 'bg-white text-ink'"
        @click="changeScope(t.value)"
      >
        {{ t.label }}
      </view>
    </view>

    <!-- 历史记录的出勤统计 -->
    <view v-if="scope === 'HISTORY' && records.length" class="mt-3 grid grid-cols-3 rounded-2xl bg-white px-2 py-3">
      <view v-for="(s, i) in summary" :key="s.label" class="flex flex-col items-center gap-0.5" :class="i === 1 ? 'border-x border-line-soft' : ''">
        <text class="text-lg font-bold text-ink">{{ s.value }}</text>
        <text class="text-xs text-muted">{{ s.label }}</text>
      </view>
    </view>

    <view v-if="loading && records.length === 0" class="flex justify-center py-24">
      <wd-loading />
    </view>

    <view v-else-if="records.length === 0" class="flex flex-col items-center gap-3 py-24">
      <wd-icon name="list" size="48px" color="#B8BCC6" />
      <text class="text-sm text-muted">{{ scope === 'UPCOMING' ? '还没有报名接下来的球局' : '还没有历史记录' }}</text>
    </view>

    <view v-else class="mt-3 flex flex-col gap-3">
      <view
        v-for="r in records"
        :key="`${r.gameId}-${r.startAt}`"
        class="flex flex-col gap-2 rounded-2xl bg-white p-4"
        @click="open(r)"
      >
        <view class="flex items-start justify-between gap-3">
          <view class="flex min-w-0 flex-col gap-1">
            <text class="text-base font-semibold text-ink">{{ r.title }}</text>
            <text class="text-[13px] text-muted">{{ r.groupName }}</text>
          </view>
          <text class="shrink-0 rounded-md px-2 text-xs leading-[22px] font-medium" :class="STATUS[r.status].cls">
            {{ r.status === 'WAITLIST' ? `候补第 ${r.waitlistRank} 位` : STATUS[r.status].text }}
          </text>
        </view>
        <view class="flex items-center gap-1.5 text-sm text-muted">
          <wd-icon name="time" size="16px" color="#5C5C5C" />
          <text>{{ formatGameTime(r.startAt, r.endAt) }}</text>
        </view>
        <view class="flex items-center gap-1.5 text-sm text-muted">
          <wd-icon name="location" size="16px" color="#5C5C5C" />
          <text>{{ r.venue }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { fetchMySignups, type SignupScope } from '@/api/user'
import type { SignupRecord, SignupRecordStatus } from '@/types'
import { formatGameTime } from '@/utils/format'

const TABS: { label: string; value: SignupScope }[] = [
  { label: '接下来', value: 'UPCOMING' },
  { label: '历史记录', value: 'HISTORY' },
]

const STATUS: Record<SignupRecordStatus, { text: string; cls: string }> = {
  JOINED: { text: '已报名', cls: 'bg-primary-soft text-primary-ink' },
  WAITLIST: { text: '候补中', cls: 'bg-warning-soft text-warning-ink' },
  ATTENDED: { text: '已出勤', cls: 'bg-success-soft text-success-ink' },
  NO_SHOW: { text: '鸽了', cls: 'bg-danger-soft text-danger' },
  CANCELLED: { text: '已取消', cls: 'bg-line-soft text-ink-2' },
}

const scope = ref<SignupScope>('UPCOMING')
const records = ref<SignupRecord[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    records.value = await fetchMySignups(scope.value)
  } finally {
    loading.value = false
  }
}

onShow(load)

onPullDownRefresh(async () => {
  await load()
  uni.stopPullDownRefresh()
})

function changeScope(value: SignupScope) {
  if (scope.value === value) return
  scope.value = value
  records.value = []
  load()
}

const summary = computed(() => [
  { label: '出勤', value: records.value.filter((r) => r.status === 'ATTENDED').length },
  { label: '取消', value: records.value.filter((r) => r.status === 'CANCELLED').length },
  { label: '鸽子', value: records.value.filter((r) => r.status === 'NO_SHOW').length },
])

/** 只有还在 mock 场次里的记录才有详情页（更早的历史只展示） */
function open(r: SignupRecord) {
  if (r.gameId >= 99) uni.navigateTo({ url: `/pages/game/detail?id=${r.gameId}` })
}
</script>
