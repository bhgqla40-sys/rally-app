/** 运动类型 */
export type SportType = 'BADMINTON' | 'BASKETBALL' | 'FOOTBALL' | 'FRISBEE' | 'OTHER'

/** 用户（列表、名单里展示用的精简信息） */
export interface Member {
  id: number
  nickname: string
  avatar?: string
}
