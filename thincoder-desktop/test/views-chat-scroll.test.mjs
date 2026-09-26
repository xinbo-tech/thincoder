/**
 * views-chat-scroll.test.mjs — E-3 滚动 / 增量 / 帧面纯判据用例（批档 §2.4 U63–U67 · 本批新档）：
 * 滚动三出口 / 视口补偿 / 窗限与摘要块 / 流式增量四档 + 窗口对齐步 / 跟滚停跟与药丸（假 root 接线 + store 读数 + 帧尾三写）。
 * 判据面 = 纯函数 + 假 root（零 DOM：`root` 只取三读数 + `addEventListener` / `scrollTo`）—— 真机滚动随冒烟。
 * 词面判据沿宿主表注入缝（`initDict({ host, dict })`）：哨兵值 ⇒ 断言即证「文案经 `t()` 消费」，不引字面。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { HOST_DICT, initDict } from "../renderer/i18n.mjs"
import {
  BACKFILL_PX,
  FOLLOW_PX,
  MAX_RENDER_BLOCKS,
  SMOOTH_MS,
  attachScroll,
  compensateTop,
  nextWindow,
  scrollAction,
  smoothWindowOpen,
  stickToBottom,
  tailAction,
} from "../renderer/views/chat-scroll.mjs"
import { alignPlan, blockKey, paintPlan, streamDelta } from "../renderer/views/chat-stream.mjs"
import { chatModel, chatTree } from "../renderer/views/chat.mjs"
import { appendBlock, beginBackfill, createStore, endBackfill, initialState, returnToBottom, setFollowing } from "../renderer/store.mjs"

/** 树遍历（深度优先 · 保序）：节点集 / 叶文本集共用（`null` 空位不入）。 */
function walk(tree, asText) {
  const out = []
  const visit = (child) => {
    if (child === null || child === undefined) return
    if (typeof child === "object" && typeof child.tag === "string") {
      if (!asText) out.push(child)
      for (const kid of Array.isArray(child.children) ? child.children : [child.children]) visit(kid)
      return
    }
    if (asText) out.push(String(child))
  }
  visit(tree)
  return out
}

const nodes = (tree) => walk(tree, false)
const texts = (tree) => walk(tree, true)
const withAttr = (tree, name) => nodes(tree).filter((node) => node.props?.[name] !== undefined)
const one = (tree, name) => withAttr(tree, name)[0]

/** 词面哨兵（同 `views-chat.test.mjs`）：插值键保留占位方言 ⇒ 断言同时钉「键 + 参数入词」。 */
const HOST_TEMPLATE = {
  "chat.pill.new": "⟦new:${n}⟧",
  "chat.summary.older": "⟦older:${n}⟧",
  "chat.tool.changes": "⟦chg:${files}+${add}-${del}⟧",
  "chat.tool.duration": "⟦dur:${seconds}⟧",
}
const CORE_WORD = ["sub.queued", "sub.running", "sub.done", "sub.stopped", "sub.error"]

function setupDict(ctx) {
  const host = Object.fromEntries(Object.keys(HOST_DICT.en).map((key) => [key, HOST_TEMPLATE[key] ?? `⟦${key}⟧`]))
  initDict({ locale: "en", host, dict: Object.fromEntries(CORE_WORD.map((key) => [key, `⟦${key}⟧`])) })
  ctx.after(() => initDict({}))
}

/** 假 root（测试缝）：三读数 + 订阅捕获 + `scrollTo` 记账 —— 零 DOM（设计面：`root` 只取三读数 + 两入口）。 */
function fakeRoot(metrics = {}) {
  return {
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
    listens: [],
    scrolls: [],
    ...metrics,
    addEventListener(type, listener, options) { this.listens.push({ type, listener, options }) },
    scrollTo(args) { this.scrolls.push(args) },
    fire() { for (const { listener } of this.listens) listener() },
  }
}

/** 帧态夹具（只给判据消费的键）· 块 / 存量块两小件。 */
const state = (over = {}) => ({
  activeSession: "s1",
  blocks: [],
  history: { hasOlder: false, inFlight: false, page: null },
  following: true,
  pendingNew: 0,
  locale: "en",
  ...over,
})
const user = (over = {}) => ({ kind: "user", text: "问题", ...over })
const many = (count) => Array.from({ length: count }, (_, index) => user({ id: `b${index + 1}` }))

// ─── U63 滚动三出口 ──────────────────────────────────────────

test("U63: 滚动三出口（触顶回填优先 ∧ 落底判 ∧ 两边界命中）", () => {
  const at = (scrollTop, over = {}) => ({ scrollTop, scrollHeight: 1000, clientHeight: 500, ...over })
  const older = { hasOlder: true, inFlight: false }

  assert.equal(scrollAction(at(10), older), "backfill", "触顶 ∧ 有更早 ∧ 非回填中 ⇒ backfill")
  assert.equal(scrollAction(at(BACKFILL_PX), older), "backfill", "边界：恰 BACKFILL_PX ⇒ 命中（<=）")
  assert.equal(scrollAction(at(BACKFILL_PX + 1), older), "unfollow", "越 BACKFILL_PX 一位 ⇒ 不触顶（中段 ⇒ unfollow）")
  assert.equal(scrollAction(at(0, { scrollHeight: 500 }), { hasOlder: true, inFlight: true }), "follow", "触顶 ∧ 回填中 ⇒ 该档不接 ⇒ 落底判（近底 ⇒ follow）")
  assert.equal(scrollAction(at(0, { scrollHeight: 500 }), { hasOlder: false }), "follow", "触顶 ∧ 无更早 ⇒ 落底判")
  assert.equal(scrollAction(at(500), {}), "follow", "距底 0 ⇒ follow")
  assert.equal(scrollAction(at(500 - FOLLOW_PX), {}), "follow", "边界：距底恰 FOLLOW_PX ⇒ 命中")
  assert.equal(scrollAction(at(500 - FOLLOW_PX - 1), {}), "unfollow", "距底 FOLLOW_PX + 1 ⇒ unfollow")
  assert.equal(scrollAction(at(0), {}), "unfollow", "触顶 ∧ 缺 guards ⇒ 恒假（不造事实：距底 500 ⇒ unfollow）")
  assert.equal(scrollAction(null), "follow", "零读数归一（缺 / 非载体 ⇒ 三读数 0）⇒ 高度差 0 ⇒ follow")
  assert.equal(scrollAction({ scrollTop: NaN, scrollHeight: 1000, clientHeight: 500 }), "unfollow", "非数读数 ⇒ 归 0 后照常判")
})

// ─── U64 视口补偿 ────────────────────────────────────────────

test("U64: 视口补偿（高增 / 高不变 / 高减）", () => {
  assert.equal(compensateTop({ prevTop: 100, prevHeight: 1000, nextHeight: 1200 }), 300, "高增（回填并入）⇒ prevTop + ΔH")
  assert.equal(compensateTop({ prevTop: 100, prevHeight: 1000, nextHeight: 1000 }), 100, "高不变 ⇒ 原值")
  assert.equal(compensateTop({ prevTop: 100, prevHeight: 1000, nextHeight: 800 }), -100, "高减 ⇒ 负增量（算式裸给，不钳制）")
  assert.equal(compensateTop({ prevTop: 100 }), 100, "缺高度 ⇒ ΔH 0")
  assert.equal(compensateTop(), 0, "缺参 ⇒ 0")
})

// ─── U65 窗限与摘要块 ────────────────────────────────────────

test("U65: 窗限与摘要块（收束沿增窗 ∧ hidden 三档 ∧ 角例）", (ctx) => {
  setupDict(ctx)

  assert.equal(nextWindow({ limit: MAX_RENDER_BLOCKS, inFlight: true }, false, 12), MAX_RENDER_BLOCKS + 12, "收束沿（真→假）⇒ 现限 + **实并入块数**（按实，非页量）")
  assert.equal(nextWindow({ limit: 240, inFlight: true }, false, 7), 247, "非默认限同律（现限 + 并入量）")
  assert.equal(nextWindow({ limit: 240, inFlight: false }, true, 12), 240, "起沿（假→真）⇒ 原值")
  assert.equal(nextWindow({ limit: 240, inFlight: false }, false, 12), 240, "恒假 ⇒ 原值")
  assert.equal(nextWindow({ inFlight: true }), MAX_RENDER_BLOCKS, "缺限 ⇒ 窗限默认；缺并入量 ⇒ 零增（增量按实 —— 不再由页量推定）")
  assert.equal(nextWindow({ limit: 240, inFlight: true }, false, -47), 240, "负增量（会话整置清窗）⇒ 零增（窗限只增）")

  const zero = chatModel(state({ blocks: many(3), history: { hasOlder: true, inFlight: false, page: null } }))
  assert.equal(zero.hidden, 0, "块数 ≤ 窗限 ⇒ hidden 0")
  assert.equal(withAttr(chatTree(zero), "data-summary").length, 0, "hidden 0 ⇒ 零摘要块（含 hasOlder 真角例）")

  const small = chatModel(state({ blocks: many(5) }), 2)
  assert.equal(small.hidden, 3, "越窗 ⇒ hidden = 块数 - 窗限")
  const smallTree = chatTree(small)
  assert.equal(smallTree.props["data-hidden"], 3, "根锚 data-hidden = 隐藏块数")
  assert.equal(smallTree.props["data-blocks"], 2, "根锚 data-blocks = 已渲染块数（DOM 块节点数）")
  const summary = one(smallTree, "data-summary")
  assert.equal(smallTree.children[0], summary, "摘要块 = 根首子（根子序 = 摘要 → 块 → 药丸）")
  assert.deepEqual(texts(summary), ["⟦older:3⟧"], "摘要文本 = chat.summary.older ∧ ${n} = hidden")

  const heavy = chatModel(state({ blocks: many(20) }), 2)
  assert.equal(heavy.hidden, 18, "超窗：hidden > 窗限（窗口整体轮转）")
  assert.deepEqual(texts(one(chatTree(heavy), "data-summary")), ["⟦older:18⟧"], "超窗档同形（n = hidden）")
})

// ─── U66 流式增量四档 + 窗口对齐步 ───────────────────────────

test("U66: 流式增量四档 + 窗口对齐步（块面 / 窗面两组）", () => {
  // 块面：比较对 = 两帧 `state.blocks`（引用比较，不深比内容）
  const a = user({ id: "a" })
  const b = { kind: "assistant", id: "b", text: "1" }
  const prev = [a, b]
  assert.deepEqual(streamDelta(prev, [a, b]), { kind: "none", index: -1 }, "逐位引用全等 ⇒ none")
  assert.deepEqual(streamDelta([a], [a, b]), { kind: "append", index: 1 }, "尾增一（前缀引用全等）⇒ append（index = 末位）")
  assert.deepEqual(streamDelta(prev, [a, { ...b, text: "12" }]), { kind: "patch", index: 1 }, "等长 ∧ 非尾位全等 ∧ 仅尾块换引用 ∧ 键等 ⇒ patch")
  assert.deepEqual(streamDelta(prev, [{ ...a }, b]), { kind: "reset", index: -1 }, "前部换引用 ⇒ reset")
  assert.deepEqual(streamDelta([a], [{ ...a }, b]), { kind: "reset", index: -1 }, "尾增一 ∧ 前缀引用变 ⇒ reset（不误判 append）")
  assert.deepEqual(streamDelta([a, b], [a]), { kind: "reset", index: -1 }, "长度减 ⇒ reset")
  assert.deepEqual(streamDelta(prev, [a, { ...b, id: "b2" }]), { kind: "reset", index: -1 }, "尾块键变 ⇒ reset")
  const c = { kind: "tool", id: "c", name: "Bash", status: "done" }
  assert.deepEqual(streamDelta([a, b, c], [a, b, { ...c, status: "error" }]), { kind: "patch", index: 2 }, "三块尾位：非尾块全等 ∧ 尾块键等 ⇒ patch（位标 = 末位）")
  assert.deepEqual(Object.keys(streamDelta(prev, [a, b])).sort(), ["index", "kind"], "出口形 = {kind, index}（闭集）")
  assert.deepEqual(prev.map((block) => block.id), ["a", "b"], "入参数组零变异（纯函数）")
  assert.equal(blockKey(a, 7), "a", "块键：有 id 用 id")
  assert.equal(blockKey(user(), 7), "7", "块键：无 id 用位序串（全列表位序域）")
  assert.equal(blockKey(undefined, 7), "7", "块键：空块用位序串")

  // 窗面：DOM 块节点序 ≡ 目标块序（重合 = 逐位引用等 · 取最大重合 ⇒ evict 最小）
  const mount = (list) => list.map((block) => ({ node: null, block }))
  const x = user({ id: "x" })
  const y = { kind: "assistant", id: "y", text: "1" }
  const z = { kind: "tool", id: "z", name: "Bash", status: "done" }
  assert.deepEqual(alignPlan(mount([x, y]), [x, y, z]), { evict: 0, prepend: 0, tail: [z], ok: true }, "追加 ⇒ 全重合 + 余段挂尾")
  assert.deepEqual(alignPlan(mount([x, y, z]), [y, z]), { evict: 1, prepend: 0, tail: [], ok: true }, "饱和滑窗 ⇒ 摘最旧 1（重合最大 ⇒ 摘最小）")
  assert.deepEqual(alignPlan(mount([x, y, z]), [z]), { evict: 2, prepend: 0, tail: [], ok: true }, "长滑窗 ⇒ 摘 2 留 1")
  assert.deepEqual(alignPlan(mount([y, z]), [x, y, z]), { evict: 0, prepend: 1, tail: [], ok: true }, "限增宽窗 ⇒ 头部前插 1（插点 = 块序首）")
  assert.deepEqual(alignPlan(mount([user({ id: "q" })]), [x]), { evict: 1, prepend: 0, tail: [x], ok: false }, "零重合 ⇒ ok false（该帧回落全量重挂）")
  assert.equal(alignPlan(mount([{ ...x }]), [x]).ok, false, "同内容异引用 ⇒ 零重合（重合判 = 引用等）")
  const patchPrev = [x, y]
  const patched = { ...y, text: "12" }
  assert.equal(alignPlan(mount(patchPrev), [x, patched]).ok, false, "尾块换引用（未豁免）⇒ 尾位破重合 ⇒ ok false")
  assert.deepEqual(alignPlan(mount(patchPrev), [x, patched], true), { evict: 0, prepend: 0, tail: [], ok: true }, "尾位豁免 ⇒ 前部重合守住（尾块由就地更新承接）")
})

// ─── U67 跟滚 / 停跟 / 药丸 + 帧尾三写 + 态刷断言 ─────────────

test("U67: 跟滚 / 停跟 / 药丸（假 root 接线 ∧ store 读数 ∧ 帧尾三写 ∧ 态刷）", (ctx) => {
  setupDict(ctx)
  const store = createStore(initialState())
  store.set({ activeSession: "s1" })
  let outlets = 0
  let backfills = 0
  const deps = {
    guards: () => ({ hasOlder: store.get().history.hasOlder, inFlight: store.get().history.inFlight }),
    onFollow: () => { outlets += 1; store.set(setFollowing(store.get(), true)) },
    onUnfollow: () => { outlets += 1; store.set(setFollowing(store.get(), false)) },
    onBackfill: () => { outlets += 1; backfills += 1; store.set(beginBackfill(store.get(), { page: 120 })) },
  }
  const root = fakeRoot({ scrollTop: 100, scrollHeight: 1000, clientHeight: 500 })
  assert.equal(attachScroll(null, deps), null, "根缺 ⇒ null（零接线）")
  assert.equal(attachScroll({}, deps), null, "根无订阅面 ⇒ null")
  const handle = attachScroll(root, deps)
  assert.equal(root.listens.length, 1, "唯一 scroll 订阅点")
  assert.equal(root.listens[0].type, "scroll", "订阅面类型 = scroll")
  assert.deepEqual(root.listens[0].options, { passive: true }, "订阅 passive（不阻塞滚动）")
  assert.equal(typeof root.listens[0].listener, "function", "订阅回调 = 三读数 → 判据 → 出口（经假 root 直调）")
  assert.deepEqual(handle.readMetrics(), { scrollTop: 100, scrollHeight: 1000, clientHeight: 500 }, "handle 读数面 = 根三读数归一")

  root.fire()
  assert.equal(store.get().following, false, "中段（距底 400）⇒ setFollowing(false) 出口")
  root.scrollTop = 500
  root.fire()
  assert.equal(store.get().following, true, "近底 ⇒ setFollowing(true) 出口（复跟）")

  store.set({ history: { hasOlder: true, inFlight: false, page: null } })
  root.scrollTop = 20
  root.fire()
  assert.equal(backfills, 1, "触顶 ∧ 有更早 ∧ 非在飞 ⇒ onBackfill 出口")
  assert.equal(store.get().history.inFlight, true, "回填出口 ⇒ beginBackfill 置在飞")
  root.fire()
  assert.equal(backfills, 1, "在飞中重触顶 ⇒ 不再受理（guards 只读取数驱动）")
  store.set(endBackfill(store.get()))
  root.scrollTop = 30
  root.fire()
  assert.equal(backfills, 2, "收束后再触顶 ⇒ 二页受理")

  assert.equal(store.get().following, false, "上滚后停跟态（药丸前提）")
  store.set(appendBlock(store.get(), { kind: "assistant", id: "m1", text: "一" }))
  store.set(appendBlock(store.get(), { kind: "assistant", id: "m2", text: "二" }))
  assert.equal(store.get().pendingNew, 2, "停跟中落块 ⇒ pendingNew 累加（块仍落树）")
  const pinned = chatTree(chatModel(store.get()))
  assert.equal(pinned.props["data-following"], "0", "停跟 ⇒ 根锚 0")
  assert.deepEqual(texts(one(pinned, "data-pill")), ["⟦new:2⟧"], "药丸文本 = chat.pill.new（${n} = 未读数）")
  store.set(returnToBottom(store.get()))
  assert.equal(store.get().following, true, "回底出口 ⇒ following 复真")
  assert.equal(store.get().pendingNew, 0, "回底出口 ⇒ pendingNew 清零")
  assert.equal(withAttr(chatTree(chatModel(store.get())), "data-pill").length, 0, "复跟 ⇒ 零药丸")

  const stamp = handle.returnToBottom()
  assert.deepEqual(root.scrolls, [{ top: 1000, behavior: "smooth" }], "程序化回底经 `scrollTo`（平滑）")
  assert.equal(handle.lastAt, stamp, "窗记点 = 回底时刻（帧尾贴底 / 补偿不记）")
  const before = outlets
  root.fire()
  assert.equal(outlets, before, "平滑窗内 ⇒ 零派发（抑制程序化回波）")
  assert.equal(smoothWindowOpen(SMOOTH_MS, 0), true, "窗判据边界：恰 SMOOTH_MS ⇒ 窗开")
  assert.equal(smoothWindowOpen(SMOOTH_MS - 1, 0), false, "窗判据：< SMOOTH_MS ⇒ 窗闭")
  handle.lastAt = Date.now() - SMOOTH_MS
  root.fire()
  assert.equal(outlets, before + 1, "出窗 ⇒ 派发恢复（窗只由 handle 记）")

  assert.equal(tailAction({ following: true, headMoves: 3 }), "stick", "帧尾三写①：跟滚 ⇒ 贴底（头动作无关）")
  const sticky = fakeRoot({ scrollTop: 40, scrollHeight: 900 })
  assert.equal(stickToBottom(sticky), 900, "贴底写值 = scrollHeight")
  assert.equal(sticky.scrollTop, 900, "跟滚帧 ⇒ 贴底写入")
  assert.equal(tailAction({ following: false, headMoves: 2 }), "compensate", "帧尾三写②：非跟滚 ∧ 头动作 > 0 ⇒ 补偿")
  const kept = fakeRoot({ scrollTop: 120 })
  kept.scrollTop = compensateTop({ prevTop: 120, prevHeight: 1000, nextHeight: 1240 })
  assert.equal(kept.scrollTop, 360, "非跟滚头动作帧 ⇒ 读区起点原地不动")
  assert.equal(tailAction({ following: false, headMoves: 0 }), "none", "帧尾三写③：非跟滚 ∧ 零头动作 ⇒ 零写")
  assert.equal(stickToBottom(null), null, "贴底出口根缺 ⇒ null（不抛）")

  const base = user({ id: "a0" })
  const frameA = state({ blocks: [base] })
  const first = paintPlan({ next: frameA, changedKeys: [] })
  assert.deepEqual({ remount: first.remount, refresh: first.refresh }, { remount: true, refresh: true }, "首帧 ⇒ 重挂 + 态刷恒真")
  const followed = paintPlan({ prev: frameA, next: { ...frameA, following: false }, changedKeys: ["following"] })
  assert.deepEqual(followed, { tier: "none", index: -1, remount: false, refresh: true }, "following 单变 ⇒ 无块动作 + 不重挂 + 态刷（N-1 修复点）")
  const unseen = paintPlan({ prev: frameA, next: { ...frameA, pendingNew: 1 }, changedKeys: ["pendingNew"] })
  assert.equal(unseen.remount, false, "pendingNew 单变 ⇒ 不重挂（药丸文本由态刷承接）")
  assert.equal(paintPlan({ prev: frameA, next: { ...frameA, activeSession: "s2" }, changedKeys: ["activeSession"] }).remount, true, "activeSession 变 ⇒ 全量重挂键")
  assert.equal(paintPlan({ prev: frameA, next: { ...frameA, locale: "zh" }, changedKeys: ["locale"] }).remount, true, "locale 变 ⇒ 全量重挂键")
  const appended = paintPlan({ prev: frameA, next: state({ blocks: [base, { kind: "assistant", id: "b0", text: "1" }] }), changedKeys: ["blocks"] })
  assert.deepEqual({ tier: appended.tier, index: appended.index }, { tier: "append", index: 1 }, "tier / index 直取 streamDelta 出口")
})
