<template>
  <view class="flex min-h-screen flex-col bg-white px-6 pt-12 pb-8">
    <!-- 品牌 -->
    <view class="flex flex-col gap-2">
      <text class="text-[32px] font-bold tracking-wide text-primary">Rally</text>
      <text class="text-xl font-semibold text-ink">组局助手</text>
      <text class="text-sm text-muted">固定球局的报名、候补、AA 记账，一个链接搞定</text>
    </view>

    <!-- 登录 / 注册 切换 -->
    <view class="mt-10">
      <wd-segmented v-model:value="modeLabel" :options="MODE_LABELS" />
    </view>

    <view class="mt-6 flex flex-col gap-4">
      <view class="flex flex-col gap-1.5">
        <text class="text-sm text-ink">手机号</text>
        <wd-input v-model="form.phone" type="number" :maxlength="11" placeholder="请输入 11 位手机号" clearable />
      </view>
      <view v-if="mode === 'register'" class="flex flex-col gap-1.5">
        <text class="text-sm text-ink">昵称</text>
        <wd-input v-model="form.nickname" :maxlength="12" placeholder="群里大家怎么称呼你" clearable />
      </view>
      <view class="flex flex-col gap-1.5">
        <text class="text-sm text-ink">密码</text>
        <wd-input v-model="form.password" :maxlength="32" placeholder="至少 6 位" show-password clearable />
      </view>
    </view>

    <view class="mt-8">
      <wd-button block size="large" :loading="submitting" @click="submit">{{ mode === 'login' ? '登录' : '注册并登录' }}</wd-button>
    </view>

    <text class="mt-4 text-center text-xs leading-5 text-muted">
      {{ mode === 'login' ? '还没有账号？切换到「注册」，30 秒就好' : '注册即表示你同意按群规参与活动' }}
    </text>

    <wd-toast />
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { computed, reactive, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { login, register } from '@/api/auth'
import { useUserStore } from '@/stores/user'

type Mode = 'login' | 'register'
const MODE_LABELS = ['登录', '注册']
const MODES: Mode[] = ['login', 'register']

const toast = useToast()
const userStore = useUserStore()
const mode = ref<Mode>('login')
const submitting = ref(false)
const form = reactive({ phone: '', password: '', nickname: '' })

/** 登录成功后要回到的页面，没有就去首页 */
let redirect = '/pages/index/index'
onLoad((query) => {
  if (query?.redirect) redirect = decodeURIComponent(query.redirect)
})

const modeLabel = computed({
  get: () => MODE_LABELS[MODES.indexOf(mode.value)],
  set: (label: string) => {
    mode.value = MODES[MODE_LABELS.indexOf(label)]
  },
})

/** 返回错误提示；没问题返回空字符串 */
function validate() {
  if (!/^1\d{10}$/.test(form.phone)) return '请输入正确的手机号'
  if (mode.value === 'register' && !form.nickname.trim()) return '请填写昵称'
  if (form.password.length < 6) return '密码至少 6 位'
  return ''
}

async function submit() {
  const error = validate()
  if (error) {
    toast.warning(error)
    return
  }
  submitting.value = true
  try {
    const result =
      mode.value === 'login'
        ? await login({ phone: form.phone, password: form.password })
        : await register({ phone: form.phone, password: form.password, nickname: form.nickname.trim() })
    userStore.setLogin(result.token, result.userId, result.nickname)
    toast.success(`欢迎，${result.nickname}`)
    setTimeout(() => uni.reLaunch({ url: redirect }), 600)
  } finally {
    submitting.value = false
  }
}
</script>
