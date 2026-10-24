import { ApiError } from '@/utils/request'

/**
 * 模拟网络请求：延迟一会儿再返回结果。
 * 返回的是深拷贝，页面改数据不会直接改到 mock 数据库。
 * 处理函数里 throw new ApiError(...) 就相当于后端返回了错误，会自动弹出提示。
 */
export function mockRequest<T>(handler: () => T, delay = 300): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      try {
        const data = handler()
        resolve(data === undefined ? data : JSON.parse(JSON.stringify(data)))
      } catch (e) {
        const err = e instanceof ApiError ? e : new ApiError(-1, String(e))
        uni.showToast({ title: err.message, icon: 'none' })
        reject(err)
      }
    }, delay)
  })
}
