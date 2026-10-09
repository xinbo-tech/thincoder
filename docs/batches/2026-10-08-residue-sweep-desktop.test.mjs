/**
 * 2026-10-08-residue-sweep-desktop.test.mjs — 批内件（残项清收批 · 2026-10-08 · 台账 #1052）**桌面半**。
 *
 * 腿集（判据源 = `thincoder/docs/desktop/design/SETTINGS.md` §2.19 ∥ 批档 `docs/batches/2026-10-08-residue-sweep.md` §2.5；
 * 腿 ↔ 用例逐条对照在括号）：
 *   D1（先红 · 工具组弹窗径）`openSettingsModal("tools")` + 落 `ready` + keys ⇒ `onKeyEdit("embedding")` ⇒ 卡内填入
 *     `sk-modal-draft` ⇒ `onKeySave` ⇒ 假台收 `settings:tools` 且载荷 = `{ patch: { embedding: { apiKey: "sk-modal-draft" } } }`
 *     ∥ 无 empty key 记错（修前红：槽作用域现读取页槽空件 ⇒ 零调用）。
 *   D2（先红 · 渠道组弹窗径）`openSettingsModal("providers")` + 落带行切片（`p1`）⇒ `onProviderKeyEdit("p1")` ⇒ 卡内填入
 *     ⇒ `onProviderKeySave("p1")` ⇒ 假台收 `provider:setKey` = `{ name: "p1", key: "sk-modal" }`。
 *   D3（回归 · 页槽径）不弹窗 —— 两站仍读页槽输入（原工作径逐字保）。
 *   D4（源面锁）两档槽作用域现读形零残留 ∥ `querySelectorAll` 末位形在案 ∥ 三读点（`keySave` ∥ `saveProviderKey` ∥
 *     `cancelKeyEdit`）逐点断言。
 *   D5（轻）弹窗体取消径 = 切片回静止态（`edit:null` · `keyDraft:null`）+ 零记错。
 *   VSC 半（#1058 会诊行 ✕ 容器委托）住同批姊妹件 `docs/batches/2026-10-08-residue-sweep.test.mjs`。
 *
 * 跑法（自仓库根 thincoder/）：`node --test docs/batches/2026-10-08-residue-sweep-desktop.test.mjs`
 * 纪律：零网络 ∥ 零第三方新增（假 DOM = 本件自携收窄脚手架 —— 沿 M604 件；真接线 `attachSettings` + 假台 `invoke`
 * 记录式）；随批留存 · 不进仓套件（桌面 `test/` 零涉）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
// 两候选根取命中（原位 depth 2 ∥ tmp depth 3 —— 沿 M604 件先例）
const repoRoot = [join(HERE, "..", ".."), join(HERE, "..", "..", "..")].find((d) => existsSync(join(d, "thincoder-desktop")))
const readRepo = (rel) => readFileSync(join(repoRoot, rel), "utf8")
const at = (rel) => pathToFileURL(join(repoRoot, rel)).href
await import(at("thincoder-desktop/test/rc-resolve.mjs")) // `/rc/` 解析钩子（须先于任何渲染档取件注册）

// ─── 假 DOM（值面 ∕ 选择器面 ∕ 焦点面 —— 收窄；沿 M604 件脚手架）────────────────────────────
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
    this.textContent = ""
    this._scrollTop = 0
    this._height = 200
    this._checked = null
    this._value = null
    this._selStart = null
    this._selEnd = null
  }
  get children() { return this.childNodes.filter((node) => node instanceof FakeNode) }
  get firstChild() { return this.childNodes[0] ?? null }
  /** 假滑面（内容驱使 —— 元素数 × 40；写入截断同真 DOM）。 */
  get clientHeight() { return this._height }
  set clientHeight(value) { this._height = value }
  get scrollHeight() { return this._height + 40 * countElements(this) }
  get scrollTop() { return this._scrollTop }
  set scrollTop(value) { this._scrollTop = Math.max(0, Math.min(value, this.scrollHeight - this._height)) }
  getAttribute(name) { return Object.hasOwn(this.attrs, name) ? this.attrs[name] : null }
  getAttributeNames() { return Object.keys(this.attrs) }
  setAttribute(name, value) { this.attrs[name] = String(value) }
  removeAttribute(name) { delete this.attrs[name] }
  get className() { return this.attrs.class ?? "" }
  set className(value) { this.attrs.class = String(value) }
  get classList() {
    const read = () => (this.attrs.class ?? "").split(/\s+/).filter(Boolean)
    const self = this
    return {
      add: (...cs) => { self.attrs.class = [...new Set([...read(), ...cs])].join(" ") },
      remove: (...cs) => { self.attrs.class = read().filter((c) => !cs.includes(c)).join(" ") },
      contains: (c) => read().includes(c),
    }
  }
  get type() { return this.getAttribute("type") ?? (this.tagName === "INPUT" ? "text" : "") }
  get value() {
    if (this.tagName === "SELECT") {
      const options = this.querySelectorAll("option")
      const hit = options.find((option) => option.getAttribute("selected") !== null) ?? options[0] ?? null
      return hit === null ? "" : hit.getAttribute("value") ?? ""
    }
    return this._value !== null ? this._value : this.getAttribute("value") ?? ""
  }
  set value(next) {
    const text = String(next)
    if (this.tagName === "SELECT") {
      for (const option of this.querySelectorAll("option")) {
        if ((option.getAttribute("value") ?? "") === text) option.setAttribute("selected", "")
        else option.removeAttribute("selected")
      }
      return
    }
    this._value = text
    this._selStart = null
    this._selEnd = null
  }
  get checked() {
    if (this.tagName !== "INPUT") return undefined
    return this._checked !== null ? this._checked : this.getAttribute("checked") !== null
  }
  set checked(next) { if (this.tagName === "INPUT") this._checked = next === true }
  get selectionStart() {
    if (this.tagName !== "INPUT" && this.tagName !== "TEXTAREA") return undefined
    if (!TEXTUAL.has(this.type)) return null
    return this._selStart !== null ? this._selStart : this.value.length
  }
  get selectionEnd() {
    if (this.tagName !== "INPUT" && this.tagName !== "TEXTAREA") return undefined
    if (!TEXTUAL.has(this.type)) return null
    return this._selEnd !== null ? this._selEnd : this.selectionStart
  }
  setSelectionRange(start, end) { this._selStart = start; this._selEnd = end }
  focus() { if (doc !== null) doc.activeElement = this }
  blur() { if (doc !== null && doc.activeElement === this) doc.activeElement = null }
  addEventListener(type, fn, options) { this.listeners.push({ type, fn, options }) }
  removeEventListener(type, fn) { this.listeners = this.listeners.filter((l) => !(l.type === type && l.fn === fn)) }
  append(...nodes) {
    for (const node of nodes) {
      const child = node instanceof FakeNode || node instanceof FakeText ? node : new FakeText(node)
      child.parentNode = this
      this.childNodes.push(child)
    }
  }
  replaceChildren() {
    for (const child of this.childNodes) child.parentNode = null
    this.childNodes = []
  }
  remove() {
    if (this.parentNode === null) return
    const atIndex = this.parentNode.childNodes.indexOf(this)
    if (atIndex >= 0) this.parentNode.childNodes.splice(atIndex, 1)
    this.parentNode = null
  }
  replaceWith(next) { // 弹窗刷新换卡（`settings-modal.mjs` 宿主）
    const parent = this.parentNode
    if (parent === null) return
    const atIndex = parent.childNodes.indexOf(this)
    const child = next instanceof FakeNode || next instanceof FakeText ? next : new FakeText(next)
    child.parentNode = parent
    if (atIndex >= 0) parent.childNodes.splice(atIndex, 1, child)
    this.parentNode = null
  }
  walk(fn) { for (const child of this.children) { fn(child); child.walk(fn) } }
  querySelector(sel) { let hit = null; this.walk((node) => { if (hit === null && select(node, sel)) hit = node }); return hit }
  querySelectorAll(sel) { const out = []; this.walk((node) => { if (select(node, sel)) out.push(node) }); return out }
  closest(sel) { for (let node = this; node !== null; node = node.parentNode) if (node instanceof FakeNode && select(node, sel)) return node; return null }
  matches(sel) { return select(this, sel) }
}

/** 元素计数（假几何用）。 */
function countElements(node) {
  let n = 0
  node.walk(() => { n += 1 })
  return n
}

/** 单段选择器（类 ∕ 标签 ∥ `[attr]` ∥ `[attr="v"]`）。 */
function matches(node, sel) {
  if (sel.startsWith(".")) return node.classList.contains(sel.slice(1))
  if (/^[a-zA-Z][\w-]*$/.test(sel)) return node.tagName === sel.toUpperCase()
  const m = /^\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(sel)
  if (m === null) return false
  const value = node.getAttribute(m[1])
  if (value === null) return false
  return m[2] === undefined || value === m[2]
}

/** 选择器（含后代组合：`a b` = b 件且祖先链上有 a 件 —— 逐段 `matches`）。 */
function select(node, sel) {
  const parts = String(sel).trim().split(/\s+/)
  if (parts.length === 0) return false
  if (!matches(node, parts[parts.length - 1])) return false
  let at = parts.length - 2
  for (let p = node.parentNode; p !== null && at >= 0; p = p.parentNode) {
    if (p instanceof FakeNode && matches(p, parts[at])) at -= 1
  }
  return at < 0
}

let doc = null
let prevDoc = null
let prevNode = null
let prevError = null
let calls = []
let errors = []

/** 假文档装填（槽 = body 首子件；组弹窗卡挂 body 尾 ⇒ 文档序在槽后 = 交互面；假台调用记录）。 */
function installFakeDom() {
  prevDoc = globalThis.document
  prevNode = globalThis.Node
  prevError = console.error
  calls = []
  errors = []
  const body = new FakeNode("body")
  const slot = new FakeNode("div")
  slot.setAttribute("data-slot", "settings")
  body.append(slot)
  doc = {
    slot,
    activeElement: null,
    body,
    listeners: [],
    createElement: (tag) => new FakeNode(tag),
    createTextNode: (value) => new FakeText(value),
    addEventListener: (type, fn) => { doc.listeners.push({ type, fn }) },
    removeEventListener: () => {},
    querySelector: (sel) => doc.querySelectorAll(sel)[0] ?? null,
    querySelectorAll: (sel) => {
      const out = []
      const visit = (node) => {
        if (select(node, sel)) out.push(node)
        for (const child of node.childNodes) if (child instanceof FakeNode) visit(child)
      }
      visit(body)
      return out
    },
  }
  console.error = (...args) => { errors.push(args.map(String).join(" ")); prevError(...args) }
  globalThis.document = doc
  globalThis.Node = FakeNode
  globalThis.window = {}
}

function restoreDom() {
  globalThis.document = prevDoc
  globalThis.Node = prevNode
  console.error = prevError
  doc = null
}

/** 控件取件（不在场即断言失败 —— 树面缺件零静默）。 */
function control(scope, sel) {
  const el = scope === null || scope === undefined ? null : scope.querySelector(sel)
  assert.ok(el !== null, `控件在场：${sel}`)
  return el
}

/** 假台（记录式 —— `invoke` 记录调用、永不落地：读链停 loading 前段，重绘全由本件显式切片写驱动）。 */
const host = { invoke: (channel, payload) => { calls.push({ channel, payload }); return new Promise(() => {}) } }

/** 装面：真接线 `attachSettings` + 种入切片；返回 `{ store, patchSettings, face, modalNode }`。 */
async function mountFace(seed) {
  const { attachSettings } = await import(at("thincoder-desktop/renderer/mount-settings.mjs"))
  const { createStore, patchSettings } = await import(at("thincoder-desktop/renderer/store.mjs"))
  const { settingsModalNode } = await import(at("thincoder-desktop/renderer/settings-modal.mjs"))
  const store = createStore()
  const face = attachSettings(host, { store })
  store.set(patchSettings(store.get(), seed))
  return { store, patchSettings, face, modalNode: settingsModalNode }
}

/** 设置树种子（页槽开态 + 工具两键 + 渠道行 `p1`）。 */
const DESK_SEED = {
  open: true,
  configured: true,
  notice: null,
  modal: null,
  providers: { state: "ready", presets: [], providers: [{ name: "p1", hasKey: true, maskedKey: "sk-****" }], edit: null, probe: null, draft: null, keyDraft: null },
  verify: null,
  mcp: { state: "ready", servers: [], details: {}, form: null },
  env: { state: "ready", proxy: { uri: "", web: true, model: false }, shell: { current: null, candidates: [] }, test: null },
  tools: { state: "ready", status: null, building: false, keys: { embedding: { hasKey: true }, websearch: { hasKey: false } }, edit: null },
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// D 腿（桌面 —— 真接线 ∥ 假 DOM ∥ 假台）
// ═══════════════════════════════════════════════════════════════════════════════════════

test("D1 工具组弹窗径：卡内改钥 ⇒ keySave 取卡内现值（先红：零调用）", async () => {
  installFakeDom()
  try {
    const { store, patchSettings, face, modalNode } = await mountFace(DESK_SEED)
    face.openSettingsModal("tools")
    const held = store.get().settings.tools
    store.set(patchSettings(store.get(), { tools: { ...held, state: "ready", keys: { embedding: { hasKey: true }, websearch: { hasKey: false } } } }))
    face.handlers.onKeyEdit("embedding")
    const input = control(modalNode(), '[data-key-input="embedding"]')
    input.value = "sk-modal-draft"
    calls.length = 0
    face.handlers.onKeySave("embedding")
    const writes = calls.filter((c) => c.channel === "settings:tools" && c.payload?.patch?.embedding !== undefined)
    assert.equal(writes.length, 1, "恰一发 settings:tools 写")
    assert.deepEqual(writes[0].payload, { patch: { embedding: { apiKey: "sk-modal-draft" } } }, "载荷 = 卡内现值")
    assert.equal(errors.some((e) => e.includes("empty key")), false, "无 empty key 记错")
  } finally {
    restoreDom()
  }
})

test("D2 渠道组弹窗径：卡内改钥 ⇒ saveProviderKey 取卡内现值（先红：零调用）", async () => {
  installFakeDom()
  try {
    const { store, patchSettings, face, modalNode } = await mountFace(DESK_SEED)
    face.openSettingsModal("providers")
    const held = store.get().settings.providers
    store.set(patchSettings(store.get(), { providers: { ...held, state: "ready", providers: [{ name: "p1", hasKey: true }], edit: null, probe: null, draft: null, keyDraft: null } }))
    face.handlers.onProviderKeyEdit("p1")
    const input = control(modalNode(), "[data-provider-key-input]")
    input.value = "sk-modal"
    calls.length = 0
    face.handlers.onProviderKeySave("p1")
    const writes = calls.filter((c) => c.channel === "provider:setKey")
    assert.equal(writes.length, 1, "恰一发 provider:setKey")
    assert.deepEqual(writes[0].payload, { name: "p1", key: "sk-modal" }, "载荷 = 卡内现值")
  } finally {
    restoreDom()
  }
})

test("D3 页槽径回归：不弹窗 —— 两站仍读页槽输入（原工作径逐字保）", async () => {
  installFakeDom()
  try {
    const { store, patchSettings, face } = await mountFace(DESK_SEED)
    const toolsHeld = store.get().settings.tools
    store.set(patchSettings(store.get(), { tools: { ...toolsHeld, state: "ready", edit: "embedding" } }))
    const toolsInput = control(doc.slot, '[data-key-input="embedding"]')
    toolsInput.value = "sk-slot-draft"
    calls.length = 0
    face.handlers.onKeySave("embedding")
    assert.deepEqual(
      calls.find((c) => c.channel === "settings:tools"),
      { channel: "settings:tools", payload: { patch: { embedding: { apiKey: "sk-slot-draft" } } } },
      "页槽径：工具钥写（现值 = 页槽输入）",
    )
    const providersHeld = store.get().settings.providers
    store.set(patchSettings(store.get(), { providers: { ...providersHeld, state: "ready", providers: [{ name: "p1", hasKey: true }], edit: "p1" } }))
    const keyInput = control(doc.slot, "[data-provider-key-input]")
    keyInput.value = "sk-slot"
    calls.length = 0
    face.handlers.onProviderKeySave("p1")
    assert.deepEqual(
      calls.find((c) => c.channel === "provider:setKey"),
      { channel: "provider:setKey", payload: { name: "p1", key: "sk-slot" } },
      "页槽径：渠道钥写（现值 = 页槽输入）",
    )
  } finally {
    restoreDom()
  }
})

test("D4 源面锁：两档槽作用域现读形零残留 ∥ 末位形在案 ∥ 三读点逐点断言", () => {
  const segments = readRepo("thincoder-desktop/renderer/mount-settings-segments.mjs")
  const providers = readRepo("thincoder-desktop/renderer/mount-settings-segments-providers.mjs")
  // ① 负向：槽作用域现读形零残留（两档零 `${slot}`）
  assert.equal(/\$\{slot\}/.test(segments), false, "mount-settings-segments：槽作用域残留零")
  assert.equal(/\$\{slot\}/.test(providers), false, "mount-settings-segments-providers：槽作用域残留零")
  // ② 正向：全文档现读式 + 末位取件形在案（逐读点函数体切片）
  const LAST = /\w+\.length > 0 \? \w+\[\w+\.length - 1\] : null/
  const bodyOf = (src, head) => {
    const from = src.indexOf(head)
    assert.ok(from >= 0, `读点在档：${head}`)
    const end = src.indexOf("\n  }", from)
    assert.ok(end > from, `读点函数体可截：${head}`)
    return src.slice(from, end)
  }
  const keySave = bodyOf(segments, "async function keySave(kind)")
  assert.match(keySave, /document\?\.querySelectorAll === "function" \? document\.querySelectorAll\(`\[data-key-input="\$\{kind\}"\]`\) : \[\]/, "keySave：全文档现读（守卫式）")
  assert.match(keySave, LAST, "keySave：取末位（文档序末件）")
  assert.equal(/querySelector\(`\$\{slot\}/.test(keySave), false, "keySave：槽作用域现读零残留")
  for (const [name, head] of [["saveProviderKey", "async function saveProviderKey(name)"], ["cancelKeyEdit", "const cancelKeyEdit = ()"]]) {
    const body = bodyOf(providers, head)
    assert.match(body, /document\?\.querySelectorAll === "function" \? document\.querySelectorAll\("\[data-provider-key-input\]"\) : \[\]/, `${name}：全文档现读（守卫式）`)
    assert.match(body, LAST, `${name}：取末位（文档序末件）`)
    assert.equal(/querySelector\(`\$\{slot\}/.test(body), false, `${name}：槽作用域现读零残留`)
  }
})

test("D5 弹窗体取消径：取消 = 切片回静止态 + 零记错", async () => {
  installFakeDom()
  try {
    const { store, patchSettings, face, modalNode } = await mountFace(DESK_SEED)
    face.openSettingsModal("providers")
    const held = store.get().settings.providers
    store.set(patchSettings(store.get(), { providers: { ...held, state: "ready", providers: [{ name: "p1", hasKey: true }], edit: "p1" } }))
    assert.ok(modalNode().querySelector("[data-provider-key-input]") !== null, "卡内输入在场（前置真）")
    face.handlers.onProviderKeyCancel()
    assert.equal(store.get().settings.providers.edit, null, "回静止态（edit 清）")
    assert.equal(store.get().settings.providers.keyDraft, null, "回静止态（keyDraft 清）")
    assert.equal(errors.filter((e) => e.includes("invalidateDrafts")).length, 0, "零记错（草稿失效声明不缺作用域）")
  } finally {
    restoreDom()
  }
})
