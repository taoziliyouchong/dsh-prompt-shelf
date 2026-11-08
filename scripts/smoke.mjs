#!/usr/bin/env node
/**
 * 本机冒烟：不起应用、不发网络请求、不写任何文件。
 *
 * 六关：
 *   1. 包结构      —— 要发布的文件都在（含已提交的 lib/client.js）
 *   2. 组合声明    —— dsh.bundle.patch 指向的文件在，里面的 insert id 等于包名
 *   3. 宿主半边    —— index.js 导出名等于包名，桩 ctx 跑 apply 注册 3 条本机路由
 *   4. 路由鉴权    —— 非回环请求 403、非允许方法 405；GET 状态路由返回空状态不写盘
 *   5. 客户端产物  —— 外壳 id == 包名，且带上了本插件的路由与座位
 *
 * 用法：node scripts/smoke.mjs   （任一条失败退出码 1）
 */

import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const problems = []

const ok = (label, extra = '') => console.log('ok   ' + label + (extra ? '  ' + extra : ''))
const fail = (label, why) => {
  problems.push(label + ': ' + why)
  console.log('FAIL ' + label + '  ' + why)
}

/** 1. 包结构 */
const REQUIRED = [
  'index.js',
  'cordis.patch.yml',
  'src/entry.jsx',
  'lib/client.js',
  'README.md',
  'README.en.md',
  'LICENSE',
  'scripts/smoke.mjs',
]
const missing = REQUIRED.filter((rel) => !existsSync(join(root, rel)))
if (missing.length > 0) fail('结构', '缺 ' + missing.join('、'))
else ok('结构', REQUIRED.length + ' 个必需文件齐全')

/** 2. 组合声明：dsh plugin add 靠这一条把包接进层栈 */
const patchRel = pkg.dsh && pkg.dsh.bundle && pkg.dsh.bundle.patch
if (!patchRel) fail('组合声明', 'package.json 没声明 dsh.bundle.patch')
else if (!existsSync(join(root, patchRel))) fail('组合声明', 'dsh.bundle.patch 指向的文件不存在：' + patchRel)
else {
  const patch = readFileSync(join(root, patchRel), 'utf8')
  if (!patch.includes('id: ' + pkg.name)) fail('组合声明', patchRel + ' 里没有 id: ' + pkg.name)
  else if (!patch.includes('name: ' + pkg.name)) fail('组合声明', patchRel + ' 里没有 name: ' + pkg.name)
  else ok('组合声明', 'dsh.bundle.patch → ' + patchRel + '（id 与 name 都是 ' + pkg.name + '）')
}
if (!pkg.dsh || !pkg.dsh.client || pkg.dsh.client.platform !== 'web') fail('组合声明', 'dsh.client.platform 不是 web')
if (!pkg.exports || pkg.exports['./client'] !== './lib/client.js') fail('组合声明', 'exports["./client"] 没指向 ./lib/client.js')
if (pkg.files && (!pkg.files.includes('lib/client.js') || !pkg.files.includes('src'))) fail('组合声明', 'files 里缺 lib/client.js 或 src')

/** 3. 宿主半边：桩 ctx 跑 apply，收集注册的路由 */
const mod = await import(pathToFileURL(join(root, 'index.js')).href)
if (mod.name !== pkg.name) fail('宿主半边', 'index.js 导出的 name 是 ' + mod.name + '，不等于包名 ' + pkg.name)
else ok('宿主半边', 'name = ' + mod.name)

const routes = []
const webServer = {
  register(route) {
    routes.push(route)
    return () => {}
  },
}
const hostCtx = {
  webServer,
  get(name) {
    if (name === 'webServer') return webServer
    return undefined
  },
  effect(fn) {
    const dispose = typeof fn === 'function' ? fn() : undefined
    return typeof dispose === 'function' ? dispose : () => {}
  },
}
try {
  mod.apply(hostCtx)
} catch (error) {
  fail('宿主半边', 'apply 抛错：' + error.message)
}

const WANT = [
  '/' + pkg.name + '/api/state',
  '/' + pkg.name + '/api/files',
  '/' + pkg.name + '/api/plugins',
]
const paths = routes.map((route) => route.path)
if (routes.length !== WANT.length) fail('宿主半边', '应注册 ' + WANT.length + ' 条路由，实际 ' + routes.length + '（' + paths.join('、') + '）')
else if (WANT.some((want) => !paths.includes(want))) fail('宿主半边', '路由路径不符，实际：' + paths.join('、'))
else if (routes.some((route) => route.kind !== 'exact')) fail('宿主半边', '有路由的 kind 不是 exact')
else ok('宿主半边', '3 条路由已注册：' + paths.map((path) => path.replace('/' + pkg.name, '')).join('、'))

/** 4. 路由鉴权 */
function call(handler, req) {
  const res = {
    status: 0,
    headers: null,
    body: '',
    writeHead(code, headers) {
      res.status = code
      res.headers = headers
    },
    end(body) {
      res.body = String(body ?? '')
    },
  }
  handler(req, res)
  return res
}

function routeOf(path) {
  return routes.find((route) => route.path === path)
}

const stateRoute = routeOf(WANT[0])
const filesRoute = routeOf(WANT[1])
if (stateRoute && filesRoute) {
  const cases = [
    { label: '非回环地址被拒', route: stateRoute, req: { socket: { remoteAddress: '10.1.2.3' }, method: 'GET' }, want: 403 },
    { label: '状态路由不接受 PUT', route: stateRoute, req: { socket: { remoteAddress: '127.0.0.1' }, method: 'PUT' }, want: 405 },
    { label: '文件路由不接受 POST', route: filesRoute, req: { socket: { remoteAddress: '127.0.0.1' }, method: 'POST' }, want: 405 },
    { label: '状态路由 GET 返回空状态', route: stateRoute, req: { socket: { remoteAddress: '::1' }, method: 'GET' }, want: 200 },
  ]
  let passed = 0
  for (const item of cases) {
    let res
    try {
      res = call(item.route.handler, item.req)
    } catch (error) {
      fail('路由鉴权', item.label + '：handler 抛错 ' + error.message)
      continue
    }
    if (res.status !== item.want) fail('路由鉴权', item.label + '：返回 ' + res.status + '，应为 ' + item.want)
    else if (item.want === 200 && !res.body.includes('"ok":true')) fail('路由鉴权', item.label + '：响应体不是 ok:true')
    else passed += 1
  }
  if (passed === cases.length) ok('路由鉴权', passed + ' 条全部符合')
}

/** 5. 客户端产物 */
const client = readFileSync(join(root, 'lib', 'client.js'), 'utf8')
const idMatch = /^\s*id:\s*"([^"]+)"/m.exec(client)
if (!idMatch) fail('客户端产物', '外壳里找不到 id')
else if (idMatch[1] !== pkg.name) fail('客户端产物', '外壳 id 是 ' + idMatch[1] + '，应等于包名 ' + pkg.name)
else if (!client.includes('/' + pkg.name + '/api/state')) fail('客户端产物', '产物里没有状态路由（源码改了但没重新构建）')
else if (!client.includes('conversation.input.left')) fail('客户端产物', '产物里没有座位 conversation.input.left')
// 窗口里的 @ 候选面板，以及任务输入框的 @ 源，两样都要在。
else if (!client.includes('zps-mentionpanel')) fail('客户端产物', '产物里没有窗口 @ 候选面板（源码改了但没重新构建）')
else if (!client.includes('registerSource')) fail('客户端产物', '产物里没有 @ 源注册（源码改了但没重新构建）')
else ok('客户端产物', 'id=' + pkg.name + '，' + Buffer.byteLength(client, 'utf8') + ' 字节')

console.log('')
if (problems.length > 0) {
  console.error('冒烟失败 ' + problems.length + ' 项')
  process.exit(1)
}
console.log('冒烟通过')
