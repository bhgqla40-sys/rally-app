import { useUserStore } from '@/stores/user'
import { goLogin } from './auth'

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

/**
 * 处理后端的返回结果，request 和 upload 共用：
 * 401 → 退出登录并跳登录页；HTTP 2xx 且 code 为 0 → 成功；其余都算失败
 */
function handleResponse<T>(
  statusCode: number,
  body: ApiResult<T> | undefined,
  resolve: (data: T) => void,
  fail: (err: ApiError) => void,
) {
  if (statusCode === 401) {
    useUserStore().logout()
    fail(new ApiError(401, body?.message || '登录已过期，请重新登录'))
    goLogin()
    return
  }

  if (statusCode >= 200 && statusCode < 300 && body?.code === 0) {
    resolve(body.data)
    return
  }

  fail(new ApiError(body?.code ?? statusCode, body?.message || `请求失败（${statusCode}）`))
}

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
        handleResponse(res.statusCode, res.data as ApiResult<T> | undefined, resolve, fail)
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

export interface UploadOptions {
  url: string
  /** 本地文件的临时路径，例如 uni.chooseImage 返回的 tempFilePaths[0] */
  filePath: string
  /** 后端接收文件的字段名，默认 file */
  name?: string
  /** 和文件一起提交的普通字段 */
  formData?: Record<string, string>
  /** 失败时是否自动弹出错误提示，默认 true */
  showError?: boolean
}

/**
 * 上传文件（uni.uploadFile），带 token、401 处理、错误提示都和 request 一样。
 * 用法：upload<MyProfile>({ url: '/users/me/avatar', filePath })
 */
export function upload<T = unknown>(options: UploadOptions): Promise<T> {
  const { url, filePath, name = 'file', formData, showError = true } = options
  const header: Record<string, string> = {}

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

    uni.uploadFile({
      url: BASE_URL + url,
      filePath,
      name,
      formData,
      header,
      success: (res) => {
        // 和 uni.request 不同，uploadFile 返回的 data 是字符串，要自己转成对象
        let body: ApiResult<T> | undefined
        try {
          body = JSON.parse(res.data)
        } catch {
          body = undefined
        }
        handleResponse(res.statusCode, body, resolve, fail)
      },
      fail: () => {
        fail(new ApiError(-1, '网络异常，请稍后再试'))
      },
    })
  })
}
