import { defineStore } from 'pinia'
import { ref } from 'vue'

const TOKEN_KEY = 'token'

/** 登录状态：token 同时存在内存和本地缓存里，刷新页面或重新打开小程序都还在 */
export const useUserStore = defineStore('user', () => {
  const token = ref<string>(uni.getStorageSync(TOKEN_KEY) || '')

  function setToken(value: string) {
    token.value = value
    uni.setStorageSync(TOKEN_KEY, value)
  }

  function logout() {
    token.value = ''
    uni.removeStorageSync(TOKEN_KEY)
  }

  return { token, setToken, logout }
})
