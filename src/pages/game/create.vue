<template>
  <view class="min-h-screen bg-canvas pt-1 pb-28">
    <wd-cell-group title="基本信息" insert>
      <wd-cell title="所属群组" :value="groupName" />
      <wd-input v-model="form.name" label="名称" placeholder="例如：周六晚羽毛球" :maxlength="20" clearable />
      <view class="flex flex-col gap-2.5 px-4 py-3">
        <text class="text-sm text-ink">运动类型</text>
        <view class="flex flex-wrap gap-1.5">
          <view
            v-for="s in SPORT_OPTIONS"
            :key="s.value"
            class="h-9 rounded-full border border-solid px-3.5 text-sm leading-[34px]"
            :class="form.sport === s.value ? 'border-primary bg-primary-soft font-semibold text-primary-ink' : 'border-line bg-white text-ink'"
            @click="form.sport = s.value"
          >
            {{ s.label }}
          </view>
        </view>
      </view>
      <wd-input v-model="form.venue" label="地点" placeholder="球馆名称和场地号" :maxlength="30" clearable />
    </wd-cell-group>

    <wd-cell-group title="时间" insert>
      <wd-picker v-model="form.weekday" label="重复" :columns="WEEKDAY_OPTIONS" align-right />
      <wd-datetime-picker v-model="form.startTime" type="time" label="开始时间" align-right />
      <wd-picker v-model="form.durationMinutes" label="时长" :columns="DURATION_OPTIONS" align-right />
    </wd-cell-group>

    <wd-cell-group title="报名规则" insert>
      <wd-cell title="人数上限" center>
        <wd-input-number v-model="form.capacity" :min="2" :max="100" />
      </wd-cell>
      <wd-picker v-model="openRule" label="开放报名" :columns="OPEN_COLUMNS" align-right />
      <wd-picker v-model="form.deadlineHoursBefore" label="截止报名" :columns="DEADLINE_OPTIONS" align-right />
      <wd-cell title="允许候补" label="满员后还能排队" center>
        <wd-switch v-model="form.allowWaitlist" size="24px" />
      </wd-cell>
      <wd-cell v-if="form.allowWaitlist" title="自动递补" label="有人取消时，按候补顺序自动补上并通知" center>
        <wd-switch v-model="form.autoPromote" size="24px" />
      </wd-cell>
    </wd-cell-group>

    <wd-cell-group title="费用" insert>
      <view class="flex flex-col gap-2.5 px-4 py-3">
        <text class="text-sm text-ink">收费方式</text>
        <wd-segmented v-model:value="feeModeLabel" :options="FEE_LABELS" />
        <text class="text-xs leading-[18px] text-muted">{{ feeHint }}</text>
      </view>
      <wd-input v-if="form.feeMode === 'FIXED'" v-model="fixedFeeYuan" type="digit" label="每人金额" placeholder="单位：元" />
    </wd-cell-group>

    <view class="fixed right-0 bottom-0 left-0 border-t border-line bg-white px-4 pt-3 pb-[calc(12px_+_env(safe-area-inset-bottom))]">
      <wd-button block size="large" :loading="submitting" @click="submit">创建并开启第一场</wd-button>
    </view>

    <wd-toast />
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import dayjs from 'dayjs'
import { computed, reactive, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { fetchMyGroups } from '@/api/group'
import { createGameTemplate } from '@/api/template'
import { SPORT_OPTIONS } from '@/constants'
import type { FeeMode, GameTemplateForm } from '@/types'

const WEEKDAY_OPTIONS = ['一', '二', '三', '四', '五', '六', '日'].map((d, i) => ({ label: `每周${d}`, value: i + 1 }))
const DURATION_OPTIONS = [60, 90, 120, 150, 180].map((m) => ({ label: `${m / 60} 小时`, value: m }))
const DEADLINE_OPTIONS = [1, 2, 3, 6, 12, 24].map((h) => ({ label: `开局前 ${h} 小时`, value: h }))
const OPEN_COLUMNS = [
  [1, 2, 3, 4, 5, 6, 7].map((d) => ({ label: `提前 ${d} 天`, value: String(d) })),
  ['08:00', '12:00', '18:00', '20:00', '21:00'].map((t) => ({ label: t, value: t })),
]
const FEE_LABELS = ['AA 分摊', '固定每人']
const FEE_MODES: FeeMode[] = ['AA', 'FIXED']

const toast = useToast()
const submitting = ref(false)
const groupName = ref('')

const form = reactive<GameTemplateForm>({
  groupId: 0,
  name: '',
  sport: 'BADMINTON',
  venue: '',
  weekday: 6,
  startTime: '19:00',
  durationMinutes: 120,
  capacity: 12,
  openDaysBefore: 3,
  openTime: '20:00',
  deadlineHoursBefore: 6,
  allowWaitlist: true,
  autoPromote: true,
  feeMode: 'AA',
})

/** 金额输入框按「元」填，提交时转成「分」 */
const fixedFeeYuan = ref('')

/** 开放报名是两列选择：提前几天 + 几点 */
const openRule = computed<string[]>({
  get: () => [String(form.openDaysBefore), form.openTime],
  set: ([days, time]) => {
    form.openDaysBefore = Number(days)
    form.openTime = String(time)
  },
})

const feeModeLabel = computed({
  get: () => FEE_LABELS[FEE_MODES.indexOf(form.feeMode)],
  set: (label: string) => {
    form.feeMode = FEE_MODES[FEE_LABELS.indexOf(label)]
  },
})

const feeHint = computed(() =>
  form.feeMode === 'AA'
    ? '活动结束后录入总费用，按实际到场人数自动分摊。这里只记账，不经手钱，大家还是用微信转账。'
    : '每人固定金额，报名时就能看到要付多少。这里只记账，不经手钱。',
)

onLoad(async (query) => {
  const groups = await fetchMyGroups()
  // 只有群主和管理员能建固定局；没指定群组时默认第一个我管理的群
  const managed = groups.filter((g) => g.myRole !== 'MEMBER')
  const group = managed.find((g) => g.id === Number(query?.groupId)) ?? managed[0]
  if (!group) {
    toast.error('你还没有管理的群组')
    return
  }
  form.groupId = group.id
  groupName.value = group.name
})

/** 返回错误提示；没问题返回空字符串 */
function validate() {
  if (!form.groupId) return '请先选择群组'
  if (!form.name.trim()) return '请填写名称'
  if (!form.venue.trim()) return '请填写地点'
  if (form.feeMode === 'FIXED' && !(Number(fixedFeeYuan.value) > 0)) return '请填写每人金额'
  // 用一个示例日期检查：开放报名必须早于截止报名
  const start = dayjs(`2026-01-10 ${form.startTime}`)
  const [oh, om] = form.openTime.split(':').map(Number)
  const openAt = start.subtract(form.openDaysBefore, 'day').hour(oh).minute(om)
  const deadlineAt = start.subtract(form.deadlineHoursBefore, 'hour')
  if (!openAt.isBefore(deadlineAt)) return '开放报名的时间要早于截止时间'
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
    const { firstGameId } = await createGameTemplate({
      ...form,
      name: form.name.trim(),
      venue: form.venue.trim(),
      fixedFee: form.feeMode === 'FIXED' ? Math.round(Number(fixedFeeYuan.value) * 100) : undefined,
    })
    toast.success('创建成功')
    setTimeout(() => uni.redirectTo({ url: `/pages/game/detail?id=${firstGameId}` }), 800)
  } finally {
    submitting.value = false
  }
}
</script>
