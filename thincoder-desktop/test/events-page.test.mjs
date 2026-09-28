/**
 * events-page.test.mjs — E-4 事件归约面用例（批档 §2.4 U90–U92 · 本批新档 · 300 行拆分层落形：
 * 归约与订阅面住 `test/events-reduce.test.mjs`）：
 *   ④ `activeSession` 与页应用（U90）· ⑤ 审批入卡入池与出站后清除（U91 / U92）。
 * 平 node 直测：零 DOM（树读数走 `chatModel` / `chatTree` 与 `poolModel` / `poolTree` 纯函数面）· 零 electron · 零网 ——
 * 假 host（回执表）+ 假 store（`createStore` 单例面）。
 * 词面零字面：断言只钉结构锚（`data-*` / 键集 / 引用等值），不引文案副本。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { applyFlags, applyPage, openSession, reduce } from "../renderer/events.mjs"
import { createStore, initialState } from "../renderer/store.mjs"
import { STATUS_KEYS } from "../renderer/mount-status.mjs"
import { submitVerdict } from "../renderer/mount-pool.mjs"
import { chatModel, chatTree } from "../renderer/views/chat.mjs"
import { poolModel, poolTree } from "../renderer/views/activity.mjs"

const KEY = "1"
/** 待决项键白名单（`views/activity.mjs` 读取集 —— 零新键）。 */
const ITEM_KEYS = ["promptId", "shape", "tool", "argsSummary", "changes", "batch"]

/** 活动会话态（页数据随 `history:page` 回执整置 ⇒ 夹具按需补 `blocks` / `history`）。 */
const stateOf = (patch = {}) => ({ ...initialState(), activeSession: KEY, ...patch })

/** 树遍历（深度优先 · 保序）：节点集（`null` 空位 / 文本串不进）。 */
function nodes(tree) {
  const out = []
  const visit = (child) => {
    if (child === null || child === undefined) return
    if (Array.isArray(child)) {
      for (const item of child) visit(item)
      return
    }
    if (typeof child !== "object" || typeof child.tag !== "string") return
    out.push(child)
    visit(child.children)
  }
  visit(tree)
  return out
}

/** 锚点筛（`props[name]` 在场）。 */
const pick = (tree, name) => nodes(tree).filter((node) => node.props?.[name] !== undefined)
/** 出口锚（`data-action` 值集 —— 卡面与池面同表消费）。 */
const actionsOf = (tree) => pick(tree, "data-action").map((node) => node.props["data-action"])

test("U90 activeSession + 页应用：开 / 关页 · 首屏两径 · 回填 · 失败径", () => {
  const blank = stateOf()
  assert.equal(openSession(blank, "2").activeSession, "2", "开页置键")
  assert.equal(openSession(blank, 2).activeSession, "2", "数值键 ⇒ 串化")
  assert.equal(openSession(blank, null).activeSession, null, "关页 ⇒ null")
  assert.equal(openSession(blank, undefined).activeSession, null)
  assert.equal(openSession(blank, KEY), blank, "同键无变化 ⇒ 原引用")

  const page = {
    ok: true,
    hasOlder: true,
    next: 40,
    meta: { model: "k2" },
    messages: [
      { kind: "user", text: "hi" },
      { kind: "assistant", text: "yo", reasoning: "r", tools: [{ id: "t9", name: "grep", args: "x", result: "ok" }] },
    ],
  }
  const stale = stateOf({ blocks: [{ kind: "error", text: "stale" }], following: false, pendingNew: 3 })
  const first = applyPage(stale, page, { key: KEY, before: null })
  assert.deepEqual(first.blocks.map((block) => block.kind), ["user", "assistant", "reasoning", "tool"], "首屏非空 ⇒ 整置（旧块皆去）")
  assert.deepEqual(Object.keys(first.blocks.at(-1)).sort(), ["argsSummary", "id", "kind", "name", "result"], "页块面不落 status / durationMs")
  assert.equal(first.following, true, "回底")
  assert.equal(first.pendingNew, 0)
  assert.deepEqual(first.history, { hasOlder: true, inFlight: false, page: 40 })

  const blankPage = applyPage(first, { ok: true, messages: [], hasOlder: false, next: null, meta: {} }, { key: KEY, before: null })
  assert.deepEqual(blankPage.blocks, [], "首屏空 ⇒ 零块")
  assert.deepEqual(blankPage.history, { hasOlder: false, inFlight: false, page: null }, "next === null ⇔ hasOlder === false")

  const older = applyPage(first, { ok: true, messages: [{ kind: "user", text: "old" }], hasOlder: false, next: 12, meta: {} }, { key: KEY, before: 40 })
  assert.deepEqual(older.blocks.map((block) => block.kind), ["user", "user", "assistant", "reasoning", "tool"], "回填 ⇒ 前插")
  assert.deepEqual(older.history, { hasOlder: false, inFlight: false, page: null }, "hasOlder=false ⇒ page 归 null")
  const mid = applyPage(first, { ok: true, messages: [{ kind: "user", text: "old" }], hasOlder: true, next: 20, meta: {} }, { key: KEY, before: 40 })
  assert.deepEqual(mid.history, { hasOlder: true, inFlight: false, page: 20 })

  const failed = applyPage({ ...first, history: { hasOlder: true, inFlight: true, page: 40 } }, { ok: false, reason: "boom" }, { key: KEY, before: 40 })
  assert.equal(failed.history.inFlight, false, "失败径 ⇒ 清在途（成败皆清）")
  assert.equal(failed.blocks, first.blocks, "失败径 ⇒ 块零改（原引用）")

  const stray = applyPage(first, { ok: true, messages: [{ kind: "user", text: "x" }], hasOlder: false, next: null, meta: { model: "k3" } }, { key: "9", before: null })
  assert.equal(stray.blocks, first.blocks, "非活动会话 ⇒ 跳块（原引用）")
  assert.equal(stray.history, first.history, "非活动会话 ⇒ 跳历史写")
  assert.deepEqual(stray.sessionMeta["9"], { model: "k3" }, "sessionMeta 仍写（他键）")
})

test("U91 审批入卡入池：两形 ⇒ 切片 ∧ 卡面 / 池面树读数", () => {
  const single = { channel: "ev:approval", key: KEY, promptId: "p1", shape: "single", tool: "write_file", argsSummary: "b.mjs" }
  const one = reduce(stateOf(), single)
  assert.equal(one.pool.approvals.length, 1, "入项恰一项")
  assert.deepEqual(Object.keys(one.pool.approvals[0]).sort(), ["argsSummary", "promptId", "shape", "tool"], "在场键 = 载荷非空键（零 undefined 键）")
  assert.equal(one.pool.approval, 1, "待决读数随动")
  assert.equal(one.pool.running, 0, "运行读数 = 0（无运行块）")
  assert.deepEqual([typeof one.pool.approval, typeof one.pool.running], ["number", "number"], "两读数皆数（非缺失 —— 空池亦落 0；非数 ⇒ 池面零节点）")
  assert.deepEqual(one.tabBadges[KEY], ["approval"])
  const repeated = reduce(one, { ...single, argsSummary: "c.mjs" })
  assert.equal(repeated.pool.approvals.length, 1, "同 promptId 复现 ⇒ 就地替换")
  assert.equal(repeated.pool.approvals[0].argsSummary, "c.mjs")

  const batch = { channel: "ev:approval", key: KEY, promptId: "p2", shape: "batch", batch: { count: 3, tools: ["a", "b", "c"] } }
  const withBlock = reduce(one, { channel: "ev:token", key: KEY, text: "hi" })
  const two = reduce(withBlock, batch)
  assert.equal(two.pool.approvals.length, 2, "promptId 互异 ⇒ 两项")
  assert.equal(two.pool.approval, 2, "待决读数 = 两项")
  assert.equal(two.pool.running, 0, "两读数在场且皆数（待决 2 / 运行 0）")
  for (const item of two.pool.approvals) {
    for (const field of Object.keys(item)) assert.ok(ITEM_KEYS.includes(field), `零新键：${field}`)
  }

  const model = chatModel(two)
  assert.equal(model.approval.length, 2, "本会话待决项全入卡面")
  const rootChildren = chatTree(model, {}).children
  assert.deepEqual(rootChildren.map((node) => node.props?.["data-block-kind"] ?? node.props?.["data-card"]),
    ["assistant", "approval", "approval"], "帧尾卡在（块序列之后 · 无药丸）")
  const cards = pick(rootChildren, "data-card")
  assert.deepEqual(cards.map((node) => node.props["data-shape"]), ["single", "batch"], "shape 两形判别逐卡")
  assert.deepEqual(actionsOf(cards[0]), ["approval:once", "approval:always", "approval:reject"], "逐项形三出口")
  assert.deepEqual(actionsOf(cards[1]), ["approval:approveAll", "approval:deny", "approval:oneByOne"], "批形三出口")
  assert.equal(pick(cards[0], "data-autofocus")[0].props["data-autofocus"], "1", "卡面置焦最安全键")

  const pool = poolTree(poolModel(two), {})
  const family = pick(pool, "data-family").find((node) => node.props["data-family"] === "approvals")
  assert.ok(family, "待审批族在场")
  const items = pick(family, "data-prompt-id")
  assert.deepEqual(items.map((node) => node.props["data-prompt-id"]), ["p1", "p2"], "池面该族逐项（= 切片项数）")
  assert.deepEqual(pick(family, "data-card"), [], "池面零卡面锚（两面同表消费、异形）")
  assert.deepEqual(pick(pool, "data-read").map((node) => node.props["data-read"]).sort(), ["approval", "running"], "两读数在位")
})

test("U92 出站后清除：成功两侧同清 / 回执非 ok 与拒绝皆零乐观摘除", async (ctx) => {
  const logged = []
  const original = console.error
  console.error = (...args) => logged.push(args.map((part) => String(part)).join(" "))
  ctx.after(() => {
    console.error = original
  })

  const item = { promptId: "p1", shape: "single", tool: "write_file" }
  const seed = () => createStore(stateOf({ pool: { ...initialState().pool, approvals: [item], approval: 1 } }))

  const table = new Map([["p1", {}]])
  const calls = []
  const okHost = {
    invoke: (...args) => {
      calls.push(args)
      table.delete(args[1].promptId)
      return Promise.resolve({ ok: true })
    },
  }
  const store = seed()
  assert.equal(await submitVerdict({ store, host: okHost }, "p1", "once"), true)
  assert.deepEqual(calls, [["approval:respond", { promptId: "p1", verdict: "once" }]], "载荷逐字")
  assert.equal(table.size, 0, "表删项")
  assert.deepEqual(store.get().pool.approvals, [], "切片摘项（两侧同清）")
  assert.equal(store.get().pool.approval, 0, "待决读数随摘项归零（数）")
  assert.deepEqual(store.get().sessionFlags, {}, "回执无 `flags` 键 ⇒ 模式位切片零写（禁假造）")

  const refused = seed()
  const refuseHost = { invoke: () => Promise.resolve({ ok: false, reason: "bad-verdict" }) }
  assert.equal(await submitVerdict({ store: refused, host: refuseHost }, "p1", "reject"), false)
  assert.equal(refused.get().pool.approvals.length, 1, "回执非 ok ⇒ 零乐观摘除")

  const broken = seed()
  const brokenHost = { invoke: () => Promise.reject(new Error("bridge-down")) }
  assert.equal(await submitVerdict({ store: broken, host: brokenHost }, "p1", "reject"), false)
  assert.equal(broken.get().pool.approvals.length, 1, "拒绝 ⇒ 零乐观摘除")
  assert.ok(logged.some((line) => line.includes("approval:respond")), "console.error 在场（不静默）")
})

// ─── U176 首屏播种（D17 · `docs/desktop/design/IPC.md` §2「打开态播种注」项 3/4）────────

test("U176 首屏播种：`seed` 同笔写两切片 · 缺席 / 形不合 ⇒ 零写 · 在飞（回合未尾）⇒ 种不落 · 切片有活数据（#490）⇒ 零写", () => {
  const blank = stateOf()
  const seed = { tasks: [{ id: 1, status: "done" }, { id: 2, status: "pending" }], usage: 42 }
  const receipt = { ok: true, messages: [], hasOlder: false, next: null, meta: {}, seed }

  const seeded = applyPage(blank, receipt, { key: KEY, before: null })
  assert.deepEqual(seeded.tasks[KEY], seed.tasks, "tasks[key] = 槽数据直取（逐字）")
  assert.equal(seeded.usage[KEY], 42, "usage[key] = 打开态读数（域 0–100 整数直传）")
  assert.deepEqual(seeded.sessionMeta[KEY], {}, "与 `meta` 同一写点（首屏回执照写）")
  assert.equal(blank.tasks, undefined, "原态零改写（纯归约）")

  const noSeed = applyPage(blank, { ...receipt, seed: undefined }, { key: KEY, before: null })
  assert.equal(noSeed.tasks, blank.tasks, "`seed` 缺省 ⇒ tasks 零写")
  assert.equal(noSeed.usage, blank.usage, "`seed` 缺省 ⇒ usage 零写")

  const malformed = applyPage(blank, { ...receipt, seed: { tasks: "nope", usage: "42" } }, { key: KEY, before: null })
  assert.equal(malformed.tasks, blank.tasks, "tasks 形不合 ⇒ 该槽零写（禁假造）")
  assert.equal(malformed.usage, blank.usage, "usage 形不合 ⇒ 该槽零写")
  const zero = applyPage(blank, { ...receipt, seed: { tasks: [], usage: 0 } }, { key: KEY, before: null })
  assert.deepEqual(zero.tasks[KEY], [], "tasks 空数组照落（槽数据直取——零节点判据归显示面）")
  assert.equal(zero.usage, blank.usage, "usage ≤ 0 ⇒ 该槽零写（同 `ev:usage` 有效门）")

  const live = stateOf({ tasks: { [KEY]: [{ id: 9 }] }, usage: { [KEY]: 7 }, tabBadges: { [KEY]: ["running"] } })
  const inFlight = applyPage(live, receipt, { key: KEY, before: null })
  assert.equal(inFlight.tasks, live.tasks, "在飞（回合未尾）⇒ 种不落：tasks 活切片为准")
  assert.equal(inFlight.usage, live.usage, "在飞 ⇒ usage 活切片为准")
  assert.deepEqual(inFlight.blocks, [], "页整置仍走（只种不落——既有页读语义零改）")
  const settled = applyPage({ ...live, tabBadges: { [KEY]: ["done"] } }, receipt, { key: KEY, before: null })
  assert.equal(settled.tasks, live.tasks, "回合尾 ∧ 切片已有活数据 ⇒ 零写（#490 播种只填空白）")
  assert.equal(settled.usage, live.usage, "同判：usage 活数据在场 ⇒ 零写")
  const blankTail = applyPage({ ...blank, tabBadges: { [KEY]: ["done"] } }, receipt, { key: KEY, before: null })
  assert.deepEqual(blankTail.tasks[KEY], seed.tasks, "对照正臂：回合尾 ∧ 空切片 ⇒ 种落（防假红）")

  const backfill = applyPage(blank, receipt, { key: KEY, before: 4 })
  assert.equal(backfill.tasks, blank.tasks, "回填径不消费 `seed`（`before != null`）")
  assert.equal(backfill.usage, blank.usage)
  const stray = applyPage(blank, receipt, { key: "9", before: null })
  assert.equal(stray.tasks, blank.tasks, "非活动会话 ⇒ 零写（沿 `meta` 之外的切片键门）")

  assert.equal(STATUS_KEYS.includes("tasks") && STATUS_KEYS.includes("usage"), true, "订阅键面零改（两键已在 `STATUS_KEYS` ⇒ 帧随切片变自动重挂）")
})

// ─── U179 模式位切片（状态栏对齐批 · `docs/desktop/design/IPC.md` §2「模式位投影注」项 4/5）──────

test("U179 模式位切片：页读两径写 `sessionFlags` · 缺席 / 非载体 / 非布尔 ⇒ 零写 · 同值原引用 · 出站回执径同点", async () => {
  const flags = { planMode: true, autoApprove: false, advisorGuard: true, engineering: false }
  const receipt = (patch = {}) => ({ ok: true, messages: [], hasOlder: false, next: null, meta: {}, ...patch })
  const blank = stateOf()

  const first = applyPage(blank, receipt({ flags }), { key: KEY, before: null })
  assert.deepEqual(first.sessionFlags[KEY], flags, "首屏读 ⇒ `sessionFlags[key]` 写（与 `meta` 同写点）")
  assert.deepEqual(blank.sessionFlags, {}, "原态零改写（纯归约）")
  assert.deepEqual(applyPage(blank, receipt({ flags }), { key: KEY, before: 12 }).sessionFlags[KEY], flags, "回填径同写（每次页读皆携）")
  const stray = applyPage(blank, receipt({ flags }), { key: "9", before: null })
  assert.deepEqual(stray.sessionFlags["9"], flags, "非活动会话 ⇒ 切片仍按 key 写（沿 `meta` 同判）")
  assert.equal(stray.sessionFlags[KEY], undefined, "本键零写（键域）")

  for (const missing of [undefined, null, "x", 7, true]) {
    assert.equal(applyPage(blank, receipt({ flags: missing }), { key: KEY, before: null }).sessionFlags, blank.sessionFlags,
      `flags 缺席 / 非载体 ⇒ 零写（${String(missing)}）`)
  }
  assert.equal(applyPage(blank, { ok: false, reason: "bad-key" }, { key: KEY, before: null }).sessionFlags, blank.sessionFlags, "失败回执 ⇒ 零写（清在途径不碰本切片）")
  const partial = applyPage(blank, receipt({ flags: { planMode: true, autoApprove: "yes", advisorGuard: null, outside: true } }), { key: KEY, before: null })
  assert.deepEqual(partial.sessionFlags[KEY], { planMode: true }, "逐项只收严格布尔（非布尔 / 表外键 ⇒ 该键不落 —— 禁假造）")
  assert.equal(applyFlags(first, KEY, flags), first, "同键同值 ⇒ 原引用（零重绘）")
  assert.equal(applyFlags(first, KEY, { ...flags, autoApprove: true }).sessionFlags[KEY].autoApprove, true, "同键异值 ⇒ 整条就地替换")

  const item = { promptId: "p1", shape: "single", tool: "write_file" }
  const store = createStore(stateOf({ pool: { ...initialState().pool, approvals: [item], approval: 1 } }))
  const host = { invoke: () => Promise.resolve({ ok: true, key: KEY, flags: { planMode: false, autoApprove: true, advisorGuard: false, engineering: true } }) }
  assert.equal(await submitVerdict({ store, host }, "p1", "always"), true)
  assert.deepEqual(store.get().sessionFlags[KEY], { planMode: false, autoApprove: true, advisorGuard: false, engineering: true },
    "出站回执径同点写切片（桌内 AUTO 翻转即时刷新面）")
  assert.deepEqual(store.get().pool.approvals, [], "摘项照旧（两事同笔）")
})
