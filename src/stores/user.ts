import { defineStore } from 'pinia'
import { ref } from 'vue'

const TOKEN_KEY = 'token'
const USER_ID_KEY = 'userId'

/**
 * 登录状态：token 和用户 id 同时存在内存和本地缓存里，刷新页面或重新打开小程序都还在。
 * mock 阶段还没有登录，用户 id 默认是 1（mock 数据里的「小周」）；接入登录后由登录接口写入。
 */
export const useUserStore = defineStore('user', () => {
  const token = ref<string>(uni.getStorageSync(TOKEN_KEY) || '')
  const userId = ref<number>(Number(uni.getStorageSync(USER_ID_KEY)) || 1)

  function setLogin(newToken: string, id: number) {
    token.value = newToken
    userId.value = id
    uni.setStorageSync(TOKEN_KEY, newToken)
    uni.setStorageSync(USER_ID_KEY, id)
  }

  function logout() {
    token.value = ''
    uni.removeStorageSync(TOKEN_KEY)
    uni.removeStorageSync(USER_ID_KEY)
  }

  return { token, userId, setLogin, logout }
})
