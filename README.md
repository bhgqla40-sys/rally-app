# Rally · 组局助手 用户端

> 仓库地址：https://github.com/bhgqla40-sys/rally-app

固定球局 / 兴趣局的报名、候补递补与 AA 记账工具。一套代码同时输出 **H5 网页** 和 **微信小程序**。

## 技术栈

- uni-app（Vue 3 + TypeScript + Vite）
- UI 组件库：wot-design-uni
- 样式：Tailwind CSS 4 + weapp-tailwindcss（小程序类名转换）
- 状态管理：Pinia
- 网络请求：基于 `uni.request` 自行封装（`src/utils/request.ts`）
- 日期处理：dayjs

## 本地开发

需要 Node.js 22.18+ 或 24.11+。

```bash
git clone git@github.com:bhgqla40-sys/rally-app.git
cd rally-app
npm install

# H5，浏览器打开终端里打印的地址
npm run dev:h5

# 微信小程序，用微信开发者工具打开 dist/dev/mp-weixin
npm run dev:mp-weixin
```

## 打包

```bash
npm run build:h5          # 产物在 dist/build/h5，部署到 Nginx
npm run build:mp-weixin   # 产物在 dist/build/mp-weixin，用微信开发者工具上传
```

## 目录说明

```
src/
├── app.css            # Tailwind 入口（必须是纯 .css）
├── pages.json         # 路由表 + 组件自动引入配置
├── pages/             # 页面
├── stores/            # Pinia 状态
└── utils/request.ts   # 请求封装：自动带 token、统一错误提示
```

## 环境变量

| 文件 | 说明 |
|---|---|
| `.env.development` | 本地开发的后端地址 |
| `.env.production` | 线上后端地址，上线前改成已备案的 HTTPS 域名 |

H5 端的接口统一请求同源的 `/api`：开发时由 Vite 代理到 `localhost:8080`，上线后由 Nginx 转发。
