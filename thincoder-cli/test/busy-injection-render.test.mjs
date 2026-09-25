/**
 * busy-injection-render.test.mjs — F16（busy 期消息注入 · 台账 #213）机器验收 · CLI 半
 * （渲染 / 状态栏族）。
 *
 * 拆分（2026-09-25 file-tier-sweep 批 S4 · KD-23「用例族 + 夹具自持」——原
 * `busy-injection.test.mjs` 474 行拆分；触发 = 前批登记「用例按族分档 · 下批执行」）：本档 =
 * 状态栏段四态逐字（T-F16-6）/ 待发送块渲染（T-F16-10 · 11 · 12）/ 合并计划纯函数（T-F16-14）/
 * 状态栏条数段机判（T-F16-17）+ `convState` / `convText` 夹具；消费 / 送达 / 步边界族见
 * `busy-injection-consume.test.mjs`，按键门 + 入队族留守原档。用例号零改零重排；
 * 夹具自持（零跨档 import——`baseState` / `stripAnsi` / `convState` / `convText`）。
 *
 * 设计权威：`docs/cli/design/TUI.md` §7.5（待发送块 / 四态 / 三时机）· `TUI-INPUT-BOX.md`
 * §4.1（容量 / 满队）；批档 `docs/batches/2026-09-21-busy-injection.md` §2 用例表 +
 * queue-visible 批（2026-09-24 · 台账 #249）批档 §2（T-F16-10…19）。快层直跑（纯函数 +
 * `renderStatus` 直驱——零网络零 TTY 零定时器）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { renderStatus } from "../src/tui/render-frame.mjs"
import { buildConvLines } from "../src/tui/render-conversation.mjs"
import { planQueuedInput, formatMergedMessages, MAX_MERGE_ITEMS, MAX_MERGE_CHARS } from "../src/tui/queued-merge.mjs"

const stripAnsi = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, "")

/** 最小按键态（挂起/释放窗口字段齐备——busy 判据三面全在；含状态栏渲染所需字段）。 */
function baseState(over = {}) {
  return {
    input: [], cursor: 0, history: [], historyIndex: -1, _draft: null,
    processing: false, suspended: false, _suspPending: false, pendingInput: [],
    queue: [], subTasks: {}, tasks: [], scroll: 0, _followTail: true,
    permission: null, question: null,
    status: "Ready", processingStarted: 0, currentTool: null,
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
    ctxCache: { tokens: 0 },
    ...over,
  }
}

// ─── T-F16-6 机判：状态栏段四态逐字（TUI.md §7.5）＋ F13 零注意力色对 ───

test("T-F16-6 状态栏段四态：队列非空 N = 2 ⇒ 「已排队 2 条消息」；队空 ⇒ 普通 busy / 挂起内用户回合 / 挂起内系统轮排队句逐字；非 processing ⇒ Enter: send；全程零 \\x1b[43m", () => {
  const agent = { provider: null, cwd: "x", autoApprove: false, planMode: false, config: null, _currentTurn: 0, _maxTurns: 0 }
  const autoAgent = { ...agent, _inAutoTurn: true }
  const st = (over = {}) => ({
    input: [], cursor: 0, scroll: 0, tasks: [], queue: [], history: [], historyIndex: -1, _draft: null,
    processing: false, processingStarted: Date.now(), status: "Ready", currentTool: null,
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
    ctxCache: { tokens: 0 },
    permission: null, question: null, picker: null, wizard: null, search: null, interruptPrompt: null,
    suspended: false, _suspPending: false, attentionAwaiting: false, pendingInput: [],
    ...over,
  })
  const queued = renderStatus(st({ processing: true, pendingInput: ["x", "y"] }), agent, 120, [])
  assert.ok(stripAnsi(queued).includes("已排队 2 条消息"), "队列非空 ⇒ 条数段逐字（N = 2——多槽）")
  assert.ok(!queued.includes("\x1b[43m"), "零注意力色对（F13 豁免——dim 信息段非 chip）")
  const busyEmpty = renderStatus(st({ processing: true, pendingInput: [] }), agent, 120, [])
  assert.ok(!stripAnsi(busyEmpty).includes("已排队"), "队空 ⇒ 条数段零注入")
  assert.ok(stripAnsi(busyEmpty).includes("主会话处理中 — Enter 排队（当前步骤结束后自动发送）"), "队空 + 非挂起 ⇒ 普通 busy 排队句逐字（步边界承诺）")
  assert.ok(!busyEmpty.includes("\x1b[43m"), "队空态零注意力色对")
  const suspUser = renderStatus(st({ processing: true, pendingInput: [], suspended: true }), agent, 120, [])
  assert.ok(stripAnsi(suspUser).includes("会话内回合处理中 — Enter 排队（当前步骤结束后自动发送）"), "挂起内用户回合（_inAutoTurn 假）⇒ 步边界句逐字")
  assert.ok(!suspUser.includes("\x1b[43m"), "挂起态零注意力色对")
  const suspSys = renderStatus(st({ processing: true, pendingInput: [], suspended: true }), autoAgent, 120, [])
  assert.ok(stripAnsi(suspSys).includes("会话内回合处理中 — Enter 排队（本轮结束后优先发送）"), "挂起内系统轮（_inAutoTurn 真）⇒ 轮末句逐字")
  const winEmpty = renderStatus(st({ processing: true, pendingInput: [], _suspPending: true }), agent, 120, [])
  assert.ok(stripAnsi(winEmpty).includes("会话内回合处理中 — Enter 排队（当前步骤结束后自动发送）"), "释放窗口（_suspPending）同判")
  const idle = renderStatus(st({ processing: false, pendingInput: ["x"] }), agent, 120, [])
  assert.ok(!stripAnsi(idle).includes("已排队"), "非 processing ⇒ 段零注入（派生自 processing ∧ 队列）")
  assert.match(stripAnsi(idle), /Enter: send/, "空闲文案零改")
})

// ═══ queue-visible 批（2026-09-24 · 台账 #249）：待发送块 / 合并计划 / 步边界 pickup ═══
// 设计 = `TUI.md` §7.5（待发送块 · 四态 · 三时机）· `TUI-INPUT-BOX.md` §4.1（容量 / 满队）·
// `AGENT-LOOP-ASYNC-POOL.md` §6.8（步边界 pickup）。用例表 T-F16-10…19（批档 §2）。

/** 会话渲染夹具（`buildConvLines` 直驱——cols 给足免折行干扰形态断言）。 */
function convState(queued, over = {}) {
  return baseState({
    lines: [], streaming: "", reasoning: "", _advisorBlocks: [], expandedBlocks: new Set(),
    foldEnabled: true, search: null, _foldScroll: null, pendingInput: queued, ...over,
  })
}
const convText = (state, cols = 120) => buildConvLines(state, cols, 0).map((l) => l.text)

test("T-F16-10 排队块单条：队列 N = 1 ⇒ 标签行逐字 + 原文行 ∧ 无编号头 ∧ 渲染序在 state.streaming 之后 ∧ 零 state.lines 写入（派生插槽）", () => {
  const flat = convText(convState(["hello world"]))
  assert.ok(flat.includes("⏳ 待发送 · 不打断当前执行，自动发送"), `标签行逐字（实到 ${JSON.stringify(flat)}）`)
  assert.ok(flat.includes("hello world"), "原文行在位（含用户原文）")
  assert.ok(!flat.some((t) => /^\d+\. /.test(t)), "单条不加编号")
  // 渲染序（旧否决的正面处置）：块在 state.streaming 渲染行之后 ⇒ 流在上方增长、块恒居会话区底
  const flat2 = convText(convState(["tail-msg"], { streaming: "streamed-reply-line" }))
  assert.ok(flat2.indexOf("⏳ 待发送 · 不打断当前执行，自动发送") > flat2.indexOf("streamed-reply-line"), "块行序在 streaming 渲染行之后")
  // 载体 = 派生（零生命周期簿记——判据消失即消）
  const s = convState(["derived-only"])
  convText(s)
  assert.equal(s.lines.length, 0, "派生零写入（不入 state.lines / 不入会话历史）")
})

test("T-F16-11 排队块多条：N = 2 ⇒ 标签含条数逐字 ∧ `1. ` / `2. ` 编号行（顺序 = 入队序，编号 = 合并形态预览）", () => {
  const flat = convText(convState(["alpha", "beta"]))
  assert.ok(flat.includes("⏳ 待发送 · 2 条消息（不打断当前执行，合并发送）"), `多条标签逐字（N ≥ 2，实到 ${JSON.stringify(flat)}）`)
  const i1 = flat.indexOf("1. alpha")
  const i2 = flat.indexOf("2. beta")
  assert.ok(i1 >= 0 && i2 > i1, "编号行按入队序")
  assert.ok(flat.indexOf("⏳ 待发送 · 2 条消息（不打断当前执行，合并发送）") < i1, "标签行置于块首（C.warn 前置于 dim 连跑）")
})

test("T-F16-12 排队块边界（负向锁）：队列空 ⇒ 零该串 ∧ 字段缺省逐字节等价；超 3 行 ⇒ 原文行 ≤ 3 + 尾标记行逐字；全程零 \\x1b[43m", () => {
  // 负向锁（同 renderStatus 负向锁纪律）：队列空 / 字段缺省 ⇒ 零该串
  const emptyLines = buildConvLines(convState([]), 100, 0)
  assert.ok(!emptyLines.some((l) => l.text.includes("待发送")), "队列空 ⇒ 零该串")
  const undefLines = buildConvLines(convState([], { pendingInput: undefined }), 100, 0)
  assert.deepEqual(undefLines.filter((l) => l.text.includes("待发送")), [], "字段缺省同判（逐字节等价面）")
  // 超限：每条原文行 ≤ QUEUED_ITEM_MAX_LINES（3）+ 该条尾标记行逐字
  const longItem = Array.from({ length: 6 }, (_, i) => `body-${i}`).join("\n")
  const flat = convText(convState([longItem]))
  assert.equal(flat.filter((t) => t.startsWith("body-")).length, 3, "原文行 ≤ 3（QUEUED_ITEM_MAX_LINES）")
  assert.ok(flat.includes("… [该条共 6 行——发送后完整显示]"), "该条尾标记行逐字（N = 总行数）")
  // 超宽 / 长单行：折行后同样受上限约束（不劈半由既有 wrapText 保证）
  const wide = "宽".repeat(400)
  const wideLines = convText(convState([wide]), 40)
  assert.ok(wideLines.filter((t) => t.includes("宽")).length <= 3, "超宽长单行 ⇒ 折行后仍 ≤ 3 行")
  assert.ok(wideLines.some((t) => /共 \d+ 行——发送后完整显示/.test(t)), "折行数进尾标记")
  // F13 豁免（零注意力色对）——渲染帧全程
  const frame = convText(convState(["x"]))
  assert.ok(!frame.join("").includes("\x1b[43m"), "全程零 \\x1b[43m")
})

test("T-F16-14 合并计划（`planQueuedInput` 纯函数 · R15 逐字恢复）：2 条短 ⇒ 单动作 merged 批；9 条 ⇒ 截批先行；单条 > 2000 字符 ⇒ 直发；/cmd ⇒ 逐条动作（保序、不进合并）", () => {
  const p2 = planQueuedInput(["a", "b"])
  assert.equal(p2.length, 1, "2 条 ⇒ 单动作（一次消费）")
  assert.deepEqual([p2[0].kind, p2[0].count, p2[0].merged], ["turn", 2, true], "合并批（merged:true）")
  assert.equal(p2[0].text, "你排队了 2 条消息：\n1. a\n2. b\n——一次处理", "形态逐字 = R15（头 + 编号 + 尾）")
  assert.equal(p2[0].text, formatMergedMessages(["a", "b"]), "与格式化函数同源")
  const p9 = planQueuedInput(Array.from({ length: 9 }, (_, i) => `m${i}`))
  assert.equal(p9[0].count, 8, "9 条 ⇒ 首动作满批 8 条（≤ MAX_MERGE_ITEMS）")
  assert.equal(p9[1].count, 1, "余下留待下批（不丢——多回合）")
  const big = "x".repeat(MAX_MERGE_CHARS + 1)
  const pBig = planQueuedInput([big])
  assert.deepEqual([pBig[0].merged, pBig[0].count], [false, 1], "单条 > 2000 字符 ⇒ merged:false 直发（不进批）")
  assert.equal(pBig[0].text, big, "原文直发（零包裹）")
  const charCapped = planQueuedInput(["y".repeat(1500), "z".repeat(1500)])
  assert.equal(charCapped[0].count, 1, "合并文本超 2000 字符 ⇒ 截批先行")
  const pMix = planQueuedInput(["/help", "a", "b", "/exit", "c"])
  assert.deepEqual(pMix.map((a) => a.kind), ["slash", "turn", "slash", "turn"], "/cmd 逐条动作（保序——不进合并缓冲）")
  assert.equal(pMix[1].text, formatMergedMessages(["a", "b"]), "非 / 连续条目攒批")
})

test("T-F16-17 状态栏条数段（机判）：队列非空 N = 2 ⇒ 含「已排队 2 条消息」∧ 全程零 \\x1b[43m", () => {
  const agent = { provider: null, cwd: "x", autoApprove: false, planMode: false, config: null, _currentTurn: 0, _maxTurns: 0 }
  const s = baseState({ processing: true, processingStarted: Date.now(), status: "Processing...", pendingInput: ["p", "q"] })
  const out = renderStatus(s, agent, 120, [])
  assert.ok(stripAnsi(out).includes("已排队 2 条消息"), `条数段逐字（N = 2——实到 ${JSON.stringify(stripAnsi(out))}）`)
  assert.ok(!out.includes("\x1b[43m"), "全程零 \\x1b[43m（F13 豁免）")
})
