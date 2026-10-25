<template>
  <view class="auth-page">
    <view class="auth-layout">
      <view class="auth-intro">
        <view class="brand">
          <view class="brand-mark" aria-hidden="true"><text>R</text></view>
          <view class="brand-name">
            <text class="brand-wordmark">Rally</text>
            <text class="brand-caption">组局助手</text>
          </view>
        </view>

        <view class="intro-copy">
          <text class="intro-title">好球局，<text class="intro-title-accent">一起上场。</text></text>
          <text class="intro-description">固定球局的报名、候补、AA 记账，\n一个链接搞定。</text>
        </view>

        <view class="court-art" aria-hidden="true">
          <view class="court-lines">
            <view class="court-inner" />
            <view class="court-midline" />
            <view class="court-circle" />
          </view>
          <view class="court-ball"><view class="ball-line" /></view>
          <view class="court-caption"><view class="status-dot" /><text>热爱有搭子，上场更简单</text></view>
        </view>

        <view class="intro-features">
          <text>轻松组局</text><view class="feature-dot" /><text>自动候补</text><view class="feature-dot" /><text>清晰 AA</text>
        </view>
      </view>

      <view class="auth-panel">
        <view class="mode-switch" aria-label="登录或注册">
          <view class="mode-indicator" :class="{ 'mode-indicator--register': mode === 'register' }" />
          <button
            v-for="item in MODES"
            :key="item"
            class="mode-button"
            role="button"
            :tabindex="submitting || isFlipping ? -1 : 0"
            :class="{ 'mode-button--active': mode === item }"
            :aria-pressed="mode === item"
            :disabled="submitting || isFlipping"
            hover-class="none"
            @click="switchMode(item)"
            @keydown.enter.prevent="switchMode(item)"
            @keydown.space.prevent="switchMode(item)"
          >{{ item === 'login' ? '登录' : '注册' }}</button>
        </view>

        <view class="card-scene">
          <view
            id="auth-card-rotator"
            class="card-rotator"
            :class="{ 'card-rotator--flipped': mode === 'register', 'card-rotator--flipping': isFlipping }"
            :style="{ '--auth-flip-duration': `${FLIP_DURATION}ms` }"
            @transitionend="handleFlipEnd"
          >
            <!-- 两面使用独立且常驻的输入节点，切换时只旋转卡片。 -->
            <view
              class="auth-card auth-card--login"
              :class="{ 'auth-card--active': mode === 'login' }"
              :aria-hidden="mode !== 'login'"
              :inert="mode !== 'login' || isFlipping ? true : undefined"
            >
              <view class="card-heading">
                <view class="card-eyebrow">
                  <view class="card-label"><view class="status-dot" /><text>球搭子，欢迎回来</text></view>
                  <text class="card-number">01 / RALLY</text>
                </view>
                <text class="card-title">下一场，等你上场</text>
                <text class="card-description">登录账号，接着奔赴你的热爱。</text>
              </view>

              <view class="auth-fields">
                <view class="auth-field">
                  <text class="field-label">手机号</text>
                  <view class="field-control">
                    <wd-input
                      key="login-phone-input"
                      v-model="form.phone"
                      type="number"
                      inputmode="tel"
                      :maxlength="11"
                      placeholder="请输入 11 位手机号"
                      :disabled="submitting"
                      custom-input-class="auth-native-input"
                      :placeholder-style="isFlipping ? 'color: transparent;' : ''"
                      prefix-icon="mobile"
                      clearable
                      no-border
                      custom-style="background: transparent; padding: var(--auth-input-padding, 13px 14px);"
                    />
                    <text v-if="isFlipping" class="field-proxy" :class="{ 'field-proxy--filled': form.phone }" aria-hidden="true">{{ form.phone || '请输入 11 位手机号' }}</text>
                  </view>
                </view>
                <view class="auth-field">
                  <view class="field-label-row"><text class="field-label">密码</text><text class="field-hint">至少 6 位</text></view>
                  <view class="field-control">
                    <wd-input
                      key="login-password-input"
                      v-model="form.password"
                      :maxlength="32"
                      placeholder="请输入你的密码"
                      :disabled="submitting"
                      custom-input-class="auth-native-input"
                      :placeholder-style="isFlipping ? 'color: transparent;' : ''"
                      prefix-icon="lock-on"
                      show-password
                      clearable
                      no-border
                      confirm-type="go"
                      custom-style="background: transparent; padding: var(--auth-input-padding, 13px 14px);"
                      @confirm="submit('login')"
                    />
                    <text v-if="isFlipping" class="field-proxy" :class="{ 'field-proxy--filled': form.password }" aria-hidden="true">{{ maskedPassword || '请输入你的密码' }}</text>
                  </view>
                </view>
              </view>

              <view class="card-actions">
                <wd-button
                  block
                  size="large"
                  role="button"
                  :tabindex="mode !== 'login' || submitting || isFlipping ? -1 : 0"
                  :loading="submitting && mode === 'login'"
                  :disabled="mode !== 'login' || submitting || isFlipping"
                  custom-style="height: 48px; border-radius: 14px; box-shadow: 0 8px 18px rgba(47, 107, 230, 0.18);"
                  @click="submit('login')"
                  @keydown.enter.prevent="submit('login')"
                  @keydown.space.prevent="submit('login')"
                >
                  <view class="submit-content"><text>登录，准备上场</text><wd-icon name="arrow-right" size="16px" /></view>
                </wd-button>
                <view class="card-switch-hint">
                  <text>还没有账号？</text>
                  <button
                    class="text-button"
                    role="button"
                    :tabindex="mode !== 'login' || submitting || isFlipping ? -1 : 0"
                    :disabled="submitting || isFlipping || mode !== 'login'"
                    hover-class="none"
                    @click="switchMode('register')"
                    @keydown.enter.prevent="switchMode('register')"
                    @keydown.space.prevent="switchMode('register')"
                  >
                    翻到背面，去注册
                    <wd-icon name="swap" size="14px" />
                  </button>
                </view>
              </view>
            </view>

            <view
              class="auth-card auth-card--register"
              :class="{ 'auth-card--active': mode === 'register' }"
              :aria-hidden="mode !== 'register'"
              :inert="mode !== 'register' || isFlipping ? true : undefined"
            >
              <view class="card-heading">
                <view class="card-eyebrow">
                  <view class="card-label"><view class="status-dot" /><text>新球搭子，即刻就位</text></view>
                  <text class="card-number">02 / RALLY</text>
                </view>
                <text class="card-title">从这里，组个好局</text>
                <text class="card-description">创建账号，和球搭子一起出发。</text>
              </view>

              <view class="auth-fields">
                <view class="auth-field">
                  <text class="field-label">手机号</text>
                  <view class="field-control">
                    <wd-input
                      key="register-phone-input"
                      v-model="form.phone"
                      type="number"
                      inputmode="tel"
                      :maxlength="11"
                      placeholder="请输入 11 位手机号"
                      :disabled="submitting"
                      custom-input-class="auth-native-input"
                      :placeholder-style="isFlipping ? 'color: transparent;' : ''"
                      prefix-icon="mobile"
                      clearable
                      no-border
                      custom-style="background: transparent; padding: var(--auth-input-padding, 13px 14px);"
                    />
                    <text v-if="isFlipping" class="field-proxy" :class="{ 'field-proxy--filled': form.phone }" aria-hidden="true">{{ form.phone || '请输入 11 位手机号' }}</text>
                  </view>
                </view>
                <view class="auth-field">
                  <text class="field-label">昵称</text>
                  <view class="field-control">
                    <wd-input
                      key="register-nickname-input"
                      v-model="form.nickname"
                      :maxlength="12"
                      placeholder="群里大家怎么称呼你"
                      :disabled="submitting"
                      custom-input-class="auth-native-input"
                      :placeholder-style="isFlipping ? 'color: transparent;' : ''"
                      prefix-icon="user"
                      clearable
                      no-border
                      custom-style="background: transparent; padding: var(--auth-input-padding, 13px 14px);"
                    />
                    <text v-if="isFlipping" class="field-proxy" :class="{ 'field-proxy--filled': form.nickname }" aria-hidden="true">{{ form.nickname || '群里大家怎么称呼你' }}</text>
                  </view>
                </view>
                <view class="auth-field">
                  <view class="field-label-row"><text class="field-label">密码</text><text class="field-hint">至少 6 位</text></view>
                  <view class="field-control">
                    <wd-input
                      key="register-password-input"
                      v-model="form.password"
                      :maxlength="32"
                      placeholder="设置你的登录密码"
                      :disabled="submitting"
                      custom-input-class="auth-native-input"
                      :placeholder-style="isFlipping ? 'color: transparent;' : ''"
                      prefix-icon="lock-on"
                      show-password
                      clearable
                      no-border
                      confirm-type="go"
                      custom-style="background: transparent; padding: var(--auth-input-padding, 13px 14px);"
                      @confirm="submit('register')"
                    />
                    <text v-if="isFlipping" class="field-proxy" :class="{ 'field-proxy--filled': form.password }" aria-hidden="true">{{ maskedPassword || '设置你的登录密码' }}</text>
                  </view>
                </view>
              </view>

              <view class="card-actions">
                <wd-button
                  block
                  size="large"
                  role="button"
                  :tabindex="mode !== 'register' || submitting || isFlipping ? -1 : 0"
                  :loading="submitting && mode === 'register'"
                  :disabled="mode !== 'register' || submitting || isFlipping"
                  custom-style="height: 48px; border-radius: 14px; box-shadow: 0 8px 18px rgba(47, 107, 230, 0.18);"
                  @click="submit('register')"
                  @keydown.enter.prevent="submit('register')"
                  @keydown.space.prevent="submit('register')"
                >
                  <view class="submit-content"><text>注册并登录</text><wd-icon name="arrow-right" size="16px" /></view>
                </wd-button>
                <view class="card-switch-hint">
                  <text>已经有账号了？</text>
                  <button
                    class="text-button"
                    role="button"
                    :tabindex="mode !== 'register' || submitting || isFlipping ? -1 : 0"
                    :disabled="submitting || isFlipping || mode !== 'register'"
                    hover-class="none"
                    @click="switchMode('login')"
                    @keydown.enter.prevent="switchMode('login')"
                    @keydown.space.prevent="switchMode('login')"
                  >
                    翻回正面，去登录
                    <wd-icon name="swap" size="14px" />
                  </button>
                </view>
              </view>
            </view>
          </view>
        </view>
        <view class="panel-footer">
          <view class="page-dots" aria-hidden="true"><view :class="{ 'page-dot--active': mode === 'login' }" /><view :class="{ 'page-dot--active': mode === 'register' }" /></view>
          <text>{{ mode === 'login' ? '每一次相聚，都从这里开始' : '注册即表示你同意按群规参与活动' }}</text>
        </view>
      </view>
    </view>
    <wd-toast />
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { computed, getCurrentInstance, nextTick, onUnmounted, reactive, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { login, register } from '@/api/auth'
import { useUserStore } from '@/stores/user'

type Mode = 'login' | 'register'
const MODES: Mode[] = ['login', 'register']

const toast = useToast()
const userStore = useUserStore()
const mode = ref<Mode>('login')
const submitting = ref(false)
const isFlipping = ref(false)
const form = reactive({ phone: '', password: '', nickname: '' })
const maskedPassword = computed(() => '•'.repeat(form.password.length))
const pageInstance = getCurrentInstance()
let redirectTimer: ReturnType<typeof setTimeout> | undefined
let flipTimer: ReturnType<typeof setTimeout> | undefined
let disposed = false
const FLIP_DURATION = 720

/** 登录成功后要回到的页面，没有就去首页 */
let redirect = '/pages/index/index'
onLoad((query) => {
  if (query?.redirect) redirect = decodeURIComponent(query.redirect)
})
onUnmounted(() => {
  disposed = true
  clearTimeout(redirectTimer)
  clearTimeout(flipTimer)
})

async function switchMode(nextMode: Mode) {
  if (submitting.value || isFlipping.value || mode.value === nextMode) return
  isFlipping.value = true
  uni.hideKeyboard()
  // 小程序逻辑层和视图层异步更新，先让静态文字接替原生 input，再开始旋转。
  await waitForView()
  if (disposed) return
  mode.value = nextMode
  uni.setNavigationBarTitle({ title: nextMode === 'login' ? '登录' : '注册' })
  await waitForView()
  if (disposed) return
  // 优先使用视图层的 transitionend；减少动态效果或事件缺失时由计时器兜底。
  flipTimer = setTimeout(finishFlip, FLIP_DURATION + 120)
}

async function waitForView() {
  await nextTick()
  await pageInstance?.proxy?.$nextTick?.()
}

function handleFlipEnd(event: TransitionEvent) {
  // 必须检查事件来源，避免子节点的 visibility 过渡提前结束输入隐藏。
  const target = event.target as { id?: string } | null
  const detail = (event as TransitionEvent & { detail?: { propertyName?: string } }).detail
  const property = event.propertyName || detail?.propertyName
  if (!isFlipping.value || target?.id !== 'auth-card-rotator') return
  if (property && property !== 'transform' && property !== '-webkit-transform') return
  clearTimeout(flipTimer)
  // 留出最后一帧的合成时间，再把原生文字交还给输入框。
  flipTimer = setTimeout(finishFlip, 40)
}

function finishFlip() {
  clearTimeout(flipTimer)
  isFlipping.value = false
}

/** 返回错误提示；没问题返回空字符串 */
function validate() {
  if (!/^1\d{10}$/.test(form.phone)) return '请输入正确的手机号'
  if (mode.value === 'register' && !form.nickname.trim()) return '请填写昵称'
  if (form.password.length < 6) return '密码至少 6 位'
  return ''
}

async function submit(sourceMode: Mode) {
  if (sourceMode !== mode.value || isFlipping.value || submitting.value) return
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
    redirectTimer = setTimeout(() => uni.reLaunch({
      url: redirect,
      fail: () => {
        submitting.value = false
        toast.error('页面跳转失败，请重试')
      },
    }), 600)
  } catch {
    // 请求层已展示错误提示，保留输入内容以便重试。
    submitting.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 44px);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 48px 32px;
  padding-bottom: calc(48px + env(safe-area-inset-bottom));
  background: radial-gradient(ellipse at 80% 24%, #e9f0fd 0, transparent 52%), #f5f6f8;
  color: #1a1a1a;
}

.auth-layout { display: flex; align-items: center; justify-content: space-between; gap: 72px; width: 100%; max-width: 960px; margin: 0 auto; }
.auth-intro { flex: 1; min-width: 0; }
.brand { display: flex; align-items: center; gap: 12px; }
.brand-mark { display: flex; align-items: center; justify-content: center; width: 46px; height: 46px; border-radius: 15px; background: #2f6be6; box-shadow: 0 7px 15px #2f6be624; color: white; }
.brand-mark text { font-size: 31px; font-weight: 800; font-style: italic; transform: translateX(-1px); }
.brand-name { display: flex; align-items: baseline; gap: 10px; }
.brand-wordmark { color: #2f6be6; font-size: 28px; font-weight: 750; letter-spacing: -1px; }
.brand-caption { color: #5c5c5c; font-size: 13px; }
.intro-copy { display: flex; flex-direction: column; gap: 20px; margin-top: 46px; }
.intro-title { font-size: 44px; font-weight: 700; line-height: 1.4; letter-spacing: -1.5px; }
.intro-title-accent { display: block; color: #2f6be6; }
.intro-description { color: #5c5c5c; font-size: 14px; line-height: 1.9; white-space: pre-line; }
.intro-features { display: flex; align-items: center; gap: 12px; color: #5c5c5c; font-size: 12px; margin-top: 28px; }
.feature-dot { width: 3px; height: 3px; border-radius: 50%; background: #b8bcc6; }
.court-art { position: relative; width: 300px; height: 170px; margin-top: 28px; perspective: 600px; }
.court-lines { position: absolute; inset: 12px 8px 22px; border: 1px solid #2f6be630; border-radius: 12px; background: linear-gradient(135deg, #e9f0fd66, #e9f0fd); transform: rotateX(46deg) rotateZ(-12deg); box-shadow: 0 16px 24px #2f6be60a; }
.court-inner { position: absolute; inset: 17px 26px; border: 1px solid #2f6be626; border-radius: 3px; }
.court-midline { position: absolute; top: 0; bottom: 0; left: 50%; border-left: 1px solid #2f6be630; }
.court-circle { position: absolute; top: 50%; left: 50%; width: 52px; height: 52px; border: 1px solid #2f6be630; border-radius: 50%; transform: translate(-50%, -50%); }
.court-ball { position: absolute; top: 12px; right: 46px; width: 36px; height: 36px; border-radius: 50%; background: radial-gradient(circle at 30% 25%, #83a9fb, #2f6be6 65%, #245fd9); box-shadow: 5px 16px 16px #2f6be626; overflow: hidden; animation: ball-arrive 1s ease-out both; }
.ball-line { position: absolute; inset: -5px 8px; border: 1px solid #ffffff66; border-radius: 50%; transform: rotate(-35deg); }
.court-caption { position: absolute; bottom: 0; left: 10px; display: flex; align-items: center; gap: 7px; font-size: 11px; color: #5c5c5c; }
.status-dot { flex-shrink: 0; width: 5px; height: 5px; border-radius: 50%; background: #2f6be6; }
.auth-panel { flex-shrink: 0; width: 420px; min-width: 0; }
.mode-switch { position: relative; display: flex; padding: 5px; margin: 0 auto 22px; width: 206px; border: 1px solid #e2e8f3; border-radius: 16px; background: #e9edf4; }
.mode-indicator { position: absolute; top: 5px; bottom: 5px; left: 5px; width: calc((100% - 10px) / 2); border-radius: 11px; background: white; box-shadow: 0 2px 5px #233a6710; transition: transform 650ms cubic-bezier(.22, .8, .25, 1); }
.mode-indicator--register { transform: translateX(100%); }
.mode-button { position: relative; flex: 1; margin: 0; padding: 0; border: 0; border-radius: 11px; background: transparent; color: #5c5c5c; font-size: 14px; font-weight: 500; line-height: 38px; transition: color 200ms; }
.mode-button::after, .text-button::after { border: 0; }
.mode-button--active { color: #245fd9; font-weight: 650; }
.card-scene { perspective: 1400px; }
.card-rotator { position: relative; transform-style: preserve-3d; transition: transform var(--auth-flip-duration, 720ms) cubic-bezier(.22, .8, .25, 1); }
.card-rotator--flipped { transform: rotateY(180deg); }
.auth-card { position: absolute; top: 0; right: 0; left: 0; display: flex; flex-direction: column; min-width: 0; box-sizing: border-box; padding: 28px; border: 1px solid #e8e9ed; border-radius: 24px; background: linear-gradient(150deg, #f5f8ff 0, white 30%); box-shadow: 0 20px 50px -20px #20478133, 0 2px 8px #20478105; -webkit-backface-visibility: hidden; backface-visibility: hidden; visibility: hidden; pointer-events: none; transition: visibility 0s 360ms; }
.auth-card--register { transform: rotateY(180deg); }
.auth-card--active { position: relative; visibility: visible; pointer-events: auto; transition-delay: 0s; }
.card-heading { display: flex; flex-direction: column; }
.card-eyebrow { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 23px; }
.card-label { display: flex; align-items: center; gap: 6px; color: #245fd9; font-size: 11px; }
.card-number { font-size: 9px; font-weight: 600; letter-spacing: 1px; color: #69768c; }
.card-title { font-size: 25px; font-weight: 650; line-height: 1.4; letter-spacing: -.7px; }
.card-description { margin-top: 8px; color: #5c5c5c; font-size: 12px; line-height: 1.7; }
.auth-fields { display: flex; flex-direction: column; gap: 19px; margin-top: 28px; }
.auth-field { display: flex; flex-direction: column; gap: 8px; }
.field-label { font-size: 13px; font-weight: 500; color: #4a4a4a; }
.field-label-row { display: flex; align-items: baseline; justify-content: space-between; }
.field-hint { font-size: 11px; color: #69768c; }
.field-control { position: relative; border: 1px solid #e8e9ed; border-radius: 12px; background: #f8f9fb; transition: border-color 180ms, box-shadow 180ms, background 180ms; --wot-input-icon-color: #8190a7; --wot-input-placeholder-color: #818898; --wot-input-fs: 14px; }
.field-control:focus-within { border-color: #7ba2f1; background: white; box-shadow: 0 0 0 3px #e9f0fd; }
.field-proxy { position: absolute; top: 50%; right: calc(var(--auth-input-inline-padding, 14px) + 24px); left: calc(var(--auth-input-inline-padding, 14px) + 24px); z-index: 2; overflow: hidden; color: var(--wot-input-placeholder-color); font-size: var(--wot-input-fs); line-height: 24px; white-space: nowrap; pointer-events: none; transform: translateY(-50%); }
.field-proxy--filled { color: var(--wot-input-color, #262626); }
.card-rotator--flipping .field-control { pointer-events: none; }
.card-rotator--flipping :deep(.auth-native-input) { visibility: hidden !important; opacity: 0 !important; color: transparent !important; -webkit-text-fill-color: transparent !important; caret-color: transparent !important; }
.card-actions { display: flex; flex-direction: column; gap: 18px; margin-top: auto; padding-top: 30px; }
.submit-content { display: flex; align-items: center; justify-content: center; gap: 12px; font-size: 14px; font-weight: 600; }
.card-switch-hint { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 3px; color: #5c5c5c; font-size: 11px; }
.text-button { display: inline-flex; align-items: center; gap: 4px; margin: 0; padding: 5px 2px; border: 0; background: transparent; color: #245fd9; font-size: 11px; line-height: 20px; border-radius: 5px; }
.mode-button:focus-visible, .text-button:focus-visible { outline: 2px solid #2f6be6; outline-offset: 3px; }
.panel-footer { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 22px; color: #69768c; font-size: 11px; line-height: 1.6; }
.page-dots { display: flex; align-items: center; gap: 5px; }
.page-dots view { width: 5px; height: 5px; border-radius: 5px; background: #cbd4e4; transition: width 350ms, background 350ms; }
.page-dots .page-dot--active { width: 18px; background: #2f6be6; }

@keyframes ball-arrive { from { opacity: 0; transform: translateY(-18px) rotate(-30deg); } to { opacity: 1; transform: translateY(0) rotate(0); } }

@media (max-width: 900px) {
  .auth-page { align-items: flex-start; padding: 20px 22px; padding-bottom: calc(24px + env(safe-area-inset-bottom)); }
  .auth-layout { flex-direction: column; gap: 22px; max-width: 420px; }
  .auth-intro { width: 100%; }
  .brand-mark { width: 36px; height: 36px; border-radius: 11px; }
  .brand-mark text { font-size: 25px; }
  .brand-wordmark { font-size: 25px; }
  .brand-caption { font-size: 12px; }
  .intro-copy { gap: 9px; margin-top: 18px; }
  .intro-title { font-size: 28px; letter-spacing: -.7px; }
  .intro-title-accent { display: inline; }
  .intro-description { font-size: 12px; white-space: normal; }
  .intro-features, .court-art { display: none; }
  .auth-panel { width: 100%; }
  .mode-switch { width: 184px; margin-bottom: 18px; }
  .mode-button { line-height: 34px; font-size: 13px; }
  .auth-card { padding: 22px; border-radius: 22px; --auth-input-padding: 10px 12px; --auth-input-inline-padding: 12px; }
  .card-eyebrow { margin-bottom: 16px; }
  .card-title { font-size: 23px; }
  .auth-fields { margin-top: 20px; gap: 14px; }
  .card-actions { padding-top: 20px; gap: 12px; }
  .panel-footer { margin-top: 14px; gap: 9px; }
}

@media (max-width: 360px) {
  .auth-page { padding: 22px 16px; }
  .auth-layout { gap: 22px; }
  .intro-title { font-size: 25px; }
  .auth-card { padding: 20px; }
  .card-title { font-size: 21px; }
  .card-number { letter-spacing: .5px; }
}

@media (prefers-reduced-motion: reduce) {
  .card-rotator, .auth-card, .mode-indicator, .page-dots view, .field-control { transition: none; }
  .court-ball { animation: none; }
}

</style>
