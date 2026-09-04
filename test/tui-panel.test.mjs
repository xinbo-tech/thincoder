/**
 * tui-panel.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): tui.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { stringWidth, wrapText } from "../src/tui/render.mjs"
import { computeLayout } from "../src/tui/layout.mjs"
import { buildConvLines } from "../src/tui/render-conversation.mjs"
import { renderSubagentPanel } from "../src/tui/subagent-panel.mjs"
import { C } from "../src/tui/ansi.mjs"
import { convCacheKey, renderHeader, renderConversation, renderTodo } from "../src/tui/render-frame.mjs"

function tuiState(overrides = {}) {
  return {
    lines: [], streaming: "", input: [], cursor: 0,
    history: [], historyIndex: -1, _draft: null, scroll: 0,
    processing: false, controller: null,
    permission: null, permissionPreview: [], question: null,
    picker: null, wizard: null, tasks: [],
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
    ctxCache: { len: -1, tokens: 0 }, reasoning: "",
    _advisorBlocks: [], // matches index.mjs baseline (advisor ordered blocks)
    toolStreams: {}, subTasks: {}, outputPanels: {},
    currentTool: null, processingStarted: 0, status: "Ready", queue: [],
    ...overrides,
  }
}
function noop() {}


// ---------------------------------------------------------------- panel render functions (incremental rendering)



test("foldKey 稳定: loadOlder 头部 unshift 后展开态仍绑原工具块（P1，2026-08-30）", async () => {
  // 模拟：restore 一批含工具块的行 → 展开 tool 块 → loadOlder unshift 更早行 → 展开态必须跟随原块
  const { historyToLines } = await import("../src/tui/startup.mjs")
    const { buildConvLines } = await import("../src/tui/render-conversation.mjs")
  const state = {
    lines: [], expandedBlocks: new Set(),
    streaming: "", reasoning: "", subTasks: {}, _historyLoaded: 0, _historyTotal: 0, _hasOlder: false,
    foldEnabled: true, _lineIdCounter: 0, scroll: 0,
  }
  const history = [
    { role: "user", content: "早前消息" },
    { role: "assistant", content: "", tool_calls: [{ id: "t-old", function: { name: "read", arguments: "{}" } }] },
    { role: "tool", tool_call_id: "t-old", content: "old result" },
    { role: "user", content: "看图" },
    { role: "assistant", content: "", tool_calls: [{ id: "t-new", function: { name: "read", arguments: "{}" } }] },
    { role: "tool", tool_call_id: "t-new", content: "new result" },
    { role: "user", content: "独特尾行 " + "x".repeat(120) },
  ]
  // restoreLines 物化全部（INITIAL_HISTORY_MESSAGES 可能截断——直接调 historyToLines + 补 id 模拟 loadOlder 前状态）
  state.lines.push(...historyToLines(history, 0, history.length))
  for (const l of state.lines) l._lineId = ++state._lineIdCounter
  // 展开最后一个工具块（new）
  const lastTool = state.lines.findLast((l) => l._toolBlock)
  const keyBefore = `tool-${lastTool._lineId}`
  state.expandedBlocks.add(keyBefore)
  // 模拟 loadOlder：头部 unshift 两个更早消息（无工具）
  state.lines.unshift({ text: "更早的 user", color: C.text, _lineId: ++state._lineIdCounter }, { text: "更早的 assistant", color: C.text, _lineId: ++state._lineIdCounter })
  const lines2 = buildConvLines(state, 80)
  // 展开态必须还在原块上（new result 可见），而不是错绑到 old
  const rendered = lines2.map((l) => l.text).join("\n")
  assert.ok(rendered.includes("new result"), "展开态仍绑 new 块（内容可见）")
})



test("restore 结果守卫: read_image base64 剥离 + 400 行封顶（P1，2026-08-30）", async () => {
  const { slimToolResultForDisplay } = await import("../src/tui/tool-events.mjs")
  const big = JSON.stringify({ text: "ok", images: ["data:image/png;base64," + "Z".repeat(1000)] })
  const rows = slimToolResultForDisplay(big)
  assert.deepEqual(rows, ["ok"], "base64 剥离只留 text")
  const huge = Array.from({ length: 500 }, (_, i) => `row ${i}`).join("\n")
  const capped = slimToolResultForDisplay(huge)
  assert.equal(capped.length, 401, "400 行 + 截断提示")
  assert.ok(capped[400].includes("truncated"), "截断提示行")
})




test("subagent 面板带顶部边界线（§7.2.1 NF2/D2）；无 running 块 → 面板不渲染、无悬空线", () => {
  const now = Date.now()
  const state = tuiState({
    lines: [{ text: "会话内容", color: C.text, _kind: "text" }],
    subTasks: { "coder#1": { key: "coder#1", role: "coder", model: "m", started: now, done: false, blocks: [{ kind: "text", text: "hello" }], currentTool: null, toolArgs: null, turn: 1, maxTurns: 10, approval: null, lastError: null, dropped: 0 } },
  })
  const out = renderSubagentPanel(state, 80, 24)
  assert.ok(out[0]?.text.startsWith("─") && out[0].color === C.dim, "面板顶部边界线（现状分隔线语义迁移）")
  assert.ok(out.some((l) => l.text.includes("[▶ coder#1")), "运行区块头在面板")
  // 运行区块不再进会话流（渲染目标审计：分隔线/区块头均迁出 buildConvLines）
  const conv = buildConvLines(state, 80)
  assert.ok(!conv.some((l) => l.text.startsWith("─")), "会话流无面板分隔线残留")
  // done 块（冻结进 lines 后 subTasks 里只剩 done 条目）→ 面板不渲染（无悬空线）
  state.subTasks["coder#1"].done = true
  assert.deepEqual(renderSubagentPanel(state, 80, 24), [], "无 running 块 → 面板不渲染（F6）")
})



test("subagent 面板存在条件扩（§20 D-SD3b supersede §7.2.1 F6/T2）：queued-only（无 running）→ 面板保持——waiting 块 waiting for 标注/槽等位标注", () => {
  const now = Date.now()
  // ① waiting-deps 块（depc 标注——依赖取消留 queued 分支）
  const depcState = tuiState({
    lines: [{ text: "会话内容", color: C.text, _kind: "text" }],
    subTasks: {
      "eng-coder#3": {
        key: "eng-coder#3", role: "eng-coder", started: now, done: false, async: undefined,
        blocks: [], currentTool: null, toolArgs: null, turn: 0, maxTurns: 0,
        approval: null, lastError: null, dropped: 0,
        queued: { kind: "depc", position: 1, detail: "dependency cancelled: eng-coder#1 — waiting for your decision (cancel this task to release, or AUTO starts it)" },
      },
    },
  })
  const out = renderSubagentPanel(depcState, 80, 24)
  assert.ok(out.length > 0, "queued-only → 面板保持（running ∪ queued 非空——D-SD3b）")
  const depcText = out.map((l) => String(l.text).replace(/\x1b\[[0-9;]*m/g, "")).join("\n")
  assert.ok(depcText.includes("[▶ eng-coder#3 · waiting"), "waiting 块括号词 waiting（不误标 sync——未启动）")
  assert.ok(depcText.includes("dependency cancelled"), "depc 原因恒显示（滞留不静默——NF-SD）")
  assert.ok(!depcText.includes("⏹"), "waiting 块无 ⏹（未启动——门控不变）")
  const layout = computeLayout(depcState, { cols: 80, rows: 24 })
  assert.ok(layout.panels.subagent.h > 0, "layout 含面板槽（queued-only 保持）")
  // ② slot 等位标注（槽满等位——position 可见）
  const slotState = tuiState({
    subTasks: {
      "explore#4": {
        key: "explore#4", role: "explore", started: now, done: false,
        blocks: [], currentTool: null, toolArgs: null, turn: 0, maxTurns: 0,
        approval: null, lastError: null, dropped: 0,
        queued: { kind: "slot", position: 2, detail: "" },
      },
    },
  })
  const slotText = renderSubagentPanel(slotState, 80, 24).map((l) => String(l.text).replace(/\x1b\[[0-9;]*m/g, "")).join("\n")
  assert.ok(slotText.includes("[▶ explore#4 · queued"), "slot 等位头括号词 queued")
  assert.ok(slotText.includes("queued · position 2（槽满等位）"), "等位标注含 position + 原因")
  // ③ 空态回归：全 done → 无面板（F6 原义——无悬空线）
  depcState.subTasks["eng-coder#3"].done = true
  assert.deepEqual(renderSubagentPanel(depcState, 80, 24), [], "done-only → 面板不渲染（F6 回归）")
})




test("subagent 面板：多子 agent 并行全显示（§7.2.1 T4/F2 自适应高度）", () => {
  const now = Date.now()
  const state = tuiState({
    subTasks: {
      "coder#1": { key: "coder#1", role: "coder", model: "glm-5.3", started: now, done: false, blocks: [{ kind: "text", text: "alpha\nbeta\ngamma\ndelta" }], currentTool: "write", toolArgs: null, turn: 3, maxTurns: 100, approval: null, lastError: null, dropped: 0 },
      "explore#2": { key: "explore#2", role: "explore", model: "deepseek-chat", started: now, done: false, blocks: [{ kind: "text", text: "x\ny\nz" }], currentTool: null, toolArgs: null, turn: 1, maxTurns: 20, approval: null, lastError: null, dropped: 0 },
    },
  })
  const out = renderSubagentPanel(state, 80, 24)
  assert.ok(out[0]?.text.startsWith("─"), "顶部分隔线")
  const joined = out.map((l) => String(l.text).replace(/\x1b\[[0-9;]*m/g, "")).join("\n")
  assert.ok(joined.includes("[▶ coder#1 · sync · glm-5.3") && joined.includes("[▶ explore#2 · sync · deepseek-chat"), "两个并行区块折叠头都在面板（sync 显式头标）")
  assert.ok(joined.includes("turn 3/100") && joined.includes("turn 1/20"), "各自 turn 状态")
  // 每个区块折叠态 = 头 + tail ≤3（N 区块 → 面板 = 1 分隔线 + N×(1+tail)）
  const tailLines = out.filter((l) => l.text.startsWith("│ ")).length
  assert.ok(tailLines >= 2 && tailLines <= 6, `tail 行在 2..6 之间（每区块 ≤3），实际 ${tailLines}`)
  // 高度自适应：面板行数 = 全部运行区块完整渲染（layout 预计算同源）
  const layout = computeLayout(state, { cols: 80, rows: 24 })
  assert.equal(layout.panels.subagent.h, out.length, "subagentH = 面板渲染行数（F2）")
})



test("panel functions: renderHeader includes model name", () => {
  const agent = {
    provider: { model: "deepseek-v4-pro", thinking: null },
    cwd: "/home/user/project",
  }
  const line = renderHeader(agent, 100)
  assert.ok(line.includes("ThinCoder"))
  assert.ok(/\d+\.\d+\.\d+/.test(line), "版本号紧跟 logo 后显示（2026-08-31）")
  assert.ok(line.includes("deepseek-v4-pro"))
  assert.ok(line.includes("project"))
})



test("panel functions: renderHeader with thinking mode shows badge", () => {
  const agent = {
    provider: { model: "glm-5.2", thinking: { type: "enabled" }, reasoningEffort: "max" },
    cwd: "/project",
  }
  const line = renderHeader(agent, 120)
  assert.ok(line.includes("think: max"))
})



test("panel functions: convCacheKey changes on streaming append", () => {
  const s1 = tuiState({ streaming: "hello" })
  const s2 = tuiState({ streaming: "hello world" })
  const k1 = convCacheKey(s1)
  const k2 = convCacheKey(s2)
  assert.notEqual(k1, k2)
})



test("panel functions: convCacheKey stable on scroll change alone", () => {
  const s = tuiState({ lines: [{ text: "a", color: "" }] })
  const k1 = convCacheKey(s)
  s.scroll = 5
  const k2 = convCacheKey(s)
  assert.equal(k1, k2)
})



test("panel functions: renderConversation returns correct line count", () => {
  const state = tuiState({
    lines: [
      { text: "line1", color: "" },
      { text: "line2", color: "" },
      { text: "line3", color: "" },
    ],
  })
  const lines = renderConversation(state, 80, 10, 0)
  assert.equal(lines.length, 10) // pad to visibleH
})



test("panel functions: renderTodo shows status marks", () => {
  const tasks = [
    { title: "done task", status: "done" },
    { title: "in progress", status: "in_progress" },
    { title: "pending", status: "pending" },
  ]
  const lines = renderTodo(tasks, 80)
  assert.equal(lines.length, 4, "divider + 3 task rows")
  assert.ok(lines[0].includes("─"), "divider line on top")
  assert.ok(lines[1].includes("✓"))
  assert.ok(lines[2].includes("▶"))
  assert.ok(lines[3].includes("○"))
})



test("panel functions (§7.2.1 T4/T-A 渲染目标审计): 子agent 区块 — 面板折叠头 + tail 3 + 展开全量", () => {
  // 运行区块渲染于固定底部面板（subagent-panel.mjs）；折叠/展开交互与 D4 现状一致
  const blocks = [
    { kind: "think", text: "先读文件" },
    { kind: "tool", text: "❯ bash — npm test\noutput line1\noutput line2\noutput line3\n" },
    { kind: "text", text: "final summary" },
  ]
  const mk = (expanded) => tuiState({
    subTasks: {
      "coder#1": { key: "coder#1", role: "coder", model: "glm-5.3", blocks, done: false, started: Date.now(), currentTool: "bash", turn: 12, maxTurns: 100, approval: null, lastError: null },
    },
    expandedBlocks: expanded ? new Set(["sub-coder#1"]) : new Set(),
  })
  // 折叠态：头部摘要 + tail ≤3 行，不出现最旧内容
  const folded = renderSubagentPanel(mk(false), 100).map((l) => l.text.replace(/\x1b\[[0-9;]*m/g, ""))
  const headIdx = folded.findIndex((t) => t.includes("[▶ coder#1 · sync · glm-5.3"))
  assert.ok(headIdx >= 0, "折叠头存在（面板）——含 sync 显式头标（无 async 标记 = sync——D-M7b）")
  assert.ok(folded[headIdx].includes("turn 12/100"), "头部含 turn n/max")
  assert.ok(folded[headIdx].includes("bash"), "头部含当前工具（bash tail 摘要）")
  const tailCount = folded.filter((t, i) => i > headIdx && t.startsWith("│ ")).length
  assert.ok(tailCount <= 3, `折叠态 tail ≤ 3 行，实际 ${tailCount}`)
  assert.ok(tailCount > 0, "折叠态有 tail 行")
  assert.ok(!folded.some((t) => t.includes("先读文件")), "折叠态不显示最旧的 think 块")
  // 展开态：全量按 kind 着色
  const expandedState = mk(true)
  const expanded = renderSubagentPanel(expandedState, 100)
  const joined = expanded.map((l) => l.text.replace(/\x1b\[[0-9;]*m/g, "")).join("\n")
  assert.ok(joined.includes("先读文件"), "展开显示 think 块")
  assert.ok(joined.includes("output line1") && joined.includes("output line3"), "展开显示全部 tool 输出")
  assert.ok(joined.includes("final summary"), "展开显示 text 块")
  const thinkLine = expanded.find((l) => l.text.includes("先读文件"))
  assert.equal(thinkLine?.color, C.reason, "think=C.reason")
  const toolLine = expanded.find((l) => l.text.includes("output line1"))
  assert.equal(toolLine?.color, C.tool, "tool=C.tool")
  const textLine = expanded.find((l) => l.text.includes("final summary"))
  assert.equal(textLine?.color, C.text, "text=C.text")
  // 折叠控制线可点击（foldHint 走法）
  const head = renderSubagentPanel(mk(false), 100).find((l) => l.text.includes("[▶ coder#1"))
  assert.equal(head?._foldToggle, "sub-coder#1", "头部 fold key = sub-<key>，跨 turn 保持折叠状态（T9）")
})



test("panel functions (§7.2.1 T-C 渲染目标审计): 面板头 approval 等待 + 冻结 ✓ 头定格（T8）", () => {
  // 运行中 approval → 面板折叠头 ⏸ + "等待审批"（评审 #5：图标在括号内）
  const approvalState = tuiState({
    subTasks: {
      "coder#2": { key: "coder#2", role: "coder", model: "m", blocks: [], done: false, started: Date.now(), currentTool: null, turn: 3, maxTurns: 100, approval: "write", lastError: null },
    },
  })
  const approvalOut = renderSubagentPanel(approvalState, 100).map((l) => l.text.replace(/\x1b\[[0-9;]*m/g, "")).join("\n")
  assert.ok(approvalOut.includes("⏸ coder#2"), "等待审批图标（面板）")
  assert.ok(approvalOut.includes("等待审批: write"), "头部显示等待审批：tool")
  // done 区块：冻结进流（_frozenSubTask ✓ 头 + 定格耗时），面板移除该区块
  const doneState = tuiState({
    lines: [{ text: "carrier", color: C.dim, _frozenSubTask: { key: "coder#2", role: "coder", model: "m", blocks: [{ kind: "tool", text: "❯ bash — x\n" }], done: true, doneAt: Date.now(), started: Date.now() - 120000, currentTool: null, turn: 40, maxTurns: 100, approval: null, lastError: "turn cap reached — work may be partial" } }],
    subTasks: { "coder#2": { key: "coder#2", role: "coder", model: "m", blocks: [{ kind: "tool", text: "❯ bash — x\n" }], done: true, doneAt: Date.now(), started: Date.now() - 120000, currentTool: null, turn: 40, maxTurns: 100, approval: null, lastError: "turn cap reached — work may be partial" } },
  })
  assert.deepEqual(renderSubagentPanel(doneState, 100), [], "done → 面板移除该区块（F5）")
  const doneOut = buildConvLines(doneState, 100).map((l) => l.text.replace(/\x1b\[[0-9;]*m/g, "")).join("\n")
  assert.ok(doneOut.includes("✓ coder#2"), "冻结进流渲染 ✓ 头")
  assert.ok(doneOut.includes("done 120s"), "冻结头定格耗时")
  assert.ok(doneOut.includes("turn cap reached"), "lastError 定格在冻结头")
})



test("panel functions (§19.5 T-M19/T-M23 渲染): ⟦ev⟧stopped 冻结头标题 \"stopped\"（interrupted 语义）+ ⏹ 标记仅 running", () => {
  // stopped 冻结：流内冻结块头 = "stopped Ns"（非 done）；async 标识随冻结保留
  const stoppedState = tuiState({
    lines: [{ text: "carrier", color: C.dim, _frozenSubTask: { key: "eng-coder#3", role: "eng-coder", async: true, model: "m", blocks: [{ kind: "text", text: "partial work" }], done: true, doneAt: Date.now(), started: Date.now() - 3000, stopped: true, currentTool: null, turn: 2, maxTurns: 100, approval: null, lastError: null } }],
  })
  const stoppedOut = buildConvLines(stoppedState, 100).map((l) => l.text.replace(/\x1b\[[0-9;]*m/g, "")).join("\n")
  assert.ok(stoppedOut.includes("[✓ eng-coder#3 · async · m · stopped 3s"), `stopped 冻结头标题 + async 标识保留（实际: ${stoppedOut.slice(0, 120)}）`)
  assert.ok(!stoppedOut.includes("· done "), "stopped 块不显示 done 动词")
  // running async 面板头带 ⏹（dim 标记在右缘——_stopSub/_stopCol 元数据）
  const runState = tuiState({
    subTasks: { "coder#1": { key: "coder#1", role: "coder", async: true, model: "m", blocks: [], done: false, started: Date.now(), currentTool: "bash", turn: 1, maxTurns: 100, approval: null, lastError: null } },
  })
  const panel = renderSubagentPanel(runState, 100)
  const head = panel.find((l) => l._foldToggle === "sub-coder#1")
  assert.ok(head && head._stopSub === "coder#1" && head._stopCol === 99, "运行头 ⏹ 命中元数据（内收一列——glyph cols−1）")
  assert.ok(String(head.text).includes("⏹"), "运行头渲染 ⏹ 标记")
})



test("panel functions (§19.5 D-M7b): 头标 async/sync 显式标识 + ⏹ 仅 async 门控（running/冻结/角色门）", () => {
  // ① async 区块：async 头标（dim——ANSI 注入）+ ⏹ 元数据齐全
  const asyncState = tuiState({
    subTasks: { "eng-coder#2": { key: "eng-coder#2", role: "eng-coder", async: true, model: "glm-5.3", blocks: [], done: false, started: Date.now(), currentTool: "read", turn: 2, maxTurns: 100, approval: null, lastError: null } },
  })
  const aHead = renderSubagentPanel(asyncState, 100).find((l) => l._foldToggle === "sub-eng-coder#2")
  const aText = String(aHead.text).replace(/\x1b\[[0-9;]*m/g, "")
  assert.ok(aText.includes("[▶ eng-coder#2 · async · glm-5.3"), `async 头标在 key 后模型前（实际: ${aText.slice(0, 60)}）`)
  assert.ok(String(aHead.text).includes("\x1b[2masync\x1b[36m"), "async 词套 dim + 恢复行色（截断后注入——自闭合，code review 🔵#4）")
  assert.ok(aHead._stopSub === "eng-coder#2" && aHead._stopCol === 99, "async 运行头带 ⏹（内收一列——glyph cols−1——code review 🟡#1）")
  // ② sync 区块（无 async 标记）：sync 显式头标 + 无 ⏹（杜绝"可见但不可中止"误导）
  const syncState = tuiState({
    subTasks: { "explore#1": { key: "explore#1", role: "explore", model: "deepseek-chat", blocks: [], done: false, started: Date.now(), currentTool: "read", turn: 1, maxTurns: 100, approval: null, lastError: null } },
  })
  const sHead = renderSubagentPanel(syncState, 100).find((l) => l._foldToggle === "sub-explore#1")
  const sText = String(sHead.text).replace(/\x1b\[[0-9;]*m/g, "")
  assert.ok(sText.includes("[▶ explore#1 · sync · deepseek-chat"), `sync 显式头标——不靠没标推断（实际: ${sText.slice(0, 60)}）`)
  assert.ok(!sHead._stopSub && !sText.includes("⏹"), "sync 区块无 ⏹（门控：running && SUBAGENT_ROLES && sub.async）")
  // ③ frozen 保留（done 头历史语义——与 model 标识同生命周期）：async 与 sync 都保留
  const frozenAsync = tuiState({
    lines: [{ text: "carrier", color: C.dim, _frozenSubTask: { key: "coder#7", role: "coder", async: true, model: "glm-5.3", blocks: [], done: true, doneAt: Date.now(), started: Date.now() - 5000, turn: 1, maxTurns: 100, approval: null, lastError: null } }],
  })
  const fa = buildConvLines(frozenAsync, 100).map((l) => l.text.replace(/\x1b\[[0-9;]*m/g, "")).join("\n")
  assert.ok(fa.includes("[✓ coder#7 · async · glm-5.3 · done 5s"), "冻结 async 头保留 async 标识")
  const frozenSync = tuiState({
    lines: [{ text: "carrier", color: C.dim, _frozenSubTask: { key: "explore#3", role: "explore", blocks: [], done: true, doneAt: Date.now(), started: Date.now() - 8000, turn: 1, maxTurns: 20, approval: null, lastError: null } }],
  })
  const fs = buildConvLines(frozenSync, 100).map((l) => l.text.replace(/\x1b\[[0-9;]*m/g, "")).join("\n")
  assert.ok(fs.includes("[✓ explore#3 · sync · done 8s"), "冻结 sync 头保留 sync 标识")
  // ④ 角色门：压缩面板（role compress——复用面板槽但非 subagent spawn）无 sync/async 标识
  const compState = tuiState({
    subTasks: { "compress#9": { key: "compress#9", role: "compress", blocks: [], done: false, started: Date.now(), currentTool: "compressing context…", turn: 0, maxTurns: 0, approval: null, lastError: null } },
  })
  const cText = String(renderSubagentPanel(compState, 100).find((l) => l._foldToggle === "sub-compress#9").text).replace(/\x1b\[[0-9;]*m/g, "")
  assert.ok(!cText.includes("· sync ·") && !cText.includes("· async ·"), "compress 头无 sync/async 标识（真实 subagent 角色门）")
})



test("panel functions (§19.5 D-M7b 处置 #4——评审 #4, superseded by §20 D-SD3b): queued→running——排队 spawn 返回即建 waiting 块（⟦ev⟧queued）——补位启动 async 清标转 running（同 key 不重建）——⏹ 随实际启动可见", async () => {
  const { routeSubToken } = await import("../src/tui/subagent-blocks.mjs")
  const noop = () => {}
  const s = tuiState()
  // 4 个 running async 槽（真实 token 流：async 标记 → [model] → 内容）
  for (let i = 1; i <= 4; i++) {
    routeSubToken(s, `coder#${i}/⟦ev⟧async\x1e`, noop)
    routeSubToken(s, `coder#${i}/[model]glm-5.3`, noop)
    routeSubToken(s, `coder#${i}/working on task ${i}`, noop)
  }
  // 第 5 个 async spawn 入队——§20 D-SD3b（supersede 旧"入队不 paint"语义）：spawn 返回
  // 即发 ⟦ev⟧queued（事件通道——round2 #2）→ 块即刻存在（slot 等位标注）——面板保持
  // 条件 = running ∪ queued 非空（queued-only 面板保持——T2 断言同步扩）。
  routeSubToken(s, "coder#5/⟦ev⟧queued\x1eslot\x1e1\x1equeued\x1e", noop)
  assert.ok(s.subTasks["coder#5"], "排队 spawn 返回即建块（不等首 token/不待启动）")
  assert.deepEqual(
    s.subTasks["coder#5"].queued,
    { kind: "slot", position: 1, detail: "" },
    "slot 等位标注（kind/position——启动后清除）",
  )
  assert.equal(s.subTasks["coder#5"].async, undefined, "未启动——async 标记未置（⏹ 门控判定源）")
  const qHeads = renderSubagentPanel(s, 100).filter((l) => l._foldToggle === "sub-coder#5")
  assert.ok(qHeads.length === 1, "queued-only 块渲染于面板（面板存在条件扩——queued 驻留面板保持）")
  const qText = String(qHeads[0].text).replace(/\x1b\[[0-9;]*m/g, "")
  assert.ok(qText.includes("[▶ coder#5 · queued"), `slot 等位头括号词 queued（实际: ${qText.slice(0, 70)}）`)
  assert.ok(qText.includes("queued · position 1"), `等位标注含 position（实际: ${qText.slice(0, 90)}）`)
  assert.ok(!qHeads[0]._stopSub && !qText.includes("⏹"), "等位块无 ⏹（未启动——⏹ 随实际启动出现）")
  // 腾槽补位启动：实际启动 token 流——async 事件命中同 key 转 running（不重建——块清除
  // waiting 标注 + started 归零）；⏹ 门控随 async 置位出现。
  const keyRef = s.subTasks["coder#5"]
  routeSubToken(s, "coder#5/⟦ev⟧async\x1e", noop)
  routeSubToken(s, "coder#5/[model]glm-5.3", noop)
  routeSubToken(s, "coder#5/starting now", noop)
  assert.equal(s.subTasks["coder#5"], keyRef, "同 key 不重建（既有 ensureSubTaskKey 语义——D-SD3b）")
  assert.equal(s.subTasks["coder#5"].queued, undefined, "启动后 waiting 标注清除（转正常 running 态）")
  assert.equal(s.subTasks["coder#5"].async, true, "async 标记置位（⏹ 门控判定源）")
  const head5 = renderSubagentPanel(s, 100).find((l) => l._foldToggle === "sub-coder#5")
  assert.ok(head5, "补位启动块渲染于面板")
  assert.equal(head5._stopSub, "coder#5", "⏹ 命中元数据随补位启动出现（queued→running ⏹ 可见性——处置 #4）")
  assert.equal(head5._stopCol, 99, "⏹ 内收一列（glyph cols−1）")
  const t5 = String(head5.text).replace(/\x1b\[[0-9;]*m/g, "")
  assert.ok(t5.includes("⏹") && t5.includes("[▶ coder#5 · async"), `补位启动头含 async 标识 + ⏹（实际: ${t5.slice(0, 80)}）`)
})



test("panel functions (§19.5 T-M25 渲染): 嵌套子标行 dim 样式——行首子标 gray、内容恢复 kind 色", async () => {
  const { styleSubLabelRow } = await import("../src/tui/subagent-panel.mjs")
  const { ansi, C: CC } = await import("../src/tui/ansi.mjs")
  // 行首子标行（renderBlockTimeline 形态——gutter + 字面子标 + 内容）
  const toolRow = styleSubLabelRow({ text: "│ explore#1 · ❯ read — x", color: CC.tool })
  assert.ok(toolRow.text.includes(`${ansi.gray}explore#1 · ${ansi.fg(6)}❯ read`), "工具行：子标 gray + 内容恢复 cyan（ANSI 注入）")
  const textRow = styleSubLabelRow({ text: "│ explore#1 · 摘要", color: CC.text })
  assert.ok(textRow.text.includes(`${ansi.gray}explore#1 · ${ansi.fg(7)}摘要`), "文本行同规则（恢复白）")
  // 无子标行原样
  const plain = styleSubLabelRow({ text: "│ 普通内容", color: CC.tool })
  assert.equal(plain.text, "│ 普通内容")
})



test("panel functions (§7.2 D5): 事件 token 残留被 sanitizeDisplay 兜底剥除", async () => {
  const { sanitizeDisplay } = await import("../src/tui/render.mjs")
  const raw = "coder#1/⟦ev⟧turn\x1e12\x1e100\x1ellm\x1e"
  const cleaned = sanitizeDisplay(raw)
  assert.ok(!cleaned.includes("⟦ev⟧"), "哨兵剥除")
  assert.ok(!cleaned.includes("\x1e"), "RS 控制字符剥除")
  assert.ok(cleaned.includes("coder#1/"), "普通前缀文本不受影响")
  // §19.5 D-M7b：零字段 async 标记（无 4 字段——走哨兵+字母剥除 + RS 剥除兜底）
  const rawAsync = "coder#2/⟦ev⟧async\x1e"
  assert.equal(sanitizeDisplay(rawAsync), "coder#2/", "async 零字段标记兜底剥净（prefix 保留）")
  assert.equal(sanitizeDisplay("normal ⟦ev⟧ mid-token"), "normal  mid-token", "哨兵后无字母 phase = 正文合法内容（如讨论 ACP 桥的表格），只剥哨兵本身——2026-08-31 用户实证：旧'剥到行尾'语义把真实正文吃到串尾")
})



test("panel functions (§7.2.1 T-H 修订): 窄带特有断言保留 — subPanelH/renderSubagent 已删；新面板槽条件存在", () => {
  // 窄带（D4 前）与 output 面板（D6）的面板槽消亡断言（T-H 语义保留——
  // 评审 #1：原断言"layout 无 subagent 槽"与本设计重新加槽冲突，改为窄带特有断言）
  const base = computeLayout(tuiState(), { cols: 80, rows: 24 })
  assert.equal(base.panels.subagent, null, "无运行中区块 → 面板不渲染（F6）")
  assert.equal(base.panels.output, undefined, "output 槽仍废弃（D6）")
  assert.ok(!("subPanelH" in base), "窄带 subPanelH 已删")
  const running = computeLayout(tuiState({
    subTasks: { "explore#1": { key: "explore#1", role: "explore", blocks: [], done: false, started: Date.now() } },
  }), { cols: 80, rows: 24 })
  assert.ok(running.panels.subagent, "运行中区块 → 面板槽恢复（§7.2.1 D1）")
})



test("panel functions: convCacheKey 不再随运行中 subTasks 变化失效（§7.2.1：运行区块已移出会话渲染）", () => {
  // D5/N3 修订：运行区块渲染于固定面板（逐帧重渲染、无缓存）——会话缓存键与
  // 子agent 活动解耦（否则每次子agent token 追加都全量重建会话，2026-08-31
  // 懒加载优化被架空）；冻结载体行进流仍失效（lines.length + frozenSig 覆盖）。
  const s1 = tuiState({
    subTasks: { "coder#1": { key: "coder#1", role: "coder", blocks: [{ kind: "text", text: "a" }], done: false, started: Date.now(), currentTool: null, turn: 1, maxTurns: 100, approval: null, lastError: null, blockEpoch: 1 } },
  })
  const k1 = convCacheKey(s1)
  s1.subTasks["coder#1"].blockEpoch = 2
  assert.equal(convCacheKey(s1), k1, "运行区块增长不再失效会话缓存（面板独立渲染）")
  s1.subTasks["coder#1"].turn = 2
  assert.equal(convCacheKey(s1), k1, "turn 更新不再失效会话缓存")
  // 冻结载体行进流 → 会话缓存失效（既有 D5 语义保持）
  const s2 = tuiState()
  const k2 = convCacheKey(s2)
  s2.lines.push({ text: "carrier", color: C.dim, _frozenSubTask: { key: "coder#1", blocks: [], done: true, doneAt: 0, started: 0 } })
  assert.notEqual(convCacheKey(s2), k2, "冻结进流 → 会话缓存失效")
})



test("panel functions: 运行中区块 elapsed 走秒由面板逐帧刷新（§7.2.1：面板无缓存）", () => {
  // 回归（2026-08-30 评审）：运行区块的头部 "45s" 必须走秒——面板渲染无缓存
  // （每帧重建，layout 预计算），1s ticker（agent-turn subRunning 条件）触发
  // 渲染即刷新；会话缓存键不再含时间分量（不随走秒失效）。
  const sub = { key: "coder#1", role: "coder", blocks: [{ kind: "text", text: "a" }], done: false, started: Date.now() - 5000, currentTool: null, turn: 1, maxTurns: 100, approval: null, lastError: null, blockEpoch: 1 }
  const s = tuiState({ subTasks: { "coder#1": sub } })
  const k1 = convCacheKey(s)
  const panelAt = (now) => {
    const orig = Date.now
    Date.now = () => now
    try { return renderSubagentPanel(s, 80).map((l) => l.text).join("\n") } finally { Date.now = orig }
  }
  const h1 = panelAt(Date.now())
  const h2 = panelAt(Date.now() + 1000)
  assert.notEqual(h1, h2, "面板头部 elapsed 走秒（1s ticker 刷新目标）")
  assert.equal(convCacheKey(s), k1, "会话缓存键稳定（不随运行区块时间推进）")
  // done 后面板移除该区块（F5）——不再渲染、无走秒
  sub.done = true
  sub.doneAt = sub.started + 5000
  assert.equal(panelAt(Date.now()), "", "done → 面板移除（无渲染）")
})



test("panel functions (#1 评审): 折叠头整行 ≤ cols——长模型名 + 长等待审批态", () => {
  const longModel = "very-long-model-name-with-many-chars-1234567890" // 44 字符
  const state = tuiState({
    subTasks: {
      "coder#1": { key: "coder#1", role: "coder", model: longModel, blocks: [{ kind: "tool", text: "❯ bash — npm test\nrow1\nrow2\nrow3\n" }], done: false, started: Date.now() - 30000, currentTool: "write", toolArgs: { command: "npm test -- --long-flag-option-name" }, turn: 3, maxTurns: 100, approval: "write_file", lastError: null },
    },
  })
  // 整行 ≤ cols 铁律（TUI 布局纪律：任何写入帧的行 ≤ cols）——含窄终端
  // （括号前缀按 cols-2 截断的兜底路径）
  for (const cols of [120, 80, 60, 40]) {
    for (const l of renderSubagentPanel(state, cols)) {
      assert.ok(stringWidth(l.text) <= cols, `cols=${cols}: 行宽 ${stringWidth(l.text)} ≤ ${cols}（${JSON.stringify(l.text)}）`)
    }
  }
  const head = renderSubagentPanel(state, 80).find((l) => l._foldToggle)?.text ?? ""
  assert.ok(!head.includes(longModel), "超长模型名按显示宽度截断（不整串上屏挤掉状态区）")
  assert.ok(head.includes("等待审批"), "等待审批态保留可见（截断模型而非状态）")
})



test("panel functions: search 状态参与缓存键（P0-1：高亮不被缓存吃掉，2026-08-30 会诊）", () => {
  // performSearch 只改 state.search/_searchMatches——若 key 不含 search，
  // 内容静止时缓存命中返回无高亮旧行（高亮永不出现）；关闭搜索时残留也不清。
  const s = tuiState({ lines: [{ text: "hello world", color: C.text }] })
  const k0 = convCacheKey(s)
  s.search = { query: "world", index: 0 }
  const k1 = convCacheKey(s)
  assert.notEqual(k1, k0, "开启搜索 → 键变化（缓存失效，高亮可渲染）")
  s.search.index = 1
  const k2 = convCacheKey(s)
  assert.notEqual(k2, k1, "切换匹配项 → 键变化（高亮跟随导航）")
  s.search = null
  assert.equal(convCacheKey(s), k0, "关闭搜索 → 键复原（残留高亮清除）")
})



test("advisor review 折叠框：默认折叠防刷屏 + 完成后冻结载体行可重开（2026-08-30）", async () => {
  const { buildConvLines } = await import("../src/tui/render-conversation.mjs")
  // ── 运行中（live _advisorBlocks）：默认折叠 = ▶ 头 + tail 3 dim 行 ──
  const live = tuiState({
    _advisorBlocks: [
      { kind: "think", text: "step one\nstep two\nstep three\nstep four\nstep five" },
      { kind: "tool", text: "→ read src/x.mjs" },
    ],
  })
  const liveOut = buildConvLines(live, 100).map((l) => ({ text: l.text.replace(/\x1b\[[0-9;]*m/g, ""), color: l.color, toggle: l._foldToggle }))
  assert.ok(liveOut.some((l) => l.text.includes("▶ [advisor · review]") && l.text.includes("click to expand")), "折叠头控制行")
  assert.ok(liveOut.filter((l) => l.text.startsWith("│ ")).length <= 3, "折叠态 tail ≤ 3 行（防刷屏）")
  assert.ok(liveOut.some((l) => l.toggle === "advisor-blocks"), "toggle key = advisor-blocks")
  assert.ok(!liveOut.some((l) => l.text.includes("step one") && l.text.includes("step two")), "折叠态不铺开全部内容")
  // ── 完成后（agent-turn flush 的 _frozenAdvisor 载体行）：▶ 控制行，可点击重开 ──
  const frozen = tuiState({
    lines: [{ text: "advisor review", color: C.dim, _frozenAdvisor: "review verdict line 1\nreview verdict line 2" }],
  })
  const frozenOut = buildConvLines(frozen, 100).map((l) => ({ text: l.text.replace(/\x1b\[[0-9;]*m/g, ""), toggle: l._foldToggle }))
  assert.ok(frozenOut.some((l) => l.text.includes("▶ [advisor · review done]") && l.text.includes("click to expand")), "冻结评审折叠头")
  assert.ok(!frozenOut.some((l) => l.text.includes("verdict line 1")), "冻结默认不铺开全文")
  const frozenOpen = buildConvLines(
    { ...frozen, expandedBlocks: new Set(["advisor-done-0"]) },
    100,
  ).map((l) => l.text.replace(/\x1b\[[0-9;]*m/g, "")).join("\n")
  assert.ok(frozenOpen.includes("review verdict line 1") && frozenOpen.includes("review verdict line 2"), "展开可见全文（可重开）")
})



test("panel functions (§7.2 T-G): advisor 对象 chunk 与 bash 裸串渲染契约回归", () => {  // T-G: advisor blocks 渲染回归（F6/T-F）——_advisorBlocks 行为不变，与 subagent
  // 区块共用同一 per-kind 渲染走法但数据源独立。
  // buildConvLines imported statically at top
  const state = tuiState({
    _advisorBlocks: [
      { kind: "think", text: "reviewing the diff" },
      { kind: "text", text: "final verdict" },
    ],
  })
  const out = buildConvLines(state, 100)
  const joined = out.map((l) => l.text.replace(/\x1b\[[0-9;]*m/g, "")).join("\n")
  // 2026-08-30: advisor 流改为默认折叠框（防刷屏）——think 颜色与内容可见性在
  // 展开态验证（T-F 回归：kind 配色不变）；折叠态验证控制头存在。
  assert.ok(joined.includes("▶ [advisor · review]") && joined.includes("click to expand"), "advisor 折叠头可见")
  const expanded = buildConvLines(
    { ...state, expandedBlocks: new Set(["advisor-blocks"]) },
    100,
  )
  const exp = expanded.map((l) => l.text.replace(/\x1b\[[0-9;]*m/g, "")).join("\n")
  assert.ok(exp.includes("reviewing the diff"), "advisor think visible (expanded)")
  assert.ok(exp.includes("final verdict"), "advisor text visible (expanded)")
  const thinkLine = expanded.find((l) => l.text.includes("reviewing"))
  assert.equal(thinkLine?.color, C.reason, "advisor think 颜色不变（T-F 回归）")
})
