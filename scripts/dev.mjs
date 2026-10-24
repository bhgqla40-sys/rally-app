/**
 * 一条命令同时启动 H5 和微信小程序的开发服务器：npm run dev
 *
 * - [h5] 开头的日志来自 H5（浏览器访问终端里打印的地址）
 * - [mp] 开头的日志来自小程序（微信开发者工具显示的就是它打包到 dist/dev/mp-weixin 的内容）
 * - 按 Ctrl + C 两个一起停
 * - 任何一个意外退出，另一个也会一起停，避免「只剩一个在跑」却没发现
 */
import { spawn } from 'node:child_process'

const TASKS = [
  { name: 'h5', script: 'dev:h5', color: '\x1b[34m' },
  { name: 'mp', script: 'dev:mp-weixin', color: '\x1b[32m' },
]
const RESET = '\x1b[0m'
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

let stopping = false
const children = TASKS.map(({ name, script, color }) => {
  const prefix = `${color}[${name}]${RESET} `
  const child = spawn(npm, ['run', script], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' },
  })

  // 给每一行日志加上 [h5] / [mp] 前缀，方便区分
  const pipe = (stream, out) => {
    let rest = ''
    stream.on('data', (chunk) => {
      const lines = (rest + chunk).split('\n')
      rest = lines.pop() ?? ''
      for (const line of lines) out.write(prefix + line + '\n')
    })
    stream.on('end', () => rest && out.write(prefix + rest + '\n'))
  }
  pipe(child.stdout, process.stdout)
  pipe(child.stderr, process.stderr)

  child.on('exit', (code) => {
    if (!stopping) console.log(`${prefix}已退出（退出码 ${code}），另一个也一起停掉`)
    shutdown(code ?? 0)
  })
  return child
})

function shutdown(code) {
  if (stopping) return
  stopping = true
  for (const child of children) child.kill('SIGINT')
  setTimeout(() => process.exit(code), 500)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
