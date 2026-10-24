<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { LOGIN_PAGE, buildLoginUrl } from '@/utils/auth'

onLaunch((options) => {
  // 没登录就先去登录页，登录完再回到原来要打开的页面（比如群里分享的场次链接）
  const userStore = useUserStore()
  if (!userStore.token && options?.path !== LOGIN_PAGE) {
    uni.reLaunch({ url: buildLoginUrl(options?.path, options?.query) })
  }
})
</script>

<style>
/* 全局样式：引入 Tailwind */
@import './app.css';
</style>
