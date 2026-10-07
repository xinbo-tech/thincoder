/**
 * 2026-09-29-desktop-rebuild-fidelity-M604.test.mjs — 批次本地机检件 · 波 1（#604 设置 ∕ 向导 · 草稿保真总闸）。
 * 覆盖 = 批档 §2.2 判据（AC-1 机检腿）：
 *   M-604a 保真：假 DOM 两轮重绘（真接线 `attachSettings` ⇒ `paintSettings` 唯一重绘点径）——首轮于
 *          `[data-draft]` 控件填值 + 勾选 ∕ 置焦 + 设光标 ⇒ 次轮（模型有变）重建 ⇒ 断言同键控件值 ∕
 *          `checked` ∕ 焦点 ∕ 光标区间 ∕ 根 `scrollTop` 保真（设置树 + 向导树两径 —— 两树一闸）。
 *   M-604b 负向锁：非 `[data-draft]` 控件（MCP 类型 `select` ∕ `proxy.uri`）⇒ 重建后取新模型值（旧 DOM 值零回写）。
 *   M-604c 捕获域：申报域逐控件携 `[data-draft]`（树面断言 + 源面扫描逐档计数）；写触发控件不在域。
 * 跑法（自仓库根）：`node --test .thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-M604.test.mjs`
 * （两层深 ⇒ 与终位 `docs/batches/` 同深；暂存位披露见批档 §5）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
// tmp 直跑适配（`add-dialog-verify/` 深度 3）：两候选根取命中——原位（depth 2）∥ tmp 两处皆兼容
const repoRoot = [join(HERE, "..", ".."), join(HERE, "..", "..", "..")].find((d) => existsSync(join(d, "thincoder-desktop")))
const readRepo = (rel) => readFileSync(join(repoRoot, rel), "utf8")
const at = (rel) => pathToFileURL(join(repoRoot, rel)).href
const RENDERER = "thincoder-desktop/renderer"
await import(at("thincoder-desktop/test/rc-resolve.mjs")) // `/rc/` 解析钩子（须先于任何渲染档取件注册 —— 沿 M-607 件先例）

// ─── 假 DOM（值面 ∕ 选择器面 ∕ 焦点面 —— 收窄至本批所需；沿 #603 ∕ M-607 件先例）──────────────

const TEXTUAL = new Set(["text", "password", "search", "url", "tel", "email"])
const camelOf = (name) => name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())

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
  /** 假滑面（内容驱使 —— 元素数 × 40；写入截断同真 DOM ⇒ 在途窗截断可测）。 */
  get clientHeight() { return this._height }
  set clientHeight(value) { this._height = value }
  get scrollHeight() { return this._height + 40 * countElements(this) }
  get scrollTop() { return this._scrollTop }
  set scrollTop(value) { this._scrollTop = Math.max(0, Math.min(value, this.scrollHeight - this._height)) }
  getAttribute(name) { return Object.hasOwn(this.attrs, name) ? this.attrs[name] : null }
  getAttributeNames() { return Object.keys(this.attrs) }
  setAttribute(name, value) {
    this.attrs[name] = String(value)
    if (name === "class") this.attrs.class = String(value)
  }
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
    const at = this.parentNode.childNodes.indexOf(this)
    if (at >= 0) this.parentNode.childNodes.splice(at, 1)
    this.parentNode = null
  }
  replaceWith(next) { // 弹窗刷新换卡（`settings-modal.mjs` 宿主 —— KD-77 ① 表单弹窗体径）
    const parent = this.parentNode
    if (parent === null) return
    const at = parent.childNodes.indexOf(this)
    const child = next instanceof FakeNode || next instanceof FakeText ? next : new FakeText(next)
    child.parentNode = parent
    if (at >= 0) parent.childNodes.splice(at, 1, child)
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

let doc = null
let prevDoc = null
let prevNode = null

/** 假文档装填（槽锚查询 = `[data-slot="settings"]`；活动件 = `focus()` 落点）。 */
function installFakeDom() {
  prevDoc = globalThis.document
  prevNode = globalThis.Node
  doc = {
    slot: null,
    activeElement: null,
    body: new FakeNode("body"), // KD-77 ①：两弹窗体（providerAdd ∥ mcpForm）宿主挂点
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
  globalThis.window = {}
}

function restoreDom() {
  globalThis.document = prevDoc
  globalThis.Node = prevNode
  doc = null
}

/** 控件取件（不在场即断言失败 —— 树面缺件零静默）。 */
function control(scope, sel) {
  const el = scope.querySelector(sel)
  assert.ok(el !== null, `控件在场：${sel}`)
  return el
}

/**
 * 装面：真接线 `attachSettings`（窄桥挂起不落地 —— 后台读数零写、零干扰）+ 种入切片。
 * `host.invoke` = 永不落地 Promise ⇒ `loadProviders` 等停在 loading 前段（`providers.state` 置 loading 一次，
 * 无回执、无 report）—— 全部重绘皆由本件的显式切片写驱动（确定性）。
 */
async function mountFace(seed) {
  const { attachSettings } = await import(at("thincoder-desktop/renderer/mount-settings.mjs"))
  const { createStore, patchSettings } = await import(at("thincoder-desktop/renderer/store.mjs"))
  const store = createStore()
  const slot = new FakeNode("div")
  slot.setAttribute("data-slot", "settings")
  doc.slot = slot
  const face = attachSettings({ invoke: () => new Promise(() => {}) }, { store })
  store.set(patchSettings(store.get(), seed))
  return { store, slot, patchSettings, face }
}

/** 设置树种子（七段：providers ready 两形表单 ∕ mcp ready 新增态 stdio ∕ env ready ∕ tools ready 编辑态）。 */
const SETTINGS_SEED = {
  open: true,
  configured: true,
  providers: { state: "ready", presets: [{ name: "preset-a" }, { name: "preset-b" }], providers: [], edit: null, probe: null, draft: null },
  mcp: { state: "ready", servers: [], details: {}, form: { editing: null, type: "stdio" } },
  env: { state: "ready", proxy: { uri: "http://model.invalid/v1", web: true, model: false }, shell: { current: null, candidates: [{ name: "bash", value: "/bin/bash" }] }, test: null },
  tools: { state: "ready", status: { built: true, files: 1, chunks: 2 }, building: false, keys: { embedding: { hasKey: true }, websearch: { hasKey: false } }, edit: "embedding" },
}

/** 向导树种子（`configured === false` ⇒ 向导占槽 —— 步骤 1 = 预设形渠道表单）。 */
const WIZARD_SEED = {
  configured: false,
  providers: { state: "ready", presets: [{ name: "wizard-a" }, { name: "wizard-b" }], providers: [], edit: null, probe: null, draft: null },
  wizard: { step: 1, dismissed: false, notice: null },
}

// ─── M-604a 保真 ───────────────────────────────────────────────────────────────

// 【#1054 轮注 —— 本腿遗留红（他批面）】本腿前置依赖**页槽内**渠道两形表单（`[data-form="preset" ∥ "custom"]`）。
// 三端对齐批 #1027–#1029 已将两形表单迁入 `providerAdd` 弹窗体且**单形渲染**（类型切换换骨 —— `providers.addShape`）⇒
// 原「两形同刷 + 根滚位」矩阵需重设计（非容器换名可了）。本批未改本腿语义（越「MCP 随正」射程）——留红待那侧收口；
// 弹窗体接线脚手架（`mountFace` 回 `face` ∥ `doc.body` ∥ FakeNode `replaceWith`）已就位，收口时可直接复用。
test("M-604a·设置树两轮重绘：值 ∕ checked ∕ 焦点 ∕ 光标区间 ∕ 根 scrollTop 保真", async () => {
  installFakeDom()
  try {
    const { store, slot, patchSettings } = await mountFace(SETTINGS_SEED)
    assert.equal(slot.getAttribute("data-state"), "open", "设置树占槽（属性面应收进槽 + 开态）")
    const preset = control(slot, '[data-form="preset"]')
    const custom = control(slot, '[data-form="custom"]')
    const mcpForm = control(slot, '[data-form="mcp"]')
    const nameInput = control(custom, '[name="name"]')

    // 首轮：填值 + 勾选 + 置焦 + 设光标（申报域逐面 —— 渠道两形 ∕ MCP 字段 ∕ 工具 key ∕ env shell）
    control(custom, '[name="baseURL"]').value = "http://draft.invalid/v1"
    control(custom, '[name="model"]').value = "draft-model"
    control(custom, '[name="format"]').value = "anthropic"
    control(custom, '[name="active"]').checked = true
    control(custom, '[name="key"]').value = "sk-custom-draft"
    nameInput.value = "draft-name"
    control(preset, '[name="key"]').value = "sk-preset-draft"
    control(preset, '[name="name"]').value = "preset-b"
    control(mcpForm, '[name="command"]').value = "npx draft-cmd"
    control(slot, '[data-key-input="embedding"]').value = "sk-tools-draft"
    control(slot, '[name="shell.path"]').value = "C:\\draft\\shell"
    nameInput.focus()
    nameInput.setSelectionRange(2, 5)
    slot.scrollTop = 120

    // 次轮：模型有变（`verify` 切片写 ⇒ 唯一重绘点径）⇒ 重建（forms 前插一节点 —— 结构位序随动）
    store.set(patchSettings(store.get(), { verify: { kind: "ok", count: 2, reason: null } }))

    const preset2 = control(slot, '[data-form="preset"]')
    const custom2 = control(slot, '[data-form="custom"]')
    const mcpForm2 = control(slot, '[data-form="mcp"]')
    assert.notEqual(custom2, custom, "重建 = 新节点（旧树摘除）")
    assert.equal(control(custom2, '[name="name"]').value, "draft-name", "自定形名保真")
    assert.equal(control(custom2, '[name="baseURL"]').value, "http://draft.invalid/v1", "baseURL 保真")
    assert.equal(control(custom2, '[name="model"]').value, "draft-model", "model 保真")
    assert.equal(control(custom2, '[name="format"]').value, "anthropic", "format select 保真（新树缺省首项 openai）")
    assert.equal(control(custom2, '[name="active"]').checked, true, "active 复选保真（checked 纳域）")
    assert.equal(control(custom2, '[name="key"]').value, "sk-custom-draft", "自定形 key 保真（同键多例 id=key）")
    assert.equal(control(preset2, '[name="key"]').value, "sk-preset-draft", "预设形 key 保真（同键多例消歧）")
    assert.equal(control(preset2, '[name="name"]').value, "preset-b", "预设名 select 保真")
    assert.equal(control(mcpForm2, '[name="command"]').value, "npx draft-cmd", "MCP 字段保真")
    assert.equal(control(slot, '[data-key-input="embedding"]').value, "sk-tools-draft", "工具 key 保真（无 id ⇒ 标记取值作键）")
    assert.equal(control(slot, '[name="shell.path"]').value, "C:\\draft\\shell", "env shell 输入保真")
    const focusNow = doc.activeElement
    assert.equal(focusNow, custom2.querySelector('[name="name"]'), "焦点保真（id 键 + 位序消歧 ⇒ 自定形名）")
    assert.equal(focusNow.selectionStart, 2, "光标区间起")
    assert.equal(focusNow.selectionEnd, 5, "光标区间止")
    assert.equal(slot.scrollTop, 120, "根 scrollTop 保真")
  } finally {
    restoreDom()
  }
})

test("M-604a·向导树同闸（步骤 1 渠道表单跨重建保真 —— 两树一闸）", async () => {
  installFakeDom()
  try {
    const { store, slot, patchSettings } = await mountFace(WIZARD_SEED)
    assert.notEqual(slot.getAttribute("data-onboarding"), null, "向导树占槽（属性面应收进槽）")
    assert.equal(slot.getAttribute("data-settings"), null, "设置树不在槽（互斥）")
    const form = control(slot, '[data-form="preset"]')
    const keyInput = control(form, '[name="key"]')
    control(form, '[name="preset"]').value = "wizard-b"
    keyInput.value = "sk-wizard-draft"
    keyInput.focus()
    keyInput.setSelectionRange(1, 4)
    slot.scrollTop = 60

    store.set(patchSettings(store.get(), { wizard: { step: 1, dismissed: false, notice: "probe" } }))

    const form2 = control(slot, '[data-form="preset"]')
    assert.notEqual(form2, form, "重建 = 新节点")
    assert.equal(control(form2, '[name="key"]').value, "sk-wizard-draft", "向导 key 草稿保真")
    assert.equal(control(form2, '[name="preset"]').value, "wizard-b", "向导渠道选保真（预设选中值 —— 表单件 `name=\"preset\"`）")
    const key2 = control(form2, '[name="key"]')
    assert.equal(doc.activeElement, key2, "焦点保真（id 键回退链）")
    assert.equal(key2.selectionStart, 1, "光标区间起")
    assert.equal(key2.selectionEnd, 4, "光标区间止")
    assert.equal(slot.scrollTop, 60, "根 scrollTop 保真")
  } finally {
    restoreDom()
  }
})

test("M-604a·容器缺位零动作（捕获 null ∕ 复填零抛）+ 闸落点结构", async () => {
  installFakeDom()
  try {
    const { captureView, restoreView } = await import(at("thincoder-desktop/renderer/view-state.mjs"))
    assert.equal(captureView(null), null, "容器缺位 ⇒ 捕获 null")
    assert.doesNotThrow(() => restoreView(null, { scrolls: [], drafts: [], focus: null }), "容器缺位 ⇒ 复填零抛")
    assert.doesNotThrow(() => restoreView(new FakeNode("div"), null), "空快照 ⇒ 零动作")
    const mount = readRepo(`${RENDERER}/mount-settings.mjs`)
    assert.match(mount, /import \{ captureView, dropDrafts, mergeViewSnaps, restoreView \} from "\.\/view-state\.mjs"/, "闸件导入在档")
    assert.match(mount, /const fresh = dropDrafts\(captureView\(root\), draftInvalidation\)/, "挂载前捕获在唯一重绘点")
    assert.match(mount, /mergeViewSnaps\(viewResidue, fresh/, "残件并合（在途窗携带）在唯一重绘点")
    assert.match(mount, /const rest = restoreView\(root, snap\)/, "重建后复填在唯一重绘点")
    assert.match(mount, /viewResidue = inFlight\(root\) \? rest : null/, "残件承接：树在途留待 ∕ 树定型弃")
  } finally {
    restoreDom()
  }
})

// ─── M-604a 在途窗携带 ────────────────────────────────────────────────────────

// 【#1054 轮注 —— 本腿遗留红（他批面）】同 M-604a·设置树：`[data-form="custom"]` 已入 `providerAdd` 弹窗体；
// 「在途面内容短 ⇒ 根滚位写入被截」的观测位随那两形表单迁出页槽而变（待 #1027–#1029 侧重锚）。
test("M-604a·在途重建（读 → loading → 结）携带：草稿 ∕ 焦点 ∕ 根滚位跨 loading 窗保真", async () => {
  installFakeDom()
  try {
    const { store, slot, patchSettings } = await mountFace(SETTINGS_SEED)
    const custom = control(slot, '[data-form="custom"]')
    const nameInput = control(custom, '[name="name"]')
    nameInput.value = "inflight-draft"
    nameInput.focus()
    nameInput.setSelectionRange(3, 6)
    slot.scrollTop = slot.scrollHeight - slot.clientHeight
    const scrollBefore = slot.scrollTop
    assert.ok(scrollBefore > 0, "根滚位非零（判据非平凡）")

    // 读 ①：段入 loading（树面表单暂缺 —— 单轮捕获 ∕ 复填达不了底 ⇒ 残件携带）
    const held = store.get().settings.providers
    store.set(patchSettings(store.get(), { providers: { ...held, state: "loading" } }))
    assert.equal(slot.querySelector('[data-form="custom"]'), null, "loading 面零表单（段体零行）")
    assert.ok(slot.scrollTop < scrollBefore, "在途面内容短 ⇒ 根滚位写入被截（残件携带的机制位可观测）")

    // 读 ②：结 —— 表单回树；残件须已在定型树复填
    store.set(patchSettings(store.get(), { providers: { ...held, state: "ready" } }))

    const custom2 = control(slot, '[data-form="custom"]')
    assert.equal(control(custom2, '[name="name"]').value, "inflight-draft", "草稿跨 loading 窗保真")
    assert.equal(doc.activeElement, custom2.querySelector('[name="name"]'), "焦点跨 loading 窗保真")
    assert.equal(doc.activeElement.selectionStart, 3, "光标区间起")
    assert.equal(doc.activeElement.selectionEnd, 6, "光标区间止")
    assert.equal(slot.scrollTop, scrollBefore, "根滚位跨 loading 窗保真（在途面截断不回写 —— 携带窗信任规则）")
  } finally {
    restoreDom()
  }
})

// ─── M-604b 负向锁 ────────────────────────────────────────────────────────────

test("M-604b·负向锁：非申报控件重建后取新模型值（旧 DOM 值零回写）", async () => {
  installFakeDom()
  try {
    const { store, patchSettings, face } = await mountFace(SETTINGS_SEED)
    face.openSettingsModal("mcpForm") // KD-77 ①：MCP 表单入弹窗体
    store.set(patchSettings(store.get(), { mcp: { ...store.get().settings.mcp, state: "ready" } }))
    const typeSelect = control(doc.body, '[data-form="mcp"] [name="type"]')
    const proxyUri = control(doc.slot, '[name="proxy.uri"]')
    assert.equal(typeSelect.getAttribute("data-draft"), null, "类型 select（写触发：改即写切片）不在申报域")
    assert.equal(proxyUri.getAttribute("data-draft"), null, "proxy.uri（即改即存）不在申报域")
    assert.equal(typeSelect.value, "stdio", "现态 = 模型值")

    // DOM 现值 ≠ 模型面（模拟在途 ∕ 外部写后的陈旧屏值）
    typeSelect.value = "ws"
    proxyUri.value = "http://typed.local"

    // 模型面变（同批切片写 ⇒ 唯一重绘点径）
    store.set(patchSettings(store.get(), {
      mcp: { ...store.get().settings.mcp, form: { editing: null, type: "http" } },
      env: { ...store.get().settings.env, proxy: { uri: "http://model.invalid/v2", web: true, model: false } },
    }))

    assert.equal(control(doc.body, '[data-form="mcp"] [name="type"]').value, "http", "类型 select 取新模型值（旧值 ws 零回写）")
    assert.equal(control(doc.slot, '[name="proxy.uri"]').value, "http://model.invalid/v2", "proxy.uri 取新模型值（旧值零回写）")
  } finally {
    restoreDom()
  }
})

test("M-604b·作用域锁：MCP 表单身份换（add → edit:alpha）⇒ 旧草稿零回写（取模型预填）", async () => {
  installFakeDom()
  try {
    const seed = {
      ...SETTINGS_SEED,
      mcp: {
        state: "ready",
        servers: [{ name: "alpha", kind: "command", summary: "probe", config: { command: "run-alpha", args: ["--a"] } }],
        details: {},
        form: { editing: null, type: "stdio" },
      },
    }
    const { store, patchSettings, face } = await mountFace(seed)
    face.openSettingsModal("mcpForm") // KD-77 ①：MCP 表单入弹窗体
    store.set(patchSettings(store.get(), { mcp: { ...store.get().settings.mcp, state: "ready", form: { editing: null, type: "stdio" } } }))
    const addForm = control(doc.body, '[data-form="mcp"]')
    assert.equal(addForm.getAttribute("data-draft-scope"), "add", "新增态作用域骨")
    control(addForm, '[name="name"]').value = "draft-server"
    control(addForm, '[name="command"]').value = "draft-cmd"

    // 身份换：编辑出口径（`form.editing` 写切片）—— 同键控件换骨
    store.set(patchSettings(store.get(), { mcp: { ...store.get().settings.mcp, form: { editing: "alpha", type: "stdio" } } }))

    const editForm = control(doc.body, '[data-form="mcp"]')
    assert.equal(editForm.getAttribute("data-draft-scope"), "edit:alpha", "编辑态作用域骨")
    assert.equal(control(editForm, '[name="name"]').value, "alpha", "名取模型面（edit 预填）")
    assert.equal(control(editForm, '[name="command"]').value, "run-alpha", "字段组取模型预填（add 草稿零回写）")
  } finally {
    restoreDom()
  }
})

// ─── M-604c 捕获域 ────────────────────────────────────────────────────────────

test("M-604c·捕获域（树面）：申报域逐控件携 [data-draft]；写触发控件不在域", async () => {
  installFakeDom()
  try {
    const { store, slot, patchSettings, face } = await mountFace(SETTINGS_SEED)
    const keysOf = (scope) => scope.querySelectorAll("[data-draft]").map((el) => {
      const id = el.getAttribute("id")
      return id !== null && id !== "" ? `id:${id}` : `mark:${el.getAttribute("data-draft")}`
    })
    // 页槽面（KD-77 ①：渠道两形 ∥ MCP 表单入弹窗体后）：工具 key + env shell
    assert.deepEqual(keysOf(slot), ["id:shell-path", "mark:embedding"], "页槽捕获域 = 申报面（弹窗迁出后，文档序）")
    // 弹窗体①：`providerAdd`（预设形 —— 默认骨；设置弹窗不传 `activeDefault` ⇒ 零 active 件）
    face.openSettingsModal("providerAdd")
    store.set(patchSettings(store.get(), { providers: { ...store.get().settings.providers, state: "ready" } }))
    assert.deepEqual(keysOf(doc.body), ["id:preset", "id:key", "mark:proxy"], "渠道弹窗体申报域（预设形）")
    // 弹窗体②：`mcpForm`（stdio 新增态 —— 零行集）
    face.closeSettingsModal()
    face.openSettingsModal("mcpForm")
    store.set(patchSettings(store.get(), { mcp: { ...store.get().settings.mcp, state: "ready" } }))
    assert.deepEqual(keysOf(doc.body), ["id:mcp-name", "id:mcp-command", "id:mcp-args"], "MCP 弹窗体申报域（stdio 新增态）")
    assert.equal(control(doc.body, '[data-form="mcp"] [name="type"]').getAttribute("data-draft"), null, "类型 select（写触发：改即写切片）不在申报域")
    for (const sel of ['[name="proxy.uri"]', '[name="proxy.web"]', '[name="proxy.model"]', '[name="shell.select"]']) {
      assert.equal(control(slot, sel).getAttribute("data-draft"), null, `即改即存 ∕ 写触发控件不在域：${sel}`)
    }
  } finally {
    restoreDom()
  }
})

test("M-604c·捕获域（源面扫描）：四档申报点逐档计数 + 逐组落点在位", () => {
  const controls = readRepo(`${RENDERER}/views/settings-controls.mjs`)
  const mcp = readRepo(`${RENDERER}/views/settings-sections-mcp.mjs`)
  const tools = readRepo(`${RENDERER}/views/settings-sections-tools.mjs`)
  const env = readRepo(`${RENDERER}/views/settings-sections-env.mjs`)
  const countOf = (src) => (src.match(/"data-draft":/g) ?? []).length
  assert.equal(countOf(controls), 6, "settings-controls 申报点计 6（fieldPair + 自定形 name + 两 select + active + 实读面）")
  assert.equal(countOf(mcp), 3, "settings-sections-mcp 申报点计 3（fieldNode 可编辑态 + 行集两格；类型 select 零标记）")
  assert.equal(countOf(tools), 1, "settings-sections-tools 申报点计 1（编辑态 key 输入）")
  assert.equal(countOf(env), 1, "settings-sections-env 申报点计 1（shell 自定义路径；proxy ∕ shell select 零标记）")
  assert.match(controls, /\{ tag: "input", props: \{ class: "settings-field", id: name, name, type, "data-draft": "", \.\.\.extra \} \}/, "fieldPair 携标记")
  assert.match(controls, /id: "name", name: "name", type: "text", "data-draft": ""/, "自定形 name 文本携标记")
  assert.match(controls, /props: \{ class: "settings-field", id: "format", name: "format", "data-draft": "" \}/, "自定形 format select 携标记")
  assert.match(controls, /id: "preset", name: "preset", "data-draft": ""/, "预设形 name select 携标记（现骨 = `selectProps` 单行）")
  assert.match(controls, /id: "active", name: "active", type: "checkbox", "data-draft": ""/, "active 复选携标记")
  assert.match(mcp, /\.\.\.\(readOnly \? \{ readOnly: true \} : \{ "data-draft": "" \}\)/, "MCP 字段组：可编辑态携标记 ∕ readOnly 态不申报")
  assert.match(tools, /"data-draft": kind/, "工具 key 输入：标记取值作显式键")
  assert.match(env, /id: "shell-path", name: "shell\.path", type: "text", "data-draft": ""/, "env shell 输入携标记")
})
