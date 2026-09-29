/**
 * 2026-09-29-subblock-follow-resume.test.mjs — 批次本地机检件（#603 子 agent 块跟滚「让位死开关」修复 · 随批留存归档）。
 * 名随批次档 · 住批次目录 · 不入仓套件；复跑 = `node --test docs/batches/2026-09-29-subblock-follow-resume.test.mjs`
 * （本刻暂存 `.thincoder/tmp/` 同名件 —— 两层深 ⇒ 相对 import 与终位一致）。
 *
 * 被验面（批档 §2.7 测试面 + §2.6 验收 A1–A11）：
 *   ① 核 C（A3 ∕ A4 ∕ A5）：旗标卫生——默认钉底 ∕ 近底无条件翻真 ∕ 手势门翻假 ∕ 非手势位移不改旗标；
 *   ② 核 D（A1 ∕ A8）：出口钮三态出生判据 ∕ 两态文案 ∕ 点击回底复跟退场 ∕ 让位期置 `_subFollowNew`；
 *   ③ 桌面 A（A2 ∕ A6 ∕ A9）：领用径 churn 消（同态重挂位保真）· 结构等价（领用 ≡ 重建）· 折叠 ∕ 换代 ∕ 零块语义；
 *   ④ 桌面 B（A2 ∕ A5）：`applySubBlockFollow` 旗标双向 + `mountPool` 尾接线（位面被抹 ⇒ 下一帧自愈）；
 *   ⑤ 桌面 E（A7）：归档重建径监听在场 + 冻结零钮（零行为变更）；
 *   ⑥ 键 ∕ 值面（A8）· 留端清算（A10——六档规范面 grep + 核件档头读回）· 滚动策略族契约对拍（A11）。
 * harness = rc-resolve 钩子（`/rc/` 取核件 · 静态 import 先行）+ mini 假 DOM（`document` 最小实现 ∕ 事件面 ∕
 * 滚动读数面 —— 沿 #518 件先例；本批扩：**churn 模型**（摘离 ⇒ 子树滚动位归零——真浏览器语义，探针③ 68→0 同径））。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何 /rc/ 取件注册）

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const readRepo = (rel) => readFileSync(join(repoRoot, rel), "utf8")

// ─── mini 假 DOM（块构件族所需面 + 事件 ∕ 滚动读数 ∕ churn 模型）────────────────────────────────

const camelOf = (name) => name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())

class FakeText {
  constructor(value) { this.textContent = String(value) }
}

/** churn 模型（真浏览器语义）：节点摘离文档 ⇒ 其子树滚动盒销毁 ⇒ 位归零（探针③ 同径）。 */
function zeroScroll(node) {
  if (!(node instanceof FakeNode)) return
  node.scrollTop = 0
  for (const child of node.children) zeroScroll(child)
}

class FakeNode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase()
    this.attrs = {}
    this.dataset = {}
    this.children = []
    this.listeners = []
    this.textContent = ""
    this.parent = null
    this.open = false
    this.isConnected = true
    this.scrollTop = 0
    this.scrollHeight = 0
    this.clientHeight = 0
    this._classes = new Set()
    this.classList = {
      add: (...cs) => { for (const c of cs) this._classes.add(c) },
      remove: (...cs) => { for (const c of cs) this._classes.delete(c) },
      contains: (c) => this._classes.has(c),
    }
  }
  set className(value) { this._classes = new Set(String(value).split(/\s+/).filter(Boolean)) }
  get className() { return [...this._classes].join(" ") }
  setAttribute(k, v) {
    const s = String(v)
    this.attrs[k] = s
    if (k === "class") this.className = s
    else if (k.startsWith("data-")) this.dataset[camelOf(k.slice(5))] = s
  }
  getAttribute(k) {
    if (k.startsWith("data-")) {
      const v = this.dataset[camelOf(k.slice(5))]
      if (v !== undefined) return String(v)
    }
    return this.attrs[k] ?? null
  }
  removeAttribute(k) { delete this.attrs[k] }
  addEventListener(type, fn, options) { this.listeners.push({ type, fn, options }) }
  fire(type, event = {}) { for (const l of this.listeners) if (l.type === type) l.fn({ type, ...event }) }
  focus() {}
  appendChild(node) {
    const child = node instanceof FakeNode ? node : new FakeText(node)
    child.parent = this
    this.children.push(child)
    this.bump()
    return child
  }
  append(...nodes) { for (const n of nodes) this.appendChild(n) }
  insertBefore(node, anchor) {
    const at = anchor == null ? -1 : this.children.indexOf(anchor)
    if (at < 0) this.children.push(node); else this.children.splice(at, 0, node)
    node.parent = this
    this.bump()
    return node
  }
  get childNodes() { return [...this.children] }
  get firstChild() { return this.children[0] ?? null }
  get lastElementChild() { return [...this.children].reverse().find((c) => c instanceof FakeNode) ?? null }
  get firstElementChild() { return this.children.find((c) => c instanceof FakeNode) ?? null }
  replaceChildren(...nodes) { for (const c of this.children) zeroScroll(c); this.children = []; for (const n of nodes) this.appendChild(n) }
  remove() { if (this.parent) { const at = this.parent.children.indexOf(this); if (at >= 0) this.parent.children.splice(at, 1); this.parent.bump() } zeroScroll(this) }
  replaceWith(next) { const p = this.parent; if (!p) return; const at = p.children.indexOf(this); p.children[at] = next; next.parent = p; p.bump(); zeroScroll(this) }
  prepend(node) { this.children.unshift(node); node.parent = this; this.bump() }
  querySelector(sel) { let hit = null; this.walk((n) => { if (hit === null && matches(n, sel)) hit = n }); return hit }
  querySelectorAll(sel) { const out = []; this.walk((n) => { if (matches(n, sel)) out.push(n) }); return out }
  closest(sel) { for (let n = this; n != null; n = n.parent ?? null) if (n instanceof FakeNode && matches(n, sel)) return n; return null }
  walk(fn) { for (const c of this.children) { if (c instanceof FakeNode) { fn(c); c.walk(fn) } } }
  set innerHTML(value) { this._html = String(value) }
  get innerHTML() { return this._html ?? "" }
  bump() { this.textContent = this.children.map((c) => c.textContent ?? "").join("") }
}

function matches(node, sel) {
  if (sel.startsWith(".")) return node.classList.contains(sel.slice(1))
  if (/^[a-zA-Z][\w-]*$/.test(sel)) return node.tagName === sel.toUpperCase()
  const m = /^\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(sel)
  if (m === null) return false
  const value = m[1].startsWith("data-") ? node.dataset[camelOf(m[1].slice(5))] : node.attrs[m[1]]
  if (value === undefined) return false
  return m[2] === undefined || String(value) === m[2]
}

globalThis.Node = FakeNode
globalThis.document = {
  getElementById: () => null,
  createElement: (tag) => new FakeNode(tag),
  createTextNode: (value) => new FakeText(value),
}
globalThis.window = {}

// ─── 端词典装配（核件取词经注册端出 —— 沿 #518 先例）+ 被验面取件 ───────────────────────────────

const { initDict, setStringsSink } = await import("../../thincoder-desktop/renderer/i18n.mjs")
const { setStrings } = await import("../../thincoder-render-core/i18n.mjs")
const { projectDictionary } = await import("../../thincoder-core/i18n.mjs")
setStringsSink(setStrings)
initDict({ locale: "en", dict: projectDictionary("en") })

const core = await import("../../thincoder-render-core/subblocks/block.mjs")
const { applySubBlockFollow } = await import("../../thincoder-desktop/renderer/views/pool-subagents.mjs")
const { mountPool } = await import("../../thincoder-desktop/renderer/views/activity.mjs")
const { activityNewCount, attachActivityNew } = await import("../../thincoder-desktop/renderer/views/activity-new.mjs")
const { fillSubagentEcho, syncSubagentEcho } = await import("../../thincoder-desktop/renderer/views/chat-subagent.mjs")
const { FOLLOW_PX } = await import("../../thincoder-desktop/renderer/views/chat-scroll.mjs")

// ─── 夹具 ──────────────────────────────────────────────────────────────────

/** 核件块壳 + `.advisor-content` 内容区（原语直测用最小元素树 —— 不引构件族）。 */
function makeBlock({ open = true, connected = true, withContent = true } = {}) {
  const block = new FakeNode("details")
  block.classList.add("advisor-block", "sub-block")
  block.open = open
  block.isConnected = connected
  if (withContent) {
    const content = new FakeNode("div")
    content.className = "advisor-content"
    block.appendChild(content)
  }
  return block
}
const contentOf = (element) => element.querySelector(".advisor-content")
const buttonOf = (element) => element.querySelector(".sub-follow-btn")

/** 近底几何置位：gap = scrollHeight − scrollTop − clientHeight（client 100 ∕ 高 300）。 */
function setGap(content, gap) {
  content.clientHeight = 100
  content.scrollHeight = 300
  content.scrollTop = 200 - gap
}

/** 手势 + 位移一步（真时序：wheel 先标记手势，scroll 后至——门内）。 */
function gestureScroll(content, gap) {
  content.fire("wheel")
  setGap(content, gap)
  content.fire("scroll")
}

/** 假钟（R4 确定性）：冻结 `Date.now` ⇒ 手势门窗判据不依真墙钟（防负载抖动假红）；`fn` 毕还原。 */
function withFrozenClock(fn) {
  const real = Date.now
  const at = real()
  Date.now = () => at
  try { return fn() } finally { Date.now = real }
}

const row = (text) => ({ kind: "text", text })
const liveEntry = (rows, extra = {}) => ({ key: "sub:coder#1", label: "coder#1", role: "coder", id: 1, status: "running", pool: true, frozen: false, rows, ...extra })
const poolState = (blocks, extra = {}) => ({
  activeSession: "1",
  pool: { approvals: [], queue: [], running: blocks.length, approval: 0 },
  subBlocks: { "1": blocks },
  poolCollapsed: {},
  ...extra,
})

/** 结构序列化（A9 对拍面）：tag + class 集 + attrs（除 class）+ dataset + 子序（文本节点 = `#text:…`）。 */
function serialize(node) {
  if (!(node instanceof FakeNode)) return `#text:${node.textContent}`
  const classes = [...node._classes].sort().join(" ")
  const attrs = Object.entries(node.attrs).filter(([k]) => k !== "class").sort().map(([k, v]) => `${k}=${v}`).join(";")
  const data = Object.entries(node.dataset).sort().map(([k, v]) => `${k}=${v}`).join(";")
  return `<${node.tagName} c=[${classes}] a=[${attrs}] d=[${data}]>(${node.children.map(serialize).join(",")})`
}

// ─── ① 核 C：旗标卫生（让位三律）───────────────────────────────────────────────

test("①核C·默认钉底：旗标缺省 ⇒ 写超值 scrollTop；且监听集 = 手势三事件 + scroll（全 passive）", () => {
  const block = makeBlock()
  const content = contentOf(block)
  content.scrollTop = 0
  core.maybeScrollBlock(block)
  assert.equal(content.scrollTop, Number.MAX_SAFE_INTEGER, "默认钉底 ⇒ 写超值（A5）")

  core.initBlockFollow(block)
  assert.deepEqual(content.listeners.map((l) => l.type), ["wheel", "touchmove", "pointerdown", "scroll"], "监听集（KD-RC-8：手势三标记 + scroll 更新点）")
  assert.equal(content.listeners.every((l) => l.options?.passive === true), true, "全程 passive")
})

test("①核C·近底无条件翻真：手势门外的位移（复位 ∕ 程序写回波）也自愈；恰 24px 不判近底（严格小于）", () => {
  const block = makeBlock()
  const content = contentOf(block)
  core.initBlockFollow(block)
  content._pinFollow = false
  setGap(content, 10) // 非手势位移（无 wheel 标记——复位回波同径）
  content.fire("scroll")
  assert.equal(content._pinFollow, true, "近底（10 < 24）⇒ 无条件翻真（A3 ∕ A4①）")
  content._pinFollow = false
  setGap(content, 23)
  content.fire("scroll")
  assert.equal(content._pinFollow, true, "23px 近底")
  content._pinFollow = true
  setGap(content, 24)
  content.fire("scroll")
  assert.equal(content._pinFollow, true, "恰 24px 不判近底（严格小于）⇒ 不翻假（旗标原样）")
})

test("①核C·让位仅凭手势门：手势（wheel ∕ touchmove ∕ pointerdown）⇒ 远离底翻假；门外位移不改旗标", () => withFrozenClock(() => {
  const block = makeBlock()
  const content = contentOf(block)
  core.initBlockFollow(block)

  // 非手势位移（自初始无手势态——门外）：不改旗标（A4①——让位三律③）
  content._pinFollow = true
  setGap(content, 80) // 程序写 ∕ 布局回波（无 wheel 标记）
  content.fire("scroll")
  assert.equal(content._pinFollow, true, "非手势远离底 ⇒ 不改旗标（A4①）")

  gestureScroll(content, 40)
  assert.equal(content._pinFollow, false, "wheel 手势 + 远离底 ⇒ 让位（A1）")

  content._pinFollow = true
  content.fire("pointerdown") // 拖条手势（无 wheel）
  setGap(content, 60)
  content.fire("scroll")
  assert.equal(content._pinFollow, false, "pointerdown 手势 ⇒ 拖条上滚让位仍成立（A4③）")

  content._pinFollow = true
  content.fire("touchmove")
  setGap(content, 60)
  content.fire("scroll")
  assert.equal(content._pinFollow, false, "touchmove 同径")
}))

test("①核C·钉底 + 向下滚轮不踩翻：底部几何（gap 0）⇒ 旗标翻真；向下滚轮无位移不改旗标", () => {
  const block = makeBlock()
  const content = contentOf(block)
  core.initBlockFollow(block)
  content._pinFollow = true
  setGap(content, 0)
  content.fire("wheel") // 已钉底 + 向下滚轮（无 scroll 位移）
  assert.equal(content._pinFollow, true, "钉底向下滚轮 ⇒ 不踩翻（A4②）")
  content.fire("scroll")
  assert.equal(content._pinFollow, true, "近底回波 ⇒ 真（自愈不变）")
})

test("①核C·手势门过期：门外 scroll 不改旗标（600ms 窗——假钟）", () => {
  const block = makeBlock()
  const content = contentOf(block)
  core.initBlockFollow(block)
  const realNow = Date.now
  let now = realNow()
  Date.now = () => now // 确定性推进（不依真墙钟）
  try {
    content.fire("wheel") // 手势时刻 = T
    now += core.GESTURE_GATE_MS + 1 // 推进出窗
    setGap(content, 90)
    content.fire("scroll")
    assert.equal(content._pinFollow, undefined, "门外 ⇒ 不改旗标（从未置假）")
    content.fire("wheel") // 手势窗口刷新（新一记手势）
    setGap(content, 90)
    content.fire("scroll")
    assert.equal(content._pinFollow, false, "门内（新一记手势）⇒ 让位可置假")
  } finally { Date.now = realNow }
})

test("①核C·让位零写 ∕ 复跟：_pinFollow=false ⇒ 不动 scrollTop；近底复跟后下一应用即写", () => {
  const block = makeBlock()
  const content = contentOf(block)
  core.initBlockFollow(block)
  content._pinFollow = false
  content.scrollTop = 120
  core.maybeScrollBlock(block)
  assert.equal(content.scrollTop, 120, "让位 ⇒ 零写（不夺阅读位）")
  setGap(content, 0)
  content.fire("scroll")
  assert.equal(content._pinFollow, true, "近底 ⇒ 复跟")
  core.maybeScrollBlock(block)
  assert.equal(content.scrollTop, Number.MAX_SAFE_INTEGER, "复跟 ⇒ 下一帧复钉")
})

// ─── ② 核 D：出口钮（在场判据 ∕ 两态 ∕ 点击 ∕ 让位期新行）────────────────────────

test("②核D·钮出生判据三态：让位 ∧ 可滚 ∧ 展开 ⇒ 建；旗标真 ⇒ 不建；折叠 ⇒ 不建；冻结 ⇒ 不建", () => {
  const block = makeBlock()
  const content = contentOf(block)
  setGap(content, 40)
  core.maybeScrollBlock(block)
  assert.equal(buttonOf(block), null, "旗标缺省（钉底）⇒ 不建")

  content._pinFollow = false
  content.clientHeight = 100
  content.scrollHeight = 100 // 不可滚
  core.maybeScrollBlock(block)
  assert.equal(buttonOf(block), null, "不可滚（scrollHeight ≯ clientHeight）⇒ 不建（A1 在场判据）")

  setGap(content, 40)
  core.maybeScrollBlock(block)
  const btn = buttonOf(block)
  assert.ok(btn, "让位 ∧ 可滚 ∧ 展开 ⇒ 建（A1）")
  assert.equal(block.querySelector(".advisor-content").querySelector(".sub-follow-btn"), null, "钮不入 `.advisor-content`（避行合并判据读点）")

  const folded = makeBlock({ open: false })
  const foldedContent = contentOf(folded)
  foldedContent._pinFollow = false
  setGap(foldedContent, 40)
  core.maybeScrollBlock(folded)
  assert.equal(buttonOf(folded), null, "折叠（open=false）⇒ 不建（核原语 no-op 径）")

  const frozen = makeBlock()
  const frozenContent = contentOf(frozen)
  frozen.classList.add("sub-frozen")
  frozenContent._pinFollow = false
  setGap(frozenContent, 40)
  core.maybeScrollBlock(frozen)
  assert.equal(buttonOf(frozen), null, "冻结 ⇒ 不建（E 径：冻结块零出口）")

  content._pinFollow = true
  core.maybeScrollBlock(block)
  assert.equal(buttonOf(block), null, "复跟（旗标翻真）⇒ 钮退场（清账路②）")
})

test("②核D·两态文案：让位期新行（_subFollowNew）⇒ sub.follow.new；否则 ⇒ sub.follow.bottom", () => {
  const block = makeBlock()
  const content = contentOf(block)
  setGap(content, 40)
  content._pinFollow = false
  core.maybeScrollBlock(block)
  assert.equal(buttonOf(block)?.textContent, "↓ Back to latest", "默认态 = 回到最新（en 值逐字）")

  core.renderSubagentChunk(block, row("new line"))
  assert.equal(content._subFollowNew, true, "让位期新行 ⇒ 置 _subFollowNew")
  core.maybeScrollBlock(block)
  assert.equal(buttonOf(block)?.textContent, "↓ New output", "新行态 = 新内容（切换）")
})

test("②核D·点击：回底 + 复跟 + 清未读 + 钮退场（幂等清账路①）", () => {
  const block = makeBlock()
  const content = contentOf(block)
  setGap(content, 40)
  content._pinFollow = false
  content._subFollowNew = true
  core.maybeScrollBlock(block)
  const btn = buttonOf(block)
  assert.ok(btn, "钮在场")
  btn.fire("click")
  assert.equal(content.scrollTop, Number.MAX_SAFE_INTEGER, "点击 ⇒ 回底")
  assert.equal(content._pinFollow, true, "复跟")
  assert.equal(content._subFollowNew, false, "清未读")
  assert.equal(buttonOf(block), null, "钮退场")
})

test("②核D·让位期两态复位：回近底复跟 ⇒ 未读判据复位（再见让位时 = 默认态）", () => withFrozenClock(() => {
  const block = makeBlock()
  const content = contentOf(block)
  core.initBlockFollow(block)
  gestureScroll(content, 40)
  core.renderSubagentChunk(block, row("x"))
  assert.equal(content._subFollowNew, true, "让位期新行")
  setGap(content, 5)
  content.fire("scroll")
  assert.equal(content._pinFollow, true, "近底复跟")
  assert.equal(content._subFollowNew, false, "复跟 ⇒ 未读复位（两态判据与让位期对齐）")
  content.fire("wheel")
  setGap(content, 50)
  content.fire("scroll")
  core.maybeScrollBlock(block)
  assert.equal(buttonOf(block)?.textContent, "↓ Back to latest", "再见让位（无新行）⇒ 默认态")
}))

// ─── ③ 桌面 A：领用径（churn 消 ∕ 结构等价 ∕ 折叠 ∕ 换代）────────────────────────

test("③桌面A·churn 模型自证 + 领用径位保真：同态重挂（新 chunk）⇒ 元素同枚 ∕ 块内容位 ∕ 池位不动", () => {
  // churn 模型自证（真浏览器语义）：摘离 ⇒ 子树滚动位归零
  const probe = makeBlock()
  const probeContent = contentOf(probe)
  probeContent.scrollTop = 68
  probe.remove()
  assert.equal(probeContent.scrollTop, 0, "churn 模型：摘离 ⇒ 位归零（探针③ 68→0 同径）")

  const root = new FakeNode("div")
  const entry = liveEntry([row("a")])
  mountPool(root, poolState([entry]))
  const content = root.querySelector(".advisor-content")
  const blockEl = root.querySelector(".sub-block")
  content._pinFollow = false // 用户上滚（让位态）
  content.clientHeight = 100
  content.scrollHeight = 300 // 可滚（真机 60px 窗同径——钮在场判据之一）
  content.scrollTop = 120
  root._poolPin = false // 池区上滚（未钉底）
  root.scrollTop = 500
  attachActivityNew(root) // 池钮接线（挂载期一次——本测直连）
  const born = liveEntry([row("n")], { key: "sub:plan#2", label: "plan#2", role: "plan", id: 2 })
  mountPool(root, poolState([{ ...entry, rows: [row("a"), row("b")] }, born])) // 同态重挂 = 每 chunk 既有路径 + 新块出生
  const after = root.querySelector(".advisor-content")
  assert.equal(after, content, "祖先链零摘离 ⇒ 同枚内容元素（领用径）")
  assert.equal(after.scrollTop, 120, "让位期 ⇒ 块内容位保真（A2——churn 复位消）")
  assert.equal(root.scrollTop, 500, "池位保真（A6——未跟底零写）")
  assert.equal(activityNewCount(root), 1, "未跟底期新块出生 ⇒ 计数 +1")
  const poolBtn = root.querySelector(".activity-new-btn")
  assert.ok(poolBtn, "↓N 钮在场（A6）")
  assert.ok(buttonOf(blockEl), "让位期出口钮在场（A1 ∕ A2）")
  root.fire("click", { target: poolBtn }) // 池钮事件委托挂宿主（假 DOM 无冒泡——直发宿主）
  assert.equal(root.scrollTop, Number.MAX_SAFE_INTEGER, "点钮 ⇒ 回底")
  assert.equal(root._poolPin, true, "点钮 ⇒ 复跟")
  assert.equal(root.querySelector(".activity-new-btn"), null, "点钮 ⇒ 钮退场")
})

test("③桌面A·帧尾复核自愈：位面被抹（内容位 ∕ 池位归零）⇒ 下一帧自愈（旗标真者复钉）", () => {
  const root = new FakeNode("div")
  const entry = liveEntry([row("a")])
  mountPool(root, poolState([entry]))
  const content = root.querySelector(".advisor-content")
  content.scrollTop = 0 // 位面被抹（旗标 = 真 ⇒ 应复钉）
  root.scrollTop = 0
  mountPool(root, poolState([{ ...entry, rows: [row("a"), row("b")] }]))
  assert.equal(content.scrollTop, Number.MAX_SAFE_INTEGER, "核应用器复钉（B——任何位面被抹 ⇒ 下一帧自愈）")
  assert.equal(root.scrollTop, Number.MAX_SAFE_INTEGER, "池尾钉底（#518 帧尾径保持）")
})

test("③桌面A·流式跟滚不回归（A5）：1→20 行逐帧挂载 ⇒ 每帧同枚元素 + 逐帧追底", () => {
  const root = new FakeNode("div")
  let element = null
  for (const n of [1, 3, 8, 14, 20]) {
    const rows = Array.from({ length: n }, (_, i) => row(`行${i + 1}`))
    mountPool(root, poolState([liveEntry(rows)]))
    const next = root.querySelector(".sub-block")
    const content = root.querySelector(".advisor-content")
    if (element === null) element = next
    assert.equal(next, element, `n=${n}：同枚元素（不重建）`)
    assert.equal(content.scrollTop, Number.MAX_SAFE_INTEGER, `n=${n}：逐帧追底（gap 保持近底）`)
  }
})

test("③桌面A·结构等价：领用径 DOM ≡ 重建径 DOM（tag ∕ 属性 ∕ 文本 ∕ 子序）", () => {
  const mk = (rows) => poolState([liveEntry(rows)])
  const adopted = new FakeNode("div")
  mountPool(adopted, mk([row("a")]))
  mountPool(adopted, mk([row("a"), row("b")])) // 第二帧 = 领用径
  const rebuilt = new FakeNode("div")
  mountPool(rebuilt, mk([row("a"), row("b")])) // 单帧 = 重建径
  assert.equal(serialize(adopted), serialize(rebuilt), "两径结构逐位相等（A9）")
})

test("③桌面A·折叠 ∕ 展开语义：折叠 ⇒ 三族摘离（容器存账）；展开 ⇒ 复用重插（元素同一）", () => {
  const root = new FakeNode("div")
  const entry = liveEntry([row("a")])
  mountPool(root, poolState([entry]))
  const family = root._poolSub
  const blockEl = root.querySelector(".sub-block")
  assert.ok(family && blockEl, "首帧建树（重建径）")

  mountPool(root, poolState([entry], { poolCollapsed: { "1": true } }))
  assert.equal(root.querySelector('[data-family="subagents"]'), null, "折叠 ⇒ 族容器摘离")
  assert.equal(root._poolSub, family, "容器存账（子树存活）")
  assert.equal(root._poolSub.querySelector(".sub-block"), blockEl, "项元素随容器存活")

  mountPool(root, poolState([entry], { poolCollapsed: {} }))
  assert.equal(root.querySelector('[data-family="subagents"]'), family, "展开 ⇒ 复用 `_poolSub` 重插（零新建）")
  assert.equal(root.querySelector(".sub-block"), blockEl, "项元素同一")
})

test("③桌面A·会话换代 ∕ 零块：换代 ⇒ 全挂新建（旧容器不承账）；零块帧 ⇒ 弃容器账", () => {
  const root = new FakeNode("div")
  const entry = liveEntry([row("a")])
  mountPool(root, poolState([entry]))
  const oldBlock = root.querySelector(".sub-block")
  mountPool(root, { ...poolState([liveEntry([row("a")], { id: 2 })]), activeSession: "2", subBlocks: { "2": [liveEntry([row("a")], { id: 2 })] } })
  assert.equal(root._poolSubSession, "2", "换代账随池面在场即落")
  assert.notEqual(root.querySelector(".sub-block"), oldBlock, "跨会话不复用（有意）")

  mountPool(root, poolState([], { pool: { approvals: [{ promptId: 1, shape: "single", tool: "write" }], queue: [], running: 1, approval: 1 } }))
  assert.equal(root._poolSub, null, "零块帧 ⇒ 弃容器账（R5 语义不变）")
  mountPool(root, poolState([liveEntry([row("a")])]))
  assert.ok(root.querySelector(".sub-block"), "再生 ⇒ 重挂全新建元素（R5）")
})

test("③桌面A·兼容面：原取件路径保名（结构拆分零语义——批次归档件 ∕ 只读读件可解析）", async () => {
  const activity = await import("../../thincoder-desktop/renderer/views/activity.mjs")
  assert.equal(typeof activity.poolModel, "function", "`poolModel` 原路径可解析（re-export——先例 = 装配面出档「原路径同名 re-export 保名面」）")
  assert.equal(typeof activity.poolTree, "function", "`poolTree` 原路径可解析（定义单源 = `./pool-tree.mjs`）")
  assert.equal(typeof activity.mountPool, "function", "挂载编排导出面在场")
})


// ─── ④ 桌面 B：applySubBlockFollow（帧尾复核扫）────────────────────────────────

test("④桌面B·帧尾扫双向：旗标真 ⇒ 写 MAX；旗标假 ⇒ 零写（只扫池族）", () => {
  const family = new FakeNode("div")
  const a = makeBlock()
  const b = makeBlock()
  contentOf(a)._pinFollow = false
  contentOf(a).scrollTop = 33
  b.classList.add("sub-frozen") // 冻结同径（零写）
  family.append(a, b)
  contentOf(b).scrollTop = 7
  applySubBlockFollow(family)
  assert.equal(contentOf(a).scrollTop, 33, "旗标假 ⇒ 零写（不夺阅读位）")
  assert.equal(contentOf(b).scrollTop, Number.MAX_SAFE_INTEGER, "旗标缺省（钉底）⇒ 复钉")

  contentOf(a)._pinFollow = true
  applySubBlockFollow(family)
  assert.equal(contentOf(a).scrollTop, Number.MAX_SAFE_INTEGER, "旗标真 ⇒ 复钉")
  assert.doesNotThrow(() => applySubBlockFollow(null), "族缺 ⇒ 零动作")
})

test("④桌面B·mountPool 尾接线在场：每帧逐块应用（领用径两连挂 ⇒ 复钉可见）", () => {
  const root = new FakeNode("div")
  const entry = liveEntry([row("a")])
  mountPool(root, poolState([entry])) // 重建径尾接
  const content = root.querySelector(".advisor-content")
  assert.equal(content.scrollTop, Number.MAX_SAFE_INTEGER, "重建径帧尾复钉")
  content.scrollTop = 0
  mountPool(root, poolState([{ ...entry, rows: [row("a"), row("b")] }])) // 领用径尾接
  assert.equal(content.scrollTop, Number.MAX_SAFE_INTEGER, "领用径帧尾复钉（B 覆盖）")
})

// ─── ⑤ 桌面 E：归档重建径接线（监听在场 + 冻结零钮）──────────────────────────────

test("⑤桌面E·归档回显：监听在场（出生 ∕ 接管 ∕ 重放三径同件）；冻结 ⇒ 零钮 ∕ 零写", () => {
  const node = new FakeNode("div")
  const block = { kind: "subagent", meta: { key: "sub:coder#1", label: "coder#1", role: "coder", id: 1, status: "done", frozen: true }, rows: [row("old line")] }
  fillSubagentEcho(node, block)
  const element = node.querySelector(".advisor-block")
  assert.ok(element, "回显着装（核件元素）")
  assert.equal(element.open, false, "冻结块折叠")
  const content = contentOf(element)
  assert.deepEqual(content.listeners.map((l) => l.type), ["wheel", "touchmove", "pointerdown", "scroll"], "归档重建径监听在场（E 接线——防御性单源）")
  assert.equal(buttonOf(element), null, "冻结 ⇒ 出口钮不建（零行为变更）")
  content.scrollTop = 11
  core.maybeScrollBlock(element)
  assert.equal(content.scrollTop, 11, "冻结折叠 ⇒ no-op（零写）")

  // 展开面（冻结块可展开——用户手势）：非冻结判据独立生效（钮仍不建、零写）
  element.open = true
  content._pinFollow = false
  content.clientHeight = 100
  content.scrollHeight = 300
  core.maybeScrollBlock(element)
  assert.equal(content.scrollTop, 11, "冻结展开 ⇒ 零写（不夺阅读位）")
  assert.equal(buttonOf(element), null, "冻结展开 ⇒ 零出口（在场判据含非冻结）")

  const node2 = new FakeNode("div")
  const second = { kind: "subagent", meta: { key: "sub:coder#2", label: "coder#2", role: "coder", id: 2, status: "done", frozen: true }, rows: [row("x")] }
  syncSubagentEcho(node2, { blocks: [block, second] })
  assert.equal(node2.querySelectorAll(".advisor-block").length, 0, "节点序不足 ⇒ 零动作（配对口径不变）")
})

// ─── ⑥ 键 ∕ 值面（A8）· A10 · A11 ──────────────────────────────────────────

test("⑥键面（A8）：两键两语在场，桌面 HOST_DICT 与 VSC locales 逐字同拍；两档样式规则在场", async () => {
  const { HOST_DICT } = await import("../../thincoder-desktop/renderer/i18n.mjs")
  const en = JSON.parse(readRepo("thincoder-vscode/locales/en.json"))
  const zh = JSON.parse(readRepo("thincoder-vscode/locales/zh.json"))
  for (const key of ["sub.follow.new", "sub.follow.bottom"]) {
    assert.equal(typeof HOST_DICT.en[key], "string", `HOST_DICT.en 缺 ${key}`)
    assert.equal(typeof HOST_DICT.zh[key], "string", `HOST_DICT.zh 缺 ${key}`)
    assert.equal(HOST_DICT.en[key], en[key], `en 逐字同拍（${key}）`)
    assert.equal(HOST_DICT.zh[key], zh[key], `zh 逐字同拍（${key}）`)
  }
  assert.equal(zh["sub.follow.new"], "↓ 新内容", "zh 新内容（逐字）")
  assert.equal(zh["sub.follow.bottom"], "↓ 回到最新", "zh 回到最新（逐字）")

  const coreCss = readRepo("thincoder-desktop/renderer/core.css")
  const vscBase = readRepo("thincoder-vscode/webview/base.css")
  for (const [name, css] of [["core.css", coreCss], ["base.css", vscBase]]) {
    assert.ok(/\.sub-follow-btn\s*\{[^}]*position:\s*absolute/.test(css), `${name}：钮规则在场（右下 overlay）`)
    assert.ok(css.includes(".advisor-block.sub-block:not([open]) .sub-follow-btn { display: none; }"), `${name}：折叠态兜底在场`)
    assert.ok(css.includes(".advisor-block.sub-block.sub-frozen .sub-follow-btn { display: none; }"), `${name}：冻结兜底在场（在场判据含非冻结）`)
  }
})

test("⑥A10·留端清算：六档规范面 grep `调用时机留端` 零命中（记录面豁免——仅限日期明示变更行）", () => {
  const docs = [
    "docs/render-core/design/RENDER-CORE.md",
    "docs/desktop/design/UI.md",
    "docs/desktop/design/RENDERER.md",
    "docs/desktop/design/PROJECT.md",
    "docs/vsc/design/WEBVIEW.md",
    "docs/vsc/design/WEBVIEW-PROTOCOL.md",
  ]
  const phrase = "调用时机留端"
  const recordLine = /^\s*-\s*\d{4}-\d{2}-\d{2}（/ // 记录面 = 日期明示的历史行（变更记录）
  for (const rel of docs) {
    const hits = readRepo(rel).split(/\r?\n/).map((line, i) => ({ line, no: i + 1 })).filter(({ line }) => line.includes(phrase))
    for (const hit of hits) {
      assert.ok(recordLine.test(hit.line), `${rel}:${hit.no} 规范面命中「${phrase}」⇒ 留端口径漂移（记录面豁免仅限日期明示行）`)
    }
  }
})

test("⑥A10·核件档头读回（KD-RC-9 一致）：两半归属四条在场；旧「调用时机留端」措辞不在", () => {
  const header = readRepo("thincoder-render-core/subblocks/block.mjs").split("\n").slice(0, 20).join("\n")
  for (const clause of ["原语 ∕ 旗标 ∕ 出口钮 ∕ 核应用器住本档", "应用点契约住核档", "触发源在端", "帧合并 ∕ 更新纪律已收核", "滚动策略族契约句"]) {
    assert.ok(header.includes(clause), `档头缺条款：${clause}`)
  }
  assert.ok(!header.includes("调用时机留端"), "旧措辞已退场（失效表达删除——A10 读回面）")
})

test("⑥A11·滚动策略族契约对拍：四载体判据逐字同式（近底 24px ∕ 旗标门 ⇒ MAX 写 ∕ 清账路）", () => {
  const nearBottom = (src, ref) => new RegExp(`scrollHeight - ${src}\\.scrollTop - ${src}\\.clientHeight < ${ref}`)
  const carriers = [
    {
      name: "块内容区",
      file: "thincoder-render-core/subblocks/block.mjs",
      checks: [
        [/NEAR_BOTTOM_PX = 24/, "近底阈 = 24（常量单源）"],
        [nearBottom("content", "NEAR_BOTTOM_PX"), "近底判据 `< 24`（严格小于——同式）"],
        [/_pinFollow !== false\) content\.scrollTop = Number\.MAX_SAFE_INTEGER/, "旗标门 `!== false` ⇒ 写 `scrollTop = MAX`"],
        [/_pinFollow === false/, "旗标假 = 零写（不夺阅读位）"],
        // 清账三路：① 点击（钮）② 近底复跟（旗标翻真）③ 元素重建（旗标挂内容元素 ⇒ 随元素灭）
        [/next\.addEventListener\("click"/, "清账①：钮点击"],
        [/content\._pinFollow = true \/\/ ① 近底无条件翻真/, "清账②：近底复跟"],
        [/content\._pinFollow = /, "清账③：旗标挂元素（元素重建 ⇒ 随元素灭——零模块级账）"],
      ],
    },
    {
      name: "活动区（VSC）",
      file: "thincoder-vscode/webview/ui.js",
      checks: [
        [/< 24/, "近底阈 = 24（字面——同式）"],
        [/_pinBottom !== false/, "旗标门 `!== false` ⇒ 写（对话流载体）"],
        [/_pinActivity === false/, "旗标门（活动区载体）"],
        [/scrollTop = Number\.MAX_SAFE_INTEGER/, "写 `scrollTop = MAX`"],
        [/\["wheel", "touchmove", "scroll"\]/, "更新点三事件（近底自愈面）"],
      ],
    },
    {
      name: "池列",
      file: "thincoder-desktop/renderer/views/activity-new.mjs",
      checks: [
        [/FOLLOW_PX/, "近底阈引用同源常量（= 对话流 `FOLLOW_PX`）"],
        [nearBottom("root", "FOLLOW_PX"), "近底判据 `< 24`（同式）"],
        [/_poolPin === false/, "旗标门 `=== false` ⇒ 零写（不夺阅读位）"],
        [/scrollTop = Number\.MAX_SAFE_INTEGER/, "跟底 ⇒ 写 `scrollTop = MAX`"],
        // 清账三路：① 点击（钮）② 近底（scroll 判定）③ 世代重置（mountPool 换代 ∕ 零块清账）
        [/clearActivityNew\(root\)/, "清账：点击 ∕ 近底 ∕ 重置三路共用清账口"],
      ],
    },
    {
      name: "对话流",
      file: "thincoder-desktop/renderer/views/chat-scroll.mjs",
      checks: [
        [/FOLLOW_PX = 24/, "近底阈 = 24（常量单源——与契约同值）"],
        [new RegExp("scrollHeight - scrollTop - clientHeight < FOLLOW_PX"), "近底判据 `< 24`（同式）"],
        [/following === true/, "旗标门（跟滚 ⇒ 写；非跟 ⇒ 零写）"],
        [/stickToBottom/, "写口 = 贴底（幂等）"],
        [/compensate/, "非跟滚径 = 补偿（不夺阅读位）"],
      ],
    },
  ]
  assert.equal(core.NEAR_BOTTOM_PX, FOLLOW_PX, "核阈 = 对话流阈（单值 24——判据漂移 = 缺陷）")
  for (const carrier of carriers) {
    const src = readRepo(carrier.file)
    for (const [re, why] of carrier.checks) {
      assert.ok(re.test(src), `${carrier.name}（${carrier.file}）契约漂移：${why}`)
    }
  }
})
