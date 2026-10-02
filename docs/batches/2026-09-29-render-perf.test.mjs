/**
 * 2026-09-29-render-perf.test.mjs — 批内件（名随批次档 · 实施舱暂存 `.thincoder/tmp/`（`docs/batches/` 写面被拒 ⇒
 * 沿在册先例退舱；终位由父侧 copy 至 `docs/batches/`）· 不入仓套件 · 随批留存归档）。
 * ⚠ 部分断代（2026-10-01 · 台账 #764 拆批）：3/17 腿随拆失效（`streamDelta` ∥ `plannedMoves` 已随之删——旧机件）；复跑红（3）为预期 ∥ 余 14 腿仍绿——勿按红判回归。
 *
 * 覆盖 = 更新纪律收核批机检判据（批档 §2.5 AC-1–5 + R-5 机检半）：
 *   AC-1 帧合并件语义（多 `mark` 合并单次 `apply` ∕ 单飞 ∕ `minMs` 跳帧重排 ∕ `flush` 同步 ∕ `apply` 抛错语义）；
 *   AC-2 帧分派（键集 → 六面映射 · 每面 ≤1/帧 · 未知键零面）；
 *   AC-3 `appendToolOutput`（占位清 ∕ 追加 ∕ 超 64K 截断 + `_capped` 停收 ∕ 幂等）+ VSC 改指零行为变更对拍；
 *   AC-4 状态行面内差分门（模型等价 ⇒ 零写 · 子节点身份不变；模型变 ⇒ 更新）；
 *   AC-5 桌面既有纯件回归（`streamDelta` ∕ `alignPlan` ∕ `scrollAction` ∕ 归约族）+ 模型族出档回归 + 工具卡就地更新。
 * 语义单源 = `docs/batches/2026-09-29-render-perf.md` §2 ∕ `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-9。
 * **真机计时腿（R-1–R-4）= 父侧探针**（同批 `2026-09-29-render-perf-probe.mjs`）——本件只承平 node 腿。
 * 跑法（自仓库根 `thincoder/`）：`node --test .thincoder/tmp/2026-09-29-render-perf.test.mjs`
 * （两层深 ⇒ 相对 import 与终位 `docs/batches/` 一致，两处可跑）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于任何 /rc/ 取件注册）

// ─── 取件（rc 钩子注册后用动态 import）───────────────────────────────────────
const { createFrameMerge, FRAME_MIN_MS } = await import("../../thincoder-render-core/flow/frame.mjs")
const { appendToolOutput, STREAM_RENDER_MIN_MS } = await import("../../thincoder-render-core/flow/stream.mjs")
const { capText, MAX_TOOL_OUTPUT } = await import("../../thincoder-render-core/lib.mjs")
const { build } = await import("../../thincoder-desktop/renderer/dom.mjs")
const { dispatchFrame, faceHit, FRAME_FACES, SESSION_KEYS, HEAD_KEYS, CHAT_KEYS } = await import("../../thincoder-desktop/renderer/frame-dispatch.mjs")
const { STATUS_KEYS } = await import("../../thincoder-desktop/renderer/mount-status.mjs")
const { POOL_KEYS } = await import("../../thincoder-desktop/renderer/mount-pool.mjs")
const { CARDS_KEYS } = await import("../../thincoder-desktop/renderer/mount-cards.mjs")
const { mountStatus, sameStatusModel, statusModel } = await import("../../thincoder-desktop/renderer/views/statusline.mjs")
const { streamDelta, alignPlan, paintPlan } = await import("../../thincoder-desktop/renderer/views/chat-stream.mjs")
const { scrollAction, compensateTop, plannedMoves, stickToBottom, tailAction, nextWindow, STICK_TOP } = await import("../../thincoder-desktop/renderer/views/chat-scroll.mjs")
const { chatModel, retrySourceOf } = await import("../../thincoder-desktop/renderer/views/chat-model.mjs")
const { toolCard, patchToolCard, linkifyResult } = await import("../../thincoder-desktop/renderer/views/chat-tool.mjs")
const { reduce } = await import("../../thincoder-desktop/renderer/events.mjs")
const { initialState } = await import("../../thincoder-desktop/renderer/store.mjs")
const { initDict } = await import("../../thincoder-desktop/renderer/i18n.mjs")

// ─── 假件（帧合并注入面 ∕ 平 node 假 DOM）───────────────────────────────────

/** 假时钟 ∕ 假 rAF 帧列（帧合并件注入面 —— `raf` ∕ `now`）。 */
function harness(start = 1000) {
  const queue = []
  const applied = []
  let clock = start
  const frame = createFrameMerge({
    raf: (cb) => { queue.push(cb) },
    now: () => clock,
    apply: (keys) => { applied.push(keys) },
  })
  return {
    frame, queue, applied,
    at: (value) => { clock = value },
    tick: () => { for (const cb of queue.splice(0)) cb() },
  }
}

/** 假元素（`appendToolOutput` 面 —— duck-type 只读 ∕ 写 `textContent` 与 `_capped`；写数可计）。 */
function fakeTextEl(initial = "") {
  let text = initial
  let writes = 0
  return {
    _capped: false,
    get writes() { return writes },
    get textContent() { return text },
    set textContent(value) { text = String(value ?? ""); writes += 1 },
  }
}

/** 假 DOM 节点（`dom.mjs` 建树面最小 duck-type —— 属性 / 子序 / `[attr]` 选择器：AC-4 与工具卡就地更新两用）。 */
class FakeNode {
  constructor(tag = "div") {
    this.tagName = String(tag).toUpperCase()
    this.attrs = new Map()
    this.children = []
    this._text = ""
    this.parentNode = null
  }
  get textContent() {
    if (this.children.length === 0) return this._text
    return this._text + this.children.map((child) => (typeof child === "string" ? child : child.textContent)).join("")
  }
  set textContent(value) { this._text = String(value ?? ""); this.children.length = 0 }
  setAttribute(name, value) { this.attrs.set(name, String(value)) }
  getAttribute(name) { return this.attrs.has(name) ? this.attrs.get(name) : null }
  removeAttribute(name) { this.attrs.delete(name) }
  addEventListener() {}
  append(child) {
    if (child !== null && typeof child === "object") { child.parentNode = this; this.children.push(child) }
    else this.children.push(String(child))
  }
  insertBefore(child, ref) {
    const at = ref === null || ref === undefined ? -1 : this.children.indexOf(ref)
    if (at < 0) { this.append(child); return }
    child.parentNode = this
    this.children.splice(at, 0, child)
  }
  replaceChildren() { this.children.length = 0; this._text = "" }
  remove() {
    const parent = this.parentNode
    if (parent) parent.children.splice(parent.children.indexOf(this), 1)
    this.parentNode = null
  }
  replaceWith(next) {
    const parent = this.parentNode
    if (!parent) return
    const at = parent.children.indexOf(this)
    if (at >= 0) parent.children.splice(at, 1, next)
    next.parentNode = parent
    this.parentNode = null
  }
  matches(selector) {
    const hit = /^\[([\w-]+)(?:="([^"]*)")?\]$/.exec(selector)
    if (!hit) return false
    const value = this.getAttribute(hit[1])
    return hit[2] === undefined ? value !== null : value === hit[2]
  }
  querySelectorAll(selector) {
    const out = []
    const walk = (node) => {
      for (const child of node.children) {
        if (child === null || typeof child !== "object") continue
        if (child.matches(selector)) out.push(child)
        walk(child)
      }
    }
    walk(this)
    return out
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null }
}

/** 假 DOM 全局（`dom.mjs` 唯一构造点 = `document.createElement` + `instanceof Node`）。 */
function withFakeDom(fn) {
  const prevDoc = globalThis.document
  const prevNode = globalThis.Node
  globalThis.document = { createElement: (tag) => new FakeNode(tag) }
  globalThis.Node = FakeNode
  try { return fn() } finally { globalThis.document = prevDoc; globalThis.Node = prevNode }
}

// ─── AC-1 帧合并件语义（`flow/frame.mjs`）────────────────────────────────────

test("AC-1 T1 多 mark 合并单次 apply ∧ 单飞（挂起中重 mark 零重挂）", () => {
  const h = harness()
  h.frame.mark(["a", "b"])
  h.frame.mark(["b", "c"])
  assert.equal(h.queue.length, 1, "单飞：挂起中重 mark 不重挂")
  h.tick()
  assert.deepEqual(h.applied, [["a", "b", "c"]], "合并一次 apply（键集去重 · 插入序）")
})

test("AC-1 T2 minMs 跳帧重排（假钟）：< FRAME_MIN_MS 不绘 ⇒ 重排；≥ 间隔 ⇒ 绘", () => {
  const h = harness()
  h.frame.mark(["blocks"])
  h.tick()
  assert.deepEqual(h.applied, [["blocks"]], "首帧即绘")
  h.at(1010)
  h.frame.mark(["blocks"])
  h.tick()
  assert.equal(h.applied.length, 1, "窗内（+10ms）跳帧")
  assert.equal(h.queue.length, 1, "跳帧重排（挂起一帧）")
  h.at(1020)
  h.tick()
  assert.equal(h.applied.length, 1, "仍 < 50ms ⇒ 继续跳")
  h.at(1055)
  h.tick()
  assert.deepEqual(h.applied[1], ["blocks"], "≥ FRAME_MIN_MS ⇒ 绘")
  assert.equal(h.queue.length, 0)
  assert.equal(FRAME_MIN_MS, 50)
  assert.equal(FRAME_MIN_MS, STREAM_RENDER_MIN_MS, "与核流式渲染同值同意")
})

test("AC-1 T3 flush 同步尾帧（不待 rAF）∧ 空集零调 apply", () => {
  const h = harness()
  h.frame.mark(["following"])
  h.frame.flush()
  assert.deepEqual(h.applied, [["following"]], "flush 同步尾帧")
  h.tick()
  assert.equal(h.applied.length, 1, "挂起回调落空帧 ⇒ 零调（脏集已清）")
  h.frame.flush()
  assert.equal(h.applied.length, 1, "空集 flush 零调")
})

test("AC-1 T4 apply 抛错：脏集不重试 ∕ 抛错可见 ∕ 帧链不断（后续 mark ∕ 抛错帧内新 mark 均起新帧）", () => {
  const queue = []
  const applied = []
  let clock = 1000
  let bomb = true
  const frame = createFrameMerge({
    raf: (cb) => { queue.push(cb) },
    now: () => clock,
    apply: (keys) => { applied.push(keys); if (bomb) { frame.mark(["c"]); throw new Error("apply-boom") } },
  })
  frame.mark(["a"])
  assert.throws(() => queue.shift()(), /apply-boom/, "异常不吞（直抛）")
  assert.deepEqual(applied, [["a"]])
  assert.equal(queue.length, 1, "抛错帧内新 mark ⇒ 已排下一帧（帧链不断）")
  bomb = false
  clock = 1100
  queue.shift()()
  assert.deepEqual(applied[1], ["c"], "新帧 = 新键（同脏集不重试）")
  clock = 1200
  frame.mark(["b"])
  assert.equal(queue.length, 1, "单飞已复位 ⇒ 后续 mark 照常起帧")
  queue.shift()()
  assert.deepEqual(applied[2], ["b"])
})

test("AC-1 T5 apply 内新 mark ⇒ 落下一帧（不递归同帧）", () => {
  const queue = []
  const applied = []
  let clock = 1000
  let once = true
  const frame = createFrameMerge({
    raf: (cb) => { queue.push(cb) },
    now: () => clock,
    apply: (keys) => { applied.push(keys); if (once) { once = false; frame.mark(["x"]) } },
  })
  frame.mark(["a"])
  queue.shift()()
  assert.deepEqual(applied, [["a"]], "同帧只绘本次脏集")
  assert.equal(queue.length, 1, "apply 内 mark ⇒ 新帧挂起")
  clock = 1100
  queue.shift()()
  assert.deepEqual(applied[1], ["x"])
})

// ─── AC-2 帧分派（`renderer/frame-dispatch.mjs`）─────────────────────────────

test("AC-2 T1 键集 → 六面映射（每面 ≤1/帧 · 六面表 = 权威键集）", () => {
  const hit = []
  const faces = {}
  for (const [name] of FRAME_FACES) faces[name] = (state, dirtyKeys) => hit.push([name, dirtyKeys, state])
  const painted = dispatchFrame({ dirtyKeys: ["blocks", "locale"], state: { tag: 1 }, faces })
  assert.deepEqual(painted, ["sessionBar", "head", "status", "chat", "pool", "cards"], "locale ∈ 全六面键集 ⇒ 六面全绘")
  assert.equal(hit.filter(([name]) => name === "chat").length, 1, "每面每帧至多一次")
  assert.equal(hit[0][2].tag, 1, "state 透传")
  hit.length = 0
  assert.deepEqual(dispatchFrame({ dirtyKeys: ["blocks"], state: null, faces }), ["status", "chat"], "blocks ∈ STATUS_KEYS ∧ CHAT_KEYS")
  hit.length = 0
  assert.deepEqual(dispatchFrame({ dirtyKeys: ["nope"], state: null, faces }), [], "未知键零面")
  assert.equal(hit.length, 0, "未知键零回调")
  assert.equal(FRAME_FACES.length, 6)
  assert.equal(FRAME_FACES[0][1], SESSION_KEYS)
  assert.equal(FRAME_FACES[1][1], HEAD_KEYS)
  assert.equal(FRAME_FACES[2][1], STATUS_KEYS)
  assert.equal(FRAME_FACES[3][1], CHAT_KEYS)
  assert.equal(FRAME_FACES[4][1], POOL_KEYS)
  assert.equal(FRAME_FACES[5][1], CARDS_KEYS)
  assert.ok(CHAT_KEYS.includes("blocks") && CHAT_KEYS.includes("history") && !CHAT_KEYS.includes("settings"), "对话流键面回归")
})

test("AC-2 T2 faceHit 形不合恒假 ∧ 回调缺省零动作（不抛）", () => {
  assert.equal(faceHit(["a"], ["a", "b"]), true)
  assert.equal(faceHit(["c"], ["a"]), false)
  assert.equal(faceHit(null, ["a"]), false)
  assert.equal(faceHit(["a"], null), false)
  assert.deepEqual(dispatchFrame({ dirtyKeys: ["locale"], state: null, faces: {} }), [], "回调缺 ⇒ 该面零动作")
  assert.deepEqual(dispatchFrame({}), [])
})

// ─── AC-3 `appendToolOutput`（`flow/stream.mjs`）＋ R-5 改指对拍 ──────────────

test("AC-3 T1 占位清 ∕ 追加 ∕ 幂等（空串零写）", () => {
  const el = fakeTextEl("placeholder")
  appendToolOutput(el, "a", { initial: "placeholder" })
  assert.equal(el.textContent, "a", "占位清 ⇒ 首 chunk 落位")
  appendToolOutput(el, "b", { initial: "placeholder" })
  assert.equal(el.textContent, "ab")
  const writes = el.writes
  appendToolOutput(el, "")
  assert.equal(el.textContent, "ab")
  assert.equal(el.writes, writes, "空串零写")
  appendToolOutput(null, "x")
  assert.equal(appendToolOutput(el, 42), el, "非串 chunk 视为空（零写）· 返回 el")
})

test("AC-3 T2 超 64K 截断 + `_capped` 停收（注字面 = `capText` 单源）", () => {
  const note = "…(输出过长已截断)"
  const el = fakeTextEl("x".repeat(MAX_TOOL_OUTPUT))
  appendToolOutput(el, "y")
  assert.equal(el.textContent, capText("x".repeat(MAX_TOOL_OUTPUT) + "y"), "截断字面 = `capText` 缺省注单源")
  assert.equal(el.textContent.length, MAX_TOOL_OUTPUT + note.length)
  assert.equal(el._capped, true)
  const writes = el.writes
  appendToolOutput(el, "z".repeat(4096))
  assert.equal(el.writes, writes, "已截断 ⇒ 停收（零写）")
  assert.equal(el.textContent, capText("x".repeat(MAX_TOOL_OUTPUT) + "y"))
})

test("AC-3 T3 R-5 对拍：VSC 改指零行为变更（逐 chunk 序列与源档算法等价）", () => {
  // 源档算法逐字（VSC `webview/chat-messages.js` toolOutput 支修前形 —— 参照模型）
  const legacy = (state, chunk) => {
    if (state.text === "tool.initial") state.text = ""
    if (!state.capped) {
      state.text += chunk
      if (state.text.length > MAX_TOOL_OUTPUT) {
        state.text = state.text.slice(0, MAX_TOOL_OUTPUT) + "…(输出过长已截断)"
        state.capped = true
      }
    }
  }
  const chunks = ["hello\n", "x".repeat(30000), "", "y".repeat(40000), "z".repeat(1000)]
  const ref = { text: "tool.initial", capped: false }
  const el = fakeTextEl("tool.initial")
  for (const chunk of chunks) {
    legacy(ref, chunk)
    appendToolOutput(el, chunk, { initial: "tool.initial" })
    assert.equal(el.textContent, ref.text, `逐 chunk 内容对拍（chunk=${chunk.length} chars）`)
    assert.equal(el._capped === true, ref.capped === true, "截断位对拍")
  }
  assert.equal(ref.capped, true, "序列覆盖截断径（对拍有效）")
})

// ─── AC-4 状态行面内差分门（`views/statusline.mjs`）─────────────────────────

test("AC-4 T1 `sameStatusModel`：等价 ⇒ 真；段 / 告警 / 目标位任一异 ⇒ 假", () => {
  const base = { activeSession: "k", usage: { k: 24 }, usageTokens: { k: 12345 }, ledgerMarker: { text: "台账 1·2", warn: false } }
  const a = statusModel({ ...base, now: 1000 })
  const b = statusModel({ ...base, now: 1000 })
  assert.equal(sameStatusModel(a, b), true)
  assert.equal(sameStatusModel(a, statusModel({ ...base, usage: { k: 80 }, now: 1000 })), false, "段文本变 ⇒ 假")
  assert.equal(sameStatusModel(a, statusModel({ ...base, ledgerMarker: { text: "台账 1·2", warn: true }, now: 1000 })), false, "warn 位变 ⇒ 假")
  assert.equal(sameStatusModel(a, statusModel({ ...base, goal: { k: { status: "active", objective: "o" } }, now: 1000 })), false, "目标徽标位变 ⇒ 假")
  assert.equal(sameStatusModel(undefined, a), false, "首帧（无上帧模型）⇒ 假")
  assert.equal(sameStatusModel(a, a), true)
})

test("AC-4 T2 `mountStatus` 差分门：等价 ⇒ 零写（子节点身份不变）· 变 ⇒ 更新", () => {
  withFakeDom(() => {
    const root = new FakeNode("div")
    const state = { activeSession: "k", usage: { k: 24 }, usageTokens: { k: 12345 }, ledgerMarker: { text: "台账 1·2", warn: false } }
    initDict({ locale: "en" })
    const first = mountStatus(root, state)
    assert.ok(root.children.length > 0, "首挂 ⇒ 建树")
    const kids = root.children.slice()
    const second = mountStatus(root, state)
    assert.deepEqual(root.children, kids, "模型等价 ⇒ 零写（子节点身份不变）")
    assert.equal(root.children[0], kids[0])
    assert.equal(sameStatusModel(first, second), true)
    const third = mountStatus(root, { ...state, usage: { k: 80 } })
    assert.notEqual(root.children[0], kids[0], "模型变 ⇒ 更新（新节点）")
    assert.equal(third.segments.find((seg) => seg.code === "context").warn, true, "≥ 80 ⇒ 警示位随动")
  })
})

// ─── 工具卡就地更新（#605 判据平 node 半 —— 真机腿 = R-3 探针）───────────────

test("工具卡就地更新：结果区节点身份不变（跨 chunk）· 收束换代全量改写 · 折叠摘 / 建", () => {
  withFakeDom(() => {
    initDict({ locale: "en" })
    const running = { kind: "tool", id: "t1", name: "bash", argsSummary: "ls", status: "running", result: "row-1\n" }
    const node = build(toolCard(running, "k1", {}))
    const body = node.querySelector("[data-tool-result]")
    assert.ok(body, "运行期 ⇒ 结果区在场（默认展开）")
    patchToolCard(node, { ...running, result: "row-1\nrow-2\n" }, "k1", {})
    patchToolCard(node, { ...running, result: "row-1\nrow-2\nrow-3\n" }, "k1", {})
    assert.equal(node.querySelector("[data-tool-result]"), body, "跨 chunk 结果区节点身份不变（#605）")
    assert.equal(body.textContent, "row-1\nrow-2\nrow-3\n", "增量追加（O(chunk)）")
    const head = node.querySelector("[data-tool-head]")
    assert.equal(head.getAttribute("data-status"), "running")
    const settled = { kind: "tool", id: "t1", name: "bash", argsSummary: "ls", status: "done", durationMs: 1200, expanded: true, result: "[stdout]:\nrow-7\n(exit code 0)" }
    patchToolCard(node, settled, "k1", {})
    assert.equal(node.querySelector("[data-tool-result]"), body, "收束换代仍同元素（身份不变）")
    assert.equal(body.textContent, capText(settled.result), "收束文本非流式前缀 ⇒ 全量改写（沿 VSC 同径）")
    assert.equal(node.querySelector("[data-tool-head]").getAttribute("data-status"), "done")
    patchToolCard(node, { ...settled, status: "error", expanded: undefined }, "k1", {})
    assert.equal(node.querySelector("[data-tool-result]"), body, "错误态（缺省展开）⇒ 仍同元素")
    patchToolCard(node, { ...settled, expanded: false }, "k1", {})
    assert.equal(node.querySelector("[data-tool-result]"), null, "折叠态 ⇒ 结果区摘除")
    patchToolCard(node, { ...settled, expanded: true }, "k1", {})
    assert.ok(node.querySelector("[data-tool-result]") !== null, "再展开 ⇒ 结果区重建")
  })
})

// ─── 链接着装幂等闸（评审轮 1 · 🟡#1 修复覆盖）─────────────────────────────

test("链接着装幂等闸：同 `links` 引用只着装一次（防 `.file-link` 嵌层）· `links` 换代 ⇒ 重着", () => {
  withFakeDom(() => {
    initDict({ locale: "en" })
    const links = [{ raw: "a.js", path: "/x/a.js" }]
    const block = { kind: "tool", id: "t1", name: "bash", status: "done", expanded: true, result: "see a.js", links }
    const node = build(toolCard(block, "k1", {}))
    let calls = 0
    const spy = () => { calls += 1 }
    linkifyResult(node, block, spy)
    linkifyResult(node, { ...block }, spy) // 同 `links` 引用（展开复制引用）
    assert.equal(calls, 1, "同引用 ⇒ 只着装一次")
    linkifyResult(node, { ...block, links: [{ raw: "a.js", path: "/x/a.js" }] }, spy)
    assert.equal(calls, 2, "links 换代 ⇒ 重着")
    linkifyResult(build(toolCard({ ...block, result: "", links: undefined }, "k2", {})), { kind: "tool", links: [] }, spy)
    assert.equal(calls, 2, "零链接 ° 零体 ⇒ 零动作")
  })
})

// ─── AC-5 既有纯件回归（`chat-stream.mjs` ∕ `chat-scroll.mjs` ∕ 归约族 ∕ 模型族）──

test("AC-5 T1 streamDelta ∕ alignPlan ∕ paintPlan 回归", () => {
  const a = { kind: "assistant", text: "a" }
  const b = { kind: "assistant", text: "b" }
  const c = { kind: "assistant", text: "c" }
  assert.deepEqual(streamDelta([a], [a, b]), { kind: "append", index: 1 })
  assert.deepEqual(streamDelta([a], [{ ...a, text: "a2" }]), { kind: "patch", index: 0 })
  assert.deepEqual(streamDelta([a], [a]), { kind: "none", index: -1 })
  assert.deepEqual(streamDelta([a, b], [b, a]), { kind: "reset", index: -1 })
  const mounted = [{ node: {}, block: a }, { node: {}, block: b }]
  const plan = alignPlan(mounted, [a, b, c])
  assert.deepEqual({ evict: plan.evict, prepend: plan.prepend, tail: plan.tail.length, ok: plan.ok }, { evict: 0, prepend: 0, tail: 1, ok: true })
  assert.equal(alignPlan([], [a]).ok, false, "零重合 ⇒ 回落重挂")
  assert.equal(alignPlan(mounted, [a, b], true).evict, 0, "patch 档尾位豁免")
  assert.equal(paintPlan({ prev: null, next: { blocks: [] }, changedKeys: [] }).remount, true, "首帧重挂")
  assert.equal(paintPlan({ prev: { blocks: [] }, next: { blocks: [] }, changedKeys: ["locale"] }).remount, true, "全量键重挂")
  assert.equal(paintPlan({ prev: { blocks: [] }, next: { blocks: [] }, changedKeys: ["following"] }).remount, false)
})

test("AC-5 T2 scrollAction ∕ compensateTop ∕ tailAction ∕ plannedMoves ∕ stickToBottom（写超值不读）", () => {
  assert.equal(scrollAction({ scrollTop: 0, scrollHeight: 1000, clientHeight: 100 }, { hasOlder: true, inFlight: false }), "backfill")
  assert.equal(scrollAction({ scrollTop: 890, scrollHeight: 1000, clientHeight: 100 }, {}), "follow")
  assert.equal(scrollAction({ scrollTop: 500, scrollHeight: 1000, clientHeight: 100 }, {}), "unfollow")
  assert.equal(compensateTop({ prevTop: 100, prevHeight: 1000, nextHeight: 1200 }), 300)
  assert.equal(tailAction({ following: true, headMoves: 3 }), "stick")
  assert.equal(tailAction({ following: false, headMoves: 2 }), "compensate")
  assert.equal(tailAction({ following: false, headMoves: 0 }), "none")
  assert.equal(plannedMoves({ evict: 5, prepend: 2 }, 2, 1), 3, "夹取：min(5,2)+min(2,1)")
  assert.equal(plannedMoves({ evict: 0, prepend: 0 }, 10, 10), 0)
  assert.equal(nextWindow({ limit: 200, inFlight: true }, false, 7), 207, "收束沿 + 实并入块数")
  let reads = 0
  const root = { scrollTop: 0, get scrollHeight() { reads += 1; return 12345 } }
  const written = stickToBottom(root)
  assert.equal(reads, 0, "写超值不读 scrollHeight（读数裁剪）")
  assert.equal(root.scrollTop, STICK_TOP)
  assert.ok(STICK_TOP > 12345)
  assert.equal(written, STICK_TOP)
})

test("AC-5 T3 归约族回归（token ∕ tool 三径）+ 模型族出档后语义", () => {
  const base = { ...initialState(), activeSession: "1" }
  const s1 = reduce(base, { channel: "ev:token", key: "1", text: "hi" })
  assert.equal(s1.blocks.length, 1)
  assert.equal(s1.blocks[0].kind, "assistant")
  const s2 = reduce(s1, { channel: "ev:token", key: "1", text: "!" })
  assert.equal(s2.blocks[0].text, "hi!")
  const s3 = reduce(s2, { channel: "ev:tool-call", key: "1", name: "bash", argsSummary: "ls", id: "t1" })
  assert.equal(s3.blocks.length, 2)
  assert.equal(s3.blocks[1].status, "running")
  const s4 = reduce(s3, { channel: "ev:tool-output", key: "1", id: "t1", text: "out-1" })
  const s5 = reduce(s4, { channel: "ev:tool-output", key: "1", id: "t1", text: "out-2" })
  assert.equal(s5.blocks[1].result, "out-1out-2")
  const s6 = reduce(s5, { channel: "ev:tool-result", key: "1", id: "t1", ok: true, result: "final" })
  assert.equal(s6.blocks[1].status, "done")
  assert.equal(s6.blocks[1].result, "final")
  const s7 = reduce(s6, { channel: "ev:token", key: "other", text: "x" })
  assert.equal(s7.blocks, s6.blocks, "非活动键 ⇒ 块面原引用（零落入）")
  const model = chatModel({ ...initialState(), activeSession: "1", blocks: s6.blocks })
  assert.equal(model.state, "flow")
  assert.deepEqual(model.blocks, s6.blocks)
  assert.equal(retrySourceOf(s6.blocks), null)
  assert.equal(retrySourceOf([...s6.blocks, { kind: "user", text: "again" }]), "again")
  assert.equal(chatModel({ ...initialState(), activeSession: null }).state, "none")
  assert.equal(chatModel({ ...initialState(), activeSession: "1" }).state, "empty")
})
