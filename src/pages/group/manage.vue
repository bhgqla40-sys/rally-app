<template>
  <view class="min-h-screen bg-canvas">
    <view v-if="!group" class="flex justify-center py-24">
      <wd-loading />
    </view>

    <view v-else class="flex flex-col gap-3 pt-3 pb-10">
      <view v-if="notReady" class="mx-4 rounded-xl bg-warning-soft px-4 py-3 text-[13px] leading-5 text-warning-ink">
        改群名、重新生成邀请码、成员管理这些功能，后端还在开发中，现在只能查看。
      </view>
      <!-- 基本信息 -->
      <wd-cell-group title="基本信息" insert>
        <wd-input v-model="name" label="群名称" :maxlength="20" :readonly="notReady" :clearable="!notReady" />
        <view v-if="nameChanged" class="px-4 pb-3">
          <wd-button block size="small" :loading="savingName" @click="saveName">保存群名称</wd-button>
        </view>
        <wd-cell title="邀请码" center>
          <view class="flex items-center gap-3">
            <text class="text-base font-bold tracking-[2px] text-ink">{{ group.inviteCode }}</text>
            <text v-if="!notReady" class="text-sm text-primary" @click="onResetCode">重新生成</text>
          </view>
        </wd-cell>
      </wd-cell-group>

      <!-- 固定局 -->
      <wd-cell-group title="固定局" insert>
        <wd-cell v-for="t in templates" :key="t.id" :title="t.name" :label="templateDesc(t)" center>
          <view class="flex items-center gap-2">
            <text class="text-xs" :class="t.active ? 'text-success-ink' : 'text-muted'">{{ t.active ? '进行中' : '已暂停' }}</text>
            <wd-switch :model-value="t.active" size="22px" @change="onToggleTemplate(t, $event)" />
          </view>
        </wd-cell>
        <view v-if="templates.length === 0" class="px-4 py-4 text-center text-sm text-muted">还没有固定局</view>
        <view class="px-4 py-3">
          <wd-button block plain size="small" icon="add" @click="createTemplate">新建固定局</wd-button>
        </view>
      </wd-cell-group>

      <!-- 成员 -->
      <wd-cell-group :title="`成员（${members.length}）`" insert>
        <view
          v-for="(m, i) in members"
          :key="m.member.id"
          class="flex h-[56px] items-center gap-3 px-4"
          :class="i < members.length - 1 ? 'border-b border-line-soft' : ''"
        >
          <user-avatar :member="m.member" size="sm" :self="m.member.id === myId" />
          <view class="flex min-w-0 flex-1 items-center gap-1.5">
            <text class="truncate text-[15px] text-ink">{{ m.member.id === myId ? `${m.member.nickname}（我）` : m.member.nickname }}</text>
            <text v-if="m.role === 'OWNER'" class="shrink-0 rounded bg-primary-soft px-1.5 text-[11px] leading-[18px] font-medium text-primary-ink">群主</text>
            <text v-else-if="m.role === 'ADMIN'" class="shrink-0 rounded bg-success-soft px-1.5 text-[11px] leading-[18px] font-medium text-success-ink">管理员</text>
          </view>
          <view v-if="canManage(m)" class="flex h-11 w-11 items-center justify-center" @click="openActions(m)">
            <wd-icon name="more" size="20px" color="#5C5C5C" />
          </view>
        </view>
      </wd-cell-group>
    </view>

    <wd-action-sheet v-model="showActions" :actions="actions" cancel-text="取消" @select="onAction" />
    <wd-toast />
    <wd-message-box />
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { useMessage, useToast } from 'wot-design-uni'
import {
  fetchGroupDetail,
  fetchGroupMembers,
  removeGroupMember,
  resetInviteCode,
  setMemberRole,
  updateGroup,
  type GroupDetail,
} from '@/api/group'
import { fetchGroupTemplates, setTemplateActive } from '@/api/template'
import { useUserStore } from '@/stores/user'
import type { GameTemplateBrief, GroupMember } from '@/types'

const WEEKDAYS = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']

const toast = useToast()
const message = useMessage()
const userStore = useUserStore()

const group = ref<GroupDetail>()
const members = ref<GroupMember[]>([])
const templates = ref<GameTemplateBrief[]>([])
const name = ref('')
const savingName = ref(false)
let groupId = 0

const myId = computed(() => userStore.userId)
const isOwner = computed(() => group.value?.myRole === 'OWNER')
const nameChanged = computed(() => !!group.value && name.value.trim() !== '' && name.value.trim() !== group.value.name)

/** 群组管理接口后端还没做完时为 true：成员名单用详情里的预览代替，管理操作先隐藏 */
const notReady = ref(false)

async function load() {
  const g = await fetchGroupDetail(groupId)
  group.value = g
  name.value = g.name
  try {
    members.value = await fetchGroupMembers(groupId)
    notReady.value = false
  } catch {
    notReady.value = true
    members.value = g.members.map((member) => ({ member, role: member.id === g.owner.id ? 'OWNER' : 'MEMBER', joinedAt: '' }))
  }
  templates.value = await fetchGroupTemplates(groupId).catch(() => [])
}

onLoad((query) => {
  groupId = Number(query?.id)
})

// 从新建固定局返回时刷新列表
onShow(() => {
  if (groupId) load()
})

function templateDesc(t: GameTemplateBrief) {
  const hours = t.durationMinutes / 60
  return `每${WEEKDAYS[t.weekday]} ${t.startTime} · ${hours} 小时 · ${t.capacity} 人 · ${t.venue}`
}

async function saveName() {
  savingName.value = true
  try {
    group.value = { ...group.value!, ...(await updateGroup(groupId, { name: name.value.trim() })) }
    toast.success('已保存')
  } finally {
    savingName.value = false
  }
}

async function onResetCode() {
  try {
    await message.confirm({ title: '重新生成邀请码？', msg: '旧的邀请码会马上失效，之前发出去的邀请都不能用了', confirmButtonText: '重新生成', cancelButtonText: '取消' })
  } catch {
    return
  }
  const { inviteCode } = await resetInviteCode(groupId)
  group.value = { ...group.value!, inviteCode }
  toast.success('已重新生成')
}

async function onToggleTemplate(t: GameTemplateBrief, event: { value: boolean }) {
  const updated = await setTemplateActive(t.id, event.value)
  templates.value = templates.value.map((item) => (item.id === t.id ? updated : item))
  toast.info(updated.active ? '已恢复，每周会自动开局' : '已暂停，不再自动开局')
}

function createTemplate() {
  uni.navigateTo({ url: `/pages/game/create?groupId=${groupId}` })
}

// ---------- 成员操作 ----------

/** 群主可以操作除自己外的所有人；管理员只能操作普通成员 */
function canManage(m: GroupMember) {
  if (notReady.value || m.member.id === myId.value || m.role === 'OWNER') return false
  return isOwner.value || m.role === 'MEMBER'
}

const showActions = ref(false)
const current = ref<GroupMember>()
const actions = computed(() => {
  const m = current.value
  if (!m) return []
  const list: { name: string; key: string; color?: string }[] = []
  if (isOwner.value) list.push(m.role === 'ADMIN' ? { name: '取消管理员', key: 'unset-admin' } : { name: '设为管理员', key: 'set-admin' })
  list.push({ name: '移出群组', key: 'remove', color: '#C62F3C' })
  return list
})

function openActions(m: GroupMember) {
  current.value = m
  showActions.value = true
}

async function onAction({ item }: { item: { key: string } }) {
  const m = current.value!
  if (item.key === 'set-admin' || item.key === 'unset-admin') {
    members.value = await setMemberRole(groupId, m.member.id, item.key === 'set-admin' ? 'ADMIN' : 'MEMBER')
    toast.success(item.key === 'set-admin' ? `已把「${m.member.nickname}」设为管理员` : '已取消管理员')
    return
  }
  try {
    await message.confirm({ title: `把「${m.member.nickname}」移出群组？`, msg: '移出后对方看不到这个群的球局，需要重新用邀请码加入', confirmButtonText: '移出', cancelButtonText: '取消' })
  } catch {
    return
  }
  members.value = [...(await removeGroupMember(groupId, m.member.id))]
  toast.success('已移出')
}
</script>
