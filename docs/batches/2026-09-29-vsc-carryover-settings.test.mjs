/**
 * 2026-09-29-vsc-carryover-settings.test.mjs — 批内件（vsc-carryover · V1 舱：设置面）
 * 暂存位 = `.thincoder/tmp/`（#545 立即形先例）——终位 = `docs/batches/2026-09-29-vsc-carryover-settings.test.mjs`
 * （父侧 copy 收位；两层深同形 ⇒ 两处可直跑）。
 *
 * 覆盖 = #640（设置面失败面 S15 收正——载荷 v2 `{scope, reason}` ∕ 段标 + 词化码 ∕ 不自散 ∕
 * 关面板不丢）九腿 + 扩展侧文本锁 + #17（autoThink 档位开关）读链 ∕ 写链 ∕ 渲染载荷三腿。
 * 腿清单（判据语义 = 批档 §2「#640 ∥ #17」节）：
 *   L640-① 词化码：开面板 + `showSettingsError("mcp","mtime-conflict")` ⇒ banner ∕ 段标 ∕ 词化句（≠ 原串）
 *   L640-② 表外 reason 原样直传 ∥ ③ `scope:"panel"` 零段标 ∥ ④ 关面板不丢（落槽待显）
 *   L640-⑤ 单实例替换（最后一条胜）∥ ⑥ `closeSettings()` = 销账（复开不复现）
 *   L640-⑦ 源锁（写窄）：`showSettingsError` 体内零 `setTimeout`——打开等待定时器（250ms 回退）不在锁域
 *   L640-⑧ 闭集外 scope ⇒ 零段标 ∥ ⑨ 空 reason（`""` ∕ 缺同判）⇒ 零节点
 *   L640-X 扩展侧源锁（文本锁）：`providerError` 发射全 8 处经 `postProviderError` ∕ 零 `text:` 残留 ∕
 *          助手含 `CONFIG_CONFLICT_HINT` 冲突码分派（载荷构造单源 + webview 消费单点）
 *   L17-① 读链源锁（push 快照携 `autoThink`）∥ ② 写链行为腿（tmp config 直驱：显式布尔写 ∕ 缺席零动）
 *   ∥ ③ 渲染 ∕ 载荷腿（fake DOM：两态渲染 + change ⇒ posted 布尔）
 * 真机腿（#640 写冲突驻留 ∕ #17 开关翻转 + 下一回合分类器生效）= 父侧面（本件不含）。
 * 跑法（从仓库根 `thincoder/`）：`node --test .thincoder/tmp/2026-09-29-vsc-carryover-settings.test.mjs`
 * 不入仓套件 · 随批留存归档（批件直跑 = 本批验证面）。
 * 假 DOM harness 沿 `2026-09-29-residuals-round2-vsc.test.mjs` 先例（按需增强：挂树感知 `getElementById`、
 * 计时器桩、逗号选择器；桩件 = 字符串 innerHTML 未解析控件的替身——沿 smoke-settings 先例语义）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url))
const src = (rel) => readFileSync(`${ROOT}${rel}`, "utf8")

// ─── mini 假 DOM（VSC webview 装载面——沿 residuals-round2 先例，按需增强）──────────────────

const camelOf = (name) => name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
class FakeText { constructor(value) { this.textContent = String(value) } }

const _attached = new Map() // id → 已挂树节点（真 DOM `getElementById` 语义面）
const _byId = new Map()     // 预置 ∕ 桩件（字符串 innerHTML 未解析面的替身）
function registerTree(n) {
  if (!(n instanceof FakeNode)) return
  if (n.id) _attached.set(n.id, n)
  for (const c of n.children) registerTree(c)
}
function unregisterTree(n) {
  if (!(n instanceof FakeNode)) return
  if (n.id && _attached.get(n.id) === n) _attached.delete(n.id)
  for (const c of n.children) unregisterTree(c)
}

class FakeNode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase(); this.id = ""; this.attrs = {}; this.dataset = {}; this.children = []; this.listeners = []
    this.textContent = ""; this.parent = null; this.isConnected = true
    this.value = ""; this.checked = false; this.type = ""; this.title = ""; this.placeholder = ""
    this.style = new Proxy({}, { get: (t, k) => t[k] ?? "", set: (t, k, v) => { t[k] = v; return true } })
    this._classes = new Set()
    this.classList = {
      add: (...cs) => { for (const c of cs) this._classes.add(c) },
      remove: (...cs) => { for (const c of cs) this._classes.delete(c) },
      contains: (c) => this._classes.has(c),
      toggle: (c) => { this._classes.has(c) ? this._classes.delete(c) : this._classes.add(c) },
    }
  }
  set className(v) { this._classes = new Set(String(v).split(/\s+/).filter(Boolean)) }
  get className() { return [...this._classes].join(" ") }
  setAttribute(k, v) { const s = String(v); this.attrs[k] = s; if (k === "class") this.className = s; else if (k.startsWith("data-")) this.dataset[camelOf(k.slice(5))] = s }
  getAttribute(k) { if (k.startsWith("data-")) { const v = this.dataset[camelOf(k.slice(5))]; if (v !== undefined) return String(v) } return this.attrs[k] ?? null }
  removeAttribute(k) { delete this.attrs[k] }
  addEventListener(type, fn) { this.listeners.push({ type, fn }) }
  removeEventListener() {}
  fire(type, event = {}) { for (const l of this.listeners) if (l.type === type) l.fn({ type, preventDefault() {}, stopPropagation() {}, target: this, ...event }) }
  focus() {}
  get parentElement() { return this.parent }
  get content() { return this } // `<template>`.content（假 DOM 自持）
  appendChild(node) { const child = node instanceof FakeNode || node instanceof FakeText ? node : new FakeText(node); child.parent = this; this.children.push(child); registerTree(child); this.bump(); return child }
  append(...nodes) { for (const n of nodes) this.appendChild(n) }
  insertBefore(node, anchor) { const at = anchor == null ? -1 : this.children.indexOf(anchor); if (at < 0) this.children.push(node); else this.children.splice(at, 0, node); node.parent = this; registerTree(node); this.bump(); return node }
  get childNodes() { return [...this.children] }
  get firstChild() { return this.children[0] ?? null }
  get firstElementChild() { return this.children.find((c) => c instanceof FakeNode) ?? null }
  get lastElementChild() { return [...this.children].reverse().find((c) => c instanceof FakeNode) ?? null }
  replaceChildren(...nodes) { for (const c of this.children) { c.parent = null; unregisterTree(c) } this.children = []; for (const n of nodes) this.appendChild(n) }
  remove() { if (this.parent) { const at = this.parent.children.indexOf(this); if (at >= 0) { this.parent.children.splice(at, 1); unregisterTree(this) } this.parent.bump() } }
  prepend(node) { this.children.unshift(node); node.parent = this; registerTree(node); this.bump() }
  querySelector(sel) { let hit = null; this.walk((n) => { if (hit === null && matches(n, sel)) hit = n }); return hit }
  querySelectorAll(sel) { const out = []; this.walk((n) => { if (matches(n, sel)) out.push(n) }); return out }
  closest(sel) { for (let n = this; n != null; n = n.parent ?? null) if (n instanceof FakeNode && matches(n, sel)) return n; return null }
  walk(fn) { for (const c of this.children) { if (c instanceof FakeNode) { fn(c); c.walk(fn) } } }
  set innerHTML(v) { for (const c of this.children) { c.parent = null; unregisterTree(c) } this.children = []; this._html = String(v) }
  get innerHTML() { return this._html ?? "" }
  bump() { this.textContent = this.children.map((c) => c.textContent ?? "").join("") }
}
function matches(node, sel) {
  for (const part of String(sel).split(",")) { const s = part.trim(); if (s && matchOne(node, s)) return true }
  return false
}
function matchOne(node, sel) {
  if (sel.startsWith(".")) return node.classList.contains(sel.slice(1))
  if (/^[a-zA-Z][\w-]*$/.test(sel)) return node.tagName === sel.toUpperCase()
  const m = /^\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(sel)
  if (m === null) return false
  const value = m[1].startsWith("data-") ? node.dataset[camelOf(m[1].slice(5))] : node.attrs[m[1]]
  if (value === undefined) return false
  return m[2] === undefined || String(value) === m[2]
}

// 计时器桩（推进 = 手动 `drainTimers`；`showSettingsError` 零调度 = 腿⑦行为面判据）
const timers = []
globalThis.setTimeout = (fn, ms) => { const h = { fn, ms }; timers.push(h); return h }
globalThis.clearTimeout = (h) => { const i = timers.indexOf(h); if (i >= 0) timers.splice(i, 1) }
const drainTimers = () => { let guard = 0; while (timers.length > 0 && guard++ < 1000) { const h = timers.shift(); try { h.fn() } catch { /* 桩件定时器兜底 */ } } }

globalThis.Node = FakeNode
const stubCard = new FakeNode("section") // `#ag-maxturns`.closest(".settings-card") 的桩件面
const makeStub = () => { const el = new FakeNode("div"); el.closest = () => stubCard; return el }
globalThis.document = {
  getElementById(id) {
    if (_attached.has(id)) return _attached.get(id)
    if (!_byId.has(id)) _byId.set(id, makeStub())
    return _byId.get(id)
  },
  createElement: (tag) => new FakeNode(tag),
  createTextNode: (v) => new FakeText(v),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
  body: new FakeNode("body"),
  documentElement: new FakeNode("html"),
}
const posted = []
globalThis.window = { _vscode: { postMessage: (m) => posted.push(m) }, addEventListener: () => {}, removeEventListener: () => {} }
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0)

// 面板两件预置（`settings-panel` 初始隐 = index.html 首帧 `display:none` 同态）
const panelEl = new FakeNode("div"); panelEl.id = "settings-panel"; panelEl.style.display = "none"
const bodyEl = new FakeNode("div"); bodyEl.id = "settings-body"
_byId.set("settings-panel", panelEl)
_byId.set("settings-body", bodyEl)

// ─── 取件（先上全局，后装 VSC webview 链）───────────────────────────────────────────

const { setStrings } = await import("../../thincoder-vscode/webview/i18n.js")
const EN = JSON.parse(src("thincoder-vscode/locales/en.json"))
setStrings(EN) // 真词面（词化断言用 en.json 真值——非键面）

const { initSettings, showSettingsError } = await import("../../thincoder-vscode/webview/settings.js")
const { agentCardHtml, bindAgentControls } = await import("../../thincoder-vscode/webview/settings-agent.js")
const { SS } = await import("../../thincoder-vscode/webview/settings-state.js")

const api = initSettings({ onClose: () => {}, getModels: () => [] })
const openPanel = () => { api.openSettings(); api.notifyAgentSettingsRefreshed() } // 打开拍 + 回批 ⇒ buildSettings
const closePanel = () => api.closeSettings()
const bannerOf = () => bodyEl.children.find((c) => c.id === "settings-error-banner") ?? null
const spanOf = (b, cls) => b.children.find((c) => c.className === cls) ?? null

// ═══ #640 · 九腿 ═══════════════════════════════════════════════════════════════

test("L640-① 词化码：开面板 + showSettingsError('mcp','mtime-conflict') ⇒ banner ∕ 段标 ∕ 词化句（≠ 原串）", () => {
  closePanel(); openPanel() // 前置 = 面板开 + 零 banner（关已销账）
  assert.equal(bannerOf(), null, "前置 = 零 banner")
  showSettingsError("mcp", "mtime-conflict")
  const b = bannerOf()
  assert.ok(b, "banner 在场（面板开）")
  assert.equal(b.parent, bodyEl, "banner 挂 settings-body（prepend）")
  assert.equal(b.getAttribute("data-scope"), "mcp", "data-scope 携段名")
  assert.equal(b.children.length, 2, "段标 + 文本两子节点")
  const scope = spanOf(b, "settings-error-scope")
  assert.ok(scope, "段标节点在场")
  assert.equal(scope.textContent, EN["settings.mcpSection"], "段标 = 段名词键出词")
  const text = spanOf(b, "settings-error-text")
  assert.equal(text.textContent, EN["settings.reason.mtimeConflict"], "文本 = 词化句")
  assert.notEqual(text.textContent, "mtime-conflict", "≠ 原串（词化成立）")
})

test("L640-② 表外原样直传：表外 reason ⇒ 文本逐字 = 原样串 ∧ 段标仍在", () => {
  const raw = "MCP reconnect srv failed: boom"
  showSettingsError("mcp", raw)
  const b = bannerOf()
  assert.ok(b, "banner 在场")
  assert.equal(spanOf(b, "settings-error-scope").textContent, EN["settings.mcpSection"], "段标仍在")
  assert.equal(spanOf(b, "settings-error-text").textContent, raw, "表外 reason 逐字直传")
})

test("L640-③ panel ⇒ 零段标节点（文本照走词化）", () => {
  showSettingsError("panel", "mtime-conflict")
  const b = bannerOf()
  assert.ok(b, "banner 在场")
  assert.equal(b.children.length, 1, "零段标——仅文本节点")
  assert.equal(spanOf(b, "settings-error-scope"), null, "段标节点不落")
  assert.equal(b.getAttribute("data-scope"), "panel")
  assert.equal(spanOf(b, "settings-error-text").textContent, EN["settings.reason.mtimeConflict"])
})

test("L640-④ 关面板不丢：关面板态调用 ⇒ 零节点；开面板（buildSettings 后）⇒ 复现", () => {
  closePanel()
  assert.equal(bannerOf(), null, "前置 = 面板关 ∕ 零 banner")
  showSettingsError("mcp", "mtime-conflict")
  assert.equal(bannerOf(), null, "关面板态到达 ⇒ 零节点（落槽待显）")
  openPanel()
  const b = bannerOf()
  assert.ok(b, "开面板建面（buildSettings 尾渲）⇒ 复现")
  assert.equal(b.getAttribute("data-scope"), "mcp")
  assert.equal(spanOf(b, "settings-error-scope").textContent, EN["settings.mcpSection"])
  assert.equal(spanOf(b, "settings-error-text").textContent, EN["settings.reason.mtimeConflict"])
})

test("L640-⑤ 单实例：二次调用替换（最后一条胜——body 内恰一 banner）", () => {
  showSettingsError("mcp", "first")
  showSettingsError("tools", "second")
  const banners = bodyEl.children.filter((c) => c.id === "settings-error-banner")
  assert.equal(banners.length, 1, "单实例（旧件移除）")
  const b = banners[0]
  assert.equal(spanOf(b, "settings-error-scope").textContent, EN["settings.toolsSection"], "段标 = 后一条")
  assert.equal(spanOf(b, "settings-error-text").textContent, "second", "文本 = 后一条")
})

test("L640-⑥ 关 = 销账：closeSettings() 后复开 ⇒ 不复现", () => {
  showSettingsError("mcp", "mtime-conflict")
  assert.ok(bannerOf(), "前置 = banner 在场")
  closePanel()
  openPanel()
  assert.equal(bannerOf(), null, "清槽 ⇒ 复开不复现")
})

test("L640-⑦ 源锁（写窄）：showSettingsError 体内零 setTimeout（不自散）；打开等待定时器不在锁域", () => {
  const js = src("thincoder-vscode/webview/settings.js")
  const start = js.indexOf("export function showSettingsError")
  assert.ok(start >= 0, "showSettingsError 在档")
  const end = js.indexOf("\n}", start)
  assert.ok(end > start, "函数体截取成立")
  const body = js.slice(start, end)
  assert.ok(!body.includes("setTimeout"), "showSettingsError 体内零 setTimeout（banner 移除路径零定时器）")
  // 行为面（同腿）：调用零定时器调度 ⇒ 推进全部挂起定时器后 banner 仍在
  closePanel(); openPanel()
  showSettingsError("mcp", "mtime-conflict")
  assert.ok(bannerOf(), "前置 = banner 在场")
  const before = timers.length
  showSettingsError("mcp", "mtime-conflict")
  assert.equal(timers.length, before, "零定时器调度（无 6s 自散）")
  drainTimers()
  assert.ok(bannerOf(), "推进全部挂起定时器 ⇒ banner 仍在")
  // 锁域外：同档打开等待器（250ms 回退）合法保有（写窄——不误伤）
  assert.ok(js.includes("_agentSettingsWaiterTimers"), "打开等待定时器在档（锁域外）")
})

test("L640-⑧ 闭集外 scope ⇒ 零段标（reason 仍走表外原样直传）", () => {
  showSettingsError("bogus", "boom-raw")
  const b = bannerOf()
  assert.ok(b, "banner 在场")
  assert.equal(b.children.length, 1, "零段标节点（同 panel 支）")
  assert.equal(spanOf(b, "settings-error-scope"), null)
  assert.equal(spanOf(b, "settings-error-text").textContent, "boom-raw", "reason 原样直传")
})

test("L640-⑨ 空 reason（'' ∕ 缺同判）⇒ 零节点（含替换支：旧 banner 不残留）", () => {
  showSettingsError("mcp", "")
  assert.equal(bannerOf(), null, "空串 ⇒ 零节点")
  showSettingsError("mcp")
  assert.equal(bannerOf(), null, "缺 ⇒ 零节点（同判）")
  showSettingsError("mcp", "mtime-conflict")
  assert.ok(bannerOf(), "前置再立")
  showSettingsError("tools", "")
  assert.equal(bannerOf(), null, "空 reason 替换 ⇒ 旧 banner 不残留")
})

test("L640-X 扩展侧源锁（文本锁）：发射全 8 处经助手 ∕ 零 text: 残留 ∕ 冲突码分派单源", () => {
  const mcp = src("thincoder-vscode/src/extension/panel-mcp.mjs")
  const msgs = src("thincoder-vscode/src/extension/panel-messages-settings.mjs")
  const settingsMjs = src("thincoder-vscode/src/extension/settings.mjs")
  const chatMessages = src("thincoder-vscode/webview/chat-messages.js")
  assert.equal((mcp.match(/postProviderError\(panel,/g) ?? []).length, 4, "panel-mcp 四站点经助手")
  assert.equal((msgs.match(/postProviderError\(panel,/g) ?? []).length, 4, "panel-messages-settings 四站点经助手")
  assert.equal((mcp.match(/"providerError"/g) ?? []).length, 0, "panel-mcp 零载荷字面残留")
  assert.equal((msgs.match(/"providerError"/g) ?? []).length, 0, "panel-messages-settings 零载荷字面残留")
  assert.ok(!/type:\s*"providerError",\s*text:/.test(mcp + msgs), "零 `text:` 字面残留")
  assert.match(settingsMjs, /export function postProviderError\(panel, scope, err\) \{/, "助手定义在此")
  assert.ok(settingsMjs.includes("CONFIG_CONFLICT_HINT"), "助手含冲突码分派（常量面）")
  assert.ok(settingsMjs.includes('"mtime-conflict"'), "助手判定码字面")
  assert.match(settingsMjs, /type: "providerError", scope, reason/, "载荷 v2 构造单源")
  assert.match(chatMessages, /showSettingsError\(m\.scope, m\.reason\)/, "webview 入线 = (scope, reason)")
  assert.ok(!chatMessages.includes("showSettingsError(m.text)"), "旧裸串入线零残留")
  // 全扫（VSC src + webview）：线名（引号字面）恰两档 = 构造单源 + 消费单点；
  // 载荷构造 `type: "providerError"` 恰一处（8 站点只经助手，零第二构造点）
  const scan = (needle) => {
    const hits = []
    const scanDir = (abs, rel) => {
      for (const n of readdirSync(abs)) {
        const p = join(abs, n)
        if (statSync(p).isDirectory()) { if (n !== "node_modules") scanDir(p, `${rel}/${n}`); continue }
        if (!/\.(mjs|js)$/.test(n)) continue
        if (readFileSync(p, "utf8").includes(needle)) hits.push(`${rel}/${n}`)
      }
    }
    scanDir(`${ROOT}thincoder-vscode/src`, "src")
    scanDir(`${ROOT}thincoder-vscode/webview`, "webview")
    return hits.sort()
  }
  assert.deepEqual(scan('"providerError"'), ["src/extension/settings.mjs", "webview/chat-messages.js"], "线名引号字面恰两档（构造单源 + 消费单点）")
  assert.deepEqual(scan('type: "providerError"'), ["src/extension/settings.mjs"], "载荷构造单源")
  // #640 修正支：`_confirmDelete` 保留门在位 ∧ 失实短语零残留
  const settingsJs = src("thincoder-vscode/webview/settings.js")
  assert.ok(settingsJs.includes("window._confirmDelete = function(btn, action) { action() }"), "保留门在位")
  assert.ok(!settingsJs.includes("ruling exception"), "注释失实短语零残留")
  // smoke 调用形随动（旧单参形零残留）
  const smoke = src("thincoder-vscode/test/smoke-settings.mjs")
  assert.ok(smoke.includes('showSettingsError("panel", "test error")'), "smoke 调用形随动")
})

// ═══ #17 · 三腿（真机腿 = 父侧面）═════════════════════════════════════════════════

test("L17-① 读链源锁：push 快照携 autoThink（读面半在场补齐）", () => {
  const s = src("thincoder-vscode/src/extension/settings.mjs")
  assert.ok(s.includes("autoThink: s.autoThink,"), "agentSettings() 快照携 autoThink")
  assert.ok(s.includes("autoThink: a?.autoThink ?? d.autoThink"), "loadAgentSettings 读面在位（缺省 false 语义链）")
})

test("L17-② 写链行为腿（纯 Node 直驱）：显式布尔写（true ∕ false ∕ 缺席零动）", async () => {
  const coreIo = await import("../../thincoder-core/config-io.mjs")
  const { saveAgentSettingsFromPanel } = await import("../../thincoder-vscode/src/extension/settings-panel-write.mjs")
  const dir = mkdtempSync(join(tmpdir(), "vsc-carryover-17-"))
  const cfg = join(dir, "config.json")
  writeFileSync(cfg, JSON.stringify({}, null, 2))
  coreIo._setConfigPathForTest(cfg)
  try {
    const disk = () => JSON.parse(readFileSync(cfg, "utf8"))
    saveAgentSettingsFromPanel({ autoThink: true })
    assert.equal(disk().agent?.autoThink, true, "① true ⇒ 盘面 true")
    saveAgentSettingsFromPanel({ autoThink: false })
    assert.equal(disk().agent?.autoThink, false, "② false ⇒ 盘面 false（显式写）")
    assert.ok("autoThink" in disk().agent, "false 落盘为显式布尔（键在场——非删键）")
    saveAgentSettingsFromPanel({ autoThink: true }) // 判别性前置复位：缺席支不得以「同值」假绿
    assert.equal(disk().agent?.autoThink, true, "前置复位 = true")
    saveAgentSettingsFromPanel({ maxTurns: 55 })
    assert.equal(disk().agent?.autoThink, true, "③ 载荷缺席 ⇒ 该键零动（置 true 后缺席保存仍 true）")
    assert.equal(disk().agent?.maxTurns, 55, "对照字段照常写（写面在盘）")
  } finally { coreIo._resetConfigPathForTest() }
})

test("L17-③ 渲染 ∕ 载荷腿（fake DOM）：两态渲染 + change ⇒ posted 布尔", () => {
  SS.agentSettings = { ...(SS.agentSettings || {}), autoThink: true }
  const htmlOn = agentCardHtml()
  assert.ok(htmlOn.includes('id="ag-autothink" checked>'), "true ⇒ checked")
  assert.ok(htmlOn.includes(EN["settings.agent.autoThink"]), "词键出词（label）")
  assert.ok(htmlOn.indexOf('id="ag-verifyguard"') < htmlOn.indexOf('id="ag-autothink"'), "位序 = verifyGuard 后位")
  SS.agentSettings = { ...(SS.agentSettings || {}), autoThink: false }
  const htmlOff = agentCardHtml()
  assert.ok(htmlOff.includes('id="ag-autothink"'), "控件恒在")
  assert.ok(!htmlOff.includes('id="ag-autothink" checked'), "false ⇒ 无 checked")
  // 载荷腿：绑定 + change 驱动（控件桩件 = 我席预置面）
  const card = new FakeNode("section")
  const chkEl = new FakeNode("input"); chkEl.id = "ag-autothink"; card.appendChild(chkEl)
  _byId.set("ag-autothink", chkEl)
  const anchor = new FakeNode("input"); anchor.id = "ag-maxturns"; anchor.closest = () => card
  _byId.set("ag-maxturns", anchor)
  bindAgentControls()
  const drain = (from) => posted.slice(from).filter((m) => m.type === "saveAgentSettings")
  chkEl.checked = true
  let at = posted.length
  chkEl.fire("change")
  let sent = drain(at)
  assert.ok(sent.length >= 1, "change ⇒ saveAgentSettings 出站")
  assert.equal(sent.at(-1).settings.autoThink, true, "true 布尔随载荷（恒携）")
  chkEl.checked = false
  at = posted.length
  chkEl.fire("change")
  sent = drain(at)
  assert.equal(sent.at(-1).settings.autoThink, false, "false 布尔随载荷（显式写）")
})
