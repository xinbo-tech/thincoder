/**
 * 2026-10-01-audit-remediation.test.mjs — 复核扫面收正批（M1–M22 处置）· **批次本地件**（住 `docs/batches/` ·
 * 不登记常驻套件 · 随批留存；格式先例 = `2026-09-30-desktop-residuals.test.mjs` ∕ `2026-09-29-desktop-carryover-c1.test.mjs`）。
 * 运行（自 `thincoder/` 根）：`node --test docs/batches/2026-10-01-audit-remediation.test.mjs`
 *
 * 结构 = **单档多段**（各派串行落段 A ⇒ B ⇒ C ⇒ D ⇒ E —— 禁并发 append；本档现载 **派 A 段 ∥ 派 B 段 ∥ 派 C 段 ∥ 派 D 段 ∥ 派 E 段**——五段齐讫）。
 *
 * ── 派 A 段（设置面 · M2 ∥ M7 面 A）──────────────────────────────────────────────────
 *   M2a  提交成功径同清专件（`providers.draft === null` ∧ `verify === null`；用户面读数 = 重挂表单零旧值回填含钥）。
 *   M2b  失败径零清（回执非 ok ⇒ `draft` 同引用保真 —— 草稿保真）。
 *   M2c  负控：显式复位点（开 ∕ 关面）仍恒清（M-671 族对位；该族全程复跑 = 命令面，读数在批档 §5）。
 *   M7a  源面零残留：`mount-info.mjs` 退场 + `renderer/**`（除 `app.mjs` —— 派 D 面 M7 ④）零
 *        `projectInfo|refreshInfo|createInfoFace|mount-info` 命中。
 *   M7b  假 host 装配 ⇒ 零项目级读数调用（`ledger:read` ∕ `batch:status` 零发）；向导步 3 目录出口 ⇒ 仅
 *        `onProjectOpened` 一调（零第二调用）。
 *   M7c  `STATUS_KEYS` 闭集断言（无 `projectInfo`）+ 初态切片退场（`initialState()` 无该键）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何渲染档取件注册）

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const read = (rel) => readFileSync(join(ROOT, rel), "utf8")
const settle = async (rounds = 4) => { for (let i = 0; i < rounds; i += 1) await new Promise((resolve) => setImmediate(resolve)) }

// ─── 假 DOM（值面 ∕ 选择器面 ∕ 事件面 —— 收窄至本段所需；沿 residuals 件先例）────────────────────
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

// ─── 设置面装面（真接线 `attachSettings` · 窄桥回执表可注入 —— 沿 residuals 件先例）────────────
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
async function mountFace(seed, overrides = {}, deps = {}) {
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
  const face = attachSettings(host, { store, ...deps })
  store.set(patchSettings(store.get(), seed))
  await settle()
  return { store, slot, face, calls }
}

// ─── 派 A · M2（草稿专件同清 + 复位点）──────────────────────────────────────────────
const DRAFT = { name: "alpha-custom", baseURL: "http://x.invalid/v1", model: "m1", format: "openai", key: "sk-draft-leak" }
const withDraft = { ...SEED, providers: { ...SEED.providers, probe: { state: "ok", models: ["m1"] }, draft: DRAFT } }

test("M2a · 提交成功径同清专件（`draft === null` ∧ `verify === null`；重挂零旧值回填含钥）", async () => {
  const { store, slot, calls } = await mountFace(withDraft, { "provider:save": { ok: true } })
  const form = slot.querySelector('[data-form="custom"]')
  assert.ok(form !== null, "自定形表单在场（前置真）")
  assert.equal(form.querySelector('[name="key"]').value, "sk-draft-leak", "前置：暂存值快照回填在场（含钥）")
  click(form.querySelector('[data-action="settings:addCustom"]'))
  await settle()
  assert.equal(calls.filter(([channel]) => channel === "provider:save").length, 1, "写路真发（前置真）")
  assert.equal(store.get().settings.providers.draft, null, "成功径：草稿专件 `providers.draft` 同清")
  assert.equal(store.get().settings.verify, null, "成功径：`verify` 复位（原径保留）")
  assert.equal(slot.querySelector('[data-form="custom"] [name="key"]').value, "", "重挂后表单零旧值回填（含钥）")
})

test("M2b · 失败径零清（`draft` 同引用保真 —— 草稿保真）", async () => {
  const { store, slot, calls } = await mountFace(withDraft, { "provider:save": { ok: false, reason: "boom" } })
  const before = store.get().settings.providers.draft
  assert.equal(before, DRAFT, "前置：种为同一引用")
  click(slot.querySelector('[data-form="custom"] [data-action="settings:addCustom"]'))
  await settle()
  assert.equal(calls.filter(([channel]) => channel === "provider:save").length, 1, "写路真发（前置真）")
  assert.equal(store.get().settings.providers.draft, before, "失败径：`draft` 同引用保真（零清）")
  assert.equal(slot.querySelector('[data-form="custom"] [name="key"]').value, "sk-draft-leak", "失败径：重挂后键入回填在场")
})

test("M2c · 负控：显式复位点（开 ∕ 关面）仍恒清（M-671 族对位）", async () => {
  const four = { edit: "alpha", keyDraft: { name: "alpha", value: "sk-typed" }, probe: { state: "ok", models: [], reason: null }, draft: { name: "n" } }
  const { store, face } = await mountFace({ ...SEED, providers: { ...SEED.providers, ...four } })
  face.openSettings()
  await settle()
  const opened = store.get().settings.providers
  assert.equal(opened.edit ?? null, null, "开面：`edit` 复位")
  assert.equal(opened.keyDraft ?? null, null, "开面：`keyDraft` 复位")
  assert.equal(opened.probe ?? null, null, "开面：`probe` 复位")
  assert.equal(opened.draft ?? null, null, "开面：`draft` 复位")
  const { patchSettings } = await import("../../thincoder-desktop/renderer/store.mjs")
  store.set(patchSettings(store.get(), { providers: { ...store.get().settings.providers, ...four } }))
  await settle()
  face.handlers.onCloseSettings()
  await settle()
  const closed = store.get().settings.providers
  assert.equal(closed.draft ?? null, null, "关面：`draft` 复位")
  assert.equal(closed.edit ?? null, null, "关面：`edit` 复位")
  assert.equal(closed.keyDraft ?? null, null, "关面：`keyDraft` 复位")
})

// ─── 派 A · M7（projectInfo 零消费删链）────────────────────────────────────────────
const RENDERER_DIR = "thincoder-desktop/renderer"
const FACE_EXT = [".mjs", ".css", ".html"]
const walkFace = (dir) => readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => entry.isDirectory()
  ? walkFace(join(dir, entry.name))
  : (FACE_EXT.some((ext) => entry.name.endsWith(ext)) ? [join(dir, entry.name)] : []))

test("M7a · 源面零残留：`mount-info.mjs` 退场 + `renderer/**` 零命中（.mjs ∕ .css ∕ .html；除 `app.mjs` —— 派 D 面）", () => {
  assert.equal(existsSync(join(ROOT, `${RENDERER_DIR}/mount-info.mjs`)), false, "`mount-info.mjs` 整档退场（零归档件）")
  const hits = []
  for (const file of walkFace(RENDERER_DIR)) {
    if (file.endsWith("app.mjs")) continue // 派 D 面（M7 ④ `openDir` 链）—— 本段 = 派 A，逐派收口
    const text = read(file)
    for (const pattern of ["projectInfo", "refreshInfo", "createInfoFace", "mount-info"]) if (text.includes(pattern)) hits.push(`${file} → ${pattern}`)
  }
  assert.deepEqual(hits, [], `A 面零残留（实 = ${hits.join(" ∕ ")}）`)
})

test("M7b · 假 host 装配 ⇒ 零项目级读数调用；向导步 3 目录出口 ⇒ 仅 `onProjectOpened` 一调", async () => {
  let opened = 0
  const { face, calls } = await mountFace(SEED, {}, { onProjectOpened: async () => { opened += 1 } })
  const projectReads = ([channel]) => channel === "ledger:read" || channel === "batch:status"
  assert.equal(calls.some(projectReads), false, "装配时零项目级读数调用（读面随装配随动复读已退场）")
  const before = calls.length
  await face.wizardHandlers.onPickDir()
  await settle()
  assert.equal(opened, 1, "向导步 3：项目面链恰一调")
  assert.equal(calls.slice(before).some(projectReads), false, "目录出口后零第二调用（`refreshInfo` 零发）")
})

test("M7c · `STATUS_KEYS` 闭集断言（无 `projectInfo`）+ 初态切片退场", async () => {
  const { STATUS_KEYS } = await import("../../thincoder-desktop/renderer/mount-status.mjs")
  const { initialState } = await import("../../thincoder-desktop/renderer/store.mjs")
  assert.equal(Array.isArray(STATUS_KEYS) && STATUS_KEYS.length > 0, true, "`STATUS_KEYS` 载体在位")
  assert.equal(STATUS_KEYS.includes("projectInfo"), false, "`STATUS_KEYS` 无 `projectInfo`（帧分派零空转键）")
  assert.equal(Object.hasOwn(initialState(), "projectInfo"), false, "初态无 `projectInfo` 切片")
})

// ═════════════════════════════════════════════════════════════════════════════════════
// ── 派 B 段（池 ∕ 卡面 · M1 桌面面 ∥ M3 ∥ M4 ∥ M11 ∥ M16 ∥ M22 注面）─────────────────
//   M1a-c   核卡零摘除（点击后卡留场）∥ 失败径零 DOM 写（零重挂）∥ 回执 ok ⇒ 切片清 ⇒ 下帧挂载摘卡恰一次。
//   M3a-d   置位按事件键 ∧ 条目携起源键 ∥ 跨会话清位按起源键 ∥ 多键逐清 ∥ 重复回执幂等。
//   M4a-d   池头逐件就地差分（头 ∥ 计数钮同引用）∥ 读数就地换文 ∥ 读数缺席摘件 ∥ 表外件零触。
//   M11a-c  抛 ⇒ `_subMeta` 还原（helper 直呼 + 两站各一臂）∥ 正常径零行为变 ∥ 单源（定义唯一）。
//   M16a-d  换位异构键零写 + 残件返 ∥ 同键换位落原件 ∥ 焦点末环结构兜底仍在 ∥ 作用域不符零取。
//   M22     `events.mjs` 注面「随首屏页读五清」（全集余三处在他档 —— 派 D 面）。
// ═════════════════════════════════════════════════════════════════════════════════════

// ─── 派 B · 假 DOM（自含件面：值 ∕ 选择器 ∕ 事件 ∕ 写计数；与派 A 段件零重名）──────────────
let bWrites = 0
let bDoc = null
class BText {
  constructor(value) { this.data = String(value); this.parentNode = null }
  get textContent() { return this.data }
  set textContent(value) { this.data = String(value) }
}
class BNode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase()
    this.attrs = {}
    this.childNodes = []
    this.parentNode = null
    this.listeners = []
    this._value = ""
    this._checked = null
    this._sel = null
    this.open = true
    this.scrollTop = 0
  }
  get children() { return this.childNodes.filter((node) => node instanceof BNode) }
  get firstChild() { return this.childNodes[0] ?? null }
  get nextSibling() {
    if (this.parentNode === null) return null
    const list = this.parentNode.childNodes
    return list[list.indexOf(this) + 1] ?? null
  }
  get textContent() { return this.childNodes.map((node) => node.textContent).join("") }
  set textContent(value) {
    bWrites += 1
    for (const child of this.childNodes) child.parentNode = null
    this.childNodes = []
    if (String(value ?? "") !== "") this.appendChild(new BText(value))
  }
  get className() { return this.attrs.class ?? "" }
  set className(value) { bWrites += 1; this.attrs.class = String(value) }
  get classList() {
    const has = (name) => this.className.split(/\s+/).includes(name)
    return {
      contains: has,
      add: (name) => { if (!has(name)) this.className = `${this.className} ${name}`.trim() },
      remove: (name) => { this.className = this.className.split(/\s+/).filter((part) => part !== name).join(" ") },
    }
  }
  get dataset() {
    const key = (prop) => `data-${String(prop).replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`)}`
    return new Proxy({}, {
      get: (_, prop) => this.getAttribute(key(prop)) ?? undefined,
      set: (_, prop, value) => { this.setAttribute(key(prop), value); return true },
    })
  }
  get type() { return this.attrs.type ?? "" }
  set type(value) { this.attrs.type = String(value) }
  get placeholder() { return this.attrs.placeholder ?? "" }
  set placeholder(value) { this.attrs.placeholder = String(value) }
  get title() { return this.attrs.title ?? "" }
  set title(value) { this.attrs.title = String(value) }
  get value() { return this._value }
  set value(value) { bWrites += 1; this._value = String(value) }
  get checked() { return this._checked !== null ? this._checked : this.attrs.checked !== undefined }
  set checked(value) { this._checked = value === true }
  get selectionStart() { return this._sel !== null ? this._sel : this._value.length }
  set selectionStart(value) { this._sel = value }
  get selectionEnd() { return this._sel !== null ? this._sel : this._value.length }
  set selectionEnd(value) { this._sel = value }
  setSelectionRange(start) { this._sel = start }
  focus() { bDoc.activeElement = this }
  blur() { if (bDoc.activeElement === this) bDoc.activeElement = null }
  getAttribute(name) { return Object.hasOwn(this.attrs, name) ? this.attrs[name] : null }
  getAttributeNames() { return Object.keys(this.attrs) }
  setAttribute(name, value) { bWrites += 1; this.attrs[name] = String(value) }
  removeAttribute(name) { bWrites += 1; delete this.attrs[name] }
  addEventListener(type, fn) { this.listeners.push({ type, fn }) }
  removeEventListener(type, fn) { this.listeners = this.listeners.filter((entry) => !(entry.type === type && entry.fn === fn)) }
  appendChild(node) {
    bWrites += 1
    const child = node instanceof BNode || node instanceof BText ? node : new BText(node)
    if (child.parentNode !== null) child.parentNode.removeChild(child)
    child.parentNode = this
    this.childNodes.push(child)
    return child
  }
  append(...nodes) { for (const node of nodes) this.appendChild(node) }
  prepend(...nodes) { const ref = this.firstChild; for (const node of [...nodes].reverse()) this.insertBefore(node, ref) }
  insertBefore(node, ref) {
    bWrites += 1
    const child = node instanceof BNode || node instanceof BText ? node : new BText(node)
    if (child.parentNode !== null) child.parentNode.removeChild(child)
    child.parentNode = this
    const at = ref === null || ref === undefined ? -1 : this.childNodes.indexOf(ref)
    if (at < 0) this.childNodes.push(child)
    else this.childNodes.splice(at, 0, child)
    return child
  }
  removeChild(node) {
    const at = this.childNodes.indexOf(node)
    if (at >= 0) { bWrites += 1; node.parentNode = null; this.childNodes.splice(at, 1) }
    return node
  }
  remove() { if (this.parentNode !== null) this.parentNode.removeChild(this) }
  replaceChildren(...nodes) { bWrites += 1; for (const child of this.childNodes) child.parentNode = null; this.childNodes = []; this.append(...nodes) }
  replaceWith(next) {
    const parent = this.parentNode
    if (parent === null) return
    bWrites += 1
    parent.insertBefore(next, this)
    parent.removeChild(this)
  }
  walk(fn) { for (const child of this.children) { fn(child); child.walk(fn) } }
  querySelector(sel) { let hit = null; this.walk((node) => { if (hit === null && bSelect(node, sel)) hit = node }); return hit }
  querySelectorAll(sel) { const out = []; this.walk((node) => { if (bSelect(node, sel)) out.push(node) }); return out }
  closest(sel) { for (let node = this; node !== null; node = node.parentNode) if (node instanceof BNode && bSelect(node, sel)) return node; return null }
  matches(sel) { return bSelect(this, sel) }
}
const bPart = /\[([\w-]+)(?:="([^"]*)")?\]|\.([\w-]+)|#([\w-]+)|([a-zA-Z][\w-]*)/g
function bPick(node, sel) {
  const parts = [...String(sel).matchAll(bPart)]
  if (parts.length === 0) return false
  for (const part of parts) {
    if (part[1] !== undefined) {
      const value = node.getAttribute(part[1])
      if (value === null || (part[2] !== undefined && value !== part[2])) return false
    } else if (part[3] !== undefined) { if (!node.classList.contains(part[3])) return false }
    else if (part[4] !== undefined) { if (node.getAttribute("id") !== part[4]) return false }
    else if (part[5] !== undefined) { if (node.tagName !== part[5].toUpperCase()) return false }
  }
  return true
}
function bSelect(node, sel) {
  const walk = String(sel).trim().split(/\s+/)
  if (!bPick(node, walk[walk.length - 1])) return false
  let at = walk.length - 2
  for (let parent = node.parentNode; parent !== null && at >= 0; parent = parent.parentNode) {
    if (parent instanceof BNode && bPick(parent, walk[at])) at -= 1
  }
  return at < 0
}
const bFire = (el, type) => {
  const event = { type, target: el, currentTarget: el, preventDefault: () => {}, stopPropagation: () => {} }
  for (const entry of [...el.listeners]) if (entry.type === type) entry.fn(event)
  return event
}
function bInstall() {
  bWrites = 0
  bDoc = {
    activeElement: null,
    created: [],
    slot: null,
    input: null,
    createElement: (tag) => { bWrites += 1; const node = new BNode(tag); bDoc.created.push(node); return node },
    createTextNode: (value) => { bWrites += 1; return new BText(value) },
    querySelector: (sel) => (sel === '[data-slot="flow"]' ? bDoc.slot : sel === "#input" ? bDoc.input : bDoc.slot?.querySelector(sel) ?? null),
    querySelectorAll: () => [],
  }
  globalThis.document = bDoc
  globalThis.Node = BNode
}

// ─── 派 B · M1（提问卡退场权收单源 —— 桌面面）────────────────────────────
const bCardsSeed = () => ({
  activeSession: "S1",
  questions: { S1: { promptId: "p1", question: "Q?", options: ["opt-a", "opt-b"] } },
  tasks: {},
  goal: {},
  tabBadges: {},
  locale: "en",
})
const bMountCards = async (invoke) => {
  bInstall()
  const { attachCards } = await import("../../thincoder-desktop/renderer/mount-cards.mjs")
  const { createStore } = await import("../../thincoder-desktop/renderer/store.mjs")
  const store = createStore(bCardsSeed())
  bDoc.slot = new BNode("div")
  bDoc.slot.setAttribute("data-slot", "flow")
  const face = attachCards({ invoke }, { store })
  return { store, face }
}

test("M1a · 核卡零摘除：点击选项 ⇒ 卡节点仍在文档（不自摘）+ 出口恰一", async () => {
  bInstall()
  const { questionCardNode } = await import("../../thincoder-desktop/renderer/views/question.mjs")
  const host = new BNode("div")
  const exits = []
  const card = questionCardNode({ promptId: "p1", question: "Q?", options: ["opt-a"] }, { onAnswer: (promptId, answer) => exits.push([promptId, answer]) })
  host.appendChild(card)
  const option = card.querySelector(".question-option")
  assert.ok(option !== null, "选项钮在场（前置真）")
  bFire(option, "click")
  assert.deepEqual(exits, [["p1", "opt-a"]], "作答出口恰一（promptId + 选项值）")
  assert.equal(card.parentNode, host, "核卡零摘除：作答后卡节点仍在文档（退场权归端侧）")
})

test("M1b · 回执非 ok ⇒ 失败径零 DOM 写（零重挂 ∥ 节点换代零发生）", async () => {
  const { store, face } = await bMountCards(async () => ({ ok: false, reason: "test-reject" }))
  face.paintCards()
  const card = bDoc.slot.querySelector('[data-card="question"]')
  assert.ok(card !== null, "卡已挂（前置真）")
  bWrites = 0
  bDoc.created.length = 0
  face.handlers.onAnswer("p1", "opt-a")
  await settle(8)
  assert.equal(bWrites, 0, "失败径零 DOM 写（零重挂）")
  assert.equal(bDoc.created.length, 0, "失败径零新节点（零 `mountCards` 重挂）")
  assert.equal(bDoc.slot.querySelector('[data-card="question"]'), card, "卡节点同枚（恒在场可重试）")
  assert.equal(store.get().questions.S1?.promptId, "p1", "切片零乐观写（拒绝径零摘项）")
})

test("M1c · 回执 ok ⇒ 清切片 ⇒ 下帧挂载摘卡恰一次", async () => {
  const { store, face } = await bMountCards(async () => ({ ok: true }))
  face.paintCards()
  const card = bDoc.slot.querySelector('[data-card="question"]')
  let removals = 0
  const nativeRemove = card.remove.bind(card)
  card.remove = () => { removals += 1; nativeRemove() }
  face.handlers.onAnswer("p1", "opt-a")
  await settle(8)
  assert.equal(store.get().questions.S1, undefined, "回执 ok ⇒ `clearQuestion` 清切片")
  assert.equal(card.parentNode, bDoc.slot, "回执径零摘卡（卡留至帧挂载）")
  assert.equal(removals, 0, "端不做乐观摘除")
  face.paintCards()
  assert.equal(removals, 1, "下帧挂载摘卡恰一次")
  assert.equal(card.parentNode, null, "卡已出场（切片驱动）")
})

// ─── 派 B · M3（待审批位标：条目携起源键 ∥ 清位按起源键）──────────────────────────
const bApprovalEv = (key, promptId) => ({ channel: "ev:approval", key, promptId, shape: "tool", tool: "t-1" })

test("M3a · 置位按事件键 ∧ 条目携起源键（载荷白名单零扩）", async () => {
  const { reduce } = await import("../../thincoder-desktop/renderer/events.mjs")
  const { initialState } = await import("../../thincoder-desktop/renderer/store.mjs")
  const state = reduce(initialState(), bApprovalEv("A", "p1"))
  const item = state.pool.approvals[0]
  assert.equal(item?.key, "A", "条目携起源键 `item.key`（内部簿记）")
  assert.equal(Object.hasOwn(item, "channel"), false, "载荷白名单零改（`channel` 不入条目）")
  assert.ok((state.tabBadges.A ?? []).includes("approval"), "置位按事件键")
  assert.equal(state.pool.approval, 1, "待决数随动")
})

test("M3b · 跨会话清位按起源键（B 位零动 —— 清位不按活动会话）", async () => {
  const { reduce, clearApproval } = await import("../../thincoder-desktop/renderer/events.mjs")
  const { initialState } = await import("../../thincoder-desktop/renderer/store.mjs")
  let state = reduce(initialState(), bApprovalEv("A", "p1"))
  state = reduce(state, bApprovalEv("B", "p2"))
  state = { ...state, activeSession: "B" }
  const next = clearApproval(state, "p1")
  assert.equal((next.tabBadges.A ?? []).length, 0, "A 位清（起源键已无项）")
  assert.ok((next.tabBadges.B ?? []).includes("approval"), "B 位零动（活动会话 ≠ 起源键）")
  assert.equal(next.pool.approval, 1, "池待决数随摘项重算")
})

test("M3c · 多键逐清：A 清尽 ⇒ A 位灭、B 位在", async () => {
  const { reduce, clearApproval } = await import("../../thincoder-desktop/renderer/events.mjs")
  const { initialState } = await import("../../thincoder-desktop/renderer/store.mjs")
  let state = reduce(initialState(), bApprovalEv("A", "p1"))
  state = reduce(state, bApprovalEv("A", "p2"))
  state = reduce(state, bApprovalEv("B", "p3"))
  const one = clearApproval(state, "p1")
  assert.ok((one.tabBadges.A ?? []).includes("approval"), "A 尚余一项 ⇒ 位标在")
  const two = clearApproval(one, "p2")
  assert.equal((two.tabBadges.A ?? []).length, 0, "A 清尽 ⇒ A 位灭")
  assert.ok((two.tabBadges.B ?? []).includes("approval"), "B 位在（零误清）")
})

test("M3d · 重复回执幂等（未命中 ⇒ 原引用零写）", async () => {
  const { reduce, clearApproval } = await import("../../thincoder-desktop/renderer/events.mjs")
  const { initialState } = await import("../../thincoder-desktop/renderer/store.mjs")
  const state = reduce(initialState(), bApprovalEv("A", "p1"))
  const once = clearApproval(state, "p1")
  assert.equal(clearApproval(once, "p1"), once, "重复回执 ⇒ 原引用（零二次摘除）")
})

// ─── 派 B · M4（池头逐件就地差分 + 补挂退化幂等）─────────────────────────────
const bPoolState = (running) => ({
  activeSession: "S1",
  pool: { running, approval: 1, queue: [], approvals: [{ promptId: "p1", shape: "tool", tool: "t-1" }] },
  subBlocks: { S1: [{ key: "s1", label: "sub", role: "r", id: 1, rows: [] }] },
  poolCollapsed: {},
})

test("M4a-d · 池头逐件就地差分：头 ∥ 计数钮跨帧同引用；读数就地换文 ∥ 缺席摘件；表外件零触", async () => {
  bInstall()
  const { mountPool } = await import("../../thincoder-desktop/renderer/views/activity.mjs")
  const { noteActivityBirth } = await import("../../thincoder-desktop/renderer/views/activity-new.mjs")
  const root = new BNode("div")
  mountPool(root, bPoolState(2), {})
  const head = root.querySelector("[data-pool-head]")
  assert.ok(head !== null, "头在场（前置真）")
  noteActivityBirth(root) // 表外件（计数钮）——头首子
  const btn = root.querySelector(".activity-new-btn")
  assert.ok(btn !== null && btn.parentNode === head, "计数钮在头（前置真）")
  const running = root.querySelector('[data-read="running"]')
  assert.equal(running.textContent, "2", "前置：读数 = 2")
  mountPool(root, bPoolState(3), {}) // 帧 2：壳在位 ⇒ 领用（syncHead）
  assert.equal(root.querySelector("[data-pool-head]"), head, "M4a：头元素跨帧同引用（零整头建树）")
  assert.equal(root.querySelector(".activity-new-btn"), btn, "M4a：表外计数钮同引用")
  assert.equal(root.querySelector('[data-read="running"]'), running, "M4b：读数节点同枚（零新节点）")
  assert.equal(running.textContent, "3", "M4b：值变 ⇒ 就地换文")
  mountPool(root, bPoolState(null), {}) // 帧 3：读数缺席 ⇒ 摘件
  assert.equal(root.querySelector('[data-read="running"]'), null, "M4c：读数 `null` ⇒ 摘该读数节点")
  assert.ok(root.querySelector('[data-read="approval"]') !== null, "M4c：余读数零动")
  assert.equal(root.querySelector("[data-pool-head]"), head, "M4c：头存续")
  assert.equal(root.querySelector(".activity-new-btn"), btn, "M4d 负控：表外件全场存续（不因差分被摘）")
})

test("M4·补挂退化 · 钮在场 ⇒ `syncActivityNew` 零动作（幂等兜底）", async () => {
  bInstall()
  const { mountPool } = await import("../../thincoder-desktop/renderer/views/activity.mjs")
  const { noteActivityBirth, activityNewCount } = await import("../../thincoder-desktop/renderer/views/activity-new.mjs")
  const root = new BNode("div")
  mountPool(root, bPoolState(2), {})
  noteActivityBirth(root)
  const btn = root.querySelector(".activity-new-btn")
  assert.equal(activityNewCount(root), 1, "前置：计数 = 1")
  const head = root.querySelector("[data-pool-head]")
  let inserts = 0
  const nativeInsert = head.insertBefore.bind(head)
  head.insertBefore = (node, ref) => { inserts += 1; return nativeInsert(node, ref) }
  mountPool(root, bPoolState(2), {}) // 领用径：syncHead + 尾 syncActivityNew
  assert.equal(root.querySelector(".activity-new-btn"), btn, "钮同枚（身份存续）")
  assert.equal(inserts, 0, "头零插写（钮在场 ⇒ 补挂零动作 ∥ syncHead 等值零写）")
  assert.equal(head, root.querySelector("[data-pool-head]"), "头同枚")
})

// ─── 派 B · M11（frozen 穿闸单源 helper）───────────────────────────────────
test("M11a · 抛 ⇒ `_subMeta` 还原（helper 直呼 + 两站各一臂）", async () => {
  bInstall()
  const { withThawedSubMeta, fillSubagentEcho } = await import("../../thincoder-desktop/renderer/views/chat-subagent.mjs")
  const element = { _subMeta: null }
  const meta = { key: "k", frozen: true }
  assert.throws(() => withThawedSubMeta(element, meta, () => { throw new Error("boom") }), /boom/, "helper：异常径透传")
  assert.equal(element._subMeta, meta, "helper：抛 ⇒ 还原原值（不留未冻态）")

  const shell = new BNode("div")
  bDoc.created.length = 0
  const frozenBlock = { kind: "subagent", meta: { key: "k1", label: "L", role: "r", id: 1, frozen: true }, rows: [{ kind: "text", get text() { throw new Error("boom") } }] }
  assert.throws(() => fillSubagentEcho(shell, frozenBlock), /boom/, "站 A（echoOf）：异常径透传")
  const built = bDoc.created.filter((node) => node.className.includes("advisor-block"))
  assert.equal(built.length, 1, "站 A：块壳建出（重放途中）")
  assert.equal(built[0]._subMeta, frozenBlock.meta, "站 A：抛 ⇒ 还原冻结本相（非临时未冻态）")
  assert.equal(built[0].parentNode, null, "站 A：异常径零追加")

  const { syncSubBlocks } = await import("../../thincoder-desktop/renderer/views/pool-subagents.mjs")
  const root = new BNode("div")
  const family = new BNode("div")
  family.setAttribute("data-family", "subagents")
  root.appendChild(family)
  const base = { key: "k2", label: "L2", role: "r", id: 2, rows: [{ kind: "text", text: "row-1" }] }
  syncSubBlocks(root, family, { blocks: [base] })
  const sub = family.querySelector(".sub-block")
  assert.ok(sub !== null, "站 B：块出生（前置真）")
  const frozenEntry = { ...base, frozen: true, rows: [base.rows[0], { kind: "text", get text() { throw new Error("boom") } }] }
  assert.throws(() => syncSubBlocks(root, family, { blocks: [frozenEntry] }), /boom/, "站 B（replayRows）：异常径透传")
  assert.equal(sub._subMeta, frozenEntry, "站 B：抛 ⇒ 还原冻结本相（元素同枚）")
})

test("M11b · 正常径零行为变（非冻重放零临时态 ∥ `_rowsDone` 语义零改）", async () => {
  bInstall()
  const { syncSubBlocks } = await import("../../thincoder-desktop/renderer/views/pool-subagents.mjs")
  const root = new BNode("div")
  const family = new BNode("div")
  family.setAttribute("data-family", "subagents")
  root.appendChild(family)
  const first = { key: "k1", label: "L", role: "r", id: 1, rows: [{ kind: "text", text: "a" }] }
  syncSubBlocks(root, family, { blocks: [first] })
  const sub = family.querySelector(".sub-block")
  assert.equal(sub._subMeta, first, "非冻首见 ⇒ `_subMeta` 本相")
  const grown = { ...first, rows: [...first.rows, { kind: "text", text: "b" }] }
  syncSubBlocks(root, family, { blocks: [grown] })
  assert.equal(sub._subMeta, grown, "非冻增量 ⇒ 引用随新模型")
  assert.ok(sub.querySelector(".advisor-content").textContent.includes("b"), "增量行已追加（行为零变）")
  assert.equal(family.querySelector(".sub-block"), sub, "元素零换代")
})

test("M11c · 单源：`withThawedSubMeta` 定义唯一 ∥ 两站同引（零副本）", () => {
  const chat = read("thincoder-desktop/renderer/views/chat-subagent.mjs")
  const pool = read("thincoder-desktop/renderer/views/pool-subagents.mjs")
  assert.match(chat, /export function withThawedSubMeta\(element, meta, run\)/, "定义唯一（chat-subagent 导出）")
  assert.match(pool, /import \{ withThawedSubMeta \} from "\.\/chat-subagent\.mjs"/, "消费站同引（单向）")
  assert.equal((pool.match(/frozen: false/g) ?? []).length, 0, "消费站零副本（无本地未冻态字面）")
  assert.equal((chat.match(/frozen: false/g) ?? []).length, 1, "未冻态字面唯一（helper 内）")
})

// ─── 派 B · M16（键零命中零写；结构路径留焦点链末环）───────────────────────────
const bForm = (fields) => {
  const root = new BNode("div")
  for (const field of fields) {
    const input = new BNode("input")
    if (field.id !== undefined) input.setAttribute("id", field.id)
    input.setAttribute("data-draft", field.id ?? "")
    if (field.scope !== undefined) input.setAttribute("data-draft-scope", field.scope)
    input.value = field.value ?? ""
    root.appendChild(input)
  }
  return root
}

test("M16a · 换位异构键 ⇒ 零写 + 残件返（值不灌邻件）", async () => {
  bInstall()
  const { captureView, restoreView } = await import("../../thincoder-desktop/renderer/view-state.mjs")
  const snap = captureView(bForm([{ id: "http-url", value: "https://x.invalid" }]))
  assert.equal(snap.drafts.length, 1, "前置：一件入快照")
  const root2 = bForm([{ id: "command", value: "" }])
  const rest = restoreView(root2, snap)
  assert.equal(root2.querySelector("#command").value, "", "换位异构键 ⇒ 零写（值不灌邻件）")
  assert.equal(rest.drafts.length, 1, "未落件入残件（跨在途重建携带）")
})

test("M16b · 同键换位 ⇒ 键命中落原件（位序不达亦可）", async () => {
  bInstall()
  const { captureView, restoreView } = await import("../../thincoder-desktop/renderer/view-state.mjs")
  const snap = captureView(bForm([{ id: "alpha", value: "v-alpha" }]))
  const root2 = bForm([{ id: "beta", value: "" }, { id: "alpha", value: "" }])
  const rest = restoreView(root2, snap)
  assert.equal(root2.querySelector("#alpha").value, "v-alpha", "键命中 ⇒ 落原件")
  assert.equal(root2.querySelector("#beta").value, "", "邻件零写")
  assert.equal(rest.drafts.length, 0, "已落 ⇒ 零残件")
})

test("M16c · 焦点末环结构路径兜底仍在（键零命中亦可置焦）", async () => {
  bInstall()
  const { captureView, restoreView } = await import("../../thincoder-desktop/renderer/view-state.mjs")
  const root1 = new BNode("div")
  const plain = new BNode("div")
  plain.textContent = "footer"
  root1.appendChild(plain)
  bDoc.activeElement = plain
  const snap = captureView(root1)
  assert.equal(snap.focus.chain.length, 0, "前置：键回退链空")
  const root2 = new BNode("div")
  const plain2 = new BNode("div")
  plain2.textContent = "footer"
  root2.appendChild(plain2)
  bDoc.activeElement = null
  const rest = restoreView(root2, snap)
  assert.equal(bDoc.activeElement, plain2, "末环 `byPath` 兜底 ⇒ 同路径件置焦")
  assert.equal(rest.focus, null, "置焦落位 ⇒ 零残件")
})

test("M16d · 作用域不符零取（锁 —— 免跨表单身份写）", async () => {
  bInstall()
  const { captureView, restoreView } = await import("../../thincoder-desktop/renderer/view-state.mjs")
  const snap = captureView(bForm([{ id: "field", value: "v1", scope: "s1" }]))
  const root2 = bForm([{ id: "field", value: "", scope: "s2" }])
  const rest = restoreView(root2, snap)
  assert.equal(root2.querySelector("#field").value, "", "作用域不符 ⇒ 零取（零写）")
  assert.equal(rest.drafts.length, 1, "未落 ⇒ 残件")
})

// ─── 派 B · M22（注面：events 档「五清」）──────────────────────────────────
test("M22 · 注面：`events.mjs`「随首屏页读五清」（四清零残留）", () => {
  const events = read("thincoder-desktop/renderer/events.mjs")
  assert.ok(events.includes("随首屏页读五清"), "注面收正（events 档 —— 余三处归派 D）")
  assert.equal(events.includes("随首屏页读四清"), false, "「四清」零残留（本档）")
})

// ═════════════════════════════════════════════════════════════════════════════════════
// ── 派 C 段（宿主面 · M6 ∥ M10）───────────────────────────────────────────────
//   M6a   源面零残留：`thincoder-desktop/src/**` + c3 批内件 零 `capQueued|withdrawCapEntry|撤回臂` 命中。
//   M6b-1 行为保真：cap 待答 ∧ 队未满 ∧ 携文 ⇒ 入队恰一条 + 受理回执（消费 = 下一回合边界）。
//   M6b-2 行为保真：cap 待答 ∧ 队满 ∧ 携文 ⇒ `queue-full` 零中止（零入队 ∥ 询问在场）。
//         （其余腿 = c3 批内件全量复跑 —— 命令面读数在批档 §5。）
//   M6c   `queued.remove` 零调用点 + 原语退场（`createQueuedInput()` 返回面无 `remove`）。
//   M10a  墓碑恒真（turnGate 替身）⇒ 边界轮 `end` 零帧 ∧ `appendRecord` 零调用。
//   M10b  非真 ⇒ 边界轮 `end` 恰一次（成功 ∥ 失败两径；帧 ∥ 记录同值）。
//   M10c  非边界轮 ∥ timer 轮双负控（零帧零记录零变）。
// ═════════════════════════════════════════════════════════════════════════════════════

const cUntil = async (fn, ms = 8000) => { const t0 = Date.now(); while (!fn()) { if (Date.now() - t0 > ms) throw new Error("until timeout"); await new Promise((r) => setTimeout(r, 5)) } return true }
const cWalkSrc = (dir) => readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? cWalkSrc(join(dir, entry.name)) : [join(dir, entry.name)]))

// ─── 派 C · M6a（源面零残留 —— 负控）──────────────────────────────────────
test("M6a · 源面零残留：`src` 全扫 + c3 批内件 零 `capQueued|withdrawCapEntry|撤回臂` 命中", () => {
  const tokens = ["capQueued", "withdrawCapEntry", "撤回臂"]
  const hits = []
  for (const file of cWalkSrc("thincoder-desktop/src")) {
    const src = read(file)
    for (const token of tokens) if (src.includes(token)) hits.push(`${file} → ${token}`)
  }
  const c3 = read("docs/batches/2026-09-29-desktop-carryover-c3.test.mjs")
  for (const token of tokens) if (c3.includes(token)) hits.push(`c3 → ${token}`)
  assert.deepEqual(hits, [], `零残留（实 = ${hits.join(" ∕ ")}）`)
})

// ─── 派 C · M6c（原语退场 —— 零调用点 ∥ 零在面）────────────────────────────
test("M6c · `queued.remove` 零调用点 + 原语退场（源面）", async () => {
  const hits = []
  for (const file of cWalkSrc("thincoder-desktop/src")) {
    const src = read(file)
    if (src.includes("queued.remove") || src.includes("remove(key, entry)")) hits.push(file)
  }
  assert.deepEqual(hits, [], `零调用点 ∥ 零定义（实 = ${hits.join(" ∕ ")}）`)
  const { createQueuedInput } = await import("../../thincoder-desktop/src/main/queued-input.mjs")
  const api = createQueuedInput()
  assert.equal(typeof api.remove, "undefined", "原语退场（返回面无 `remove`）")
  assert.equal(Object.keys(api).sort().join(","), "add,clear,clearAll,peek,plan,size,snapshot,take", "返回面闭集（余键零动）")
})

// ─── 派 C · M6b（行为保真 —— 驱动级最小重放；c3 全量复跑 = 命令面）──────────────
const cGates = () => {
  const table = new Map()
  let seq = 0
  return {
    table,
    askQuestion: (key) => new Promise((res) => { seq += 1; table.set(`q${seq}`, { key, resolve: res }) }),
    denyGates: (key) => {
      for (const [id, entry] of [...table]) { if (entry.key !== key) continue; table.delete(id); entry.resolve("(user cancelled)") }
    },
  }
}
const cDriverOf = async () => {
  const { createTurnDriver } = await import("../../thincoder-desktop/src/main/turn-driver.mjs")
  const events = [], runs = [], gates = cGates()
  const driver = createTurnDriver({
    post: (ch, payload) => events.push({ ch, payload }),
    run: (agent, body, bridge, opts = {}) => new Promise((resolve, reject) => {
      runs.push({ body, resume: opts.resume === true, signal: opts.signal, resolve, reject })
      opts.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })), { once: true })
    }),
    bridge: () => ({}), postUsage: () => {}, projects: { currentCwd: () => null },
    ensure: async () => ({ title: "t", _slot: 1, _asyncSubagents: new Map(), _asyncAdvisors: new Map(), _consultSessions: new Map(), _pendingAsyncResults: [], provider: { name: "vis", model: "claude-sonnet-4-5" }, config: { locale: "zh" }, memory: { db: null }, history: [], _fullHistory: [] }),
    forgetKey: () => {}, dropScope: () => {},
    askQuestion: gates.askQuestion, denyGates: gates.denyGates,
  })
  return { driver, events, runs, gates }
}
const cToCapPending = async (fx) => {
  const { ContinueError } = await import("../../thincoder-desktop/node_modules/@thincoder/core/agent.mjs")
  assert.equal((await fx.driver.send("1", "首消息")).ok, true, "首回合受理")
  await cUntil(() => fx.runs.length === 1)
  fx.runs[0].reject(new ContinueError(30)) // 撞帽三径入口（turn-face `instanceof ContinueError`）
  await cUntil(() => fx.gates.table.size === 1)
}

test("M6b-1 · 行为保真：cap 待答 ∧ 队未满 ∧ 携文 ⇒ 入队恰一条 + 受理回执", async () => {
  const fx = await cDriverOf()
  await cToCapPending(fx)
  assert.deepEqual(fx.driver.interrupt("1", "携行语"), { ok: true }, "受理（预检成功 ⇒ 该条即本代入队）")
  assert.deepEqual(fx.driver.queueSnapshot("1"), ["携行语"], "入队恰一条（入队单点 = interrupt 入口）")
  assert.equal(fx.runs[0].signal.aborted, true, "中止照常（询问按取消结算）")
  await cUntil(() => fx.runs.length === 2)
  assert.equal(fx.runs[1].body, "携行语", "续发交付逐字（消费 = 下一回合边界）")
  fx.runs[1].resolve("done")
  await cUntil(() => fx.events.some((e) => e.ch === "ev:activity" && e.payload.event === "done"))
  assert.deepEqual(fx.driver.queueSnapshot("1"), [], "交付即消费（队空）")
})

test("M6b-2 · 行为保真：cap 待答 ∧ 队满 ∧ 携文 ⇒ queue-full 零中止（零入队）", async () => {
  const { QUEUED_MAX_ITEMS } = await import("../../thincoder-core/queued.mjs")
  const fx = await cDriverOf()
  await cToCapPending(fx)
  for (let i = 0; i < QUEUED_MAX_ITEMS; i += 1) assert.equal((await fx.driver.send("1", `q${i}`)).ok, true, `忙态受理第 ${i + 1} 条`)
  assert.equal(fx.driver.queueSnapshot("1").length, QUEUED_MAX_ITEMS, "队满（容量按键判）")
  assert.deepEqual(fx.driver.interrupt("1", "溢出语"), { ok: false, reason: "queue-full" }, "回执第三 reason")
  assert.equal(fx.runs[0].signal.aborted, false, "零中止（询问在场 ∕ 回合照旧）")
  assert.equal(fx.driver.queueSnapshot("1").length, QUEUED_MAX_ITEMS, "零入队（队零变）")
  assert.equal(fx.gates.table.size, 1, "询问仍在场（待决门未结算）")
  fx.driver.dispose("1") // 清场：队清 + 待决门按拒结算（零悬挂）
  await settle(8)
})

// ─── 派 C · M10（记录腿墓碑门 —— `emitDigestEnd` 查位）────────────────────────
const cFaceOf = async (over = {}) => {
  const { createTurnFace } = await import("../../thincoder-desktop/src/main/turn-face.mjs")
  const frames = [], records = []
  const agent = { title: "t", _slot: 1, history: [], _fullHistory: [], _recordStore: { append: (record) => records.push(record) }, _historyWindow: 0 }
  const face = createTurnFace({
    post: (ch, payload) => frames.push({ ch, payload }),
    run: over.run ?? (() => Promise.resolve("done")),
    bridge: () => ({}),
    postUsage: () => {},
    flights: new Map(),
    turnGate: { stamp() {}, revoked: () => over.revoked === true },
  })
  return { face, frames, records, agent }
}
const cEndFrames = (frames) => frames.filter((f) => f.ch === "ev:digest" && f.payload.status === "end")

test("M10a · 墓碑恒真 ⇒ 边界轮 `end` 零帧 ∧ `appendRecord` 零调用", async () => {
  const { face, frames, records, agent } = await cFaceOf({ revoked: true })
  const out = await face.executeTurn("1", agent, "文本", { autoTurn: true })
  assert.deepEqual(out, { ok: true }, "回合照常收口（零中止）")
  assert.equal(cEndFrames(frames).length, 0, "零 `end` 帧（墓碑命中）")
  assert.equal(frames.some((f) => f.ch === "ev:digest"), false, "零 digest 帧（cap 径亦未触）")
  assert.equal(records.length, 0, "`appendRecord` 零调用（零记录）")
  assert.equal(agent._fullHistory.length, 0, "留档面零写")
  assert.ok(frames.some((f) => f.ch === "ev:activity" && f.payload.event === "done"), "收口帧照旧（零变）")
})

test("M10b · 非真 ⇒ 边界轮 `end` 恰一次（成功 ∥ 失败两径；帧 ∥ 记录同值）", async () => {
  const ok = await cFaceOf()
  await ok.face.executeTurn("1", ok.agent, "文本", { autoTurn: true })
  const okEnd = cEndFrames(ok.frames)
  assert.equal(okEnd.length, 1, "成功径：`end` 恰一次")
  assert.equal(ok.records.length, 1, "成功径：记录恰一次")
  assert.deepEqual([ok.records[0].kind, ok.records[0].status, ok.records[0].ok], ["digest", "end", true], "记录形（digest ∕ end ∕ ok:true）")
  assert.equal(okEnd[0].payload.ms, ok.records[0].ms, "帧 ∥ 记录 `ms` 同值（单算式）")

  const bad = await cFaceOf({ run: () => Promise.reject(new Error("boom")) })
  await assert.rejects(() => bad.face.executeTurn("1", bad.agent, "文本", { autoTurn: true }), /boom/, "失败径抛回调用面（零变）")
  const badEnd = cEndFrames(bad.frames)
  assert.equal(badEnd.length, 1, "失败径：`end` 恰一次")
  assert.equal(bad.records.length, 1, "失败径：记录恰一次")
  assert.equal(badEnd[0].payload.ok, false, "失败径：`ok:false`")
  assert.equal(badEnd[0].payload.ms, bad.records[0].ms, "帧 ∥ 记录同值（失败径）")
})

test("M10c · 非边界轮 ∥ timer 轮双负控（零帧零记录零变）", async () => {
  const plain = await cFaceOf()
  await plain.face.executeTurn("1", plain.agent, "文本", {}) // 用户回合（非边界）
  assert.equal(plain.frames.some((f) => f.ch === "ev:digest"), false, "非边界轮：零 digest 帧")
  assert.equal(plain.records.length, 0, "非边界轮：零记录")
  assert.ok(plain.frames.some((f) => f.ch === "ev:activity" && f.payload.event === "done"), "非边界轮：收口帧零变")

  const timer = await cFaceOf()
  await timer.face.executeTurn("1", timer.agent, "文本", { autoTurn: true, timerTurn: true })
  assert.equal(timer.frames.some((f) => f.ch === "ev:digest"), false, "timer 轮：零 digest 帧")
  assert.equal(timer.records.length, 0, "timer 轮：零记录")
  assert.ok(timer.frames.some((f) => f.ch === "ev:activity" && f.payload.event === "done"), "timer 轮：收口帧零变")
})

// ═════════════════════════════════════════════════════════════════════════════
// ── 派 D 段（帧门 + 句处置 · M12 ∥ M7 ④ 收口 ∥ M22 注面两档）───────────────────
//   M12a  源面：帧内一次性门在位（`cardsDrawn` + `paintCardsOnce`）∥ `applyFrame` 起帧复位（先于分派）∥
//         `paintChat` 两内联点与 `faces.cards` 皆用 wrapper（行锚定直呼 `paintCards(state)` 唯一 = wrapper 体）。
//   M12b  源面：`onCardRefresh` 径调用前置门复位（帧外直呼 = 独立一次卡面重挂 —— 保原行为）。
//   M12c  帧分派契约锁（每面每帧至多一次 ∥ 五面表序）+ 结算径「卡面先于结算」次序零变；
//         既有帧分派 ∥ 卡面批内件复跑读数（命令面）在批档 §5。
//   M7-④自证 `app.mjs` 面零残留（M7 ④ 收口 —— A 段 M7a 腿排除面；§2 之 M7d〔D10 行 · 父侧笔〕为文档项，与本腿异）。
//   M22-D `page-read.mjs` ∥ `chat-digest-rows.mjs` 两档三处 四清 ⇒ 五清（源面零残留）。
// ═════════════════════════════════════════════════════════════════════════════

const D_APP = "thincoder-desktop/renderer/app.mjs"
const D_PAGE_READ = "thincoder-desktop/renderer/page-read.mjs"
const D_ROWS = "thincoder-desktop/renderer/views/chat-digest-rows.mjs"

test("M12a · 源面：帧内一次性门在位 ∥ `applyFrame` 起帧复位 ∥ 两内联点与 `faces.cards` 皆用 wrapper", () => {
  const app = read(D_APP)
  assert.match(app, /let cardsDrawn = false/, "帧作用域门在位")
  assert.match(app, /function paintCardsOnce\(state\) \{/, "wrapper 定义在位")
  const applyBody = app.slice(app.indexOf("function applyFrame(dirtyKeys) {"), app.indexOf("const frame = createFrameMerge"))
  assert.ok(applyBody.includes("cardsDrawn = false"), "起帧复位在位（`applyFrame` 体内）")
  assert.ok(applyBody.indexOf("cardsDrawn = false") < applyBody.indexOf("dispatchFrame"), "复位先于分派（起帧语义）")
  const chatBody = app.slice(app.indexOf("function paintChat(state = store.get()) {"), app.indexOf("/** 首屏引导层随动"))
  assert.equal((chatBody.match(/paintCardsOnce\(state\)/g) ?? []).length, 2, "两内联点皆 wrapper（构造径 ∥ 结算径）")
  assert.equal((app.match(/^\s*paintCards\(state\)\s*$/gm) ?? []).length, 1, "直呼 `paintCards(state)` 唯一 = wrapper 体（行面）")
  assert.match(app, /cards: paintCardsOnce,/, "`faces.cards` 用 wrapper")
  assert.equal((app.match(/cards: paintCards,/g) ?? []).length, 0, "旧直呼零残留（faces 表）")
})

test("M12b · 源面：`onCardRefresh` 径调用前置门复位（帧外直呼 = 独立一次重挂）", () => {
  const app = read(D_APP)
  assert.match(app, /onCardRefresh: \(\) => \{ cardsDrawn = false; paintChat\(\) \}/, "门前置复位 + 直呼 `paintChat`（保原行为）")
})

test("M12c · 帧分派契约锁（每面每帧至多一次 ∥ 五面表序）+ 结算径「卡面先于结算」次序零变", async () => {
  const { dispatchFrame, FRAME_FACES } = await import("../../thincoder-desktop/renderer/frame-dispatch.mjs")
  const hit = []
  const faces = Object.fromEntries(FRAME_FACES.map(([name]) => [name, () => hit.push(name)]))
  const painted = dispatchFrame({ dirtyKeys: ["blocks", "locale"], state: {}, faces })
  assert.equal(hit.filter((name) => name === "chat").length, 1, "对话流面每帧至多一次")
  assert.equal(hit.filter((name) => name === "cards").length, 1, "卡面每帧至多一次（门语义面）")
  assert.deepEqual(painted, ["sessionBar", "status", "chat", "pool", "cards"], "五面表序零变")
  const app = read(D_APP)
  const paintAt = app.indexOf("paintCardsOnce(state) // 先于结算")
  const settleAt = app.indexOf("mounted = settleFrame(")
  assert.ok(paintAt > 0, "结算径锚在场（唯一符号面 —— `先于结算` 注）")
  assert.ok(settleAt > paintAt, "结算径：卡面先于结算（次序保留）")
})

test("M7-④自证 · `app.mjs` 面零残留（M7 ④ 收口 —— A 段 M7a 腿排除面）", () => {
  const app = read(D_APP)
  const hits = ["projectInfo", "refreshInfo", "createInfoFace", "mount-info"].filter((token) => app.includes(token))
  assert.deepEqual(hits, [], `零残留（实 = ${hits.join(" ∕ ")}）`)
  assert.equal(app.includes("settingsFace.refreshInfo"), false, "`openDir` 链复读步退场（点开即续径完整）")
})

test("M22-D · 注面：两档三处 四清 ⇒ 五清（源面零残留）", () => {
  const pageRead = read(D_PAGE_READ)
  const rows = read(D_ROWS)
  assert.equal((pageRead.match(/四清/g) ?? []).length, 0, "page-read：「四清」零命中")
  assert.equal((pageRead.match(/运行期痕\*{0,2}五清\*{0,2}之四/g) ?? []).length, 1, "page-read：五清句在位（:25 收正；排版标记不绑）")
  assert.equal((rows.match(/四清/g) ?? []).length, 0, "chat-digest-rows：「四清」零命中（两处）")
  assert.equal((rows.match(/五清之四/g) ?? []).length, 2, "chat-digest-rows：两处五清句在位（档头 ∥ `clearDigest` 函数注）")
})

// ═════════════════════════════════════════════════════════════════════════════
// ── 派 E 段（VSC 面 · M1 跨端定形〔D9 = 端壳受理径移除〕—— 端壳作答径摘卡 · 零回归）────
//   M1-VSCa 选项径：① 点选项 ⇒ 上行 `questionResponse{answer,promptId}` 恰一 ∥
//           ② 卡离容器（端壳作答径摘卡 —— 核零摘除）∥ ③ `#input` 回焦。
//   M1-VSCb 取消径（`answer:null`）：④ 同 ①②③（三径同路 —— 核 `answer()` 单门 ⇒ `deps.onAnswered`）。
//   M1-VSCb2 提交径（补强腿 —— 设计腿集〔①–④〕外）：自由文本 + 提交 ⇒ 同 ①②③（同一门）。
//   M1-VSCc 源面锁：`onAnswered` 摘卡 + 回焦 ∥ 注面零残留 ∥ 三既有径零触（`questionCancelled` ∥
//           中止扫卡 ∥ `clearMessages` —— D19 面零差）。
//   桩法 = 先例 `2026-09-29-residuals-round2-vsc.test.mjs:94`（`acquireVsCodeApi` 桩）+ mini 假 DOM；
//   直取真 `thincoder-vscode/webview/question.js` + 真核卡（`node_modules/@thincoder/render-core` 软链直通）。
//   E = 末段：全局桩（`acquireVsCodeApi` ∥ mini 假 DOM 三件）随段装面 —— 不入还原面（本档约定单档多段 ·
//   串行落段；后添段须自装自面）。
// ═════════════════════════════════════════════════════════════════════════════

const eFrames = [] // webview → host 上行捕获（桩闭包写入；`eInstall` 复位）
let eDoc = null
const eCamel = (name) => name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
globalThis.acquireVsCodeApi = () => ({ postMessage: (m) => eFrames.push(m), getState: () => ({}), setState() {} })

class EText { constructor(value) { this.textContent = String(value) } }
class ENode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase()
    this.attrs = {}
    this.dataset = {}
    this.children = []
    this.parentNode = null
    this.listeners = []
    this._classes = new Set()
    this.textContent = ""
    this.innerHTML = ""
    this.placeholder = ""
    this.type = ""
  }
  set className(value) { this._classes = new Set(String(value).split(/\s+/).filter(Boolean)) }
  get className() { return [...this._classes].join(" ") }
  setAttribute(name, value) { this.attrs[name] = String(value); if (name.startsWith("data-")) this.dataset[eCamel(name.slice(5))] = String(value) }
  getAttribute(name) { return Object.hasOwn(this.attrs, name) ? this.attrs[name] : null }
  addEventListener(type, fn) { this.listeners.push({ type, fn }) }
  appendChild(node) { const child = node instanceof ENode || node instanceof EText ? node : new EText(node); child.parentNode = this; this.children.push(child); return child }
  remove() { if (this.parentNode === null) return; const at = this.parentNode.children.indexOf(this); if (at >= 0) this.parentNode.children.splice(at, 1); this.parentNode = null }
  focus() { eDoc.activeElement = this }
  scrollIntoView() {}
  querySelector(sel) { let hit = null; this.walk((node) => { if (hit === null && eMatch(node, sel)) hit = node }); return hit }
  querySelectorAll(sel) { const out = []; this.walk((node) => { if (eMatch(node, sel)) out.push(node) }); return out }
  walk(fn) { for (const child of this.children) { if (child instanceof ENode) { fn(child); child.walk(fn) } } }
}
function eMatch(node, sel) {
  const walk = String(sel).trim()
  if (walk.startsWith(".")) return node._classes.has(walk.slice(1))
  if (/^[a-zA-Z][\w-]*$/.test(walk)) return node.tagName === walk.toUpperCase()
  const m = /^\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(walk)
  if (m === null) return false
  const value = m[1].startsWith("data-") ? node.dataset[eCamel(m[1].slice(5))] : node.attrs[m[1]]
  return value !== undefined && (m[2] === undefined || String(value) === m[2])
}
const eFire = (el, type) => {
  const event = { type, target: el, currentTarget: el, preventDefault() {}, stopPropagation() {} }
  for (const entry of [...el.listeners]) if (entry.type === type) entry.fn(event)
  return event
}
function eInstall() {
  eFrames.length = 0
  eDoc = {
    activeElement: null,
    byId: new Map(),
    createElement: (tag) => new ENode(tag),
    createTextNode: (value) => new EText(value),
    getElementById(id) { if (!eDoc.byId.has(id)) { const node = new ENode("div"); node.attrs.id = id; eDoc.byId.set(id, node) } return eDoc.byId.get(id) },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
    removeEventListener() {},
  }
  globalThis.document = eDoc
  globalThis.Node = ENode
  globalThis.window = { addEventListener() {}, removeEventListener() {} }
}

/** 装面（真 `showQuestion` 直驱）：返回卡 ∥ 容器 ∥ `#input` 替身 ∥ 回焦计数。 */
async function eShow(payload) {
  eInstall()
  const { showQuestion } = await import("../../thincoder-vscode/webview/question.js")
  const messagesEl = new ENode("div")
  const inputEl = new ENode("input")
  let focuses = 0
  inputEl.focus = () => { focuses += 1 }
  showQuestion({ messagesEl, inputEl }, payload.question, payload.options, payload.promptId)
  return { card: messagesEl.children[0], messagesEl, focuses: () => focuses }
}

test("M1-VSCa · 选项径：① 上行帧恰一 ∥ ② 卡离容器（端壳摘卡）∥ ③ `#input` 回焦", async () => {
  const { card, messagesEl, focuses } = await eShow({ question: "Q?", options: ["opt-a", "opt-b"], promptId: "p1" })
  assert.equal(messagesEl.children.length, 1, "卡已入容器（前置真）")
  const option = card.querySelector(".question-option")
  assert.ok(option !== null, "选项钮在场（前置真）")
  assert.equal(option.textContent, "opt-a", "首选项值（前置真）")
  eFire(option, "click")
  assert.equal(eFrames.length, 1, "① 上行帧恰一")
  assert.deepEqual(eFrames, [{ type: "questionResponse", answer: "opt-a", promptId: "p1" }], "① 帧形 ∥ 值 ∥ id（原样带 promptId）")
  assert.equal(messagesEl.children.length, 0, "② 卡离容器（端壳作答径摘卡）")
  assert.equal(card.parentNode, null, "② 卡节点零父（摘除实发生 —— 非隐藏）")
  assert.equal(focuses(), 1, "③ `#input` 回焦恰一")
})

test("M1-VSCb · 取消径（`answer:null`）：④ 同 ①②③（三径同路）", async () => {
  const { card, messagesEl, focuses } = await eShow({ question: "Q?", options: ["opt-a"], promptId: "p2" })
  const cancel = card.querySelector(".deny")
  assert.ok(cancel !== null, "取消钮在场（前置真）")
  eFire(cancel, "click")
  assert.deepEqual(eFrames, [{ type: "questionResponse", answer: null, promptId: "p2" }], "④① 帧恰一（`answer: null` + promptId）")
  assert.equal(messagesEl.children.length, 0, "④② 卡离容器（同路）")
  assert.equal(card.parentNode, null, "④② 卡节点零父（同路 —— 摘除实发生）")
  assert.equal(focuses(), 1, "④③ `#input` 回焦（同路）")
})

test("M1-VSCb2 · 提交径（补强腿）：自由文本 + 提交 ⇒ 同 ①②③（同一 `answer()` 门）", async () => {
  const { card, messagesEl, focuses } = await eShow({ question: "Q?", options: ["opt-a"], promptId: "p3" })
  const input = card.querySelector(".question-input")
  const submit = card.querySelector(".question-actions").querySelector(".approve")
  assert.ok(input !== null && submit !== null, "输入框 ∥ 提交钮在场（前置真）")
  input.value = "custom-answer"
  eFire(submit, "click")
  assert.deepEqual(eFrames, [{ type: "questionResponse", answer: "custom-answer", promptId: "p3" }], "① 帧恰一（自由文本值 —— 非选项 ∥ 非取消）")
  assert.equal(messagesEl.children.length, 0, "② 卡离容器（同路）")
  assert.equal(card.parentNode, null, "② 卡节点零父（同路）")
  assert.equal(focuses(), 1, "③ `#input` 回焦（同路）")
})

test("M1-VSCc · 源面锁：`onAnswered` 摘卡 + 回焦 ∥ 注面零残留 ∥ 三既有径零触（D19 零回归）", () => {
  const q = read("thincoder-vscode/webview/question.js")
  assert.match(q, /onAnswered: \(\) => \{ el\.remove\(\); ctx\.inputEl\.focus\(\) \},/, "`onAnswered` = 端壳摘卡 + 回焦（三径同路单门）")
  assert.ok(q.includes("作答径摘卡"), "档头留端句收正（「作答径摘卡」在位）")
  assert.equal(q.includes("卡自移除"), false, "「卡自移除」零残留（档头 ∥ 函数注）")
  const cm = read("thincoder-vscode/webview/chat-messages.js")
  const cmFlat = cm.replace(/\/\/\s*/g, "").replace(/\s+/g, "")
  assert.ok(cmFlat.includes("已随作答径端壳移除（`question.js`）"), "`questionCancelled` 注句收正（句义同步 —— 折行归一化后直串）")
  assert.equal(cm.includes("自行移除"), false, "「自行移除」零残留")
  assert.ok(cm.includes('const cards = [...document.querySelectorAll(".question-card")]'), "`questionCancelled` 扫卡判据零变")
  assert.ok(cm.includes('if (m.promptId == null || String(c.dataset.promptId) === String(m.promptId)) c.remove()'), "`questionCancelled` promptId 精确匹配零变")
  assert.ok(cm.includes("ctx.messagesEl.replaceChildren()"), "`clearMessages` 重建径零触")
  const streaming = read("thincoder-vscode/webview/streaming.js")
  assert.ok(streaming.includes('if (aborted) document.querySelectorAll(".question-card").forEach((el) => el.remove())'), "中止扫卡（`streaming.js`）零触")
  const core = read("thincoder-render-core/cards/question.mjs")
  assert.equal((core.match(/deps\.onAnswered\?\.\(/g) ?? []).length, 1, "核侧 `answer()` 单门：`deps.onAnswered` 调用点唯一（三径同路前提 —— 派 B 面，此处跨面复核）")
})
