<template>
  <view class="min-h-screen bg-canvas px-4 pt-3 pb-6">
    <view v-if="loading && bills.length === 0" class="flex justify-center py-24">
      <wd-loading />
    </view>

    <view v-else-if="bills.length === 0" class="flex flex-col items-center gap-3 py-24">
      <wd-icon name="check-circle" size="48px" color="#1F9D6B" />
      <text class="text-sm text-muted">没有待付款，都结清了</text>
    </view>

    <view v-else class="flex flex-col gap-3">
      <text class="text-[13px] leading-5 text-muted">直接微信转账给组织者，转完点「我已转账」，组织者确认后就会从这里消失。</text>

      <view v-for="b in bills" :key="b.billId" class="flex flex-col gap-3 rounded-2xl bg-white p-4">
        <view class="flex items-start justify-between gap-3">
          <view class="flex min-w-0 flex-col gap-1">
            <text class="text-base font-semibold text-ink">{{ b.gameTitle }}</text>
            <text class="text-[13px] text-muted">{{ formatDateTime(b.gameStartAt) }} · {{ b.groupName }}</text>
          </view>
          <text class="shrink-0 text-[22px] font-bold text-ink">{{ formatMoney(b.amount) }}</text>
        </view>

        <view class="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2.5">
          <user-avatar :member="b.organizer" size="sm" />
          <view class="flex flex-1 flex-col gap-0.5">
            <text class="text-sm text-ink">转给 {{ b.organizer.nickname }}</text>
            <text class="text-xs text-muted">组织者，已垫付全部费用</text>
          </view>
          <text class="text-sm text-primary" @click="openBill(b.gameId)">看明细</text>
        </view>

        <view class="flex items-center justify-between gap-3 border-t border-line-soft pt-3">
          <text v-if="b.claimedAt" class="text-[13px] text-success-ink">已通知组织者，等待确认</text>
          <text v-else class="text-[13px] text-warning-ink">还没付</text>
          <view class="shrink-0" @click.stop>
            <wd-button v-if="!b.claimedAt" :loading="submittingId === b.billId" @click="claim(b)">我已转账</wd-button>
            <wd-button v-else plain icon="copy" @click="copyAmount(b)">复制金额</wd-button>
          </view>
        </view>
      </view>
    </view>

    <wd-toast />
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { claimPaid, fetchMyPendingBills } from '@/api/bill'
import type { PendingBill } from '@/types'
import { formatDateTime, formatMoney } from '@/utils/format'

const toast = useToast()
const bills = ref<PendingBill[]>([])
const loading = ref(false)
const submittingId = ref(0)

async function load() {
  loading.value = true
  try {
    bills.value = await fetchMyPendingBills()
  } finally {
    loading.value = false
  }
}

onShow(load)

async function claim(b: PendingBill) {
  submittingId.value = b.billId
  try {
    await claimPaid(b.billId)
    toast.success('已通知组织者')
    load()
  } finally {
    submittingId.value = 0
  }
}

function copyAmount(b: PendingBill) {
  uni.setClipboardData({ data: String(b.amount / 100), success: () => toast.success('金额已复制') })
}

function openBill(gameId: number) {
  uni.navigateTo({ url: `/pages/bill/index?gameId=${gameId}` })
}
</script>
