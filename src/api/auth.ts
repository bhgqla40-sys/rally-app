/**
 * 登录注册接口。✅ 已接入后端（rally-server：AuthController）
 */
import { syncMockUser } from '@/mock/db'
import { http } from '@/utils/request'

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

/** 联调过渡：还没接后端的页面用的是 mock 数据，让 mock 里的「我」跟着真实用户走 */
function afterLogin(result: LoginResult) {
  syncMockUser(result.userId, result.nickname)
  return result
}

export function login(form: LoginForm): Promise<LoginResult> {
  return http.post<LoginResult>('/auth/login', form).then(afterLogin)
}

export function register(form: RegisterForm): Promise<LoginResult> {
  return http.post<LoginResult>('/auth/register', form).then(afterLogin)
}
