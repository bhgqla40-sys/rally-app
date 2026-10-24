<template>
  <view class="min-h-screen bg-[#f5f6f8] p-4">
    <view class="mb-4">
      <text class="block text-xl font-bold text-gray-900">本周球局</text>
      <text class="mt-1 block text-sm text-gray-500">
        环境检查页：卡片样式、标签、进度条、按钮都正常显示，就说明 Tailwind 和组件库配置成功
      </text>
    </view>

    <view class="rounded-xl bg-white p-4 shadow-sm">
      <view class="flex items-center justify-between">
        <text class="text-base font-semibold text-gray-900">{{ game.title }}</text>
        <wd-tag :type="isFull ? 'warning' : 'success'" plain>
          {{ isFull ? '已满员' : '报名中' }}
        </wd-tag>
      </view>

      <view class="mt-3 flex flex-col gap-1 text-sm text-gray-600">
        <text>时间：{{ startText }}</text>
        <text>地点：{{ game.venue }}</text>
        <text>名额：{{ game.joined }} / {{ game.capacity }}</text>
      </view>

      <view class="mt-3">
        <wd-progress :percentage="percent" hide-text />
      </view>

      <view class="mt-4 flex gap-3">
        <view class="w-1/2">
          <wd-button block plain @click="onWaitlist">排候补</wd-button>
        </view>
        <view class="w-1/2">
          <wd-button block :disabled="isFull" @click="onJoin">报名</wd-button>
        </view>
      </view>
    </view>

    <wd-toast />
  </view>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import dayjs from 'dayjs'
import { useToast } from 'wot-design-uni'

const toast = useToast()

// 演示用的假数据，接上后端后会换成接口返回的数据
const game = reactive({
  title: '周六晚羽毛球',
  venue: '市体育中心 3 号馆',
  startAt: dayjs().day(6).hour(19).minute(0).toISOString(),
  joined: 9,
  capacity: 12,
})

const startText = computed(() => dayjs(game.startAt).format('M月D日 HH:mm'))
const percent = computed(() => Math.round((game.joined / game.capacity) * 100))
const isFull = computed(() => game.joined >= game.capacity)

function onJoin() {
  game.joined++
  toast.success('报名成功')
}

function onWaitlist() {
  toast.info('已加入候补，有人取消会自动递补')
}
</script>
