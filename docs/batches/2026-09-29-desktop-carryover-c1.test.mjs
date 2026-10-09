/**
 * 2026-09-29-desktop-carryover-c1.test.mjs — 批次本地机检件 · 实施舱 1（desktop-carryover · #659 + #652）。
 * 覆盖 = 批档 §2.6（#659 形内让行）∥ §2.4（#652 成功径草稿失效 + 扩标记面）判据：
 *   T-659a 平测两向（spy `onToggle`，描述符面）：形内 target（改名形）键入 `" "` ∕ `Enter` ⇒ `onToggle`
 *          零调用 ∥ `preventDefault` 零调用（让行 = 可键入）；selector 自身 target `Enter` ∕ `" "` ⇒
 *          `preventDefault` + toggle 照常（零回归）。
 *   T-659b 假 DOM 真结构腿（`mountSessionBar` 实径 · 冒泡同径 `fire`）：开形 ⇒ 形内键入空格默认不拦
 *          （可键入 ∕ 值含空格）∧ 形仍在场；形内 `Enter` ⇒ 形仍在场；selector 自身 `Enter` ⇒ 开合翻转。
 *   M-652a 成功径 ⇒ 件取模型面新值（口令件分腿：**清空** = 渠表单 key 件 ∕ **收形** = 钥行编辑态收）+
 *          对照组零误伤（预设形草稿存续 —— 提交一击只废本形草稿）。
 *   M-652b 失败径 ⇒ 草稿保真（负向：渠表单提交失败 ∕ 钥行存失败 —— 零声明零过滤）。
 *   M-652c 后台读数径 ⇒ 不误伤（非 providers 背景读落地：渠表单 ∕ 钥行两草稿皆存续）。
 *   M-652d 钥行携标记（`data-draft` + `data-draft-scope`）+ 背景重挂 ⇒ 键入 ∕ 焦点 ∕ 光标区间保真。
 *   M-652e 源面扫描：失效集落点 ∕ `dropDrafts` 纯函数 ∕ 标记面（表单独携 ∕ 钥行件自携）在位。
 * 跑法（自仓库根）：`node --test .thincoder/tmp/2026-09-29-desktop-carryover-c1.test.mjs`
 * （两层深 ⇒ 与终位 `docs/batches/` 同深；暂存位 = 写门拒 `docs/batches` 直落 —— 父侧收口转正，披露见批档 §5）。
 * **2026-10-09 清除批随正（本批面两处）**：表单 `model` 件随渠道单值模型退场 ⇒ 清空腿删该件键入 ∕ 回填两行。
 * **余红分类（存量——非本批；父侧已记账在办。实跑 = 2 绿 ∕ 7 红；M-652d 偶发进程 OOM 崩——崩时 d ∥ e 例不达）**：① 清空 ∥ M-652b ∥ M-652c「两形在场」＝ 10-07 弹窗批（两形常显表单
 *   退场 ⇒ 表单只在 `settingsModalTree` 弹窗、挂 `document.body`；本测试台假 DOM 无 body/modal 宿主）；
 *   ② 收形 ∥ 取消两例「编辑态件」＝ 10-07 宿主无关读（源 = `document.querySelectorAll("[data-provider-key-input]")`；
 *   本测试台 `querySelectorAll: () => []`）；③ M-652d ∥ M-652e **不达**：d 例令进程 OOM 崩（假 DOM × 现盘渲染链存量——
 *   原档复跑同崩；渲染链零点本批核件）· e 例另含 10-07 单骨漂移锁（`add:custom` ∥ `add:preset` ⇒ 现盘 `add:provider`）。全量重基（改写四用例为弹窗面 + 假 DOM 补 body/modal 宿主 +
 *   形状切换流）超随正射程——归 10-07 弹窗批存量处置。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何渲染档取件注册 —— 沿 M-604 ∕ M-606 件先例）

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const readRepo = (rel) => readFileSync(join(repoRoot, rel), "utf8")
const RENDERER = "thincoder-desktop/renderer"

// ─── 假 DOM（值面 ∕ 选择器面 ∕ 焦点面 ∕ 结构面 —— 收窄至本批所需；沿 M-604 ∕ M-606 件先例）──────────────

const TEXTUAL = new Set(["text", "password", "search", "url", "tel", "email"])

class FakeText {
  constructor(value) { this.textContent = String(value) }
  toString() { return this.textContent }
}

class FakeNode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase()
    this.attrs = {}
    this.childNodes = []
    this.parentNode = null
    this.ownerDocument = doc
    this.listeners = []
    this._scrollTop = 0
    this._height = 200
    this._checked = null
    this._value = null
    this._selStart = null
    this._selEnd = null
  }
  get children() { return this.childNodes.filter((node) => node instanceof FakeNode) }
  get firstChild() { return this.childNodes[0] ?? null }
  get nextSibling() {
    if (this.parentNode === null) return null
    const at = this.parentNode.childNodes.indexOf(this)
    return at < 0 ? null : this.parentNode.childNodes[at + 1] ?? null
  }
  get textContent() { return this.childNodes.map((child) => child.textContent).join("") }
  set textContent(value) {
    this.replaceChildren()
    if (String(value ?? "") !== "") this.append(new FakeText(value))
  }
  get clientHeight() { return this._height }
  set clientHeight(value) { this._height = value }
  get scrollHeight() { return this._height + 40 * countElements(this) }
  get scrollTop() { return this._scrollTop }
  set scrollTop(value) { this._scrollTop = Math.max(0, Math.min(value, Math.max(0, this.scrollHeight - this._height))) }
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
      toggle: (c, force) => {
        const want = force === undefined ? !read().includes(c) : force === true
        if (want) self.classList.add(c)
        else self.classList.remove(c)
      },
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
  set selectionStart(value) { this._selStart = value }
  get selectionEnd() {
    if (this.tagName !== "INPUT" && this.tagName !== "TEXTAREA") return undefined
    if (!TEXTUAL.has(this.type)) return null
    return this._selEnd !== null ? this._selEnd : this.selectionStart
  }
  set selectionEnd(value) { this._selEnd = value }
  setSelectionRange(start, end) { this._selStart = start; this._selEnd = end }
  focus() { if (doc !== null) doc.activeElement = this }
  blur() { if (doc !== null && doc.activeElement === this) doc.activeElement = null }
  addEventListener(type, fn) { this.listeners.push({ type, fn }) }
  removeEventListener(type, fn) { this.listeners = this.listeners.filter((l) => !(l.type === type && l.fn === fn)) }
  append(...nodes) {
    for (const node of nodes) {
      const child = node instanceof FakeNode || node instanceof FakeText ? node : new FakeText(node)
      child.parentNode = this
      this.childNodes.push(child)
    }
  }
  prepend(...nodes) {
    for (const node of [...nodes].reverse()) this.insertBefore(node instanceof FakeNode || node instanceof FakeText ? node : new FakeText(node), this.childNodes[0] ?? null)
  }
  insertBefore(node, ref) {
    const child = node instanceof FakeNode || node instanceof FakeText ? node : new FakeText(node)
    if (child.parentNode !== null) {
      const at = child.parentNode.childNodes.indexOf(child)
      if (at >= 0) child.parentNode.childNodes.splice(at, 1)
    }
    child.parentNode = this
    const index = ref === null || ref === undefined ? -1 : this.childNodes.indexOf(ref)
    if (index < 0) this.childNodes.push(child)
    else this.childNodes.splice(index, 0, child)
    return child
  }
  replaceWith(next) {
    if (this.parentNode === null) return
    this.parentNode.insertBefore(next, this)
    this.remove()
  }
  remove() {
    if (this.parentNode === null) return
    const at = this.parentNode.childNodes.indexOf(this)
    if (at >= 0) this.parentNode.childNodes.splice(at, 1)
    this.parentNode = null
  }
  replaceChildren(...nodes) {
    for (const child of this.childNodes) child.parentNode = null
    this.childNodes = []
    this.append(...nodes)
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

/** 单段选择器（类 ∕ 标签 ∕ `[attr]` ∕ `[attr="v"]`）。 */
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

/** 假 `FormData`（渠表单提交径 —— `submitChannel` 读 `data.get`；复选未勾 ⇒ 缺项 ⇒ `get` 回 null）。 */
class FakeFormData {
  constructor(form) {
    this._entries = []
    for (const node of fieldNodes(form)) {
      const name = node.getAttribute("name")
      if (name === null || name === "") continue
      const kind = (node.getAttribute("type") ?? "").toLowerCase()
      if (kind === "checkbox" || kind === "radio") {
        if (node.checked === true) this._entries.push([name, node.value === "" ? "on" : node.value])
        continue
      }
      this._entries.push([name, node.value])
    }
  }
  get(name) {
    const hit = this._entries.find(([key]) => key === name)
    return hit === undefined ? null : hit[1]
  }
}

/** 表单件收集（input ∕ select ∕ textarea —— 文档序）。 */
function fieldNodes(form) {
  const out = []
  form.walk((node) => {
    if (node.tagName === "INPUT" || node.tagName === "SELECT" || node.tagName === "TEXTAREA") out.push(node)
  })
  return out
}

let doc = null
let prevDoc = null
let prevNode = null
let prevFormData = null

/** 假文档装填（设置槽查询 = `[data-slot="settings"]`；活动件 = `focus()` 落点；`createElement` 供 `dom.mjs`）。 */
function installFakeDom() {
  prevDoc = globalThis.document
  prevNode = globalThis.Node
  prevFormData = globalThis.FormData
  doc = {
    slot: null,
    activeElement: null,
    listeners: [],
    createElement: (tag) => new FakeNode(tag),
    createTextNode: (value) => new FakeText(value),
    addEventListener: (type, fn) => { doc.listeners.push({ type, fn }) },
    removeEventListener: () => {},
    querySelector: (sel) => {
      if (sel === '[data-slot="settings"]') return doc.slot
      if (doc.slot !== null && String(sel).startsWith('[data-slot="settings"] ')) {
        return doc.slot.querySelector(String(sel).slice('[data-slot="settings"] '.length))
      }
      return null
    },
    querySelectorAll: () => [],
  }
  globalThis.document = doc
  globalThis.Node = FakeNode
  globalThis.FormData = FakeFormData
  globalThis.window = {}
}

function restoreDom() {
  globalThis.document = prevDoc
  globalThis.Node = prevNode
  globalThis.FormData = prevFormData
  doc = null
}

/** 事件派发（真 DOM 冒泡同径：自目标沿 `parentNode` 上溯；`stopPropagation` ∕ `preventDefault` 真桩）。 */
function fire(node, type, extra = {}) {
  assert.ok(node !== null && node !== undefined, `fire 目标在场：${type}`)
  let stopped = false
  let prevented = false
  const event = {
    target: node, currentTarget: null,
    stopPropagation: () => { stopped = true },
    preventDefault: () => { prevented = true },
    get defaultPrevented() { return prevented },
    ...extra,
  }
  for (let at = node; at !== null && at !== undefined && stopped !== true; at = at.parentNode) {
    event.currentTarget = at
    for (const listener of [...(at.listeners ?? [])]) {
      if (listener.type !== type) continue
      listener.fn(event)
      if (stopped === true) break
    }
  }
  return event
}

/** 一拍静置（异步链跑完 —— 零计时依赖，`setImmediate` 排空微任务）。 */
const settle = async (rounds = 4) => {
  for (let i = 0; i < rounds; i += 1) await new Promise((resolve) => setImmediate(resolve))
}

// ─── 设置面装面（真接线 `attachSettings` · 窄桥回执表可注入）──────────────────────────────

/** 缺省回执表（`provider:list` 由种子派生 —— 与种子一致，免初始读数覆盖种入行）。 */
const defaultReceipts = (seed) => ({
  "provider:list": { ok: true, presets: seed.providers?.presets ?? [], providers: seed.providers?.providers ?? [], active: null },
  "settings:agent": { ok: true, fields: [], models: null },
  "mcp:list": { ok: true, servers: [] },
  "settings:env": { ok: true, proxy: { uri: "", web: true, model: false }, shell: { current: null, candidates: [] } },
  "settings:tools": { ok: true },
  "index:status": { ok: true, status: { built: true, files: 1, chunks: 1 } },
  "index:build": { ok: true },
  "ledger:read": { ok: true, counts: null, thresholdReached: null },
  "batch:status": { ok: true, phase: null },
})

/** 装面：真接线 + 种入设置切片；回执 = 缺省表叠 `receipts`（同键覆盖）。 */
async function mountSettingsFace(seed, receipts = {}) {
  const { attachSettings } = await import("../../thincoder-desktop/renderer/mount-settings.mjs")
  const { createStore, patchSettings } = await import("../../thincoder-desktop/renderer/store.mjs")
  const store = createStore()
  const slot = new FakeNode("div")
  slot.setAttribute("data-slot", "settings")
  doc.slot = slot
  const table = { ...defaultReceipts(seed), ...receipts }
  const calls = []
  const host = {
    invoke: async (channel, payload) => {
      calls.push([channel, payload])
      const entry = table[channel]
      return entry === undefined ? { ok: false, reason: "test-no-receipt" } : entry
    },
  }
  const face = attachSettings(host, { store })
  store.set(patchSettings(store.get(), seed))
  await settle()
  return { store, slot, face, calls }
}

/** 设置种子（七段齐备；providers 一行 + 两预设 —— 钥行 ∕ 渠表单两面俱在）。 */
const SETTINGS_SEED = {
  open: true,
  configured: true,
  notice: null,
  providers: {
    state: "ready",
    presets: [{ name: "preset-a" }, { name: "preset-b" }],
    providers: [{ name: "alpha", hasKey: true, maskedKey: "sk-…", baseURL: "", model: "m1", active: false, proxy: false, available: true }],
    edit: null, probe: null, draft: null, keyDraft: null,
  },
  verify: null,
  model: { state: "none", provider: null, current: null, models: [] },
  agent: { state: "none", fields: [] },
  mcp: { state: "ready", servers: [], details: {}, form: null },
  env: { state: "ready", proxy: { uri: "", web: true, model: false }, shell: { current: null, candidates: [] }, test: null },
  tools: { state: "ready", status: { built: true, files: 1, chunks: 1 }, building: false, keys: { embedding: { hasKey: false }, websearch: { hasKey: false } }, edit: null },
  models: { state: "none", consult: [], advisor: { provider: null, model: null }, picker: { provider: "", rows: [], model: null }, advisorPicker: { provider: "", rows: [], model: null } },
  wizard: { step: 1, dismissed: false, notice: null },
}

/** 单击（监听直调 —— 冒泡同径由 `fire` 承载）。 */
const click = (el) => fire(el, "click")

/** 渠表单提交按钮（两形各一）。 */
const SUBMIT_OF = { preset: '[data-action="settings:addPreset"]', custom: '[data-action="settings:addCustom"]' }

// ─── #659 形内让行 ────────────────────────────────────────────────────────────

test("T-659a·平测两向（spy onToggle）：形内 target 让行 ∥ selector 自身照常", async () => {
  const { sessionBarTree, sessionModel } = await import("../../thincoder-desktop/renderer/views/session-control.mjs")
  const model = sessionModel({ sessions: [{ slot: "s1", title: "Alpha", isActive: true }], project: { cwd: "C:/w" }, tabBadges: {} })
  let toggles = 0
  const tree = sessionBarTree(model, { onToggle: () => { toggles += 1 } }, { open: true, form: "s1" })
  const selector = tree.children.find((child) => child?.props?.class === "session-selector")
  assert.ok(selector !== undefined, "选择器节点在场")
  const onKeydown = selector.props.onKeydown
  assert.equal(typeof onKeydown, "function", "键位处理器在场")

  // 结构面：形内输入的真实归属（`[data-form="rename"]` 子树 —— 源判锚不虚）
  const dropdown = selector.children.find((child) => child?.props?.class === "session-dropdown")
  const formItem = dropdown.children.find((child) => child?.props?.["data-form"] === "rename")
  assert.ok(formItem !== undefined, "改名形（`data-form=\"rename\"`）在场")
  assert.ok(formItem.children.some((child) => child?.props?.["data-action"] === "session:rename-input"), "形内文本控件在场")

  // 向一：形内 target ⇒ 让行（零 preventDefault ∕ 零 toggle）
  const inForm = { closest: (sel) => (sel === '[data-form="rename"]' ? formItem : null) }
  for (const key of [" ", "Enter"]) {
    let prevented = false
    onKeydown({ key, target: inForm, preventDefault: () => { prevented = true } })
    assert.equal(prevented, false, `形内 "${key}"：零 preventDefault（可键入）`)
  }
  assert.equal(toggles, 0, "形内两键：onToggle 零调用")

  // 向二：selector 自身 target ⇒ 照常（preventDefault + toggle）
  const outside = { closest: () => null }
  for (const key of ["Enter", " "]) {
    let prevented = false
    onKeydown({ key, target: outside, preventDefault: () => { prevented = true } })
    assert.equal(prevented, true, `selector 自身 "${key}"：preventDefault 照常`)
  }
  assert.equal(toggles, 2, "selector 自身两键：toggle 各一次（零回归）")

  // 负向：非开合键零动作
  let prevented = false
  onKeydown({ key: "a", target: outside, preventDefault: () => { prevented = true } })
  assert.equal(prevented, false, "非 Enter ∕ Space 键零动作")
  assert.equal(toggles, 2, "非开合键零 toggle")
})

test("T-659b·假 DOM 真结构：形内空格可键入 ∧ 形内 Enter 不关形 ∧ selector 自身 Enter 翻转", async () => {
  installFakeDom()
  try {
    const { mountSessionBar } = await import("../../thincoder-desktop/renderer/mount-sessions.mjs")
    const { store, initialState } = await import("../../thincoder-desktop/renderer/store.mjs")
    store.set(initialState())
    const slot = new FakeNode("div")
    slot.setAttribute("data-slot", "session-control")
    store.set({ project: { cwd: "C:/proj", recent: [] }, sessions: [{ slot: "s1", title: "Alpha", messageCount: 2, updatedAt: 1700000000000, isActive: true }], activeSession: "s1", tabBadges: {}, ledger: null })
    mountSessionBar(slot, store.get(), { onSwitch: () => {}, onNew: () => {}, onRename: async () => true, onDelete: () => {}, onOpenProject: () => {} })
    const selector = slot.querySelector(".session-selector")
    assert.ok(selector !== null, "选择器在场")
    click(selector) // 开下拉
    click(slot.querySelector('[data-action="session:rename"]')) // 换形（条目原位）

    const input = slot.querySelector('[data-action="session:rename-input"]')
    assert.ok(input !== null, "改名形输入在场")
    assert.ok(input.closest('[data-form="rename"]') !== null, "输入住 `[data-form=\"rename\"]` 子树（源判锚真切）")

    // 形内空格：默认不拦 ⇒ 可键入（模拟浏览器默认动作）+ 形仍在场
    const space = fire(input, "keydown", { key: " " })
    assert.equal(space.defaultPrevented, false, "形内空格：默认不拦（可键入）")
    if (space.defaultPrevented !== true) input.value = `${input.value} `
    assert.equal(input.value.includes(" "), true, "键入落值（含空格）")
    assert.ok(slot.querySelector('[data-action="session:rename-input"]') !== null, "空格后形仍在场")

    // 形内 Enter：不关形（草稿不丢）
    const enter = fire(input, "keydown", { key: "Enter" })
    assert.equal(enter.defaultPrevented, false, "形内 Enter：默认不拦")
    assert.ok(slot.querySelector('[data-action="session:rename-input"]') !== null, "形内 Enter 后形仍在场")
    assert.equal(input.value.includes(" "), true, "形内 Enter 后值存续")

    // selector 自身 Enter：开合翻转（下拉退场 —— 零回归）
    const own = fire(selector, "keydown", { key: "Enter" })
    assert.equal(own.defaultPrevented, true, "selector 自身 Enter：preventDefault 照常")
    assert.equal(selector.getAttribute("aria-expanded"), "false", "开合翻转（aria-expanded 同步）")
    assert.equal(slot.querySelector(".session-dropdown"), null, "下拉退场")
    assert.equal(slot.querySelector('[data-form="rename"]'), null, "形随下拉退场")
  } finally {
    restoreDom()
  }
})

// ─── #652 M-652a（成功径 ⇒ 件取模型面新值 · 口令件分腿）────────────────────────────

test("M-652a·清空腿：渠表单提交成功 ⇒ 本形草稿作废（口令件清空 ∕ 对照组零误伤）", async () => {
  installFakeDom()
  try {
    const { slot, calls } = await mountSettingsFace(SETTINGS_SEED, { "provider:save": { ok: true } })
    const custom = slot.querySelector('[data-form="custom"]')
    const preset = slot.querySelector('[data-form="preset"]')
    assert.ok(custom !== null && preset !== null, "两形表单在场")
    custom.querySelector('[name="name"]').value = "draft-name"
    custom.querySelector('[name="baseURL"]').value = "http://draft.invalid/v1"
    custom.querySelector('[name="format"]').value = "anthropic"
    custom.querySelector('[name="key"]').value = "sk-typed"
    preset.querySelector('[name="key"]').value = "sk-preset-kept"
    preset.querySelector('[name="name"]').value = "preset-b"

    click(slot.querySelector(SUBMIT_OF.custom))
    await settle()
    const save = calls.find(([channel]) => channel === "provider:save")
    assert.equal(save?.[1]?.key, "sk-typed", "提交载荷携键入值（前置态真切）")

    const custom2 = slot.querySelector('[data-form="custom"]')
    assert.ok(custom2 !== null, "提交后自定形仍在场（重建）")
    assert.equal(custom2.querySelector('[name="key"]').value, "", "口令件清空（旧值零留驻 —— 零重提）")
    assert.equal(custom2.querySelector('[name="baseURL"]').value, "", "非口令件同作废（该表单草稿一次性）")
    assert.equal(custom2.querySelector('[name="name"]').value, "", "name 件回模型新值")
    assert.equal(custom2.querySelector('[name="format"]').value, "openai", "format 回模型缺省首项")

    const preset2 = slot.querySelector('[data-form="preset"]')
    assert.equal(preset2.querySelector('[name="key"]').value, "sk-preset-kept", "对照组：预设形草稿存续（提交一击只废本形）")
    assert.equal(preset2.querySelector('[name="name"]').value, "preset-b", "对照组：预设选保存续")
  } finally {
    restoreDom()
  }
})

test("M-652a·收形腿：钥行存成功 ⇒ 编辑态收（输入离场）∧ 再开零留驻", async () => {
  installFakeDom()
  try {
    // mcp 段持 `loading` = 树在途（残件携带窗开启 —— 旧值复活路径可达 ⇒ 本腿判别力）
    const { store, slot } = await mountSettingsFace({ ...SETTINGS_SEED, mcp: { state: "loading", servers: [], details: {}, form: null } }, {
      "provider:setKey": { ok: true },
    })
    click(slot.querySelector('[data-action="settings:providerKeyEdit"]'))
    const input = slot.querySelector("[data-provider-key-input]")
    assert.ok(input !== null, "钥行编辑态在场")
    input.value = "sk-row-typed"

    click(slot.querySelector('[data-action="settings:providerKeySave"]'))
    await settle()
    assert.equal(slot.querySelector("[data-provider-key-input]"), null, "收形：编辑态输入离场")
    assert.equal(store.get().settings.providers.edit ?? null, null, "收形：编辑态归空（模型面 —— 复位写 null；后续读落地取代为缺位）")

    click(slot.querySelector('[data-action="settings:providerKeyEdit"]'))
    const again = slot.querySelector("[data-provider-key-input]")
    assert.ok(again !== null, "再开编辑态")
    assert.equal(again.value, "", "口令件零留驻（在途窗内亦不复活旧值 —— 零重提）")
  } finally {
    restoreDom()
  }
})

test("M-652a·取消腿（弃输入）：取消后复开零留驻（在途窗内亦不复活）", async () => {
  installFakeDom()
  try {
    // mcp 段持 `loading` = 树在途（残件携带窗开启 —— 与收形腿同窗；本腿判别力所在）
    const { slot } = await mountSettingsFace({ ...SETTINGS_SEED, mcp: { state: "loading", servers: [], details: {}, form: null } })
    click(slot.querySelector('[data-action="settings:providerKeyEdit"]'))
    const input = slot.querySelector("[data-provider-key-input]")
    assert.ok(input !== null, "钥行编辑态在场")
    input.value = "sk-row-typed"

    click(slot.querySelector('[data-action="settings:providerKeyCancel"]'))
    await settle()
    assert.equal(slot.querySelector("[data-provider-key-input]"), null, "取消 ⇒ 输入离场（静止态）")

    click(slot.querySelector('[data-action="settings:providerKeyEdit"]'))
    const again = slot.querySelector("[data-provider-key-input]")
    assert.ok(again !== null, "再开编辑态")
    assert.equal(again.value, "", "取消 = 弃输入（在途窗内亦不复活旧值）")
  } finally {
    restoreDom()
  }
})

// ─── #652 M-652b（失败径 ⇒ 草稿保真 · 负向）──────────────────────────────────────

test("M-652b·失败径 ⇒ 草稿保真（负向：渠表单 ∕ 钥行两腿）", async () => {
  installFakeDom()
  try {
    // 腿 1：渠表单提交失败 ⇒ 草稿存续（且后续无关读数落地不再伤 —— 零声明零过滤）
    const { slot, face } = await mountSettingsFace(SETTINGS_SEED, { "provider:save": { ok: false, reason: "invalid-key" } })
    const custom = slot.querySelector('[data-form="custom"]')
    custom.querySelector('[name="key"]').value = "sk-typed"
    custom.querySelector('[name="baseURL"]').value = "http://draft.invalid/v1"
    click(slot.querySelector(SUBMIT_OF.custom))
    await settle()
    assert.ok(slot.querySelector("[data-notice]") !== null, "失败面在场（回执落到面）")
    assert.equal(slot.querySelector('[data-form="custom"] [name="key"]').value, "sk-typed", "失败径：口令件草稿保真")
    assert.equal(slot.querySelector('[data-form="custom"] [name="baseURL"]').value, "http://draft.invalid/v1", "失败径：其余申报件保真")

    face.handlers.onBuildIndex() // 无关读数落地（工具与服务段）—— 草稿不受波及
    await settle()
    assert.equal(slot.querySelector('[data-form="custom"] [name="key"]').value, "sk-typed", "读数落地后：草稿仍保真")

    // 腿 2：钥行存失败 ⇒ 键入值保真（#615② 种子 + 草稿两路；编辑态保持）
    const second = await mountSettingsFace(SETTINGS_SEED, { "provider:setKey": { ok: false, reason: "invalid-key" } })
    click(second.slot.querySelector('[data-action="settings:providerKeyEdit"]'))
    const input = second.slot.querySelector("[data-provider-key-input]")
    input.value = "sk-row-typed"
    click(second.slot.querySelector('[data-action="settings:providerKeySave"]'))
    await settle()
    const held = second.slot.querySelector("[data-provider-key-input]")
    assert.ok(held !== null, "失败径：编辑态保持（输入仍在场）")
    assert.equal(held.value, "sk-row-typed", "失败径：键入值保真（种子 ∕ 草稿两路同值）")
    assert.deepEqual(second.store.get().settings.providers.keyDraft, { name: "alpha", value: "sk-row-typed" }, "#615② 种子落位（失败径语义不动）")
  } finally {
    restoreDom()
  }
})

// ─── #652 M-652c（后台读数径 ⇒ 不误伤）──────────────────────────────────────────

test("M-652c·后台读数径 ⇒ 不误伤（非 providers 背景读落地：两草稿皆存续）", async () => {
  installFakeDom()
  try {
    const { slot, face } = await mountSettingsFace(SETTINGS_SEED)
    slot.querySelector('[data-form="custom"] [name="key"]').value = "sk-kept"
    click(slot.querySelector('[data-action="settings:providerKeyEdit"]'))
    const row = slot.querySelector("[data-provider-key-input]")
    row.value = "sk-row-kept"

    face.handlers.onBuildIndex() // 背景读数径（工具与服务段读落地 —— 零声明）
    await settle()

    assert.equal(slot.querySelector('[data-form="custom"] [name="key"]').value, "sk-kept", "背景读落地：渠表单草稿存续（零误伤）")
    const row2 = slot.querySelector("[data-provider-key-input]")
    assert.ok(row2 !== null, "背景读落地：钥行编辑态存续")
    assert.equal(row2.value, "sk-row-kept", "背景读落地：钥行键入存续")
  } finally {
    restoreDom()
  }
})

// ─── #652 M-652d（钥行携标记 + 背景重挂 ⇒ 键入 ∕ 光标保真）────────────────────────

test("M-652d·钥行携标记 + 背景重挂 ⇒ 键入 ∕ 焦点 ∕ 光标区间保真", async () => {
  installFakeDom()
  try {
    const { slot, face } = await mountSettingsFace(SETTINGS_SEED)
    click(slot.querySelector('[data-action="settings:providerKeyEdit"]'))
    const input = slot.querySelector("[data-provider-key-input]")
    assert.ok(input !== null, "钥行编辑态在场")
    assert.equal(input.getAttribute("data-draft"), "alpha", "标记面：`data-draft` = 行名（无 `id` ⇒ 显式键）")
    assert.equal(input.getAttribute("data-draft-scope"), "key:alpha", "作用域面：`data-draft-scope` = `key:<名>`")

    input.value = "sk-row-typed"
    input.focus()
    input.setSelectionRange(3, 6)

    face.handlers.onBuildIndex() // 背景重挂（非 providers 写：编辑态保持 ⇒ 输入重件 ⇒ 复填）
    await settle()

    const input2 = slot.querySelector("[data-provider-key-input]")
    assert.ok(input2 !== null, "重挂后编辑态仍在场")
    assert.notEqual(input2, input, "重挂 = 新件（旧树摘除 —— 复填非身份存续）")
    assert.equal(input2.value, "sk-row-typed", "键入保真（草稿复填）")
    assert.equal(doc.activeElement, input2, "焦点保真")
    assert.equal(input2.selectionStart, 3, "光标区间起保真")
    assert.equal(input2.selectionEnd, 6, "光标区间止保真")
  } finally {
    restoreDom()
  }
})

// ─── #652 源面扫描（落点在位）───────────────────────────────────────────────────

test("M-652e·源面扫描：失效集 ∕ 过滤纯函数 ∕ 标记面 ∕ 让行源判落点", () => {
  const viewState = readRepo(`${RENDERER}/view-state.mjs`)
  const mount = readRepo(`${RENDERER}/mount-settings.mjs`)
  const exits = readRepo(`${RENDERER}/mount-settings-exits.mjs`)
  const providers = readRepo(`${RENDERER}/mount-settings-segments-providers.mjs`)
  const sections = readRepo(`${RENDERER}/views/settings-sections.mjs`)
  const controls = readRepo(`${RENDERER}/views/settings-controls.mjs`)
  const sessionControl = readRepo(`${RENDERER}/views/session-control.mjs`)

  assert.match(viewState, /export function dropDrafts\(snap, scopes\)/, "#652 过滤纯函数出档在册")
  assert.match(viewState, /!set\.has\(entry\?\.loc\?\.scope \?\? null\)/, "#652 过滤谓词 = 作用域等值（零作用域件不受波及）")
  assert.match(mount, /import \{ captureView, dropDrafts, mergeViewSnaps, restoreView \} from "\.\/view-state\.mjs"/, "#652 闸件导入在档")
  assert.match(mount, /let draftInvalidation = new Set\(\)/, "#652 一次性失效集在场")
  assert.match(mount, /const fresh = dropDrafts\(captureView\(root\), draftInvalidation\)/, "#652 捕获后按集过滤")
  assert.match(mount, /dropDrafts\(mergeViewSnaps\(viewResidue, fresh/, "#652 并合残件同滤")
  assert.match(mount, /draftInvalidation\.clear\(\)/, "#652 集消费即清")
  assert.match(mount, /invalidateDrafts\(scope\)/, "#652 声明缝（注入面）在场")
  assert.match(exits, /invalidateDrafts\?\.\(typeof form\.getAttribute === "function" \? form\.getAttribute\("data-draft-scope"\) : null\)/, "#652 两形提交成功径声明（作用域自表单自携）")
  assert.match(providers, /invalidateDrafts\?\.\(typeof input\.getAttribute === "function" \? input\.getAttribute\("data-draft-scope"\) : null\)/, "#652 钥存成功径声明（作用域自输入件自携）")
  assert.match(providers, /const cancelKeyEdit = \(\) => \{\n\s+const input = typeof document\?\.querySelector/, "#652 取消径同拍声明（弃输入 = 草稿作废）")
  assert.match(sections, /"data-draft": row\.name,/, "#652 钥行补 `[data-draft]` 标记")
  assert.match(sections, /"data-draft-scope": `key:\$\{row\.name\}`/, "#652 钥行作用域面")
  assert.match(controls, /"data-draft-scope": shape === "custom" \? "add:custom" : "add:preset"/, "#652 渠两形表单作用域面")
  assert.match(sessionControl, /event\?\.target\?\.closest\?\.\('\[data-form="rename"\]'\) != null/, "#659 形内判源在档")
})
