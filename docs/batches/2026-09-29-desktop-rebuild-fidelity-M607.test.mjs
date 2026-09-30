/**
 * 2026-09-29-desktop-rebuild-fidelity-M607.test.mjs — 批次本地机检件 · 波 3（#607 滚动策略族 · 抽核件 pin 工厂）。
 * 名随批次档（波 3 暂存 `.thincoder/tmp/` —— 两层深 ⇒ 相对 import 与终位 `docs/batches/` 一致，两处可跑；
 * 终位 = `docs/batches/2026-09-29-desktop-rebuild-fidelity.test.mjs`，父侧收位时并入）。
 * 覆盖 = 批档 §2.5 判据（AC-4）：
 *   M-607a 工厂平 node 单测：`nearBottom` 边界 23 ∕ 24 ∕ 25 + 三读数归一；`applyPin` 两向；`createPinWatch`
 *          三律（假钟 ∕ 假事件）∥ 直写模式 ∥ 旗标宿主 `holder`；`createUnreadCounter` 清账三路簿记；
 *          handle（`read` ∕ `set` ∕ `attach` 幂等 ∕ `detach` ∕ 缺 el 零抛）。
 *   M-607b 零本地判据副本源扫描：四载体档内零 `scrollHeight - ` 判据表达式 ∕ 零 `24` 字面（除工厂）；
 *          载体皆引工厂导出（单源 = `thincoder-render-core/scroll.mjs`）。
 *   M-607c 对拍腿升级（#603 批件 ⑥A11 源面断言 ⇒「工厂单源 + 消费面断言」）：四载体消费面行为逐载体验证
 *          （块内容区 ∕ 活动区（VSC）∕ 池列 ∕ 对话流）。**跨批随动请父侧执行**（本舱写门：他批批次件不可写——
 *          本组即升级后 ⑥A11 的现成内容；同批件 ⑥A10 档头读回条款组与 ①核件档头变化同因，清单见交付报告）。
 * 跑法（自仓库根）：`node --test .thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-M607.test.mjs`
 * 语义单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-8 ④ ∕ §5「滚动策略族」（U2 随动已落）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何 /rc/ 取件注册）

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const readRepo = (rel) => readFileSync(join(repoRoot, rel), "utf8")

// ─── mini 假件（事件 ∕ 读数 ∕ 选择器面 —— 沿 #603 件先例，本件收窄至本批所需）──────────────────

const camelOf = (name) => name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())

class FakeText {
  constructor(value) { this.textContent = String(value) }
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
  addEventListener(type, fn, options) { this.listeners.push({ type, fn, options }) }
  removeEventListener(type, fn) { this.listeners = this.listeners.filter((l) => !(l.type === type && l.fn === fn)) }
  fire(type, event = {}) { for (const l of [...this.listeners]) if (l.type === type) l.fn({ type, ...event }) }
  appendChild(node) { const child = node instanceof FakeNode ? node : new FakeText(node); child.parent = this; this.children.push(child); this.bump(); return child }
  append(...nodes) { for (const n of nodes) this.appendChild(n) }
  insertBefore(node, anchor) {
    const at = anchor == null ? -1 : this.children.indexOf(anchor)
    if (at < 0) this.children.push(node); else this.children.splice(at, 0, node)
    node.parent = this
    this.bump()
    return node
  }
  get firstChild() { return this.children[0] ?? null }
  remove() { if (this.parent) { const at = this.parent.children.indexOf(this); if (at >= 0) this.parent.children.splice(at, 1); this.parent.bump() } }
  querySelector(sel) { let hit = null; this.walk((n) => { if (hit === null && matches(n, sel)) hit = n }); return hit }
  querySelectorAll(sel) { const out = []; this.walk((n) => { if (matches(n, sel)) out.push(n) }); return out }
  closest(sel) { for (let n = this; n != null; n = n.parent ?? null) if (n instanceof FakeNode && matches(n, sel)) return n; return null }
  walk(fn) { for (const c of this.children) { if (c instanceof FakeNode) { fn(c); c.walk(fn) } } }
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

/** 近底几何置位：gap = scrollHeight − scrollTop − clientHeight（client 100 ∕ 高 300）。 */
function setGap(el, gap) {
  el.clientHeight = 100
  el.scrollHeight = 300
  el.scrollTop = 200 - gap
}

/** 假钟（确定性 —— 手势门窗判据不依真墙钟）；`fn` 毕还原。 */
function withFrozenClock(fn) {
  const real = Date.now
  const at = real()
  Date.now = () => at
  try { return fn() } finally { Date.now = real }
}

/** 裸事件面假件（工厂直测用——无选择器面）。 */
function makeEl() {
  const listeners = []
  return {
    scrollTop: 0, scrollHeight: 0, clientHeight: 0,
    listeners,
    addEventListener: (type, fn, options) => { listeners.push({ type, fn, options }) },
    removeEventListener: (type, fn) => { const i = listeners.findIndex((l) => l.type === type && l.fn === fn); if (i >= 0) listeners.splice(i, 1) },
    fire: (type) => { for (const l of [...listeners]) if (l.type === type) l.fn() },
  }
}

// ─── 工厂取件（被验面）──────────────────────────────────────────────────────

const factory = await import("../../thincoder-render-core/scroll.mjs")

// ─── M-607a 工厂平 node 单测 ────────────────────────────────────────────────

test("M-607a·nearBottom 边界 23 ∕ 24 ∕ 25（严格小于）+ 三读数归一", () => {
  const el = makeEl()
  setGap(el, 23)
  assert.equal(factory.nearBottom(el), true, "23 < 24 ⇒ 近底")
  setGap(el, 24)
  assert.equal(factory.nearBottom(el), false, "恰 24 ⇒ 不判近底（严格小于）")
  setGap(el, 25)
  assert.equal(factory.nearBottom(el), false, "25 ⇒ 非近底")
  assert.equal(factory.nearBottom({}), true, "缺读数 ⇒ 归一零 ⇒ 高度差 0 < 24（不误判停跟）")
  assert.equal(factory.nearBottom({ scrollHeight: 300, scrollTop: 200, clientHeight: 80 }), true, "读数齐 ⇒ 高度差 20 < 24 ⇒ 近底")
  assert.equal(factory.nearBottom({ scrollHeight: 300, scrollTop: 0, clientHeight: 80 }), false, "读数齐 ⇒ 高度差 220 ⇒ 非近底")
  assert.equal(factory.nearBottom(null), true, "null ⇒ 归一零读数（零抛）")
})

test("M-607a·applyPin 两向：门 `!== false` ⇒ 写 MAX（超值不读 scrollHeight）；门假 ∕ 缺件 ⇒ 零写", () => {
  const el = makeEl()
  el.scrollTop = 7
  factory.applyPin(el, undefined)
  assert.equal(el.scrollTop, Number.MAX_SAFE_INTEGER, "门缺省（undefined ≠ false）⇒ 写")
  el.scrollTop = 7
  factory.applyPin(el, true)
  assert.equal(el.scrollTop, Number.MAX_SAFE_INTEGER, "门真 ⇒ 写")
  el.scrollTop = 7
  factory.applyPin(el, false)
  assert.equal(el.scrollTop, 7, "门假 ⇒ 零写（不夺阅读位）")
  assert.equal(factory.applyPin(null, true), null, "缺件 ⇒ 零写（零抛）")
  assert.equal(factory.applyPin(el, true), Number.MAX_SAFE_INTEGER, "回值 = 写入值（读数面）")
})

test("M-607a·createPinWatch 三律（假钟 ∕ 假事件）：近底无条件翻真+回调 ∕ 手势门内翻假+回调 ∕ 非手势位移不改", () => withFrozenClock(() => {
  const el = makeEl()
  const holder = { flag: "stale" }
  const seen = { near: 0, gesture: 0 }
  const watch = factory.createPinWatch(el, { holder, flagKey: "flag", gestureGateMs: 600, onNearBottom: () => { seen.near += 1 }, onGesture: () => { seen.gesture += 1 } })
  assert.equal(watch.attach(), true, "接线成功")
  assert.deepEqual(el.listeners.map((l) => l.type), ["wheel", "touchmove", "pointerdown", "scroll"], "门控模式事件集（手势三标记 + scroll 更新点）")
  assert.equal(el.listeners.every((l) => l.options?.passive === true), true, "全 passive")

  holder.flag = true
  setGap(el, 80) // 非手势远离底（无手势标记）
  el.fire("scroll")
  assert.equal(holder.flag, true, "非手势位移不改旗标")
  assert.equal(seen.gesture, 0, "无翻假 ⇒ 零让位回调")

  el.fire("wheel") // 手势标记（窗内）
  el.fire("scroll")
  assert.equal(holder.flag, false, "手势门内远离底 ⇒ 让位（翻假）")
  assert.equal(seen.gesture, 1, "让位回调（一次）")

  holder.flag = false
  setGap(el, 10)
  el.fire("scroll")
  assert.equal(holder.flag, true, "近底 ⇒ 无条件翻真（自愈）")
  assert.equal(seen.near, 1, "近底回调（清账路）")

  // 门外：手势过期 ⇒ 不改旗标
  const realNow = Date.now
  let now = realNow()
  Date.now = () => now
  try {
    holder.flag = true
    el.fire("pointerdown")
    now += 601
    setGap(el, 90)
    el.fire("scroll")
    assert.equal(holder.flag, true, "门外（>600ms）⇒ 不改旗标")
    assert.equal(seen.gesture, 1, "零新增让位回调")
  } finally { Date.now = realNow }
}))

test("M-607a·createPinWatch 直写模式（gestureGateMs = 0）：三事件同径按近底直写（活动区 ∕ 池列 ∕ 对话流现行语义）", () => {
  const el = makeEl()
  const holder = { flag: undefined }
  const watch = factory.createPinWatch(el, { holder, flagKey: "flag", gestureGateMs: 0 })
  watch.attach()
  assert.deepEqual(el.listeners.map((l) => l.type), ["wheel", "touchmove", "scroll"], "直写模式事件集（VSC `ui.js` 现行集——保持）")
  setGap(el, 10)
  el.fire("scroll")
  assert.equal(holder.flag, true, "近底 ⇒ 真")
  setGap(el, 80)
  el.fire("wheel")
  assert.equal(holder.flag, false, "直写：wheel 同径 ⇒ 假（旧 `ui.js` 三事件同读几何）")
  setGap(el, 10)
  el.fire("touchmove")
  assert.equal(holder.flag, true, "touchmove 同径 ⇒ 真")
  setGap(el, 24)
  el.fire("scroll")
  assert.equal(holder.flag, false, "恰 24 ⇒ 假（严格小于）")
})

test("M-607a·旗标宿主 holder（缺省 = el）：旗标维护单源 = `holder[flagKey]`", () => {
  const el = makeEl()
  const holder = { _pinBottom: undefined }
  const watch = factory.createPinWatch(el, { holder, flagKey: "_pinBottom", gestureGateMs: 0 })
  watch.attach()
  setGap(el, 5)
  el.fire("scroll")
  assert.equal(holder._pinBottom, true, "旗标挂 holder（VSC 面 = ctx）")
  assert.equal(el._pinBottom, undefined, "el 不落旗标")
  setGap(el, 90)
  el.fire("scroll")
  assert.equal(holder._pinBottom, false, "直写两向皆挂 holder")
  assert.equal(watch.read(), false, "`read()` = 宿主读数")
  watch.set(true)
  assert.equal(holder._pinBottom, true, "`set()` = 宿主写")
})

test("M-607a·handle：attach 幂等 ∕ detach ∕ 缺 el 零抛（夹具缺区）", () => {
  const el = makeEl()
  const watch = factory.createPinWatch(el, { flagKey: "flag" })
  assert.equal(watch.attach(), true, "首次接线")
  assert.equal(watch.attach(), false, "二次接线 ⇒ 幂等拒（零重挂）")
  assert.equal(el.listeners.length, 3, "监听集不重复（直写模式三事件）")
  assert.equal(watch.detach(), true, "detach")
  assert.equal(el.listeners.length, 0, "监听全摘")
  assert.equal(watch.detach(), false, "二次 detach ⇒ 幂等拒")
  const bare = factory.createPinWatch(null, { flagKey: "flag" })
  assert.equal(bare.attach(), false, "缺 el ⇒ 零动作（零抛）")
  assert.doesNotThrow(() => bare.set(true))
})

test("M-607a·createUnreadCounter 清帐三路簿记：bump ∕ clear ∕ read（读数归一；缺件零抛）", () => {
  const el = {}
  const counter = factory.createUnreadCounter(el, { countKey: "_poolNew" })
  assert.equal(counter.read(), 0, "缺省 ⇒ 0（禁假造）")
  assert.equal(counter.bump(), 1, "bump ⇒ +1")
  assert.equal(counter.bump(), 2, "bump ⇒ +1（累进）")
  assert.equal(el._poolNew, 2, "计数宿元素（无模块级态）")
  el._poolNew = "3"
  assert.equal(counter.read(), 0, "非整数 ⇒ 归一 0")
  counter.bump()
  assert.equal(el._poolNew, 1, "归一后 +1")
  assert.equal(counter.clear(), 0, "clear ⇒ 归零")
  assert.equal(el._poolNew, 0, "清账落元素")
  const bare = factory.createUnreadCounter(null, { countKey: "_poolNew" })
  assert.equal(bare.read(), 0, "缺件读 ⇒ 0")
  assert.equal(bare.bump(), 0, "缺件 bump ⇒ 零写回 0（不抛）")
  assert.equal(bare.clear(), 0, "缺件 clear ⇒ 零写回 0（不抛）")
})

// ─── M-607b 零本地判据副本源扫描 ────────────────────────────────────────────

test("M-607b·四载体零判据表达式 ∕ 零 `24` 字面（除工厂）；载体皆引工厂导出", () => {
  const criterion = /scrollHeight\s*-\s*[^;{}]*scrollTop/
  const lit24 = /(?<![\d-])24(?!\d)/
  const carriers = [
    {
      name: "块内容区",
      file: "thincoder-render-core/subblocks/block.mjs",
      refs: ['from "../scroll.mjs"', "NEAR_BOTTOM_PX", "createPinWatch", "applyPin"],
    },
    {
      name: "活动区（VSC）",
      file: "thincoder-vscode/webview/ui.js",
      refs: ["render-core/scroll.mjs", "createPinWatch", "applyPin"],
    },
    {
      name: "池列",
      file: "thincoder-desktop/renderer/views/activity-new.mjs",
      refs: ['from "/rc/scroll.mjs"', "createPinWatch", "applyPin", "createUnreadCounter"],
    },
    {
      name: "对话流",
      file: "thincoder-desktop/renderer/views/chat-scroll.mjs",
      refs: ['from "/rc/scroll.mjs"', "NEAR_BOTTOM_PX as FOLLOW_PX", "nearBottom", "applyPin"],
    },
  ]
  for (const carrier of carriers) {
    const src = readRepo(carrier.file)
    const rows = src.split("\n")
    // 判据副本 = **跨行容忍**扫（相邻两行窗口——单行式 ∕ 换行拆分式同收；`24` 字面仍逐行）
    const windows = rows.map((line, i) => (i === 0 ? line : `${rows[i - 1]}\n${line}`))
    for (const window of windows) {
      assert.ok(!criterion.test(window), `${carrier.name}（${carrier.file}）判据副本未清：${window.trim().replace(/\n/g, "⏎").slice(0, 100)}`)
    }
    for (const line of rows) {
      assert.ok(!lit24.test(line), `${carrier.name}（${carrier.file}）「24」字面残留：${line.trim().slice(0, 100)}`)
    }
    for (const ref of carrier.refs) assert.ok(src.includes(ref), `${carrier.name}（${carrier.file}）工厂引用缺：${ref}`)
  }
})

test("M-607b·反证（检查器有牙——防假绿）：单行 ∕ 跨行判据副本与 `24` 字面皆可判", () => {
  const criterion = /scrollHeight\s*-\s*[^;{}]*scrollTop/
  const lit24 = /(?<![\d-])24(?!\d)/
  const windowsOf = (src) => {
    const rows = src.split("\n")
    return rows.map((line, i) => (i === 0 ? line : `${rows[i - 1]}\n${line}`))
  }
  const single = "const gap = content.scrollHeight - content.scrollTop - content.clientHeight"
  const splitAfterMinus = "const gap = content.scrollHeight -\n  content.scrollTop - content.clientHeight"
  const splitBeforeMinus = "const gap = content.scrollHeight\n  - content.scrollTop - content.clientHeight"
  assert.ok(windowsOf(single).some((window) => criterion.test(window)), "单行副本可判红")
  assert.ok(windowsOf(splitAfterMinus).some((window) => criterion.test(window)), "跨行（减号后断行）副本可判红")
  assert.ok(windowsOf(splitBeforeMinus).some((window) => criterion.test(window)), "跨行（减号前断行）副本可判红")
  assert.ok(lit24.test("if (gap < 24) return true"), "「24」字面可判红")
})

// ─── M-607c 对拍腿升级：工厂单源 + 消费面断言 ────────────────────────────────

const { initDict, setStringsSink } = await import("../../thincoder-desktop/renderer/i18n.mjs")
const { setStrings } = await import("../../thincoder-render-core/i18n.mjs")
const { projectDictionary } = await import("../../thincoder-core/i18n.mjs")
setStringsSink(setStrings)
initDict({ locale: "en", dict: projectDictionary("en") })

test("M-607c·单值面：四载体同源阈值 = 唯一数值源（工厂 `NEAR_BOTTOM_PX`）", async () => {
  const core = await import("../../thincoder-render-core/subblocks/block.mjs")
  const { FOLLOW_PX } = await import("../../thincoder-desktop/renderer/views/chat-scroll.mjs")
  assert.equal(factory.NEAR_BOTTOM_PX, 24, "工厂唯一数值源")
  assert.equal(core.NEAR_BOTTOM_PX, factory.NEAR_BOTTOM_PX, "块载体再出口 = 工厂（同一值）")
  assert.equal(FOLLOW_PX, factory.NEAR_BOTTOM_PX, "对话流再出口 = 工厂（同一值——判据漂移 = 缺陷）")
})

test("M-607c·块内容区消费面：工厂接线四监听（passive）+ 三律行为 + 应用门两向", async () => withFrozenClock(async () => {
  const core = await import("../../thincoder-render-core/subblocks/block.mjs")
  const block = new FakeNode("details")
  block.classList.add("advisor-block", "sub-block")
  block.open = true
  const content = new FakeNode("div")
  content.className = "advisor-content"
  block.appendChild(content)
  core.initBlockFollow(block)
  assert.deepEqual(content.listeners.map((l) => l.type), ["wheel", "touchmove", "pointerdown", "scroll"], "监听集（工厂接线——手势三标记 + scroll）")
  assert.equal(content.listeners.every((l) => l.options?.passive === true), true, "全 passive")

  setGap(content, 10)
  content.fire("scroll")
  assert.equal(content._pinFollow, true, "近底 ⇒ 无条件翻真")
  setGap(content, 80)
  content.fire("wheel")
  content.fire("scroll")
  assert.equal(content._pinFollow, false, "手势门内远离底 ⇒ 让位")
  content.scrollTop = 120
  core.maybeScrollBlock(block)
  assert.equal(content.scrollTop, 120, "让位 ⇒ 零写（`applyPin` 门假）")
  setGap(content, 0)
  content.fire("scroll")
  core.maybeScrollBlock(block)
  assert.equal(content.scrollTop, Number.MAX_SAFE_INTEGER, "复跟 ⇒ 下一应用即写超值")
}))

test("M-607c·活动区消费面（VSC `ui.js` 四函数）：旗标宿主 `ctx` · 事件集保持 · 零行为变更", async () => {
  const ui = await import("../../thincoder-vscode/webview/ui.js")
  const messagesEl = new FakeNode("div")
  const ctx = { messagesEl, activityEl: null }
  ui.initScrollFollow(ctx) // 活动区缺件 ⇒ 零抛（夹具面）
  assert.equal(ctx._pinBottom, true, "initScrollFollow ⇒ 复跟缺省真")
  assert.equal(ctx._pinActivity, true, "活动区同真")
  assert.deepEqual(messagesEl.listeners.map((l) => l.type), ["wheel", "touchmove", "scroll"], "事件集保持（VSC 现行三事件）")

  setGap(messagesEl, 80)
  messagesEl.fire("scroll")
  assert.equal(ctx._pinBottom, false, "远离底 ⇒ 直写假（上滚解 pin）")
  messagesEl.scrollTop = 5
  ui.maybeScrollDown(ctx)
  assert.equal(messagesEl.scrollTop, 5, "未钉底 ⇒ 零写（不夺阅读位）")
  setGap(messagesEl, 10)
  messagesEl.fire("scroll")
  assert.equal(ctx._pinBottom, true, "近底 ⇒ 直写真（回底重 pin）")
  messagesEl.scrollTop = 5
  ui.maybeScrollDown(ctx)
  assert.equal(messagesEl.scrollTop, Number.MAX_SAFE_INTEGER, "钉底 ⇒ 写超值")

  ctx._pinBottom = false
  messagesEl.scrollTop = 5
  ui.scrollDown(ctx)
  assert.equal(messagesEl.scrollTop, Number.MAX_SAFE_INTEGER, "scrollDown ⇒ 无条件写（显式动作）")
  assert.equal(ctx._pinBottom, true, "scrollDown ⇒ 重 pin")

  const activityEl = new FakeNode("div")
  ctx.activityEl = activityEl
  ctx._pinActivity = false
  activityEl.scrollTop = 9
  ui.maybeScrollActivity(ctx)
  assert.equal(activityEl.scrollTop, 9, "活动区未钉底 ⇒ 零写")
  ctx._pinActivity = true
  ui.maybeScrollActivity(ctx)
  assert.equal(activityEl.scrollTop, Number.MAX_SAFE_INTEGER, "活动区钉底 ⇒ 写超值")
})

test("M-607c·池列消费面：`maybePinPool` 两向 + 计数簿记 + 接线（scroll 旗标 ∕ 钮点击清账）", async () => {
  const { maybePinPool, notePoolBirth, noteActivityBirth, activityNewCount, clearActivityNew, attachActivityNew } = await import("../../thincoder-desktop/renderer/views/activity-new.mjs")
  const root = new FakeNode("div")
  const head = new FakeNode("div")
  head.setAttribute("data-pool-head", "1")
  root.appendChild(head)

  root.scrollTop = 0
  maybePinPool(root)
  assert.equal(root.scrollTop, Number.MAX_SAFE_INTEGER, "缺省跟底 ⇒ 写超值")
  root.scrollTop = 30
  root._poolPin = false
  maybePinPool(root)
  assert.equal(root.scrollTop, 30, "未跟底 ⇒ 零写")

  assert.equal(notePoolBirth(root), true, "未跟底 ⇒ 计入新生")
  assert.equal(activityNewCount(root), 1, "计数 +1（工厂簿记）")
  assert.ok(root.querySelector(".activity-new-btn"), "钮在场（端钮形）")
  clearActivityNew(root)
  assert.equal(activityNewCount(root), 0, "清账 ⇒ 归零")
  assert.equal(root.querySelector(".activity-new-btn"), null, "清账 ⇒ 摘钮")

  const root2 = new FakeNode("div")
  const head2 = new FakeNode("div")
  head2.setAttribute("data-pool-head", "1")
  root2.appendChild(head2)
  assert.equal(attachActivityNew(root2), true, "接线（首次）")
  assert.equal(attachActivityNew(root2), false, "接线幂等")
  setGap(root2, 80)
  root2.fire("scroll")
  assert.equal(root2._poolPin, false, "远离底 ⇒ 直写假")
  noteActivityBirth(root2)
  assert.equal(activityNewCount(root2), 1, "让位期新生 ⇒ +1")
  const btn = root2.querySelector(".activity-new-btn")
  root2.fire("click", { target: btn })
  assert.equal(root2.scrollTop, Number.MAX_SAFE_INTEGER, "钮点击 ⇒ 回底（写口 = 工厂）")
  assert.equal(root2._poolPin, true, "钮点击 ⇒ 重 pin")
  assert.equal(activityNewCount(root2), 0, "钮点击 ⇒ 清账")
  setGap(root2, 80)
  noteActivityBirth(root2)
  setGap(root2, 10)
  root2.fire("scroll")
  assert.equal(root2._poolPin, true, "近底 ⇒ 翻真")
  assert.equal(activityNewCount(root2), 0, "近底 ⇒ 清账回调（watch 路）")
})

test("M-607c·对话流消费面：`FOLLOW_PX` 再出口 + `scrollAction` 边界（23 ∕ 24 ∕ 25）+ `stickToBottom` 写口", async () => {
  const { FOLLOW_PX, scrollAction, stickToBottom, STICK_TOP } = await import("../../thincoder-desktop/renderer/views/chat-scroll.mjs")
  assert.equal(FOLLOW_PX, factory.NEAR_BOTTOM_PX, "FOLLOW_PX = 工厂 NEAR_BOTTOM_PX（同一值）")
  const at = (gap) => ({ scrollTop: 900 - gap, scrollHeight: 1000, clientHeight: 100 })
  assert.equal(scrollAction(at(23)), "follow", "gap 23 < 24 ⇒ follow")
  assert.equal(scrollAction(at(24)), "unfollow", "恰 24 ⇒ 不判近底（严格小于）")
  assert.equal(scrollAction(at(25)), "unfollow", "gap 25 ⇒ unfollow")
  assert.equal(scrollAction({}), "follow", "零读数 ⇒ 归一 0 ⇒ follow（不误判停跟）")
  assert.equal(factory.nearBottom(at(23)), true, "判据同源（工厂导出——对话流经其消费）")
  const root = new FakeNode("div")
  assert.equal(stickToBottom(root), STICK_TOP, "贴底出口回值（读数面）")
  assert.equal(root.scrollTop, Number.MAX_SAFE_INTEGER, "贴底 ⇒ 写超值（不读 scrollHeight）")
  assert.equal(stickToBottom(null), null, "缺根 ⇒ null（零抛）")
})
