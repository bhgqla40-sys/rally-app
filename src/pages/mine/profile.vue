<template>
  <view class="min-h-screen bg-canvas pb-[calc(88px_+_env(safe-area-inset-bottom))]">
    <view v-if="!profile" class="flex justify-center py-24">
      <wd-loading />
    </view>

    <template v-else>
      <!-- 头像：点一下换 -->
      <view class="flex flex-col items-center gap-2.5 pt-8 pb-6">
        <!-- #ifdef MP-WEIXIN -->
        <!-- 小程序用微信的头像选择器：可以直接用微信头像，也可以从相册选或拍照 -->
        <button class="avatar-btn" open-type="chooseAvatar" :disabled="uploading" @chooseavatar="onChooseAvatar">
          <view class="relative">
            <user-avatar :member="profile" size="xl" self />
            <view class="absolute right-0 bottom-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary">
              <wd-icon name="camera" size="12px" color="#FFFFFF" />
            </view>
          </view>
        </button>
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <view class="relative" @click="pickAvatar">
          <user-avatar :member="profile" size="xl" self />
          <view class="absolute right-0 bottom-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary">
            <wd-icon name="camera" size="12px" color="#FFFFFF" />
          </view>
        </view>
        <!-- #endif -->
        <text class="text-[13px]" :class="uploading ? 'text-muted' : 'text-primary'">{{ uploading ? '正在上传…' : '更换头像' }}</text>
      </view>

      <view class="mx-4 flex flex-col gap-3">
        <view class="flex flex-col gap-1 rounded-2xl bg-white px-4 pt-3 pb-2">
          <text class="text-[13px] text-muted">昵称</text>
          <wd-input v-model="form.nickname" :maxlength="NICKNAME_MAX" placeholder="群里大家怎么称呼你" clearable no-border />
        </view>

        <view class="flex flex-col gap-1 rounded-2xl bg-white px-4 pt-3 pb-2">
          <text class="text-[13px] text-muted">个人介绍</text>
          <wd-textarea
            v-model="form.bio"
            :maxlength="BIO_MAX"
            show-word-limit
            auto-height
            clearable
            no-border
            placeholder="比如：羽毛球打了 3 年，周末基本都有空"
          />
        </view>
      </view>
    </template>

    <!-- 底部保存 -->
    <view v-if="profile" class="fixed inset-x-0 bottom-0 border-t border-line-soft bg-white px-4 pt-3 pb-[calc(12px_+_env(safe-area-inset-bottom))]">
      <wd-button block size="large" :disabled="!changed" :loading="saving" @click="save">保存</wd-button>
    </view>

    <wd-toast />
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { computed, reactive, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { fetchMyProfile, updateMyProfile, uploadAvatar } from '@/api/user'
import { syncMockUser } from '@/mock/db'
import { useUserStore } from '@/stores/user'
import type { MyProfile } from '@/types'
import { shrinkImage } from '@/utils/image'

/** 和后端 UpdateProfileRequest 的校验一致 */
const NICKNAME_MAX = 12
const BIO_MAX = 100

const toast = useToast()
const userStore = useUserStore()

const profile = ref<MyProfile>()
const form = reactive({ nickname: '', bio: '' })
const saving = ref(false)
const uploading = ref(false)

onLoad(async () => {
  const p = await fetchMyProfile()
  applyProfile(p)
  form.nickname = p.nickname
  form.bio = p.bio ?? ''
})

/** 有改动才能点保存 */
const changed = computed(() => {
  const p = profile.value
  if (!p) return false
  return form.nickname.trim() !== p.nickname || form.bio.trim() !== (p.bio ?? '')
})

/** 后端返回最新资料后，同步到页面、登录状态和 mock 数据（还没接后端的页面里显示的「我」） */
function applyProfile(p: MyProfile) {
  profile.value = p
  userStore.setNickname(p.nickname)
  syncMockUser(p.id, p.nickname, p.avatar)
}

async function save() {
  const nickname = form.nickname.trim()
  if (!nickname) {
    toast.warning('昵称不能为空')
    return
  }
  saving.value = true
  try {
    // 个人介绍传空字符串表示清空
    applyProfile(await updateMyProfile({ nickname, bio: form.bio.trim() }))
    form.nickname = nickname
    form.bio = form.bio.trim()
    toast.success('已保存')
    setTimeout(() => uni.navigateBack(), 700)
  } finally {
    saving.value = false
  }
}

// ---------- 头像 ----------

/** 上传后立即生效，不用再点保存 */
async function changeAvatar(path: string) {
  uploading.value = true
  try {
    applyProfile(await uploadAvatar(await shrinkImage(path)))
    toast.success('头像已更新')
  } finally {
    uploading.value = false
  }
}

/** H5：从相册选或拍照 */
function pickAvatar() {
  if (uploading.value) return
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: (res) => changeAvatar(res.tempFilePaths[0]),
  })
}

/** 小程序：<button open-type="chooseAvatar"> 选完头像后回调，拿到的是临时文件路径 */
function onChooseAvatar(e: { detail: { avatarUrl: string } }) {
  if (uploading.value || !e.detail.avatarUrl) return
  changeAvatar(e.detail.avatarUrl)
}
</script>

<style scoped>
/* 去掉小程序 button 的默认样式，只留头像本身 */
.avatar-btn {
  margin: 0;
  padding: 0;
  line-height: 1;
  background: transparent;
  border-radius: 9999px;
  overflow: visible;
}
.avatar-btn::after {
  border: none;
}
</style>
