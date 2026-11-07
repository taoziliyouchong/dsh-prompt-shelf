/**
 * 常用提示词（浏览器半边源码）。
 *
 * 座位：conversation.input.left —— 输入框工具行里「完全权限」右边的紧凑按钮（session 范围列表 slot）。
 *       新会话的空白页（hero 变体）不渲染 composer.dock，但工具行照渲染，所以入口在新会话里也有。
 *       点开是**独立大窗口**（portal 到 document.body 的居中对话框，照 ui-primitives 的 Modal 复制结构与遮罩，不 import 该包）。
 * 窗口内：一条提示词＝一张卡片，单列排布（不分左右栏）；卡片自带 插入/替换/编辑/删除。
 * 读写输入框：只用宿主给 session 级 slot 组件的标准 props——
 *       useInput(selector) 读 InputState（draft＝当前草稿纯文本投影），
 *       inputActions.captureInsertion() / insertText(text, span) 插到光标处，
 *       inputActions.setDraft(text) 整框替换。不碰编辑器 DOM。
 * 数据：条目存 localStorage（键 dsh.prompt-shelf.v1），与插件包分开——升级、重装包都不丢条目。
 *
 * 打包：npm run build:client → lib/client.js
 *      （react / react/jsx-runtime / react-dom 都是 external，由客户端模块表提供）。
 */
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/** 需要的客户端服务：槽、@ 触发器、会话清单（取当前工作区目录）。 */
export const inject = ['slots', 'inputTriggers', 'sessions']

/** localStorage 键：带版本号，将来字段变了可以并存另一份。 */
const STORAGE_KEY = 'dsh.prompt-shelf.v1'
/** 宿主状态路由：真源是 $DSH_HOME/data/dsh-prompt-shelf/state.json，这里只是浏览器侧的入口。 */
const API_URL = '/dsh-prompt-shelf/api/state'
/** 宿主文件清单路由（编辑框里打 @ 用）。 */
const FILES_API = '/dsh-prompt-shelf/api/files'
/** 宿主插件清单路由（编辑框里打 @ 选「插件」用）。 */
const PLUGINS_API = '/dsh-prompt-shelf/api/plugins'
/** 没写标题时，取正文首行前多少字当标题。 */
const TITLE_MAX = 28
/** 编辑表单下的占位符写法说明。 */
const TEMPLATE_HINT = '正文里写 {{变量名}}，或 {{变量名=默认值}}；插入时用卡片里填的值替换（不填就用默认值）。正文框里按 Alt+V（或 Ctrl+Alt+V）也能插入变量；卡片上的变量框里打 @ 可引用工作区文件。'

/** 输入框不可用时的兜底状态（dock 是 session 范围，理论上永远有输入框）。 */
const EMPTY_INPUT = { draft: '' }

const CSS = `
.zps-root {
  display: inline-flex;
  align-items: center;
  font-size: calc(var(--dsh-content-font-size-secondary, 13px) - 1px);
  line-height: calc(20px + var(--dsh-content-font-delta-secondary, 0px));
}
.zps-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  box-sizing: border-box;
  height: 24px;
  padding: 0 8px;
  border: none;
  border-radius: var(--dsw-radius-sm);
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  white-space: nowrap;
  cursor: pointer;
}
.zps-trigger:hover,
.zps-trigger[aria-expanded="true"] {
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
}
.zps-trigger:disabled { opacity: 0.45; cursor: default; }
.zps-trigger svg { width: 14px; height: 14px; flex: none; }
.zps-count { color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }

/* 覆盖层：照 ui-primitives Modal（root / mask / dialog），类名换成 zps- 前缀。 */
.zps-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(24px, var(--dsh-frame-overlay-top, 24px)) 24px;
}
.zps-mask {
  position: absolute;
  inset: var(--dsh-frame-chrome-top, 0px) 0 0;
  background: var(--dsw-alias-bg-mask-1);
  backdrop-filter: var(--dsw-mask-blur);
}
.zps-dialog {
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: min(1080px, 100%);
  height: min(900px, 100%);
  overflow: hidden;
  border: 0;
  border-radius: var(--dsw-radius-panel);
  background: var(--dsw-alias-bg-layer-2);
  box-shadow: var(--dsw-elevation-prominent);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 20px;
}
.zps-dialog:focus { outline: none; }
.zps-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 20px 14px 10px 24px;
}
.zps-heading { margin: 0; font-size: 16px; line-height: 24px; font-weight: 500; }
.zps-headmeta { margin-left: 8px; font-size: 12px; font-weight: 400; color: var(--dsw-alias-label-secondary); }
.zps-iconbtn {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--dsw-radius-sm);
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}
.zps-iconbtn:hover { background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); }
.zps-iconbtn svg { width: 14px; height: 14px; }
.zps-toolbar { display: flex; align-items: center; gap: 8px; padding: 0 24px 12px; }
.zps-search {
  flex: 1 1 auto;
  min-width: 0;
  box-sizing: border-box;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: var(--dsw-radius-sm);
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font: inherit;
}
.zps-search:focus { outline: none; border-color: var(--dsw-alias-brand-primary); }
.zps-btn {
  box-sizing: border-box;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: var(--dsw-radius-sm);
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}
.zps-btn:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-1); }
.zps-btn:disabled { opacity: 0.45; cursor: default; }
.zps-btn.primary { border-color: transparent; background: var(--dsw-alias-brand-primary); color: #ffffff; }
.zps-btn.primary:hover:not(:disabled) { background: var(--dsw-alias-brand-primary); opacity: 0.9; }
.zps-btn.danger { color: var(--dsw-alias-state-error-primary); }

/* 卡片流：一条提示词一张卡，单列，不分左右栏。 */
.zps-cards {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 24px 12px;
}
.zps-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-base);
}
.zps-cardhead { display: flex; align-items: center; gap: 8px; }
.zps-cardtitle {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  font-size: 13px;
  line-height: 20px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.zps-cardactions { display: flex; gap: 6px; flex: none; }
.zps-cardactions .zps-btn { height: 24px; padding: 0 8px; }
.zps-cardtext {
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--dsw-alias-label-primary);
  line-height: 1.6;
  cursor: pointer;
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.zps-cardtext[data-expanded="true"] {
  display: block;
  overflow: visible;
}
/* 有变量的卡片：正文按段渲染，变量位置是小输入框，直接原位改。 */
.zps-cardtext-vars { display: block; cursor: default; }
.zps-varwrap { display: inline-block; margin: 0 2px; vertical-align: baseline; }
.zps-var {
  display: inline-block;
  box-sizing: border-box;
  min-width: 84px;
  max-width: 260px;
  height: 22px;
  padding: 0 6px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-xs);
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
  vertical-align: baseline;
}
.zps-var:focus { outline: none; border-color: var(--dsw-alias-brand-primary); }
/* 变量框的 @ 候选：portal 到 body 的浮层，不被卡片滚动容器裁掉。 */
.zps-varmenu {
  position: fixed;
  z-index: 1100;
  width: 360px;
  max-width: calc(100vw - 16px);
  border-radius: 10px;
  box-shadow: var(--dsw-elevation-prominent);
}
.zps-varbadge { flex: none; font-size: 11px; color: var(--dsw-alias-label-secondary); }
.zps-placeholder {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: var(--dsw-alias-label-secondary);
  text-align: center;
}
.zps-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 24px 20px;
}
.zps-flash { color: var(--dsw-alias-label-secondary); font-size: 12px; min-height: 18px; }
.zps-hint { color: var(--dsw-alias-label-secondary); font-size: 12px; }
.zps-editform { display: flex; flex-direction: column; gap: 8px; }
.zps-field {
  box-sizing: border-box;
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: var(--dsw-radius-sm);
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font: inherit;
}
.zps-field:focus { outline: none; border-color: var(--dsw-alias-brand-primary); }
.zps-textarea { min-height: 140px; resize: vertical; line-height: 1.6; }
.zps-editrow { display: flex; gap: 8px; align-items: center; justify-content: flex-end; }
.zps-spacer { flex: 1 1 auto; }
/* 编辑框里的 @ 候选面板（标题框、正文框都用）：顶部类别栏 + 候选列表。 */
.zps-mentionpanel {
  display: flex;
  flex-direction: column;
  margin-top: -2px;
  padding: 4px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1);
}
.zps-mentiontabs {
  display: flex;
  gap: 2px;
  padding: 3px 3px 5px;
  margin-bottom: 2px;
  overflow-x: auto;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.zps-mentiontab {
  flex: 0 0 auto;
  padding: 2px 8px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
  cursor: pointer;
}
.zps-mentiontab.chosen {
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
}
.zps-mentionlist {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 220px;
  overflow-y: auto;
}
.zps-mentionrow {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-height: 30px;
  padding: 5px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.zps-mentionrow:hover,
.zps-mentionrow.chosen { background: var(--dsw-alias-bg-layer-2); }
.zps-mentionicon { flex: none; color: var(--dsw-alias-label-secondary); }
.zps-mentiontitle {
  flex: 0 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.zps-mentiondesc {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
}
.zps-mentionempty { padding: 8px; color: var(--dsw-alias-label-secondary); font-size: 12px; }
.zps-mentionsection {
  padding: 6px 8px 2px;
  font-size: 11px;
  color: var(--dsw-alias-label-secondary);
}
/* 回收站：最近删除的条目，保留天数可调。 */
.zps-trash {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-layer-1);
}
.zps-trashhead {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
}
.zps-trashdays { display: inline-flex; align-items: center; gap: 4px; margin-left: auto; }
.zps-daysinput {
  box-sizing: border-box;
  width: 60px;
  height: 22px;
  padding: 0 6px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: var(--dsw-radius-sm);
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
}
.zps-daysinput:focus { outline: none; border-color: var(--dsw-alias-brand-primary); }
.zps-trashrow { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.zps-trashname {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dsw-alias-label-primary);
}
.zps-trashdaysleft { flex: none; color: var(--dsw-alias-label-secondary); }
`

/** 一条记录的形状校验：正文为空的丢掉。 */
function normalizeItem(raw) {
  if (!raw || typeof raw !== 'object') return null
  const text = typeof raw.text === 'string' ? raw.text : ''
  if (!text.trim()) return null
  const id = typeof raw.id === 'string' && raw.id ? raw.id : 'p_' + Math.random().toString(36).slice(2, 10)
  return {
    id,
    title: typeof raw.title === 'string' ? raw.title : '',
    text,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : 0,
    usedAt: typeof raw.usedAt === 'number' ? raw.usedAt : 0,
  }
}

/** 回收站默认保留天数。 */
const DEFAULT_TRASH_DAYS = 3
/** 保留天数可调上限。 */
const MAX_TRASH_DAYS = 365
/** 一天有多少毫秒。 */
const DAY_MS = 24 * 60 * 60 * 1000

/** 把天数收进 1~365 的整数区间。 */
function clampDays(value) {
  const days = Math.round(Number(value))
  if (!Number.isFinite(days)) return DEFAULT_TRASH_DAYS
  return Math.min(MAX_TRASH_DAYS, Math.max(1, days))
}

/** 回收站条目：原条目 + 删除时间。 */
function normalizeTrashEntry(raw) {
  const base = normalizeItem(raw)
  if (!base) return null
  const deletedAt = raw && typeof raw.deletedAt === 'number' ? raw.deletedAt : 0
  return { ...base, deletedAt }
}

/** 按保留天数筛掉过期的回收站条目。 */
function purgeTrash(trash, days) {
  const ttl = clampDays(days) * DAY_MS
  const now = Date.now()
  return trash.filter((entry) => now - entry.deletedAt < ttl)
}

/** 回收站条目还剩几天被清掉（最少 0）。 */
function trashDaysLeft(deletedAt, days) {
  const left = deletedAt + clampDays(days) * DAY_MS - Date.now()
  return Math.max(0, Math.ceil(left / DAY_MS))
}

/** 浏览器侧最近一次状态：宿主文件是唯一真源，这里放首屏兜底与 @ 触发来源要的同步读。 */
let stateCache = { items: [], trash: [], trashDays: DEFAULT_TRASH_DAYS }

/** 宿主状态路由（相对 document.baseURI 拼，端口变了也不会拼错）。 */
function apiUrl() {
  const relative = String(API_URL).replace(/^\/+/, '')
  if (typeof document === 'undefined') return '/' + relative
  const url = new URL(relative, document.baseURI)
  return url.pathname + url.search
}

/** 本地缓存：首屏兜底与宿主路由不可用时的只读来源。 */
function readLocalCache() {
  let items = []
  let trash = []
  let trashDays = DEFAULT_TRASH_DAYS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const list = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.items) ? parsed.items : [])
      items = list.map(normalizeItem).filter(Boolean)
      const trashList = parsed && Array.isArray(parsed.trash) ? parsed.trash : []
      trash = trashList.map(normalizeTrashEntry).filter(Boolean)
      trashDays = parsed && parsed.trashDays !== undefined ? clampDays(parsed.trashDays) : DEFAULT_TRASH_DAYS
    }
  } catch {
    // 缓存损坏按空处理（不让一条坏 JSON 把入口废掉）
  }
  return { items, trash: purgeTrash(trash, trashDays), trashDays }
}

/** 记住最近一次状态，并顺手写一份本地缓存。 */
function cacheState(state) {
  stateCache = {
    items: state.items,
    trash: purgeTrash(state.trash, state.trashDays),
    trashDays: state.trashDays,
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 2, ...stateCache }))
  } catch {
    // 缓存写不进去不影响文件保存
  }
}

/** @ 触发来源要同步读，用它取最近一次状态。 */
function currentState() {
  return stateCache
}

/** 从宿主文件读状态；失败时带错误说明回来（界面据此提示、并避免覆盖文件）。 */
async function fetchState() {
  try {
    const res = await fetch(apiUrl(), { headers: { accept: 'application/json' } })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data || data.ok === false) {
      return { state: null, error: (data && data.error) || ('HTTP ' + res.status) }
    }
    const raw = data.state || {}
    return {
      state: {
        items: (Array.isArray(raw.items) ? raw.items : []).map(normalizeItem).filter(Boolean),
        trash: (Array.isArray(raw.trash) ? raw.trash : []).map(normalizeTrashEntry).filter(Boolean),
        trashDays: raw.trashDays === undefined ? DEFAULT_TRASH_DAYS : clampDays(raw.trashDays),
      },
      error: data.error || null,
    }
  } catch (error) {
    return { state: null, error: String((error && error.message) || error) }
  }
}

/** 把状态写回宿主文件；成功返回 true。 */
async function pushState(state) {
  try {
    const res = await fetch(apiUrl(), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: state.items, trash: state.trash, trashDays: state.trashDays }),
    })
    const data = await res.json().catch(() => null)
    return !!(res.ok && data && data.ok !== false)
  } catch {
    return false
  }
}

/** 最近用过的排前面；没用过的按创建时间。 */
function sortItems(items) {
  return items.slice().sort((a, b) => (b.usedAt || b.createdAt || 0) - (a.usedAt || a.createdAt || 0))
}

/** 正文首行。 */
function firstLine(text) {
  const line = String(text || '').trim().split(/\r?\n/)[0] || ''
  return line.trim()
}

/** 卡片标题。 */
function titleOf(item) {
  const custom = String(item.title || '').trim()
  if (custom) return custom
  const line = firstLine(item.text)
  return line ? line.slice(0, TITLE_MAX) : '未命名'
}

/** 菜单里一行说明：正文压成单行并截断。 */
function compactPreview(text) {
  const compact = String(text || '').replace(/\s+/g, ' ').trim()
  return compact.length > 60 ? compact.slice(0, 60) + '…' : compact
}

/**
 * 输入框的 @ 触发来源：打 @ 就能选常用提示词，选中后把条目正文插到触发段。
 * 走宿主公开的 inputTriggers.registerSource（与宿主的 @ 文件/会话来源并列），不碰编辑器。
 */
function createPromptSource() {
  /** 优先用窗口组件刚拉到的状态；组件还没拉到就退回本地缓存（两者保存时同步写）。 */
  const knownItems = () => {
    const live = currentState().items
    return live.length > 0 ? live : readLocalCache().items
  }
  return {
    trigger: '@',
    name: '常用提示词',
    // 20：排在「工作区文件」(10) 之后、「历史会话」(30) 之前，和别的 @ 源同序时顺序稳定。
    order: 20,
    async candidates(_session, req) {
      const keyword = String(req.query || '').trim().toLowerCase()
      const used = new Map()
      return sortItems(knownItems())
        .filter((item) => !keyword
          || (titleOf(item) + '\n' + item.text).toLowerCase().includes(keyword))
        .slice(0, 20)
        .map((item) => {
          const base = titleOf(item)
          const seen = (used.get(base) || 0) + 1
          used.set(base, seen)
          return {
            name: seen === 1 ? base : base + ' #' + seen,
            description: compactPreview(item.text),
            value: item.id,
          }
        })
    },
    // 纯文本出口：返回 { text } 换掉触发词，草稿里只有文字、不生成引用卡片——
    // 所以这个源不需要 codec。哪天改成返回 { insert: { source: … } } 插卡片，
    // 就必须同时补 codec，否则发送会报 slash: no serializer for reference source "常用提示词"。
    onPick(pick) {
      const id = pick.candidate.value
      const item = knownItems().find((it) => it.id === id)
      if (!item) return undefined
      // 普通文本替换掉「@查询段」，变量占位符原样留在正文里，进输入框后再改。
      return { text: item.text }
    },
  }
}

/** 模板占位符：{{名称}} 或 {{名称=默认值}}。 */
const VAR_PATTERN = /\{\{\s*([^{}\n]+?)\s*\}\}/g

/** 拆出一个占位符的名称与默认值。 */
function varParts(body) {
  const cut = body.indexOf('=')
  const name = (cut >= 0 ? body.slice(0, cut) : body).trim() || '变量'
  const fallback = cut >= 0 ? body.slice(cut + 1) : ''
  return { name, fallback }
}

/**
 * 把正文拆成「文字 / 变量」段，按出现顺序排。
 * @param text - 正文原文（含占位符）。
 * @returns 分段列表；没有占位符时只有一段文字。
 */
function parseTemplate(text) {
  const source = String(text || '')
  const parts = []
  let last = 0
  let match = null
  VAR_PATTERN.lastIndex = 0
  while ((match = VAR_PATTERN.exec(source)) !== null) {
    if (match.index > last) parts.push({ type: 'text', value: source.slice(last, match.index) })
    const parsed = varParts(match[1])
    parts.push({ type: 'var', name: parsed.name, fallback: parsed.fallback })
    last = match.index + match[0].length
  }
  if (last < source.length) parts.push({ type: 'text', value: source.slice(last) })
  return parts
}

/** 某个变量当前的取值（没填过用默认值）。 */
function templateValue(values, name, fallback) {
  const given = values ? values[name] : undefined
  return given !== undefined && given !== null ? given : (fallback || '')
}

/**
 * 用当前变量值把正文填成最终文本。
 * @param text - 正文原文（含占位符）。
 * @param values - 这张卡片的变量取值表。
 * @returns 替换后的文本。
 */
function fillTemplate(text, values) {
  return String(text || '').replace(VAR_PATTERN, (whole, body) => {
    const parsed = varParts(body)
    return templateValue(values, parsed.name, parsed.fallback)
  })
}

/** 正文里有没有占位符（决定卡片是否渲染成可填表）。 */
function hasVars(text) {
  VAR_PATTERN.lastIndex = 0
  return VAR_PATTERN.test(String(text || ''))
}

/** 书签图标（入口用）。 */
function ShelfIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M4 2.5h8a1 1 0 0 1 1 1V14l-5-3.2L3 14V3.5a1 1 0 0 1 1-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** 关闭图标（标题栏用）。 */
function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

/**
 * 在文字里找光标前最近的一个 @ 触发词。
 * @param value - 当前整段文字。
 * @param caret - 光标位置。
 * @returns { start, end, query } 或 null（@ 前必须是空白或开头，@ 后不能含空白）。
 */
function mentionAt(value, caret) {
  const text = String(value || '')
  const pos = typeof caret === 'number' ? caret : text.length
  const before = text.slice(0, pos)
  const at = before.lastIndexOf('@')
  if (at < 0) return null
  const query = before.slice(at + 1)
  if (/[\s@]/.test(query)) return null
  if (at > 0 && !/\s/.test(before[at - 1])) return null
  return { start: at, end: pos, query }
}

/** 刚敲下一个 @：长度只多 1，且新字符就是 @。打开候选菜单的时机只认这个。 */
function typedAtChar(previous, next, caret) {
  return String(next || '').length === String(previous || '').length + 1 && String(next || '').charAt(caret - 1) === '@'
}

/** 行首图标：文件 / 文件夹 / 对话 / 插件（与输入框 @ 菜单同一套观感）。 */
function MentionIcon(props) {
  const kind = props.kind
  const d = kind === 'folder'
    ? 'M1.8 4.2h3.4l1.2 1.3h5.8v6.1H1.8z'
    : kind === 'session'
      ? 'M2 3.6h10v6.1H6.6L4.2 11.7V9.7H2z'
      : kind === 'plugin'
        ? 'M3.2 3.2h7.6v7.6H3.2zM3.2 6.4h7.6M6.4 3.2v7.6'
        : 'M4 1.9h4.4L10.9 4.4v7.7H4z'
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
      strokeWidth="1.1" strokeLinejoin="round" aria-hidden className="zps-mentionicon">
      <path d={d} />
      {kind === 'file' ? <path d="M8.4 1.9v2.5h2.5" /> : null}
    </svg>
  )
}

/** 类别标签（与输入框里那套一致：点标签只看该类）。 */
const MENTION_TABS = ['文件与文件夹', '对话', '插件']

/** @ 候选列表：顶部类别栏 + 当前类别的候选，点一项即插入。 */
function MentionMenu(props) {
  const rows = props.rows
  const chosen = props.chosen
  const active = props.active || null
  const visible = rows
  return (
    <div className="zps-mentionpanel">
      <div className="zps-mentiontabs" role="tablist" aria-label="候选类别">
        <button
          type="button"
          role="tab"
          aria-selected={active === null}
          className={active === null ? 'zps-mentiontab chosen' : 'zps-mentiontab'}
          onMouseDown={(event) => { event.preventDefault(); props.onSelect(null) }}
        >
          全部
        </button>
        {MENTION_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={active === tab}
            className={active === tab ? 'zps-mentiontab chosen' : 'zps-mentiontab'}
            onMouseDown={(event) => { event.preventDefault(); props.onSelect(tab) }}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="zps-mentionlist" role="listbox" aria-label="候选">
        {visible.length === 0 ? (
          <div className="zps-mentionempty">{props.emptyText || '这一类没有候选'}</div>
        ) : visible.map((row, index) => {
          const above = index > 0 ? visible[index - 1] : null
          const heading = active === null && row.section && (!above || above.section !== row.section)
          return (
            <Fragment key={row.id}>
              {heading ? <div className="zps-mentionsection">{row.section}</div> : null}
              <button
                type="button"
                role="option"
                aria-selected={index === chosen}
                className={index === chosen ? 'zps-mentionrow chosen' : 'zps-mentionrow'}
                onMouseDown={(event) => { event.preventDefault(); props.onPick(row) }}
              >
                {row.icon ? <MentionIcon kind={row.icon} /> : null}
                <span className="zps-mentiontitle">{row.label}</span>
                {row.desc && row.desc !== row.label
                  ? <span className="zps-mentiondesc">{row.desc}</span>
                  : null}
              </button>
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

/**
 * 输入框里的 @ 候选状态：标题框、正文框、卡片上的变量框共用同一套。
 * 触发规则与宿主一致：@ 在行首或空白之后、@ 后不含空白，才算触发词。
 * @param listFiles - 查候选：query → 行数组（[{ id, label, desc, section, mention }]）。
 * @param applyPick - 选中一行后怎么改值：applyPick(row, menu)，menu 带 { field, start, end, query }。
 * @returns track（输入变化时喂）、onKeyDown（键盘）、rows / chosen / activeSection / setActiveSection / setChosen（菜单渲染）、close。
 */
function useMentionField(listFiles, applyPick) {
  const [menu, setMenu] = useState(null)
  const [chosen, setChosen] = useState(0)
  const [activeSection, setActiveSection] = useState(null)
  const [hits, setHits] = useState([])
  const fetchTimer = useRef(0)
  const fetchSeq = useRef(0)

  /** 按查询词问一下宿主：工作区里有哪些文件/文件夹。 */
  const refreshHits = useCallback((query) => {
    window.clearTimeout(fetchTimer.current)
    const seq = ++fetchSeq.current
    fetchTimer.current = window.setTimeout(() => {
      const ask = listFiles
      if (typeof ask !== 'function') {
        setHits([])
        return
      }
      Promise.resolve(ask(query)).then((list) => {
        if (seq !== fetchSeq.current) return
        setHits(Array.isArray(list) ? list.slice(0, 20) : [])
      }).catch(() => {
        if (seq === fetchSeq.current) setHits([])
      })
    }, 120)
  }, [listFiles])

  useEffect(() => () => window.clearTimeout(fetchTimer.current), [])

  /**
   * 喂一次输入变化。
   * @param field - 哪个输入框（同一个 hook 服务多个框时用来隔离）。
   * @param value - 变化后的整段文字。
   * @param caret - 光标位置。
   * @param typedAt - 本次变化是不是刚敲下 @。
   */
  const track = useCallback((field, value, caret, typedAt) => {
    const pos = typeof caret === 'number' && caret > 0 ? caret : String(value || '').length
    const hit = mentionAt(value, pos)
    if (typedAt) {
      if (!hit) {
        setMenu(null)
        return
      }
      setMenu({ field, start: hit.start, end: hit.end, query: hit.query })
      setChosen(0)
      setActiveSection(null)
      refreshHits(hit.query)
      return
    }
    setMenu((prev) => {
      if (!prev || prev.field !== field) return prev
      if (!hit) return null
      refreshHits(hit.query)
      return { field, start: hit.start, end: hit.end, query: hit.query }
    })
  }, [refreshHits])

  const close = useCallback(() => setMenu(null), [])

  /** 类别栏筛选后的可见行。 */
  const rows = activeSection ? hits.filter((row) => row.section === activeSection) : hits

  /** 选中一行：关菜单，把「@查询段」交给调用方替换成 row.mention。 */
  const pick = useCallback((row) => {
    if (!menu || !row) return
    const settled = menu
    setMenu(null)
    applyPick(row, settled)
  }, [applyPick, menu])

  /** 菜单打开时的键盘：上下选、回车/制表选中、Esc 关。返回 true 表示已处理。 */
  const onKeyDown = useCallback((event) => {
    if (!menu) return false
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (rows.length > 0) {
        const step = event.key === 'ArrowDown' ? 1 : -1
        setChosen((prev) => (prev + step + rows.length) % rows.length)
      }
      return true
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      const row = rows[Math.min(chosen, Math.max(0, rows.length - 1))] || rows[0]
      if (row) pick(row)
      return true
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setMenu(null)
      return true
    }
    return false
  }, [chosen, menu, pick, rows])

  return { menu, rows, chosen, activeSection, setActiveSection, setChosen, track, onKeyDown, close }
}

/**
 * 一张卡片的编辑表单（新建与编辑共用）：标题 + 正文 +「＋ 变量」。
 * 两个输入框里都能打 @ 选已有常用提示词：标题框插「名」，正文框插「整段正文」。
 * 「＋ 变量」把 {{变量}} 插到正文编辑框的光标处，并把「变量」两字选中——直接打字就是改名。
 * @param props.editing - 正在编辑的草稿 {id, title, text}。
 * @param props.onTitle - 标题变更。
 * @param props.onText - 正文变更。
 * @param props.onCancel - 退出编辑。
 * @param props.onSave - 保存。
 */
function TemplateEditor(props) {
  const editing = props.editing
  const onTitle = props.onTitle
  const onText = props.onText
  const onCancel = props.onCancel
  const onSave = props.onSave
  const titleRef = useRef(null)
  const textareaRef = useRef(null)
  const prevValue = useRef('')

  /** 选中一行：把「@查询段」换成 row.mention，光标落在插入内容之后。 */
  const applyMention = useCallback((row, menu) => {
    const isTitle = menu.field === 'title'
    const current = isTitle ? String(editing.title || '') : String(editing.text || '')
    const next = current.slice(0, menu.start) + row.mention + current.slice(menu.end)
    if (isTitle) onTitle(next)
    else onText(next)
    const caret = menu.start + row.mention.length
    prevValue.current = next
    window.requestAnimationFrame(() => {
      const el = isTitle ? titleRef.current : textareaRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(caret, caret)
    })
  }, [editing, onText, onTitle])

  const mention = useMentionField(props.listFiles, applyMention)

  const insertVariable = useCallback(() => {
    const node = textareaRef.current
    const text = String(editing.text || '')
    const start = node && typeof node.selectionStart === 'number' ? node.selectionStart : text.length
    const end = node && typeof node.selectionEnd === 'number' ? node.selectionEnd : start
    const token = '{{变量}}'
    onText(text.slice(0, start) + token + text.slice(end))
    window.requestAnimationFrame(() => {
      const next = textareaRef.current
      if (!next) return
      next.focus()
      next.setSelectionRange(start + 2, start + 4)
    })
  }, [editing.text, onText])

  return (
    <div className="zps-editform">
      <input
        ref={titleRef}
        className="zps-field"
        value={editing.title}
        placeholder="标题（可空，默认取正文首行；打 @ 可引用工作区文件）"
        onChange={(event) => {
          const value = event.target.value
          const caret = event.target.selectionStart || 0
          const typedAt = typedAtChar(prevValue.current, value, caret)
          prevValue.current = value
          onTitle(value)
          mention.track('title', value, caret, typedAt)
        }}
        onKeyDown={(event) => { mention.onKeyDown(event) }}
      />
      <textarea
        ref={textareaRef}
        className="zps-field zps-textarea"
        value={editing.text}
        placeholder="提示词正文（打 @ 可引用工作区文件）"
        onChange={(event) => {
          const value = event.target.value
          const caret = event.target.selectionStart || 0
          const typedAt = typedAtChar(prevValue.current, value, caret)
          prevValue.current = value
          onText(value)
          mention.track('text', value, caret, typedAt)
        }}
        onKeyDown={(event) => {
          if (mention.onKeyDown(event)) return
          if (event.isComposing || event.repeat) return
          const key = String(event.key || '').toLowerCase()
          // Alt+V（两键最省力）；Ctrl+Alt+V 是备用（输入法拦 Alt 时用）。
          if (key !== 'v' || event.shiftKey || !event.altKey) return
          event.preventDefault()
          insertVariable()
        }}
      />
      <div className="zps-hint">{TEMPLATE_HINT}</div>
      <div className="zps-editrow">
        <button
          type="button"
          className="zps-btn"
          title="在光标处插入 {{变量}}（Alt+V，或 Ctrl+Alt+V）——插完直接打字就是改变量名"
          onClick={insertVariable}
        >
          ＋ 变量
        </button>
        <span className="zps-spacer" />
        <button type="button" className="zps-btn" onClick={onCancel}>取消</button>
        <button type="button" className="zps-btn primary" onClick={onSave}>保存</button>
      </div>
      {mention.menu
        ? (
          <MentionMenu
            rows={mention.rows}
            active={mention.activeSection}
            onSelect={(key) => { mention.setActiveSection(key); mention.setChosen(0) }}
            chosen={mention.chosen}
            onPick={(row) => mention.pick(row)}
          />
        )
        : null}
    </div>
  )
}

/**
 * 卡片正文里的一个变量输入框：直接填值；打 @ 也能选工作区文件、对话、插件。
 * 候选浮层 portal 到 document.body——卡片列表是滚动容器，就地渲染会被裁掉。
 * @param props.value - 当前取值。
 * @param props.name - 变量名（占位文字）。
 * @param props.fallback - 默认值。
 * @param props.onChange - 值变化。
 * @param props.listFiles - @ 候选来源。
 */
function VarField(props) {
  const value = String(props.value || '')
  const onChange = props.onChange
  const inputRef = useRef(null)
  const prevValue = useRef(value)
  /** 候选浮层的位置：相对视口的 fixed 坐标。 */
  const [anchor, setAnchor] = useState(null)

  /** 选中一行：把「@查询段」换成 row.mention。 */
  const applyMention = useCallback((row, menu) => {
    const current = String(props.value || '')
    const next = current.slice(0, menu.start) + row.mention + current.slice(menu.end)
    onChange(next)
    prevValue.current = next
    const caret = menu.start + row.mention.length
    window.requestAnimationFrame(() => {
      const el = inputRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(caret, caret)
    })
  }, [onChange, props.value])

  const mention = useMentionField(props.listFiles, applyMention)
  const open = mention.menu !== null

  /** 菜单打开时按输入框的位置摆浮层：下方放不下就翻到上方。 */
  useEffect(() => {
    if (!open) {
      setAnchor(null)
      return undefined
    }
    const place = () => {
      const el = inputRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const width = Math.max(280, Math.min(420, rect.width + 240))
      const height = 248
      const below = rect.bottom + 4 + height <= window.innerHeight
      setAnchor({
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        top: below ? rect.bottom + 4 : Math.max(8, rect.top - 4 - height),
        width,
      })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  return (
    <div className="zps-varwrap">
      <input
        ref={inputRef}
        className="zps-var"
        value={value}
        placeholder={props.name}
        title={'变量：' + props.name + '（默认值：' + (props.fallback || '空') + '；打 @ 可引用工作区文件）'}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onBlur={() => mention.close()}
        onChange={(event) => {
          const next = event.target.value
          const caret = event.target.selectionStart || 0
          const typedAt = typedAtChar(prevValue.current, next, caret)
          prevValue.current = next
          onChange(next)
          mention.track('var', next, caret, typedAt)
        }}
        onKeyDown={(event) => mention.onKeyDown(event)}
      />
      {open && anchor
        ? createPortal(
          <div className="zps-varmenu" style={{ left: anchor.left, top: anchor.top, width: anchor.width }}>
            <MentionMenu
              rows={mention.rows}
              active={mention.activeSection}
              onSelect={(key) => { mention.setActiveSection(key); mention.setChosen(0) }}
              chosen={mention.chosen}
              onPick={(row) => mention.pick(row)}
            />
          </div>,
          document.body,
        )
        : null}
    </div>
  )
}

/**
 * 输入栏下方的入口与独立大窗口（窗口内一条提示词一张卡片）。
 * @param props - slot 标准 props：useInput（草稿选择器）与 inputActions（输入动作）。
 */
export function PromptShelf(props) {
  const useInput = props && typeof props.useInput === 'function' ? props.useInput : null
  const inputActions = props ? props.inputActions : undefined
  const draft = String((useInput ? useInput((s) => s.draft) : EMPTY_INPUT.draft) || '')

  const [items, setItems] = useState(() => readLocalCache().items)
  const [trash, setTrash] = useState(() => readLocalCache().trash)
  const [trashDays, setTrashDays] = useState(() => readLocalCache().trashDays)
  const [showTrash, setShowTrash] = useState(false)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [flash, setFlash] = useState('')
  /** 每张卡片的变量取值：{ [itemId]: { [变量名]: 值 } }。 */
  const [varValues, setVarValues] = useState({})

  const flashTimer = useRef(0)
  const triggerRef = useRef(null)
  const searchRef = useRef(null)

  const notify = useCallback((text) => {
    setFlash(text)
    window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(''), 2600)
  }, [])

  useEffect(() => () => window.clearTimeout(flashTimer.current), [])

  /** 挂载即从宿主文件读一次：浏览器缓存只兜底，文件才是真源。 */
  useEffect(() => {
    let alive = true
    fetchState().then(({ state, error }) => {
      if (!alive) return
      if (state) {
        cacheState(state)
        setItems(sortItems(state.items))
        setTrash(state.trash)
        setTrashDays(state.trashDays)
      } else if (error) {
        // 路由不可用或文件坏了：保留本地缓存，并把原因说出来，不静默。
        notify('读不到状态文件：' + error)
      }
    })
    return () => { alive = false }
  }, [notify])

  /** 打开窗口：先用缓存立刻画出，再向宿主文件要最新一份（别的标签页/窗口可能改过）。 */
  const openDialog = useCallback(() => {
    const local = readLocalCache()
    setItems(sortItems(local.items))
    setTrash(local.trash)
    setTrashDays(local.trashDays)
    setEditing(null)
    setExpandedId(null)
    setShowTrash(false)
    setFlash('')
    setOpen(true)
    fetchState().then(({ state, error }) => {
      if (state) {
        cacheState(state)
        setItems(sortItems(state.items))
        setTrash(state.trash)
        setTrashDays(state.trashDays)
      } else if (error) {
        notify('读不到状态文件：' + error)
      }
    })
  }, [notify])

  /** 关闭窗口并把焦点还给入口。 */
  const closeDialog = useCallback(() => {
    setOpen(false)
    setEditing(null)
    const trigger = triggerRef.current
    if (trigger && typeof trigger.focus === 'function') trigger.focus()
  }, [])

  /** 打开后把焦点放到搜索框（键盘用户可直接输）。 */
  useEffect(() => {
    if (!open) return
    const input = searchRef.current
    if (input && typeof input.focus === 'function') input.focus()
  }, [open])

  /** Esc 关闭：先退编辑，再关窗口。 */
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key !== 'Escape' || event.ctrlKey || event.altKey || event.metaKey) return
      event.preventDefault()
      if (editing) setEditing(null)
      else closeDialog()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, editing, closeDialog])

  /** 把内存里的状态写回宿主文件（条目 / 回收站 / 保留天数）；写失败留一句提示，不回滚界面。 */
  const commit = useCallback((nextItems, nextTrash = trash, nextDays = trashDays) => {
    setItems(nextItems)
    setTrash(nextTrash)
    setTrashDays(nextDays)
    const state = { items: nextItems, trash: nextTrash, trashDays: nextDays }
    cacheState(state)
    pushState(state).then((ok) => {
      if (!ok) notify('保存到状态文件失败：这次改动只在当前页面里')
    })
  }, [notify, trash, trashDays])

  /** 记住一条的使用时间。 */
  const markUsed = useCallback((id) => {
    commit(items.map((it) => (it.id === id ? { ...it, usedAt: Date.now() } : it)))
  }, [commit, items])

  /** 把条目送进输入框：有变量先按卡片里填的值替换，再插到光标处；插不进去就明说，不静默覆盖。 */
  const send = useCallback((item, mode) => {
    const api = inputActions
    const finalText = fillTemplate(item.text, varValues[item.id])
    if (!api) {
      notify('没有可用的输入框')
      return
    }
    if (mode === 'replace') {
      try {
        api.setDraft(finalText)
        markUsed(item.id)
        notify('已替换为这条提示词')
      } catch {
        notify('替换失败：输入框正忙')
      }
      return
    }
    try {
      if (typeof api.captureInsertion === 'function' && typeof api.insertText === 'function') {
        const span = api.captureInsertion()
        if (api.insertText(finalText, span)) {
          markUsed(item.id)
          notify('已插入到光标处')
          return
        }
        notify('插入未生效：输入框刚变化或正在提交，可改用「替换」')
        return
      }
    } catch {
      // 落到下面的兜底
    }
    if (typeof api.setDraft === 'function') {
      api.setDraft(finalText)
      markUsed(item.id)
      notify('已填入输入框')
      return
    }
    notify('这个输入框不能写入')
  }, [inputActions, markUsed, notify, varValues])

  /** 记下一个变量的取值（只作用于这一张卡片）。 */
  const setVar = useCallback((itemId, name, value) => {
    setVarValues((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || {}), [name]: value },
    }))
  }, [])

  /** 把当前草稿存成一条；输入框为空时什么都不做，也不弹提示。 */
  const saveCurrent = useCallback(() => {
    const text = draft.trim()
    if (!text) return
    if (items.some((it) => it.text.trim() === text)) {
      notify('这条已经在列表里了')
      return
    }
    const now = Date.now()
    const item = {
      id: 'p_' + now.toString(36) + Math.random().toString(36).slice(2, 6),
      title: '',
      text,
      createdAt: now,
      usedAt: 0,
    }
    commit([item, ...items])
    notify('已存为常用提示词')
  }, [commit, draft, items, notify])

  /** 打开一张空卡片，直接在窗口里写一条（不依赖输入框里先写好内容）。 */
  const startCreate = useCallback(() => {
    setEditing({ id: null, title: '', text: '' })
    setExpandedId(null)
    setQuery('')
  }, [])

  /** 删除一条：进回收站，保留 trashDays 天。 */
  const remove = useCallback((id) => {
    const target = items.find((it) => it.id === id)
    if (!target) return
    commit(
      items.filter((it) => it.id !== id),
      purgeTrash([{ ...target, deletedAt: Date.now() }, ...trash], trashDays),
    )
    setEditing((prev) => (prev && prev.id === id ? null : prev))
    setExpandedId((prev) => (prev === id ? null : prev))
    notify('已移到回收站，保留 ' + trashDays + ' 天')
  }, [commit, items, notify, trash, trashDays])

  /** 从回收站恢复一条。 */
  const restore = useCallback((id) => {
    const target = trash.find((it) => it.id === id)
    if (!target) return
    const entry = { ...target }
    delete entry.deletedAt
    commit([entry, ...items], trash.filter((it) => it.id !== id))
    notify('已恢复')
  }, [commit, items, notify, trash])

  /** 调整保留天数：立即按新天数清理过期条目。 */
  const changeTrashDays = useCallback((raw) => {
    const days = clampDays(raw)
    setTrashDays(days)
    commit(items, purgeTrash(trash, days), days)
  }, [commit, items, trash])

  /** 保存编辑；editing.id 为 null 表示这是一张新建卡。 */
  const saveEdit = useCallback(() => {
    if (!editing) return
    const text = editing.text.trim()
    if (!text) {
      notify('正文不能为空，写点内容再保存')
      return
    }
    const title = editing.title.trim()
    if (editing.id === null) {
      const now = Date.now()
      const item = {
        id: 'p_' + now.toString(36) + Math.random().toString(36).slice(2, 6),
        title,
        text,
        createdAt: now,
        usedAt: 0,
      }
      commit([item, ...items])
      setEditing(null)
      notify('已新建一条')
      return
    }
    commit(items.map((it) => (it.id === editing.id ? { ...it, title, text } : it)))
    setEditing(null)
    notify('已保存修改')
  }, [commit, editing, items, notify])

  const visible = useMemo(() => {
    const list = sortItems(items)
    const keyword = query.trim().toLowerCase()
    if (!keyword) return list
    return list.filter((it) => ((it.title || '') + '\n' + it.text).toLowerCase().includes(keyword))
  }, [items, query])

  /** 动作按钮会抢焦点，mousedown 一律拦掉，编辑器选区才不会被清。 */
  const keepFocus = useCallback((event) => { event.preventDefault() }, [])

  const overlay = open
    ? createPortal(
      <div className="zps-overlay" role="presentation">
        <div className="zps-mask" aria-hidden="true" onClick={closeDialog} />
        <div className="zps-dialog" role="dialog" aria-modal="true" aria-label="常用提示词" tabIndex={-1}>
          <div className="zps-head">
            <h2 className="zps-heading">
              常用提示词
              <span className="zps-headmeta">{items.length > 0 ? items.length + ' 条' : ''}</span>
            </h2>
            <button type="button" className="zps-iconbtn" aria-label="关闭" onClick={closeDialog}>
              <CloseIcon />
            </button>
          </div>

          <div className="zps-toolbar">
            <input
              ref={searchRef}
              className="zps-search"
              value={query}
              placeholder="搜索标题或正文"
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="button" className="zps-btn" onClick={startCreate}>＋ 新建</button>
            <button
              type="button"
              className="zps-btn"
              title="最近删除的条目在这里保留一段时间，可恢复；保留天数可调"
              onClick={() => setShowTrash((value) => !value)}
            >
              回收站{trash.length > 0 ? ' ' + trash.length : ''}
            </button>
            <button
              type="button"
              className="zps-btn primary"
              title="把输入框里的内容存成一条常用提示词"
              onClick={saveCurrent}
            >
              存入当前输入
            </button>
          </div>

          <div className="zps-cards">
            {editing !== null && editing.id === null ? (
              <article className="zps-card">
                <div className="zps-cardhead">
                  <h3 className="zps-cardtitle">新条目</h3>
                </div>
                <TemplateEditor
                  editing={editing}
                  onTitle={(title) => setEditing({ ...editing, title })}
                  onText={(text) => setEditing({ ...editing, text })}
                  onCancel={() => setEditing(null)}
                  onSave={saveEdit}
                  listFiles={props.listFiles}
                />
              </article>
            ) : null}
            {showTrash ? (
              <div className="zps-trash">
                <div className="zps-trashhead">
                  <span>最近删除{trash.length > 0 ? '（' + trash.length + ' 条）' : ''}</span>
                  <label className="zps-trashdays">
                    保留
                    <input
                      className="zps-daysinput"
                      type="number"
                      min="1"
                      max={MAX_TRASH_DAYS}
                      value={trashDays}
                      onChange={(event) => changeTrashDays(event.target.value)}
                    />
                    天
                  </label>
                  <button type="button" className="zps-btn" onClick={() => setShowTrash(false)}>收起</button>
                </div>
                {trash.length === 0 ? (
                  <div className="zps-hint">还没有删除的条目。</div>
                ) : (
                  trash.map((entry) => (
                    <div className="zps-trashrow" key={entry.id}>
                      <span className="zps-trashname">{titleOf(entry)}</span>
                      <span className="zps-trashdaysleft">{trashDaysLeft(entry.deletedAt, trashDays)} 天后清除</span>
                      <button type="button" className="zps-btn" onClick={() => restore(entry.id)}>恢复</button>
                    </div>
                  ))
                )}
              </div>
            ) : null}
            {visible.length === 0 ? (
              <div className="zps-placeholder">
                {items.length === 0
                  ? '还没有条目。两种建法：点上方「＋ 新建」直接写一条；或先在下面输入框写好内容，再点「存入当前输入」。'
                  : '没有匹配的条目。'}
              </div>
            ) : (
              visible.map((item) => {
                const parts = parseTemplate(item.text)
                const varNames = parts.filter((part) => part.type === 'var').map((part) => part.name)
                const editingThis = editing !== null && editing.id === item.id
                return (
                  <article className="zps-card" key={item.id}>
                    <div className="zps-cardhead">
                      <h3 className="zps-cardtitle">{titleOf(item)}</h3>
                      {varNames.length > 0 ? (
                        <span className="zps-varbadge" title={'变量：' + varNames.join('、')}>
                          {varNames.length} 个变量
                        </span>
                      ) : null}
                      <div className="zps-cardactions">
                        <button type="button" className="zps-btn" onMouseDown={keepFocus} onClick={() => send(item, 'insert')}>
                          插入
                        </button>
                        <button type="button" className="zps-btn" onMouseDown={keepFocus} onClick={() => send(item, 'replace')}>
                          替换
                        </button>
                        <button
                          type="button"
                          className="zps-btn"
                          onMouseDown={keepFocus}
                          onClick={() => setEditing({ id: item.id, title: item.title || '', text: item.text })}
                        >
                          编辑
                        </button>
                        <button type="button" className="zps-btn danger" onMouseDown={keepFocus} onClick={() => remove(item.id)}>
                          删除
                        </button>
                      </div>
                    </div>
                    {editingThis ? (
                      <TemplateEditor
                        editing={editing}
                        onTitle={(title) => setEditing({ ...editing, title })}
                        onText={(text) => setEditing({ ...editing, text })}
                        onCancel={() => setEditing(null)}
                        onSave={saveEdit}
                        listFiles={props.listFiles}
                      />
                    ) : varNames.length > 0 ? (
                      <div className="zps-cardtext zps-cardtext-vars">
                        {parts.map((part, index) => (
                          part.type === 'text' ? (
                            <span key={index}>{part.value}</span>
                          ) : (
                            <VarField
                              key={index}
                              value={templateValue(varValues[item.id], part.name, part.fallback)}
                              name={part.name}
                              fallback={part.fallback}
                              onChange={(value) => setVar(item.id, part.name, value)}
                              listFiles={props.listFiles}
                            />
                          )
                        ))}
                      </div>
                    ) : (
                      <div
                        className="zps-cardtext"
                        data-expanded={expandedId === item.id ? 'true' : 'false'}
                        onClick={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
                        title="点击展开/收起"
                      >
                        {item.text}
                      </div>
                    )}
                  </article>
                )
              })
            )}
          </div>

          <div className="zps-foot">
            <span className="zps-flash" role="status">{flash}</span>
            <span className="zps-hint">插入＝光标处追加；替换＝整框换成这条；点正文展开/收起</span>
          </div>
        </div>
      </div>,
      document.body,
    )
    : null

  return (
    <>
      <div className="zps-root">
        <style>{CSS}</style>
        <button
          ref={triggerRef}
          type="button"
          className="zps-trigger"
          aria-expanded={open}
          title="常用提示词：存取与插入"
          onMouseDown={keepFocus}
          onClick={() => (open ? closeDialog() : openDialog())}
        >
          <ShelfIcon />
          <span>常用提示词</span>
          {items.length > 0 ? <span className="zps-count">{items.length}</span> : null}
        </button>
      </div>
      {overlay}
    </>
  )
}

/**
 * 造一个「按查询词列 @ 候选」的函数：与任务输入框一样分两组——文件与文件夹（宿主路由 /api/files）、
 * 对话（会话清单）。两者都只用本机数据，不依赖客户端的远程命名空间。
 * @param ctx - 客户端根上下文。
 * @returns 查询函数：query → 候选行 [{ id, label, desc, section, mention }]。
 */
function createMentionLister(ctx) {
  const sessions = typeof ctx.get === 'function' ? ctx.get('sessions') : undefined

  /** 当前工作区目录：优先打开中的会话，其次第一个带目录的会话。 */
  const cwdOf = () => {
    try {
      const byId = (sessions && sessions.list && sessions.list.getSnapshot().byId) || {}
      const ids = Object.keys(byId)
      const openId = ids.find((id) => byId[id] && byId[id].openState === 'open')
      const withCwd = ids.find((id) => byId[id] && byId[id].cwd)
      const id = openId || withCwd || ids[0]
      return id ? String(byId[id].cwd || '') : ''
    } catch {
      return ''
    }
  }

  const listFiles = async (query) => {
    const dir = cwdOf()
    if (!dir) return []
    try {
      const url = new URL(String(FILES_API).replace(/^\/+/, ''), document.baseURI)
      url.searchParams.set('dir', dir)
      url.searchParams.set('q', String(query || ''))
      const res = await fetch(url.pathname + url.search, { headers: { accept: 'application/json' } })
      const data = await res.json().catch(() => null)
      return data && data.ok && Array.isArray(data.items) ? data.items : []
    } catch {
      return []
    }
  }

  const listSessions = (query) => {
    try {
      const byId = (sessions && sessions.list && sessions.list.getSnapshot().byId) || {}
      const keyword = String(query || '').trim().toLowerCase()
      return Object.keys(byId)
        .map((id) => byId[id])
        .filter((entry) => entry && (entry.title || entry.displayTitle))
        .map((entry) => ({
          id: entry.id,
          title: String(entry.title || entry.displayTitle || '').trim(),
          updatedAt: entry.updatedAt || 0,
        }))
        .filter((entry) => entry.title)
        .filter((entry) => !keyword || entry.title.toLowerCase().includes(keyword))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 10)
    } catch {
      return []
    }
  }

  /** 已装插件清单：拉到后缓存 60 秒（清单不常变，避免每敲一个字都打路由）。 */
  const pluginCache = { at: 0, items: [] }
  const listPlugins = async (query) => {
    const now = Date.now()
    if (now - pluginCache.at > 60000) {
      try {
        const url = new URL(String(PLUGINS_API).replace(/^\/+/, ''), document.baseURI)
        const res = await fetch(url.pathname, { headers: { accept: 'application/json' } })
        const data = await res.json().catch(() => null)
        pluginCache.items = data && data.ok && Array.isArray(data.items) ? data.items : []
      } catch {
        pluginCache.items = []
      }
      pluginCache.at = now
    }
    const keyword = String(query || '').trim().toLowerCase()
    return pluginCache.items
      .filter((plugin) => !keyword || String((plugin && plugin.name) || '').toLowerCase().includes(keyword))
      .slice(0, 20)
  }

  return async (query) => {
    const [files, chats, plugins] = await Promise.all([
      listFiles(query), Promise.resolve(listSessions(query)), listPlugins(query),
    ])
    const rows = []
    for (const hit of files) {
      const path = String((hit && hit.path) || '')
      if (!path) continue
      const slash = path.lastIndexOf('/')
      const name = slash < 0 ? path : path.slice(slash + 1)
      const isDir = hit.kind === 'directory'
      const quoted = /[\s"']/.test(path)
      rows.push({
        id: 'file:' + path,
        icon: isDir ? 'folder' : 'file',
        label: (isDir ? name + '/' : name) || path,
        desc: path,
        section: '文件与文件夹',
        mention: quoted ? '@"' + path + '"' : '@' + path + (isDir ? '/' : ''),
      })
    }
    for (const chat of chats) {
      const title = String(chat.title || '').trim()
      if (!title) continue
      rows.push({
        id: 'chat:' + (chat.id || title),
        icon: 'session',
        label: title,
        desc: '对话',
        section: '对话',
        mention: /[\s"']/.test(title) ? '@"' + title + '"' : '@' + title,
      })
    }
    for (const plugin of plugins) {
      const name = String((plugin && plugin.name) || '').trim()
      if (!name) continue
      rows.push({
        id: 'plugin:' + name,
        icon: 'plugin',
        label: name,
        desc: plugin.kind === 'personal' ? '个人插件' : '插件',
        section: '插件',
        mention: '@' + name,
      })
    }
    return rows
  }
}

/**
 * 注册到输入框工具行（「完全权限」旁边）。
 *   conversation.input.left 是 session 范围的列表座位，渲染在 permission / plan 之后（右）。
 *   新会话的空白页（hero 变体）不渲染 composer.dock，但工具行照渲染——所以入口在新会话里也有。
 * @param ctx - 客户端根上下文。
 */
export function apply(ctx) {
  const listFiles = createMentionLister(ctx)
  ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
    name: 'conversation.input.left',
    id: 'dsh-prompt-shelf',
    order: 10,
    label: '常用提示词',
  }, (slotProps) => <PromptShelf {...slotProps} listFiles={listFiles} />))

  // 输入框里打 @ 也能选常用提示词：往宿主的输入触发器服务注册一个来源，
  // 与它自己的 @ 文件/会话来源并列，不接管编辑器。inputTriggers 已写进 inject，服务必定就绪。
  const triggers = typeof ctx.get === 'function' ? ctx.get('inputTriggers') : undefined
  if (triggers && typeof triggers.registerSource === 'function') {
    ctx.effect(() => triggers.registerSource(createPromptSource()), 'dsh-prompt-shelf: @ source')
  } else {
    console.warn('[dsh-prompt-shelf] inputTriggers 不可用，@ 菜单不会出现本插件的条目')
  }
}
