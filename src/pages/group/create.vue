<template>
  <view class="flex min-h-screen flex-col gap-4 bg-canvas px-4 pt-4">
    <view class="overflow-hidden rounded-2xl bg-white">
      <wd-input v-model="name" label="群名称" placeholder="例如：星火羽毛球群" :maxlength="20" clearable />
      <view class="flex flex-col gap-2.5 px-4 py-3">
        <text class="text-sm text-ink">主要运动</text>
        <view class="flex flex-wrap gap-1.5">
          <view
            v-for="s in SPORT_OPTIONS"
            :key="s.value"
            class="h-9 rounded-full border border-solid px-3 text-sm leading-[34px]"
            :class="sport === s.value ? 'border-primary bg-primary-soft font-semibold text-primary-ink' : 'border-line bg-white text-ink'"
            @click="sport = s.value"
          >
            {{ s.label }}
          </view>
        </view>
      </view>
    </view>

    <text class="px-1 text-[13px] leading-5 text-muted">创建后你就是群主，会生成一个邀请码，发到微信群里大家就能加入。</text>

    <wd-button block size="large" :loading="submitting" @click="submit">创建群组</wd-button>
    <wd-toast />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { createGroup } from '@/api/group'
import { SPORT_OPTIONS } from '@/constants'
import type { SportType } from '@/types'

const toast = useToast()
const name = ref('')
const sport = ref<SportType>('BADMINTON')
const submitting = ref(false)

async function submit() {
  if (!name.value.trim()) {
    toast.warning('请填写群名称')
    return
  }
  submitting.value = true
  try {
    const group = await createGroup(name.value.trim(), sport.value)
    toast.success('创建成功')
    setTimeout(() => uni.redirectTo({ url: `/pages/group/detail?id=${group.id}` }), 800)
  } finally {
    submitting.value = false
  }
}
</script>
