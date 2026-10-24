<template>
  <view class="min-h-screen bg-canvas">
    <view v-if="!game" class="flex justify-center py-24">
      <wd-loading />
    </view>

    <view v-else class="flex flex-col gap-3 px-4 pt-3 pb-10">
      <!-- 场次概要 -->
      <view class="flex flex-col gap-2 rounded-2xl bg-white p-4">
        <view class="flex items-center justify-between gap-3">
          <text class="text-base font-semibold text-ink">{{ game.title }}</text>
          <game-status-tag :status="game.status" :full="game.joinedCount >= game.capacity" />
        </view>
        <text class="text-[13px] text-muted">{{ formatGameTime(game.startAt, game.endAt) }}</text>
        <text class="text-[13px] text-muted">已报名 {{ game.joinedCount }} / {{ game.capacity }} · 候补 {{ game.waitlistCount }} 人</text>
      </view>

      <!-- 已取消 -->
      <view v-if="game.status === 'CANCELLED'" class="flex flex-col gap-1 rounded-2xl bg-danger-soft p-4">
        <text class="text-sm font-semibold text-danger">这一场已取消</text>
        <text class="text-[13px] text-ink-2">原因：{{ game.cancelReason || '未填写' }}</text>
      </view>

      <!-- 结束后：确认出勤 -->
      <view v-else-if="game.status === 'FINISHED'" class="flex flex-col rounded-2xl bg-white px-4 pt-4 pb-2">
        <text class="text-base font-semibold text-ink">确认出勤</text>
        <text class="mt-1 text-[13px] leading-5 text-muted">报了名但没来的人标记为「鸽了」，结算费用时不算他们，也会记进个人的鸽子次数。请在结算费用之前确认。</text>
        <view v-for="m in game.joined" :key="m.id" class="mt-2 flex h-[56px] items-center gap-3 border-t border-line-soft">
          <user-avatar :member="m" size="sm" :self="m.id === myId" />
          <text class="flex-1 text-[15px] text-ink">{{ m.id === myId ? `${m.nickname}（我）` : m.nickname }}</text>
          <view class="flex rounded-full bg-line-soft p-0.5">
            <view class="rounded-full px-3 text-[13px] leading-7" :class="noShow.has(m.id) ? 'text-ink-2' : 'bg-white font-semibold text-success-ink'" @click="setNoShow(m.id, false)">出勤</view>
            <view class="rounded-full px-3 text-[13px] leading-7" :class="noShow.has(m.id) ? 'bg-white font-semibold text-danger' : 'text-ink-2'" @click="setNoShow(m.id, true)">鸽了</view>
          </view>
        </view>
        <view class="flex gap-3 py-3">
          <view class="flex-1"><wd-button block plain :loading="submitting" @click="saveAttendance">保存出勤（{{ game.joined.length - noShow.size }} 人到场）</wd-button></view>
        </view>
        <wd-button block icon="money-circle" @click="goBill">去结算费用</wd-button>
        <view class="h-2" />
      </view>

      <!-- 还没结束：管理报名名单 -->
      <template v-else>
        <view class="flex flex-col rounded-2xl bg-white px-4 py-1">
          <view class="flex h-11 items-center justify-between">
            <text class="text-base font-semibold text-ink">报名名单（{{ game.joinedCount }}）</text>
          </view>
          <view v-for="m in game.joined" :key="m.id" class="flex h-[56px] items-center gap-3 border-t border-line-soft">
            <user-avatar :member="m" size="sm" :self="m.id === myId" />
            <text class="flex-1 text-[15px] text-ink">{{ m.id === myId ? `${m.nickname}（我）` : m.nickname }}</text>
            <text v-if="m.id !== myId" class="px-2 text-sm leading-[44px] text-danger" @click="onRemove(m.id, m.nickname, false)">移出</text>
          </view>
          <text v-if="game.joined.length === 0" class="border-t border-line-soft py-6 text-center text-sm text-muted">还没有人报名</text>
        </view>

        <view v-if="game.waitlist.length" class="flex flex-col rounded-2xl bg-white px-4 py-1">
          <text class="flex h-11 items-center text-base font-semibold text-ink">候补（{{ game.waitlistCount }}）</text>
          <view v-for="(m, i) in game.waitlist" :key="m.id" class="flex h-[56px] items-center gap-3 border-t border-line-soft">
            <text class="w-5 text-center text-sm font-semibold text-muted">{{ i + 1 }}</text>
            <user-avatar :member="m" size="sm" :self="m.id === myId" />
            <text class="flex-1 text-[15px] text-ink">{{ m.nickname }}</text>
            <text v-if="m.id !== myId" class="px-2 text-sm leading-[44px] text-danger" @click="onRemove(m.id, m.nickname, true)">移出</text>
          </view>
        </view>

        <!-- 取消这一场 -->
        <view v-if="canCancel" class="flex flex-col gap-3 rounded-2xl bg-white p-4">
          <view class="flex flex-col gap-1">
            <text class="text-base font-semibold text-ink">取消这一场</text>
            <text class="text-[13px] leading-5 text-muted">比如场地临时关闭、天气不好。取消后所有报名和候补的人都会收到通知，这一场不计入出勤。</text>
          </view>
          <wd-button block plain type="error" :loading="submitting" @click="onCancelGame">取消这一场</wd-button>
        </view>
      </template>
    </view>

    <wd-toast />
    <wd-message-box />
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import dayjs from 'dayjs'
import { computed, ref } from 'vue'
import { useMessage, useToast } from 'wot-design-uni'
import { cancelGame, confirmAttendance, fetchGameDetail, removeSignup } from '@/api/game'
import { useUserStore } from '@/stores/user'
import type { GameDetail } from '@/types'
import { formatGameTime } from '@/utils/format'

const toast = useToast()
const message = useMessage()
const userStore = useUserStore()

const game = ref<GameDetail>()
const submitting = ref(false)
/** 当前标记为「鸽了」的人 */
const noShow = ref(new Set<number>())
let gameId = 0

const myId = computed(() => userStore.userId)
const canCancel = computed(() => !!game.value && dayjs().isBefore(game.value.startAt))

async function load() {
  game.value = await fetchGameDetail(gameId)
  noShow.value = new Set(game.value.noShowIds ?? [])
}

onLoad((query) => {
  gameId = Number(query?.id)
  load()
})

function setNoShow(id: number, value: boolean) {
  const next = new Set(noShow.value)
  if (value) next.add(id)
  else next.delete(id)
  noShow.value = next
}

async function saveAttendance() {
  submitting.value = true
  try {
    game.value = await confirmAttendance(gameId, Array.from(noShow.value))
    toast.success('出勤已保存')
  } finally {
    submitting.value = false
  }
}

async function onRemove(memberId: number, nickname: string, isWaitlist: boolean) {
  try {
    await message.confirm({
      title: `把「${nickname}」移出${isWaitlist ? '候补' : '报名'}？`,
      msg: isWaitlist || !game.value?.waitlistCount ? '对方会收到通知' : '对方会收到通知，空出的名额会自动给候补第一位',
      confirmButtonText: '移出',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  game.value = await removeSignup(gameId, memberId)
  toast.success('已移出')
}

async function onCancelGame() {
  let reason = ''
  try {
    const res = await message.prompt({
      title: '取消这一场',
      msg: '告诉大家取消的原因',
      inputPlaceholder: '例如：场地临时关闭',
      inputValidate: (v: string | number) => String(v ?? '').trim().length > 0,
      inputError: '请填写原因',
      confirmButtonText: '确认取消',
      cancelButtonText: '再想想',
    })
    reason = String((res as { value?: string }).value ?? '').trim()
  } catch {
    return
  }
  submitting.value = true
  try {
    game.value = await cancelGame(gameId, reason)
    toast.success('已取消，已通知报名的人')
  } finally {
    submitting.value = false
  }
}

function goBill() {
  uni.navigateTo({ url: `/pages/bill/index?gameId=${gameId}` })
}
</script>
