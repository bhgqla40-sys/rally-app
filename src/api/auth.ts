/**
 * 登录注册接口。
 * 现在用 mock：任意 11 位手机号 + 6 位以上密码都能登录。
 * 后端完成后换成注释里的 http 调用即可。
 */
import { ME } from '@/mock/db'
import { mockRequest } from './mock'

export interface LoginResult {
  token: string
  userId: number
  nickname: string
}

export interface LoginForm {
  phone: string
  password: string
}

export interface RegisterForm extends LoginForm {
  nickname: string
}

export function login(form: LoginForm): Promise<LoginResult> {
  // return http.post<LoginResult>('/auth/login', form, { showError: true })
  return mockRequest(() => ({ token: `mock-token-${form.phone}`, userId: ME.id, nickname: ME.nickname }), 500)
}

export function register(form: RegisterForm): Promise<LoginResult> {
  // return http.post<LoginResult>('/auth/register', form)
  return mockRequest(() => ({ token: `mock-token-${form.phone}`, userId: ME.id, nickname: form.nickname }), 500)
}
