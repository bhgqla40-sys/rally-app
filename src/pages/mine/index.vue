<template>
  <tab-book-transition :direction="tabDirection" :play-key="tabPlayKey">
    <view class="min-h-screen bg-canvas pb-6">
      <!-- 个人信息 -->
      <view class="flex items-center gap-3.5 bg-white px-4 pt-4 pb-6" @click="go('/pages/mine/profile')">
        <user-avatar v-if="profile" :member="profile" size="lg" self />
        <view class="flex min-w-0 flex-1 flex-col gap-1">
          <text class="truncate text-xl font-semibold text-ink">{{ profile?.nickname ?? ' ' }}</text>
          <text class="line-clamp-2 text-[13px] leading-5" :class="profile?.bio ? 'text-ink-2' : 'text-muted'">
            {{ profile?.bio || '写一句个人介绍，让群友更了解你' }}
          </text>
        </view>
        <wd-icon name="arrow-right" size="16px" color="#5C5C5C" />
      </view>

      <view class="flex flex-col gap-3 px-4 pt-3">
        <!-- 数据 -->
        <view class="grid grid-cols-3 rounded-2xl bg-white px-2 py-4">
          <view v-for="(s, i) in stats" :key="s.label" class="flex flex-col items-center gap-1" :class="i === 1 ? 'border-x border-line-soft' : ''">
            <text class="text-[22px] font-bold text-ink">{{ s.value }}</text>
            <text class="text-xs text-muted">{{ s.label }}</text>
          </view>
        </view>

        <!-- 我的群组 -->
        <view class="flex flex-col rounded-2xl bg-white px-4 py-1">
          <view class="flex h-11 items-center justify-between">
            <text class="text-base font-semibold text-ink">我的群组</text>
            <view class="flex h-11 items-center gap-1 text-sm font-medium text-primary" @click="go('/pages/group/create')">
              <wd-icon name="add" size="14px" color="#2F6BE6" />
              <text>创建群组</text>
            </view>
          </view>
          <view
            v-for="g in groups"
            :key="g.id"
            class="flex h-[60px] items-center gap-3 border-t border-line-soft"
            @click="go(`/pages/group/detail?id=${g.id}`)"
          >
            <group-icon :id="g.id" :sport="g.sport" />
            <view class="flex min-w-0 flex-1 flex-col gap-0.5">
              <view class="flex items-center gap-1.5">
                <text class="truncate text-[15px] text-ink">{{ g.name }}</text>
                <text v-if="g.myRole === 'OWNER'" class="shrink-0 rounded bg-primary-soft px-1.5 text-[11px] leading-[18px] font-medium text-primary-ink">群主</text>
              </view>
              <text class="text-xs text-muted">{{ g.memberCount }} 人 · {{ g.scheduleText }}</text>
            </view>
            <wd-icon name="arrow-right" size="16px" color="#5C5C5C" />
          </view>
        </view>

        <!-- 菜单 -->
        <view class="flex flex-col rounded-2xl bg-white px-4">
          <view v-for="(item, i) in menus" :key="item.title" class="flex h-[52px] items-center gap-3" :class="i > 0 ? 'border-t border-line-soft' : ''" @click="item.onClick()">
            <wd-icon :name="item.icon" size="20px" color="#1A1A1A" />
            <text class="flex-1 text-[15px] text-ink">{{ item.title }}</text>
            <text v-if="item.badge" class="rounded-full bg-warning-soft px-2 text-xs leading-5 font-medium text-warning-ink">{{ item.badge }}</text>
            <wd-icon name="arrow-right" size="16px" color="#5C5C5C" />
          </view>
        </view>
      </view>

      <wd-toast />
      <wd-message-box />
    </view>
  </tab-book-transition>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { useMessage, useToast } from 'wot-design-uni'
import { fetchMyGroups } from '@/api/group'
import { fetchMyProfile } from '@/api/user'
import { syncMockUser } from '@/mock/db'
import { useUserStore } from '@/stores/user'
import type { Group, MyProfile } from '@/types'
import { resolveTabBookDirection, type TabBookDirection } from '@/utils/tab-transition'

const toast = useToast()
const message = useMessage()
const userStore = useUserStore()
const profile = ref<MyProfile>()
const groups = ref<Group[]>([])
const tabDirection = ref<TabBookDirection>('none')
const tabPlayKey = ref(0)

onShow(async () => {
  const direction = resolveTabBookDirection('pages/mine/index')
  tabDirection.value = direction
  if (direction !== 'none') tabPlayKey.value += 1
  ;[profile.value, groups.value] = await Promise.all([fetchMyProfile(), fetchMyGroups()])
  // 联调过渡：还在用 mock 的页面里，「我」的昵称和头像跟着真实资料走
  syncMockUser(profile.value.id, profile.value.nickname, profile.value.avatar)
})

const stats = computed(() => [
  { label: '本月出勤', value: profile.value?.monthAttendance ?? '-' },
  { label: '累计出勤', value: profile.value?.totalAttendance ?? '-' },
  { label: '鸽子次数', value: profile.value?.noShowCount ?? '-' },
])

function go(url: string) {
  uni.navigateTo({ url })
}

async function logout() {
  try {
    await message.confirm({ title: '退出登录？', confirmButtonText: '退出', cancelButtonText: '取消' })
  } catch {
    return
  }
  userStore.logout()
  uni.reLaunch({ url: '/pages/login/index' })
}

const menus = computed(() => [
  { title: '待付款', icon: 'money-circle', badge: profile.value?.pendingBillCount ? `${profile.value.pendingBillCount} 笔` : '', onClick: () => go('/pages/mine/bills') },
  { title: '我的报名记录', icon: 'list', badge: '', onClick: () => go('/pages/mine/signups') },
  { title: '输入邀请码加入群组', icon: 'usergroup-add', badge: '', onClick: () => go('/pages/group/join') },
  { title: '退出登录', icon: 'logout', badge: '', onClick: logout },
])
</script>
