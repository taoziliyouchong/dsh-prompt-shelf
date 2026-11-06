/**
 * 常用提示词——宿主半边：把状态存到文件，并提供一条本机 HTTP 路由给浏览器半边。
 *
 * 为什么必须有它：浏览器 localStorage 按 origin 隔离，桌面端每次启动端口都会变
 * （127.0.0.1:<随机端口>），刷新或重启后条目就全读不到了。数据改存
 * $DSH_HOME/data/dsh-prompt-shelf/state.json，由这条路由读写。
 *
 * 路由：GET  /dsh-prompt-shelf/api/state  → { ok, state, error? }
 *       POST /dsh-prompt-shelf/api/state  → 写入 { items, trash, trashDays }
 * 只接受本机回环请求。
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

/** 状态文件位置（与 profile 无关：所有 profile 共用一份用户数据）。 */
const DSH_HOME = process.env.DSH_HOME || join(homedir(), '.dsh')
const STATE_FILE = join(DSH_HOME, 'data', 'dsh-prompt-shelf', 'state.json')
/** 浏览器半边用的路由。 */
const API_PATH = '/dsh-prompt-shelf/api/state'
/** 工作区文件清单路由（编辑框里打 @ 用）。 */
const FILES_PATH = '/dsh-prompt-shelf/api/files'
/** 已装插件清单路由（编辑框里打 @ 选「插件」时用）。 */
const PLUGINS_PATH = '/dsh-prompt-shelf/api/plugins'
/** 写入上限。 */
const MAX_BYTES = 1 << 20
/** 回收站默认保留天数。 */
const DEFAULT_TRASH_DAYS = 3
/** 天数合法区间。 */
const MAX_TRASH_DAYS = 365

/** Cordis 插件名。 */
export const name = 'dsh-prompt-shelf'

/**
 * 声明的服务：只显式写空数组——webServer 走可选获取（非 web 组合里没有它也不该拦加载），
 * 但空数组能让宿主的「inject 声明完整」检查通过。
 */
export const inject = []

/**
 * 宿主插件体：把状态路由挂到 webServer 上；没有 webServer 的组合里静默跳过。
 * @param ctx - 宿主上下文。
 */
export function apply(ctx) {
  const register = (hostCtx) => {
    const webServer = hostCtx
      && (hostCtx.webServer || (typeof hostCtx.get === 'function' ? hostCtx.get('webServer') : undefined))
    if (!webServer || typeof webServer.register !== 'function') return
    hostCtx.effect(() => webServer.register({
      kind: 'exact',
      path: API_PATH,
      handler: (req, res) => {
        if (!isLocal(req)) return sendJson(res, 403, { ok: false, error: '只接受本机请求' })
        if (req.method === 'GET') {
          const { state, error } = readState()
          return sendJson(res, 200, error ? { ok: true, state, error } : { ok: true, state })
        }
        if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: '只支持 GET / POST' })
        readBody(req).then((body) => {
          const parsed = JSON.parse(body)
          writeState(normalizeState(parsed))
          sendJson(res, 200, { ok: true })
        }).catch((error) => {
          sendJson(res, 400, { ok: false, error: String((error && error.message) || error) })
        })
      },
    }), 'dsh-prompt-shelf: state route')

    // 工作区文件清单：编辑框里打 @ 时按查询词列文件与目录（不依赖客户端的远程命名空间）。
    hostCtx.effect(() => webServer.register({
      kind: 'exact',
      path: FILES_PATH,
      handler: (req, res) => {
        if (!isLocal(req)) return sendJson(res, 403, { ok: false, error: '只接受本机请求' })
        if (req.method !== 'GET') return sendJson(res, 405, { ok: false, error: '只支持 GET' })
        try {
          const url = new URL(req.url || '/', 'http://localhost')
          const dir = url.searchParams.get('dir') || ''
          const query = url.searchParams.get('q') || ''
          const { items, error } = listFilesIn(dir, query)
          sendJson(res, 200, error ? { ok: true, items, error } : { ok: true, items })
        } catch (error) {
          sendJson(res, 400, { ok: false, error: String((error && error.message) || error) })
        }
      },
    }), 'dsh-prompt-shelf: files route')

    // 已装插件清单：个人插件目录 + 当前 profile 里的非内置依赖。
    hostCtx.effect(() => webServer.register({
      kind: 'exact',
      path: PLUGINS_PATH,
      handler: (req, res) => {
        if (!isLocal(req)) return sendJson(res, 403, { ok: false, error: '只接受本机请求' })
        if (req.method !== 'GET') return sendJson(res, 405, { ok: false, error: '只支持 GET' })
        sendJson(res, 200, { ok: true, items: listPlugins(hostCtx) })
      },
    }), 'dsh-prompt-shelf: plugins route')
  }

  // apply 期 ctx.get('webServer') 可能还拿不到，走 inject 等它到位。
  const direct = typeof ctx.get === 'function' ? ctx.get('webServer') : undefined
  if (direct && typeof direct.register === 'function') {
    register(ctx)
    return
  }
  if (typeof ctx.inject === 'function') ctx.inject(['webServer'], (hostCtx) => register(hostCtx))
}

/** 天数收进 1~365。 */
function clampDays(value) {
  const days = Math.round(Number(value))
  if (!Number.isFinite(days)) return DEFAULT_TRASH_DAYS
  return Math.min(MAX_TRASH_DAYS, Math.max(1, days))
}

/** 只保留形状对得上的条目与回收站记录。 */
function normalizeState(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const items = Array.isArray(source.items) ? source.items.filter(isEntry).slice(0, 5000) : []
  const trash = Array.isArray(source.trash)
    ? source.trash.filter(isTrashEntry).slice(0, 5000)
    : []
  return { items, trash, trashDays: clampDays(source.trashDays) }
}

function isEntry(value) {
  return !!(value && typeof value === 'object'
    && typeof value.id === 'string' && value.id !== ''
    && typeof value.text === 'string' && value.text.trim() !== '')
}

function isTrashEntry(value) {
  return isEntry(value) && typeof value.deletedAt === 'number'
}

/**
 * 读状态文件。
 * @returns 状态与（文件损坏时的）错误说明；文件不存在按空状态。
 */
function readState() {
  try {
    if (!existsSync(STATE_FILE)) return { state: normalizeState({}), error: null }
    const parsed = JSON.parse(readFileSync(STATE_FILE, 'utf8'))
    return { state: normalizeState(parsed), error: null }
  } catch (error) {
    return { state: normalizeState({}), error: '状态文件读不出来：' + String((error && error.message) || error) }
  }
}

/** 原子写：先写 .tmp 再改名，旧的留一份 .bak。 */
function writeState(state) {
  mkdirSync(dirname(STATE_FILE), { recursive: true })
  if (existsSync(STATE_FILE)) {
    try { renameSync(STATE_FILE, STATE_FILE + '.bak') } catch { /* 备份失败不影响主写 */ }
  }
  const tmp = STATE_FILE + '.tmp'
  writeFileSync(tmp, JSON.stringify({ v: 2, ...state }), 'utf8')
  renameSync(tmp, STATE_FILE)
}

/**
 * 列一个目录里的文件与子目录（相对路径、正斜杠），按查询词过滤。
 * 只递归 3 层、封顶 400 条，跳过依赖与构建目录。
 * @param dir - 工作区根目录（绝对路径）。
 * @param query - 查询词（可为空；空时按遍历顺序列出）。
 * @returns {{ items: Array<{path: string, kind: string}>, error: string | null }}
 */
function listFilesIn(dir, query) {
  const root = typeof dir === 'string' ? dir.trim() : ''
  if (!root) return { items: [], error: '缺少工作区目录' }
  const keyword = String(query || '').trim().toLowerCase().replace(/\\/g, '/')
  const skip = new Set([
    'node_modules', '.git', 'dist', 'build', 'out', 'target', '.next', '.cache',
    'vendor', '.venv', '__pycache__', 'coverage',
  ])
  const items = []
  const limit = 400
  const queue = [{ abs: root, rel: '', depth: 0 }]
  while (queue.length > 0 && items.length < limit) {
    const current = queue.shift()
    let entries = []
    try {
      entries = readdirSync(current.abs, { withFileTypes: true })
    } catch {
      continue
    }
    const deeper = []
    for (const entry of entries) {
      if (items.length >= limit) break
      const name = entry.name
      if (name.startsWith('.')) continue
      const rel = current.rel ? current.rel + '/' + name : name
      if (entry.isDirectory()) {
        if (skip.has(name)) continue
        items.push({ path: rel, kind: 'directory' })
        if (current.depth < 3) deeper.push({ abs: join(current.abs, name), rel, depth: current.depth + 1 })
      } else if (entry.isFile()) {
        items.push({ path: rel, kind: 'file' })
      }
    }
    queue.push(...deeper)
  }
  const filtered = keyword ? items.filter((item) => item.path.toLowerCase().includes(keyword)) : items
  return { items: filtered.slice(0, 200), error: null }
}

/**
 * 已装插件清单。口径＝插件加载器的实时表（`ctx.loader.entries()`，与插件市场/inspect 同一份），
 * 只留第三方插件，滤掉 `@deepseek-ai/*`、`cordis:*` 这些内建行。
 * 不读 profile 的 package.json——那是「装了但未必加载」的清单。
 * @param ctx - 宿主上下文。
 * @returns {{name: string, kind: string}[]}
 */
function listPlugins(ctx) {
  const items = []
  const seen = new Set()
  const add = (name, kind) => {
    const text = String(name || '').trim()
    if (!text || seen.has(text)) return
    seen.add(text)
    items.push({ name: text, kind })
  }
  try {
    const loader = ctx && typeof ctx.get === 'function' ? ctx.get('loader') : undefined
    if (loader && typeof loader.entries === 'function') {
      for (const entry of loader.entries()) {
        const options = (entry && entry.options) || {}
        if (options.disabled === true) continue
        const name = String(options.name || '')
        if (!name || name.startsWith('cordis:') || name.startsWith('@deepseek-ai/')) continue
        if (name.startsWith('file:')) continue
        add(name, 'installed')
      }
    }
  } catch {
    // 加载器不可用时返回空清单，不拦界面
  }
  return items.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 200)
}

function isLocal(req) {
  const addr = (req.socket && req.socket.remoteAddress) || ''
  return addr === '' || addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1'
}

function sendJson(res, code, value) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(value))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BYTES) {
        reject(new Error('内容超过 1MB 上限'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}
