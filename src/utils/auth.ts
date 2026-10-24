/** 登录页路由 */
export const LOGIN_PAGE = 'pages/login/index'

/** 拼出登录页地址，带上 redirect，登录成功后回到原来的页面 */
export function buildLoginUrl(route?: string, query?: Record<string, unknown>) {
  if (!route || route === LOGIN_PAGE) return `/${LOGIN_PAGE}`
  const qs = query
    ? Object.entries(query)
        .map(([k, v]) => `${k}=${v}`)
        .join('&')
    : ''
  const redirect = `/${route}${qs ? `?${qs}` : ''}`
  return `/${LOGIN_PAGE}?redirect=${encodeURIComponent(redirect)}`
}

/** 跳到登录页（当前已经在登录页就不跳） */
export function goLogin() {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1] as { route?: string; options?: Record<string, unknown> } | undefined
  if (current?.route === LOGIN_PAGE) return
  uni.reLaunch({ url: buildLoginUrl(current?.route, current?.options) })
}
