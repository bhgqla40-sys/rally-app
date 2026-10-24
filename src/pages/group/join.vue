<template>
  <view class="flex min-h-screen flex-col gap-4 bg-canvas px-4 pt-6">
    <view class="flex flex-col items-center gap-2 py-4">
      <wd-icon name="usergroup-add" size="48px" color="#2F6BE6" />
      <text class="text-lg font-semibold text-ink">输入邀请码加入群组</text>
      <text class="text-[13px] text-muted">邀请码可以找群主要，6 位字母或数字</text>
    </view>

    <view class="overflow-hidden rounded-2xl bg-white">
      <wd-input v-model="code" label="邀请码" placeholder="例如 RUN888" :maxlength="6" clearable no-border @confirm="submit" />
    </view>

    <wd-button block size="large" :loading="submitting" :disabled="code.trim().length < 6" @click="submit">加入</wd-button>
    <text class="text-center text-xs text-muted">演示用的邀请码：RUN888</text>

    <wd-toast />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { joinGroupByCode } from '@/api/group'

const toast = useToast()
const code = ref('')
const submitting = ref(false)

async function submit() {
  if (code.value.trim().length < 6) return
  submitting.value = true
  try {
    const group = await joinGroupByCode(code.value)
    toast.success(`已加入「${group.name}」`)
    setTimeout(() => uni.redirectTo({ url: `/pages/group/detail?id=${group.id}` }), 800)
  } finally {
    submitting.value = false
  }
}
</script>
