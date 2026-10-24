/**
 * 用户相关接口。
 * 现在用 mock 数据；后端完成后换成注释里的 http 调用即可。
 */
import { db } from '@/mock/db'
import type { MyProfile } from '@/types'
import { mockRequest } from './mock'

export function fetchMyProfile(): Promise<MyProfile> {
  // return http.get<MyProfile>('/users/me')
  return mockRequest(() => db.profile)
}
