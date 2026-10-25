<template>
  <view class="min-h-screen bg-canvas">
    <view v-if="notFound" class="flex flex-col items-center gap-3 py-24">
      <wd-icon name="usergroup" size="48px" color="#B8BCC6" />
      <text class="text-sm text-muted">这个群组不存在</text>
    </view>

    <view v-else-if="!group" class="flex justify-center py-24">
      <wd-loading />
    </view>

    <view v-else class="flex flex-col gap-3 px-4 pt-3" :class="isManager ? 'pb-28' : 'pb-6'">
      <!-- 群信息 -->
      <view class="flex items-center gap-3 rounded-2xl bg-white p-4">
        <group-icon :id="group.id" :sport="group.sport" size="lg" />
        <view class="flex min-w-0 flex-1 flex-col gap-1">
          <view class="flex items-center gap-1.5">
            <text class="truncate text-lg font-semibold text-ink">{{ group.name }}</text>
            <text v-if="group.myRole === 'OWNER'" class="shrink-0 rounded bg-primary-soft px-1.5 text-[11px] leading-[18px] font-medium text-primary-ink">群主</text>
          </view>
          <text class="text-[13px] text-muted">{{ group.memberCount }} 人 · {{ group.scheduleText }} · 群主 {{ group.owner.nickname }}</text>
        </view>
        <view v-if="isManager" class="flex h-11 shrink-0 items-center gap-0.5 text-sm font-medium text-primary" @click="goManage">
          <text>管理</text>
          <wd-icon name="arrow-right" size="14px" color="#2F6BE6" />
        </view>
      </view>

      <!-- 邀请码 -->
      <view v-if="group.inviteCode" class="flex items-center justify-between rounded-2xl bg-white p-4">
        <view class="flex flex-col gap-1">
          <text class="text-[13px] text-muted">邀请码</text>
          <text class="text-[22px] font-bold tracking-[4px] text-ink">{{ group.inviteCode }}</text>
        </view>
        <wd-button plain icon="copy" @click="copyInvite">复制邀请码</wd-button>
      </view>

      <!-- 接下来的场次 -->
      <view class="flex flex-col gap-3">
        <text class="mt-1 text-[13px] text-muted">接下来的场次</text>
        <game-card v-for="g in group.upcomingGames" :key="g.id" :game="g" @open="openGame" @join="onJoin" @remind="onRemind" />
        <view v-if="group.upcomingGames.length === 0" class="flex flex-col items-center gap-2 rounded-2xl bg-white py-8">
          <text class="text-sm text-muted">还没有场次</text>
          <text v-if="isManager" class="text-[13px] text-muted">点下方「新建固定局」，每周自动开局</text>
        </view>
      </view>

      <!-- 最近结束：组织者从这里进入费用结算 -->
      <view v-if="isManager && group.recentFinishedGames.length" class="flex flex-col rounded-2xl bg-white px-4 py-1">
        <text class="flex h-11 items-center text-base font-semibold text-ink">最近结束</text>
        <view
          v-for="g in group.recentFinishedGames"
          :key="g.id"
          class="flex min-h-[56px] items-center gap-3 border-t border-line-soft py-2"
          @click="openBill(g.id)"
        >
          <view class="flex min-w-0 flex-1 flex-col gap-0.5">
            <text class="truncate text-[15px] text-ink">{{ g.title }}</text>
            <text class="truncate text-xs text-muted">{{ formatDateTime(g.startAt) }} · {{ g.joinedCount }} 人到场</text>
          </view>
          <text class="text-sm font-medium text-primary">结算费用</text>
          <wd-icon name="arrow-right" size="16px" color="#2F6BE6" />
        </view>
      </view>

      <!-- 成员 -->
      <view class="flex flex-col gap-3.5 rounded-2xl bg-white p-4">
        <view class="flex items-baseline justify-between">
          <text class="text-base font-semibold text-ink">成员</text>
          <text class="text-[13px] text-muted">共 {{ group.memberCount }} 人</text>
        </view>
        <view class="grid grid-cols-5 gap-x-2 gap-y-3.5">
          <view v-for="m in group.members" :key="m.id" class="flex flex-col items-center gap-1">
            <user-avatar :member="m" :self="m.id === myId" />
            <text class="max-w-full truncate text-xs text-ink">{{ m.id === myId ? '我' : m.nickname }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="group && isManager" class="fixed right-0 bottom-0 left-0 border-t border-line bg-white px-4 pt-3 pb-[calc(12px_+_env(safe-area-inset-bottom))]">
      <wd-button block size="large" icon="add" @click="createTemplate">新建固定局</wd-button>
    </view>

    <wd-toast />
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { joinGame } from '@/api/game'
import { fetchGroupDetail, type GroupDetail } from '@/api/group'
import { useUserStore } from '@/stores/user'
import { formatDateTime } from '@/utils/format'

const toast = useToast()
const userStore = useUserStore()
const group = ref<GroupDetail>()
let groupId = 0

const myId = computed(() => userStore.userId)
const isManager = computed(() => group.value?.myRole === 'OWNER' || group.value?.myRole === 'ADMIN')

const notFound = ref(false)

async function load() {
  try {
    group.value = await fetchGroupDetail(groupId)
    uni.setNavigationBarTitle({ title: group.value.name })
  } catch {
    notFound.value = true
  }
}

onLoad((query) => {
  groupId = Number(query?.id)
})

// 从详情页、新建固定局返回时刷新场次
onShow(() => {
  if (groupId) load()
})

function copyInvite() {
  const inviteCode = group.value?.inviteCode
  if (!inviteCode) return

  uni.setClipboardData({
    data: inviteCode,
    showToast: false,
    success: () => toast.success('邀请码已复制'),
  })
}

function openGame(id: number) {
  uni.navigateTo({ url: `/pages/game/detail?id=${id}` })
}

async function onJoin(id: number) {
  const detail = await joinGame(id)
  toast.success(detail.mySignup === 'WAITLIST' ? '已加入候补' : '报名成功')
  load()
}

function onRemind() {
  toast.info('开放报名时会提醒你')
}

function openBill(gameId: number) {
  uni.navigateTo({ url: `/pages/bill/index?gameId=${gameId}` })
}

function goManage() {
  uni.navigateTo({ url: `/pages/group/manage?id=${groupId}` })
}

function createTemplate() {
  uni.navigateTo({ url: `/pages/game/create?groupId=${groupId}` })
}
</script>
