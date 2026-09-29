/**
 * 2026-09-28-desktop-subblock-follow.test.mjs — 批次本地单元件（#518 桌面子 agent 块跟滚 · 随批留存归档）。
 * 名随批次档 · 住批次目录 · 不入仓套件；复跑 = `node --test docs/batches/2026-09-28-desktop-subblock-follow.test.mjs`
 * （本刻暂存 `.thincoder/tmp/` 同名件 —— 两层深 ⇒ 相对 import 与终位一致）。
 *
 * 被验面（批档 §2.5 测试面 + §2.7 验收 A1–A6）：
 *   ① 核原语 `thincoder-render-core/subblocks/block.mjs`（默认钉底写 ∕ 近底双向旗标 ∕ 让位零写 ∕ 守卫 no-op）；
 *   ② 桌面四点接线 `renderer/views/pool-subagents.mjs`（增量写 ∕ 让位零写 ∕ 接管默认跟底）；
 *   ③ 区钉底 `renderer/views/activity-new.mjs` `maybePinPool` 两向 + `notePoolBirth` 复用 + `mountPool` 帧尾接线；
 *   ④ 值落点锁 `renderer/core.css` 两规则逐字（值源 = VSC `webview/chat.css` 对拍）；
 *   ⑤ P2 对拍 —— VSC 改指：`webview/activity.js` 转口 === 核件单源（行为零变）。
 * harness = rc-resolve 钩子（`/rc/` 取核件 · 静态 import 先行）+ mini 假 DOM（`document` 最小实现 ∕ 事件面 ∕
 * 滚动读数面 —— 沿 `.thincoder/tmp/r5-readings.mjs` 先例）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何 /rc/ 取件注册）

// ─── mini 假 DOM（块构件族所需面 + 事件 ∕ 滚动读数 ∕ data 面桥接）──────────────

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
  replaceChildren(...nodes) { for (const c of this.children) c.parent = null; this.children = []; for (const n of nodes) this.appendChild(n) }
  remove() { if (this.parent) { const at = this.parent.children.indexOf(this); if (at >= 0) this.parent.children.splice(at, 1); this.parent.bump() } }
  replaceWith(next) { const p = this.parent; if (!p) return; const at = p.children.indexOf(this); p.children[at] = next; next.parent = p; p.bump() }
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
globalThis.acquireVsCodeApi = () => ({ postMessage() {}, getState: () => ({}), setState() {} }) // ⑤ VSC 档装载面

// ─── 端词典装配（核件取词经注册端出 —— 沿 r5 先例）+ 被验面取件 ──────────────

const { initDict, setStringsSink } = await import("../../thincoder-desktop/renderer/i18n.mjs")
const { setStrings } = await import("../../thincoder-render-core/i18n.mjs")
const { projectDictionary } = await import("../../thincoder-core/i18n.mjs")
setStringsSink(setStrings)
initDict({ locale: "en", dict: projectDictionary("en") })

const core = await import("../../thincoder-render-core/subblocks/block.mjs")
const { syncSubBlocks } = await import("../../thincoder-desktop/renderer/views/pool-subagents.mjs")
const { maybePinPool, notePoolBirth, activityNewCount } = await import("../../thincoder-desktop/renderer/views/activity-new.mjs")
const { mountPool } = await import("../../thincoder-desktop/renderer/views/activity.mjs")

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

/** 近底几何置位：gap = scrollHeight − scrollTop − clientHeight（client 100 ∕ 高 300）。 */
function setGap(content, gap) {
  content.clientHeight = 100
  content.scrollHeight = 300
  content.scrollTop = 200 - gap
}

const row = (text) => ({ kind: "text", text })
const liveEntry = (rows, extra = {}) => ({ key: "sub:coder#1", label: "coder#1", role: "coder", id: 1, status: "running", pool: true, frozen: false, rows, ...extra })
const poolState = (blocks) => ({
  activeSession: "1",
  pool: { approvals: [], queue: [], running: blocks.length, approval: 0 },
  subBlocks: { "1": blocks },
  poolCollapsed: {},
})
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..")

// ─── ① 核原语（initBlockFollow ∕ maybeScrollBlock）──────────────────────────

test("①核原语·默认钉底：旗标缺省 ⇒ 写超值 scrollTop（不读 scrollHeight）", () => {
  const block = makeBlock()
  const content = contentOf(block)
  content.scrollTop = 0
  core.maybeScrollBlock(block)
  assert.equal(content.scrollTop, Number.MAX_SAFE_INTEGER, "默认钉底 ⇒ 写超值")
})

test("①核原语·近底双向旗标：wheel ∕ touchmove ∕ scroll ⇒ 近底（< 24px）真 ∕ 远离假（恰 24 不判近底）", () => {
  const block = makeBlock()
  const content = contentOf(block)
  core.initBlockFollow(block)
  assert.deepEqual(content.listeners.map((l) => l.type), ["wheel", "touchmove", "scroll"], "三监听在场（scroll = 2026-09-29 补——「滚动已生效」唯一后触者；核件注释 ∕ sweep 波A #537 在册；断言随动 = 父侧 2026-09-29）")
  assert.equal(content.listeners.every((l) => l.options?.passive === true), true, "passive 监听（不夺滚动）")

  setGap(content, 10)
  content.fire("wheel")
  assert.equal(content._pinFollow, true, "近底 ⇒ 真")
  setGap(content, 40)
  content.fire("wheel")
  assert.equal(content._pinFollow, false, "远离 ⇒ 假")
  setGap(content, 23)
  content.fire("touchmove")
  assert.equal(content._pinFollow, true, "touchmove 同判 ⇒ 真")
  setGap(content, 24)
  content.fire("touchmove")
  assert.equal(content._pinFollow, false, "恰 24px 不判近底（严格小于）")
})

test("①核原语·让位零写：_pinFollow=false ⇒ 不动 scrollTop", () => {
  const block = makeBlock()
  const content = contentOf(block)
  content._pinFollow = false
  content.scrollTop = 120
  core.maybeScrollBlock(block)
  assert.equal(content.scrollTop, 120, "零写（不夺阅读位）")
})

test("①核原语·守卫 no-op：折叠 ∕ 已移除 ∕ 无内容区 —— 零滚动副作用 ∕ 零抛", () => {
  const folded = makeBlock({ open: false })
  contentOf(folded).scrollTop = 42
  core.maybeScrollBlock(folded)
  assert.equal(contentOf(folded).scrollTop, 42, "折叠（open=false）⇒ no-op")

  const gone = makeBlock({ connected: false })
  contentOf(gone).scrollTop = 42
  core.maybeScrollBlock(gone)
  assert.equal(contentOf(gone).scrollTop, 42, "已移除（!isConnected）⇒ no-op")

  const bare = makeBlock({ withContent: false })
  core.initBlockFollow(bare) // 内容区缺失 ⇒ 零操作（不抛）
  core.maybeScrollBlock(bare) // 内容区缺失 ⇒ 零写（不抛）
  assert.equal(contentOf(bare), null, "无内容区（零副作用）")
})

// ─── ② 桌面四点接线（syncSubBlocks 全通路）───────────────────────────────────

test("②桌面接线·出生 ∕ 增量 ⇒ 写：③挂载补钉即钉底；②内容增量随追加钉底（同 key 复用不重建）", () => {
  const root = new FakeNode("div")
  const family = new FakeNode("div")
  const entry = liveEntry([row("a")])
  syncSubBlocks(root, family, { blocks: [entry] })
  const element = family.querySelector(".sub-block")
  const content = contentOf(element)
  assert.ok(element !== null, "块出生（族内）")
  assert.equal(content.scrollTop, Number.MAX_SAFE_INTEGER, "③ 挂载补钉（出生即钉底）")

  content.scrollTop = 0
  syncSubBlocks(root, family, { blocks: [{ ...entry, rows: [row("a"), row("b")] }] })
  assert.equal(family.querySelectorAll(".sub-block").length, 1, "同 key 复用（不重建）")
  assert.equal(contentOf(family.querySelector(".sub-block")), content, "同一内容区元素")
  assert.equal(content.scrollTop, Number.MAX_SAFE_INTEGER, "② 内容增量 ⇒ 跟滚写（A1）")
})

test("②桌面接线·让位零写 ∕ 复跟：上滚（wheel 假旗标）后增量 ⇒ 零写；回近底 ⇒ 复跟（A2 ∕ A3）", () => {
  const root = new FakeNode("div")
  const family = new FakeNode("div")
  const entry = liveEntry([row("a")])
  syncSubBlocks(root, family, { blocks: [entry] })
  const content = contentOf(family.querySelector(".sub-block"))

  setGap(content, 40)
  content.fire("wheel") // ① 出生点监听在场（initBlockFollow 接线）
  assert.equal(content._pinFollow, false, "上滚 ⇒ 让位旗标假")
  content.scrollTop = 120
  syncSubBlocks(root, family, { blocks: [{ ...entry, rows: [row("a"), row("b")] }] })
  assert.equal(content.scrollTop, 120, "让位后增量 ⇒ 零写（不夺阅读位）")

  setGap(content, 10)
  content.fire("wheel")
  assert.equal(content._pinFollow, true, "回近底 ⇒ 旗标真")
  syncSubBlocks(root, family, { blocks: [{ ...entry, rows: [row("a"), row("b"), row("c")] }] })
  assert.equal(content.scrollTop, Number.MAX_SAFE_INTEGER, "回近底 ⇒ 复跟")
})

test("②桌面接线·接管 ⇒ 新元素默认跟底（④ 接管径补钉；旧块旗标不随迁）", () => {
  const root = new FakeNode("div")
  const family = new FakeNode("div")
  const frozen = { key: "sub:coder#1", label: "coder#1", role: "coder", id: 1, status: "done", frozen: true, rows: [row("old")] }
  syncSubBlocks(root, family, { blocks: [frozen] })
  const old = family.querySelector(".sub-block")
  assert.equal(old.open, false, "冻结着装（终态折叠）")
  contentOf(old)._pinFollow = false // 旧块让位态（不应随迁）

  syncSubBlocks(root, family, { blocks: [{ ...frozen, frozen: false, status: "running", id: 2, rows: [row("new")] }] })
  const next = family.querySelector(".sub-block")
  assert.notEqual(next, old, "同键新代 ⇒ 换新元素")
  assert.equal(family.querySelectorAll(".sub-block").length, 1, "旧块出表（族内恰一枚）")
  assert.equal(next.open, true, "新代展开")
  assert.equal(contentOf(next)._pinFollow, undefined, "旗标不随迁（默认跟底）")
  assert.equal(contentOf(next).scrollTop, Number.MAX_SAFE_INTEGER, "④ 接管径补钉：新元素跟底（A4）")
})

test("②桌面接线·冻结 ∕ 已移除 no-op：折叠块与离树块零滚动副作用（A4）", () => {
  const root = new FakeNode("div")
  const family = new FakeNode("div")
  syncSubBlocks(root, family, { blocks: [liveEntry([row("a")])] })
  const element = family.querySelector(".sub-block")
  element.open = false
  const content = contentOf(element)
  content.scrollTop = 7
  core.maybeScrollBlock(element)
  assert.equal(content.scrollTop, 7, "折叠 ⇒ no-op")
  element.isConnected = false
  syncSubBlocks(root, family, { blocks: [{ ...liveEntry([row("a"), row("b")]), key: "sub:other#9" }] })
  assert.equal(content.scrollTop, 7, "已移除 ∕ 出表 ⇒ 零写")
})

// ─── ③ 区钉底（maybePinPool ∕ notePoolBirth ∕ mountPool 帧尾）───────────────

test("③区钉底·两向：缺省跟底 ⇒ 写超值；上滚（_poolPin=false）⇒ 零写（A5）", () => {
  const root = new FakeNode("div")
  root.scrollTop = 0
  maybePinPool(root)
  assert.equal(root.scrollTop, Number.MAX_SAFE_INTEGER, "缺省 = 跟底 ⇒ 写")
  root.scrollTop = 30
  root._poolPin = false
  maybePinPool(root)
  assert.equal(root.scrollTop, 30, "未跟底 ⇒ 零写")
  assert.doesNotThrow(() => maybePinPool(null), "缺 root ⇒ 零动作")
})

test("③区钉底·出生径复用同一写：notePoolBirth 跟底 ⇒ 写；未跟底 ⇒ 零写 + 计数", () => {
  const root = new FakeNode("div")
  root.scrollTop = 0
  assert.equal(notePoolBirth(root), false, "跟底 ⇒ 不计新生")
  assert.equal(root.scrollTop, Number.MAX_SAFE_INTEGER, "出生径写 = maybePinPool 同一写")
  root._poolPin = false
  root.scrollTop = 41
  assert.equal(notePoolBirth(root), true, "未跟底 ⇒ 计入新生")
  assert.equal(root.scrollTop, 41, "未跟底 ⇒ 零写（不夺阅读位）")
  assert.equal(activityNewCount(root), 1, "计数 +1")
})

test("③区钉底·帧尾接线：mountPool 尾 maybePinPool（跟底写 ∕ 未跟底零写）", () => {
  const root = new FakeNode("div")
  const model = mountPool(root, poolState([liveEntry([row("a")])]))
  assert.equal(model.state, "pool", "有块 ⇒ pool 态")
  assert.equal(root.scrollTop, Number.MAX_SAFE_INTEGER, "帧尾钉底写")

  root._poolPin = false
  root.scrollTop = 17
  mountPool(root, poolState([liveEntry([row("a"), row("b")])]))
  assert.equal(root.scrollTop, 17, "未跟底 ⇒ 帧尾零写")
})

// ─── ④ 值落点锁（core.css 两规则逐字 = VSC 值源）─────────────────────────────

test("④值落点锁：块内容区 60px ∕ 表头 0.75 —— 与 VSC chat.css 值源逐字同（A6）", () => {
  const coreCss = readFileSync(join(repoRoot, "thincoder-desktop", "renderer", "core.css"), "utf8")
  const vscCss = readFileSync(join(repoRoot, "thincoder-vscode", "webview", "chat.css"), "utf8")
  const lineOf = (text, selector) => text.split("\n").find((l) => l.startsWith(selector))
  const sources = [".advisor-block.sub-block .advisor-content", ".advisor-block.sub-block > summary"]
  for (const selector of sources) {
    const source = lineOf(vscCss, selector)
    assert.ok(source !== undefined, `值源在场（VSC chat.css）：${selector}`)
    assert.ok(coreCss.split("\n").includes(source), `值面逐字同源（core.css）：${source}`)
  }
  assert.ok(coreCss.includes(".advisor-block.sub-block .advisor-content { max-height: 60px; }"), "60px 落点")
  assert.ok(coreCss.includes(".advisor-block.sub-block > summary { opacity: 0.75; }"), "0.75 落点")
})

// ─── ⑤ P2 对拍（VSC 改指 ⇒ 转口 === 核件单源）────────────────────────────────

test("⑤P2对拍：webview/activity.js 转口 === 核件 `maybeScrollBlock`（行为零变 · 两臂同效）", async () => {
  const vsc = await import("../../thincoder-vscode/webview/activity.js")
  assert.equal(typeof vsc.maybeScrollBlock, "function", "转口在场（streaming.js import 面零改）")
  assert.equal(vsc.maybeScrollBlock, core.maybeScrollBlock, "同一函数对象（核件单源）")

  const armVsc = makeBlock()
  vsc.maybeScrollBlock(armVsc)
  assert.equal(contentOf(armVsc).scrollTop, Number.MAX_SAFE_INTEGER, "VSC 面臂：默认钉底写")
  const armCore = makeBlock()
  contentOf(armCore)._pinFollow = false
  contentOf(armCore).scrollTop = 9
  core.maybeScrollBlock(armCore)
  assert.equal(contentOf(armCore).scrollTop, 9, "核件面臂：让位零写")
})
