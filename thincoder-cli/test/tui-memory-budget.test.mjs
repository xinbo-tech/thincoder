/**
 * tui-memory-budget.test.mjs — TUI-OOM-ROOTCAUSE 批 组 3（B1——TUI.md §15.3/§15.6）
 * 用例表 1:1：T-TB1–T-TB10（行/载体/子块/评审/流式/总量/翻页/搜索）。
 *
 * TUI-HISTORY-TRIM 批（2026-09-16）追加 U1–U6 / U8–U10：保底 `LINES_TRIM_FLOOR` + 最小步进裁剪
 * （批次档 §2.5 用例表）。U8 / U9 真路径（restoreLines / createLoadOlder）且输入 ≈2.4M–4.8M 码元
 * ——slow() 归册（同 T-TB9 先例；分层判定见批次档 §5）。
 *
 * 形态：快层 unit——直驱（零定时器、零终端）；常量一律从 `display-budget.mjs` 导入断言
 * （AC-TB2 单源）。
 * 归册（2026-09-12 收尾轮 9）：T-TB9（400 条 × 2k 字符 + 20 轮翻页模拟）观测 568–857ms
 * ——slow() 门控（快层 skip、test:full 照跑）。
 */
import { test } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import {
  capLine, accountLine, accountAll, lineChars, syncLineBudget,
  LINE_MAX_CHARS, ARGS_JSON_MAX_CHARS, TOOL_RESULT_MAX_CHARS, TOOL_OUTPUT_ENTRY_MAX_CHARS,
  TOOL_OUTPUT_TOTAL_MAX_CHARS, SUB_BLOCK_CHAR_LIMIT, ADVISOR_TEXT_MAX_CHARS,
  STREAM_MAX_CHARS, LINES_CHAR_BUDGET, LINES_TRIM_FLOOR, SEARCH_MATCH_CAP, LINE_TRUNC_MARKER } from "../src/tui/display-budget.mjs"
import { appendCappedText } from "@thincoder/core/text-budget.mjs"
import { appendSubBlock, SUB_BLOCK_LINE_LIMIT } from "../src/tui/subagent-children.mjs"
import { toolArgsLines } from "../src/tui/tool-args.mjs"
import { slimToolResultForDisplay } from "../src/tui/tool-display.mjs"
import { buildToolCallbacks } from "../src/tui/tool-events.mjs"
import { performSearch } from "../src/tui/key-handler-search.mjs"
import { freezeSubTaskLines } from "../src/tui/subagent-freeze.mjs"
import { shiftFreezeAnchors } from "../src/tui/subagent-blocks.mjs"
import { createAgent } from "@thincoder/core/agent.mjs"

const chars = (arr) => arr.reduce((a, s) => a + (typeof s === "string" ? s.length : 0), 0)

/** 最小 TUI state（直驱回调——无终端依赖）。 */
function mkState(over = {}) {
  return {
    lines: [], subTasks: {}, expandedBlocks: new Set(), _foldScroll: new Map(),
    streaming: "", reasoning: "", _advisorBlocks: [], search: null, _linesChars: 0,
    _lineIdCounter: 0, dims: { get: () => ({ cols: 80, rows: 24 }) }, scroll: 0,
    ...over,
  }
}

/** 直驱 buildToolCallbacks（render/scheduleRender 空实现——只测数据面）。 */
function mkCallbacks(state) {
  const agent = createAgent({
    provider: { name: "mock", model: "mock-model", baseURL: "http://127.0.0.1:1/v1", apiKey: "k" },
    tools: [], config: { agent: {} }, cwd: process.cwd(), memory: null,
  })
  const { callbacks } = buildToolCallbacks({
    agent, state, pushLine: (t, c, k) => { const l = { text: capLine(t), color: c, _kind: k }; state.lines.push(l); accountLine(state, l) },
    render: () => {}, scheduleRender: () => {}, ensureAssistantLabel: () => {},
    askPermission: null, askBatchPermission: null, askQuestion: null, saveSessionImpl: () => {},
  })
  return { callbacks, agent }
}

test("T-TB1 单行巨内容（pushLine）：10MB 无换行文本 → 行文本 ≤ LINE_MAX_CHARS+标记；标记串逐字", () => {
  const s = capLine("x".repeat(10_000_000))
  assert.ok(s.length <= LINE_MAX_CHARS + LINE_TRUNC_MARKER.length + 10, `行文本 ${s.length}`)
  assert.match(s, /… \[line truncated: \d+ chars omitted\]$/)
  assert.equal(s.startsWith("x".repeat(1000)), true)
})

test("T-TB2 工具参数额度：write 大 content 的 argsJson → 总量 ≤ ARGS_JSON_MAX_CHARS+标记；首行完整", () => {
  const lines = toolArgsLines({ path: "a.txt", content: "y".repeat(5_000_000) })
  assert.ok(chars(lines) <= ARGS_JSON_MAX_CHARS + 100, `argsJson 总量 ${chars(lines)}`)
  assert.equal(lines[0], "{", "首行完整（pretty JSON 结构头保留）")
  assert.match(lines[lines.length - 1], /… \[middle truncated: \d+ chars omitted\]/)
})

test("T-TB3 工具结果单行巨量：400 行内单行 5MB → 结果总量 ≤ TOOL_RESULT_MAX_CHARS+标记", () => {
  const rows = slimToolResultForDisplay("z".repeat(5_000_000))
  assert.ok(chars(rows) <= TOOL_RESULT_MAX_CHARS + 100, `结果总量 ${chars(rows)}`)
  assert.match(rows[rows.length - 1], /… \[middle truncated: \d+ chars omitted\]/)
  // 400 行维保留（双维——先到先裁）
  const many = slimToolResultForDisplay(Array.from({ length: 900 }, (_, i) => `row-${i}`).join("\n"))
  assert.equal(many.length, 401, "400 行 + 截断标记行")
})

test("T-TB4 输出环双维：300 条 × 大 chunk（含无 \\n 巨块）→ 条目 ≤200、单项 ≤8K、总量 ≤128K；丢最旧", () => {
  const state = mkState()
  const { callbacks } = mkCallbacks(state)
  callbacks.onToolCall("bash", { command: "run" }, "t1")
  for (let i = 0; i < 300; i++) callbacks.onToolOutput("bash", `out-${i}\n`, "t1")
  callbacks.onToolOutput("bash", "Q".repeat(500_000), "t1") // 无换行巨 chunk
  const block = state.lines.find((l) => l._toolBlock)?. _toolBlock
  assert.ok(block.output.length <= 200, `条目 ${block.output.length} ≤ 200`)
  for (const s of block.output) assert.ok(s.length <= TOOL_OUTPUT_ENTRY_MAX_CHARS + 100, `单项 ${s.length}`)
  assert.ok(chars(block.output) <= TOOL_OUTPUT_TOTAL_MAX_CHARS + 100, `总量 ${chars(block.output)}`)
  assert.equal(block.output.at(-1).startsWith("Q"), true, "最新巨块保头")
})

test("T-TB5 子代理块无换行巨 chunk：1MB 无 \\n chunk × 多次 → _charCount ≤ SUB_BLOCK_CHAR_LIMIT；省略标记 N 单调、无幽灵", () => {
  const sub = { blocks: [], _lineCount: 0, _charCount: 0, dropped: 0 }
  const chunk = "W".repeat(1_000_000)
  appendSubBlock(sub, "tool", chunk)
  assert.ok(sub._charCount <= SUB_BLOCK_CHAR_LIMIT, `_charCount ${sub._charCount} ≤ ${SUB_BLOCK_CHAR_LIMIT}`)
  // 单块自身额度：内容不被整行丢光（头尾保真 + 中段标记；旧 500 行环对此净增 0 行 → 失效）
  assert.match(sub.blocks[0].text, /… \[middle truncated: \d+ chars omitted\]/)
  assert.equal(sub._lineCount >= 1, true)
  assert.equal(sub.blocks[0].text.startsWith("W".repeat(1000)), true, "头保真")
  // 多块累积 → 字符维裁最旧（N6 省略标记——N 按被裁行数折算、单调不减）
  for (let i = 0; i < 6; i++) appendSubBlock(sub, "tool", chunk, { fresh: true })
  assert.ok(sub._charCount <= SUB_BLOCK_CHAR_LIMIT, `多块累积 ${sub._charCount} ≤ ${SUB_BLOCK_CHAR_LIMIT}`)
  const marker = sub.blocks.find((b) => b._trimMarker)
  assert.ok(marker, "字符维裁剪产物带省略标记")
  assert.match(marker.text, /…（已省略 \d+ 行）/, "N6 口径（N 为行数折算——无幽灵行）")
  const n1 = sub.dropped
  assert.ok(n1 > 0)
  appendSubBlock(sub, "tool", "x".repeat(1_000_000), { fresh: true })
  assert.ok(sub.dropped >= n1, "省略 N 单调")
})

test("T-TB6 评审块：流式 1MB think + 冻结 → 累积 ≤128K（头 32K/尾 96K）；冻结文本 ≤128K；尾（Verdict）保留", () => {
  const state = mkState()
  const { callbacks } = mkCallbacks(state)
  callbacks.onToolCall("advisor", { type: "design" }, "a1")
  callbacks.onToolOutput("advisor", { kind: "think", text: "T".repeat(1_000_000) }, "a1")
  const acc = state._advisorBlocks.reduce((a, b) => a + b.text.length, 0)
  assert.ok(acc <= ADVISOR_TEXT_MAX_CHARS + 100, `累积 ${acc}`)
  // 冻结：裁决尾部（最后写入的文本）保留
  callbacks.onToolOutput("advisor", { kind: "text", text: "VERDICT: pass" }, "a1")
  callbacks.onToolResult("advisor", "review body", "a1")
  const line = state.lines.find((l) => l._frozenAdvisor)
  assert.ok(line, "冻结行在场")
  assert.ok(line._frozenAdvisor.length <= ADVISOR_TEXT_MAX_CHARS + 100)
  assert.match(line._frozenAdvisor, /VERDICT: pass$/, "裁决尾部保留")
  // 代码评审 #3 回归：超限冻结单次截断——头/尾保真 + 中段标记（非静默、不截尾丢裁决）
  const s2 = mkState()
  const { callbacks: cb2 } = mkCallbacks(s2)
  s2._advisorBlocks = [{ kind: "text", text: "H".repeat(200_000) + "VERDICT: changes-required" }]
  cb2.onToolResult("advisor", "body", "a2")
  const frozen = s2.lines.find((l) => l._frozenAdvisor)._frozenAdvisor
  assert.ok(frozen.length <= ADVISOR_TEXT_MAX_CHARS + 100, `冻结文本 ${frozen.length}`)
  assert.match(frozen, /… \[middle truncated: \d+ chars omitted\]/, "中段标记在场（非静默截断）")
  assert.match(frozen, /VERDICT: changes-required$/, "尾段（裁决）保留")
})

test("T-TB7 流式缓冲：onToken 累积 5MB → state.streaming ≤256K；flush 行再 ≤ LINE_MAX_CHARS", () => {
  const state = mkState()
  const { callbacks } = mkCallbacks(state)
  for (let i = 0; i < 50; i++) callbacks.onToken("S".repeat(100_000))
  assert.ok(state.streaming.length <= STREAM_MAX_CHARS, `streaming ${state.streaming.length} ≤ ${STREAM_MAX_CHARS}`)
  // flush 行（pushLine 入口 capLine）
  const flushed = capLine(state.streaming)
  assert.ok(flushed.length <= LINE_MAX_CHARS + 100)
})

test("T-TB8 state.lines 总量：各路径混合塞入至超 2M → 裁头生效（含冻结锚点平移）；直算 = 增量账", () => {
  const state = mkState()
  const sync = () => syncLineBudget(state, { onTrim: (st, n) => shiftFreezeAnchors(st, n) })
  const push = (text) => {
    const l = { text: capLine(text), color: "" }
    state.lines.push(l)
    accountLine(state, l)
    sync()
  }
  // 冻结锚点在途（裁头须平移）
  state.subTasks = { "coder#1": { key: "coder#1", done: true, _freezeAt: 5000 } }
  for (let i = 0; i < 2100; i++) push("A".repeat(1000)) // 2.1M——触发点 2001 行 > 保底（40×60k 触发点仅 34 行，保底守卫下整段跳过：TUI-HISTORY-TRIM 批输入适配，断言逐字未动）
  assert.ok(state._linesChars <= LINES_CHAR_BUDGET + 1000, `总量账 ${state._linesChars} ≤ 预算+在途单行`)
  assert.ok(accountCheck(state), "双算法对照：直算 = 增量账")
  assert.ok(state.subTasks["coder#1"]._freezeAt < 5000, "冻结锚点随裁头前移")
  assert.match(state.lines[0].text, /earlier messages trimmed/, "收据行在场")
  // 冻结 splice 路径同样入账（splice 插入）
  freezeSubTaskLines(state, state.subTasks["coder#1"])
  assert.ok(accountCheck(state), "冻结 splice 后账目一致")
  assert.equal(state._linesChars <= LINES_CHAR_BUDGET + 1000, true)
})

slow("T-TB9 翻页不无界：模拟 50 页载入 → 总量对账仍 ≤ 预算（锚定不破）", async () => {
  const { pushReal } = await import("@thincoder/core/context.mjs")
  const { restoreLines, createLoadOlder } = await import("../src/tui/startup.mjs")
  const { RECORD_WINDOW_MESSAGES } = await import("@thincoder/core/session-store.mjs")
  const agent = createAgent({
    provider: { name: "mock", model: "m", baseURL: "http://127.0.0.1:1/v1", apiKey: "k" },
    tools: [], config: { agent: {} }, cwd: process.cwd(), memory: null,
  })
  // 400 条历史（长内容——每页 20 条 × 2000 字符；页数 10）
  const msgs = []
  for (let i = 0; i < 400; i++) {
    const m = { role: i % 2 ? "assistant" : "user", content: `${i}:` + "H".repeat(2_000) }
    msgs.push(m)
    pushReal(agent, m)
  }
  const state = mkState()
  restoreLines(state, { history: msgs.slice(-RECORD_WINDOW_MESSAGES), total: msgs.length, base: 0 })
  const loadOlder = createLoadOlder({ agent, state, render: () => {} })
  let guard = 0
  while (state._hasOlder && guard++ < 20) loadOlder()
  assert.equal(state._historyLoaded, msgs.length, "翻至最早（全量可见）")
  assert.equal(accountAll(state), state._linesChars, "翻页后账目一致（占位行移除已出账——ED-3 releaseLine）")
  assert.ok(state.lines.length > 0)
  // 锚定滚动补偿不破（值域合理）
  assert.equal(Number.isFinite(state.scroll), true)
})

test("T-TB10 搜索匹配上限：单字符查询 × 超长行 → 匹配数 ≤ SEARCH_MATCH_CAP；标记置位", () => {
  const state = mkState()
  state.lines = [{ text: "a".repeat(SEARCH_MATCH_CAP * 2), color: "" }]
  state.search = { query: "a", matches: [], index: 0 }
  performSearch(state)
  assert.equal(state.search.matches.length, SEARCH_MATCH_CAP)
  assert.equal(state.search.capped, true)
})

// ─── TUI-HISTORY-TRIM 批（2026-09-16）：保底 LINES_TRIM_FLOOR + 最小步进（用例 = 批次档 §2.5；收据 N = 插收据前 lines.length，总行数 = 内容行 + 1）───
/** 直驱 state（行文本数组 → 账就绪）。 */
const mkBudget = (texts) => {
  const state = mkState({ lines: texts.map((t) => ({ text: t, color: "" })) })
  accountAll(state)
  return state
}
const accountCheck = (state) => { const inc = state._linesChars; return accountAll(state) === inc } // 双算法对照（直算 = 增量账）：快照先取——accountAll 覆写 _linesChars，直接比较恒真

test("U1–U5 + U10 保底 / 最小步进 / 收据计数 / 零动作：七组钉死输入逐条读数", () => {
  const cases = [
    ["U1+U3 1001×2000（超额 2000）", Array.from({ length: 1001 }, () => "a".repeat(2000)), 2, 1000, 999],
    ["U2 2501 行（2500×800 + 尾行 5000）", Array.from({ length: 2500 }, () => "b".repeat(800)).concat("c".repeat(5000)), 7, 2495, 2494],
    ["U4 200×60000（行数 = 保底·零动作）", Array.from({ length: LINES_TRIM_FLOOR }, () => "d".repeat(60_000)), 0, LINES_TRIM_FLOOR, null],
    ["U4b 1001×4000", Array.from({ length: 1001 }, () => "e".repeat(4000)), 502, 500, 499],
    ["U5 1000 行（999×2000 + 2200）", Array.from({ length: 999 }, () => "f".repeat(2000)).concat("g".repeat(2200)), 1, 1000, 999],
    ["U10 未超额 100×100", Array.from({ length: 100 }, () => "x".repeat(100)), 0, 100, null],
    ["U10 空集", [], 0, 0, null],
  ]
  const bad = []
  for (const [id, texts, wantRemoved, wantLines, wantN] of cases) {
    const state = mkBudget(texts)
    const removed = syncLineBudget(state)
    if (removed !== wantRemoved) bad.push(`${id}: removed ${removed} ≠ ${wantRemoved}`)
    if (state.lines.length !== wantLines) bad.push(`${id}: lines ${state.lines.length} ≠ ${wantLines}`)
    if (wantN === null) { if (state.lines.some((l) => /earlier messages trimmed/.test(l.text))) bad.push(`${id}: 出现收据`) }
    else if (state.lines[0].text !== `... [earlier messages trimmed — ${wantN} lines remaining]`) bad.push(`${id}: 收据「${state.lines[0].text}」`)
    if (id.startsWith("U2") && (removed > 10 || state.lines.length < 2400)) bad.push(`${id}: AC2 容差超界（丢 ${removed} > 10 或裁后 ${state.lines.length} < 2400）`)
    if (state.lines.length < Math.min(LINES_TRIM_FLOOR, texts.length)) bad.push(`${id}: 行数 < 保底（AC1）`)
    if (!accountCheck(state)) bad.push(`${id}: 账不平（AC4）`)
    if (state._linesChars > LINES_CHAR_BUDGET && state.lines.length > LINES_TRIM_FLOOR + 1) bad.push(`${id}: 终态析取式不成立（AC4）`)
    if (wantRemoved === 0 && syncLineBudget(state) !== 0) bad.push(`${id}: 重复调非零动作（AC5）`)
  }
  assert.deepEqual(bad, [], "逐条偏差列表（修复前 = 全红清单；修复后 = 空）")

  // U6：账一致 + 冻结锚点（丢行数 − 1）
  const s6 = mkBudget(Array.from({ length: 1001 }, () => "h".repeat(2000)))
  s6.subTasks = { "coder#1": { key: "coder#1", done: true, _freezeAt: 5000 } }
  const r6 = syncLineBudget(s6, { onTrim: (st, n) => shiftFreezeAnchors(st, n) })
  assert.ok(accountCheck(s6), "U6 双算法对照（直算 = 增量账）")
  assert.equal(s6.subTasks["coder#1"]._freezeAt, 5000 - (r6 - 1), "U6 锚点前移 = 丢行数 − 1")
})

slow("U8 恢复窗口：restoreLines 超额窗口（300 条 → 物化 200×12000 ≈2.4M）→ ≥200 行；1.8M 负例 → 零裁剪", async () => {
  const { restoreLines } = await import("../src/tui/startup.mjs")
  const msgs = (n) => Array.from({ length: 300 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: `${i}:` + "R".repeat(n) }))
  const state = mkState()
  restoreLines(state, { history: msgs(12_000).slice(-200), total: 300, base: 100 })
  assert.ok(state.lines.length >= LINES_TRIM_FLOOR, `裁后 ${state.lines.length} 行 ≥ ${LINES_TRIM_FLOOR}`)
  assert.match(state.lines[0].text, /^\.\.\. \[earlier messages trimmed — \d+ lines remaining\]$/, "收据形态正常")
  assert.ok(Number(state.lines[0].text.match(/(\d+) lines remaining/)[1]) >= LINES_TRIM_FLOOR, "收据 N ≥ 保底")
  assert.ok(accountCheck(state), "账一致")
  const s2 = mkState()
  restoreLines(s2, { history: msgs(9_000).slice(-200), total: 300, base: 100 })
  assert.equal(s2.lines.some((l) => /earlier messages trimmed/.test(l.text)), false, "未超额无收据")
  assert.equal(s2.lines[0].text, "… 100 more earlier messages (PgUp at top to load)", "头部占位在场")
})

slow("U9 翻页保底：restore + 翻页到底（400 条超额窗口）→ 账一致、可见行数 ≥ min(200, 全量行数)", async () => {
  const { restoreLines, createLoadOlder } = await import("../src/tui/startup.mjs")
  const { pushReal } = await import("@thincoder/core/context.mjs")
  const agent = createAgent({ provider: { name: "mock", model: "m", baseURL: "http://127.0.0.1:1/v1", apiKey: "k" }, tools: [], config: { agent: {} }, cwd: process.cwd(), memory: null })
  const msgs = Array.from({ length: 400 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: `${i}:` + "P".repeat(12_000) }))
  for (const m of msgs) pushReal(agent, m)
  const state = mkState()
  restoreLines(state, { history: msgs.slice(-200), total: msgs.length, base: 200 })
  const loadOlder = createLoadOlder({ agent, state, render: () => {} })
  let guard = 0
  while (state._hasOlder && guard++ < 20) loadOlder()
  assert.equal(state._historyLoaded, msgs.length, "翻至最早（全量已翻）")
  assert.ok(accountCheck(state), "翻页后账目一致")
  assert.ok(state.lines.length >= Math.min(LINES_TRIM_FLOOR, msgs.length), `可见行数 ${state.lines.length} ≥ min(200, 全量)`)
})

test("U11 占位行移除出账（ED-3）：含/不含占位行 + 两次 loadOlder 重放——Σ lineChars = 账（不变式）", async () => {
  const { restoreLines, createLoadOlder } = await import("../src/tui/startup.mjs")
  const { pushReal } = await import("@thincoder/core/context.mjs")
  const { releaseLine } = await import("../src/tui/display-budget.mjs")
  // 判据 2（反证——不含占位行）：同式成立（不引入反向偏差）
  const s1 = mkBudget(["a".repeat(10), "b".repeat(20)])
  assert.ok(accountCheck(s1), "判据 2：不含占位行时直算 = 账")
  // 220 条小消息（总量 ≈12K——预算内 ⇒ 恢复后占位行幸存于 lines[0]，翻页时经 shift 移除）
  const agent = createAgent({ provider: { name: "mock", model: "m", baseURL: "http://127.0.0.1:1/v1", apiKey: "k" }, tools: [], config: { agent: {} }, cwd: process.cwd(), memory: null })
  const msgs = Array.from({ length: 220 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: `${i}:` + "e".repeat(60) }))
  for (const m of msgs) pushReal(agent, m)
  const state = mkState()
  restoreLines(state, { history: msgs.slice(-200), total: msgs.length, base: 200 })
  // 判据 1（含占位行）：占位行在场 + Σ lineChars = 账
  assert.equal(state.lines[0].text.startsWith("… "), true, "判据 1 前置：头部占位在场")
  assert.ok(accountCheck(state), "判据 1：含占位行时直算 = 账")
  // 判据 3（重放无漂移）：两次 loadOlder 后等式仍成立（占位行 shift 出账）
  const loadOlder = createLoadOlder({ agent, state, render: () => {} })
  loadOlder()
  assert.ok(accountCheck(state), "判据 3：第 1 次翻页（占位行移除出账）后直算 = 账")
  assert.equal(state._historyLoaded, msgs.length, "首翻后全量已载")
  assert.equal(state._hasOlder, false, "已无更早（占位行移除且不再补）")
  loadOlder()
  assert.ok(accountCheck(state), "判据 3：第 2 次调用（零动作）后直算 = 账")
  // releaseLine 直驱：同额负向出账 + 钳 0（不转负）
  const s2 = mkBudget(["abc", "defgh"])
  const before = s2._linesChars
  releaseLine(s2, s2.lines[1])
  assert.equal(s2._linesChars, before - 5, "releaseLine 同额负向出账（lineChars 单口径）")
  releaseLine(s2, s2.lines[0])
  releaseLine(s2, s2.lines[0])
  assert.equal(s2._linesChars, 0, "钳 0（不转负）")
})

test("AC-TB2 常量单源：各载体额度从 display-budget 导入断言（值锁）", () => {
  assert.equal(LINE_MAX_CHARS, 64_000)
  assert.equal(ARGS_JSON_MAX_CHARS, 24_000)
  assert.equal(TOOL_RESULT_MAX_CHARS, 64_000)
  assert.equal(TOOL_OUTPUT_ENTRY_MAX_CHARS, 8_000)
  assert.equal(TOOL_OUTPUT_TOTAL_MAX_CHARS, 128_000)
  assert.equal(SUB_BLOCK_CHAR_LIMIT, 128_000)
  assert.equal(ADVISOR_TEXT_MAX_CHARS, 128_000)
  assert.equal(STREAM_MAX_CHARS, 256_000)
  assert.equal(LINES_CHAR_BUDGET, 2_000_000)
  assert.equal(LINES_TRIM_FLOOR, 200)
  assert.equal(SEARCH_MATCH_CAP, 10_000)
  assert.equal(SUB_BLOCK_LINE_LIMIT, 500, "行数维原样保留（D-TB5）")
  // 纯函数本体单源（text-budget）——display-budget 的 appendCapped 与 agent 侧同源
  assert.equal(appendCappedText("a".repeat(10), "b", { hard: 100 }), "a".repeat(10) + "b")
  // 行计长覆盖载体字段（lineChars 单口径）
  const l = { text: "abc", _toolBlock: { argsSummary: "x", argsJson: ["1"], output: ["22"], result: ["333"], summary: "s" } }
  assert.equal(lineChars(l), 3 + 1 + 1 + 2 + 3 + 1)
})
