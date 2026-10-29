/**
 * 登录注册接口。✅ 已接入后端（rally-server：AuthController）
 *
 * 小程序登录：
 * - 一键登录：uni.login({ provider: 'weixin' }) 拿到 code → wxLogin(code)。第一次登录的微信会自动建一个新账号
 *   （昵称是「微信用户xxxx」），返回 newUser = true，可以引导去编辑资料页设置头像和昵称。
 * - 已经在 H5 注册过手机号的人：在小程序里用手机号登录 / 注册时，带上 uni.login() 拿到的 code（wxCode），
 *   后端会把这个微信绑定到手机号账号上，以后一键登录进的就是这个账号。返回的 wxBound 表示有没有绑上。
 * code 只能用一次、5 分钟内有效，每次调用前都要重新 uni.login() 拿新的。
 */
import { http } from '@/utils/request'

export interface LoginResult {
  token: string
  userId: number
  nickname: string
  /** 只有一键登录返回：true 表示这次是新建的账号 */
  newUser?: boolean
  /**
   * 只有手机号登录 / 注册时传了 wxCode 才返回：true 绑定成功；
   * false 没绑上（这个微信已经绑了别的账号，或者这个账号已经绑了别的微信），登录本身不受影响
   */
  wxBound?: boolean
}

export interface LoginForm {
  phone: string
  password: string
  /** 可选：小程序里传 uni.login() 拿到的 code，顺便绑定微信；H5 不用传 */
  wxCode?: string
}

export interface RegisterForm extends LoginForm {
  nickname: string
}

export function login(form: LoginForm): Promise<LoginResult> {
  return http.post<LoginResult>('/auth/login', form)
}

export function register(form: RegisterForm): Promise<LoginResult> {
  return http.post<LoginResult>('/auth/register', form)
}

/** 小程序一键登录：code 是 uni.login() 拿到的临时登录凭证 */
export function wxLogin(code: string): Promise<LoginResult> {
  return http.post<LoginResult>('/auth/wx-login', { code })
}
