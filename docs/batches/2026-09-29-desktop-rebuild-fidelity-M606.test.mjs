/**
 * 2026-09-29-desktop-rebuild-fidelity-M606.test.mjs — 批次本地机检件 · 波 2（#606 重建面位 ∕ 焦点保真族）。
 * 覆盖 = 批档 §2.4 判据（AC-3 机检腿）：
 *   M-606a 逐面身份断言（假 DOM 键控差分径）：
 *     ① 会话条：`tabBadges` 翻转 ⇒ 条目 ∕ 下拉壳 ∕ 同码位标 ∕ 标题节点引用不变 + 下拉 scrollTop 保 +
 *        跨帧点按（click 仍达处理器）+ 焦点保 + 改名草稿存续（输入节点身份 + 值）；
 *     ② 会话头：`busy` 翻转只刷 `disabled` ∕ `aria-disabled`（`select` 与 option 节点引用不变）；候选变才换 `option` 集；
 *     ③ 池两族：读数变 ⇒ 审批条目（`data-prompt-id`）∕ 队列条目引用不变；增删差分（增 ⇒ 旧件存续；删 ⇒ 摘除）。
 *   M-606b 快照复填（chat 重挂径）：`following` 假 ⇒ 根 `scrollTop` 复填 + 域内焦点复填；真 ⇒ 贴底写覆盖；
 *        归档回显展开集捕获 ∕ 复填（缺件零动作 · 不强制关闭）；五面包络接线结构核。
 *   M-606c 提示带签名门：同签名 ⇒ 零 DOM 写（节点身份 + 写计数双面）；变 ⇒ 最小重建（同签名位序复用现件）；
 *        锚换代 ⇒ 强制重建（防御）。
 * 跑法（自仓库根）：`node --test .thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-M606.test.mjs`
 * （两层深 ⇒ 与终位 `docs/batches/` 同深；暂存位披露见批档 §5）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何渲染档取件注册 —— 沿 M-604 ∕ M-607 件先例）

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const readRepo = (rel) => readFileSync(join(repoRoot, rel), "utf8")
const RENDERER = "thincoder-desktop/renderer"

// ─── 假 DOM（值面 ∕ 选择器面 ∕ 焦点面 ∕ 结构面 —— 收窄至本批所需；沿 M-604 件先例增补）──────────────

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
    this.listeners = []
    this._scrollTop = 0
    this._height = 200
    this._scrollHeight = null
    this._checked = null
    this._value = null
    this._selStart = null
    this._selEnd = null
  }
  get children() { return this.childNodes.filter((node) => node instanceof FakeNode) }
  get firstChild() { return this.childNodes[0] ?? null }
  get lastElementChild() { const list = this.children; return list[list.length - 1] ?? null }
  get nextSibling() {
    if (this.parentNode === null) return null
    const at = this.parentNode.childNodes.indexOf(this)
    return at < 0 ? null : this.parentNode.childNodes[at + 1] ?? null
  }
  get parentElement() { return this.parentNode instanceof FakeNode ? this.parentNode : null }
  get isConnected() {
    for (let node = this; node !== null; node = node.parentNode) if (node.__connected === true) return true
    return false
  }
  get textContent() { return this.childNodes.map((child) => child.textContent).join("") }
  set textContent(value) {
    this.replaceChildren()
    if (String(value ?? "") !== "") this.append(new FakeText(value))
  }
  get clientHeight() { return this._height }
  set clientHeight(value) { this._height = value }
  get scrollHeight() { return this._scrollHeight !== null ? this._scrollHeight : this._height + 40 * countElements(this) }
  set scrollHeight(value) { this._scrollHeight = value }
  get scrollTop() { return this._scrollTop }
  set scrollTop(value) { this._scrollTop = Math.max(0, Math.min(value, Math.max(0, this.scrollHeight - this._height))) }
  getAttribute(name) { return Object.hasOwn(this.attrs, name) ? this.attrs[name] : null }
  getAttributeNames() { return Object.keys(this.attrs) }
  /** `dataset`（真 DOM 语义探针 —— 核件 `paintLabel` 等读面所需）。 */
  get dataset() {
    const self = this
    const nameOf = (key) => `data-${String(key).replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`
    return new Proxy({}, {
      get: (_target, key) => (typeof key === "string" ? self.getAttribute(nameOf(key)) : undefined),
      set: (_target, key, value) => { self.setAttribute(nameOf(key), String(value)); return true },
    })
  }
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

let doc = null
let prevDoc = null
let prevNode = null

/** 假文档装填（活动件 = `focus()` 落点；`createElement` ∕ `createTextNode` 供 `dom.mjs` ∕ 核件链）。 */
function installFakeDom() {
  prevDoc = globalThis.document
  prevNode = globalThis.Node
  doc = {
    activeElement: null,
    listeners: [],
    createElement: (tag) => new FakeNode(tag),
    createTextNode: (value) => new FakeText(value),
    addEventListener: (type, fn) => { doc.listeners.push({ type, fn }) },
    removeEventListener: () => {},
    querySelector: () => null,
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

/** 事件派发（平测面 —— 真 DOM 冒泡同径：自目标沿 `parentNode` 上溯；`stopPropagation` 真桩）。 */
function fire(node, type, extra = {}) {
  assert.ok(node !== null && node !== undefined, `fire 目标在场：${type}`)
  let stopped = false
  const event = { target: node, currentTarget: null, stopPropagation: () => { stopped = true }, preventDefault: () => {}, ...extra }
  for (let at = node; at !== null && at !== undefined && stopped !== true; at = at.parentNode) {
    event.currentTarget = at
    for (const listener of [...(at.listeners ?? [])]) {
      if (listener.type !== type) continue
      listener.fn(event)
      if (stopped === true) break
    }
  }
}

/** 单例 store 复位（假文档下各测独立 —— 全键回初态）。 */
async function resetStore() {
  const { store, initialState } = await import("../../thincoder-desktop/renderer/store.mjs")
  store.set(initialState())
  return store
}

// ─── M-606a·① 会话条 ───────────────────────────────────────────────────────────

test("M-606a①·会话条：位标翻转 ⇒ 条目 ∕ 下拉壳 ∕ 位标 ∕ 标题引用不变 + scrollTop 保 + 跨帧点按达 + 焦点保 + 改名草稿存续", async () => {
  installFakeDom()
  try {
    const { mountSessionBar } = await import("../../thincoder-desktop/renderer/mount-sessions.mjs")
    const store = await resetStore()
    const slot = new FakeNode("div")
    slot.setAttribute("data-slot", "session-control")
    const switches = []
    const handlers = {
      onSwitch: (key) => switches.push(key), onNew: () => {}, onRename: async () => true, onDelete: () => {}, onOpenProject: () => {},
    }
    const rows = () => [
      { slot: "1", title: "Alpha", provider: "p", messageCount: 2, updatedAt: 1700000000000, isActive: true },
      { slot: "2", title: "Beta", provider: "p", messageCount: 5, updatedAt: 1700000001000, isActive: false },
    ]
    store.set({ project: { cwd: "C:\\proj\\alpha", recent: [] }, sessions: rows(), activeSession: "1", tabBadges: { "2": ["running"] }, ledger: null })

    mountSessionBar(slot, store.get(), handlers)
    const selector = slot.querySelector(".session-selector")
    assert.ok(selector !== null, "选择器壳在场")
    fire(selector, "click") // 开下拉
    const dropdown = selector.querySelector(".session-dropdown")
    assert.ok(dropdown !== null, "开 ⇒ 下拉在场")
    dropdown._scrollHeight = 600
    dropdown._height = 200
    dropdown.scrollTop = 120
    const itemA = dropdown.querySelector('[data-slot="1"]')
    const itemB = dropdown.querySelector('[data-slot="2"]')
    const badgeB = itemB.querySelector(".session-item-badge")
    const titleA = itemA.querySelector(".session-item-title")
    assert.ok(itemA !== null && itemB !== null && badgeB !== null && titleA !== null, "条目 ∕ 位标 ∕ 标题面齐备")
    itemA.focus()
    assert.equal(doc.activeElement, itemA, "置焦成立")

    // 帧写（位标变 —— tabBadges 翻转；跨帧点按语义 = 节点与处理器存续）
    store.set({ tabBadges: { "1": ["approval"], "2": ["running"] } })
    mountSessionBar(slot, store.get(), handlers)

    const dropdown2 = slot.querySelector(".session-dropdown")
    assert.equal(dropdown2, dropdown, "下拉壳不摘（引用不变）")
    assert.equal(dropdown2.scrollTop, 120, "下拉 scrollTop 保")
    const itemA2 = dropdown2.querySelector('[data-slot="1"]')
    const itemB2 = dropdown2.querySelector('[data-slot="2"]')
    assert.equal(itemA2, itemA, "同键条目节点引用不变")
    assert.equal(itemB2, itemB, "同键条目节点引用不变（位标者）")
    assert.equal(itemB2.querySelector(".session-item-badge"), badgeB, "同码位标节点引用不变")
    assert.equal(itemA2.querySelector(".session-item-title"), titleA, "标题节点引用不变")
    assert.ok(itemA2.querySelector(".session-item-badge") !== null, "新位标（approval）补位在场")
    assert.equal(doc.activeElement, itemA, "焦点保真（同键条目）")
    fire(itemA2, "click")
    assert.deepEqual(switches, ["1"], "跨帧点按 ⇒ click 仍达处理器（点选出口在册）")

    // 改名草稿腿：重开（上一步点选已关）⇒ ✎ 换形 ⇒ 键入 ⇒ 帧写 ⇒ 值 ∕ 节点 ∕ 焦点存续 + 形内点按不误触选择出口
    fire(selector, "click")
    const itemR = slot.querySelector('[data-slot="1"]')
    fire(itemR.querySelector('[data-action="session:rename"]'), "click")
    const formR = slot.querySelector('[data-slot="1"]')
    const input = slot.querySelector('[data-action="session:rename-input"]')
    assert.ok(input !== null, "✎ ⇒ 换形输入框在场")
    assert.notEqual(formR, itemR, "换形 = 换件（形内点按不得达条目选择监听）")
    assert.equal(formR.listeners.filter((l) => l.type === "click").length, 0, "形内条目节点零 click 监听（旧件监听随灭）")
    input.value = "Alpha 草稿"
    input.focus()
    store.set({ tabBadges: { "2": ["done"] } })
    mountSessionBar(slot, store.get(), handlers)
    const input2 = slot.querySelector('[data-action="session:rename-input"]')
    assert.equal(input2, input, "换形期输入节点身份不变（键控差分无重建擦写）")
    assert.equal(input2.value, "Alpha 草稿", "改名草稿存续")
    assert.equal(doc.activeElement, input, "换形期焦点不夺")
    fire(input2, "click") // 冒泡派发（真 DOM 同径）：形内点按不得达选择出口
    assert.deepEqual(switches, ["1"], "形内点按不误触选择出口（零二次切换）")
    assert.equal(slot.querySelector('[data-action="session:rename-input"]'), input, "形内点按后形仍在场")
    fire(slot.querySelector('[data-action="session:rename-cancel"]'), "click")
    assert.equal(slot.querySelector('[data-action="session:rename-input"]'), null, "取消 ⇒ 输入退场")
    const itemBack = slot.querySelector('[data-slot="1"]')
    assert.notEqual(itemBack, formR, "出形 = 换件（常形件重建）")
    assert.ok(itemBack.listeners.some((l) => l.type === "click"), "常形件选择监听在场")

    // locale 词面刷（#606① 差分歧径）：选择器 ∕ 下拉 `aria-label` + 空态行文随词表原位换
    const i18n = await import("../../thincoder-desktop/renderer/i18n.mjs")
    i18n.initDict({ locale: "en", dict: { "session.title": "S-A", "session.empty": "E-A", "rail.action.newSession": "N-A" }, host: {} })
    store.set({ sessions: [] })
    mountSessionBar(slot, store.get(), handlers)
    assert.equal(slot.querySelector(".session-empty").textContent, "E-A", "空态行初文")
    i18n.initDict({ locale: "zh", dict: { "session.title": "S-B", "session.empty": "E-B", "rail.action.newSession": "N-B" }, host: {} })
    mountSessionBar(slot, store.get(), handlers)
    assert.equal(slot.querySelector(".session-selector").getAttribute("aria-label"), "S-B", "locale 变 ⇒ 选择器 aria-label 原位刷")
    assert.equal(slot.querySelector(".session-dropdown").getAttribute("aria-label"), "S-B", "locale 变 ⇒ 下拉 aria-label 原位刷")
    assert.equal(slot.querySelector(".session-new").getAttribute("aria-label"), "N-B", "locale 变 ⇒ 新建钮词面原位刷")
    assert.equal(slot.querySelector(".session-empty").textContent, "E-B", "locale 变 ⇒ 空态行原位改文")
    i18n.initDict({ locale: "en", dict: {} })
  } finally {
    restoreDom()
  }
})

// ─── M-606a·② 会话头 ───────────────────────────────────────────────────────────

test("M-606a②·会话头：busy 翻转只刷 disabled（select ∕ option 引用不变）· 候选变才换 option 集", async () => {
  installFakeDom()
  try {
    const { mountHead } = await import("../../thincoder-desktop/renderer/views/chrome.mjs")
    const root = new FakeNode("div")
    const handlers = { candidates: () => ({ providers: [{ name: "prov" }], models: [{ id: "m1" }, { id: "m2" }] }), onField: () => {} }
    const base = { activeSession: "1", sessionMeta: { "1": { provider: "prov", model: "m1", effort: "" } }, tabBadges: {} }

    mountHead(root, base, handlers)
    const select = root.querySelector('[data-field="model"] select')
    assert.ok(select !== null, "model 控件在场")
    const options0 = [...select.querySelectorAll("option")]
    assert.equal(options0.length, 2, "选项 = 候选 ∪ 现值（现值已在候选 —— 无重复）")
    assert.equal(select.value, "m1", "现值选中")

    mountHead(root, { ...base, tabBadges: { "1": ["running"] } }, handlers) // busy 翻转
    assert.equal(root.querySelector('[data-field="model"] select'), select, "busy 翻转 ⇒ select 节点引用不变")
    assert.equal(select.getAttribute("disabled"), "", "busy ⇒ disabled 在场")
    assert.equal(select.getAttribute("aria-disabled"), "true", "busy ⇒ aria-disabled 在场")
    assert.deepEqual([...select.querySelectorAll("option")], options0, "busy 不换 option 集（引用不变）")

    mountHead(root, base, handlers) // 复真
    assert.equal(root.querySelector('[data-field="model"] select'), select, "复真 ⇒ select 节点引用不变")
    assert.equal(select.getAttribute("disabled"), null, "复真 ⇒ disabled 摘除")
    assert.equal(select.getAttribute("aria-disabled"), null, "复真 ⇒ aria-disabled 摘除")

    const handlers2 = { candidates: () => ({ providers: [{ name: "prov" }], models: [{ id: "m1" }, { id: "m2" }, { id: "m3" }] }), onField: () => {} }
    mountHead(root, base, handlers2) // 候选变
    assert.equal(root.querySelector('[data-field="model"] select'), select, "候选变 ⇒ select 节点引用不变")
    assert.equal([...select.querySelectorAll("option")].length, 3, "候选变 ⇒ option 集换（m3 追加）")

    assert.ok(root.querySelector('[data-field="effort"]') !== null, "effort 字段在场（model 在场 ⟺ 档位控件）")
    mountHead(root, { ...base, sessionMeta: { "1": { provider: "prov" } } }, handlers2) // 无 model
    assert.equal(root.querySelector('[data-field="effort"]'), null, "无 model ⇒ effort 字段退场")
    assert.ok(root.querySelector('[data-field="provider"]') !== null, "provider 字段存续")
  } finally {
    restoreDom()
  }
})

// ─── M-606a·③ 池两族 ───────────────────────────────────────────────────────────

test("M-606a③·池两族：读数变 ⇒ 审批 ∕ 队列条目引用不变；增删差分（增 ⇒ 旧件存续 · 删 ⇒ 摘除）", async () => {
  installFakeDom()
  try {
    const { mountPool } = await import("../../thincoder-desktop/renderer/views/activity.mjs")
    const root = new FakeNode("div")
    root.setAttribute("data-slot", "pool")
    // 预置壳（模拟前帧已建：body + 头 + 子 agent 族容器 —— adopt 径键控账在场）
    const body = new FakeNode("div")
    body.setAttribute("data-pool-body", "")
    const head = new FakeNode("div")
    head.setAttribute("data-pool-head", "")
    const family = new FakeNode("div")
    family.setAttribute("data-family", "subagents")
    const label = new FakeNode("div")
    label.setAttribute("class", "pool-family-label")
    const blockEntry = { key: "s1", label: "sub-1", role: "explore", id: 11, status: "running" }
    const blockEl = new FakeNode("div")
    blockEl.setAttribute("class", "sub-block")
    blockEl.setAttribute("data-subname", "s1")
    blockEl._subMeta = blockEntry // 同引用 ⇒ 子 agent 族更新径早退（本测面 = 两族差分）
    family.append(label)
    family.append(blockEl)
    body.append(head)
    body.append(family)
    root.append(body)
    root._poolSub = family
    root._poolSubSession = "1"

    const handlers = { onApprove: () => {}, onTogglePool: () => {} }
    const state = {
      activeSession: "1",
      pool: { running: 1, approval: 1, approvals: [{ promptId: "P1", shape: "single", tool: "Bash" }], queue: [{ title: "Q-1", status: "queued" }] },
      subBlocks: { "1": [blockEntry] },
      poolCollapsed: {},
    }
    mountPool(root, state, handlers)
    const famA = body.querySelector('[data-family="approvals"]')
    const famQ = body.querySelector('[data-family="queue"]')
    assert.ok(famA !== null, "审批族建壳（adopt 径键控差分）")
    assert.ok(famQ !== null, "队列族建壳（同形）")
    const entry1 = famA.querySelector('[data-prompt-id="P1"]')
    const queue1 = famQ.querySelector('[data-pool-item="queue"]')
    assert.ok(entry1 !== null && queue1 !== null, "两族条目在场")

    // 帧写：读数变（running 1 → 3；approval 计数不变）⇒ 族 ∕ 条目引用不变（唯一性 = 复用不重插）
    mountPool(root, { ...state, pool: { ...state.pool, running: 3 } }, handlers)
    assert.equal(body.querySelector('[data-family="approvals"]'), famA, "审批族容器引用不变")
    assert.equal(body.querySelector('[data-family="queue"]'), famQ, "队列族容器引用不变")
    assert.equal(body.querySelector('[data-prompt-id="P1"]'), entry1, "读数变帧 ⇒ 审批条目引用不变")
    assert.equal(famA.querySelectorAll('[data-prompt-id="P1"]').length, 1, "审批条目唯一（复用不重插）")
    assert.equal(body.querySelector('[data-pool-item="queue"]'), queue1, "读数变帧 ⇒ 队列条目引用不变")
    assert.equal(famQ.querySelectorAll('[data-pool-item="queue"]').length, 1, "队列条目唯一（复用不重插）")

    // 增删差分
    mountPool(root, { ...state, pool: { ...state.pool, approvals: [{ promptId: "P1", shape: "single", tool: "Bash" }, { promptId: "P2", shape: "single", tool: "Read" }] } }, handlers)
    assert.equal(body.querySelector('[data-prompt-id="P1"]'), entry1, "增项 ⇒ 旧条目引用存续")
    const entry2 = body.querySelector('[data-prompt-id="P2"]')
    assert.ok(entry2 !== null, "新条目在场")
    assert.equal(famA.querySelectorAll('[data-pool-item="approval"]').length, 2, "条目数 = 模型数（零重复）")
    mountPool(root, { ...state, pool: { ...state.pool, approvals: [{ promptId: "P2", shape: "single", tool: "Read" }] } }, handlers)
    assert.equal(body.querySelector('[data-prompt-id="P1"]'), null, "删项 ⇒ 摘除")
    assert.equal(famA.querySelectorAll('[data-pool-item="approval"]').length, 1, "删项后条目数 = 模型数（零残留）")
    assert.equal(body.querySelector('[data-prompt-id="P2"]'), entry2, "余项引用存续")
    mountPool(root, { ...state, pool: { ...state.pool, approvals: [], queue: [] } }, handlers)
    assert.equal(body.querySelector('[data-family="approvals"]'), null, "族空 ⇒ 摘容器")
    assert.equal(body.querySelector('[data-family="queue"]'), null, "族空 ⇒ 摘容器（队列同形）")
    assert.equal(body.querySelector('[data-family="subagents"]'), family, "子 agent 族容器零扰（引用不变）")
  } finally {
    restoreDom()
  }
})

// ─── M-606b 快照复填（chat 重挂径）+ 展开集 ───────────────────────────────────────

test("M-606b·对话流重挂：following=false ⇒ scrollTop ∕ 焦点复填；true ⇒ 贴底；展开集捕获 ∕ 复填（不强制关闭）", async () => {
  installFakeDom()
  try {
    const { mountChat } = await import("../../thincoder-desktop/renderer/views/chat.mjs")
    const { echoOpenSet, applyEchoOpen } = await import("../../thincoder-desktop/renderer/views/chat-subagent.mjs")

    // ─ 展开集单元面（手工 DOM —— 免核件渲染链） ─
    const src = new FakeNode("div")
    const block1 = new FakeNode("div")
    block1.setAttribute("data-block-kind", "subagent")
    block1.setAttribute("data-block-id", "sub-1")
    const echo1 = new FakeNode("details")
    echo1.setAttribute("class", "advisor-block")
    echo1.open = true
    block1.append(echo1)
    const block2 = new FakeNode("div")
    block2.setAttribute("data-block-kind", "subagent")
    block2.setAttribute("data-block-id", "sub-2")
    const echo2 = new FakeNode("details")
    echo2.setAttribute("class", "advisor-block")
    echo2.open = false
    block2.append(echo2)
    src.append(block1)
    src.append(block2)
    assert.deepEqual(echoOpenSet(src), ["sub-1"], "展开集捕获 = 展开件块键集")
    const dst = new FakeNode("div")
    const block1b = new FakeNode("div")
    block1b.setAttribute("data-block-kind", "subagent")
    block1b.setAttribute("data-block-id", "sub-1")
    const echo1b = new FakeNode("details")
    echo1b.setAttribute("class", "advisor-block")
    echo1b.open = false
    block1b.append(echo1b)
    const block2b = new FakeNode("div")
    block2b.setAttribute("data-block-kind", "subagent")
    block2b.setAttribute("data-block-id", "sub-2")
    const echo2b = new FakeNode("details")
    echo2b.setAttribute("class", "advisor-block")
    echo2b.open = false
    block2b.append(echo2b)
    dst.append(block1b)
    dst.append(block2b)
    applyEchoOpen(dst, ["sub-1"])
    assert.equal(echo1b.open, true, "同键回显 open 回真")
    assert.equal(echo2b.open, false, "不强制关闭（未捕获者零写）")
    assert.deepEqual(echoOpenSet(new FakeNode("div")), [], "缺件 ⇒ 空集（零抛）")
    assert.doesNotThrow(() => applyEchoOpen(null, ["sub-1"]), "缺根 ⇒ 零动作")

    // ─ chat 重挂径（文本 + error 块；无 subagent 块 ⇒ 免核件渲染链） ─
    const root = new FakeNode("div")
    root.__connected = true
    root._height = 200
    root._scrollHeight = 1000
    const state = {
      activeSession: "1",
      following: false,
      locale: "en",
      project: { cwd: "C:\\proj" },
      blocks: [
        { kind: "user", text: "hi", ts: 1700000000000 },
        { kind: "assistant", text: "yo" },
        { kind: "error", text: "boom", techInfo: null },
      ],
      history: { hasOlder: false, inFlight: false, page: null },
      pendingNew: 0,
      pool: { approvals: [] },
      settings: { configured: true },
    }
    const handlers = { onRetry: () => {} }
    mountChat(root, state, handlers, 200)
    const retry0 = root.querySelector('[data-action="chat:retry"]')
    assert.ok(retry0 !== null, "错误横幅重试钮在场（焦点腿载体）")
    retry0.focus()
    root.scrollTop = 120
    assert.equal(root.scrollTop, 120, "滚位就位（非退化）")
    mountChat(root, { ...state, blocks: [...state.blocks, { kind: "assistant", text: "more" }] }, handlers, 200)
    assert.equal(root.scrollTop, 120, "following=false ⇒ 根 scrollTop 复填（重挂径零写回归零消解）")
    const retry1 = root.querySelector('[data-action="chat:retry"]')
    assert.notEqual(retry1, retry0, "重挂 ⇒ 新节点（复填面非退化）")
    assert.equal(doc.activeElement, retry1, "域内焦点复填（键回退链）")
    mountChat(root, { ...state, following: true, blocks: [...state.blocks, { kind: "assistant", text: "more" }] }, handlers, 200)
    assert.equal(root.scrollTop, 800, "following=true ⇒ 贴底写（覆盖复填）")

    // ─ 接线结构核（五面包络 + chat 重挂四件在档） ─
    const chatSrc = readRepo(`${RENDERER}/views/chat.mjs`)
    assert.match(chatSrc, /const snap = captureView\(root\)/, "chat 重挂前快照捕获在档")
    assert.match(chatSrc, /const openSet = echoOpenSet\(root\)/, "展开集捕获在档")
    assert.match(chatSrc, /applyEchoOpen\(root, openSet\)/, "展开集复填在档")
    assert.match(chatSrc, /restoreView\(root, snap\)/, "快照复填在档")
    assert.match(chatSrc, /if \(model\.following === true\) stickToBottom\(root\)/, "跟滚支贴底在档")
    const envelopes = [
      [`${RENDERER}/mount-sessions.mjs`, /restoreView\(root, snap\)/],
      [`${RENDERER}/views/chrome.mjs`, /restoreView\(root, snap\)/],
      [`${RENDERER}/mount-status.mjs`, /restoreView\(root, snap\)/],
      [`${RENDERER}/mount-pool.mjs`, /restoreView\(root, root\._poolPin === false \? snap/],
      [`${RENDERER}/mount-cards.mjs`, /restoreView\(root, \{ scrolls: \[\], drafts/],
    ]
    for (const [file, re] of envelopes) assert.match(readRepo(file), re, `快照包络在档：${file}`)
  } finally {
    restoreDom()
  }
})

// ─── M-606c 提示带签名门 ───────────────────────────────────────────────────────

test("M-606c·提示带签名门：同签名 ⇒ 零 DOM 写；变 ⇒ 最小重建（同签名位序复用）；锚换代 ⇒ 强制重建", async () => {
  installFakeDom()
  try {
    const { createComposerSync } = await import("../../thincoder-desktop/renderer/composer-sync.mjs")
    const anchor = new FakeNode("div")
    const stats = { writes: 0 }
    const append0 = anchor.append.bind(anchor)
    anchor.append = (...nodes) => { stats.writes += 1; return append0(...nodes) }
    const clear0 = anchor.replaceChildren.bind(anchor)
    anchor.replaceChildren = (...nodes) => { stats.writes += 1; return clear0(...nodes) }
    let current = anchor
    const state = { activeSession: "1", pending: { "1": ["hello"] }, attachDegraded: {} }
    const sync = createComposerSync({
      store: { get: () => state }, activeKey: () => state.activeSession, call: () => new Promise(() => {}),
      push: () => {}, pushSubs: [], wire: { failure: () => null }, panelOf: () => null, noticesOf: () => current,
    })

    sync.paintNotices(state)
    assert.equal(anchor.children.length, 1, "待发送行在位")
    const row0 = anchor.children[0]
    stats.writes = 0
    sync.paintNotices(state) // 同签名
    assert.equal(stats.writes, 0, "同签名 ⇒ 零 DOM 写")
    assert.equal(anchor.children[0], row0, "同签名 ⇒ 节点引用不变")

    // 行集变（队 +1）⇒ 该行重建；再叠降级行 ⇒ 未变行位序复用
    const state2 = { ...state, pending: { "1": ["hello", "world"] } }
    sync.paintNotices(state2)
    assert.ok(stats.writes > 0, "行集变 ⇒ 重建发生")
    assert.equal(anchor.children.length, 1, "行数不变（同一位）")
    assert.notEqual(anchor.children[0], row0, "签名变 ⇒ 该行换新")
    const pendingRow = anchor.children[0]
    const state3 = { ...state2, attachDegraded: { "1": "non-vision" } }
    sync.paintNotices(state3)
    assert.equal(anchor.children.length, 2, "降级行补位（序 = [待发送, 降级]）")
    assert.equal(anchor.children[0], pendingRow, "未变行位序复用（最小重建）")

    stats.writes = 0
    sync.paintNotices(state3)
    assert.equal(stats.writes, 0, "两行同签名 ⇒ 零写")
    stats.writes = 0
    sync.paintNotices({ ...state3, activeSession: "2" }) // 无队 ∕ 无降级 ⇒ 行集清空
    assert.ok(stats.writes > 0, "行集变 ⇒ 清空重建")
    assert.equal(anchor.children.length, 0, "空行集 ⇒ 零节点")

    // 锚换代（composer 重挂）⇒ 防御重建（live 判据含 parentNode 校验）
    current = new FakeNode("div")
    sync.paintNotices(state)
    assert.equal(current.children.length, 1, "锚换代 ⇒ 新锚重建在册")
  } finally {
    restoreDom()
  }
})
