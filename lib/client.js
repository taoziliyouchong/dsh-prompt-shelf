window.__ModuleLoader__.load({
	id: "dsh-prompt-shelf",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/entry.jsx
var entry_exports = {};
__export(entry_exports, {
  PromptShelf: () => PromptShelf,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(entry_exports);
var import_react = require("react");
var import_react_dom = require("react-dom");
var import_jsx_runtime = require("react/jsx-runtime");
var inject = ["slots", "inputTriggers", "sessions", "remote"];
var STORAGE_KEY = "dsh.prompt-shelf.v1";
var API_URL = "/dsh-prompt-shelf/api/state";
var FILES_API = "/dsh-prompt-shelf/api/files";
var PLUGINS_API = "/dsh-prompt-shelf/api/plugins";
var TITLE_MAX = 28;
var TEMPLATE_HINT = "\u6B63\u6587\u91CC\u5199 {{\u53D8\u91CF\u540D}}\uFF0C\u6216 {{\u53D8\u91CF\u540D=\u9ED8\u8BA4\u503C}}\uFF1B\u63D2\u5165\u65F6\u7528\u5361\u7247\u91CC\u586B\u7684\u503C\u66FF\u6362\uFF08\u4E0D\u586B\u5C31\u7528\u9ED8\u8BA4\u503C\uFF09\u3002\u6B63\u6587\u6846\u91CC\u6309 Alt+V\uFF08\u6216 Ctrl+Alt+V\uFF09\u4E5F\u80FD\u63D2\u5165\u53D8\u91CF\uFF1B\u5361\u7247\u4E0A\u7684\u53D8\u91CF\u6846\u91CC\u6253 @ \u53EF\u5F15\u7528\u5DE5\u4F5C\u533A\u6587\u4EF6\u3002";
var EMPTY_INPUT = { draft: "" };
var CSS = `
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

/* \u8986\u76D6\u5C42\uFF1A\u7167 ui-primitives Modal\uFF08root / mask / dialog\uFF09\uFF0C\u7C7B\u540D\u6362\u6210 zps- \u524D\u7F00\u3002 */
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

/* \u5361\u7247\u6D41\uFF1A\u4E00\u6761\u63D0\u793A\u8BCD\u4E00\u5F20\u5361\uFF0C\u5355\u5217\uFF0C\u4E0D\u5206\u5DE6\u53F3\u680F\u3002 */
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
/* \u6709\u53D8\u91CF\u7684\u5361\u7247\uFF1A\u6B63\u6587\u6309\u6BB5\u6E32\u67D3\uFF0C\u53D8\u91CF\u4F4D\u7F6E\u662F\u5C0F\u8F93\u5165\u6846\uFF0C\u76F4\u63A5\u539F\u4F4D\u6539\u3002 */
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
/* \u53D8\u91CF\u6846\u7684 @ \u5019\u9009\uFF1Aportal \u5230 body \u7684\u6D6E\u5C42\uFF0C\u4E0D\u88AB\u5361\u7247\u6EDA\u52A8\u5BB9\u5668\u88C1\u6389\u3002 */
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
/* \u7F16\u8F91\u6846\u91CC\u7684 @ \u5019\u9009\u9762\u677F\uFF08\u6807\u9898\u6846\u3001\u6B63\u6587\u6846\u90FD\u7528\uFF09\uFF1A\u9876\u90E8\u7C7B\u522B\u680F + \u5019\u9009\u5217\u8868\u3002 */
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
/* \u56DE\u6536\u7AD9\uFF1A\u6700\u8FD1\u5220\u9664\u7684\u6761\u76EE\uFF0C\u4FDD\u7559\u5929\u6570\u53EF\u8C03\u3002 */
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
`;
function normalizeItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const text = typeof raw.text === "string" ? raw.text : "";
  if (!text.trim()) return null;
  const id = typeof raw.id === "string" && raw.id ? raw.id : "p_" + Math.random().toString(36).slice(2, 10);
  return {
    id,
    title: typeof raw.title === "string" ? raw.title : "",
    text,
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : 0,
    usedAt: typeof raw.usedAt === "number" ? raw.usedAt : 0
  };
}
var DEFAULT_TRASH_DAYS = 3;
var MAX_TRASH_DAYS = 365;
var DAY_MS = 24 * 60 * 60 * 1e3;
function clampDays(value) {
  const days = Math.round(Number(value));
  if (!Number.isFinite(days)) return DEFAULT_TRASH_DAYS;
  return Math.min(MAX_TRASH_DAYS, Math.max(1, days));
}
function normalizeTrashEntry(raw) {
  const base = normalizeItem(raw);
  if (!base) return null;
  const deletedAt = raw && typeof raw.deletedAt === "number" ? raw.deletedAt : 0;
  return { ...base, deletedAt };
}
function purgeTrash(trash, days) {
  const ttl = clampDays(days) * DAY_MS;
  const now = Date.now();
  return trash.filter((entry) => now - entry.deletedAt < ttl);
}
function trashDaysLeft(deletedAt, days) {
  const left = deletedAt + clampDays(days) * DAY_MS - Date.now();
  return Math.max(0, Math.ceil(left / DAY_MS));
}
var stateCache = { items: [], trash: [], trashDays: DEFAULT_TRASH_DAYS };
function apiUrl() {
  const relative = String(API_URL).replace(/^\/+/, "");
  if (typeof document === "undefined") return "/" + relative;
  const url = new URL(relative, document.baseURI);
  return url.pathname + url.search;
}
function readLocalCache() {
  let items = [];
  let trash = [];
  let trashDays = DEFAULT_TRASH_DAYS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.items) ? parsed.items : [];
      items = list.map(normalizeItem).filter(Boolean);
      const trashList = parsed && Array.isArray(parsed.trash) ? parsed.trash : [];
      trash = trashList.map(normalizeTrashEntry).filter(Boolean);
      trashDays = parsed && parsed.trashDays !== void 0 ? clampDays(parsed.trashDays) : DEFAULT_TRASH_DAYS;
    }
  } catch {
  }
  return { items, trash: purgeTrash(trash, trashDays), trashDays };
}
function cacheState(state) {
  stateCache = {
    items: state.items,
    trash: purgeTrash(state.trash, state.trashDays),
    trashDays: state.trashDays
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 2, ...stateCache }));
  } catch {
  }
}
function currentState() {
  return stateCache;
}
async function fetchState() {
  try {
    const res = await fetch(apiUrl(), { headers: { accept: "application/json" } });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.ok === false) {
      return { state: null, error: data && data.error || "HTTP " + res.status };
    }
    const raw = data.state || {};
    return {
      state: {
        items: (Array.isArray(raw.items) ? raw.items : []).map(normalizeItem).filter(Boolean),
        trash: (Array.isArray(raw.trash) ? raw.trash : []).map(normalizeTrashEntry).filter(Boolean),
        trashDays: raw.trashDays === void 0 ? DEFAULT_TRASH_DAYS : clampDays(raw.trashDays)
      },
      error: data.error || null
    };
  } catch (error) {
    return { state: null, error: String(error && error.message || error) };
  }
}
async function pushState(state) {
  try {
    const res = await fetch(apiUrl(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: state.items, trash: state.trash, trashDays: state.trashDays })
    });
    const data = await res.json().catch(() => null);
    return !!(res.ok && data && data.ok !== false);
  } catch {
    return false;
  }
}
function sortItems(items) {
  return items.slice().sort((a, b) => (b.usedAt || b.createdAt || 0) - (a.usedAt || a.createdAt || 0));
}
function firstLine(text) {
  const line = String(text || "").trim().split(/\r?\n/)[0] || "";
  return line.trim();
}
function titleOf(item) {
  const custom = String(item.title || "").trim();
  if (custom) return custom;
  const line = firstLine(item.text);
  return line ? line.slice(0, TITLE_MAX) : "\u672A\u547D\u540D";
}
function compactPreview(text) {
  const compact = String(text || "").replace(/\s+/g, " ").trim();
  return compact.length > 60 ? compact.slice(0, 60) + "\u2026" : compact;
}
var PROMPT_ENTRY = "\u5E38\u7528\u63D0\u793A\u8BCD";
var PROMPT_EMPTY_VALUE = "prompt-empty";
function createPromptSource() {
  const knownItems = () => {
    const live = currentState().items;
    return live.length > 0 ? live : readLocalCache().items;
  };
  return {
    trigger: "@",
    name: PROMPT_ENTRY,
    // 20：排在「工作区文件」(10) 之后、「历史会话」(30) 之前，和别的 @ 源同序时顺序稳定。
    order: 20,
    async candidates(_session, req) {
      const query = String(req.query || "").trim();
      const keyword = (query.startsWith(PROMPT_ENTRY) ? query.slice(PROMPT_ENTRY.length) : query).trim().toLowerCase();
      const items = sortItems(knownItems());
      if (items.length === 0) {
        return [{
          name: "\uFF08\u6CA1\u6709\u5E38\u7528\u63D0\u793A\u8BCD\uFF09",
          description: "\u5148\u5728\u5DE5\u5177\u884C\u7684\u300C\u5E38\u7528\u63D0\u793A\u8BCD\u300D\u91CC\u5B58\u4E00\u6761",
          value: PROMPT_EMPTY_VALUE
        }];
      }
      const used = /* @__PURE__ */ new Map();
      return items.filter((item) => !keyword || (titleOf(item) + "\n" + item.text).toLowerCase().includes(keyword)).slice(0, 20).map((item) => {
        const base = titleOf(item);
        const seen = (used.get(base) || 0) + 1;
        used.set(base, seen);
        return {
          name: seen === 1 ? base : base + " #" + seen,
          description: compactPreview(item.text),
          value: item.id
        };
      });
    },
    // 纯文本出口：返回 { text } 换掉触发词，草稿里只有文字、不生成引用卡片——
    // 所以这个源不需要 codec。哪天改成返回 { insert: { source: … } } 插卡片，
    // 就必须同时补 codec，否则发送会报 slash: no serializer for reference source "常用提示词"。
    onPick(pick) {
      const value = pick.candidate.value;
      if (value === PROMPT_EMPTY_VALUE) return void 0;
      const item = knownItems().find((it) => it.id === value);
      if (!item) return void 0;
      return { text: item.text };
    }
  };
}
var VAR_PATTERN = /\{\{\s*([^{}\n]+?)\s*\}\}/g;
function varParts(body) {
  const cut = body.indexOf("=");
  const name = (cut >= 0 ? body.slice(0, cut) : body).trim() || "\u53D8\u91CF";
  const fallback = cut >= 0 ? body.slice(cut + 1) : "";
  return { name, fallback };
}
function parseTemplate(text) {
  const source = String(text || "");
  const parts = [];
  let last = 0;
  let match = null;
  VAR_PATTERN.lastIndex = 0;
  while ((match = VAR_PATTERN.exec(source)) !== null) {
    if (match.index > last) parts.push({ type: "text", value: source.slice(last, match.index) });
    const parsed = varParts(match[1]);
    parts.push({ type: "var", name: parsed.name, fallback: parsed.fallback });
    last = match.index + match[0].length;
  }
  if (last < source.length) parts.push({ type: "text", value: source.slice(last) });
  return parts;
}
function templateValue(values, name, fallback) {
  const given = values ? values[name] : void 0;
  return given !== void 0 && given !== null ? given : fallback || "";
}
function fillTemplate(text, values) {
  return String(text || "").replace(VAR_PATTERN, (whole, body) => {
    const parsed = varParts(body);
    return templateValue(values, parsed.name, parsed.fallback);
  });
}
function ShelfIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { viewBox: "0 0 16 16", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "path",
    {
      d: "M4 2.5h8a1 1 0 0 1 1 1V14l-5-3.2L3 14V3.5a1 1 0 0 1 1-1Z",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.3",
      strokeLinejoin: "round"
    }
  ) });
}
function CloseIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { viewBox: "0 0 16 16", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 4l8 8M12 4l-8 8", fill: "none", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round" }) });
}
function mentionAt(value, caret) {
  const text = String(value || "");
  const pos = typeof caret === "number" ? caret : text.length;
  const before = text.slice(0, pos);
  const at = before.lastIndexOf("@");
  if (at < 0) return null;
  const query = before.slice(at + 1);
  if (/[\s@]/.test(query)) return null;
  if (at > 0 && !/\s/.test(before[at - 1])) return null;
  return { start: at, end: pos, query };
}
function typedAtChar(previous, next, caret) {
  return String(next || "").length === String(previous || "").length + 1 && String(next || "").charAt(caret - 1) === "@";
}
function MentionIcon(props) {
  const kind = props.kind;
  const d = kind === "folder" ? "M1.8 4.2h3.4l1.2 1.3h5.8v6.1H1.8z" : kind === "session" ? "M2 3.6h10v6.1H6.6L4.2 11.7V9.7H2z" : kind === "plugin" ? "M3.2 3.2h7.6v7.6H3.2zM3.2 6.4h7.6M6.4 3.2v7.6" : kind === "prompt" ? "M2.4 2.6h9.2v8.8H2.4zM4.6 5h4.8M4.6 7h4.8M4.6 9h3" : "M4 1.9h4.4L10.9 4.4v7.7H4z";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "svg",
    {
      width: "14",
      height: "14",
      viewBox: "0 0 14 14",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.1",
      strokeLinejoin: "round",
      "aria-hidden": true,
      className: "zps-mentionicon",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d }),
        kind === "file" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8.4 1.9v2.5h2.5" }) : null
      ]
    }
  );
}
var MENTION_TABS = ["\u5E38\u7528\u63D0\u793A\u8BCD", "\u6587\u4EF6\u4E0E\u6587\u4EF6\u5939", "\u5BF9\u8BDD", "\u63D2\u4EF6"];
function MentionMenu(props) {
  const rows = props.rows;
  const chosen = props.chosen;
  const active = props.active || null;
  const tabs = Array.isArray(props.tabs) && props.tabs.length > 0 ? props.tabs : MENTION_TABS;
  const visible = rows;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "zps-mentionpanel", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "zps-mentiontabs", role: "tablist", "aria-label": "\u5019\u9009\u7C7B\u522B", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          role: "tab",
          "aria-selected": active === null,
          className: active === null ? "zps-mentiontab chosen" : "zps-mentiontab",
          onMouseDown: (event) => {
            event.preventDefault();
            props.onSelect(null);
          },
          children: "\u5168\u90E8"
        }
      ),
      tabs.map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          role: "tab",
          "aria-selected": active === tab,
          className: active === tab ? "zps-mentiontab chosen" : "zps-mentiontab",
          onMouseDown: (event) => {
            event.preventDefault();
            props.onSelect(tab);
          },
          children: tab
        },
        tab
      ))
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "zps-mentionlist", role: "listbox", "aria-label": "\u5019\u9009", children: visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "zps-mentionempty", children: props.emptyText || "\u8FD9\u4E00\u7C7B\u6CA1\u6709\u5019\u9009" }) : visible.map((row, index) => {
      const above = index > 0 ? visible[index - 1] : null;
      const heading = active === null && row.section && (!above || above.section !== row.section);
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [
        heading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "zps-mentionsection", children: row.section }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "button",
          {
            type: "button",
            role: "option",
            "aria-selected": index === chosen,
            className: index === chosen ? "zps-mentionrow chosen" : "zps-mentionrow",
            onMouseDown: (event) => {
              event.preventDefault();
              props.onPick(row);
            },
            children: [
              row.icon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MentionIcon, { kind: row.icon }) : null,
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "zps-mentiontitle", children: row.label }),
              row.desc && row.desc !== row.label ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "zps-mentiondesc", children: row.desc }) : null
            ]
          }
        )
      ] }, row.id);
    }) })
  ] });
}
function useMentionField(listFiles, applyPick) {
  const [menu, setMenu] = (0, import_react.useState)(null);
  const [chosen, setChosen] = (0, import_react.useState)(0);
  const [activeSection, setActiveSection] = (0, import_react.useState)(null);
  const [hits, setHits] = (0, import_react.useState)([]);
  const fetchTimer = (0, import_react.useRef)(0);
  const fetchSeq = (0, import_react.useRef)(0);
  const refreshHits = (0, import_react.useCallback)((query) => {
    window.clearTimeout(fetchTimer.current);
    const seq = ++fetchSeq.current;
    fetchTimer.current = window.setTimeout(() => {
      const ask = listFiles;
      if (typeof ask !== "function") {
        setHits([]);
        return;
      }
      Promise.resolve(ask(query)).then((list) => {
        if (seq !== fetchSeq.current) return;
        setHits(Array.isArray(list) ? list : []);
      }).catch(() => {
        if (seq === fetchSeq.current) setHits([]);
      });
    }, 120);
  }, [listFiles]);
  (0, import_react.useEffect)(() => () => window.clearTimeout(fetchTimer.current), []);
  const track = (0, import_react.useCallback)((field, value, caret, typedAt) => {
    const pos = typeof caret === "number" && caret > 0 ? caret : String(value || "").length;
    const hit = mentionAt(value, pos);
    if (typedAt) {
      if (!hit) {
        setMenu(null);
        return;
      }
      setMenu({ field, start: hit.start, end: hit.end, query: hit.query });
      setChosen(0);
      setActiveSection(null);
      refreshHits(hit.query);
      return;
    }
    setMenu((prev) => {
      if (!prev || prev.field !== field) return prev;
      if (!hit) return null;
      refreshHits(hit.query);
      return { field, start: hit.start, end: hit.end, query: hit.query };
    });
  }, [refreshHits]);
  const close = (0, import_react.useCallback)(() => setMenu(null), []);
  const sections = [];
  for (const row of hits) {
    if (row.section && !sections.includes(row.section)) sections.push(row.section);
  }
  const currentSection = activeSection && sections.includes(activeSection) ? activeSection : null;
  const selected = currentSection ? hits.filter((row) => row.section === currentSection) : hits;
  const rows = selected.slice(0, 40);
  const pick = (0, import_react.useCallback)((row) => {
    if (!menu || !row) return;
    const settled = menu;
    setMenu(null);
    applyPick(row, settled);
  }, [applyPick, menu]);
  const onKeyDown = (0, import_react.useCallback)((event) => {
    if (!menu) return false;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (rows.length > 0) {
        const step = event.key === "ArrowDown" ? 1 : -1;
        setChosen((prev) => (prev + step + rows.length) % rows.length);
      }
      return true;
    }
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      const row = rows[Math.min(chosen, Math.max(0, rows.length - 1))] || rows[0];
      if (row) pick(row);
      return true;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setMenu(null);
      return true;
    }
    return false;
  }, [chosen, menu, pick, rows]);
  return { menu, rows, sections, chosen, activeSection: currentSection, setActiveSection, setChosen, track, pick, onKeyDown, close };
}
function TemplateEditor(props) {
  const editing = props.editing;
  const onTitle = props.onTitle;
  const onText = props.onText;
  const onCancel = props.onCancel;
  const onSave = props.onSave;
  const titleRef = (0, import_react.useRef)(null);
  const textareaRef = (0, import_react.useRef)(null);
  const prevValue = (0, import_react.useRef)("");
  const applyMention = (0, import_react.useCallback)((row, menu) => {
    const isTitle = menu.field === "title";
    const current = isTitle ? String(editing.title || "") : String(editing.text || "");
    const insert = row.promptId !== void 0 ? isTitle ? String(row.title || "") : String(row.text || "") : String(row.mention || "");
    const next = current.slice(0, menu.start) + insert + current.slice(menu.end);
    if (isTitle) onTitle(next);
    else onText(next);
    const caret = menu.start + insert.length;
    prevValue.current = next;
    window.requestAnimationFrame(() => {
      const el = isTitle ? titleRef.current : textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  }, [editing, onText, onTitle]);
  const mention = useMentionField(props.listFiles, applyMention);
  const insertVariable = (0, import_react.useCallback)(() => {
    const node = textareaRef.current;
    const text = String(editing.text || "");
    const start = node && typeof node.selectionStart === "number" ? node.selectionStart : text.length;
    const end = node && typeof node.selectionEnd === "number" ? node.selectionEnd : start;
    const token = "{{\u53D8\u91CF}}";
    onText(text.slice(0, start) + token + text.slice(end));
    window.requestAnimationFrame(() => {
      const next = textareaRef.current;
      if (!next) return;
      next.focus();
      next.setSelectionRange(start + 2, start + 4);
    });
  }, [editing.text, onText]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "zps-editform", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "input",
      {
        ref: titleRef,
        className: "zps-field",
        value: editing.title,
        placeholder: "\u6807\u9898\uFF08\u53EF\u7A7A\uFF0C\u9ED8\u8BA4\u53D6\u6B63\u6587\u9996\u884C\uFF1B\u6253 @ \u53EF\u5F15\u7528\u5DE5\u4F5C\u533A\u6587\u4EF6\uFF09",
        onChange: (event) => {
          const value = event.target.value;
          const caret = event.target.selectionStart || 0;
          const typedAt = typedAtChar(prevValue.current, value, caret);
          prevValue.current = value;
          onTitle(value);
          mention.track("title", value, caret, typedAt);
        },
        onKeyDown: (event) => {
          mention.onKeyDown(event);
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "textarea",
      {
        ref: textareaRef,
        className: "zps-field zps-textarea",
        value: editing.text,
        placeholder: "\u63D0\u793A\u8BCD\u6B63\u6587\uFF08\u6253 @ \u53EF\u5F15\u7528\u5DE5\u4F5C\u533A\u6587\u4EF6\uFF09",
        onChange: (event) => {
          const value = event.target.value;
          const caret = event.target.selectionStart || 0;
          const typedAt = typedAtChar(prevValue.current, value, caret);
          prevValue.current = value;
          onText(value);
          mention.track("text", value, caret, typedAt);
        },
        onKeyDown: (event) => {
          if (mention.onKeyDown(event)) return;
          if (event.isComposing || event.repeat) return;
          const key = String(event.key || "").toLowerCase();
          if (key !== "v" || event.shiftKey || !event.altKey) return;
          event.preventDefault();
          insertVariable();
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "zps-hint", children: TEMPLATE_HINT }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "zps-editrow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          className: "zps-btn",
          title: "\u5728\u5149\u6807\u5904\u63D2\u5165 {{\u53D8\u91CF}}\uFF08Alt+V\uFF0C\u6216 Ctrl+Alt+V\uFF09\u2014\u2014\u63D2\u5B8C\u76F4\u63A5\u6253\u5B57\u5C31\u662F\u6539\u53D8\u91CF\u540D",
          onClick: insertVariable,
          children: "\uFF0B \u53D8\u91CF"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "zps-spacer" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "zps-btn", onClick: onCancel, children: "\u53D6\u6D88" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "zps-btn primary", onClick: onSave, children: "\u4FDD\u5B58" })
    ] }),
    mention.menu ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      MentionMenu,
      {
        rows: mention.rows,
        tabs: mention.sections,
        active: mention.activeSection,
        onSelect: (key) => {
          mention.setActiveSection(key);
          mention.setChosen(0);
        },
        chosen: mention.chosen,
        onPick: (row) => mention.pick(row)
      }
    ) : null
  ] });
}
function VarField(props) {
  const value = String(props.value || "");
  const onChange = props.onChange;
  const inputRef = (0, import_react.useRef)(null);
  const prevValue = (0, import_react.useRef)(value);
  const [anchor, setAnchor] = (0, import_react.useState)(null);
  const applyMention = (0, import_react.useCallback)((row, menu) => {
    const current = String(props.value || "");
    const insert = row.promptId !== void 0 ? String(row.text || "") : String(row.mention || "");
    const next = current.slice(0, menu.start) + insert + current.slice(menu.end);
    onChange(next);
    prevValue.current = next;
    const caret = menu.start + insert.length;
    window.requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  }, [onChange, props.value]);
  const mention = useMentionField(props.listFiles, applyMention);
  const open = mention.menu !== null;
  (0, import_react.useEffect)(() => {
    if (!open) {
      setAnchor(null);
      return void 0;
    }
    const place = () => {
      const el = inputRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const width = Math.max(280, Math.min(420, rect.width + 240));
      const height = 248;
      const below = rect.bottom + 4 + height <= window.innerHeight;
      setAnchor({
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        top: below ? rect.bottom + 4 : Math.max(8, rect.top - 4 - height),
        width
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "zps-varwrap", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "input",
      {
        ref: inputRef,
        className: "zps-var",
        value,
        placeholder: props.name,
        title: "\u53D8\u91CF\uFF1A" + props.name + "\uFF08\u9ED8\u8BA4\u503C\uFF1A" + (props.fallback || "\u7A7A") + "\uFF1B\u6253 @ \u53EF\u5F15\u7528\u5DE5\u4F5C\u533A\u6587\u4EF6\uFF09",
        onMouseDown: (event) => event.stopPropagation(),
        onClick: (event) => event.stopPropagation(),
        onBlur: () => mention.close(),
        onChange: (event) => {
          const next = event.target.value;
          const caret = event.target.selectionStart || 0;
          const typedAt = typedAtChar(prevValue.current, next, caret);
          prevValue.current = next;
          onChange(next);
          mention.track("var", next, caret, typedAt);
        },
        onKeyDown: (event) => mention.onKeyDown(event)
      }
    ),
    open && anchor ? (0, import_react_dom.createPortal)(
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "zps-varmenu", style: { left: anchor.left, top: anchor.top, width: anchor.width }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        MentionMenu,
        {
          rows: mention.rows,
          tabs: mention.sections,
          active: mention.activeSection,
          onSelect: (key) => {
            mention.setActiveSection(key);
            mention.setChosen(0);
          },
          chosen: mention.chosen,
          onPick: (row) => mention.pick(row)
        }
      ) }),
      document.body
    ) : null
  ] });
}
function PromptShelf(props) {
  const useInput = props && typeof props.useInput === "function" ? props.useInput : null;
  const inputActions = props ? props.inputActions : void 0;
  const draft = String((useInput ? useInput((s) => s.draft) : EMPTY_INPUT.draft) || "");
  const rawListFiles = props ? props.listFiles : void 0;
  const sessionId = props ? props.sessionId : void 0;
  const mentionFiles = (0, import_react.useCallback)(
    (keyword) => typeof rawListFiles === "function" ? rawListFiles(keyword, sessionId) : Promise.resolve([]),
    [rawListFiles, sessionId]
  );
  const [items, setItems] = (0, import_react.useState)(() => readLocalCache().items);
  const [trash, setTrash] = (0, import_react.useState)(() => readLocalCache().trash);
  const [trashDays, setTrashDays] = (0, import_react.useState)(() => readLocalCache().trashDays);
  const [showTrash, setShowTrash] = (0, import_react.useState)(false);
  const [open, setOpen] = (0, import_react.useState)(false);
  const [query, setQuery] = (0, import_react.useState)("");
  const [expandedId, setExpandedId] = (0, import_react.useState)(null);
  const [editing, setEditing] = (0, import_react.useState)(null);
  const [flash, setFlash] = (0, import_react.useState)("");
  const [varValues, setVarValues] = (0, import_react.useState)({});
  const flashTimer = (0, import_react.useRef)(0);
  const triggerRef = (0, import_react.useRef)(null);
  const searchRef = (0, import_react.useRef)(null);
  const notify = (0, import_react.useCallback)((text) => {
    setFlash(text);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(""), 2600);
  }, []);
  (0, import_react.useEffect)(() => () => window.clearTimeout(flashTimer.current), []);
  (0, import_react.useEffect)(() => {
    let alive = true;
    fetchState().then(({ state, error }) => {
      if (!alive) return;
      if (state) {
        cacheState(state);
        setItems(sortItems(state.items));
        setTrash(state.trash);
        setTrashDays(state.trashDays);
      } else if (error) {
        notify("\u8BFB\u4E0D\u5230\u72B6\u6001\u6587\u4EF6\uFF1A" + error);
      }
    });
    return () => {
      alive = false;
    };
  }, [notify]);
  const openDialog = (0, import_react.useCallback)(() => {
    const local = readLocalCache();
    setItems(sortItems(local.items));
    setTrash(local.trash);
    setTrashDays(local.trashDays);
    setEditing(null);
    setExpandedId(null);
    setShowTrash(false);
    setFlash("");
    setOpen(true);
    fetchState().then(({ state, error }) => {
      if (state) {
        cacheState(state);
        setItems(sortItems(state.items));
        setTrash(state.trash);
        setTrashDays(state.trashDays);
      } else if (error) {
        notify("\u8BFB\u4E0D\u5230\u72B6\u6001\u6587\u4EF6\uFF1A" + error);
      }
    });
  }, [notify]);
  const closeDialog = (0, import_react.useCallback)(() => {
    setOpen(false);
    setEditing(null);
    const trigger = triggerRef.current;
    if (trigger && typeof trigger.focus === "function") trigger.focus();
  }, []);
  (0, import_react.useEffect)(() => {
    if (!open) return;
    const input = searchRef.current;
    if (input && typeof input.focus === "function") input.focus();
  }, [open]);
  (0, import_react.useEffect)(() => {
    if (!open) return void 0;
    const onKey = (event) => {
      if (event.key !== "Escape" || event.ctrlKey || event.altKey || event.metaKey) return;
      event.preventDefault();
      if (editing) setEditing(null);
      else closeDialog();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, editing, closeDialog]);
  const commit = (0, import_react.useCallback)((nextItems, nextTrash = trash, nextDays = trashDays) => {
    setItems(nextItems);
    setTrash(nextTrash);
    setTrashDays(nextDays);
    const state = { items: nextItems, trash: nextTrash, trashDays: nextDays };
    cacheState(state);
    pushState(state).then((ok) => {
      if (!ok) notify("\u4FDD\u5B58\u5230\u72B6\u6001\u6587\u4EF6\u5931\u8D25\uFF1A\u8FD9\u6B21\u6539\u52A8\u53EA\u5728\u5F53\u524D\u9875\u9762\u91CC");
    });
  }, [notify, trash, trashDays]);
  const markUsed = (0, import_react.useCallback)((id) => {
    commit(items.map((it) => it.id === id ? { ...it, usedAt: Date.now() } : it));
  }, [commit, items]);
  const send = (0, import_react.useCallback)((item, mode) => {
    const api = inputActions;
    const finalText = fillTemplate(item.text, varValues[item.id]);
    if (!api) {
      notify("\u6CA1\u6709\u53EF\u7528\u7684\u8F93\u5165\u6846");
      return;
    }
    if (mode === "replace") {
      try {
        api.setDraft(finalText);
        markUsed(item.id);
        notify("\u5DF2\u66FF\u6362\u4E3A\u8FD9\u6761\u63D0\u793A\u8BCD");
      } catch {
        notify("\u66FF\u6362\u5931\u8D25\uFF1A\u8F93\u5165\u6846\u6B63\u5FD9");
      }
      return;
    }
    try {
      if (typeof api.captureInsertion === "function" && typeof api.insertText === "function") {
        const span = api.captureInsertion();
        if (api.insertText(finalText, span)) {
          markUsed(item.id);
          notify("\u5DF2\u63D2\u5165\u5230\u5149\u6807\u5904");
          return;
        }
        notify("\u63D2\u5165\u672A\u751F\u6548\uFF1A\u8F93\u5165\u6846\u521A\u53D8\u5316\u6216\u6B63\u5728\u63D0\u4EA4\uFF0C\u53EF\u6539\u7528\u300C\u66FF\u6362\u300D");
        return;
      }
    } catch {
    }
    if (typeof api.setDraft === "function") {
      api.setDraft(finalText);
      markUsed(item.id);
      notify("\u5DF2\u586B\u5165\u8F93\u5165\u6846");
      return;
    }
    notify("\u8FD9\u4E2A\u8F93\u5165\u6846\u4E0D\u80FD\u5199\u5165");
  }, [inputActions, markUsed, notify, varValues]);
  const setVar = (0, import_react.useCallback)((itemId, name, value) => {
    setVarValues((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId] || {}, [name]: value }
    }));
  }, []);
  const saveCurrent = (0, import_react.useCallback)(() => {
    const text = draft.trim();
    if (!text) return;
    if (items.some((it) => it.text.trim() === text)) {
      notify("\u8FD9\u6761\u5DF2\u7ECF\u5728\u5217\u8868\u91CC\u4E86");
      return;
    }
    const now = Date.now();
    const item = {
      id: "p_" + now.toString(36) + Math.random().toString(36).slice(2, 6),
      title: "",
      text,
      createdAt: now,
      usedAt: 0
    };
    commit([item, ...items]);
    notify("\u5DF2\u5B58\u4E3A\u5E38\u7528\u63D0\u793A\u8BCD");
  }, [commit, draft, items, notify]);
  const startCreate = (0, import_react.useCallback)(() => {
    setEditing({ id: null, title: "", text: "" });
    setExpandedId(null);
    setQuery("");
  }, []);
  const remove = (0, import_react.useCallback)((id) => {
    const target = items.find((it) => it.id === id);
    if (!target) return;
    commit(
      items.filter((it) => it.id !== id),
      purgeTrash([{ ...target, deletedAt: Date.now() }, ...trash], trashDays)
    );
    setEditing((prev) => prev && prev.id === id ? null : prev);
    setExpandedId((prev) => prev === id ? null : prev);
    notify("\u5DF2\u79FB\u5230\u56DE\u6536\u7AD9\uFF0C\u4FDD\u7559 " + trashDays + " \u5929");
  }, [commit, items, notify, trash, trashDays]);
  const restore = (0, import_react.useCallback)((id) => {
    const target = trash.find((it) => it.id === id);
    if (!target) return;
    const entry = { ...target };
    delete entry.deletedAt;
    commit([entry, ...items], trash.filter((it) => it.id !== id));
    notify("\u5DF2\u6062\u590D");
  }, [commit, items, notify, trash]);
  const changeTrashDays = (0, import_react.useCallback)((raw) => {
    const days = clampDays(raw);
    setTrashDays(days);
    commit(items, purgeTrash(trash, days), days);
  }, [commit, items, trash]);
  const saveEdit = (0, import_react.useCallback)(() => {
    if (!editing) return;
    const text = editing.text.trim();
    if (!text) {
      notify("\u6B63\u6587\u4E0D\u80FD\u4E3A\u7A7A\uFF0C\u5199\u70B9\u5185\u5BB9\u518D\u4FDD\u5B58");
      return;
    }
    const title = editing.title.trim();
    if (editing.id === null) {
      const now = Date.now();
      const item = {
        id: "p_" + now.toString(36) + Math.random().toString(36).slice(2, 6),
        title,
        text,
        createdAt: now,
        usedAt: 0
      };
      commit([item, ...items]);
      setEditing(null);
      notify("\u5DF2\u65B0\u5EFA\u4E00\u6761");
      return;
    }
    commit(items.map((it) => it.id === editing.id ? { ...it, title, text } : it));
    setEditing(null);
    notify("\u5DF2\u4FDD\u5B58\u4FEE\u6539");
  }, [commit, editing, items, notify]);
  const visible = (0, import_react.useMemo)(() => {
    const list = sortItems(items);
    const keyword = query.trim().toLowerCase();
    if (!keyword) return list;
    return list.filter((it) => ((it.title || "") + "\n" + it.text).toLowerCase().includes(keyword));
  }, [items, query]);
  const keepFocus = (0, import_react.useCallback)((event) => {
    event.preventDefault();
  }, []);
  const overlay = open ? (0, import_react_dom.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "zps-overlay", role: "presentation", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "zps-mask", "aria-hidden": "true", onClick: closeDialog }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "zps-dialog", role: "dialog", "aria-modal": "true", "aria-label": "\u5E38\u7528\u63D0\u793A\u8BCD", tabIndex: -1, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "zps-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { className: "zps-heading", children: [
            "\u5E38\u7528\u63D0\u793A\u8BCD",
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "zps-headmeta", children: items.length > 0 ? items.length + " \u6761" : "" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "zps-iconbtn", "aria-label": "\u5173\u95ED", onClick: closeDialog, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloseIcon, {}) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "zps-toolbar", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              ref: searchRef,
              className: "zps-search",
              value: query,
              placeholder: "\u641C\u7D22\u6807\u9898\u6216\u6B63\u6587",
              onChange: (event) => setQuery(event.target.value)
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "zps-btn", onClick: startCreate, children: "\uFF0B \u65B0\u5EFA" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "button",
            {
              type: "button",
              className: "zps-btn",
              title: "\u6700\u8FD1\u5220\u9664\u7684\u6761\u76EE\u5728\u8FD9\u91CC\u4FDD\u7559\u4E00\u6BB5\u65F6\u95F4\uFF0C\u53EF\u6062\u590D\uFF1B\u4FDD\u7559\u5929\u6570\u53EF\u8C03",
              onClick: () => setShowTrash((value) => !value),
              children: [
                "\u56DE\u6536\u7AD9",
                trash.length > 0 ? " " + trash.length : ""
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              className: "zps-btn primary",
              title: "\u628A\u8F93\u5165\u6846\u91CC\u7684\u5185\u5BB9\u5B58\u6210\u4E00\u6761\u5E38\u7528\u63D0\u793A\u8BCD",
              onClick: saveCurrent,
              children: "\u5B58\u5165\u5F53\u524D\u8F93\u5165"
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "zps-cards", children: [
          editing !== null && editing.id === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { className: "zps-card", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "zps-cardhead", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: "zps-cardtitle", children: "\u65B0\u6761\u76EE" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              TemplateEditor,
              {
                editing,
                onTitle: (title) => setEditing({ ...editing, title }),
                onText: (text) => setEditing({ ...editing, text }),
                onCancel: () => setEditing(null),
                onSave: saveEdit,
                listFiles: mentionFiles
              }
            )
          ] }) : null,
          showTrash ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "zps-trash", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "zps-trashhead", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                "\u6700\u8FD1\u5220\u9664",
                trash.length > 0 ? "\uFF08" + trash.length + " \u6761\uFF09" : ""
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "zps-trashdays", children: [
                "\u4FDD\u7559",
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "input",
                  {
                    className: "zps-daysinput",
                    type: "number",
                    min: "1",
                    max: MAX_TRASH_DAYS,
                    value: trashDays,
                    onChange: (event) => changeTrashDays(event.target.value)
                  }
                ),
                "\u5929"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "zps-btn", onClick: () => setShowTrash(false), children: "\u6536\u8D77" })
            ] }),
            trash.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "zps-hint", children: "\u8FD8\u6CA1\u6709\u5220\u9664\u7684\u6761\u76EE\u3002" }) : trash.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "zps-trashrow", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "zps-trashname", children: titleOf(entry) }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "zps-trashdaysleft", children: [
                trashDaysLeft(entry.deletedAt, trashDays),
                " \u5929\u540E\u6E05\u9664"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "zps-btn", onClick: () => restore(entry.id), children: "\u6062\u590D" })
            ] }, entry.id))
          ] }) : null,
          visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "zps-placeholder", children: items.length === 0 ? "\u8FD8\u6CA1\u6709\u6761\u76EE\u3002\u4E24\u79CD\u5EFA\u6CD5\uFF1A\u70B9\u4E0A\u65B9\u300C\uFF0B \u65B0\u5EFA\u300D\u76F4\u63A5\u5199\u4E00\u6761\uFF1B\u6216\u5148\u5728\u4E0B\u9762\u8F93\u5165\u6846\u5199\u597D\u5185\u5BB9\uFF0C\u518D\u70B9\u300C\u5B58\u5165\u5F53\u524D\u8F93\u5165\u300D\u3002" : "\u6CA1\u6709\u5339\u914D\u7684\u6761\u76EE\u3002" }) : visible.map((item) => {
            const parts = parseTemplate(item.text);
            const varNames = parts.filter((part) => part.type === "var").map((part) => part.name);
            const editingThis = editing !== null && editing.id === item.id;
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { className: "zps-card", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "zps-cardhead", children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: "zps-cardtitle", children: titleOf(item) }),
                varNames.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "zps-varbadge", title: "\u53D8\u91CF\uFF1A" + varNames.join("\u3001"), children: [
                  varNames.length,
                  " \u4E2A\u53D8\u91CF"
                ] }) : null,
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "zps-cardactions", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "zps-btn", onMouseDown: keepFocus, onClick: () => send(item, "insert"), children: "\u63D2\u5165" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "zps-btn", onMouseDown: keepFocus, onClick: () => send(item, "replace"), children: "\u66FF\u6362" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "button",
                    {
                      type: "button",
                      className: "zps-btn",
                      onMouseDown: keepFocus,
                      onClick: () => setEditing({ id: item.id, title: item.title || "", text: item.text }),
                      children: "\u7F16\u8F91"
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "zps-btn danger", onMouseDown: keepFocus, onClick: () => remove(item.id), children: "\u5220\u9664" })
                ] })
              ] }),
              editingThis ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                TemplateEditor,
                {
                  editing,
                  onTitle: (title) => setEditing({ ...editing, title }),
                  onText: (text) => setEditing({ ...editing, text }),
                  onCancel: () => setEditing(null),
                  onSave: saveEdit,
                  listFiles: mentionFiles
                }
              ) : varNames.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "zps-cardtext zps-cardtext-vars", children: parts.map((part, index) => part.type === "text" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: part.value }, index) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                VarField,
                {
                  value: templateValue(varValues[item.id], part.name, part.fallback),
                  name: part.name,
                  fallback: part.fallback,
                  onChange: (value) => setVar(item.id, part.name, value),
                  listFiles: mentionFiles
                },
                index
              )) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "div",
                {
                  className: "zps-cardtext",
                  "data-expanded": expandedId === item.id ? "true" : "false",
                  onClick: () => setExpandedId((prev) => prev === item.id ? null : item.id),
                  title: "\u70B9\u51FB\u5C55\u5F00/\u6536\u8D77",
                  children: item.text
                }
              )
            ] }, item.id);
          })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "zps-foot", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "zps-flash", role: "status", children: flash }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "zps-hint", children: "\u63D2\u5165\uFF1D\u5149\u6807\u5904\u8FFD\u52A0\uFF1B\u66FF\u6362\uFF1D\u6574\u6846\u6362\u6210\u8FD9\u6761\uFF1B\u70B9\u6B63\u6587\u5C55\u5F00/\u6536\u8D77" })
        ] })
      ] })
    ] }),
    document.body
  ) : null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "zps-root", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: CSS }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "button",
        {
          ref: triggerRef,
          type: "button",
          className: "zps-trigger",
          "aria-expanded": open,
          title: "\u5E38\u7528\u63D0\u793A\u8BCD\uFF1A\u5B58\u53D6\u4E0E\u63D2\u5165",
          onMouseDown: keepFocus,
          onClick: () => open ? closeDialog() : openDialog(),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShelfIcon, {}),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u5E38\u7528\u63D0\u793A\u8BCD" }),
            items.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "zps-count", children: items.length }) : null
          ]
        }
      )
    ] }),
    overlay
  ] });
}
function relativeAge(at) {
  const stamp = Number(at || 0);
  if (!Number.isFinite(stamp) || stamp <= 0) return "";
  const diff = Math.max(0, Date.now() - stamp);
  const minute = 60 * 1e3;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "\u521A\u521A";
  if (diff < hour) return Math.floor(diff / minute) + " \u5206\u949F\u524D";
  if (diff < day) return Math.floor(diff / hour) + " \u5C0F\u65F6\u524D";
  if (diff < 30 * day) return Math.floor(diff / day) + " \u5929\u524D";
  const date = new Date(stamp);
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}
function sessionMention(sessionId, label) {
  const binary = btoa(JSON.stringify(String(sessionId)));
  const payload = binary.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const safe = String(label).replace(/[\\\]]/g, (match) => `\\${match}`);
  return `@[${safe}](dsh-session:${payload})`;
}
function createMentionLister(ctx) {
  const sessions = typeof ctx.get === "function" ? ctx.get("sessions") : void 0;
  const snapshot = () => {
    try {
      return sessions && sessions.list && sessions.list.getSnapshot().byId || {};
    } catch {
      return {};
    }
  };
  const cwdOf = (sessionId) => {
    const byId = snapshot();
    const own = sessionId === void 0 ? void 0 : byId[sessionId];
    if (own && own.cwd) return String(own.cwd);
    const ids = Object.keys(byId);
    const openId = ids.find((id2) => byId[id2] && byId[id2].cwd && byId[id2].openState === "open");
    const withCwd = ids.find((id2) => byId[id2] && byId[id2].cwd);
    const id = openId || withCwd;
    return id ? String(byId[id].cwd || "") : "";
  };
  const listFiles = async (query, sessionId) => {
    const dir = cwdOf(sessionId);
    if (!dir) return [];
    try {
      const url = new URL(String(FILES_API).replace(/^\/+/, ""), document.baseURI);
      url.searchParams.set("dir", dir);
      url.searchParams.set("q", String(query || ""));
      const res = await fetch(url.pathname + url.search, { headers: { accept: "application/json" } });
      const data = await res.json().catch(() => null);
      return data && data.ok && Array.isArray(data.items) ? data.items : [];
    } catch {
      return [];
    }
  };
  const listAllSessions = async () => {
    try {
      const remote = ctx && ctx.remote ? ctx.remote.session : void 0;
      if (remote !== void 0 && typeof remote.list === "function") {
        const result = await remote.list({});
        if (result && result.ok === true && result.value && Array.isArray(result.value.items)) {
          return { items: result.value.items, note: "" };
        }
        if (result && result.ok === false) {
          const error = result.error || {};
          return { items: [], note: String(error.message || error.code || "\u5BBF\u4E3B\u8FD4\u56DE\u5931\u8D25") };
        }
      }
    } catch (error) {
      return { items: [], note: String(error && error.message || error) };
    }
    const byId = snapshot();
    const items = Object.keys(byId).map((id) => ({ ...byId[id], sessionId: byId[id] && byId[id].sessionId || id }));
    return { items, note: items.length === 0 ? "\u4F1A\u8BDD\u6E05\u5355\u4E3A\u7A7A" : "" };
  };
  const listSessions = async (query, sessionId) => {
    const { items, note } = await listAllSessions();
    const keyword = String(query || "").trim().toLowerCase();
    const byId = snapshot();
    const ownCwd = sessionId === void 0 ? "" : String(byId[sessionId] && byId[sessionId].cwd || "");
    const rows = items.filter((item) => item !== void 0 && item.sessionId !== sessionId).filter((item) => item.origin !== "subagent").map((item) => ({
      id: item.sessionId,
      title: String(item.displayTitle || item.title || item.sessionId),
      cwd: item.cwd === void 0 ? "" : String(item.cwd),
      updatedAt: item.updatedAt || 0
    })).filter((entry) => entry.title !== "").filter((entry) => !keyword || (entry.title + "\n" + entry.cwd).toLowerCase().includes(keyword)).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 12).map((entry) => ({
      ...entry,
      desc: [
        entry.cwd === "" || entry.cwd === ownCwd ? "" : entry.cwd,
        relativeAge(entry.updatedAt)
      ].filter(Boolean).join(" \xB7 "),
      mention: sessionMention(entry.id, entry.title)
    }));
    if (rows.length === 0 && note !== "") {
      return [{ id: "diag", title: "\uFF08\u4F1A\u8BDD\u6E05\u5355\u53D6\u4E0D\u5230\uFF09", desc: note, mention: "" }];
    }
    return rows;
  };
  const pluginCache = { at: 0, items: [] };
  const listPlugins = async (query) => {
    const now = Date.now();
    if (now - pluginCache.at > 6e4) {
      try {
        const url = new URL(String(PLUGINS_API).replace(/^\/+/, ""), document.baseURI);
        const res = await fetch(url.pathname, { headers: { accept: "application/json" } });
        const data = await res.json().catch(() => null);
        pluginCache.items = data && data.ok && Array.isArray(data.items) ? data.items : [];
      } catch {
        pluginCache.items = [];
      }
      pluginCache.at = now;
    }
    const keyword = String(query || "").trim().toLowerCase();
    return pluginCache.items.filter((plugin) => !keyword || String(plugin && plugin.name || "").toLowerCase().includes(keyword)).slice(0, 20);
  };
  return async (query, sessionId) => {
    const [files, chats, plugins] = await Promise.all([
      listFiles(query, sessionId),
      listSessions(query, sessionId),
      listPlugins(query)
    ]);
    const keyword = String(query || "").trim().toLowerCase();
    const rows = [];
    for (const hit of files) {
      const path = String(hit && hit.path || "");
      if (!path) continue;
      const slash = path.lastIndexOf("/");
      const name = slash < 0 ? path : path.slice(slash + 1);
      const isDir = hit.kind === "directory";
      const quoted = /[\s"']/.test(path);
      rows.push({
        id: "file:" + path,
        icon: isDir ? "folder" : "file",
        label: (isDir ? name + "/" : name) || path,
        desc: path,
        section: "\u6587\u4EF6\u4E0E\u6587\u4EF6\u5939",
        mention: quoted ? '@"' + path + '"' : "@" + path + (isDir ? "/" : "")
      });
    }
    for (const chat of chats) {
      const title = String(chat.title || "").trim();
      if (!title) continue;
      rows.push({
        id: "chat:" + chat.id,
        icon: "session",
        label: title,
        desc: chat.desc || "",
        section: "\u5BF9\u8BDD",
        mention: chat.mention
      });
    }
    for (const plugin of plugins) {
      const name = String(plugin && plugin.name || "").trim();
      if (!name) continue;
      rows.push({
        id: "plugin:" + name,
        icon: "plugin",
        label: name,
        desc: plugin.kind === "personal" ? "\u4E2A\u4EBA\u63D2\u4EF6" : "\u63D2\u4EF6",
        section: "\u63D2\u4EF6",
        mention: "@" + name
      });
    }
    const prompts = sortItems(currentState().items.length > 0 ? currentState().items : readLocalCache().items).filter((item) => !keyword || (titleOf(item) + "\n" + item.text).toLowerCase().includes(keyword)).slice(0, 20);
    for (const item of prompts) {
      const title = titleOf(item);
      rows.push({
        id: "prompt:" + item.id,
        icon: "prompt",
        label: title,
        desc: compactPreview(item.text),
        section: "\u5E38\u7528\u63D0\u793A\u8BCD",
        mention: item.text,
        promptId: item.id,
        title,
        text: item.text
      });
    }
    return rows;
  };
}
function apply(ctx) {
  const listFiles = createMentionLister(ctx);
  ctx.slots.inject("conversation.input.left", () => ctx.slots.register({
    name: "conversation.input.left",
    id: "dsh-prompt-shelf",
    order: 10,
    label: "\u5E38\u7528\u63D0\u793A\u8BCD"
  }, (slotProps) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptShelf, { ...slotProps, listFiles })));
  const triggers = typeof ctx.get === "function" ? ctx.get("inputTriggers") : void 0;
  if (triggers && typeof triggers.registerSource === "function") {
    ctx.effect(() => triggers.registerSource(createPromptSource()), "dsh-prompt-shelf: @ source");
  } else {
    console.warn("[dsh-prompt-shelf] inputTriggers \u4E0D\u53EF\u7528\uFF0C@ \u83DC\u5355\u4E0D\u4F1A\u51FA\u73B0\u672C\u63D2\u4EF6\u7684\u6761\u76EE");
  }
}

		return module.exports;
	}
});
