/**
 * 2026-09-30-desktop-residuals.test.mjs — 桌面残债清付批（码面）· **批次本地件**（住 `docs/batches/` · 不登记常驻
 * 套件 · 随批留存；格式先例 = `2026-09-29-desktop-carryover-c1.test.mjs` ∕ `…ledger-emit-fix.test.mjs`）。
 * 运行（自 `thincoder/` 根）：`node --test docs/batches/2026-09-30-desktop-residuals.test.mjs`
 *
 * 射程 = 批档 §2.2 逐项（判据腿 M-671 ∕ M-679 ∕ M-685 ∕ M-686；M-689a 源扫；M-689b ∕ M-685d ∕ M-685e = 旧件复跑
 * ∕ api-contract 命令面，不在本件）：
 *   M-671a–d  读面并持（#671）：编辑 ∕ 种子 ∕ probe ∕ draft 四切片跨背景读保真；显式复位点仍恒清（负控）。
 *   M-679a–d  草稿失效声明（#679）：MCP 增 ∕ tools 钥存 ∕ env shell 三成功径 ⇒ 本形草稿零复活（失败径零声明）；
 *             作用域件在场；跨形零误伤；scope=null 永不误伤（`dropDrafts` 直调）；agent 径零改（源扫）。
 *   M-685a–c  拆档落形（#685）：`ipc.mjs` ≤300 内容行 + 转口群档 24 导出；注册面零改（`registerIpcHandlers` 真跑 ——
 *             46 项全解析为函数 ∕ 注册序 = 白名单序）；转口直传抽查（源抽取 + 替身注入 —— 回执恒等 ∕ 两缝注入）。
 *   M-686a–c  拒绝面（#686）：调用点注入恒拒 ⇒ `console.error` 落 ∧ 回执正常返回 ∧ 零未处理拒绝逃逸；`void` 语义锁
 *             （回执不候后台面）；静态面零裸 `void pushLedgerLines`。
 * 形态：electron 桩 = data: URL `registerHooks`（主侧三档装载面 —— 沿 enddiff 件先例）；设置面 = 真接线
 * `attachSettings` + 假 DOM（沿 carryover c1 件先例）；`sessionResume` = 源抽取 + `node:vm` 真跑（沿 ledger-emit-fix 件先例）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { registerHooks } from "node:module"
import vm from "node:vm"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何渲染档取件注册）

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const read = (rel) => readFileSync(join(ROOT, rel), "utf8")
const at = (rel) => pathToFileURL(join(ROOT, rel)).href
const contentLines = (text) => { const parts = text.split("\n"); if (parts.length && parts[parts.length - 1] === "") parts.pop(); return parts.length }
const settle = async (rounds = 4) => { for (let i = 0; i < rounds; i += 1) await new Promise((resolve) => setImmediate(resolve)) }

// ─── electron 桩（主侧三档装载面；`ipcMain.handle` 记账供 M-685b）──────────────────────────
globalThis.__ipcHandles = []
const ELEC = `
export const protocol = { registerSchemesAsPrivileged: () => {}, handle: () => {} }
export const BrowserWindow = class {}
export const Menu = { buildFromTemplate: () => ({}) }
export const dialog = { showMessageBox: async () => ({}), showOpenDialog: async () => ({ filePaths: [] }) }
export const nativeTheme = { shouldUseDarkColors: false }
export const net = { fetch: async () => ({ status: 0, headers: new Headers() }) }
export const shell = { openExternal: () => {}, openPath: async () => "" }
export const ipcMain = { handle: (channel, handler) => { globalThis.__ipcHandles.push({ channel, handler }) }, removeHandler: () => {} }
export const app = { getPath: () => "", quit: () => {}, on: () => {}, whenReady: async () => {} }
`
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "electron") return { url: "data:text/javascript," + encodeURIComponent(ELEC), shortCircuit: true }
    return nextResolve(specifier, context)
  },
})
// 主侧三档装载（须顶格 —— 先于假 DOM 装填：`preload.cjs` 顶层守卫 `typeof window !== "undefined"`，装填后属装配面，
// CJS 侧 `require("electron")` 不可解析 —— 沿 enddiff 件「window 缓设」同注）。
const ipcMod = await import(at("thincoder-desktop/src/main/ipc.mjs"))
const relaysMod = await import(at("thincoder-desktop/src/main/ipc-relays.mjs"))
const registryMod = await import(at("thincoder-desktop/src/main/ipc-registry.mjs"))

// ─── 假 DOM（值面 ∕ 选择器面 ∕ 事件面 —— 收窄至本批所需；沿 carryover c1 件先例）──────────────
const TEXTUAL = new Set(["text", "password", "search", "url", "tel", "email"])
class FakeText {
  constructor(value) { this.textContent = String(value) }
}
class FakeNode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase()
    this.attrs = {}
    this.childNodes = []
    this.parentNode = null
    this.listeners = []
    this._value = null
    this._checked = null
    this._sel = null
    this.scrollTop = 0
  }
  get children() { return this.childNodes.filter((node) => node instanceof FakeNode) }
  get textContent() { return this.childNodes.map((node) => node.textContent).join("") }
  set textContent(value) { this.replaceChildren(); if (String(value ?? "") !== "") this.append(new FakeText(value)) }
  getAttribute(name) { return Object.hasOwn(this.attrs, name) ? this.attrs[name] : null }
  getAttributeNames() { return Object.keys(this.attrs) }
  setAttribute(name, value) { this.attrs[name] = String(value) }
  removeAttribute(name) { delete this.attrs[name] }
  get className() { return this.attrs.class ?? "" }
  set className(value) { this.attrs.class = String(value) }
  get classList() {
    const has = (name) => (this.attrs.class ?? "").split(/\s+/).includes(name)
    const self = this
    return { contains: has, add: (name) => { if (!has(name)) self.attrs.class = `${self.attrs.class ?? ""} ${name}`.trim() }, remove: (name) => { self.attrs.class = (self.attrs.class ?? "").split(/\s+/).filter((part) => part !== name).join(" ") } }
  }
  get type() { return this.getAttribute("type") ?? (this.tagName === "INPUT" ? "text" : "") }
  get value() {
    if (this.tagName === "SELECT") {
      const hit = this.querySelectorAll("option").find((node) => node.getAttribute("selected") !== null)
      return hit === undefined ? "" : hit.getAttribute("value") ?? ""
    }
    return this._value !== null ? this._value : this.getAttribute("value") ?? ""
  }
  set value(next) { this._value = String(next) }
  get checked() { return this.tagName === "INPUT" ? (this._checked !== null ? this._checked : this.getAttribute("checked") !== null) : undefined }
  set checked(next) { this._checked = next === true }
  get selectionStart() { return TEXTUAL.has(this.type) ? (this._sel ?? this.value.length) : null }
  set selectionStart(value) { this._sel = value }
  get selectionEnd() { return this.selectionStart }
  set selectionEnd(value) { this._sel = value }
  setSelectionRange(start) { this._sel = start }
  focus() { doc.activeElement = this }
  blur() { if (doc.activeElement === this) doc.activeElement = null }
  addEventListener(type, fn) { this.listeners.push({ type, fn }) }
  removeEventListener(type, fn) { this.listeners = this.listeners.filter((entry) => !(entry.type === type && entry.fn === fn)) }
  append(...nodes) { for (const node of nodes) { const child = node instanceof FakeNode || node instanceof FakeText ? node : new FakeText(node); child.parentNode = this; this.childNodes.push(child) } }
  prepend(...nodes) { for (const node of [...nodes].reverse()) this.insertBefore(node, this.childNodes[0] ?? null) }
  insertBefore(node, ref) {
    const child = node instanceof FakeNode || node instanceof FakeText ? node : new FakeText(node)
    if (child.parentNode !== null) { const held = child.parentNode.childNodes.indexOf(child); if (held >= 0) child.parentNode.childNodes.splice(held, 1) }
    child.parentNode = this
    const at = ref === null || ref === undefined ? -1 : this.childNodes.indexOf(ref)
    if (at < 0) this.childNodes.push(child); else this.childNodes.splice(at, 0, child)
    return child
  }
  replaceChildren(...nodes) { for (const child of this.childNodes) child.parentNode = null; this.childNodes = []; this.append(...nodes) }
  remove() { if (this.parentNode === null) return; const at = this.parentNode.childNodes.indexOf(this); if (at >= 0) this.parentNode.childNodes.splice(at, 1); this.parentNode = null }
  replaceWith(next) { const parent = this.parentNode; if (parent === null) return; parent.insertBefore(next, this); this.remove() }
  walk(fn) { for (const child of this.children) { fn(child); child.walk(fn) } }
  querySelector(sel) { let hit = null; this.walk((node) => { if (hit === null && selMatch(node, sel)) hit = node }); return hit }
  querySelectorAll(sel) { const out = []; this.walk((node) => { if (selMatch(node, sel)) out.push(node) }); return out }
  closest(sel) { for (let node = this; node !== null; node = node.parentNode) if (node instanceof FakeNode && selMatch(node, sel)) return node; return null }
  matches(sel) { return selMatch(this, sel) }
}
const PART = /\[([^=\]]+)(?:="([^"]*)")?\]|\.([A-Za-z][\w-]*)|#([\w-]+)|([a-zA-Z][\w-]*)/g
function selPick(node, sel) {
  const parts = [...String(sel).matchAll(PART)]
  if (parts.length === 0) return false
  for (const part of parts) {
    if (part[1] !== undefined) { const value = node.getAttribute(part[1]); if (value === null || (part[2] !== undefined && value !== part[2])) return false }
    else if (part[3] !== undefined) { if (!node.classList.contains(part[3])) return false }
    else if (part[4] !== undefined) { if (node.getAttribute("id") !== part[4]) return false }
    else if (part[5] !== undefined) { if (node.tagName !== part[5].toUpperCase()) return false }
  }
  return true
}
function selMatch(node, sel) {
  const walk = String(sel).trim().split(/\s+/)
  if (!selPick(node, walk[walk.length - 1])) return false
  let at = walk.length - 2
  for (let parent = node.parentNode; parent !== null && at >= 0; parent = parent.parentNode) if (parent instanceof FakeNode && selPick(parent, walk[at])) at -= 1
  return at < 0
}
const SETTINGS_SEL = `[data-slot="settings"]`
let doc = null
function installFakeDom() {
  doc = {
    slot: null, activeElement: null,
    createElement: (tag) => new FakeNode(tag),
    createTextNode: (value) => new FakeText(value),
    querySelector: (sel) => {
      if (sel === SETTINGS_SEL) return doc.slot
      if (doc.slot !== null && String(sel).startsWith(`${SETTINGS_SEL} `)) return doc.slot.querySelector(String(sel).slice(SETTINGS_SEL.length + 1))
      return null
    },
    querySelectorAll: () => [],
  }
  globalThis.document = doc
  globalThis.Node = FakeNode
  globalThis.FormData = FakeFormData
  globalThis.window = {}
}
class FakeFormData {
  constructor(form) {
    this._entries = []
    form.walk((node) => {
      const name = node.getAttribute("name")
      if (name === null || name === "" || !["INPUT", "SELECT", "TEXTAREA"].includes(node.tagName)) return
      if ((node.getAttribute("type") ?? "").toLowerCase() === "checkbox") { if (node.checked === true) this._entries.push([name, "on"]); return }
      this._entries.push([name, node.value])
    })
  }
  get(name) { const hit = this._entries.find(([key]) => key === name); return hit === undefined ? null : hit[1] }
}
/** 单击 ∕ 变更派发（监听直调 —— 设置面控件皆为自身绑定）。 */
const fire = (el, type) => { const event = { type, target: el, currentTarget: el, preventDefault: () => {}, stopPropagation: () => {} }; for (const entry of [...el.listeners]) if (entry.type === type) entry.fn(event); return event }
const click = (el) => fire(el, "click")

// ─── 设置面装面（真接线 `attachSettings` · 窄桥回执表可注入 —— 沿 carryover c1 件先例）──────────
const SEED = {
  open: true, configured: true, notice: null, verify: null,
  providers: { state: "ready", presets: [{ name: "preset-a" }], providers: [{ name: "alpha", hasKey: true, maskedKey: "sk-…", baseURL: "", model: "m1", active: false, proxy: false, available: true }], edit: null, probe: null, draft: null, keyDraft: null },
  model: { state: "none", provider: null, current: null, models: [] },
  agent: { state: "ready", fields: [] },
  mcp: { state: "ready", servers: [], details: {}, form: null },
  env: { state: "ready", proxy: { uri: "", web: true, model: false }, shell: { current: null, candidates: [] }, test: null },
  tools: { state: "ready", status: { built: true, files: 1, chunks: 1 }, building: false, keys: { embedding: { hasKey: false }, websearch: { hasKey: false } }, edit: null },
  models: { state: "none", consult: [], advisor: { provider: null, model: null }, picker: { provider: "", rows: [], model: null }, advisorPicker: { provider: "", rows: [], model: null } },
  wizard: { step: 1, dismissed: false, notice: null },
}
const LOADING_AGENT = { ...SEED, agent: { state: "loading", fields: [] } } // 在途窗（残件携带路可达 ⇒ 失效腿判别力）
const receiptsOf = (seed) => ({
  "provider:list": { ok: true, presets: seed.providers.presets, providers: seed.providers.providers, active: null },
  "settings:agent": { ok: true, fields: [], models: null },
  "mcp:list": { ok: true, servers: [] },
  "settings:env": { ok: true, proxy: { uri: "", web: true, model: false }, shell: { current: null, candidates: [] } },
  "settings:tools": { ok: true },
  "index:status": { ok: true, status: { built: true, files: 1, chunks: 1 } },
  "ledger:read": { ok: true, counts: null, thresholdReached: null },
  "batch:status": { ok: true, phase: null },
})
async function mountFace(seed, overrides = {}) {
  installFakeDom()
  const { attachSettings } = await import("../../thincoder-desktop/renderer/mount-settings.mjs")
  const { createStore, patchSettings } = await import("../../thincoder-desktop/renderer/store.mjs")
  const store = createStore()
  const slot = new FakeNode("div")
  slot.setAttribute("data-slot", "settings")
  doc.slot = slot
  const table = { ...receiptsOf(seed), ...overrides }
  const calls = []
  const host = { invoke: async (channel, payload) => { calls.push([channel, payload]); return table[channel] ?? { ok: false, reason: "test-no-receipt" } } }
  const face = attachSettings(host, { store })
  store.set(patchSettings(store.get(), seed))
  await settle()
  return { store, slot, face, calls }
}

// ─── M-671 读面并持（#671）────────────────────────────────────────────────────────────
test("M-671a · 编辑中触背景读 ⇒ `edit` + 键行输入值保真", async () => {
  const { slot, face, store } = await mountFace(SEED)
  click(slot.querySelector('[data-action="settings:providerKeyEdit"]'))
  const input = slot.querySelector("[data-provider-key-input]")
  assert.ok(input !== null, "编辑态在场")
  input.value = "sk-typed"
  assert.equal(face.refreshSettings(), true, "背景读受理（设置面在场）")
  await settle()
  assert.equal(store.get().settings.providers.edit, "alpha", "`edit` 读面零复位")
  const after = slot.querySelector("[data-provider-key-input]")
  assert.ok(after !== null, "键行编辑态存续（重挂非退场）")
  assert.equal(after.value, "sk-typed", "键入值保真（草稿复填）")
})

test("M-671b · `keyDraft` 种子保真（背景读 + 重挂后回填）", async () => {
  const seed = { ...SEED, providers: { ...SEED.providers, edit: "alpha", keyDraft: { name: "alpha", value: "sk-draft-kept" } } }
  const { slot, face } = await mountFace(seed)
  assert.equal(slot.querySelector("[data-provider-key-input]").value, "sk-draft-kept", "种子回填在场（前置真）")
  face.refreshSettings()
  await settle()
  assert.equal(slot.querySelector("[data-provider-key-input]").value, "sk-draft-kept", "背景读后种子保真")
})

test("M-671c · `probe` ∕ `draft` 保真（背景读）", async () => {
  const probe = { state: "ok", models: [], reason: null }
  const draft = { name: "n", baseURL: "http://x.invalid/v1", model: "m", format: "openai", key: "k" }
  const seed = { ...SEED, providers: { ...SEED.providers, probe, draft } }
  const { store, face } = await mountFace(seed)
  face.refreshSettings()
  await settle()
  assert.equal(store.get().settings.providers.probe, probe, "`probe` 同引用存续")
  assert.equal(store.get().settings.providers.draft, draft, "`draft` 同引用存续")
})

test("M-671d · 负控：显式复位点仍恒清（开 ∕ 关面 + 取消径）", async () => {
  const seed = { ...SEED, providers: { ...SEED.providers, edit: "alpha", keyDraft: { name: "alpha", value: "sk-typed" }, probe: { state: "ok", models: [], reason: null }, draft: { name: "n" } } }
  const { store, slot, face } = await mountFace(seed)
  assert.ok(slot.querySelector("[data-provider-key-input]") !== null, "前置：编辑态在场")
  face.openSettings()
  await settle()
  const held = store.get().settings.providers
  assert.equal(held.edit ?? null, null, "开面：`edit` 复位")
  assert.equal(held.keyDraft ?? null, null, "开面：`keyDraft` 复位")
  assert.equal(held.probe ?? null, null, "开面：`probe` 复位")
  assert.equal(held.draft ?? null, null, "开面：`draft` 复位")
  face.handlers.onCloseSettings()
  await settle()
  assert.equal(store.get().settings.providers.edit ?? null, null, "关面：`edit` 复位（含未开编辑态径）")
  face.openSettings()
  await settle()
  click(slot.querySelector('[data-action="settings:providerKeyEdit"]'))
  slot.querySelector("[data-provider-key-input]").value = "sk-cancel-typed"
  click(slot.querySelector('[data-action="settings:providerKeyCancel"]'))
  await settle()
  click(slot.querySelector('[data-action="settings:providerKeyEdit"]'))
  assert.equal(slot.querySelector("[data-provider-key-input]").value, "", "取消 = 弃输入（复开零留驻）")
})

// ─── M-679 草稿失效声明（#679）─────────────────────────────────────────────────────────
test("M-679a · MCP 增（成功 ⇒ 本形草稿零复活 ∕ 失败 ⇒ 零声明）+ 跨形零误伤", async () => {
  const ok = await mountFace(LOADING_AGENT, { "mcp:save": { ok: true, tools: 1 } })
  const form = ok.slot.querySelector('[data-form="mcp"]')
  form.querySelector('[name="name"]').value = "srv-a"
  form.querySelector('[name="command"]').value = "node"
  click(ok.slot.querySelector('[data-action="settings:keyEdit"]'))
  ok.slot.querySelector("[data-key-input]").value = "sk-tools-kept"
  click(ok.slot.querySelector('[data-action="settings:addMcp"]'))
  await settle()
  const after = ok.slot.querySelector('[data-form="mcp"]')
  assert.ok(after !== null, "表单重建在场")
  assert.equal(after.querySelector('[name="name"]').value, "", "成功径：本形草稿作废（零复活）")
  assert.equal(after.querySelector('[name="command"]').value, "", "成功径：命令件同作废")
  assert.equal(ok.slot.querySelector("[data-key-input]").value, "sk-tools-kept", "跨形零误伤（他形草稿存续）")
  const fail = await mountFace(LOADING_AGENT, { "mcp:save": { ok: false, reason: "probe-failed" } })
  const f2 = fail.slot.querySelector('[data-form="mcp"]')
  f2.querySelector('[name="name"]').value = "srv-b"
  f2.querySelector('[name="command"]').value = "node"
  click(fail.slot.querySelector('[data-action="settings:addMcp"]'))
  await settle()
  assert.equal(fail.slot.querySelector('[data-form="mcp"] [name="name"]').value, "srv-b", "失败径：零声明（草稿保真）")
})

test("M-679b · tools 钥存（成功 ⇒ 零复活 ∕ 失败 ⇒ 保真）+ 作用域件在场", async () => {
  const editSel = '[data-action="settings:keyEdit"][data-kind="embedding"]'
  const saveSel = '[data-action="settings:keySave"][data-kind="embedding"]'
  const ok = await mountFace(LOADING_AGENT, { "settings:tools": { ok: true } })
  click(ok.slot.querySelector(editSel))
  const input = ok.slot.querySelector("[data-key-input]")
  assert.equal(input.getAttribute("data-draft-scope"), "tools:embedding", "作用域件在场（`tools:<kind>`）")
  input.value = "sk-embed-typed"
  click(ok.slot.querySelector(saveSel))
  await settle()
  click(ok.slot.querySelector(editSel))
  await settle()
  assert.equal(ok.slot.querySelector("[data-key-input]").value, "", "成功径：本行草稿零复活")
  const fail = await mountFace(LOADING_AGENT, { "settings:tools": { ok: false, reason: "invalid-key" } })
  click(fail.slot.querySelector(editSel))
  fail.slot.querySelector("[data-key-input]").value = "sk-embed-typed"
  click(fail.slot.querySelector(saveSel))
  await settle()
  assert.equal(fail.slot.querySelector("[data-key-input]").value, "sk-embed-typed", "失败径：零声明（键入保真）")
})

test("M-679c · env shell（成功 ⇒ 零复活）+ 作用域件在场（`env:shell`）", async () => {
  const { slot, calls } = await mountFace(LOADING_AGENT, { "settings:env": { ok: true, proxy: { uri: "", web: true, model: false }, shell: { current: null, candidates: [] } } })
  const input = slot.querySelector("#shell-path")
  assert.equal(input.getAttribute("data-draft-scope"), "env:shell", "作用域件在场")
  input.value = "C:/custom/shell"
  fire(input, "change")
  await settle()
  const asked = calls.filter(([channel]) => channel === "settings:env")
  assert.equal(asked.some(([, payload]) => payload?.patch?.shell === "C:/custom/shell"), true, "写路真发（前置真）")
  assert.equal(slot.querySelector("#shell-path").value, "", "成功径：shell 草稿零复活（旧键入不覆盖模型面新值）")
})

test("M-679d · 负控：scope=null 永不误伤（直调）∥ 跨形零误伤 ∥ agent 径零改（源扫）", async () => {
  const { dropDrafts } = await import("../../thincoder-desktop/renderer/view-state.mjs")
  const snap = { scrolls: [], focus: null, drafts: [{ loc: { attr: "data-draft", value: "x", scope: null } }, { loc: { attr: "data-draft", value: "y", scope: "add" } }] }
  const kept = dropDrafts(snap, new Set(["add"]))
  assert.deepEqual(kept.drafts.map((entry) => entry.loc.value), ["x"], "无作用域件不被过滤（命中件照摘）")
  assert.equal(dropDrafts(snap, new Set()).drafts.length, 2, "空集 ⇒ 原样（零成本）")
  const agentSrc = read("thincoder-desktop/renderer/mount-settings-segments-agent.mjs")
  assert.equal(agentSrc.includes("invalidateDrafts"), false, "agent 族零声明（无对象 —— 免径不补申报）")
  assert.equal(agentSrc.includes("data-draft-scope"), false, "agent 族零作用域面")
  assert.match(read("thincoder-desktop/renderer/mount-settings-exits.mjs"), /createAgentExits\(\{ ask, store, setSettings, report, clearReport, slot, paintSettings \}\)/, "agent 注入面零改")
})

// ─── M-685 拆档落形（#685）────────────────────────────────────────────────────────────
test("M-685a · `ipc.mjs` ≤300 内容行回线 + 转口群档在位（24 导出全为函数）", () => {
  const lines = contentLines(read("thincoder-desktop/src/main/ipc.mjs"))
  assert.ok(lines <= 300, `ipc.mjs 内容行 ≤300（实 = ${lines}；拆前 331）`)
  const names = Object.keys(relaysMod).sort()
  assert.equal(names.length, 24, "转口群导出恰 24 项")
  assert.ok(names.every((name) => typeof relaysMod[name] === "function"), "24 项全为函数（纯转口）")
  assert.equal(typeof ipcMod.liveAgents, "function", "liveAgents 新导出（mcp 四转口随动面）")
  assert.equal(typeof ipcMod.providerListChannel, "undefined", "转口名不在核心档（去 24 转口名）")
})

test("M-685b · 注册面零改：`registerIpcHandlers` 真跑 —— 46 项全解析为函数 ∕ 注册序 = 白名单序", () => {
  assert.equal(ipcMod.CHANNELS.length, 46, "白名单 46 项（单源 = 预载档）")
  globalThis.__ipcHandles.length = 0
  registryMod.registerIpcHandlers()
  const rows = [...globalThis.__ipcHandles]
  assert.deepEqual(rows.map((row) => row.channel), [...ipcMod.CHANNELS], "注册 46 项且序 = 白名单序（零缺 ∕ 零增）")
  assert.ok(rows.every((row) => typeof row.handler === "function"), "HANDLERS 全 46 项解析为函数（缺 ⇒ 注册期抛，未抛即证）")
  assert.equal(rows[rows.length - 1].channel, "record:append", "定序末位 = 白名单现末位（record:append）")
})

test("M-685c · 转口直传抽查（源抽取 + 替身注入 ⇒ 回执恒等 ∕ `liveAgents` ∖ `currentCwd` 两缝）", () => {
  const src = read("thincoder-desktop/src/main/ipc-relays.mjs")
  const extract = (name) => {
    const idx = src.indexOf(`function ${name}(`)
    assert.notEqual(idx, -1, `抽取锚未命中：function ${name}(`)
    const open = src.indexOf("{", idx)
    let depth = 0
    for (let i = open; i < src.length; i += 1) {
      if (src[i] === "{") depth += 1
      else if (src[i] === "}") { depth -= 1; if (depth === 0) return src.slice(idx, i + 1) }
    }
    assert.fail(`${name} 花括号不配平`)
  }
  const sentinel = { ok: true, tag: "sentinel" }
  const calls = []
  const stub = (name) => (...args) => { calls.push([name, args]); return sentinel }
  const pick = (name) => vm.runInNewContext(`${extract(name)}\n;${name}`, {
    providerList: stub("providerList"), providerSave: stub("providerSave"), modelList: stub("modelList"),
    mcpSave: stub("mcpSave"), indexStatus: stub("indexStatus"), liveAgents: () => ["live-a"], currentCwd: () => "/p",
  })
  const payload = { name: "alpha", key: "k" }
  assert.equal(pick("providerListChannel")(), sentinel, "provider:list ⇒ 直传")
  assert.equal(pick("providerSaveChannel")(payload), sentinel, "provider:save ⇒ 回执恒等")
  assert.equal(calls.find(([name]) => name === "providerSave")[1][0], payload, "载荷恒等直传（同引用）")
  assert.equal(pick("modelListChannel")(payload), sentinel, "model:list ⇒ 直传")
  assert.equal(pick("mcpSaveChannel")(payload), sentinel, "mcp:save ⇒ 直传")
  const [, saveArgs] = calls.at(-1)
  assert.equal(saveArgs[0], payload, "mcp:save 载荷恒等")
  assert.deepEqual(saveArgs[1].listAgents(), ["live-a"], "`listAgents` = ipc.mjs `liveAgents`（单向取用）")
  assert.equal(pick("indexStatusChannel")(), sentinel, "index:status ⇒ 直传")
  assert.equal(calls.find(([name]) => name === "indexStatus")[1][0]?.dir, "/p", "`dir` = `currentCwd()` 内存态")
})

// ─── M-686 拒绝面（#686）─────────────────────────────────────────────────────────────
const ENVELOPE_686 = { ok: true, reason: null, cwd: "/p", slot: 7 }
const extractSessionResume = (text) => {
  const idx = text.indexOf("function sessionResume(")
  assert.notEqual(idx, -1, "抽取锚未命中：function sessionResume(")
  const prefix = text.slice(0, idx).endsWith("async ") ? "async " : ""
  const open = text.indexOf("{", idx)
  let depth = 0
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1
    else if (text[i] === "}") { depth -= 1; if (depth === 0) return `${prefix}${text.slice(idx, i + 1)}` }
  }
  assert.fail("sessionResume 函数块花括号不配平")
}
const buildResume = ({ push, errorSink }) => vm.runInNewContext(`${extractSessionResume(read("thincoder-desktop/src/main/ipc.mjs"))}\n;sessionResume`, {
  resumeSession: async () => ({ ...ENVELOPE_686 }),
  currentCwd: () => "/p",
  scheduleSessionGC: () => {},
  pushLedgerLines: push,
  ledgerEmit: {},
  console: { error: (...args) => errorSink.push(args) },
})

test("M-686a · 主腿：注入恒拒 ⇒ `console.error` 落 ∧ 回执正常返回（应用存活）∧ 零未处理拒绝逃逸", async () => {
  const errors = []
  const unhandled = []
  const onUnhandled = (reason) => unhandled.push(reason)
  process.on("unhandledRejection", onUnhandled)
  try {
    const handler = buildResume({ push: () => Promise.reject(new Error("emit-boom")), errorSink: errors })
    assert.deepEqual(await handler(), ENVELOPE_686, "回执正常返回（拒绝不夺回执）")
    await settle()
    assert.equal(errors.length, 1, `console.error 恰一次（实 = ${errors.length}）`)
    assert.match(String(errors[0][0]), /ledger emit failed/, "拒绝串落日志面")
    assert.equal(unhandled.length, 0, "零未处理拒绝逃逸")
  } finally {
    process.off("unhandledRejection", onUnhandled)
  }
})

test("M-686b · `void` 语义锁：出站永不 settle ⇒ 回执仍即刻 settle（未改 await）", async () => {
  const handler = buildResume({ push: () => new Promise(() => {}), errorSink: [] })
  let outcome = null
  Promise.resolve(handler()).then((value) => { outcome = { ok: true, value } }, (reason) => { outcome = { ok: false, reason } })
  await new Promise((resolve) => setImmediate(resolve))
  assert.notEqual(outcome, null, "回执须于哨兵前 settle（改 await ⇒ 红）")
  assert.equal(outcome.ok, true, `回执不得拒绝（实 = ${outcome.reason?.message}）`)
  assert.deepEqual(outcome.value, ENVELOPE_686)
})

test("M-686c · 静态面：零裸 `void pushLedgerLines`（调用点必挂拒绝处理器）", () => {
  const src = read("thincoder-desktop/src/main/ipc.mjs")
  assert.equal((src.match(/void pushLedgerLines\(/g) ?? []).length, 1, "调用点恰一处")
  assert.match(src, /void pushLedgerLines\(\{[^}]*\}\)\s*\.catch\(/, "调用点直挂 `.catch`（零裸调用）")
  assert.match(src, /console\.error\("\[ipc\] ledger emit failed:", error\)/, "拒绝处理器落日志面")
})

// ─── M-689a 注面口径统一（源扫）────────────────────────────────────────────────────────
test("M-689a · 注面口径统一：零「五尾组」残留 ∕ 压缩行单独列名（源扫）", () => {
  const chat = read("thincoder-desktop/renderer/views/chat.mjs")
  const chrome = read("thincoder-desktop/renderer/views/chat-chrome.mjs")
  assert.equal(chat.includes("五尾组") || chrome.includes("五尾组"), false, "零「五尾组」残留")
  assert.equal(chat.includes("四尾组") && chat.includes("压缩行例外 = 流元素冻结点"), true, "尾组 = 四名 + 压缩行例外句（字面组合）")
  assert.equal(chrome.includes("压缩行例外 = 流元素冻结点、不在块插入点上"), true, "压缩行例外句在档（插入点纪律单源）")
})
