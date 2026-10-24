<template>
  <view class="min-h-screen bg-canvas">
    <view v-if="!game" class="flex justify-center py-24">
      <wd-loading />
    </view>

    <template v-else>
      <view class="flex flex-col gap-3 px-4 pt-3 pb-28">
        <!-- 场次信息 -->
        <view class="flex flex-col gap-3.5 rounded-2xl bg-white p-4">
          <view class="flex flex-col gap-1">
            <view class="flex items-center justify-between gap-3">
              <text class="text-lg font-semibold text-ink">{{ game.title }}</text>
              <game-status-tag :status="game.status" :full="isFull" />
            </view>
            <text class="text-[13px] text-muted">{{ game.groupName }} · 组织者 {{ game.organizer.nickname }}</text>
          </view>
          <view class="flex flex-col gap-2.5 text-sm text-ink">
            <view class="flex items-center gap-2">
              <wd-icon name="time" size="16px" color="#5C5C5C" />
              <text>{{ timeText }}</text>
            </view>
            <view class="flex items-center gap-2">
              <wd-icon name="location" size="16px" color="#5C5C5C" />
              <text>{{ game.venue }}</text>
            </view>
            <view class="flex items-center gap-2">
              <wd-icon name="hourglass" size="16px" color="#5C5C5C" />
              <text>{{ deadlineText }}</text>
            </view>
            <view v-if="game.feePerPerson" class="flex items-center gap-2">
              <wd-icon name="wallet" size="16px" color="#5C5C5C" />
              <text>{{ feeText }}</text>
            </view>
          </view>
        </view>

        <!-- 报名名单 -->
        <view class="flex flex-col gap-3.5 rounded-2xl bg-white p-4">
          <view class="flex items-baseline justify-between">
            <text class="text-base font-semibold text-ink">已报名 {{ game.joinedCount }} / {{ game.capacity }}</text>
            <text class="text-[13px] text-muted">{{ isFull ? '名额已满' : `还剩 ${game.capacity - game.joinedCount} 个名额` }}</text>
          </view>
          <view class="grid grid-cols-5 gap-x-2 gap-y-3.5">
            <view v-for="m in game.joined" :key="m.id" class="flex flex-col items-center gap-1">
              <user-avatar :member="m" :self="m.id === myId" />
              <text class="max-w-full truncate text-xs" :class="m.id === myId ? 'font-semibold text-primary' : 'text-ink'">
                {{ m.id === myId ? '我' : m.nickname }}
              </text>
            </view>
            <view v-for="n in emptySeats" :key="`empty-${n}`" class="flex flex-col items-center gap-1">
              <view class="box-border h-11 w-11 rounded-full border-[1.5px] border-dashed border-seat" />
              <text class="text-xs text-muted">空位</text>
            </view>
          </view>
        </view>

        <!-- 候补 -->
        <view v-if="game.allowWaitlist" class="flex flex-col gap-2 rounded-2xl bg-white p-4">
          <text class="text-base font-semibold text-ink">候补 {{ game.waitlistCount }} 人</text>
          <view v-for="(m, i) in game.waitlist" :key="m.id" class="flex items-center gap-3 py-1">
            <text class="w-5 text-center text-sm font-semibold text-muted">{{ i + 1 }}</text>
            <user-avatar :member="m" size="sm" :self="m.id === myId" />
            <text class="text-sm" :class="m.id === myId ? 'font-semibold text-primary' : 'text-ink'">{{ m.id === myId ? '我' : m.nickname }}</text>
          </view>
          <text class="text-[13px] leading-5 text-muted">满员后报名的人会进入候补；有人取消时，按顺序自动递补并通知本人。</text>
        </view>

        <!-- 群规 -->
        <view v-if="game.rules.length" class="flex flex-col gap-2 rounded-2xl bg-white p-4">
          <text class="text-base font-semibold text-ink">群规</text>
          <view v-for="rule in game.rules" :key="rule" class="flex gap-2 text-[13px] leading-5 text-muted">
            <text>•</text>
            <text>{{ rule }}</text>
          </view>
        </view>
      </view>

      <!-- 底部操作栏：按钮随状态变化 -->
      <view class="fixed right-0 bottom-0 left-0 flex items-center gap-3 border-t border-line bg-white px-4 pt-3 pb-[calc(12px_+_env(safe-area-inset-bottom))]">
        <template v-if="game.status === 'OPEN'">
          <template v-if="game.mySignup === 'JOINED'">
            <view class="flex-1"><wd-button block plain type="error" :loading="submitting" @click="onCancel">取消报名</wd-button></view>
            <view class="flex-[1.4]"><wd-button block icon="usergroup-add" @click="onShare">邀请好友补位</wd-button></view>
          </template>
          <template v-else-if="game.mySignup === 'WAITLIST'">
            <text class="flex-1 text-sm font-medium text-warning-ink">候补第 {{ game.myWaitlistRank }} 位</text>
            <view class="flex-1"><wd-button block plain :loading="submitting" @click="onCancel">退出候补</wd-button></view>
          </template>
          <template v-else>
            <view class="flex-1"><wd-button block plain icon="share" @click="onShare">分享</wd-button></view>
            <view class="flex-[1.4]">
              <wd-button block :loading="submitting" @click="onJoin">{{ isFull ? '排候补' : '报名' }}</wd-button>
            </view>
          </template>
        </template>

        <view v-else-if="game.status === 'UPCOMING'" class="flex-1">
          <wd-button block plain icon="notification" @click="onRemind">{{ openText }}，开放时提醒我</wd-button>
        </view>

        <view v-else-if="game.status === 'FINISHED' && isOrganizer" class="flex-1">
          <wd-button block icon="wallet" @click="goBill">结算费用</wd-button>
        </view>

        <view v-else class="flex-1">
          <wd-button block disabled>{{ game.status === 'CLOSED' ? '报名已截止' : game.status === 'FINISHED' ? '已结束' : '已取消' }}</wd-button>
        </view>
      </view>
    </template>

    <wd-toast />
    <wd-message-box />
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { useMessage, useToast } from 'wot-design-uni'
import { cancelSignup, fetchGameDetail, joinGame } from '@/api/game'
import { useUserStore } from '@/stores/user'
import type { GameDetail } from '@/types'
import { formatDateTime, formatGameTime, formatMoney } from '@/utils/format'
import { shareGame } from '@/utils/share'

const toast = useToast()
const message = useMessage()
const userStore = useUserStore()

const game = ref<GameDetail>()
const submitting = ref(false)
let gameId = 0

const myId = computed(() => userStore.userId)
const isFull = computed(() => !!game.value && game.value.joinedCount >= game.value.capacity)
const isOrganizer = computed(() => game.value?.organizer.id === myId.value)
const emptySeats = computed(() => (game.value ? Math.max(0, game.value.capacity - game.value.joinedCount) : 0))
const timeText = computed(() => (game.value ? formatGameTime(game.value.startAt, game.value.endAt) : ''))
const deadlineText = computed(() => (game.value ? `${formatDateTime(game.value.deadlineAt)} 截止报名和取消` : ''))
const openText = computed(() => (game.value ? `${formatDateTime(game.value.openAt)} 开放` : ''))
const feeText = computed(() => {
  const g = game.value
  if (!g?.feePerPerson) return ''
  return g.feeMode === 'AA' ? `费用 AA，预计每人约 ${formatMoney(g.feePerPerson)}` : `每人 ${formatMoney(g.feePerPerson)}`
})

async function load() {
  game.value = await fetchGameDetail(gameId)
  uni.setNavigationBarTitle({ title: game.value.title })
}

onLoad((query) => {
  gameId = Number(query?.id)
  load()
})

async function onJoin() {
  submitting.value = true
  try {
    game.value = await joinGame(gameId)
    toast.success(game.value.mySignup === 'WAITLIST' ? `已加入候补，排第 ${game.value.myWaitlistRank} 位` : '报名成功')
  } finally {
    submitting.value = false
  }
}

async function onCancel() {
  const isWaitlist = game.value?.mySignup === 'WAITLIST'
  try {
    await message.confirm({
      title: isWaitlist ? '退出候补？' : '取消报名？',
      msg: isWaitlist ? '退出后需要重新排队' : '你的名额会自动让给候补第一位',
      confirmButtonText: isWaitlist ? '退出候补' : '取消报名',
      cancelButtonText: '再想想',
    })
  } catch {
    return // 点了「再想想」
  }
  submitting.value = true
  try {
    game.value = await cancelSignup(gameId)
    toast.info(isWaitlist ? '已退出候补' : '已取消报名')
  } finally {
    submitting.value = false
  }
}

function onShare() {
  if (game.value) shareGame(game.value)
}

function onRemind() {
  toast.info('开放报名时会提醒你')
}

function goBill() {
  uni.navigateTo({ url: `/pages/bill/index?gameId=${gameId}` })
}
</script>
