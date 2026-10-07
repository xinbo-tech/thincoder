/**
 * 2026-10-07-provider-config-parity.test.mjs — 批档单元件（随批档存档；直接跑：node --test）。
 *
 * 三端对齐批（`docs/batches/2026-10-07-provider-config-parity.md`——台账 #1027–#1035）共享件：
 * 腿按舱分写、各自追加（勿动他人腿）——
 *  - C1（核 · 舱一 = 核+CLI）：`addProviderEntry` 受 `proxy`——三径（`true` 落旗 ∥ 缺 ⇒ 零键 ∥ 非真 ⇒ 零键），
 *    载荷/落条实读（tmp config 直驱）。
 *  - L1（CLI · 舱一）：三探针点收敛源锁（`provider-admin.mjs` ∥ `cmd-config.mjs` ∥ `wizard.mjs`）
 *    + 添加流代理问句/问序 + 核 `probeTargetOf` 同判定自证（执行）。
 *  - V*（VSC · 舱二）∥ D*（桌面 · 舱三）：由各舱向本件追加。
 *
 * 用 temp 配置注入（`_setConfigPathForTest`）——绝不触碰真 `~/.thincoder/config.json`。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const CORE = new URL("../../thincoder-core/", import.meta.url).href
const CLI = new URL("../../thincoder-cli/", import.meta.url).href

/** temp config 路径（每用例各自目录——隔离真配置）。 */
function tmpConfigPath() {
  return join(mkdtempSync(join(tmpdir(), "tc-provider-parity-")), "config.json")
}

/** 源锁读面（批档 §2.6 机检面 = 读源文本断言字面）。 */
function readSrc(rel) {
  return readFileSync(new URL(rel, CLI), "utf8")
}

// ═══ C1（核 · 舱一）：addProviderEntry 受 proxy——三径 ═══

test("C1 addProviderEntry 受 proxy：true 落旗 ∥ 缺 ⇒ 零键 ∥ 非真 ⇒ 零键（载荷/落条实读）", async () => {
  const { addProviderEntry, _setConfigPathForTest, _resetConfigPathForTest, PROVIDER_PRESETS } =
    await import(CORE + "config-io.mjs")
  const cfgPath = tmpConfigPath()
  _setConfigPathForTest(cfgPath)
  try {
    // ① proxy: true ⇒ 同批落 `proxy: true`
    assert.equal(addProviderEntry({ custom: { name: "tc-a", baseURL: "https://a.example.com/v1", model: "m-a" }, proxy: true }), null)
    // ② 缺（payload 无 proxy 键）⇒ 零键
    assert.equal(addProviderEntry({ custom: { name: "tc-b", baseURL: "https://b.example.com/v1", model: "m-b" } }), null)
    // ③ 非真 ⇒ 零键（判据 = `=== true`；false ∥ 字符串 "true" 均不落）
    assert.equal(addProviderEntry({ custom: { name: "tc-c", baseURL: "https://c.example.com/v1", model: "m-c" }, proxy: false }), null)
    assert.equal(addProviderEntry({ custom: { name: "tc-d", baseURL: "https://d.example.com/v1", model: "m-d" }, proxy: "true" }), null)
    // ④ 预设形同径（旗判据在分支合流后——两形共享同一条）
    const presetName = Object.keys(PROVIDER_PRESETS)[0]
    assert.equal(addProviderEntry({ preset: presetName, proxy: true }), null)

    const raw = JSON.parse(readFileSync(cfgPath, "utf8"))
    const get = (n) => raw.providers.find((p) => p?.name === n)
    assert.deepEqual(get("tc-a"), { name: "tc-a", baseURL: "https://a.example.com/v1", model: "m-a", proxy: true })
    assert.deepEqual(get("tc-b"), { name: "tc-b", baseURL: "https://b.example.com/v1", model: "m-b" })
    assert.deepEqual(get("tc-c"), { name: "tc-c", baseURL: "https://c.example.com/v1", model: "m-c" })
    assert.deepEqual(get("tc-d"), { name: "tc-d", baseURL: "https://d.example.com/v1", model: "m-d" })
    assert.equal(get(presetName).proxy, true)
    assert.equal(get(presetName).name, presetName)
  } finally {
    _resetConfigPathForTest()
  }
})

// ═══ L1（CLI · 舱一）：三探针点收敛 + 代理问句/问序 + 同判定自证 ═══

test("L1a 三探针点收敛源锁：目标构造 = 核 probeTargetOf（执行体与返形零改）", async () => {
  const admin = readSrc("src/tui/provider-admin.mjs")
  const cmdConfig = readSrc("src/tui/cmd-config.mjs")
  const wizard = readSrc("src/tui/wizard.mjs")
  const catalog = readSrc("src/tui/model-catalog.mjs")
  // ① probeChannelFlow（添加流 ∥ 设 key 流共用的流尾探针）
  assert.ok(admin.includes("probeChannelModels(probeTargetOf(cfg))"), "provider-admin:probeChannelFlow 目标构造应收敛 probeTargetOf")
  // ② /config 默认模型子菜单探针
  assert.ok(cmdConfig.includes("probeChannelModels(probeTargetOf(p))"), "cmd-config 探针行应收敛 probeTargetOf")
  // ③ 首启向导流尾探针
  assert.ok(wizard.includes("probeChannelModels(probeTargetOf(channel))"), "wizard 探针行应收敛 probeTargetOf")
  // D9：执行体（tui/model-catalog.mjs——同名异签名）零改——仍收单 cfg
  assert.ok(catalog.includes("export async function probeChannelModels(providerConfig)"), "执行体签名零改")
})

test("L1b 添加流代理问句：两支各一（No (direct) 缺省 ∥ Yes (proxy)）∥ 问序 key → proxy → 探针", async () => {
  const admin = readSrc("src/tui/provider-admin.mjs")
  // 代理问句两支各一（picker 标题字面 ×2）
  assert.equal((admin.match(/Route this provider's model requests through the proxy/g) ?? []).length, 2, "代理问句应两支各一")
  assert.equal((admin.match(/"No \(direct\)"/g) ?? []).length, 2, "picker 行 No (direct)（缺省项）×2")
  assert.equal((admin.match(/"Yes \(proxy\)"/g) ?? []).length, 2, "picker 行 Yes (proxy) ×2")
  // 仅 Yes 落旗（Esc/No ⇒ 零键零写——两支各一）
  assert.equal((admin.match(/route\?\.name === "yes"/g) ?? []).length, 2, "Yes 为唯一写径")
  assert.equal((admin.match(/cfg\.proxy = true/g) ?? []).length, 2, "两支各落一旗（cfg.proxy = true ×2）")
  // 问序（#1028 · 残余端差登记见批档 §2.9⑤）：key 后、流尾探针前——两支各验
  const customSeg = admin.slice(admin.indexOf('if (se.kind === "custom")'), admin.indexOf("const preset = PRESETS[se.name]"))
  const presetSeg = admin.slice(admin.indexOf("const preset = PRESETS[se.name]"), admin.indexOf("async function removeProviderFlow"))
  for (const [seg, label] of [[customSeg, "custom 支"], [presetSeg, "预设支"]]) {
    const ik = seg.indexOf("Enter API key for")
    const ip = seg.indexOf("Route this provider")
    const iProbe = seg.indexOf("probeChannelFlow(")
    assert.ok(ik !== -1 && ip !== -1 && iProbe !== -1, `${label}：key ∥ 代理问句 ∥ 探针三问应在场`)
    assert.ok(ik < ip && ip < iProbe, `${label}：问序应为 key → proxy → 探针`)
    // 行序：No 在前（picker 首项 = 缺省 = 直连）；Yes 只由显式选择落旗
    const ino = seg.indexOf('"No (direct)"')
    const iyes = seg.indexOf('"Yes (proxy)"')
    assert.ok(ino !== -1 && iyes !== -1 && ino < iyes, `${label}：No (direct) 应为前项（缺省 = 直连）`)
    // 旗落位 = 问句后、流尾探针前（Yes 径：落盘 + 内存镜像，随后才探）
    const iMirror = seg.indexOf("cfg.proxy = true")
    assert.ok(ip < iMirror && iMirror < iProbe, `${label}：旗落应在代理问句后、流尾探针前`)
  }
})

test("L1c 同判定自证（执行）：逐渠旗 ∧ 全局 proxy.model ⇒ 代理目标 ∥ 否则直连", async () => {
  const { _setConfigPathForTest, _resetConfigPathForTest } = await import(CORE + "config-io.mjs")
  const { probeTargetOf } = await import(CORE + "provider-flows.mjs")
  const cfgPath = tmpConfigPath()
  _setConfigPathForTest(cfgPath)
  try {
    writeFileSync(cfgPath, JSON.stringify({ proxy: { uri: "http://127.0.0.1:9", model: true } }))
    const on = probeTargetOf({ name: "p", baseURL: "https://p.example.com/v1", apiKey: " sk ", format: "anthropic", proxy: true })
    assert.equal(on.proxyUri, "http://127.0.0.1:9", "双门槛齐 ⇒ 探针走代理目标")
    assert.deepEqual(Object.keys(on).sort(), ["apiKey", "baseURL", "format", "name", "proxyUri"], "返形 = listModels 可消费目标")
    assert.equal(on.apiKey, "sk", "apiKey 归一（trim）")
    // 逐渠旗缺 ∥ 非真 ⇒ 直连（同一全局闸开也不走）
    assert.equal(probeTargetOf({ name: "p", baseURL: "https://p.example.com/v1" }).proxyUri, undefined)
    assert.equal(probeTargetOf({ name: "p", baseURL: "https://p.example.com/v1", proxy: false }).proxyUri, undefined)
    // 全局 proxy.model 关 ⇒ 直连（双门槛）
    writeFileSync(cfgPath, JSON.stringify({ proxy: { uri: "http://127.0.0.1:9", model: false } }))
    assert.equal(probeTargetOf({ name: "p", baseURL: "https://p.example.com/v1", proxy: true }).proxyUri, undefined)
  } finally {
    _resetConfigPathForTest()
  }
})

// ═══ V 腿（VSC · 舱二）：弹窗 ∥ 字段序 ∥ 开关 ∥ 扩面四件 ∥ 删除符（#1027–#1035）═══
//
// 设计面（逐条判据）= `docs/vsc/design/SETTINGS.md` §2.16；机检点名 = 批档 §2.6 测试面 V1–V11。
// 假 DOM harness 沿 `2026-09-29-vsc-carryover-settings.test.mjs` 先例（按需增强：后代 ∕ 逗号
// 选择器、`#id` 匹配、`select.options` 维护、`innerHTML` 子集解析、计时器桩 + 焦点序记录）。

const { readdirSync } = await import("node:fs")
const VSC = new URL("../../thincoder-vscode/", import.meta.url).href
const vscSrc = (rel) => readFileSync(new URL(rel, VSC), "utf8")

// ─── mini 假 DOM（装载面；`registerHooks` 零用——webview 链不 import vscode）─────────
const camelId = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
const _attached = new Map() // 挂树节点（真 DOM `getElementById` 语义面）
const _stubs = new Map()    // 静态件替身（index.html 件 ∥ innerHTML 未解析面）
// 动态件：不在树 ⇒ null（真 DOM 语义——弹窗开 ∥ 关建清；否则单例判据会被幻影桩假绿）
const DYNAMIC_IDS = new Set([
  "prov-add-dialog", "pa-type", "pa-preset-info", "pa-custom-fields", "pa-name", "pa-url", "pa-format",
  "pa-key", "pa-proxy", "pa-custom-tail", "pa-fetch-btn", "pa-conn-status", "pa-model",
  "pa-model-candidates", "pa-save-btn", "pa-cancel-btn",
])
const _focused = [] // focus() 序（V9 同拍序末位焦点）

class FText { constructor(v) { this.textContent = String(v) } }

class FNode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase(); this.id = ""; this.attrs = {}; this.dataset = {}
    this.children = []; this.listeners = []; this.textContent = ""; this.parent = null
    this.value = ""; this.checked = false; this.type = ""; this.title = ""; this.placeholder = ""
    this.disabled = false; this.options = []; this.offsetHeight = 0
    this.style = new Proxy({}, { get: (t, k) => (k in t ? t[k] : ""), set: (t, k, v) => { t[k] = v; return true } })
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
  setAttribute(k, v) { const s = String(v); this.attrs[k] = s; if (k === "class") this.className = s; else if (k.startsWith("data-")) this.dataset[camelId(k.slice(5))] = s }
  getAttribute(k) { if (k.startsWith("data-")) { const v = this.dataset[camelId(k.slice(5))]; if (v !== undefined) return String(v) } return this.attrs[k] ?? null }
  addEventListener(type, fn) { this.listeners.push({ type, fn }) }
  removeEventListener() {}
  fire(type, extra = {}) {
    const ev = { type, target: this, stopped: false, preventDefault() {}, stopPropagation() { ev.stopped = true }, ...extra }
    for (const l of [...this.listeners]) if (l.type === type) l.fn(ev)
    return ev
  }
  focus() { _focused.push(this) }
  getBoundingClientRect() { return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 } }
  get parentElement() { return this.parent }
  get childNodes() { return [...this.children] }
  get firstChild() { return this.children[0] ?? null }
  get firstElementChild() { return this.children.find((c) => c instanceof FNode) ?? null }
  appendChild(node) {
    const child = node instanceof FNode || node instanceof FText ? node : new FText(node)
    child.parent = this
    this.children.push(child)
    if (this.tagName === "SELECT" && child instanceof FNode && child.tagName === "OPTION") this.options.push(child)
    regTree(child)
    return child
  }
  append(...nodes) { for (const n of nodes) this.appendChild(n) }
  prepend(node) { const child = node instanceof FNode || node instanceof FText ? node : new FText(node); child.parent = this; this.children.unshift(child); regTree(child) }
  insertBefore(node, anchor) { const at = anchor == null ? -1 : this.children.indexOf(anchor); if (at < 0) return this.appendChild(node); node.parent = this; this.children.splice(at, 0, node); regTree(node); return node }
  replaceChildren(...nodes) { for (const c of [...this.children]) unregTree(c); this.children = []; this.options = []; for (const n of nodes) this.appendChild(n) }
  remove() {
    if (this.parent) {
      const i = this.parent.children.indexOf(this); if (i >= 0) this.parent.children.splice(i, 1)
      const oi = this.parent.options.indexOf(this); if (oi >= 0) this.parent.options.splice(oi, 1)
      this.parent = null
    }
    unregTree(this)
  }
  replaceWith(node) { const p = this.parent; if (!p) return; const i = p.children.indexOf(this); if (i >= 0) p.children[i] = node; node.parent = p; regTree(node); unregTree(this) }
  walk(fn) { for (const c of this.children) if (c instanceof FNode) { fn(c); c.walk(fn) } }
  querySelector(sel) { let hit = null; this.walk((n) => { if (hit === null && matchSelector(n, sel)) hit = n }); return hit }
  querySelectorAll(sel) { const out = []; this.walk((n) => { if (matchSelector(n, sel)) out.push(n) }); return out }
  closest() { return null }
  contains(n) { for (let c = n; c; c = c.parent ?? null) if (c === this) return true; return false }
  set innerHTML(v) { for (const c of [...this.children]) unregTree(c); this.children = []; this.options = []; this._html = String(v); for (const n of parseHtml(this._html)) this.appendChild(n) }
  get innerHTML() { return this._html ?? "" }
  set outerHTML(v) { this._html = String(v); for (const c of [...this.children]) unregTree(c); this.children = [] }
  get outerHTML() { return this._html ?? "" }
}

function regTree(n) { if (!(n instanceof FNode)) return; if (n.id) _attached.set(n.id, n); for (const c of n.children) regTree(c) }
function unregTree(n) { if (!(n instanceof FNode)) return; if (n.id && _attached.get(n.id) === n) _attached.delete(n.id); for (const c of n.children) unregTree(c) }

/** 选择器（子集）：逗号 ∪ ∥ 后代空白 ∥ `#id` ∥ `.class` ∥ `[attr]` ∥ `[attr="v"]` ∥ tag。 */
function matchSelector(node, sel) {
  for (const part of String(sel).split(",")) { const s = part.trim(); if (s && matchCompound(node, s)) return true }
  return false
}
function matchCompound(node, sel) {
  const parts = sel.split(/\s+/).filter(Boolean)
  if (!matchSimple(node, parts[parts.length - 1])) return false
  let p = node.parent
  for (let i = parts.length - 2; i >= 0; i--) {
    let found = false
    while (p) { if (p instanceof FNode && matchSimple(p, parts[i])) { found = true; p = p.parent; break } p = p.parent }
    if (!found) return false
  }
  return true
}
function matchSimple(node, sel) {
  const re = /(\w+)|#([\w-]+)|\.([\w-]+)|\[([^\]=]+)(?:="([^"]*)")?\]/g
  let m; let matched = false
  while ((m = re.exec(sel)) !== null) {
    matched = true
    if (m[1] !== undefined) { if (node.tagName !== m[1].toUpperCase()) return false }
    else if (m[2] !== undefined) { if (node.id !== m[2]) return false }
    else if (m[3] !== undefined) { if (!node.classList.contains(m[3])) return false }
    else {
      const val = m[4].startsWith("data-") ? node.dataset[camelId(m[4].slice(5))] : node.attrs[m[4]]
      if (val === undefined || val === null) return false
      if (m[5] !== undefined && String(val) !== m[5]) return false
    }
  }
  return matched
}
/** `innerHTML` 子集解析（确认件驱动面：文本 div + 两 button 平铺）——深嵌套同 tag 退化为文本，绝不抛。 */
function parseHtml(html) {
  const out = []
  const re = /<(\w+)((?:\s[^>]*)?)>([\s\S]*?)<\/\1>/g
  let last = 0; let m
  while ((m = re.exec(html)) !== null) {
    if (m.index > last) { const t = html.slice(last, m.index); if (t.trim()) out.push(new FText(t)) }
    const el = new FNode(m[1])
    for (const a of m[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)) el.setAttribute(a[1], a[2] ?? "")
    for (const c of parseHtml(m[3])) el.appendChild(c)
    out.push(el)
    last = re.lastIndex
  }
  if (last < html.length) { const t = html.slice(last); if (t.trim()) out.push(new FText(t)) }
  return out
}

// 计时器桩（推进 = 手动 `drainTimers`——V9 同拍序 ∥ 开框焦点腿用）
const timers = []
globalThis.setTimeout = (fn, ms) => { const h = { fn, ms }; timers.push(h); return h }
globalThis.clearTimeout = (h) => { const i = timers.indexOf(h); if (i >= 0) timers.splice(i, 1) }
const drainTimers = () => { let guard = 0; while (timers.length > 0 && guard++ < 1000) { const h = timers.shift(); try { h.fn() } catch { /* 桩件定时器兜底 */ } } }

const postSink = [] // webview → host 上行捕获（全部出口）
globalThis.Node = FNode
const bodyEl = new FNode("body")
globalThis.document = {
  body: bodyEl,
  documentElement: new FNode("html"),
  head: new FNode("head"),
  getElementById(id) {
    if (_attached.has(id)) return _attached.get(id)
    if (DYNAMIC_IDS.has(id)) return null
    if (!_stubs.has(id)) { const n = new FNode("div"); n.id = id; _stubs.set(id, n) }
    return _stubs.get(id)
  },
  createElement: (t) => new FNode(t),
  createTextNode: (v) => new FText(v),
  querySelector(sel) { return this.querySelectorAll(sel)[0] ?? null },
  querySelectorAll(sel) { const out = []; bodyEl.walk((n) => { if (matchSelector(n, sel)) out.push(n) }); return out },
  addEventListener() {},
  removeEventListener() {},
}
globalThis.window = {
  _vscode: { postMessage: (m) => postSink.push(m) },
  innerWidth: 1200,
  innerHeight: 800,
  requestAnimationFrame: (fn) => setTimeout(fn, 0),
  cancelAnimationFrame: () => {},
  addEventListener() {},
  removeEventListener() {},
}
globalThis.acquireVsCodeApi = () => ({ postMessage: (m) => postSink.push(m), getState: () => ({}), setState() {} })
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0)

const byId = (id) => document.getElementById(id)
const bodyFind = (cls) => bodyEl.children.find((c) => c instanceof FNode && c.classList.contains(cls)) ?? null
const surface = () => ({ backdrop: bodyFind("settings-dialog-backdrop"), card: byId("prov-add-dialog") })
/** 用例级清洗（各腿自守）：框族 ∥ 确认族件清、计时器排空、双簿清零。 */
const clearAll = () => {
  document.querySelectorAll(".settings-dialog-backdrop, .settings-dialog").forEach((el) => el.remove())
  document.querySelectorAll(".auto-confirm, .auto-backdrop").forEach((el) => el.remove())
  drainTimers()
  postSink.length = 0
  _focused.length = 0
}

// ─── 装载 VSC webview 链 + 真词面 ───────────────────────────────────────────────────
const { setStrings } = await import(new URL("webview/i18n.js", VSC).href)
const EN = JSON.parse(vscSrc("locales/en.json"))
const ZH = JSON.parse(vscSrc("locales/zh.json"))
setStrings(EN)
const { initSettings } = await import(new URL("webview/settings.js", VSC).href)
const { SS } = await import(new URL("webview/settings-state.js", VSC).href)
const api = initSettings({ onClose: () => {}, getModels: () => [] })
const openDialog = () => window._openAddProviderDialog()
const PRESETS = [
  { name: "deepseek", desc: "DeepSeek", model: "deepseek-chat", baseURL: "https://api.deepseek.com/v1" },
  { name: "glm", desc: "GLM (Zhipu)", model: "glm-4", baseURL: "https://open.bigmodel.cn/api/paas/v4" },
]
const setPresets = () => { SS.providerStatus = { providers: {}, labels: {}, presets: PRESETS } }
const setType = (v) => { byId("pa-type").value = v; byId("pa-type").fire("change") }

// ─── V1 新档 + 锚源锁 ─────────────────────────────────────────────────────────────

test("V1 新档+锚源锁：弹窗档在案（卡 ∥ 框幕独立类 ∥ role/aria-modal）∥ 五路关在案 ∥ 卡档零表单字面", () => {
  const dlg = vscSrc("webview/settings-provider-dialog.js")
  assert.ok(dlg.includes('"prov-add-dialog"'), "卡 id = prov-add-dialog")
  assert.ok(dlg.includes('"settings-dialog"'), "卡类 = .settings-dialog（新段）")
  assert.ok(dlg.includes('"settings-dialog-backdrop"'), "框幕 = 独立类 .settings-dialog-backdrop（D12）")
  assert.ok(dlg.includes('"role", "dialog"'), "role=dialog")
  assert.ok(dlg.includes('"aria-modal", "true"'), "aria-modal=true")
  assert.ok(dlg.includes('"aria-label", t("settings.addProviderTitle")'), "aria-label = 标题同词")
  assert.ok(dlg.includes('window._openAddProviderDialog = openAddProviderDialog'), "开面 = 单例导出（window._openAddProviderDialog）")
  // 五路关（源锁）：保存 ∥ 取消钮 ∥ 背板 ∥ 框内 Esc（stopPropagation）∥ closeSettings 同清
  assert.ok(dlg.includes("backdrop.addEventListener(\"click\", closeAddProviderDialog)"), "关·背板")
  assert.ok(dlg.includes("cancelBtn.addEventListener(\"click\", closeAddProviderDialog)"), "关·取消钮")
  assert.ok(dlg.includes("e.stopPropagation()"), "关·框内 Esc（停冒泡——不连带关面板）")
  assert.ok(dlg.includes("closeAddProviderDialog() // 关·保存 = 发消息后关"), "关·保存 = 发消息后关")
  assert.ok(vscSrc("webview/settings.js").includes("closeAddProviderDialog()"), "关·closeSettings 同清（settings.js 增调）")
  // 卡档零表单字面（表单 HTML 已迁出）
  const prov = vscSrc("webview/settings-providers.js")
  assert.ok(!prov.includes("prov-add-form"), "settings-providers.js 零 prov-add-form 字面")
  assert.ok(!prov.includes("pa-"), "settings-providers.js 零 pa-* 绑定残留")
  assert.ok(vscSrc("webview/settings.css").includes(".settings-dialog-backdrop") && vscSrc("webview/settings.css").includes(".settings-dialog {"), "样式新段在案（settings.css）")
})

// ─── V2 元素序（源锁 indexOf 序 + 建面 DOM 序双证）─────────────────────────────────

test("V2 元素序：源锁 indexOf 序 + 建面 DOM 序 = type→[name→url→format]→key→proxy→[拉取→model]→save/cancel", () => {
  const dlg = vscSrc("webview/settings-provider-dialog.js")
  const chain = ["pa-type", "pa-custom-fields", "pa-name", "pa-url", "pa-format", "pa-key", "pa-proxy", "pa-custom-tail", "pa-fetch-btn", "pa-model", "pa-save-btn", "pa-cancel-btn"]
  let at = -1
  for (const tok of chain) {
    const i = dlg.indexOf(`"${tok}"`)
    assert.ok(i > at, `${tok} 源序位（indexOf 递增）`)
    at = i
  }
  // 建面 DOM 序（行为面：真件挂树后的先序遍历 = 设计字段序）
  clearAll(); setPresets(); openDialog()
  const ids = []
  byId("prov-add-dialog").walk((n) => { if (n.id) ids.push(n.id) })
  const pos = (id) => ids.indexOf(id)
  for (const id of ["pa-type", "pa-name", "pa-url", "pa-format", "pa-key", "pa-proxy", "pa-custom-tail", "pa-fetch-btn", "pa-conn-status", "pa-model", "pa-save-btn", "pa-cancel-btn"]) {
    assert.ok(pos(id) >= 0, `${id} 建面在场`)
  }
  const order = ["pa-type", "pa-name", "pa-url", "pa-format", "pa-key", "pa-proxy", "pa-custom-tail", "pa-fetch-btn", "pa-conn-status", "pa-model", "pa-save-btn", "pa-cancel-btn"].map(pos)
  assert.deepEqual(order, [...order].sort((a, b) => a - b), "DOM 序 = 用户填写序（name→url→format→key→proxy→拉取→model）")
  assert.ok(pos("pa-preset-info") > pos("pa-type") && pos("pa-preset-info") < pos("pa-custom-fields"), "预设信息行居中（type 后、条件块前）")
  clearAll()
})

// ─── V3 开框单例 ∥ 重置 ∥ 五路关 ───────────────────────────────────────────────────

test("V3 开框（单例 ∥ 重置 ∥ 初始焦点）与五路关（取消 ∥ 背板 ∥ Esc ∥ 保存 ∥ 关面板）", () => {
  clearAll(); setPresets()
  // 开=两件挂 body
  openDialog()
  let s = surface()
  assert.ok(s.backdrop, "框幕在场（.settings-dialog-backdrop）")
  assert.ok(s.card, "卡在场（#prov-add-dialog）")
  assert.equal(s.card.parent, bodyEl, "卡挂 document.body（卡外于 providers 卡）")
  assert.equal(s.card.getAttribute("role"), "dialog")
  assert.equal(s.card.getAttribute("aria-modal"), "true")
  assert.equal(s.card.getAttribute("aria-label"), EN["settings.addProviderTitle"], "aria-label = 词面")
  assert.ok(s.card.querySelector(".settings-subtitle")?.textContent === EN["settings.addProviderTitle"], "体首件 = 标题同词")
  // 单例：再开 ⇒ 零动作（同件 ∥ 幕仍一）
  const cardRef = s.card
  openDialog()
  assert.equal(byId("prov-add-dialog"), cardRef, "单例：二次开 ⇒ 零动作")
  assert.equal(bodyEl.children.filter((c) => c.classList?.contains("settings-dialog-backdrop")).length, 1, "幕仅一")
  // 开框重置 + 初始焦点（+50ms）
  assert.equal(byId("pa-type").value, "deepseek", "类型回首项")
  byId("pa-key").value = "sk-typed"; byId("pa-proxy").checked = true; byId("pa-model").value = "typed"; byId("pa-conn-status").textContent = "stale"
  drainTimers()
  assert.equal(_focused.at(-1)?.id, "pa-type", "初始焦点 = #pa-type（+50ms）")
  // 关①：取消钮
  byId("pa-cancel-btn").fire("click")
  assert.equal(surface().card, null, "取消 ⇒ 卡净"); assert.equal(surface().backdrop, null, "取消 ⇒ 幕净")
  // 关②：背板
  openDialog(); s = surface()
  s.backdrop.fire("click")
  assert.equal(surface().card, null, "背板 ⇒ 卡净"); assert.equal(surface().backdrop, null, "背板 ⇒ 幕净")
  // 关③：框内 Esc（stopPropagation——不连带关面板）
  openDialog(); s = surface()
  const ev = s.card.fire("keydown", { key: "Escape" })
  assert.equal(ev.stopped, true, "Esc 停冒泡（chat.js 关面板分支零触）")
  assert.equal(surface().card, null, "Esc ⇒ 卡净")
  // 关④：保存（发消息后关）——预设形
  openDialog(); setType("deepseek")
  const before = postSink.length
  byId("pa-save-btn").fire("click")
  assert.equal(postSink.slice(before).filter((m) => m.type === "addProvider").length, 1, "保存 ⇒ addProvider 发出")
  assert.equal(surface().card, null, "保存 ⇒ 发消息后关")
  // 关⑤：closeSettings() 同清
  openDialog()
  api.closeSettings()
  assert.equal(surface().card, null, "closeSettings ⇒ 框净")
  assert.equal(surface().backdrop, null, "closeSettings ⇒ 幕净")
  // 重置语义的判别腿：开-填-关-复开 ⇒ 全新空件
  openDialog(); setType("custom"); byId("pa-key").value = "sk-x"; byId("pa-model").value = "m"
  byId("pa-cancel-btn").fire("click")
  openDialog()
  assert.equal(byId("pa-type").value, "deepseek", "复开 ⇒ 类型回首项")
  assert.equal(byId("pa-key").value, "", "复开 ⇒ key 清空")
  assert.equal(byId("pa-proxy").checked, false, "复开 ⇒ proxy 未勾")
  assert.equal(byId("pa-model").value, "", "复开 ⇒ 模型值清空")
  assert.equal(byId("pa-model-candidates").children.length, 0, "复开 ⇒ 候选清空")
  assert.equal(byId("pa-conn-status").textContent, "", "复开 ⇒ 状态行空")
  clearAll()
})

// ─── V4 不拉取可存（#1031）+ 开关写面（#1027 表单半）───────────────────────────────

test("V4 行为腿（#1031 ∥ #1027）：无拉取 + 填 model ⇒ addProvider posted（携 model ∥ 勾选携 proxy）；model 空 ⇒ modelRequired ∥ 零发", () => {
  clearAll(); setPresets()
  // ① 不拉取直存（候选空）
  openDialog(); setType("custom")
  byId("pa-name").value = "my-prov"; byId("pa-url").value = "https://my.example.com/v1"
  byId("pa-model").value = "hand-typed-model"
  byId("pa-key").value = "sk-1"
  let before = postSink.length
  byId("pa-save-btn").fire("click")
  let sent = postSink.slice(before).filter((m) => m.type === "addProvider")
  assert.equal(sent.length, 1, "不拉取 ⇒ 可存（原死路已撤）")
  assert.equal(sent[0].custom.model, "hand-typed-model", "custom 携 model")
  assert.equal(sent[0].key, "sk-1", "key 随载荷")
  assert.equal("proxy" in sent[0], false, "未勾 ⇒ 载荷缺 proxy（缺省 = 零键）")
  // ② 勾选 ⇒ 载荷 +proxy（可选布尔——勾选 ⇒ true）
  openDialog(); setType("custom")
  byId("pa-name").value = "my-prov2"; byId("pa-url").value = "https://my2.example.com/v1"
  byId("pa-model").value = "m2"; byId("pa-proxy").checked = true
  before = postSink.length
  byId("pa-save-btn").fire("click")
  sent = postSink.slice(before).filter((m) => m.type === "addProvider")
  assert.equal(sent[0].proxy, true, "勾选 ⇒ 载荷 +proxy:true")
  // ③ model 空 ⇒ 词 settings.modelRequired ∥ 零发
  openDialog(); setType("custom")
  byId("pa-name").value = "my-prov3"; byId("pa-url").value = "https://my3.example.com/v1"
  before = postSink.length
  byId("pa-save-btn").fire("click")
  assert.equal(postSink.slice(before).filter((m) => m.type === "addProvider").length, 0, "model 空 ⇒ 零发")
  assert.equal(byId("pa-conn-status").textContent, EN["settings.modelRequired"], "词 = settings.modelRequired")
  assert.ok(surface().card, "拒存 ⇒ 框仍在（修正后可再存）")
  // ④ 预设形：勾选 ⇒ proxy 随载荷
  openDialog(); setType("glm"); byId("pa-proxy").checked = true
  before = postSink.length
  byId("pa-save-btn").fire("click")
  sent = postSink.slice(before).filter((m) => m.type === "addProvider")
  assert.equal(sent[0].preset, "glm")
  assert.equal(sent[0].proxy, true, "预设形同径携 proxy")
  clearAll()
})

// ─── V5 空表提示（#1032）────────────────────────────────────────────────────────────

test("V5 行为腿（#1032）：getModels 空 ⇒ #defaultmodel-hint 显 ∥ 零菜单；有候选 ⇒ 清提示 + 开菜单", () => {
  clearAll()
  SS.providerStatus = { providers: {}, labels: {} }
  const hint = byId("defaultmodel-hint")
  hint.style.display = "none"
  SS.getModels = () => []
  let bodyBefore = bodyEl.children.length
  window._defaultModelMenu()
  assert.equal(hint.style.display, "block", "空表 ⇒ 行内提示显（修「点击静默」）")
  assert.equal(bodyEl.children.length, bodyBefore, "空表 ⇒ 零菜单（无 overlay 落体）")
  // 有候选 ⇒ 清提示 + 开菜单（真菜单 overlay 落体）
  SS.getModels = () => [{ id: "m1", provider: "deepseek", label: "M1", reasoning: [] }]
  SS.providerStatus = { providers: { deepseek: {} }, labels: {} }
  SS.agentSettings = {}
  bodyBefore = bodyEl.children.length
  window._defaultModelMenu()
  assert.equal(hint.style.display, "none", "有候选 ⇒ 清提示")
  assert.ok(bodyEl.children.length > bodyBefore, "有候选 ⇒ 菜单开（overlay 落体）")
  clearAll()
  SS.getModels = () => []
})

// ─── V6 拉取路由载荷 + 探果落框 + 代际（③′ / #1031）───────────────────────────────

test("V6 载荷腿（③′）：testProvider 携 proxy = 勾选态；探果 ok ⇒ 候选填充 ∥ 键入值零清；探败 ⇒ 候选清空；代际不符 ⇒ 弃", () => {
  clearAll(); setPresets()
  openDialog(); setType("custom")
  byId("pa-url").value = "https://my.example.com/v1"
  byId("pa-key").value = " sk-1 "
  byId("pa-format").value = "anthropic"
  byId("pa-proxy").checked = true
  let before = postSink.length
  byId("pa-fetch-btn").fire("click")
  let sent = postSink.slice(before).filter((m) => m.type === "testProvider")
  assert.equal(sent.length, 1, "拉取 ⇒ testProvider 发出")
  assert.equal(sent[0].proxy, true, "勾选 ⇒ 载荷 +proxy（宿主按 probeTargetOf 双门槛判定）")
  assert.equal(sent[0].format, "anthropic", "M1 格式随载荷")
  assert.equal(sent[0].apiKey, "sk-1", "apiKey 归一")
  assert.equal(byId("pa-conn-status").textContent, EN["settings.connecting"], "拉取中态")
  // 未勾 ⇒ 载荷缺 proxy（缺省 = 直连——#1026 契约逐字不变）
  byId("pa-proxy").checked = false
  before = postSink.length
  byId("pa-fetch-btn").fire("click")
  sent = postSink.slice(before).filter((m) => m.type === "testProvider")
  assert.equal("proxy" in sent[0], false, "未勾 ⇒ 缺 proxy 键")
  // 探果 ok ⇒ 候选填充（不自动选中）∥ 键入值零清
  byId("pa-model").value = "typed-model"
  api.updateTestProviderResult({ ok: true, models: ["m-a", "m-b", "m-c"] })
  assert.equal(byId("pa-model-candidates").children.length, 3, "候选数 = models 数")
  assert.equal(byId("pa-model").value, "typed-model", "键入值零清（不自动选中）")
  assert.equal(byId("pa-conn-status").textContent, EN["settings.connOk"].replace("${count}", "3"), "连通态词面")
  // 探败 ⇒ 候选清空 ∥ ✗ + 错误串 ∥ 键入值零清
  api.updateTestProviderResult({ ok: false, error: "boom-403" })
  assert.equal(byId("pa-model-candidates").children.length, 0, "探败 ⇒ 候选清空")
  assert.equal(byId("pa-model").value, "typed-model", "探败 ⇒ 键入值零清（不吞手输）")
  assert.equal(byId("pa-conn-status").textContent, "✗ boom-403", "✗ + 原样错误串")
  // 代际：关框 + 复开 ⇒ 老框在飞探果弃（新框零污染）
  byId("pa-cancel-btn").fire("click")
  openDialog()
  const status = byId("pa-conn-status")
  api.updateTestProviderResult({ ok: true, models: ["zombie"] })
  assert.equal(status.textContent, "", "代际不符 ⇒ 弃（状态行零动）")
  assert.equal(byId("pa-model-candidates").children.length, 0, "代际不符 ⇒ 零候选落框")
  // 框不在场 ⇒ 零动（无落点）
  byId("pa-cancel-btn").fire("click")
  api.updateTestProviderResult({ ok: true, models: ["ghost"] })
  assert.equal(surface().card, null, "框不在场 ⇒ 探果零动")
  clearAll()
})

// ─── V7 词面锁（#1033 / #1035）────────────────────────────────────────────────────

test("V7 词面锁：三处字面零残留 ∥ 两语键集相等 ∥ fetchModelsFirst 缺席 ∥ 六值改毕（zh 零「密钥」）", () => {
  // webview 全档扫：三处硬编码显示串零残留（带引号的字面形——散文注释不属显示面）
  for (const f of readdirSync(new URL("webview/", VSC))) {
    if (!f.endsWith(".js")) continue
    const s = vscSrc(`webview/${f}`)
    assert.ok(!s.includes('"(no default model)"'), `${f}：` + '"(no default model)" 零残留')
    assert.ok(!s.includes('"宿主繁忙"'), `${f}："宿主繁忙" 零残留`)
    assert.ok(!s.includes('"不可用"'), `${f}："不可用" 零残留`)
  }
  // 词面（显示面）改经词键
  const prov = vscSrc("webview/settings-providers.js")
  assert.ok(prov.includes('t("settings.noDefaultModel")') && prov.includes('t("settings.providerHostBusy")') && prov.includes('t("settings.providerUnavailable")'), "卡面三词经词键")
  assert.ok(prov.includes('t("settings.defaultModelTitle")') && prov.includes('t("settings.pickModelEmpty")'), "title ∥ 空表提示经词键")
  assert.ok(vscSrc("webview/settings-provider-dialog.js").includes('t("settings.noDefaultModel")'), "弹窗预设行同词")
  // 两语键集相等 ∥ fetchModelsFirst 缺席 ∥ 新键在位
  assert.deepEqual(Object.keys(EN).sort(), Object.keys(ZH).sort(), "两语键集相等")
  assert.ok(!("settings.fetchModelsFirst" in EN) && !("settings.fetchModelsFirst" in ZH), "fetchModelsFirst 缺席（随实现净删）")
  for (const k of ["settings.modelRequired", "settings.pickModelEmpty", "settings.noDefaultModel", "settings.defaultModelTitle", "settings.providerHostBusy", "settings.providerUnavailable"]) {
    assert.ok(k in EN && k in ZH, `${k} 两语在位`)
  }
  // #1035：六值改毕（zh 裸「密钥」清零）
  assert.equal(EN["settings.setKey"], "API Key"); assert.equal(ZH["settings.setKey"], "API Key")
  assert.equal(EN["settings.addKey"], "Add API Key"); assert.equal(ZH["settings.addKey"], "添加 API Key")
  assert.equal(EN["model.setKey"], "API Key…"); assert.equal(ZH["model.setKey"], "设置 API Key…")
  assert.ok(!Object.values(ZH).some((v) => String(v).includes("密钥")), "zh 裸「密钥」清零")
  assert.equal(ZH["error.provider"], "未配置 API Key — 点击 ⚙ 设置")
  assert.equal(ZH["error.failedProvider"], "无法初始化 ${name} — 请检查 API Key")
  assert.equal(ZH["banner.notConfigured"], "⚠ 未配置 — 点击 ⚙ 设置 API Key")
})

// ─── V8 扩展侧文本锁（写面透传 + 探针目标单源）────────────────────────────────────

test("V8 扩展侧文本锁：探针体含 probeTargetOf ∥ 零 proxyUri:null 硬编码 ∥ 两 handler 透传 proxy", () => {
  const s = vscSrc("src/extension/settings.mjs")
  const start = s.indexOf("export async function testProviderConnection")
  assert.ok(start > 0, "testProviderConnection 在案")
  const body = s.slice(start, s.indexOf("\n}", start))
  assert.ok(body.includes("probeTargetOf("), "目标构造 = 核 probeTargetOf（单源）")
  assert.ok(!body.includes("proxyUri: null"), "零 proxyUri:null 硬编码残留")
  assert.ok(body.includes("proxy: proxy === true"), "双门槛判据形（仅真值入构造）")
  assert.ok(s.includes("import { probeTargetOf } from \"@thincoder/core/provider-flows.mjs\""), "核单源 import")
  const pm = vscSrc("src/extension/panel-messages-settings.mjs")
  assert.ok(pm.includes("format: msg.format, proxy: msg.proxy"), "handleTestProvider 透传 proxy")
  assert.ok(pm.includes("key: msg.key, proxy: msg.proxy"), "handleAddProvider 链携 proxy")
  // 旧「websearch/fetch」相抵句零残留（§1.6⑤ 携带项）
  assert.ok(!s.includes("`config.proxy.web` 只管 websearch/fetch"), "相抵句已改述")
})

// ─── V9 首启交棒（源锁 + 行为腿）────────────────────────────────────────────────────

test("V9 首启交棒：源锁（新调用名 ∥ _toggleAddForm 零残留）；行为腿 ⇒ 面板开 + 框两件 ∥ 同拍序末位焦点 #pa-type", async () => {
  clearAll(); setPresets()
  // 源锁
  assert.ok(vscSrc("webview/onboarding.js").includes("window._openAddProviderDialog?.("), "交棒调用 = window._openAddProviderDialog?.()")
  for (const f of readdirSync(new URL("webview/", VSC))) {
    if (!f.endsWith(".js")) continue
    assert.ok(!vscSrc(`webview/${f}`).includes("_toggleAddForm"), `${f}：_toggleAddForm 零残留`)
  }
  // 行为腿：装真档链（新档 + onboarding.js）
  const { ctx } = await import(new URL("webview/state.js", VSC).href)
  const { initOnboarding } = await import(new URL("webview/onboarding.js", VSC).href)
  let opened = 0
  initOnboarding({
    openSettings: () => { // 真 openSettings 的 +50ms 焦点定时器（同拍序判别面）
      opened += 1
      setTimeout(() => { const firstBtn = byId("settings-panel").querySelector("button, input"); if (firstBtn) firstBtn.focus() }, 50)
    },
  })
  ctx.welcomeProvider.value = "custom"
  ctx.welcomeKey.value = "sk-welcome"
  ctx.welcomeSaveBtn.fire("click")
  assert.equal(opened, 1, "_openSettings 调 1")
  assert.ok(surface().backdrop, "首启交棒 ⇒ 框幕在场（可开框）")
  assert.ok(surface().card, "首启交棒 ⇒ 卡在场")
  drainTimers()
  assert.equal(_focused.at(-1)?.id, "pa-type", "两定时器同拍序 ⇒ 末位焦点 = #pa-type（框后调度）")
  clearAll()
})

// ─── V10 行删除符（#1034）──────────────────────────────────────────────────────────

test("V10 行删除符腿（#1034）：两处删除钮字面 = ✕ ∥ 档内 `−` 零残留（注释随述）", () => {
  const prov = vscSrc("webview/settings-providers.js")
  assert.ok(prov.includes('delBtn.textContent = "✕"'), "编辑行取消重建位 = ✕")
  assert.match(prov, />✕<\/button>/, "卡 HTML 行删除钮 = ✕")
  assert.equal((prov.match(/\u2212/g) ?? []).length, 0, "settings-providers.js `−` 零残留（含注释）")
  const dlg = vscSrc("webview/settings-provider-dialog.js")
  assert.equal((dlg.match(/\u2212/g) ?? []).length, 0, "弹窗档 `−` 零残留")
  // 桌面族不动（不在本舱域）＋ 模型菜单 footer 的 − 属另一面（locale 件——零触）
  assert.equal(EN["model.removeProvider"], "\u2212 Remove provider…", "model.removeProvider 保留原符（非行删除符面）")
})

// ─── V11 遮罩隔离（#12 · D12）─────────────────────────────────────────────────────

test("V11 遮罩隔离腿（D12）：框在场 ⇒ 确认族开 ∥ 关两向均不触框组（独立类不入帚扫域）∧ 确认件可叠于框上", async () => {
  clearAll(); setPresets()
  const { showConfirmPopover, closeConfirmPopover } = await import(new URL("webview/settings-widgets.js", VSC).href)
  openDialog()
  const card = surface().card
  // ① 确认族关向（帚扫直呼）⇒ 框 ∥ 幕零动
  closeConfirmPopover()
  assert.equal(surface().card, card, "closeConfirmPopover ⇒ 卡零动")
  assert.ok(surface().backdrop, "closeConfirmPopover ⇒ 幕零动")
  // ② 确认族开向 ⇒ 框 ∥ 幕零动 ∧ 确认两件到场（可叠于框上）
  showConfirmPopover({ text: "x", yesLabel: "Y", noLabel: "N", onConfirm: () => {} })
  assert.equal(surface().card, card, "确认开 ⇒ 卡零动")
  assert.ok(surface().backdrop, "确认开 ⇒ 幕零动")
  assert.ok(bodyFind("auto-confirm"), "确认件在场（叠于框上）")
  assert.ok(bodyFind("auto-backdrop"), "确认遮罩在场")
  // ③ 确认关 ⇒ 框仍在（两族独立生命周期）
  closeConfirmPopover()
  assert.equal(bodyFind("auto-confirm"), null, "确认件清")
  assert.ok(surface().card, "框仍在（独立类）")
  assert.ok(surface().backdrop)
  clearAll()
})

// ══════════════════════════════════════════════════════════════════════════════════════════
// D 腿（桌面 · 舱三 · 三端对齐批）：弹窗 ∥ 单表 ∥ 开径 ∥ 写面 —— 渲染面/主面（平 node 直测）
//   决策单源 = `docs/desktop/design/SETTINGS.md` §2.16（KD-75 ①–⑨）；判据表 = 批档 §2.6 桌面行。
//   本段自持工具与夹具（与 V ∥ C ∥ L 腿零共享 —— 追加式共享件：勿动他人腿）。
// ══════════════════════════════════════════════════════════════════════════════════════════

const DESKTOP = new URL("../../thincoder-desktop/", import.meta.url).href
const deskSrc = (rel) => readFileSync(new URL(rel, DESKTOP), "utf8")
const deskAt = (rel) => new URL(rel, DESKTOP).href
await import(deskAt("test/rc-resolve.mjs")) // `/rc/` 解析钩子（须先于渲染档取件注册 —— 平 node 无 `app://desktop` origin）
const deskI18n = await import(deskAt("renderer/i18n.mjs"))
deskI18n.initDict({ locale: "en" }) // 桌面渲染面词表（树面出词面；值锁 = D5 直读字表）
const { channelFormTree: dsFormTree } = await import(deskAt("renderer/views/settings-controls.mjs"))
const { providersBody: dsProvidersBody } = await import(deskAt("renderer/views/settings-sections-providers.mjs"))
const { ADD_MODAL_GROUP, SECTIONS: DS_SECTIONS, settingsModalTree: dsModalTree } = await import(deskAt("renderer/views/settings.mjs"))

/** 树面小工具（null 容错）：深搜 / 全收 / 锚取（本段自持，零跨舱借用）。 */
const dFind = (node, pred) => {
  if (node === null || typeof node !== "object") return null
  if (Array.isArray(node)) {
    for (const item of node) { const hit = dFind(item, pred); if (hit !== null) return hit }
    return null
  }
  if (pred(node)) return node
  return dFind(node.children ?? null, pred)
}
const dCollect = (node, pred, out = []) => {
  if (node === null || typeof node !== "object") return out
  if (Array.isArray(node)) { for (const item of node) dCollect(item, pred, out); return out }
  if (pred(node)) out.push(node)
  dCollect(node.children ?? null, pred, out)
  return out
}
const dByAction = (node, action) => dFind(node, (n) => n?.props?.["data-action"] === action)

/** 节序签名（文档序；`option` ∥ 无锚件不计 —— 字段 / 动作面「节序」判据单点）。 */
const dSigs = (node, out = []) => {
  if (node === null || typeof node !== "object") return out
  if (Array.isArray(node)) { for (const item of node) dSigs(item, out); return out }
  if (node.tag === "option") return out
  const props = node.props ?? {}
  const sig = props.name ?? props["data-action"] ?? (props["data-preset-info"] !== undefined ? "preset-info" : null)
  if (sig !== null) out.push(sig)
  dSigs(node.children ?? null, out)
  return out
}

/** 夹具：预设两件 / 协议三值 / 弹窗出口表 / 段体注入面 / 面态（八组弹窗夹具 = 批档 §2.6 D3）。 */
const DS_PRESETS = [
  { name: "deepseek", desc: "DeepSeek", model: "deepseek-chat", baseURL: "https://api.deepseek.com" },
  { name: "glm", desc: "GLM", model: "glm-4", baseURL: "https://open.bigmodel.cn/api/paas/v4" },
]
const DS_FORMATS = ["openai", "anthropic", "google"]
const dsModalHandlers = { onSubmit: () => {}, onFetchModels: () => {}, onAddShape: () => {}, onCloseModal: () => {} }
const dsDeps = { channelForm: dsFormTree, verifyControl: () => ({}), reasonWord: (code) => code, formats: DS_FORMATS, edit: null, keyDraft: null }
const dsSection = (over = {}) => ({
  state: "ready", presets: DS_PRESETS, probe: null, draft: null, verify: null, addShape: "preset",
  rows: [
    { name: "p1", hasKey: true, maskedKey: "sk-***", model: "m1", baseURL: "https://p1.example.com" },
    { name: "p2", hasKey: false },
  ],
  ...over,
})
const dsState = (providers = {}, settings = {}) => ({
  locale: "en", theme: "system", activeSession: null, sessionFlags: {},
  settings: {
    open: false, notice: null, modal: null, configured: true, defaultModel: null,
    wizard: { step: 1, dismissed: false, notice: null },
    providers: { state: "none", presets: [], providers: [], edit: null, probe: null, draft: null, keyDraft: null, addShape: "preset", ...providers },
    verify: null,
    model: { state: "none", provider: null, current: null, models: [] },
    agent: { state: "none", fields: [] },
    mcp: { state: "none", servers: [], details: {}, form: null },
    env: { state: "none", proxy: { uri: "", web: true, model: false }, shell: { current: null, candidates: [] }, test: null },
    tools: { state: "none", status: null, building: false, keys: null, edit: null },
    models: { state: "none", consult: [], advisor: { provider: null, model: null }, picker: { provider: "", rows: [], model: null }, advisorPicker: { provider: "", rows: [], model: null } },
    ...settings,
  },
})

// ─── D1 段体树：行族 + 校验回退 + 添加钮（零表单节点）──────────────────────────────

test("D1 providersBody 树：行族 + 校验回退 + 添加钮（零表单节点 ∥ 钮 ⇒ onAddProvider ∥ 缺 handler ⇒ disabled）", () => {
  let adds = 0
  const body = dsProvidersBody(dsSection(), { onRemoveProvider: () => {}, onAddProvider: () => { adds += 1 } }, dsDeps)
  // 零表单节点（原双表单常显内联退场 —— KD-75 ②）
  assert.equal(dCollect(body, (n) => n?.tag === "form").length, 0, "段体零表单节点（双表单退场）")
  assert.equal(dFind(body, (n) => n?.props?.["data-form"] !== undefined), null, "零 form 锚残留")
  // 行族（两行 = 夹具）
  assert.equal(dCollect(body, (n) => n?.props?.["data-provider"] !== undefined).length, 2, "行族两行在场")
  // 添加钮：锚 ∥ 词 ∥ 活件 ∥ 段尾
  const add = dByAction(body, "settings:addProvider")
  assert.ok(add !== null, "添加钮在场（锚 settings:addProvider）")
  assert.equal(add.props.class, "settings-submit", "钮形 = 既有 .settings-submit（零新 CSS）")
  assert.equal(add.children[0], deskI18n.t("settings.addProvider"), "钮词 = settings.addProvider")
  assert.equal(body.at(-1), add, "钮 = 段尾（行族 + 校验回退之后）")
  add.props.onClick()
  assert.equal(adds, 1, "钮 click ⇒ onAddProvider 出口")
  // 校验回退：无行渲出结果 ⇒ 段末（既有判据零改）
  const fallback = dsProvidersBody(dsSection({ verify: { kind: "ok", count: 2, name: "ghost" } }), {}, dsDeps)
  assert.ok(dFind(fallback, (n) => n?.props?.["data-verify"] === "ok") !== null, "无行渲出结果 ⇒ 段末回退在场")
  assert.equal(fallback.at(-1).props["data-action"], "settings:addProvider", "回退后仍为段尾钮")
  // 缺 handler ⇒ 明确禁用（诚实非死控）
  const bare = dByAction(dsProvidersBody(dsSection(), {}, dsDeps), "settings:addProvider")
  assert.equal(bare.props.disabled, true, "缺 onAddProvider ⇒ disabled")
  assert.equal(bare.props.onClick, undefined, "缺 handler ⇒ 零接线")
  // 行内校验结果（有行渲出 ⇒ 就地，零段末回退）—— 既有判据随段体改线后仍达
  const inRow = dsProvidersBody(dsSection({ verify: { kind: "fail", reason: "probe-failed", name: "p1" } }), {}, dsDeps)
  assert.equal(dCollect(inRow, (n) => n?.props?.["data-verify"] === "fail").length, 1, "有行渲出 ⇒ 就地一次")
})

// ─── D2 单表树：两形节序 ∥ activeDefault 条件化 ∥ proxy 两形皆在场 ─────────────────

test("D2 channelFormTree 节序：custom/preset 两形 ∥ activeDefault 条件化 ∥ proxy 两形皆在场（向导步 1 同径）", () => {
  const preset = dsFormTree({ shape: "preset", presets: DS_PRESETS, formats: DS_FORMATS }, dsModalHandlers)
  const custom = dsFormTree({ shape: "custom", presets: DS_PRESETS, formats: DS_FORMATS }, dsModalHandlers)
  // 两形节序（KD-75 ③ 字段序 = 用户填写序）
  assert.deepEqual(dSigs(preset), ["shape", "preset", "preset-info", "key", "proxy", "settings:addPreset", "settings:modalClose"], "预设形节序")
  assert.deepEqual(dSigs(custom), ["shape", "preset", "name", "baseURL", "format", "key", "proxy", "settings:fetchModels", "model", "settings:addCustom", "settings:modalClose"], "自定形节序")
  // proxy 节点两形皆在场（KD-75 ⑤ 明写）
  assert.equal(dFind(preset, (n) => n?.props?.name === "proxy")?.props?.type, "checkbox", "预设形 proxy 拨杆在场")
  assert.equal(dFind(custom, (n) => n?.props?.name === "proxy")?.props?.type, "checkbox", "自定形 proxy 拨杆在场")
  assert.equal(dFind(custom, (n) => n?.props?.name === "proxy")?.props?.["data-draft"], "proxy", "proxy 携草稿申报（第二闸域）")
  // 类型选择：name=preset ∥ 末项 customChoice ∥ 选中回环（切片值 = 预设名）
  const select = dFind(preset, (n) => n?.tag === "select" && n?.props?.name === "preset")
  assert.ok(select !== null, "类型 select name=preset 在场")
  assert.deepEqual(select.children.map((o) => o.props.value), ["deepseek", "glm", "custom"], "预设项 + 自定末项")
  assert.equal(select.children.at(-1).children[0], deskI18n.t("settings.providers.customChoice"), "末项词 = settings.providers.customChoice")
  assert.equal(dFind(dsFormTree({ shape: "glm", presets: DS_PRESETS, formats: DS_FORMATS }, dsModalHandlers), (n) => n?.tag === "option" && n?.props?.selected === true)?.props?.value, "glm", "切片值 ⇒ 命中项选中")
  assert.deepEqual(dSigs(dsFormTree({ shape: "custom", presets: DS_PRESETS, formats: DS_FORMATS }, dsModalHandlers)).slice(0, 2), ["shape", "preset"], "自定形：选择器居首（无 info 行）")
  assert.equal(dCollect(custom, (n) => n?.props?.selected === true).filter((o) => o.tag === "option").length, 1, "自定形：恰一项 selected（免双选中竞位）")
  // 预设信息行：model · baseURL（缺段不落空分隔符）—— 随切片选中
  const glmForm = dsFormTree({ shape: "glm", presets: DS_PRESETS, formats: DS_FORMATS }, dsModalHandlers)
  assert.deepEqual(dFind(glmForm, (n) => n?.props?.["data-preset-info"] !== undefined).children, ["glm-4 · https://open.bigmodel.cn/api/paas/v4"], "切片值 = glm ⇒ 信息行随选中")
  assert.deepEqual(dFind(preset, (n) => n?.props?.["data-preset-info"] !== undefined).children, ["deepseek-chat · https://api.deepseek.com"], "缺省哨位 ⇒ 首项信息行")
  assert.equal(dFind(custom, (n) => n?.props?.["data-preset-info"] !== undefined), null, "自定形零信息行")
  assert.equal(dFind(dsFormTree({ shape: "preset", presets: [{ name: "bare" }], formats: DS_FORMATS }, dsModalHandlers), (n) => n?.props?.["data-preset-info"] !== undefined), null, "两段皆空 ⇒ 零信息行（禁假造）")
  // activeDefault 条件化（KD-75 ⑤：设置弹窗不传 ⇒ 零节点 ∥ 向导 true ⇒ 在场且勾选）
  assert.equal(dFind(preset, (n) => n?.props?.name === "active"), null, "弹窗体（不传 activeDefault）⇒ 零 active 节点")
  const wizard = dsFormTree({ shape: "preset", presets: DS_PRESETS, activeDefault: true, submitKey: "wizard.save" }, { onSubmit: () => {} })
  const active = dFind(wizard, (n) => n?.props?.name === "active")
  assert.equal(active?.props?.checked, true, "向导步 1：active 在场且缺省勾选")
  assert.equal(dFind(wizard, (n) => n?.props?.name === "proxy")?.props?.type, "checkbox", "向导步 1：proxy 同在场（KD-75 ⑤ 明写）")
  assert.deepEqual(dSigs(wizard), ["shape", "preset", "key", "proxy", "active", "settings:addPreset"], "向导步 1 节序（单表同径 —— 无弹窗体三件）")
  assert.equal(dFind(wizard, (n) => n?.tag === "button").children[0], deskI18n.t("wizard.save"), "提交词 = 调用面 submitKey（向导词零改）")
  assert.equal(dFind(preset, (n) => n?.tag === "button").children[0], deskI18n.t("settings.save"), "设置弹窗提交词 = settings.save")
  // 提交锚按形（锚名不碎）
  assert.ok(dByAction(preset, "settings:addPreset") !== null, "预设锚 settings:addPreset")
  assert.ok(dByAction(custom, "settings:addCustom") !== null, "自定锚 settings:addCustom")
  // 草稿作用域单骨（跨形切换键不换骨 ⇒ 第二闸复填达）
  assert.equal(preset.props["data-draft-scope"], "add:provider", "预设形草稿作用域")
  assert.equal(custom.props["data-draft-scope"], "add:provider", "自定形同骨（跨形复填前提）")
  // 弹窗体三件随出口在场（向导不携 ⇒ 预设单选语义保持；零死控）
  assert.equal(dFind(wizard, (n) => n?.props?.["data-action"] === "settings:modalClose"), null, "向导无取消钮（不携 onCloseModal）")
  assert.deepEqual(dFind(wizard, (n) => n?.tag === "select" && n?.props?.name === "preset").children.map((o) => o.props.value), ["deepseek", "glm"], "向导选择器不含自定末项（无切换出口）")
  assert.equal(dFind(wizard, (n) => n?.props?.onChange !== undefined), null, "向导选择器零 change 接线（零死控）")
})

// ─── D3 弹窗树 providerAdd：标题 + 单表 ∥ SCOPES ∥ MODAL_READS ─────────────────────

test("D3 settingsModalTree(\"providerAdd\")：标题 + 单表（零行族）∥ 失败串 scope 过滤 ∥ SCOPES ∥ MODAL_READS", () => {
  const opens = []
  const tree = dsModalTree(dsState({ state: "ready", presets: DS_PRESETS, providers: [{ name: "p1" }] }, { modal: "providerAdd" }), "providerAdd", { ...dsModalHandlers, onCloseModal: () => opens.push("close") })
  assert.ok(tree !== null, "providerAdd 支在案（非表外组 null）")
  // 标题（词键新 —— 非段名）
  assert.equal(tree.card.props["aria-label"], deskI18n.t("settings.addProviderTitle"), "卡可及名 = settings.addProviderTitle")
  const title = dFind(tree.card, (n) => n?.props?.class === "settings-title")
  assert.equal(title.children[0], deskI18n.t("settings.addProviderTitle"), "头标题同词")
  assert.equal(DS_SECTIONS.some((s) => s.name === ADD_MODAL_GROUP), false, "providerAdd 非段名（段面零改）")
  // 体：段态锚（providers 面态）+ 单表唯一 + 零行族
  const body = dFind(tree.card, (n) => n?.props?.class === "settings-modal-body")
  assert.equal(body.props["data-state"], "ready", "体段态 = providers 面态（第二闸在途判据面）")
  assert.equal(dCollect(body, (n) => n?.tag === "form").length, 1, "体 = 单表唯一")
  assert.equal(dFind(body, (n) => n?.props?.["data-form"] !== undefined)?.props?.["data-form"], "preset", "单表随切片 addShape（预设形缺省）")
  assert.equal(dCollect(body, (n) => n?.props?.["data-provider"] !== undefined).length, 0, "体零行族（弹窗体 = 单表唯内容）")
  assert.equal(dFind(body, (n) => n?.props?.["data-action"] === "settings:addProvider"), null, "体零添加钮（入口不在体）")
  // 段态词恰一（§2.16 条 1 体式 = 失败串 + 段态词 + 单表 —— `loading` 态显形：免双同词节点）
  const loadingBody = dFind(dsModalTree(dsState({ state: "loading" }, { modal: "providerAdd" }), "providerAdd", {}).card, (n) => n?.props?.class === "settings-modal-body")
  assert.equal(dCollect(loadingBody, (n) => n?.props?.["data-state-word"] !== undefined).length, 1, "段态词恰一（添加支免叠渲）")
  assert.equal(loadingBody.props["data-state"], "loading", "体段态锚随 providers 面态（在途判据面）")
  // 关锚（✕ —— 三关之三；背板 ∥ 卡内 Esc 归树面同件）
  assert.ok(dByAction(tree.card, "settings:modalClose") !== null, "✕ 锚在案")
  assert.equal(typeof tree.backdrop.props.onClick, "function", "背板 handler 在场")
  // 失败串：scope = providers ∥ panel 显；他组隐（体面过滤）
  const noticeOf = (scope) => dFind(dFind(dsModalTree(dsState({}, { modal: "providerAdd", notice: { scope, reason: "invalid-shape" } }), "providerAdd", {}).card, (n) => n?.props?.class === "settings-modal-body"), (n) => n?.props?.["data-notice"] !== undefined)
  assert.equal(noticeOf("providers")?.props?.["data-scope"], "providers", "scope=providers ⇒ 显（同段域）")
  assert.equal(noticeOf("panel")?.props?.["data-scope"], "panel", "scope=panel ⇒ 显")
  assert.equal(noticeOf("mcp"), null, "他组失败串隐（零节点）")
  // 表外组 ⇒ null（防御档零改）
  assert.equal(dsModalTree(dsState({}, { modal: "providerAdd" }), "bogus", {}), null, "表外组 ⇒ null")
  // 源锁：SCOPES 八值（七段名 + 添加弹窗组名 —— 单源 = 视图档导出）∥ MODAL_READS 指名 loadProviders
  const mount = deskSrc("renderer/mount-settings.mjs")
  assert.equal(ADD_MODAL_GROUP, "providerAdd", "组名单源 = 视图档导出字面")
  assert.match(mount, /const SCOPES = Object\.freeze\(\[\.\.\.SECTIONS\.map\(\(section\) => section\.name\), ADD_MODAL_GROUP\]\)/, "SCOPES = 段名序 + providerAdd（八值）")
  assert.match(mount, /\[ADD_MODAL_GROUP\]: "loadProviders"/, "MODAL_READS 指名 loadProviders")
  assert.match(mount, /openModal: \(group\) => openSettingsModal\(group\)/, "开径注入（迟绑定）")
  assert.match(deskSrc("renderer/mount-settings-exits.mjs"), /onAddProvider: \(\) => \{ openModal\(ADD_MODAL_GROUP\) \}/, "onAddProvider 出口注册在案")
})

// ─── D4 主面：providerSave 携 proxy 落条 ∥ providerModels 目标携 proxyUri ──────────

test("D4 主面写/探面：providerSave 携 proxy 落条 ∥ providerModels 目标携 proxyUri（双门槛 ∥ 直连两径）", async () => {
  // 核件取件须与**桌面主面**同实例（否则 `_setConfigPathForTest` 缝不生效 —— 会写进真配置）：
  // 桌面 `@thincoder/core` 经 `thincoder-desktop/node_modules/@thincoder/core` 链接解析 ⇒ 本段同径取件，
  // 并以**只读探针**（写前）自证 —— 实例不同 ⇒ 即拒，零误写。
  const cfg = await import(new URL("node_modules/@thincoder/core/config-io.mjs", DESKTOP).href)
  const listModels = await import(new URL("node_modules/@thincoder/core/provider/list-models.mjs", DESKTOP).href)
  const main = await import(deskAt("src/main/providers.mjs"))
  const cfgPath = tmpConfigPath()
  cfg._setConfigPathForTest(cfgPath)
  const seen = []
  listModels._setProbeImplForTest((name, target) => { seen.push({ name, target }); return { ok: true, models: ["m-1"] } }) // 探针缝：真目标实读（零网络）
  try {
    // ① 缝射程自证（**先于任何写** —— 只读）：tmp 哨兵 + 桌面主面读面 ⇒ 必见哨兵；不见 ⇒ 即拒（零误写真配置）
    writeFileSync(cfgPath, JSON.stringify({ providers: [{ name: "tc-seam-probe", baseURL: "https://p.example.com/v1", model: "m-p" }] }))
    const probeNames = main.providerList().providers.map((p) => p.name)
    assert.deepEqual(probeNames, ["tc-seam-probe"], "测试缝射程自证：桌面主面读面 = tmp 配置（先于任何写）")
    // ② providerSave：勾选 ⇒ 条目落旗；缺 ∥ 非真 ⇒ 零键（判据单源 = 核 addProviderEntry）
    writeFileSync(cfgPath, JSON.stringify({}))
    assert.equal(main.providerSave({ name: "tc-ds-a", shape: "custom", baseURL: "https://a.example.com/v1", model: "m-a", proxy: true }).ok, true, "自定形 + proxy 保存成功")
    assert.equal(main.providerSave({ name: "tc-ds-b", shape: "custom", baseURL: "https://b.example.com/v1", model: "m-b" }).ok, true, "缺 proxy 保存成功")
    assert.equal(main.providerSave({ name: "tc-ds-c", shape: "custom", baseURL: "https://c.example.com/v1", model: "m-c", proxy: "true" }).ok, true, "非真 proxy 保存成功")
    const raw = JSON.parse(readFileSync(cfgPath, "utf8"))
    const get = (n) => raw.providers.find((p) => p?.name === n)
    assert.equal(get("tc-ds-a").proxy, true, "勾选 ⇒ 落旗")
    assert.equal("proxy" in get("tc-ds-b"), false, "缺 ⇒ 零键")
    assert.equal("proxy" in get("tc-ds-c"), false, "非真 ⇒ 零键")
    // ② providerModels：目标构造 = 核 probeTargetOf 同判定（双门槛 ∥ 直连两径）
    writeFileSync(cfgPath, JSON.stringify({ proxy: { uri: "http://127.0.0.1:9", model: true } }))
    assert.equal((await main.providerModels({ baseURL: "https://x.example.com/v1", apiKey: " sk ", format: "anthropic", proxy: true })).ok, true)
    assert.equal(seen.at(-1).target.proxyUri, "http://127.0.0.1:9", "双门槛齐 ⇒ 目标携 proxyUri")
    assert.equal(seen.at(-1).target.apiKey, "sk", "apiKey 归一（同判定）")
    assert.equal(seen.at(-1).name, "", "名传空串（落账面零改）")
    await main.providerModels({ baseURL: "https://x.example.com/v1", apiKey: "sk", format: "anthropic" })
    assert.equal("proxyUri" in seen.at(-1).target && seen.at(-1).target.proxyUri !== undefined, false, "未勾 ⇒ 直连（零 proxyUri）")
    writeFileSync(cfgPath, JSON.stringify({ proxy: { uri: "http://127.0.0.1:9", model: false } }))
    await main.providerModels({ baseURL: "https://x.example.com/v1", apiKey: "sk", format: "anthropic", proxy: true })
    assert.equal(seen.at(-1).target.proxyUri, undefined, "勾但全局 proxy.model 关 ⇒ 直连（双门槛）")
    // ③ 源锁（残件零留）：目标构造单源 ∥ 零 web 旗 ∥ 零 normalizeProxy
    const src = deskSrc("src/main/providers.mjs")
    const modelsBody = src.slice(src.indexOf("export async function providerModels"), src.indexOf("const PROXY_TEST_URL"))
    assert.ok(modelsBody.includes("probeTargetOf("), "目标构造 = 核 probeTargetOf（单源）")
    assert.ok(modelsBody.includes("proxy: payload?.proxy === true"), "双门槛判据形（仅真值入构造）")
    assert.ok(!modelsBody.includes("proxy.web"), "零 web 旗取用（旧相抵径退场）")
    assert.ok(!modelsBody.includes("normalizeProxy"), "零 normalizeProxy 残用")
    assert.equal((src.match(/normalizeProxy/g) ?? []).length, 0, "全档零 normalizeProxy 残引")
    assert.equal((src.match(/loadRaw\(/g) ?? []).length, 0, "零 loadRaw 调用（注释提及不计）")
    const ioImport = (src.match(/import \{[\s\S]*?\} from "@thincoder\/core\/config-io\.mjs"/) ?? [""])[0]
    assert.ok(!ioImport.includes("loadRaw"), "config-io 取件面零 loadRaw（旧 web 旗取用件随退）")
    // ④ 渲染面载荷随勾选（源锁：ask 载荷 + proxy）
    const seg = deskSrc("renderer/mount-settings-segments-providers.mjs")
    assert.match(seg, /data\.get\("proxy"\) !== null \? \{ proxy: true \} : \{\}/, "拉取载荷 + proxy（勾选 ⇒ true）")
    assert.match(deskSrc("renderer/mount-settings-exits.mjs"), /data\.get\("proxy"\) !== null \? \{ proxy: true \} : \{\}/, "提交载荷 + proxy（勾选 ⇒ true）")
  } finally {
    listModels._resetAdmissionForTest()
    cfg._resetConfigPathForTest()
  }
})

// ─── D5 词面锁（#1035 六值 ∥ 键面 +3 −2）─────────────────────────────────────────

test("D5 词面锁：#1035 六值改毕 ∥ 键面 +3 −2 ∥ zh 裸「密钥」清零", async () => {
  const { SETTINGS_DICT } = await import(deskAt("renderer/i18n-settings.mjs"))
  const { VIEWS_DICT } = await import(deskAt("renderer/i18n-views.mjs"))
  const { COMPOSER_DICT } = await import(deskAt("renderer/i18n-composer.mjs"))
  const S = SETTINGS_DICT, V = VIEWS_DICT, C = COMPOSER_DICT
  // 两语键集相等（三档）
  for (const dict of [S, V, C]) assert.deepEqual(Object.keys(dict.en).sort(), Object.keys(dict.zh).sort(), "两语键集相等")
  // 六值（两语）
  for (const locale of ["en", "zh"]) {
    assert.equal(S[locale]["settings.providers.keyLabel"], "API Key", `${locale} keyLabel`)
    assert.equal(S[locale]["settings.providers.noKey"], locale === "en" ? "No API Key" : "未配置 API Key", `${locale} noKey`)
    assert.equal(V[locale]["settings.addKey"], locale === "en" ? "Add API Key" : "添加 API Key", `${locale} addKey`)
    assert.equal(V[locale]["settings.deleteKey"], locale === "en" ? "Delete API Key" : "删除 API Key", `${locale} deleteKey`)
    assert.equal(C[locale]["model.setKey"], locale === "en" ? "API Key…" : "设置 API Key…", `${locale} model.setKey`)
  }
  assert.equal(V.zh["composer.send.noProvider"], "未配置 API Key — 点击 ⚙ 设置", "zh noProvider（en 零动）")
  assert.equal(V.en["composer.send.noProvider"], "No provider configured — click ⚙ to set API keys", "en noProvider 零改")
  // 键面 +3 −2（KD-75 ②③ 新键 ∥ 旧双表单提交词随表单退场）
  for (const locale of ["en", "zh"]) {
    for (const key of ["settings.addProvider", "settings.addProviderTitle", "settings.providers.customChoice"]) assert.ok(key in S[locale], `${locale} 新键 ${key}`)
    for (const key of ["settings.providers.addCustom", "settings.providers.addPreset"]) assert.equal(key in S[locale], false, `${locale} 旧键净删 ${key}`)
  }
  assert.equal(S.en["settings.addProvider"], "+ Add", "en 添加钮词（逐字同 VSC）")
  assert.equal(S.zh["settings.addProvider"], "+ 添加", "zh 添加钮词")
  assert.equal(S.en["settings.addProviderTitle"], "Add Provider", "en 弹窗标题词")
  assert.equal(S.zh["settings.addProviderTitle"], "添加 Provider", "zh 弹窗标题词")
  assert.equal(S.en["settings.providers.customChoice"], "Custom (manual config)", "en 自定末项词")
  assert.equal(S.zh["settings.providers.customChoice"], "自定义（手动配置）", "zh 自定末项词")
  assert.ok(Object.keys(S.en).length >= 60, "键面 ≥ 60（本批 59 ⇒ 60；并行批增键不属本腿判据）")
  // zh 裸「密钥」清零（四表值面 —— HOST_DICT 合并档同扫）
  const { HOST_DICT } = deskI18n
  const zhValues = [S.zh, V.zh, C.zh, HOST_DICT.zh ?? {}].flatMap((dict) => Object.values(dict))
  assert.equal(zhValues.filter((value) => String(value).includes("密钥")).length, 0, "zh 裸「密钥」清零")
  // 旧键零消费者（消费面源锁）
  for (const file of ["renderer/views/settings-controls.mjs", "renderer/views/settings-sections-providers.mjs", "renderer/views/settings.mjs"]) {
    assert.equal(deskSrc(file).includes("providers.addCustom"), false, `${file}：addCustom 零残引`)
    assert.equal(deskSrc(file).includes("providers.addPreset"), false, `${file}：addPreset 零残引`)
  }
})

// ─── D6 添加钮开径腿：settings:addProvider ⇒ onAddProvider ⇒ openSettingsModal ────

test("D6 添加钮开径腿：锚 ⇒ onAddProvider ⇒ openSettingsModal(\"providerAdd\")（SCOPES 闭集内 ∥ 向导占槽 ⇒ 拒，零静默）", async () => {
  const { initialState, createStore, patchSettings } = await import(deskAt("renderer/store.mjs"))
  const { attachSettings } = await import(deskAt("renderer/mount-settings.mjs"))
  const prevDoc = globalThis.document
  globalThis.document = { querySelector: () => null, addEventListener: () => {} } // 桩 document：只测决策 ∥ 调度面（DOM 建面 = D1–D3 树面腿）
  const errors = []
  const original = console.error
  console.error = (...args) => errors.push(args)
  try {
    const store = createStore(initialState())
    const calls = []
    const host = { invoke: async (channel) => { calls.push(channel); return channel === "provider:list" ? { ok: true, active: null, presets: [], providers: [] } : { ok: false, reason: "stub" } } }
    const face = attachSettings(host, { store })
    face.detach() // 防重绘（平 node 零 DOM 建面）
    // 异步链泵：微任务冲扫（不依 `setTimeout` —— 本件 V 腿已把 `globalThis.setTimeout` 换为捕获桩）
    const flush = async () => { for (let i = 0; i < 50; i += 1) await Promise.resolve() }
    await flush()
    // ① 出口在案（全表注入）
    assert.equal(typeof face.handlers.onAddProvider, "function", "onAddProvider 出口在案（mount-settings-exits.mjs handlers 表）")
    // ② 开径：出口 ⇒ openSettingsModal（SCOPES 八值闭集内）⇒ 切片写 + 读取链
    calls.length = 0
    face.handlers.onAddProvider()
    assert.equal(store.get().settings.modal, "providerAdd", "开径 ⇒ `settings.modal = providerAdd`")
    await flush()
    assert.deepEqual(calls, ["provider:list", "model:catalog"], "读取链 = MODAL_READS[providerAdd] = loadProviders（携模型面随动）")
    // ③ 关（KD-68 关径）：切片清 + 本组面态复位（addShape 回 preset）
    store.set(patchSettings(store.get(), { providers: { ...store.get().settings.providers, addShape: "custom", probe: { state: "ok" } } }))
    face.closeSettingsModal()
    const closed = store.get().settings
    assert.equal(closed.modal, null, "关 ⇒ 切片清")
    assert.equal(closed.providers.addShape, "preset", "关 ⇒ addShape 复位（本组面态）")
    assert.equal(closed.providers.probe, null, "关 ⇒ probe 清")
    // ④ 向导占槽 ⇒ 拒 + 记错 + 零动作（零静默）
    store.set(patchSettings(store.get(), { configured: false, wizard: { step: 1, dismissed: false, notice: null } }))
    const before = errors.length
    face.handlers.onAddProvider()
    assert.equal(store.get().settings.modal, null, "占槽 ⇒ 零动作")
    assert.equal(errors.length, before + 1, "占槽拒 ⇒ 记错一次")
    assert.match(String(errors.at(-1)?.[0]), /wizard occupies/, "占槽拒记错词")
    // ⑤ 闭集守卫零改（表外 ⇒ 拒；providerAdd ⇒ 受）
    store.set(patchSettings(store.get(), { configured: true, wizard: { step: 1, dismissed: false, notice: null } }))
    assert.equal(face.openSettingsModal("providerAdd"), true, "providerAdd = 闭集内（八值之第八）")
    face.closeSettingsModal()
    const before2 = errors.length
    assert.equal(face.openSettingsModal("bogus"), false, "表外 ⇒ 拒")
    assert.equal(errors.length, before2 + 1, "表外拒 ⇒ 记错一次")
    // ⑥ 写成功径宿主关（源锁：submitChannel 成功径 closeModal —— §2.4 行 6「提交 ⇒ 宿主关」）
    const exits = deskSrc("renderer/mount-settings-exits.mjs")
    assert.match(exits, /settings\?\.modal === ADD_MODAL_GROUP/, "提交成功径判本弹窗在场")
    assert.match(exits, /closeModal\(\)/, "成功径经 closeModal（KD-68 关径注入）")
    assert.match(deskSrc("renderer/mount-settings.mjs"), /closeModal: \(\) => closeSettingsModal\(\)/, "关径注入在案（迟绑定）")
  } finally {
    console.error = original
    globalThis.document = prevDoc
  }
})

