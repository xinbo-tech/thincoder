/**
 * 2026-10-08-provider-key-guards-vsc.test.mjs — 批内件（VSC 舱：T-V1–T-V5）。
 * 跑法（仓根 `thincoder/`）：`node --test docs/batches/2026-10-08-provider-key-guards-vsc.test.mjs`
 * 不入仓套件 · 随批留存归档（判据语义 = `docs/vsc/design/SETTINGS.md` §2.18 ∥ 批档 §2.4 用例面）。
 *
 * 腿：
 *   T-V1 宿主成功径——真链（handler → panel-settings-push → settings.mjs → 核 setProviderKey）⇒
 *        sink 恰 `providerStatus` + `providerKeySaved{name}` ∧ 盘面落钥。
 *   T-V2 宿主冲突径——假 config-io 短接（沿 `2026-09-30-vsc-cleanup-695.test.mjs` 先例）⇒
 *        sink 恰 `providerStatus` + `providerError{scope:"providers",reason:"mtime-conflict"}` ∧ 零回执。
 *   T-V3 webview 门控——保存动作 ⇒ 零闪（徽标移离发送点）；回执 ⇒ 行恢复（现读 SS）+ 徽标显；
 *        无在编再回执 ⇒ 零动作。
 *   T-V4 在编守卫——状态推送在位（password 在编）⇒ 卡不重绘（在编值保留 ∥ SS 已更新）；负控 ⇒ 重绘。
 *   T-V5 拒径复合——保存（零闪）→ 状态推送（在编守卫持行）→ 拒因 banner ⇒ banner 在场 + 行在 + 零闪。
 *   T-V5b 接线源锁——chat-messages.js 新 case 与导入在位。
 *
 * 测试台 = mini 假 DOM（沿 `2026-10-07-provider-config-parity-vsc-harness.mjs` 先例，按本批面收窄 +
 * `type` 属性反射增强——`input[type=password]` 选择器判据）；vscode 桩 ∥ 假 config-io = `registerHooks`
 * 短接（695 先例）。台面重绘模型 = `outerHTML` setter 清 children + 脱树登记 ⇒ **重绘判据用
 * 「`getElementById` 不复现旧节点」（真 DOM 同效），不用 children 计数（真 DOM 脱树旧件仍持 children）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

// 家目录重定向（安全网：一切动态 import 之前覆盖，防误写真实配置）
const _home = mkdtempSync(join(tmpdir(), "pk-guards-vsc-home-"))
process.env.HOME = _home
process.env.USERPROFILE = _home

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（docs/batches 两层深）
const vsc = (rel) => pathToFileURL(join(ROOT, "thincoder-vscode", rel)).href
const core = (rel) => pathToFileURL(join(ROOT, "thincoder-core", rel)).href
const vscSrc = (rel) => readFileSync(join(ROOT, "thincoder-vscode", rel), "utf8")

// ─── vscode 桩 + 假 config-io（registerHooks 短接——695 先例）─────────────────────

const VSCODE_STUB_URL = "data:text/javascript," + encodeURIComponent(`
export const workspace = { workspaceFolders: [], workspaceFile: undefined, getConfiguration: () => ({ get: () => undefined, update: async () => {} }), onDidChangeWorkspaceFolders: () => ({ dispose() {} }), findFiles: async () => [], getWorkspaceFolder: () => null }
export const window = { showWarningMessage: async () => undefined, showErrorMessage: async () => undefined, showInformationMessage: async () => undefined, showQuickPick: async () => undefined, showInputBox: async () => undefined, createStatusBarItem: () => ({ show() {}, hide() {}, dispose() {}, tooltip: null, backgroundColor: null, command: null, text: "" }), activeTerminal: null, terminals: [], createTerminal: () => ({ show() {}, sendText() {}, dispose() {} }), onDidChangeTerminalShellIntegration: () => ({ dispose() {} }), onDidChangeActiveTextEditor: () => ({ dispose() {} }), withProgress: async (_o, fn) => fn({ report() {} }) }
export const commands = { executeCommand: async () => undefined, registerCommand: () => ({ dispose() {} }) }
export const Uri = { file: (p) => ({ fsPath: p, toString: () => String(p) }), parse: (p) => ({ fsPath: String(p), toString: () => String(p) }) }
export class MarkdownString { constructor(v) { this.value = v } }
export class ThemeColor { constructor(id) { this.id = id } }
export class ThemeIcon { constructor(id) { this.id = id } }
export class Disposable { dispose() {} }
export class EventEmitter { constructor() { this.event = () => ({ dispose() {} }); this.fire = () => {} } }
export const StatusBarAlignment = { Left: 1, Right: 2 }
export const ViewColumn = { One: 1 }
export const env = { openExternal: async () => undefined, language: "en" }
export const extensions = { getExtension: () => null }
export const languages = { createDiagnosticCollection: () => ({ set() {}, clear() {}, dispose() {} }), getDiagnostics: () => [] }
export class Position { constructor(line, ch) { this.line = line; this.character = ch } }
export class Range { constructor(s, e) { this.start = s; this.end = e } }
export const SymbolKind = {}
`)

// 假 config-io：真件全量转发；armed 期 `setProviderKey` 短接为核冲突归一串（= 真冲突时核写执行体返回值）
const CORE_IO = core("config-io.mjs")
const FAKE_IO_URL = "data:text/javascript," + encodeURIComponent(`
import * as real from ${JSON.stringify(CORE_IO)}
export * from ${JSON.stringify(CORE_IO)}
const armed = () => globalThis.__pkVscArmed === true
export function setProviderKey(name, key) {
  if (!armed()) return real.setProviderKey(name, key)
  return real.conflictError({ ok: false, reason: "mtime-conflict" })
}
`)
globalThis.__pkVscArmed = false

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "vscode") return { url: VSCODE_STUB_URL, shortCircuit: true }
    if (specifier === "@thincoder/core/config-io.mjs") return { url: FAKE_IO_URL, shortCircuit: true }
    return nextResolve(specifier, context)
  },
})

// ─── mini 假 DOM（webview 舱）───────────────────────────────────────────────────

const camelId = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
class FText { constructor(v) { this.textContent = String(v) } }

class FNode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase(); this.id = ""; this.attrs = {}; this.dataset = {}
    this.children = []; this.listeners = []; this.textContent = ""; this.parent = null
    this.value = ""; this.checked = false; this.disabled = false; this.placeholder = ""
    this.style = new Proxy({}, { get: (t, k) => (k in t ? t[k] : ""), set: (t, k, v) => { t[k] = v; return true } })
    this._classes = new Set()
    this.classList = {
      add: (...cs) => { for (const c of cs) this._classes.add(c) },
      remove: (...cs) => { for (const c of cs) this._classes.delete(c) },
      contains: (c) => this._classes.has(c),
    }
  }
  set className(v) { this._classes = new Set(String(v).split(/\s+/).filter(Boolean)) }
  get className() { return [...this._classes].join(" ") }
  // `type` 反射（真 DOM 语义——`[type=password]` 选择器判据：在编守卫 ∥ 行恢复位）
  set type(v) { this._type = String(v); if (this.attrs) this.attrs.type = this._type }
  get type() { return this._type ?? "" }
  setAttribute(k, v) { const s = String(v); this.attrs[k] = s; if (k === "class") this.className = s; else if (k.startsWith("data-")) this.dataset[camelId(k.slice(5))] = s }
  getAttribute(k) { if (k.startsWith("data-")) { const v = this.dataset[camelId(k.slice(5))]; if (v !== undefined) return String(v) } return this.attrs[k] ?? null }
  addEventListener(type, fn) { this.listeners.push({ type, fn }) }
  removeEventListener() {}
  fire(type, extra = {}) {
    const ev = { type, target: this, ...extra }
    for (const l of [...this.listeners]) if (l.type === type) l.fn(ev)
    return ev
  }
  focus() {}
  get parentElement() { return this.parent }
  appendChild(node) {
    const child = node instanceof FNode || node instanceof FText ? node : new FText(node)
    child.parent = this; this.children.push(child); regTree(child); return child
  }
  append(...nodes) { for (const n of nodes) this.appendChild(n) }
  prepend(node) { const child = node instanceof FNode || node instanceof FText ? node : new FText(node); child.parent = this; this.children.unshift(child); regTree(child) }
  replaceChildren(...nodes) { for (const c of [...this.children]) unregTree(c); this.children = []; for (const n of nodes) this.appendChild(n) }
  remove() {
    if (this.parent) { const i = this.parent.children.indexOf(this); if (i >= 0) this.parent.children.splice(i, 1); this.parent = null }
    unregTree(this)
  }
  walk(fn) { for (const c of this.children) if (c instanceof FNode) { fn(c); c.walk(fn) } }
  querySelector(sel) { let hit = null; this.walk((n) => { if (hit === null && matchCompound(n, sel)) hit = n }); return hit }
  querySelectorAll(sel) { const out = []; this.walk((n) => { if (matchCompound(n, sel)) out.push(n) }); return out }
  set innerHTML(v) { for (const c of [...this.children]) unregTree(c); this.children = []; this._html = String(v) }
  get innerHTML() { return this._html ?? "" }
  set outerHTML(v) { this._html = String(v); for (const c of [...this.children]) { c.parent = null; unregTree(c) }; this.children = [] }
  get outerHTML() { return this._html ?? "" }
}

const _attached = new Map()
const _stubs = new Map()
function regTree(n) { if (!(n instanceof FNode)) return; if (n.id) _attached.set(n.id, n); for (const c of n.children) regTree(c) }
function unregTree(n) { if (!(n instanceof FNode)) return; if (n.id && _attached.get(n.id) === n) _attached.delete(n.id); for (const c of n.children) unregTree(c) }

/** 选择器子集：逗号 ∪ ∥ 后代空白 ∥ `#id` ∥ `.class` ∥ `[attr]` ∥ `[attr="v"]` ∥ tag。 */
function matchCompound(node, sel) {
  for (const part of String(sel).split(",")) {
    const s = part.trim()
    if (s && matchCompoundOne(node, s)) return true
  }
  return false
}
function matchCompoundOne(node, sel) {
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
  let rest = sel
  let matched = false
  while (rest.length) {
    let m
    if ((m = /^#([\w-]+)/.exec(rest))) { if (node.id !== m[1]) return false; rest = rest.slice(m[0].length) }
    else if ((m = /^\.([\w-]+)/.exec(rest))) { if (!node.classList.contains(m[1])) return false; rest = rest.slice(m[0].length) }
    else if ((m = /^\[([\w-]+)(?:=(?:"([^"]*)"|([^\]\s]+)))?\]/.exec(rest))) {
      const key = m[1]
      const want = m[2] !== undefined ? m[2] : m[3]
      const val = key.startsWith("data-") ? node.dataset[camelId(key.slice(5))] : node.attrs[key]
      if (val === undefined || val === null) return false
      if (want !== undefined && String(val) !== want) return false
      rest = rest.slice(m[0].length)
    }
    else if ((m = /^(\w+)/.exec(rest))) { if (node.tagName !== m[1].toUpperCase()) return false; rest = rest.slice(m[0].length) }
    else return false
    matched = true
  }
  return matched
}

// 计时器桩（推进 = 手动 `drainTimers`——键行焦点 +50ms ∥ 徽标闪落 +1200ms）
const timers = []
globalThis.setTimeout = (fn) => { const h = { fn }; timers.push(h); return h }
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
    if (!_stubs.has(id)) { const n = new FNode("div"); n.id = id; _stubs.set(id, n) }
    return _stubs.get(id)
  },
  createElement: (t) => new FNode(t),
  createTextNode: (v) => new FText(v),
  querySelector(sel) { return this.querySelectorAll(sel)[0] ?? null },
  querySelectorAll(sel) { const out = []; bodyEl.walk((n) => { if (matchCompound(n, sel)) out.push(n) }); return out },
  addEventListener() {},
  removeEventListener() {},
}
globalThis.window = {
  _vscode: { postMessage: (m) => postSink.push(m) },
  innerWidth: 1200, innerHeight: 800,
  requestAnimationFrame: (fn) => setTimeout(fn, 0),
  cancelAnimationFrame: () => {},
  addEventListener() {},
  removeEventListener() {},
}
globalThis.acquireVsCodeApi = () => ({ postMessage: (m) => postSink.push(m), getState: () => ({}), setState() {} })

const byId = (id) => document.getElementById(id)
const clearAll = () => {
  for (const c of [...bodyEl.children]) c.remove()
  drainTimers()
  postSink.length = 0
}
/** 设置面最小 DOM（providers 卡：panel ∥ body ∥ card ∥ prov-list ∥ rowline-alpha；可携徽标件）。 */
const setupPanel = (status = { providers: { alpha: { configured: true, masked: "****ab", isActive: false } }, labels: {} }) => {
  clearAll()
  const panel = document.createElement("div"); panel.id = "settings-panel"; panel.style.display = "flex"
  const body = document.createElement("div"); body.id = "settings-body"
  const card = document.createElement("div"); card.id = "providers-card"
  const list = document.createElement("div"); list.id = "prov-list"
  const rowOuter = document.createElement("div"); rowOuter.className = "prov-row"; rowOuter.id = "prov-alpha"
  const rowline = document.createElement("div"); rowline.className = "prov-main"; rowline.id = "rowline-alpha"
  rowOuter.appendChild(rowline); list.appendChild(rowOuter); card.appendChild(list)
  panel.append(body, card)
  const badge = document.createElement("div"); badge.id = "agent-saved-badge"; badge.className = "agent-saved-badge"
  bodyEl.append(panel, badge)
  SS.providerStatus = status
  return { panel, body, card, rowline, badge }
}
const badgeVisible = () => byId("agent-saved-badge").classList.contains("visible")

// ─── 装载 webview 链（DOM 桩就绪后）+ 真词面 ─────────────────────────────────────

const { setStrings } = await import(vsc("webview/i18n.js"))
const EN = JSON.parse(vscSrc("locales/en.json"))
setStrings(EN)
const { SS } = await import(vsc("webview/settings-state.js"))
const { installProviderHandlers, updateProviderStatus, onProviderKeySaved } = await import(vsc("webview/settings-providers.js"))
const { showSettingsError } = await import(vsc("webview/settings.js"))
installProviderHandlers()

// ─── 装载宿主链（registerHooks 之后）─────────────────────────────────────────────

const coreIo = await import(CORE_IO)
const { saveProviderKey, pushStatus } = await import(vsc("src/extension/panel-settings-push.mjs"))
const { handleSaveProviderKey } = await import(vsc("src/extension/panel-messages-settings.mjs"))

const mkPanel = (sink) => {
  const p = { _panel: { webview: { postMessage: (m) => sink.push(m) } } }
  p._pushStatus = () => pushStatus(p) // 真推送链（panel-settings-push → settings.mjs → providerStatus）
  p._saveProviderKey = (name, key) => saveProviderKey(p, name, key)
  return p
}
const tmpCfg = (seed) => {
  const dir = mkdtempSync(join(tmpdir(), "pk-guards-vsc-"))
  const cfg = join(dir, "config.json")
  writeFileSync(cfg, JSON.stringify(seed, null, 2) + "\n")
  return cfg
}
const ALPHA = { name: "alpha", baseURL: "http://127.0.0.1:9/v1", model: "m" }
const alphaKeyOnDisk = (cfg) => JSON.parse(readFileSync(cfg, "utf8")).providers.find((p) => p?.name === "alpha")?.apiKey

// ─── T-V1 ∥ T-V2：宿主两径 ───────────────────────────────────────────────────────

test("T-V1 宿主成功径：sink 恰 providerStatus + providerKeySaved ∧ 盘面落钥", async () => {
  const cfg = tmpCfg({ providers: [{ ...ALPHA }] })
  coreIo._setConfigPathForTest(cfg)
  try {
    const sink = []
    await handleSaveProviderKey(mkPanel(sink), { name: "alpha", key: "sk-x" })
    assert.deepEqual(sink.map((m) => m.type), ["providerStatus", "providerKeySaved"], `sink 恰两件（实读 ${JSON.stringify(sink.map((m) => m.type))}）`)
    assert.equal(sink[1].name, "alpha", "回执载荷 = { name }")
    assert.equal(alphaKeyOnDisk(cfg), "sk-x", "真链落钥（盘面）")
  } finally {
    coreIo._resetConfigPathForTest()
  }
})

test("T-V2 宿主冲突径：恰 providerError{providers,mtime-conflict} ∧ 零回执 ∧ 盘面零写", async () => {
  const cfg = tmpCfg({ providers: [{ ...ALPHA }] })
  coreIo._setConfigPathForTest(cfg)
  try {
    globalThis.__pkVscArmed = true
    const sink = []
    await handleSaveProviderKey(mkPanel(sink), { name: "alpha", key: "sk-x" })
    globalThis.__pkVscArmed = false
    assert.deepEqual(sink.map((m) => m.type), ["providerStatus", "providerError"], `sink 恰两件（实读 ${JSON.stringify(sink.map((m) => m.type))}）`)
    assert.deepEqual(sink[1], { type: "providerError", scope: "providers", reason: "mtime-conflict" }, "拒因 = 词化码")
    assert.equal(sink.filter((m) => m.type === "providerKeySaved").length, 0, "零回执（拒径不闪）")
    assert.equal(alphaKeyOnDisk(cfg), undefined, "冲突 ⇒ 盘面零写")
  } finally {
    globalThis.__pkVscArmed = false
    coreIo._resetConfigPathForTest()
  }
})

// ─── T-V3：webview 门控（保存 ⇒ 零闪；回执 ⇒ 行恢复 + 徽标显）────────────────────

test("T-V3 webview 门控：保存动作 ⇒ 零闪；回执 ⇒ 行恢复 + 徽标显；无在编再回执 ⇒ 零动作", () => {
  const { rowline, badge } = setupPanel()
  window._editKey("alpha")
  const inp = rowline.querySelector("input[type=password]")
  assert.ok(inp, "在编 password 输入在位")
  inp.value = "sk-new"
  rowline.querySelectorAll("button")[0].fire("click")
  assert.equal(postSink.length, 1, "保存动作恰一条上行")
  assert.deepEqual(postSink[0], { type: "saveProviderKey", name: "alpha", key: "sk-new" })
  assert.ok(!badgeVisible(), "保存动作 ⇒ 零闪（徽标未亮）")
  onProviderKeySaved("alpha")
  assert.equal(rowline.querySelector("input[type=password]"), null, "回执 ⇒ 行恢复（password 退场）")
  assert.equal(rowline.querySelector(".prov-name")?.textContent, "alpha", "静态行恢复（名）")
  assert.equal(rowline.querySelector(".key-status")?.textContent, "****ab", "静态行恢复（现读 SS 掩码）")
  assert.ok(badgeVisible(), "回执 ⇒ 徽标显")
  drainTimers()
  assert.ok(!badgeVisible(), "闪落（1200ms）")
  const txtBefore = badge.textContent
  onProviderKeySaved("alpha")
  assert.ok(!badgeVisible(), "无在编 ⇒ 零动作（不复闪）")
  assert.equal(badge.textContent, txtBefore, "零动作不改徽标（不重写词）")
})

// ─── T-V4：在编守卫（推送不重绘；负控重绘）───────────────────────────────────────

test("T-V4 在编守卫：状态推送在位 ⇒ 卡不重绘（在编值保留 ∥ SS 已更新）；负控 ⇒ 重绘", () => {
  const { rowline } = setupPanel()
  window._editKey("alpha")
  const inp = rowline.querySelector("input[type=password]")
  inp.value = "sk-typed"
  const next = { providers: { alpha: { configured: true, masked: "****zz", available: false } }, labels: {} }
  updateProviderStatus(next)
  assert.equal(SS.providerStatus, next, "本拍只更新 SS")
  assert.equal(byId("rowline-alpha"), rowline, "行仍在树（未重绘——查表复现同一节点）")
  assert.equal(rowline.querySelector("input[type=password]")?.value, "sk-typed", "在编值保留")
  // 负控：出编（恢复静态行）后同式推送 ⇒ 重绘
  onProviderKeySaved("alpha")
  assert.equal(rowline.querySelector("input[type=password]"), null, "已出编")
  updateProviderStatus({ providers: { alpha: { configured: true, masked: "****qq" } }, labels: {}, n: 1 })
  assert.notEqual(byId("rowline-alpha"), rowline, "负控：无在编 ⇒ 重绘（原行脱树）")
})

// ─── T-V5：拒径复合（零闪 ∥ 行在 ∥ 拒因可见）────────────────────────────────────

test("T-V5 拒径复合：保存（零闪）→ 状态推送（守卫持行）→ providerError ⇒ banner 在场 + 行在 + 零闪", () => {
  const { rowline } = setupPanel()
  window._editKey("alpha")
  const inp = rowline.querySelector("input[type=password]")
  inp.value = "sk-typed"
  rowline.querySelectorAll("button")[0].fire("click")
  assert.ok(!badgeVisible(), "保存动作 ⇒ 零闪")
  // 宿主拒径实序：写尝试（冲突）→ 无条件 `_pushStatus`（准入读数变化 ⇒ 推送）；拒因随 `providerError` 到达
  updateProviderStatus({ providers: { alpha: { configured: true, masked: "****ab", available: false } }, labels: {} })
  showSettingsError("providers", "mtime-conflict")
  assert.equal(byId("settings-error-banner")?.parent, byId("settings-body"), "banner 在场（挂 settings-body）")
  assert.equal(byId("settings-error-banner").getAttribute("data-scope"), "providers", "段标 = providers")
  assert.equal(
    byId("settings-error-banner").querySelector(".settings-error-text")?.textContent,
    EN["settings.reason.mtimeConflict"], "拒因词化可见",
  )
  assert.equal(byId("rowline-alpha"), rowline, "行在（在编态未被推送清——查表复现同一节点）")
  assert.equal(rowline.querySelector("input[type=password]").value, "sk-typed", "在编值在")
  assert.ok(!badgeVisible(), "零闪保持（拒径无回执）")
})

// ─── T-V5b：接线源锁（chat-messages.js 新 case）──────────────────────────────────

test("T-V5b 接线源锁：chat-messages.js `providerKeySaved` case + 导入在位", () => {
  const src = vscSrc("webview/chat-messages.js")
  assert.ok(src.includes('import { onProviderKeySaved } from "./settings-providers.js"'), "导入在位")
  assert.match(src, /case "providerKeySaved":\s*onProviderKeySaved\(m\.name\);\s*break/, "case 转发在位")
})
