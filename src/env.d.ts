/// <reference types="vite/client" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

/** .env 文件里的环境变量，在这里声明类型后代码里才有提示 */
interface ImportMetaEnv {
  /** 后端地址，不带 /api，例如 http://localhost:8080（小程序端使用） */
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
