import { defineStore } from 'pinia'
import { ref } from 'vue'

const TOKEN_KEY = 'token'
const USER_ID_KEY = 'userId'
const NICKNAME_KEY = 'nickname'

/**
 * 登录状态：token 和用户 id 同时存在内存和本地缓存里，刷新页面或重新打开小程序都还在。
 * 登录成功后由登录接口写入；没登录时 userId 是 0。
 */
export const useUserStore = defineStore('user', () => {
  const token = ref<string>(uni.getStorageSync(TOKEN_KEY) || '')
  const userId = ref<number>(Number(uni.getStorageSync(USER_ID_KEY)) || 0)
  const nickname = ref<string>(uni.getStorageSync(NICKNAME_KEY) || '')

  function setLogin(newToken: string, id: number, name: string) {
    token.value = newToken
    userId.value = id
    nickname.value = name
    uni.setStorageSync(TOKEN_KEY, newToken)
    uni.setStorageSync(USER_ID_KEY, id)
    uni.setStorageSync(NICKNAME_KEY, name)
  }

  /** 修改资料后同步昵称 */
  function setNickname(name: string) {
    nickname.value = name
    uni.setStorageSync(NICKNAME_KEY, name)
  }

  function logout() {
    token.value = ''
    nickname.value = ''
    uni.removeStorageSync(TOKEN_KEY)
    uni.removeStorageSync(USER_ID_KEY)
    uni.removeStorageSync(NICKNAME_KEY)
  }

  return { token, userId, nickname, setLogin, setNickname, logout }
})
