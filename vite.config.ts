import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import uni from '@dcloudio/vite-plugin-uni'
import { defineConfig } from 'vite'
import { WeappTailwindcss } from 'weapp-tailwindcss/vite'

const projectRoot = dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni(),
    // 必须放在 uni() 后面：负责生成 Tailwind 样式，
    // 并在打包小程序时把 w-1/2、bg-[#fff] 这类类名转换成小程序能识别的写法
    WeappTailwindcss({
      cssEntries: [resolve(projectRoot, 'src/app.css')],
      cssOptions: {
        // Tailwind 默认用 rem，小程序里统一转成 rpx
        rem2rpx: true,
      },
    }),
  ],
  server: {
    proxy: {
      // H5 开发时，把 /api 开头的请求转发到本地的 Spring Boot（默认 8080 端口），这样就没有跨域问题
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
