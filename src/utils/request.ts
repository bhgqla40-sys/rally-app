import { useUserStore } from '@/stores/user'

/** 后端统一返回格式，和 Spring Boot 那边的 Result<T> 一一对应。约定 code 为 0 表示成功 */
export interface ApiResult<T> {
  code: number
  message: string
  data: T
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'
type Params = Record<string, any>

export interface RequestOptions {
  url: string
  method?: Method
  data?: Params
  header?: Record<string, string>
  /** 失败时是否自动弹出错误提示，默认 true */
  showError?: boolean
}

export class ApiError extends Error {
  code: number

  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

// 小程序没有代理，必须请求完整的后端地址（上线时必须是已备案的 HTTPS 域名）
let BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`
// #ifdef H5
// H5 请求同源的 /api：开发时由 Vite 代理到本地后端，上线后由 Nginx 转发
BASE_URL = '/api'
// #endif

export function request<T = unknown>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, showError = true } = options
  const header = { ...options.header }

  const userStore = useUserStore()
  if (userStore.token) {
    header.Authorization = `Bearer ${userStore.token}`
  }

  return new Promise<T>((resolve, reject) => {
    const fail = (err: ApiError) => {
      if (showError) {
        uni.showToast({ title: err.message, icon: 'none' })
      }
      reject(err)
    }

    uni.request({
      url: BASE_URL + url,
      method,
      data,
      header,
      timeout: 15000,
      success: (res) => {
        const body = res.data as ApiResult<T> | undefined

        if (res.statusCode === 401) {
          userStore.logout()
          fail(new ApiError(401, '登录已过期，请重新登录'))
          return
        }

        if (res.statusCode >= 200 && res.statusCode < 300 && body?.code === 0) {
          resolve(body.data)
          return
        }

        fail(new ApiError(body?.code ?? res.statusCode, body?.message || `请求失败（${res.statusCode}）`))
      },
      fail: () => {
        fail(new ApiError(-1, '网络异常，请稍后再试'))
      },
    })
  })
}

/** 用法和 axios 类似：http.get<Game[]>('/games', { status: 1 }) */
export const http = {
  get: <T>(url: string, data?: Params, options?: Partial<RequestOptions>) =>
    request<T>({ ...options, url, method: 'GET', data }),
  post: <T>(url: string, data?: Params, options?: Partial<RequestOptions>) =>
    request<T>({ ...options, url, method: 'POST', data }),
  put: <T>(url: string, data?: Params, options?: Partial<RequestOptions>) =>
    request<T>({ ...options, url, method: 'PUT', data }),
  delete: <T>(url: string, data?: Params, options?: Partial<RequestOptions>) =>
    request<T>({ ...options, url, method: 'DELETE', data }),
}
