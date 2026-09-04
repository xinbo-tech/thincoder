/**
 * tui-render.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): tui.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { stringWidth, wrapText } from "../src/tui/render.mjs"
import { computeLayout } from "../src/tui/layout.mjs"
import { buildConvLines } from "../src/tui/render-conversation.mjs"
import { renderMarkdownInline, renderMarkdownHeading } from "../src/tui/markdown.mjs"
import { C } from "../src/tui/ansi.mjs"
import { renderRows, renderFrame, countConvLines, renderHeader, renderConversation, renderPermission, renderQueue, renderInputBox, renderStatus } from "../src/tui/render-frame.mjs"

const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "")
function pickerState(overrides = {}) {
  const items = Array.from({ length: 20 }, (_, i) => ({ type: "item", text: `item${i}` }))
  return {
    title: "Demo", entries: items,
    lines: items.map((it, _i) => ({ text: `   ${it.text}`, color: "" })),
    index: 0, scroll: 0, selectedLine: 0, filter: "", filteredItems: items,
    ...overrides,
  }
}

test("describeToolArgs: 单源参数摘要——主/子agent/advisor 工具行共用（ls 分支 2026-08-31 补）", async () => {
  const { describeToolArgs } = await import("../src/tui/tool-args.mjs")
  // read：带引号路径 + 可选限额（主 agent 块/子agent 块/advisor 进度行的统一形态）
  assert.equal(describeToolArgs("read", { path: "src/a.mjs" }), '"src/a.mjs"')
  assert.equal(describeToolArgs("read", { path: "src/a.mjs", offset: 10, limit: 5 }), '"src/a.mjs" · offset 10, limit 5')
  // grep/glob：pattern + path
  assert.equal(describeToolArgs("grep", { pattern: "foo", path: "src" }), '/foo/ in "src"')
  assert.equal(describeToolArgs("glob", { pattern: "*.mjs" }), "/*.mjs/")
  // ls（2026-08-31 补：advisor 工具集含 ls，此前掉进 compact JSON）
  assert.equal(describeToolArgs("ls", { path: "docs" }), "docs")
  assert.equal(describeToolArgs("ls", {}), ".")
  assert.equal(describeToolArgs("ls", { path: "docs", filter: "*.md" }), "docs  (filter: *.md)")
  // lsp：subcommand + uri
  assert.equal(describeToolArgs("lsp", { subcommand: "definition", uri: "src/a.mjs" }), "definition src/a.mjs")
  // bash：命令 + workdir
  assert.equal(describeToolArgs("bash", { command: "npm  test", workdir: "sub" }), "npm test  (in sub)")
  // memory（§6 单工具——action 路由摘要）
  assert.equal(describeToolArgs("memory", { action: "put", title: "部署约定" }), "部署约定")
  assert.equal(describeToolArgs("memory", { action: "search", query: "分号" }), "分号")
  assert.equal(describeToolArgs("memory", { action: "list", scope: "project", type: "rule" }), "scope project type rule")
  assert.equal(describeToolArgs("memory", { action: "delete", id: "personal:3", scope: "personal" }), "id personal:3 (personal)")
  assert.equal(describeToolArgs("memory", { action: "delete", scope: "team", type: "rule" }), "batch team type rule")
  assert.equal(describeToolArgs("memory", { action: "clear", scope: "personal" }), "clear personal")
  // 空 args：空串（调用方负责拼接，不产生尾随空格）
  assert.equal(describeToolArgs("read", {}), "")
  assert.equal(describeToolArgs("unknown_tool", { action: "x" }), '{"action":"x"}')
})




test("stringWidth: ascii / cjk / emoji", () => {
  assert.equal(stringWidth("hello"), 5)
  assert.equal(stringWidth("你好"), 4)
  assert.equal(stringWidth("a你b"), 4)
  assert.equal(stringWidth("🔧"), 2)
})



test("wrapText: 按宽度折行，保留空行", () => {
  assert.deepEqual(wrapText("abcdefgh", 3), ["abc", "def", "gh"])
  assert.deepEqual(wrapText("你好吗朋友", 4), ["你好", "吗朋", "友"])
  assert.deepEqual(wrapText("a\n\nb", 10), ["a", "", "b"])
})



test("stringWidth: ANSI escape sequences occupy zero display width", () => {
  assert.equal(stringWidth("\x1b[1mbold\x1b[22m"), 4, "bold markers invisible")
  assert.equal(stringWidth("\x1b[7mcode\x1b[27m"), 4, "reverse-video markers invisible")
  assert.equal(stringWidth("plain"), 5)
  assert.equal(stringWidth("\x1b[1m\x1b[36mcyan bold\x1b[22m\x1b[39m"), 9)
})



test("markdown tables with inline markers align end-to-end (buildConvLines row widths match formatTables)", async () => {
  const { stringWidth } = await import("../src/tui/render.mjs")
  const { buildConvLines } = await import("../src/tui/render-conversation.mjs")
  // Inline markers, headings, and combined heading+inline in table cells —
  // rendered BEFORE measuring: every rendered table row must end at the same
  // display width (the reported "table lines never align" bug).
  const table = "| 名称 | 说明 |\n|---|---|\n| `code` | **bold** 文本 |\n| ~~del~~ | plain |\n| ## **H** | `x` 尾 |"
  const state = {
    lines: [{ text: table, color: C.text }],
    streaming: "", reasoning: "", _advisorBlocks: [],
    foldEnabled: true, expandedBlocks: new Set(), scroll: 0, search: null,
  }
  const conv = buildConvLines(state, 80)
  const tableRows = conv.filter((l) => l.text.includes("│"))
  const widths = tableRows.map((l) => stringWidth(l.text))
  assert.equal(new Set(widths).size, 1, `all table rows end at the same width: ${widths.join(",")}`)
})



test("sanitizeDisplay: 控制字符不破坏终端网格（\\r 覆盖、\\t 超宽、ANSI/响铃冲屏）", async () => {
  const { sanitizeDisplay } = await import("../src/tui/render.mjs")

  assert.equal(sanitizeDisplay("1\tconst a = 1;\r"), "1    const a = 1;")
  assert.equal(sanitizeDisplay("abc\rdef"), "abc\ndef")
  assert.equal(sanitizeDisplay("a\r\nb"), "a\nb")
  assert.equal(sanitizeDisplay("12\tx"), "12    x")
  assert.equal(sanitizeDisplay("\x1b[31mred\x1b[0m"), "red")
  assert.equal(sanitizeDisplay("\x1b[2Aup"), "up")
  assert.equal(sanitizeDisplay("bell\x07end"), "bellend")
  assert.equal(sanitizeDisplay("a\x00\x08\x0b\x7fb"), "ab")
  assert.equal(sanitizeDisplay("正常文本 normal text"), "正常文本 normal text")
})



test("layoutInput: 折行与光标定位", async () => {
  const { layoutInput } = await import("../src/tui/render.mjs")
  // empty input still produces one line (has prompt "▸ ")
  const empty = layoutInput([], 0, 10)
  assert.equal(empty.lines.length, 1)
  assert.equal(empty.cursorCol, 2)
  const lay = layoutInput([..."hello"], 5, 10)
  assert.equal(lay.lines.length, 1)
  const lay2 = layoutInput([..."0123456789abcdef"], 16, 5)
  assert.ok(lay2.lines.length > 1, "long input wraps")
})



test("layoutInput: trailing \\n flushes the empty cursor line (box grows with Ctrl+J)", async () => {
  // BUG-6 regression: without this the multiline box never grew — the cursor's row
  // after a trailing newline was never materialized.
  const { layoutInput } = await import("../src/tui/render.mjs")
  const lay = layoutInput([..."ab\n"], 3, 40)
  assert.equal(lay.lines.length, 2, "trailing newline creates the empty second line")
  assert.equal(lay.cursorLine, 1, "cursor sits on the new line")
  assert.equal(lay.cursorCol, 2, "cursor column accounts for the 2-col prefix")
  const lay3 = layoutInput([..."ab\ncd\n"], 5, 40)
  assert.equal(lay3.lines.length, 3, "each \\n adds a row")
})



test("layoutInput: continuation lines left-align with the first line (2-col prefix)", async () => {
  // BUG-7 regression: wrapped/newline rows used to start 2 columns left of the first
  // line (first line has the "▸ " prompt, continuations had no prefix).
  const { layoutInput } = await import("../src/tui/render.mjs")
  const lay = layoutInput([..."ab\ncd"], 4, 40)
  assert.ok(lay.lines[0].startsWith("\u25b8 "), "first line carries the prompt")
  assert.ok(lay.lines[1].startsWith("  "), "continuation carries a 2-space prefix")
  assert.equal(lay.lines[1], "  cd")
  // Cursor between c and d on the continuation line: 2 prefix + 1 char
  assert.equal(lay.cursorLine, 1)
  assert.equal(lay.cursorCol, 3)
  // Cursor at the very end: 2 prefix + 2 chars
  const layEnd = layoutInput([..."ab\ncd"], 5, 40)
  assert.equal(layEnd.cursorCol, 4)
})



test("advisor blocks: interleaved think/tool/table renders in emission order (formatTables-array regression)", async () => {
  const { buildConvLines } = await import("../src/tui/render-conversation.mjs")
  const state = {
    lines: [],
    streaming: "",
    reasoning: "",
    _advisorBlocks: [
      { kind: "think", text: "先读文件" },
      { kind: "tool", text: "\n→ read src/x.mjs\n" },
      { kind: "think", text: "看到问题了" },
      { kind: "text", text: "\n| # | 问题 |\n| - | --- |\n| 1 | xxx |" },
    ],
    expandedBlocks: new Set(),
    foldEnabled: true,
  }
  const out = buildConvLines(state, 100)
  const joined = out.map((l) => l.text).join("\n")
  // Regression (874d853): non-think blocks went through formatTables whose
  // return value is an ARRAY — calling .split("\n") on it crashed the whole
  // render, so tool progress and the final review never displayed.
  // 2026-08-30: advisor stream renders as a COLLAPSIBLE box (default folded,
  // anti-flood) — content visibility moves to the EXPANDED state; folded view
  // shows the control line + tail 3 lines. Order/crash assertions run on the
  // expanded form.
  assert.ok(!out.some((l) => typeof l.text !== "string"), "all rendered lines are strings (no crash)")
  assert.ok(joined.includes("▶ [advisor · review]") && joined.includes("click to expand"), "默认折叠头（防刷屏）")
  const expanded = buildConvLines(
    { ...state, expandedBlocks: new Set(["advisor-blocks"]) },
    100,
  )
  const exp = expanded.map((l) => l.text).join("\n")
  assert.ok(exp.includes("→ read"), "tool progress line visible (expanded)")
  assert.ok(exp.includes("先读文件") && exp.includes("看到问题了"), "thinking visible (expanded)")
  assert.ok(exp.includes("xxx"), "review table visible (expanded)")
  assert.ok(
    exp.indexOf("先读文件") < exp.indexOf("→ read") && exp.indexOf("→ read") < exp.indexOf("看到问题了"),
    "emission order preserved (think → tool → think)",
  )
  // Per-kind colors: thinking in reasoning color, tool progress in tool color.
  // (Checked on the EXPANDED view — the folded view renders dim tails only.)
  const thinkLine = expanded.find((l) => l.text.includes("先读文件"))
  const toolLine = expanded.find((l) => l.text.includes("→ read"))
  const textLine = expanded.find((l) => l.text.includes("xxx"))
  assert.equal(thinkLine?.color, C.reason, "thinking rendered in reasoning color")
  assert.equal(toolLine?.color, C.tool, "tool progress rendered in tool color")
  assert.equal(textLine?.color, C.text, "final output rendered in text color")
})



test("formatTables: CJK 表格按显示宽度对齐", async () => {
  const { formatTables } = await import("../src/tui/render.mjs")
  const table = "| 名称 | 描述 |\n|---|---|\n| 你好 | hello |"
  const result = formatTables(table, 40)
  assert.ok(result.join("\n").includes("hello"), "table preserved")
})



test("formatTables: 超宽表格按列收缩到可用宽度", async () => {
  const { formatTables } = await import("../src/tui/render.mjs")
  const table = "| a | b | c | d | e | f | g | h | i | j |\n|---|---|---|---|---|---|---|---|---|---|\n| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |"
  const result = formatTables(table, 20)
  assert.ok(result.length > 0, "produces output even if narrow")
})



test("formatTables: 多列表格收缩到下限后仍超宽 → 行级截断，绝不超界（终端折行错位回归）", async () => {
  const { formatTables, stringWidth } = await import("../src/tui/render.mjs")
  // 8 列表格 @ width 40：8×3 + 25 borders = 49 > 40，收缩到 3 下限后仍超界
  const table = "| a | b | c | d | e | f | g | h |\n|---|---|---|---|---|---|---|---|\n| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |"
  const result = formatTables(table, 40)
  assert.ok(result.length > 0)
  for (const line of result) {
    assert.ok(stringWidth(line) <= 40, `行宽 ${stringWidth(line)} 不得超过 width 40: ${line}`)
  }
  assert.match(result[0], /…$/, "超宽行以省略号结尾")
  // 正常宽度下不受影响
  const wide = formatTables(table, 120)
  for (const line of wide) assert.ok(stringWidth(line) <= 120)
  assert.ok(!wide[0].endsWith("…"), "宽终端不截断")
})



test("formatTables: ANSI-rendered cells keep every row the same display width", async () => {
  const { formatTables, stringWidth } = await import("../src/tui/render.mjs")
  // Cells carry rendered markdown (ANSI — zero display width). The column math
  // must be based on the RENDERED text: raw `**bold**` measures 8 but displays
  // 4, which misaligned every row (the reported "table lines never align" bug).
  const table = [
    "| # | 问题 |",
    "| - | --- |",
    "| 1 | \x1b[1mbold\x1b[0m 内容 |",
    "| 2 | 普通文本 |",
  ].join("\n")
  const lines = formatTables(table, 60)
  const widths = lines.map((l) => stringWidth(l))
  assert.equal(new Set(widths).size, 1, `all rows the same width: ${widths.join(",")}`)
})



test("formatTables: markdown cells rendered BEFORE measuring stay aligned (render-before-measure regression)", async () => {
  const { stringWidth } = await import("../src/tui/render.mjs")
  // End-to-end through renderConversation (statically imported): a conversation
  // line carrying a **bold**-marked table must render with equal-width rows.
  const state = tuiState({
    lines: [{
      text: "| # | 问题 |\n| - | --- |\n| 1 | **bold** 内容 |\n| 2 | 普通文本 |",
      color: "#fff",
    }],
  })
  const frame = renderConversation(state, 80, 30, 0)
  const tableRows = frame.filter((l) => l.includes("│"))
  assert.ok(tableRows.length >= 3, "table rows rendered (header + data; separator is ├)")
  const widths = tableRows.map((l) => stringWidth(l))
  assert.equal(new Set(widths).size, 1, `table rows align end-to-end: ${widths.join(",")}`)
})



test("_renderMarkdownPreservingWidth: display width preserved after rendering (per-line contract)", async () => {
  const { stringWidth } = await import("../src/tui/render.mjs")
  const { _renderMarkdownPreservingWidth } = await import("../src/tui/render-conversation.mjs")
  const cases = [
    "**bold** text",
    "## 标题",
    "## **bold** 标题",
    "`code` 和 ~~strike~~ 混排",
    "普通文本",
    "",
  ]
  for (const input of cases) {
    const out = _renderMarkdownPreservingWidth(input)
    assert.equal(stringWidth(out), stringWidth(input), JSON.stringify(input))
  }
  // heading + inline bold: the inner markers must NOT re-open bold (which would
  // turn it OFF for the rest of the heading via \x1b[22m)
  const heading = _renderMarkdownPreservingWidth("## **bold** 标题")
  assert.ok(!heading.includes("\x1b[1m\x1b[1m"), "no nested bold-open sequences")
  assert.equal((heading.match(/\x1b\[1m/g) || []).length, 1, "single bold-open for the heading")
  assert.ok(!heading.includes("**"), "markers stripped")
})




// ====================================================================
// layout.mjs — computeLayout
// ====================================================================

/** Build a minimal state object for TUI tests. */
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

/** Minimal agent mock for renderFrame */
function tuiAgent(overrides = {}) {
  return {
    provider: { model: "deepseek-chat", apiKey: "sk-test", baseURL: "https://test" },
    cwd: "/home/test/project",
    autoApprove: false, planMode: false,
    config: { agent: { compactThreshold: 100_000 } },
    tasks: [],
    ...overrides,
  }
}


test("computeLayout: basic layout with all panels", () => {
  const state = tuiState()
  const layout = computeLayout(state, { cols: 80, rows: 24 })
  assert.ok(layout.panels.header, "header exists")
  assert.equal(layout.panels.header.h, 1)
  assert.ok(layout.panels.conversation, "conversation exists")
  assert.ok(layout.panels.conversation.h > 0, "conversation gets remaining space")
  assert.ok(layout.panels.inputBox, "input box exists")
  assert.ok(layout.panels.status, "status bar exists")
  assert.equal(layout.panels.status.h, 1)
  assert.equal(layout.panels.todo, null)
  assert.equal(layout.panels.subagent, null, "无运行中区块 → 面板不渲染（§7.2.1 F6）")
  assert.deepEqual(layout.subagentLines, [], "无运行中区块 → 无面板行")
  assert.equal(layout.panels.output, undefined, "output slot abolished (§7.2 D6)")
  assert.equal(layout.panels.permission, null)
  assert.equal(layout.panels.queue, null)
})



test("computeLayout: tasks panel visible with tasks", () => {
  const state = tuiState({
    tasks: [
      { title: "task A", status: "done" },
      { title: "task B", status: "in_progress" },
      { title: "task C", status: "pending" },
    ],
  })
  const layout = computeLayout(state, { cols: 80, rows: 24 })
  assert.ok(layout.panels.todo, "todo panel visible")
  assert.equal(layout.panels.todo.h, 4, "3 tasks + divider line (2026-08-30)")
  assert.equal(layout.visibleTasks.length, 3)
})



test("computeLayout: tasks truncated at 5, in_progress prioritized", () => {
  const state = tuiState({
    tasks: [
      { title: "task 1", status: "done" },
      { title: "task 2", status: "done" },
      { title: "task 3", status: "done" },
      { title: "task 4", status: "done" },
      { title: "task 5", status: "pending" },
      { title: "task 6", status: "in_progress" },
      { title: "task 7", status: "pending" },
    ],
  })
  const layout = computeLayout(state, { cols: 80, rows: 24 })
  assert.equal(layout.visibleTasks.length, 5, "capped at 5")
  assert.equal(layout.visibleTasks[0].title, "task 6")
  assert.equal(layout.visibleTasks[0].status, "in_progress")
})




test("computeLayout: 运行中子 agent → panels.subagent 位于 conversation 与 todo 之间（§7.2.1 T1）", () => {
  const state = tuiState({
    processing: true,
    subTasks: { "explore#1": { key: "explore#1", role: "explore", blocks: [{ kind: "text", text: "a" }], done: false, started: Date.now() } },
    tasks: [{ title: "task 1", status: "in_progress" }],
  })
  const layout = computeLayout(state, { cols: 80, rows: 24 })
  assert.ok(layout.panels.subagent, "有运行中区块 → 面板槽存在")
  assert.equal(layout.panels.subagent.y, layout.panels.conversation.y + layout.panels.conversation.h, "面板紧贴会话区之下")
  assert.ok(layout.panels.todo, "todo 面板存在")
  assert.equal(layout.panels.todo.y, layout.panels.subagent.y + layout.panels.subagent.h, "todo 位于面板之下")
  assert.equal(layout.subagentLines.length, layout.panels.subagent.h, "subagentH = 渲染行数（F2 完全自适应）")
})



test("computeLayout: subagent/task 并存 — subagent 面板 + todo 槽（§7.2.1 F1 布局顺序）", () => {
  const state = tuiState({
    processing: true,
    subTasks: { "coder#1": { key: "coder#1", role: "coder", blocks: [{ kind: "text", text: "a" }], done: false, started: Date.now() } },
    tasks: [{ title: "task 1", status: "in_progress" }],
  })
  const layout = computeLayout(state, { cols: 80, rows: 24 })
  assert.ok(layout.panels.subagent, "运行中区块 → 面板槽")
  assert.ok(layout.panels.todo, "todo 槽")
  assert.ok(layout.panels.subagent.y > layout.panels.conversation.y, "面板在会话区之下")
  assert.ok(layout.panels.todo.y > layout.panels.subagent.y, "todo 在面板之下")
})



test("computeLayout: done 区块不进面板（§7.2.1 F5）；output 槽仍废弃（§7.2 D6/T-H）", () => {
  const state = tuiState({
    processing: true,
    subTasks: { "explore#1": { key: "explore#1", role: "explore", blocks: [{ kind: "text", text: "a" }], done: true, doneAt: Date.now(), started: Date.now() - 5000 } },
    outputPanels: { bash: { text: "line1\nline2", done: false } },
  })
  const layout = computeLayout(state, { cols: 80, rows: 24 })
  assert.equal(layout.panels.subagent, null, "done 已冻结进流 → 面板不渲染（T8 冻结语义）")
  assert.equal(layout.panels.output, undefined, "no output panel slot (D6)")
  assert.ok(layout.panels.conversation, "conversation still holds everything")
})



test("computeLayout: 小终端压缩链 — subagent 面板最先让位至 0（§7.2.1 T3/NF1）", () => {
  const state = tuiState({
    processing: true,
    picker: pickerState(),
    tasks: [{ title: "t1", status: "in_progress" }, { title: "t2", status: "pending" }],
    subTasks: {
      "coder#1": { key: "coder#1", role: "coder", blocks: [{ kind: "text", text: "a" }], done: false, started: Date.now() },
      "explore#2": { key: "explore#2", role: "explore", blocks: [{ kind: "text", text: "b" }], done: false, started: Date.now() },
    },
  })
  const layout = computeLayout(state, { cols: 80, rows: 12 })
  assert.equal(layout.panels.subagent, null, "面板先让位至 0（隐藏，活动仍进缓冲区不丢）")
  assert.equal(layout.panels.conversation.h, 1, "会话区最小 1 行保留")
  assert.ok(layout.panels.inputBox, "输入框保留")
  assert.ok(layout.panels.status, "状态栏保留")
  assert.equal(layout.panels.inputBox.y + layout.panels.inputBox.h, layout.panels.status.y, "inputBox → status 顺序不变")
})



test("computeLayout: 面板部分压缩 → 保底截断（§7.2.1 评审 #4：分隔线 + 末尾区块行优先）", async () => {
  const { subagentVisibleLines, subagentLineIndex } = await import("../src/tui/layout.mjs")
  const lines = [0, 1, 2, 3, 4, 5].map((i) => ({ text: `line${i}` })) // [0] = 分隔线占位
  // h ≥ 全长 → 原样（无压缩）
  assert.equal(subagentVisibleLines(lines, 6), lines, "h ≥ 全长 → 原样")
  // 部分压缩 → 分隔线 + 末尾 (h-1) 行（最新启动区块优先；旧 slice(0,h) 保留
  // 顶部、裁掉最新活动的语义废弃）
  assert.deepEqual(subagentVisibleLines(lines, 3), [lines[0], lines[4], lines[5]], "保底：分隔线 + 末尾行")
  assert.deepEqual(subagentVisibleLines(lines, 1), [lines[0]], "h=1 极端：只留分隔线（面板边界语义）")
  assert.deepEqual(subagentVisibleLines(lines, 0), [], "h=0：空（layout 侧面板已隐藏）")
  // 索引映射与可见行集合一致（mouse 命中映射同一契约）
  for (const h of [3, 1, 6]) {
    const vis = subagentVisibleLines(lines, h)
    for (let local = 0; local < h; local++) {
      assert.equal(subagentLineIndex(lines, h, local), lines.indexOf(vis[local]), `h=${h} local=${local} 索引一致`)
    }
  }
  assert.equal(subagentLineIndex(lines, 3, 3), -1, "越界 → -1")
  assert.equal(subagentLineIndex(lines, 3, -1), -1, "负行 → -1")
})



test("renderRows: 面板部分压缩时保底截断——最新区块尾部行可见（§7.2.1 评审 #4）", () => {
  // 12 行小终端 + todo（3 任务）+ 运行中子 agent（头 + tail 3 = 5 行面板）：
  // fixedH=14 溢出 3 行 → subagentFinalH = 2（部分压缩），可见 = [分隔线, 末行]
  const state = tuiState({
    processing: true,
    tasks: [{ title: "t1", status: "in_progress" }, { title: "t2", status: "pending" }, { title: "t3", status: "pending" }],
    subTasks: { "coder#1": { key: "coder#1", role: "coder", model: "glm-5.3", started: Date.now(), done: false, blocks: [{ kind: "tool", text: "❯ bash — npm test\nrow1\nrow2\nrow3\n" }], currentTool: "bash", toolArgs: { command: "npm test" }, turn: 2, maxTurns: 100, approval: null, lastError: null } },
  })
  const { rows, layout } = renderRows(state, tuiAgent(), { cols: 80, rows: 12, slashCommands: [], platform: "linux" })
  assert.ok(layout.panels.subagent, "面板存在")
  assert.ok(layout.panels.subagent.h < layout.subagentLines.length, `部分压缩（h=${layout.panels.subagent.h} < ${layout.subagentLines.length}）`)
  const clean = rows.slice(layout.panels.subagent.y, layout.panels.subagent.y + layout.panels.subagent.h).map((l) => l.replace(/\x1b\[[0-9;]*m/g, "").replace(/\x1b\[K$/, ""))
  assert.ok(clean[0].startsWith("─"), "分隔线保留（面板边界语义，压缩时不移除）")
  const last = layout.subagentLines[layout.subagentLines.length - 1]
  assert.ok(clean[clean.length - 1].includes(last.text.trim()), `末尾区块行可见（最新活动优先，实际 ${JSON.stringify(clean[clean.length - 1])}）`)
  assert.ok(!clean.join("").includes("[▶"), "顶部（分隔线后首个区块头）在压缩时让位")
})



// ====================================================================
// render-frame.mjs — renderFrame
// ====================================================================


test("renderFrame: produces ANSI frame with header", () => {
  const state = tuiState()
  const agent = tuiAgent()
  const { frame } = renderFrame(state, agent, { cols: 80, rows: 24, slashCommands: [], platform: "linux" })
  assert.ok(frame.includes("ThinCoder"), "frame has ThinCoder header")
  assert.ok(frame.includes("deepseek-chat"), "frame has model name")
  assert.ok(frame.includes("project"), "frame has cwd basename")
})



test("renderFrame: cursor returns to input position in normal mode", () => {
  const state = tuiState({ input: [..."hello"] })
  const agent = tuiAgent()
  const { frame, cursorRow, cursorCol } = renderFrame(state, agent, { cols: 80, rows: 24, slashCommands: [], platform: "linux" })
  assert.ok(cursorRow > 0, "cursorRow > 0")
  assert.ok(cursorCol > 0, "cursorCol > 0")
  assert.ok(frame.length > 0)
})



test("renderFrame: cursor hidden in permission mode", () => {
  const state = tuiState({
    permission: { name: "write", resolve: () => {} },
    permissionPreview: ["/tmp/test.js (123 bytes)"],
  })
  const agent = tuiAgent()
  const { frame, cursorRow } = renderFrame(state, agent, { cols: 80, rows: 24, slashCommands: [], platform: "linux" })
  assert.ok(frame.includes("Permission Request"), "frame shows permission header")
  assert.equal(cursorRow, 0, "cursorRow 0 in permission mode (hidden)")
})



test("renderFrame: todo marks show correct status icons", () => {
  const state = tuiState({
    tasks: [
      { title: "done task", status: "done" },
      { title: "in-progress task", status: "in_progress" },
      { title: "pending task", status: "pending" },
    ],
  })
  const agent = tuiAgent()
  const { frame } = renderFrame(state, agent, { cols: 80, rows: 24, slashCommands: [], platform: "linux" })
  assert.ok(frame.includes("✓ done task"), "done task has checkmark")
  assert.ok(frame.includes("▶ in-progress task"), "in_progress has triangle")
  assert.ok(frame.includes("○ pending task"), "pending has circle")
})



test("renderRows: 运行中子 agent 区块渲染于固定底部面板（§7.2.1 T4 渲染目标审计）", () => {
  const state = tuiState({
    processing: true,
    subTasks: {
      "coder#1": { key: "coder#1", role: "coder", model: "glm-5.3", blocks: [], currentTool: "write", toolArgs: { path: "file.mjs" }, done: false, started: Date.now(), turn: 2, maxTurns: 100, approval: null, lastError: null },
    },
  })
  const agent = tuiAgent()
  const { rows, layout } = renderRows(state, agent, { cols: 80, rows: 24, slashCommands: [], platform: "linux" })
  assert.ok(layout.panels.subagent, "面板槽存在")
  // 区块头渲染于面板（conversation 与 todo 之间）；会话区不含运行区块
  // （T-A/T-C/T-D 渲染目标审计：折叠头现渲染于面板而非会话流）
  const panelText = rows.slice(layout.panels.subagent.y, layout.panels.subagent.y + layout.panels.subagent.h).join("\n")
  const convText = rows.slice(layout.panels.conversation.y, layout.panels.conversation.y + layout.panels.conversation.h).join("\n")
  const cleanPanel = panelText.replace(/\x1b\[[0-9;]*m/g, "")
  assert.ok(cleanPanel.includes("[▶ coder#1 · sync · glm-5.3"), "block header in the panel（sync 显式头标——D-M7b B 形态）")
  assert.ok(cleanPanel.includes("turn 2/100"), "header shows turn n/max")
  assert.ok(cleanPanel.includes("write"), "shows current tool")
  assert.ok(!convText.includes("[▶ coder#1"), "会话区不含运行区块")
})



test("renderFrame: status bar shows task progress", () => {
  const state = tuiState({
    tasks: [
      { title: "task 1", status: "done" },
      { title: "task 2", status: "in_progress" },
      { title: "task 3", status: "pending" },
    ],
  })
  const agent = tuiAgent()
  const { frame } = renderFrame(state, agent, { cols: 80, rows: 24, slashCommands: [], platform: "linux" })
  assert.ok(frame.includes("✓1/3"), "status bar shows 1/3 done")
})



test("renderFrame: AUTO and PLAN banners visible", () => {
  const state = tuiState()
  const agent = tuiAgent({ autoApprove: true, planMode: true })
  const { frame } = renderFrame(state, agent, { cols: 80, rows: 24, slashCommands: [], platform: "linux" })
  assert.ok(frame.includes("AUTO"), "auto banner visible")
  assert.ok(frame.includes("PLAN"), "plan banner visible")
})



test("renderFrame: multimodal hint on supported model with image paste shortcut", () => {
  const state = tuiState()
  const agent = tuiAgent()
  agent.provider.model = "kimi-k3"
  const { frame } = renderFrame(state, agent, { cols: 80, rows: 24, slashCommands: [], platform: "linux" })
  assert.ok(frame.includes("paste"), "paste shortcut shown")
})



test("panel functions: renderFrame (legacy) produces valid ANSI", () => {
  const state = tuiState({ lines: [{ text: "hello", color: "" }] })
  const agent = { provider: { model: "test-model" }, cwd: "/test", planMode: false, autoApprove: false, config: {} }
  const result = renderFrame(state, agent, { cols: 80, rows: 24, slashCommands: [] })
  // Frame must start directly with the header row — a leading home/newline here
  // used to shift the whole frame one row down and scroll the terminal.
  assert.ok(!result.frame.startsWith("\x1b[H"))
  assert.ok(result.frame.startsWith("\x1b[")) // header color codes
  assert.ok(result.frame.includes("hello"))
  assert.ok(result.frame.includes("ThinCoder"))
})



test("panel functions: renderFrame returns cursor position in normal mode", () => {
  const state = tuiState({})
  const agent = { provider: { model: "test" }, cwd: "/test", planMode: false, autoApprove: false, config: {} }
  const result = renderFrame(state, agent, { cols: 80, rows: 24, slashCommands: [] })
  assert.ok(result.cursorRow > 0)
  assert.ok(result.cursorCol > 0)
})



test("panel functions: renderFrame hides cursor in permission mode", () => {
  const state = tuiState({ permission: { name: "test", args: {} } })
  const agent = { provider: { model: "test" }, cwd: "/test", planMode: false, autoApprove: false, config: {} }
  const result = renderFrame(state, agent, { cols: 80, rows: 24, slashCommands: [] })
  assert.equal(result.cursorRow, 0)
  assert.equal(result.cursorCol, 0)
})



test("panel functions: renderInputBox shows Processing title when processing", () => {
  const state = tuiState({ processing: true })
  const lines = renderInputBox(state, 80, ["▸ Hello"], 80)
  assert.ok(lines[0].includes("Processing..."))
})



test("panel functions: renderStatus includes elapsed time during processing", () => {
  const state = tuiState({ processing: true, processingStarted: Date.now() })
  const agent = { provider: { model: "test" }, cwd: "/test", planMode: false, autoApprove: false, config: {} }
  const line = renderStatus(state, agent, 120, [])
  assert.ok(line.includes("0s")) // just started
})



test("renderStatus: engineering mode shows ENG banner", () => {
  const state = tuiState({ processing: false })
  const on = renderStatus(state, { provider: { model: "test" }, cwd: "/test", planMode: false, autoApprove: false, config: { agent: { engineering: true } } }, 120, [])
  assert.ok(on.includes("ENG"), "ENG banner shown when engineering mode is on")
  const off = renderStatus(state, { provider: { model: "test" }, cwd: "/test", planMode: false, autoApprove: false, config: { agent: { engineering: false } } }, 120, [])
  assert.ok(!off.includes("ENG"), "no ENG banner when engineering mode is off")
})



test("renderStatus: advisor guard shows ADVISOR banner; enabled is deprecated (2026-08-21)", () => {
  const state = tuiState({ processing: false })
  const base = { provider: { model: "test" }, cwd: "/test", planMode: false, autoApprove: false }
  const on = renderStatus(state, { ...base, config: { advisor: { guard: true } } }, 120, [])
  assert.ok(on.includes("ADVISOR"), "ADVISOR banner shown when advisor.guard === true")
  assert.ok(!on.includes("GUARD"), "no GUARD label (ADVISOR restored)")
  const offDefault = renderStatus(state, { ...base, config: { advisor: {} } }, 120, [])
  assert.ok(!offDefault.includes("ADVISOR"), "no banner when guard is absent (default OFF)")
  const offFalse = renderStatus(state, { ...base, config: { advisor: { guard: false } } }, 120, [])
  assert.ok(!offFalse.includes("ADVISOR"), "no banner when guard: false")
  const legacyEnabled = renderStatus(state, { ...base, config: { advisor: { enabled: true } } }, 120, [])
  assert.ok(!legacyEnabled.includes("ADVISOR"), "legacy enabled: true no longer drives a banner")
})



test("panel functions: renderPermission formats permission request", () => {
  const lines = renderPermission(["  Allow bash: rm -rf /", "  This is dangerous"])
  assert.equal(lines.length, 3)
  assert.ok(lines[0].includes("Permission Request"))
})



test("panel functions: renderQueue shows queue preview", () => {
  const state = tuiState({ queue: [{ text: "next task here" }], processing: true })
  const line = renderQueue(state, 80)
  assert.ok(line.includes("Queue:"))
  assert.ok(line.includes("next task here"))
})



test("panel functions: renderQueue empty when not processing", () => {
  const state = tuiState({ queue: [{ text: "waiting" }], processing: false })
  const line = renderQueue(state, 80)
  assert.equal(line, "")
})



test("panel functions: countConvLines counts wrapped lines", () => {
  const state = tuiState({
    lines: [
      { text: "short", color: "" },
      { text: "a".repeat(200), color: "" }, // will wrap
    ],
  })
  // "a" repeated 200 times at width 80 → ceil(200/80) = 3 lines
  const count = countConvLines(state, 80)
  assert.equal(count, 4) // 1 (short) + 3 (wrapped)
})

test("markdown: 行内标记渲染为 ANSI（** 粗体 / ` 反色 / ~~ 删除线 / 标题去 #）", () => {
  // **bold** → 粗体，剥离 ANSI 后只剩文字
  const bold = renderMarkdownInline("这是 **重点** 内容")
  assert.ok(bold.includes("\x1b[1m"), "粗体开启序列")
  assert.ok(bold.includes("\x1b[22m"), "粗体关闭序列（不清颜色）")
  assert.equal(stripAnsi(bold), "这是 重点 内容", "标记符号消失")
  // `code` → 下划线（反白太扎眼，用户改订）
  const code = renderMarkdownInline("运行 `npm test` 即可")
  assert.ok(code.includes("\x1b[4m"), "下划线开启")
  assert.equal(stripAnsi(code), "运行 npm test 即可")
  // ~~删除线~~
  const strike = renderMarkdownInline("~~废弃~~的方案")
  assert.ok(strike.includes("\x1b[9m"), "删除线开启")
  assert.equal(stripAnsi(strike), "废弃的方案")
  // 反引号内的 ** 不解释（markdown 语义）
  const nested = renderMarkdownInline("示例 `a**b` 保持原样")
  assert.equal(stripAnsi(nested), "示例 a**b 保持原样", "code span 内的标记不处理")
  // 标题行：去 # 前缀 + 整行粗体
  const heading = renderMarkdownHeading("## 设计决策")
  assert.equal(stripAnsi(heading), "设计决策")
  assert.ok(heading.includes("\x1b[1m"))
  // 未闭合标记（流式半截）保持原样，不吞字
  assert.equal(stripAnsi(renderMarkdownInline("正在生成 **bo")), "正在生成 **bo")
  // 普通文本不受影响
  assert.equal(renderMarkdownInline("hello world"), "hello world")
})



test("markdown: renderConversation 输出无裸标记符号", () => {
  const cols = 80, visibleH = 20
  const out = renderConversation(tuiState({
    lines: [{ text: "## 结论\n这是 **加粗** 和 `代码` 混排", color: C.text }],
  }), cols, visibleH, 0)
  const joined = out.join("\n")
  const clean = stripAnsi(joined)
  assert.ok(!clean.includes("**"), "粗体标记不再裸显")
  assert.ok(!clean.includes("##"), "标题标记不再裸显")
  assert.ok(clean.includes("结论"), "标题文字保留")
  assert.ok(clean.includes("加粗"), "粗体内文保留")
  assert.ok(clean.includes("代码"), "代码内文保留")
})



test("layout: 极端小终端（rows=9 + picker + tasks + permission）按序压缩，permission 被压缩", () => {
  const state = tuiState({
    picker: pickerState(),
    tasks: [{ title: "t1", status: "in_progress" }, { title: "t2", status: "pending" }],
    permission: { name: "write", args: {} },
    permissionPreview: ["preview line 1", "preview line 2"],
  })
  const layout = computeLayout(state, { cols: 80, rows: 9 })
  assert.equal(layout.panels.conversation.h, 1, "conversation 先压到最小 1 行")
  assert.equal(layout.panels.picker.h, 3, "picker 再压到最小 3 行")
  // permission 被压到 1 行（仅标题），输入框 y 相比修复前上移（之前 permission 不压缩导致输入框完全溢出）
  assert.equal(layout.panels.permission.h, 1, "permission preview 被压缩到 1 行")
  assert.ok(layout.panels.inputBox.y < 9,
    `输入框起始行在屏幕内（y=${layout.panels.inputBox.y} < 9）`)
})



test("upgradeFailureText: 失败提示附 npm 输出尾部（最多 3 行）", async () => {
  const { upgradeFailureText } = await import("../src/tui/index.mjs")
  const text = upgradeFailureText(1, "line1\nline2\nline3\nnpm ERR! code EACCES\n")
  assert.ok(text.includes("exit 1"))
  assert.ok(text.includes("npm ERR! code EACCES"), "含输出尾部，方便定位失败原因")
  assert.ok(!text.includes("line1"), "只保留最后 3 行")
  assert.ok(!upgradeFailureText(1, "").includes("\n"), "无输出时不加尾巴")
})



test("layout: 小终端全局约束 — 总行数 ≤ rows，conversation ≥ 1，picker ≥ 3", () => {
  for (const rows of [9, 10, 14]) {
    const state = tuiState({ picker: pickerState() })
    const layout = computeLayout(state, { cols: 80, rows })
    const total = Object.values(layout.panels).reduce((s, p) => s + (p ? p.h : 0), 0)
    assert.ok(total <= rows, `rows=${rows}: 总高 ${total} 不应超过 ${rows}`)
    assert.ok(layout.panels.conversation.h >= 1, `rows=${rows}: conversation 最小 1 行`)
    if (layout.panels.picker) assert.ok(layout.panels.picker.h >= 3 || layout.panels.picker.h >= state.picker.lines.length + 1, `rows=${rows}: picker 最小 3 行`)
  }
})



test("T7 渲染守卫：renderHeader/renderStatus 在 provider 为 null 时不抛错（Esc 后仍进 TUI）", () => {
  const line = renderHeader({ provider: null, cwd: "C:\\x" }, 80)
  assert.ok(line.includes("no provider"), "头部显示占位")
  const state = {
    input: [], cursor: 0, scroll: 0, tasks: [], queue: [], processing: false, status: "Ready",
    currentTool: null, picker: null, permission: null, question: null, wizard: null,
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
    ctxCache: { len: -1, tokens: 0 },
  }
  const statusLine = renderStatus(state, { provider: null, _currentTurn: 0, _maxTurns: 0 }, 80, [])
  assert.ok(statusLine.includes("Enter: send"), "状态栏正常渲染")
})


