<template>
  <view class="min-h-screen bg-canvas">
    <view v-if="notFound" class="flex flex-col items-center gap-3 py-24">
      <wd-icon name="money-circle" size="48px" color="#B8BCC6" />
      <text class="text-sm text-muted">{{ notReady ? '费用结算功能后端还在开发中，过几天再来' : '找不到这场的账单' }}</text>
    </view>

    <view v-else-if="!bill" class="flex justify-center py-24">
      <wd-loading />
    </view>

    <view v-else class="flex flex-col gap-3 px-4 pt-3 pb-28">
      <!-- 汇总 -->
      <view class="flex flex-col gap-4 rounded-2xl bg-white p-4">
        <view class="flex flex-col gap-1">
          <text class="text-base font-semibold text-ink">{{ bill.gameTitle }}</text>
          <text class="text-[13px] text-muted">{{ dateText }} · {{ bill.groupName }}</text>
        </view>
        <view class="grid grid-cols-3 gap-2">
          <view class="flex flex-col gap-1">
            <text class="text-xs text-muted">总费用</text>
            <text class="text-[22px] font-bold text-ink">{{ formatMoney(total) }}</text>
          </view>
          <view class="flex flex-col gap-1">
            <text class="text-xs text-muted">到场人数</text>
            <text class="text-[22px] font-bold text-ink">{{ bill.members.length }}<text class="text-sm font-medium"> 人</text></text>
          </view>
          <view class="flex flex-col gap-1">
            <text class="text-xs text-muted">每人应付</text>
            <text class="text-[22px] font-bold text-primary">{{ perPersonText }}</text>
          </view>
        </view>

        <!-- 费用项 -->
        <view class="flex flex-col border-t border-line-soft pt-2">
          <view v-for="item in bill.items" :key="item.id" class="flex h-10 items-center justify-between gap-2 text-sm">
            <text class="flex-1 text-ink-2">{{ item.name }}</text>
            <text class="text-ink">{{ formatMoney(item.amount) }}</text>
            <view v-if="isOrganizer" class="flex h-10 w-8 items-center justify-end" @click="onRemoveItem(item.id)">
              <wd-icon name="close-circle" size="18px" color="#B8BCC6" />
            </view>
          </view>
          <text v-if="bill.items.length === 0" class="py-2 text-sm text-muted">还没有费用项，先添加场地费吧</text>
          <view v-if="isOrganizer" class="flex h-11 items-center gap-1.5 self-start text-sm font-medium text-primary" @click="showAdd = true">
            <wd-icon name="add" size="16px" color="#2F6BE6" />
            <text>添加费用项</text>
          </view>
        </view>
      </view>

      <!-- 收款进度 -->
      <view class="flex flex-col gap-2 rounded-2xl bg-white p-4">
        <view class="flex justify-between text-sm">
          <text class="font-semibold text-ink">已收款 {{ paidCount }} / {{ bill.members.length }} 人</text>
          <text class="text-muted">{{ formatMoney(paidAmount) }} / {{ formatMoney(total) }}</text>
        </view>
        <view class="h-1.5 rounded-full bg-line">
          <view class="h-1.5 rounded-full bg-success" :style="{ width: `${paidPercent}%` }" />
        </view>
      </view>

      <!-- 成员 -->
      <view class="flex flex-col rounded-2xl bg-white px-4 py-1">
        <view class="flex h-11 items-center justify-between">
          <text class="text-base font-semibold text-ink">到场成员</text>
          <text class="text-sm" :class="onlyUnpaid ? 'font-semibold text-primary' : 'text-primary'" @click="onlyUnpaid = !onlyUnpaid">
            {{ onlyUnpaid ? '查看全部' : `只看未付（${unpaid.length}）` }}
          </text>
        </view>
        <view v-for="m in visibleMembers" :key="m.member.id" class="flex h-[60px] items-center gap-3 border-t border-line-soft">
          <user-avatar :member="m.member" size="sm" :self="m.member.id === myId" />
          <view class="flex min-w-0 flex-1 flex-col gap-0.5">
            <text class="text-[15px] text-ink">{{ m.member.id === myId ? `${m.member.nickname}（我）` : m.member.nickname }}</text>
            <text v-if="m.isOrganizer" class="text-xs text-muted">组织者 · 已垫付全部费用</text>
            <text v-else-if="m.paid" class="text-xs text-muted">{{ m.paidAt ? `${formatDateTime(m.paidAt)} ` : '' }}已付 {{ formatMoney(m.amount) }}</text>
            <text v-else-if="m.claimedAt" class="text-xs text-primary-ink">{{ formatDateTime(m.claimedAt) }} 说已转账，待确认</text>
            <text v-else class="text-xs text-warning-ink">未付 {{ formatMoney(m.amount) }}</text>
          </view>
          <text v-if="m.isOrganizer" class="rounded-full bg-line-soft px-2.5 text-xs leading-6 text-ink-2">无需转账</text>
          <view v-else-if="m.paid" class="flex items-center gap-1 rounded-full bg-success-soft px-2.5 text-xs leading-6 font-medium text-success-ink" @click="onTogglePaid(m.member.id, false)">
            <wd-icon name="check" size="12px" color="#157A52" />
            <text>已付</text>
          </view>
          <wd-button v-else-if="isOrganizer" size="small" plain @click="onTogglePaid(m.member.id, true)">标记已付</wd-button>
        </view>
        <text v-if="visibleMembers.length === 0" class="border-t border-line-soft py-6 text-center text-sm text-muted">都付清了</text>
      </view>
    </view>

    <!-- 底部操作 -->
    <view v-if="bill" class="fixed right-0 bottom-0 left-0 flex gap-3 border-t border-line bg-white px-4 pt-3 pb-[calc(12px_+_env(safe-area-inset-bottom))]">
      <view class="flex-1"><wd-button block plain icon="copy" @click="copyBill">复制账单</wd-button></view>
      <view v-if="isOrganizer && unpaid.length > 0" class="flex-[1.4]">
        <wd-button block @click="copyReminder">提醒未付款的 {{ unpaid.length }} 人</wd-button>
      </view>
    </view>

    <!-- 添加费用项 -->
    <wd-popup v-model="showAdd" position="bottom" safe-area-inset-bottom custom-style="border-radius: 16px 16px 0 0;">
      <view class="flex flex-col gap-3 p-4">
        <text class="text-center text-base font-semibold text-ink">添加费用项</text>
        <wd-input v-model="newItem.name" label="名称" placeholder="例如：场地费、用球" :maxlength="20" />
        <wd-input v-model="newItem.yuan" type="digit" label="金额" placeholder="单位：元" />
        <wd-button block :loading="submitting" @click="onAddItem">添加</wd-button>
      </view>
    </wd-popup>

    <wd-toast />
    <wd-message-box />
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { computed, reactive, ref } from 'vue'
import { useMessage, useToast } from 'wot-design-uni'
import { BILL_NOT_READY, addBillItem, fetchBillByGame, removeBillItem, setPaid } from '@/api/bill'
import { useUserStore } from '@/stores/user'
import type { Bill } from '@/types'
import { formatDateTime, formatMoney, weekdayText } from '@/utils/format'
import { ApiError } from '@/utils/request'
import dayjs from 'dayjs'

const toast = useToast()
const message = useMessage()
const userStore = useUserStore()

const bill = ref<Bill>()
const onlyUnpaid = ref(false)
const showAdd = ref(false)
const submitting = ref(false)
const newItem = reactive({ name: '', yuan: '' })

const myId = computed(() => userStore.userId)
const isOrganizer = computed(() => !!bill.value?.members.some((m) => m.isOrganizer && m.member.id === myId.value))
const total = computed(() => bill.value?.items.reduce((sum, i) => sum + i.amount, 0) ?? 0)
const dateText = computed(() => (bill.value ? `${dayjs(bill.value.gameStartAt).format('M月D日')} ${weekdayText(bill.value.gameStartAt)}` : ''))
const perPersonText = computed(() => {
  const amounts = bill.value?.members.map((m) => m.amount) ?? []
  if (amounts.length === 0) return '¥0'
  const max = Math.max(...amounts)
  const min = Math.min(...amounts)
  // 除不尽时有人多 1 分，显示成「¥33.34 起」会很奇怪，直接显示最高的那个
  return min === max ? formatMoney(max) : `≈${formatMoney(max)}`
})
const unpaid = computed(() => bill.value?.members.filter((m) => !m.paid) ?? [])
const paidCount = computed(() => (bill.value?.members.length ?? 0) - unpaid.value.length)
const paidAmount = computed(() => bill.value?.members.filter((m) => m.paid).reduce((sum, m) => sum + m.amount, 0) ?? 0)
const paidPercent = computed(() => (total.value > 0 ? Math.round((paidAmount.value / total.value) * 100) : 0))
const visibleMembers = computed(() => (onlyUnpaid.value ? unpaid.value : bill.value?.members ?? []))

const notFound = ref(false)
/** 真实场次的账单接口后端还没做 */
const notReady = ref(false)

onLoad(async (query) => {
  try {
    bill.value = await fetchBillByGame(Number(query?.gameId))
  } catch (e) {
    notFound.value = true
    notReady.value = e instanceof ApiError && e.code === BILL_NOT_READY
  }
})

/** 已经有人付过钱时，改费用会让每人应付金额变化，先确认一下 */
async function confirmChangeAfterPaid() {
  const someonePaid = bill.value?.members.some((m) => m.paid && !m.isOrganizer)
  if (!someonePaid) return true
  try {
    await message.confirm({
      title: '已经有人付款了',
      msg: '修改费用后每人应付金额会变化，已付的人需要补差价或退差价',
      confirmButtonText: '继续修改',
      cancelButtonText: '取消',
    })
    return true
  } catch {
    return false
  }
}

async function onAddItem() {
  const name = newItem.name.trim()
  const amount = Math.round(Number(newItem.yuan) * 100)
  if (!name) return toast.warning('请填写名称')
  if (!(amount > 0)) return toast.warning('请填写正确的金额')
  if (!(await confirmChangeAfterPaid())) return
  submitting.value = true
  try {
    bill.value = await addBillItem(bill.value!.id, { name, amount })
    showAdd.value = false
    newItem.name = ''
    newItem.yuan = ''
  } finally {
    submitting.value = false
  }
}

async function onRemoveItem(itemId: number) {
  if (!(await confirmChangeAfterPaid())) return
  bill.value = await removeBillItem(bill.value!.id, itemId)
}

async function onTogglePaid(memberId: number, paid: boolean) {
  if (!isOrganizer.value) return
  if (!paid) {
    try {
      await message.confirm({ title: '改为未付？', msg: '如果是点错了，可以改回来', confirmButtonText: '改为未付', cancelButtonText: '取消' })
    } catch {
      return
    }
  }
  bill.value = await setPaid(bill.value!.id, memberId, paid)
}

function copy(text: string, tip: string) {
  uni.setClipboardData({ data: text, success: () => toast.success(tip) })
}

function copyBill() {
  const b = bill.value!
  const items = b.items.map((i) => `${i.name} ${formatMoney(i.amount)}`).join('，')
  const names = (list: typeof b.members) => list.map((m) => m.member.nickname).join('、') || '无'
  const text = [
    `【${b.gameTitle} 费用结算】`,
    `总费用 ${formatMoney(total.value)}${items ? `（${items}）` : ''}`,
    `到场 ${b.members.length} 人，每人 ${perPersonText.value}`,
    `已付：${names(b.members.filter((m) => m.paid))}`,
    `未付：${names(unpaid.value)}`,
  ].join('\n')
  copy(text, '账单已复制')
}

function copyReminder() {
  const at = unpaid.value.map((m) => `@${m.member.nickname}`).join(' ')
  copy(`${at} ${bill.value!.gameTitle}的费用每人 ${perPersonText.value}，记得转给我哦，谢谢～`, '已复制，发到群里吧')
}
</script>
