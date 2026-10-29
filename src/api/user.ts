/**
 * 用户相关接口  ✅ 已全部接入后端（rally-server：UserController）
 */
import type { MyProfile, SignupRecord } from '@/types'
import { http, upload } from '@/utils/request'

export function fetchMyProfile(): Promise<MyProfile> {
  return http.get<MyProfile>('/users/me')
}

export interface UpdateProfileForm {
  /** 昵称，最多 12 个字 */
  nickname: string
  /** 个人介绍，最多 100 个字；不传表示不改，传空字符串表示清空 */
  bio?: string
}

/** 修改昵称和个人介绍，返回修改后的「我的」数据 */
export function updateMyProfile(form: UpdateProfileForm): Promise<MyProfile> {
  return http.put<MyProfile>('/users/me', form)
}

/**
 * 上传头像，返回修改后的「我的」数据（avatar 是新头像地址）。
 * filePath：uni.chooseImage 拿到的临时路径；小程序也可以用 <button open-type="chooseAvatar"> 拿微信头像。
 * 只支持 JPG / PNG / WEBP / GIF，不超过 2MB，选图时建议加 sizeType: ['compressed']。
 */
export function uploadAvatar(filePath: string): Promise<MyProfile> {
  return upload<MyProfile>({ url: '/users/me/avatar', filePath })
}

/** 报名记录：UPCOMING 还没结束的（按开始时间正序），HISTORY 已结束或已取消的（倒序） */
export type SignupScope = 'UPCOMING' | 'HISTORY'

export function fetchMySignups(scope: SignupScope): Promise<SignupRecord[]> {
  return http.get<SignupRecord[]>('/users/me/signups', { scope })
}
