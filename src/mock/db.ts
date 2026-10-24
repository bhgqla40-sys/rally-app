/**
 * 前端的「假数据库」：后端接口完成前，api 层都从这里读写数据。
 * 时间都是相对「现在」生成的，所以任何时候打开页面，看到的都是近期的球局。
 * 数据只存在内存里，刷新浏览器就恢复原样。
 */
import dayjs from 'dayjs'
import { SPORT_TEXT } from '@/constants'
import type { Bill, GameBrief, GameDetail, GameStatus, Group, Member, MyProfile, SignupRecord, SportType } from '@/types'
import { weekdayText } from '@/utils/format'

/**
 * mock 数据里的「我」。
 * 联调过渡期：跟着真实登录的用户走（id、昵称），这样还没接后端的页面里，「我」和登录的是同一个人。
 * 所有接口都接上后端后，整个 mock 目录可以删掉。
 */
export const ME: Member = {
  id: Number(uni.getStorageSync('userId')) || 1,
  nickname: uni.getStorageSync('nickname') || '小周',
}

/** 登录成功后调用：把 mock 里的「我」换成真实用户 */
export function syncMockUser(id: number, nickname: string) {
  ME.id = id
  ME.nickname = nickname
}

const NAMES = ['阿杰', '李娜', '王强', '刘洋', '陈晨', '杨帆', '赵磊', '周婷', '孙悦', '马超', '黄磊', '林夕', '何雨', '罗佳', '高远', '许诺', '唐果', '宋雨', '韩冬', '冯雪']
export const PEOPLE: Member[] = NAMES.map((nickname, i) => ({ id: 1001 + i, nickname }))
const person = (name: string) => PEOPLE.find((p) => p.nickname === name)!
const people = (from: number, count: number) => PEOPLE.slice(from, from + count)

const RULES = ['开局前 6 小时停止报名和取消', '截止后临时请假，会记一次「鸽子」']

/** 根据开放、截止、结束时间，算出场次现在处于什么状态 */
export function computeStatus(g: Pick<GameDetail, 'openAt' | 'deadlineAt' | 'endAt' | 'status'>): GameStatus {
  if (g.status === 'CANCELLED') return 'CANCELLED'
  const now = dayjs()
  if (now.isBefore(g.openAt)) return 'UPCOMING'
  if (now.isBefore(g.deadlineAt)) return 'OPEN'
  if (now.isBefore(g.endAt)) return 'CLOSED'
  return 'FINISHED'
}

/** 场次标题，例如「周六晚羽毛球」 */
function gameTitle(start: dayjs.Dayjs, sport: SportType) {
  const h = start.hour()
  const period = h < 12 ? '上午' : h < 18 ? '下午' : '晚'
  return `${weekdayText(start)}${period}${SPORT_TEXT[sport]}`
}

interface GameSeed {
  id: number
  groupId: number
  sport: SportType
  /** 相对今天的天数，-1 是昨天，1 是明天 */
  dayOffset: number
  start: string
  durationMinutes: number
  venue: string
  capacity: number
  organizer: Member
  joined: Member[]
  waitlist?: Member[]
  feePerPerson: number
  /** 提前几天开放报名，默认 3 天 */
  openDaysBefore?: number
}

function makeGame(seed: GameSeed): GameDetail {
  const [h, m] = seed.start.split(':').map(Number)
  const start = dayjs().startOf('day').add(seed.dayOffset, 'day').hour(h).minute(m)
  const group = groups.find((g) => g.id === seed.groupId)!
  const game: GameDetail = {
    id: seed.id,
    title: gameTitle(start, seed.sport),
    groupId: group.id,
    groupName: group.name,
    sport: seed.sport,
    venue: seed.venue,
    startAt: start.format(),
    endAt: start.add(seed.durationMinutes, 'minute').format(),
    openAt: start.subtract(seed.openDaysBefore ?? 3, 'day').hour(20).minute(0).format(),
    deadlineAt: start.subtract(6, 'hour').format(),
    capacity: seed.capacity,
    joinedCount: 0,
    waitlistCount: 0,
    status: 'OPEN',
    mySignup: 'NONE',
    organizer: seed.organizer,
    feeMode: 'AA',
    feePerPerson: seed.feePerPerson,
    allowWaitlist: true,
    autoPromote: true,
    joined: [...seed.joined],
    waitlist: [...(seed.waitlist ?? [])],
    rules: RULES,
  }
  group.scheduleText = `每${weekdayText(start)}`
  return game
}

const groups: Group[] = [
  { id: 1, name: '星火羽毛球群', sport: 'BADMINTON', memberCount: 32, myRole: 'MEMBER', scheduleText: '', inviteCode: 'XH2026' },
  { id: 2, name: '下班踢球小分队', sport: 'FOOTBALL', memberCount: 20, myRole: 'OWNER', scheduleText: '', inviteCode: 'TQ8848' },
  { id: 3, name: '周末篮球局', sport: 'BASKETBALL', memberCount: 18, myRole: 'MEMBER', scheduleText: '', inviteCode: 'LQ0603' },
  { id: 4, name: '飞盘新手群', sport: 'FRISBEE', memberCount: 45, myRole: 'MEMBER', scheduleText: '', inviteCode: 'FP1314' },
]

/** 我还没加入的群：用来演示「输入邀请码加入群组」，邀请码 RUN888 */
const otherGroups: Group[] = [
  { id: 9, name: '周二夜跑团', sport: 'OTHER', memberCount: 26, myRole: 'MEMBER', scheduleText: '每周二', inviteCode: 'RUN888' },
]

const games: GameDetail[] = [
  // 已结束：我是普通成员，账单还没付（用来演示「待付款」）
  makeGame({ id: 99, groupId: 1, sport: 'BADMINTON', dayOffset: -6, start: '19:00', durationMinutes: 120, venue: '市体育中心 3 号馆', capacity: 12, organizer: person('阿杰'), joined: [...people(0, 9), ME], feePerPerson: 3900 }),
  // 已结束：我是组织者（用来演示费用结算）
  makeGame({ id: 100, groupId: 2, sport: 'FOOTBALL', dayOffset: -2, start: '20:00', durationMinutes: 120, venue: '星光五人制球场 B 场', capacity: 14, organizer: ME, joined: [ME, ...people(0, 11)], feePerPerson: 3500 }),
  // 已报名
  makeGame({ id: 101, groupId: 1, sport: 'BADMINTON', dayOffset: 1, start: '19:00', durationMinutes: 120, venue: '市体育中心 3 号馆', capacity: 12, organizer: person('阿杰'), joined: [...people(0, 8), ME], feePerPerson: 3500 }),
  // 可报名
  makeGame({ id: 102, groupId: 2, sport: 'FOOTBALL', dayOffset: 2, start: '20:00', durationMinutes: 120, venue: '星光五人制球场 B 场', capacity: 14, organizer: ME, joined: people(8, 6), feePerPerson: 3000 }),
  // 满员，我在候补
  makeGame({ id: 103, groupId: 3, sport: 'BASKETBALL', dayOffset: 3, start: '09:00', durationMinutes: 120, venue: '城东篮球公园 2 号场', capacity: 10, organizer: person('马超'), joined: people(3, 10), waitlist: [ME, person('罗佳')], feePerPerson: 2500, openDaysBefore: 5 }),
  // 还没开放报名
  makeGame({ id: 104, groupId: 4, sport: 'FRISBEE', dayOffset: 6, start: '19:30', durationMinutes: 90, venue: '滨江公园草坪', capacity: 16, organizer: person('林夕'), joined: [], feePerPerson: 2000 }),
]

const bills: Bill[] = (() => {
  const game = games.find((g) => g.id === 100)!
  const perPerson = 3500
  const badminton = games.find((g) => g.id === 99)!
  return [
    {
      id: 202,
      gameId: badminton.id,
      gameTitle: badminton.title,
      gameStartAt: badminton.startAt,
      groupName: badminton.groupName,
      items: [
        { id: 1, name: '场地费（3 片场 × 2 小时）', amount: 30000 },
        { id: 2, name: '用球（1 桶）', amount: 9000 },
      ],
      members: badminton.joined.map((m, i) => ({
        member: m,
        amount: 3900,
        isOrganizer: m.id === badminton.organizer.id,
        // 组织者和前 6 个人付了，我没付
        paid: m.id !== ME.id && i < 7,
        paidAt: m.id !== ME.id && i < 7 ? dayjs(badminton.endAt).add(i * 9, 'minute').format() : undefined,
      })),
    },
    {
      id: 201,
      gameId: game.id,
      gameTitle: game.title,
      gameStartAt: game.startAt,
      groupName: game.groupName,
      items: [
        { id: 1, name: '场地费（2 小时）', amount: 36000 },
        { id: 2, name: '饮用水', amount: 6000 },
      ],
      members: game.joined.map((m, i) => ({
        member: m,
        amount: perPerson,
        isOrganizer: m.id === ME.id,
        paid: m.id === ME.id || i > 4,
        paidAt: i > 4 ? dayjs(game.endAt).add(i * 7, 'minute').format() : undefined,
      })),
    },
  ]
})()

/** 更早的报名记录（这些场次的详情不在 mock 里，只展示在「我的报名记录」） */
const historyRecords: SignupRecord[] = [
  { offset: -9, start: '20:00', title: '下班踢球小分队', sport: 'FOOTBALL' as SportType, venue: '星光五人制球场 B 场', status: 'ATTENDED' as const },
  { offset: -13, start: '19:00', title: '星火羽毛球群', sport: 'BADMINTON' as SportType, venue: '市体育中心 3 号馆', status: 'NO_SHOW' as const },
  { offset: -16, start: '20:00', title: '下班踢球小分队', sport: 'FOOTBALL' as SportType, venue: '星光五人制球场 B 场', status: 'CANCELLED' as const },
  { offset: -20, start: '19:00', title: '星火羽毛球群', sport: 'BADMINTON' as SportType, venue: '市体育中心 3 号馆', status: 'ATTENDED' as const },
].map((r, i) => {
  const [h, m] = r.start.split(':').map(Number)
  const start = dayjs().startOf('day').add(r.offset, 'day').hour(h).minute(m)
  return {
    gameId: 90 - i,
    title: gameTitle(start, r.sport),
    groupName: r.title,
    venue: r.venue,
    startAt: start.format(),
    endAt: start.add(120, 'minute').format(),
    status: r.status,
  }
})

const profile: MyProfile = {
  ...ME,
  groupCount: groups.length,
  monthAttendance: 6,
  totalAttendance: 38,
  noShowCount: 1,
  pendingBillCount: 1,
}

export const db = { games, groups, otherGroups, bills, profile, historyRecords }

/** 把数据库里的场次转成列表用的结构，人数、状态、我的报名情况都现算 */
export function toBrief(g: GameDetail): GameBrief {
  const waitIndex = g.waitlist.findIndex((m) => m.id === ME.id)
  const joined = g.joined.some((m) => m.id === ME.id)
  return {
    id: g.id,
    title: g.title,
    groupId: g.groupId,
    groupName: g.groupName,
    sport: g.sport,
    venue: g.venue,
    startAt: g.startAt,
    endAt: g.endAt,
    openAt: g.openAt,
    deadlineAt: g.deadlineAt,
    capacity: g.capacity,
    joinedCount: g.joined.length,
    waitlistCount: g.waitlist.length,
    status: computeStatus(g),
    mySignup: joined ? 'JOINED' : waitIndex >= 0 ? 'WAITLIST' : 'NONE',
    myWaitlistRank: waitIndex >= 0 ? waitIndex + 1 : undefined,
  }
}

export function toDetail(g: GameDetail): GameDetail {
  return { ...g, ...toBrief(g) }
}
