/**
 * TUI pure function tests — rendering, layout, keyboard handling.
 * No terminal needed — all functions are pure.
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { stringWidth, wrapText } from "../src/tui/render.mjs"
import { computeLayout } from "../src/tui/layout.mjs"
import {
  renderFrame, countConvLines, convCacheKey,
  renderHeader, renderConversation, renderTodo, renderSubagent,
  renderOutput, renderPermission, renderQueue, renderPicker,
  renderInputBox, renderStatus,
} from "../src/tui/render-frame.mjs"
import { createKeyHandler } from "../src/tui/key-handler.mjs"
import { renderMarkdownInline, renderMarkdownHeading } from "../src/tui/markdown.mjs"
import { C } from "../src/tui/ansi.mjs"

// ====================================================================
// render.mjs — stringWidth, wrapText, sanitizeDisplay, formatTables
// ====================================================================

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
  assert.ok(!out.some((l) => typeof l.text !== "string"), "all rendered lines are strings (no crash)")
  assert.ok(joined.includes("→ read"), "tool progress line visible")
  assert.ok(joined.includes("先读文件") && joined.includes("看到问题了"), "thinking visible")
  assert.ok(joined.includes("xxx"), "review table visible")
  assert.ok(
    joined.indexOf("先读文件") < joined.indexOf("→ read") && joined.indexOf("→ read") < joined.indexOf("看到问题了"),
    "emission order preserved (think → tool → think)",
  )
  // Per-kind colors: thinking in reasoning color, tool progress in tool color.
  const thinkLine = out.find((l) => l.text.includes("先读文件"))
  const toolLine = out.find((l) => l.text.includes("→ read"))
  const textLine = out.find((l) => l.text.includes("xxx"))
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
  assert.equal(layout.panels.subagent, null)
  assert.equal(layout.panels.output, null)
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
  assert.equal(layout.panels.todo.h, 3)
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

test("computeLayout: subagent panel visible when processing", () => {
  const state = tuiState({
    processing: true,
    subTasks: { "explore#1": { key: "explore#1", role: "explore", text: "searching...", done: false } },
  })
  const layout = computeLayout(state, { cols: 80, rows: 24 })
  assert.ok(layout.panels.subagent, "subagent panel visible")
  assert.equal(layout.allSubs.length, 1)
})

test("computeLayout: panel ordering — subagent before todo", () => {
  const state = tuiState({
    processing: true,
    subTasks: { "coder#1": { key: "coder#1", role: "coder", text: "editing...", done: false } },
    tasks: [{ title: "task 1", status: "in_progress" }],
  })
  const layout = computeLayout(state, { cols: 80, rows: 24 })
  assert.ok(layout.panels.subagent, "subagent exists")
  assert.ok(layout.panels.todo, "todo exists")
  assert.ok(layout.panels.subagent.y < layout.panels.todo.y, `subagent.y=${layout.panels.subagent.y} should be < todo.y=${layout.panels.todo.y}`)
})

test("computeLayout: output panels visible", () => {
  const state = tuiState({ outputPanels: { bash: { text: "line1\nline2", done: false } } })
  const layout = computeLayout(state, { cols: 80, rows: 24 })
  assert.ok(layout.panels.output, "output panel visible")
  assert.ok(layout.panels.output.h > 0)
})

test("computeLayout: done output panels excluded", () => {
  const state = tuiState({ outputPanels: { bash: { text: "done", done: true } } })
  const layout = computeLayout(state, { cols: 80, rows: 24 })
  assert.equal(layout.panels.output, null, "done panels excluded")
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

test("renderFrame: subagent panel shows role and status", () => {
  const state = tuiState({
    processing: true,
    subTasks: {
      "coder#1": { key: "coder#1", role: "coder", text: "", tool: "write", toolArgs: { path: "file.mjs" }, done: false, started: Date.now() },
    },
  })
  const agent = tuiAgent()
  const { frame } = renderFrame(state, agent, { cols: 80, rows: 24, slashCommands: [], platform: "linux" })
  assert.ok(frame.includes("[coder]"), "subagent panel shows role")
  assert.ok(frame.includes("write"), "shows current tool")
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

// ====================================================================
// clipboard.mjs — insertPastedText routing
// ====================================================================

test("insertPastedText: free-text question active → appends to answer, strips newlines, input untouched", async () => {
  const { insertPastedText } = await import("../src/tui/clipboard.mjs")
  const state = tuiState()
  state.question = { text: "Enter API key:", options: [], answer: "sk-", resolve: noop }
  insertPastedText(state, "abc123\r\n")
  assert.equal(state.question.answer, "sk-abc123")
  assert.equal(state.input.length, 0, "pasted text must not leak into main input box")
})

test("insertPastedText: options question active → ignored (no text field)", async () => {
  const { insertPastedText } = await import("../src/tui/clipboard.mjs")
  const state = tuiState()
  state.question = { text: "pick", options: ["a", "b"], selected: 0, resolve: noop }
  insertPastedText(state, "hello")
  assert.equal(state.input.length, 0, "pasted text discarded, not orphaned in input box")
})

test("insertPastedText: no question → inserts into main input at cursor, keeps newlines, tabs → 2 spaces", async () => {
  const { insertPastedText } = await import("../src/tui/clipboard.mjs")
  const state = tuiState()
  state.input = [..."ab"]
  state.cursor = 1
  insertPastedText(state, "X\r\nY\tZ")
  assert.equal(state.input.join(""), "aX\nY  Zb")
  assert.equal(state.cursor, 7)
})

test("translateShiftEnter: CSI-u and modifyOtherKeys Shift+Enter map to \\x1b\\r (meta+return path)", async () => {
  const { translateShiftEnter } = await import("../src/tui/clipboard.mjs")
  assert.equal(translateShiftEnter("\x1b[13;2u"), "\x1b\r")
  assert.equal(translateShiftEnter("\x1b[27;2;13~"), "\x1b\r")
  assert.equal(translateShiftEnter("abc"), "abc", "plain text untouched")
  assert.equal(translateShiftEnter("\r"), "\r", "bare CR untouched (no-enhancement terminals)")
  assert.equal(translateShiftEnter("\x1b[13;3u"), "\x1b[13;3u", "Alt+Enter CSI-u untouched (modifier 3 ≠ shift)")
})

test("stripKeyboardProtocol: CSI u and modifyOtherKeys sequences stripped", async () => {
  const { stripKeyboardProtocol } = await import("../src/tui/clipboard.mjs")
  // kitty CSI u — Ctrl+C (\x1b[99;5u) stripped
  assert.equal(stripKeyboardProtocol("\x1b[99;5u"), "")
  // kitty CSI u — Ctrl+A (\x1b[97;5u) stripped
  assert.equal(stripKeyboardProtocol("\x1b[97;5u"), "")
  // modifyOtherKeys function key — Ctrl+F1 (\x1b[27;5;11~) stripped
  assert.equal(stripKeyboardProtocol("\x1b[27;5;11~"), "")
  // plain text untouched
  assert.equal(stripKeyboardProtocol("hello"), "hello", "plain text untouched")
  // in sequence with other text
  assert.equal(stripKeyboardProtocol("ab\x1b[99;5ucd"), "abcd")
  // Shift+Enter already handled by translateShiftEnter before this runs — still stripped if missed
  assert.equal(stripKeyboardProtocol("\x1b[13;2u"), "")
})


test("keyHandler: shift+enter via translated CSI-u inserts newline", () => {
  // End-to-end shape: stdin layer turns \x1b[13;2u into \x1b\r, readline yields meta+return
  const state = tuiState({ input: [..."ab"], cursor: 2 })
  const handler = createKeyHandler(keyCtx(state))
  handler("\x1b\r", { name: "return", meta: true })
  assert.equal(state.input.join(""), "ab\n")
  assert.equal(state.cursor, 3)
})

// ====================================================================
// key-handler.mjs — createKeyHandler
// ====================================================================

function noop() {}
function keyCtx(state, agent = null) {
  return {
    agent: agent || tuiAgent(), state,
    render: noop, popPicker: () => false, renderPickerLines: noop,
    handleSlash: noop, handleTab: noop,
    submit: async () => {}, pasteClipboardImage: async () => {},
    wizardChooseProvider: noop, wizardSubmitText: noop, cancelWizard: noop,
    wizardProviderItems: () => [], renderWizard: noop,
    pushLine: noop, cleanup: noop,
  }
}

test("keyHandler: input characters build up input buffer", () => {
  const state = tuiState()
  const handler = createKeyHandler(keyCtx(state))
  handler("h", { name: "h" })
  handler("e", { name: "e" })
  handler("l", { name: "l" })
  handler("l", { name: "l" })
  handler("o", { name: "o" })
  assert.equal(state.input.join(""), "hello")
})

test("keyHandler: backspace deletes character before cursor", () => {
  const state = tuiState({ input: [..."abc"], cursor: 3 })
  const handler = createKeyHandler(keyCtx(state))
  handler("", { name: "backspace" })
  assert.equal(state.input.join(""), "ab")
  assert.equal(state.cursor, 2)
})

test("keyHandler: cursor movement left/right", () => {
  const state = tuiState({ input: [..."abc"], cursor: 3 })
  const handler = createKeyHandler(keyCtx(state))
  handler("", { name: "left" })
  assert.equal(state.cursor, 2)
  handler("", { name: "left" })
  assert.equal(state.cursor, 1)
  handler("", { name: "right" })
  assert.equal(state.cursor, 2)
})

test("keyHandler: up/down cycle through input history (down past end restores the stashed draft)", () => {
  const state = tuiState({ history: [[..."first"], [..."second"]], historyIndex: -1, input: [..."current"] })
  const handler = createKeyHandler(keyCtx(state))
  handler("", { name: "up" })
  assert.equal(state.input.join(""), "second", "first up loads last history entry")
  assert.deepEqual(state._draft, [..."current"], "unsent input stashed as draft")
  handler("", { name: "up" })
  assert.equal(state.input.join(""), "first", "second up loads earlier entry")
  handler("", { name: "down" })
  assert.equal(state.input.join(""), "second", "first down goes forward in history")
  handler("", { name: "down" })
  assert.equal(state.input.join(""), "current", "down past newest restores the draft (not blank)")
  assert.equal(state.historyIndex, -1)
  assert.equal(state._draft, null, "draft cleared after restore")
})

test("keyHandler: up with empty input stashes empty draft; down past end restores blank", () => {
  const state = tuiState({ history: [[..."only"]], historyIndex: -1, input: [] })
  const handler = createKeyHandler(keyCtx(state))
  handler("", { name: "up" })
  assert.deepEqual(state._draft, [], "empty draft stashed when input was empty")
  handler("", { name: "down" })
  assert.equal(state.input.join(""), "")
  assert.equal(state.historyIndex, -1)
})

test("keyHandler: history draft survives typing then re-navigating (scenario regression)", () => {
  // Scenario: empty input → ↑ (history) → clear → type "abc" → ↑ → ↓ past newest → restores "abc"
  const state = tuiState({ history: [[..."prev"]], historyIndex: -1, input: [] })
  const handler = createKeyHandler(keyCtx(state))
  handler("", { name: "up" })
  // clear the history entry, then type "abc"
  handler("", { name: "u", ctrl: true })
  const chars = [..."abc"]
  for (const ch of chars) handler(ch, {})
  assert.equal(state.input.join(""), "abc")
  // press ↑ — should save "abc" as draft before navigating
  handler("", { name: "up" })
  assert.deepEqual(state._draft, [..."abc"], "typed text saved as draft on re-navigate")
  // press ↓ past newest → restores "abc"
  handler("", { name: "down" })
  handler("", { name: "down" })
  assert.equal(state.input.join(""), "abc", "typed text restored from draft after navigating back")
})


test("keyHandler: Alt+V (meta+v) triggers image paste — key.alt alone is dead (readline sets meta)", () => {
  // BUG-8 regression: the old branch checked key.alt, but readline parses ESC-prefixed
  // combos as meta:true alt:false — image paste never fired.
  const state = tuiState()
  let called = false
  const ctx = { ...keyCtx(state), pasteClipboardImage: async () => { called = true } }
  const handler = createKeyHandler(ctx)
  handler("", { name: "v", meta: true })
  assert.equal(called, true, "meta+v fires image paste")
})

test("keyHandler: Ctrl+Alt+V (ctrl+meta) also fires image paste, not text paste", () => {
  // readline reports Ctrl+Alt+V as ctrl:true meta:true — the text-paste branch must
  // exclude meta or it would eat the key before the image branch sees it.
  const state = tuiState()
  let imageCalled = false
  const ctx = { ...keyCtx(state), pasteClipboardImage: async () => { imageCalled = true } }
  const handler = createKeyHandler(ctx)
  handler("", { name: "v", ctrl: true, meta: true })
  assert.equal(imageCalled, true, "ctrl+meta+v fires image paste")
})

// ====================================================================
// search mode regressions (79fc3df audit, docs/design/TUI-INPUT-BOX.md)
// ====================================================================

test("keyHandler: search mode — bare n/p type into the query (regression: they hijacked navigation)", () => {
  const state = tuiState({ search: { query: "", matches: [], index: 0 } })
  const handler = createKeyHandler(keyCtx(state))
  handler("n", { name: "n" })
  handler("p", { name: "p" })
  assert.equal(state.search.query, "np", "n and p land in the query, not navigation")
  assert.equal(state.search.index, 0)
})

test("keyHandler: search mode — Ctrl+N/Ctrl+P navigate matches", () => {
  const state = tuiState({ search: { query: "x", matches: [{ lineIndex: 0, charIndex: 0 }, { lineIndex: 2, charIndex: 0 }], index: 0 } })
  const handler = createKeyHandler(keyCtx(state))
  handler(null, { name: "n", ctrl: true })
  assert.equal(state.search.index, 1)
  handler(null, { name: "p", ctrl: true })
  assert.equal(state.search.index, 0)
})

test("keyHandler: search mode — unhandled keys do NOT fall through to hidden input", () => {
  const state = tuiState({ search: { query: "abc", matches: [], index: 0 }, input: [..."protected"], cursor: 3 })
  const handler = createKeyHandler(keyCtx(state))
  handler("", { name: "left" })
  handler("", { name: "tab" })
  handler("", { name: "home" })
  handler(null, { name: "delete" })
  assert.equal(state.input.join(""), "protected", "hidden input untouched in search mode")
  assert.equal(state.cursor, 3)
})

test("keyHandler: search mode — Esc exits search", () => {
  const state = tuiState({ search: { query: "q", matches: [], index: 0 } })
  const handler = createKeyHandler(keyCtx(state))
  handler("", { name: "escape" })
  assert.equal(state.search, null)
})

// ====================================================================
// multiline input key (Shift+Enter removed, Alt+Enter added)
// ====================================================================

test("keyHandler: Alt+Enter (meta+return) inserts newline for multiline input", () => {
  const state = tuiState({ input: [..."ab"], cursor: 2 })
  const handler = createKeyHandler(keyCtx(state))
  handler("", { name: "return", meta: true })
  assert.equal(state.input.join(""), "ab\n")
  assert.equal(state.cursor, 3)
})

test("keyHandler: Ctrl+J (\\n → name:'enter') inserts newline — universal fallback for legacy terminals", () => {
  const state = tuiState({ input: [..."ab"], cursor: 2 })
  const handler = createKeyHandler(keyCtx(state))
  handler("\n", { name: "enter" })
  assert.equal(state.input.join(""), "ab\n")
  assert.equal(state.cursor, 3)
})

test("keyHandler: bare Enter submits (does not insert newline)", () => {
  const state = tuiState({ input: [..."ab"], cursor: 2 })
  let submitted = false
  const handler = createKeyHandler({ ...keyCtx(state), submit: async () => { submitted = true } })
  handler("", { name: "return" })
  assert.equal(submitted, true)
  assert.equal(state.input.join(""), "ab", "input untouched until submit clears it")
})

test("keyHandler: permission y/n/a resolution", () => {
  const state = tuiState({
    permission: { name: "write", resolve: () => {} },
    permissionPreview: ["content preview"],
  })
  let approved = null
  state.permission.resolve = (v) => { approved = v }
  const handler = createKeyHandler(keyCtx(state))
  handler("y", { name: "y" })
  assert.equal(approved, true)
  assert.equal(state.permission, null)
})

test("keyHandler: permission 'a' sets AUTO and approves", () => {
  const agent = tuiAgent()
  const state = tuiState({
    permission: { name: "write", resolve: () => {} },
    permissionPreview: ["content preview"],
  })
  let approved = null
  state.permission.resolve = (v) => { approved = v }
  const handler = createKeyHandler(keyCtx(state, agent))
  handler("a", { name: "a" })
  assert.equal(approved, true)
  assert.equal(agent.autoApprove, true)
  assert.equal(state.permission, null)
  // Regression guard (b0bcab4 removed this): the model must be told AUTO is on
  assert.ok(agent._pendingReminders?.some((r) => r.includes("AUTO mode is now ON")),
    "AUTO reminder injected for the model")
})

test("keyHandler: question free-text submit resolves answer", () => {
  const state = tuiState({ question: { text: "What?", options: [], answer: "my answer", resolve: () => {} } })
  let resolved = null
  state.question.resolve = (v) => { resolved = v }
  const handler = createKeyHandler(keyCtx(state))
  handler("", { name: "return" })
  assert.equal(resolved, "my answer")
  assert.equal(state.question, null)
})

test("keyHandler: question option selection via up/down/enter", () => {
  const state = tuiState({
    question: { text: "Pick", options: ["A", "B", "C"], selected: 0, resolve: () => {} },
  })
  let resolved = null
  state.question.resolve = (v) => { resolved = v }
  const handler = createKeyHandler(keyCtx(state))
  handler("", { name: "down" })
  assert.equal(state.question.selected, 1)
  handler("", { name: "down" })
  assert.equal(state.question.selected, 2)
  handler("", { name: "return" })
  assert.equal(resolved, "C")
  assert.equal(state.question, null)
})

test("keyHandler: ctrl+c during processing aborts controller", () => {
  let aborted = false
  const controller = { abort: () => { aborted = true } }
  const state = tuiState({ processing: true, controller })
  const handler = createKeyHandler(keyCtx(state))
  handler("", { name: "c", ctrl: true })
  assert.ok(aborted)
})

test("keyHandler: tab during processing is blocked", () => {
  let tabCalled = false
  const state = tuiState({ processing: true, input: [..."/hel"] })
  const handler = createKeyHandler({
    ...keyCtx(state), handleTab: () => { tabCalled = true },
  })
  handler("", { name: "tab" })
  assert.equal(tabCalled, false, "tab blocked during processing")
})

test("keyHandler: printable during processing adds to input (queued messages)", () => {
  const state = tuiState({ processing: true })
  const handler = createKeyHandler(keyCtx(state))
  handler("x", { name: "x" })
  assert.equal(state.input.join(""), "x")
})

test("keyHandler: escape in picker pops it (resolve null)", () => {
  let popped = false
  const state = tuiState({
    picker: { entries: [{ type: "item", value: "x", label: "x" }], index: 0, lines: [], scroll: 0 },
  })
  const handler = createKeyHandler({
    ...keyCtx(state), popPicker: (v) => { popped = true; assert.equal(v, null); return true },
  })
  handler("", { name: "escape" })
  assert.ok(popped)
})

// ---------------------------------------------------------------- panel render functions (incremental rendering)

test("panel functions: renderHeader includes model name", () => {
  const agent = {
    provider: { model: "deepseek-v4-pro", thinking: null },
    cwd: "/home/user/project",
  }
  const line = renderHeader(agent, 100)
  assert.ok(line.includes("ThinCoder"))
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
  assert.equal(lines.length, 3)
  assert.ok(lines[0].includes("✓"))
  assert.ok(lines[1].includes("▶"))
  assert.ok(lines[2].includes("○"))
})

test("panel functions: renderSubagent shows running and done states", () => {
  const subs = [
    { role: "coder", text: "writing tests...", tool: null, done: false, started: Date.now() },
    { role: "explore", text: "", tool: null, done: true, started: Date.now() - 5000 },
  ]
  const lines = renderSubagent(subs, 100)
  assert.ok(lines.some((l) => l.includes("coder") && l.includes("writing")))
  assert.ok(lines.some((l) => l.includes("explore") && l.includes("done")))
})

test("panel functions: renderOutput formats active panels", () => {
  const state = tuiState({
    outputPanels: {
      test: { parts: [{ kind: "text", text: "running 1/10\nrunning 2/10" }], len: 25, done: false },
    },
  })
  const lines = renderOutput(state, 80, 4)
  assert.ok(lines.some((l) => l.includes("❯ test")), "title row shows tool name")
  assert.ok(lines.some((l) => l.includes("running")), "title row shows running status")
})

test("panel functions: renderOutput colors lines by part kind", () => {
  const state = tuiState({
    outputPanels: {
      advisor: {
        parts: [
          { kind: "think", text: "let me check the diff\n" },
          { kind: "tool", text: "→ git diff\n" },
          { kind: "text", text: "final answer line" },
        ],
        len: 60, done: false,
      },
    },
  })
  const lines = renderOutput(state, 80, 6)
  const think = lines.find((l) => l.includes("let me check"))
  const tool = lines.find((l) => l.includes("→ git diff"))
  const text = lines.find((l) => l.includes("final answer"))
  assert.ok(think?.includes(C.reason), "think lines use reason color")
  assert.ok(tool?.includes(C.tool), "tool lines use tool color")
  assert.ok(text?.includes(C.dim), "text lines use dim color")
})

test("panel functions: renderOutput hides done panels", () => {
  const state = tuiState({
    outputPanels: {
      test: { parts: [{ kind: "text", text: "done all tests pass" }], len: 19, done: true },
    },
  })
  const lines = renderOutput(state, 80, 4)
  assert.equal(lines.length, 0)
})

test("panel functions: renderOutput keeps done panel during closeAt grace", () => {
  const state = tuiState({
    outputPanels: {
      bash: { parts: [{ kind: "text", text: "build ok" }], len: 8, done: true, closeAt: Date.now() + 60000 },
    },
  })
  const lines = renderOutput(state, 80, 4)
  assert.ok(lines.some((l) => l.includes("❯ bash")), "title still visible during grace")
  assert.ok(lines.some((l) => l.includes("build ok")), "content still visible during grace")
})

test("panel functions: renderOutput splits height across multiple panels", () => {
  const state = tuiState({
    outputPanels: {
      a: { parts: [{ kind: "text", text: "a1\na2" }], len: 4, done: false },
      b: { parts: [{ kind: "text", text: "b1" }], len: 2, done: false },
    },
  })
  const lines = renderOutput(state, 80, 8)
  assert.ok(lines.some((l) => l.includes("❯ a")), "panel a title visible")
  assert.ok(lines.some((l) => l.includes("❯ b")), "panel b title visible")
  assert.equal(lines.length, 8, "fills exactly allocated height")
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

// ---------------------------------------------------------------- streaming line-diff simulation

test("streaming simulation: only last line changes during token append", () => {
  // Simulate the conversation panel line caching logic:
  // initial state → token arrives → verify only new/changed lines differ
  const cols = 80, visibleH = 5
  const empty = renderConversation(tuiState({ lines: [] }), cols, visibleH, 0)
  const withText = renderConversation(tuiState({
    lines: [{ text: "hello", color: "" }],
  }), cols, visibleH, 0)
  const withStream = renderConversation(tuiState({
    lines: [{ text: "hello", color: "" }],
    streaming: " world",
  }), cols, visibleH, 0)

  // Compare line by line: between "hello" and "hello world", only last line differs
  let diffCount = 0
  for (let i = 0; i < visibleH; i++) {
    if (withText[i] !== withStream[i]) diffCount++
  }
  // streaming is a SEPARATE line appended after history, so when it first appears
  // it pushes the last history line up → typically 2 lines change on first token,
  // then only 1 (the streaming line) on subsequent tokens within the same turn.
  assert.ok(diffCount <= 2, `expected ≤2 diffs, got ${diffCount}`)
})

// ---------------------------------------------------------------- markdown 轻量渲染（IK5VW3）

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


test("streaming simulation: no diff when streaming content unchanged", () => {
  const cols = 80, visibleH = 5
  const state = tuiState({ lines: [{ text: "hello", color: "" }], streaming: " world" })
  const a = renderConversation(state, cols, visibleH, 0)
  const b = renderConversation(state, cols, visibleH, 0)
  assert.deepEqual(a, b) // pure function, same input → same output
})

test("streaming simulation: new line in middle pushes lines up", () => {
  const cols = 80, visibleH = 4
  // Two lines of history
  const s1 = tuiState({ lines: [
    { text: "line1", color: "" },
    { text: "line2", color: "" },
  ]})
  // Add a third line — the visible window shifts
  const s2 = tuiState({ lines: [
    { text: "line1", color: "" },
    { text: "line2", color: "" },
    { text: "line3", color: "" },
  ]})
  const a = renderConversation(s1, cols, visibleH, 0)
  const b = renderConversation(s2, cols, visibleH, 0)

  // With visibleH=4 and 3 lines, both render 4 lines (1 pad + 2 content vs 1 pad + 3 content)
  assert.equal(a.length, visibleH)
  assert.equal(b.length, visibleH)
  // Content differs: s1 shows line1,line2; s2 shows line1,line2,line3
  let diffs = 0
  for (let i = 0; i < visibleH; i++) {
    if (a[i] !== b[i]) diffs++
  }
  // Adding a new history line pushes all visible lines up — up to visibleH diffs
  assert.ok(diffs >= 1 && diffs <= visibleH, `expected 1-${visibleH} diffs, got ${diffs}`)
})

// ====================================================================
// picker 重构（Phase A/B/C）：renderFrame 回归 / key-handler picker 分支 / renderPicker / layout 约束
// ====================================================================

const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "")

/** picker 状态工厂：20 个 item，lines 已构建（winH 依赖 lines.length） */
function pickerState(overrides = {}) {
  const items = Array.from({ length: 20 }, (_, i) => ({ type: "item", text: `item${i}` }))
  return {
    title: "Demo", entries: items,
    lines: items.map((it, i) => ({ text: `   ${it.text}`, color: "" })),
    index: 0, scroll: 0, selectedLine: 0, filter: "", filteredItems: items,
    ...overrides,
  }
}

test("renderFrame: picker 打开时全量重绘返回 frame/cursorRow/cursorCol 且含 picker 标题（Phase A 回归）", () => {
  const state = tuiState({ picker: pickerState() })
  const { frame, cursorRow, cursorCol } = renderFrame(state, tuiAgent(), { cols: 80, rows: 24, slashCommands: [] })
  assert.ok(stripAnsi(frame).includes("Demo"), "frame 应包含 picker 标题")
  assert.equal(typeof cursorRow, "number")
  assert.equal(typeof cursorCol, "number")
})

test("keyHandler: picker 中可打印字符进入 filter，控制字符（Tab）不进", () => {
  const state = tuiState({ picker: pickerState() })
  const handler = createKeyHandler(keyCtx(state))
  handler("a", { name: "a" })
  handler("b", { name: "b" })
  assert.equal(state.picker.filter, "ab")
  handler("\t", { name: "tab" })
  assert.equal(state.picker.filter, "ab", "Tab 不应进入 filter")
})

test("keyHandler: picker filter 变化重置 index/scroll；Backspace 删 filter 字符", () => {
  const state = tuiState({ picker: pickerState({ index: 5, scroll: 3 }) })
  const handler = createKeyHandler(keyCtx(state))
  handler("x", { name: "x" })
  assert.equal(state.picker.filter, "x")
  assert.equal(state.picker.index, 0, "filter 变化重置 index")
  assert.equal(state.picker.scroll, 0, "filter 变化重置 scroll")
  handler("", { name: "backspace" })
  assert.equal(state.picker.filter, "")
  handler("", { name: "backspace" }) // 空 filter 时 backspace 无副作用、不抛错
  assert.equal(state.picker.filter, "")
})

test("keyHandler: picker PgUp/PgDn/Home/End 导航与边界", () => {
  const state = tuiState({ picker: pickerState() })
  const handler = createKeyHandler(keyCtx(state))
  // 与 key-handler 同一数据源：layout 实际 picker 面板高减标题行
  const winH = computeLayout(state, { cols: process.stdout.columns || 80, rows: process.stdout.rows || 24 }).panels.picker.h - 1
  handler("", { name: "pagedown" })
  assert.equal(state.picker.index, Math.min(19, winH))
  handler("", { name: "pageup" })
  assert.equal(state.picker.index, 0)
  handler("", { name: "end" })
  assert.equal(state.picker.index, 19)
  handler("", { name: "pagedown" })
  assert.equal(state.picker.index, 19, "PgDn 到底后 clamp")
  handler("", { name: "home" })
  assert.equal(state.picker.index, 0)
  handler("", { name: "pageup" })
  assert.equal(state.picker.index, 0, "PgUp 到顶后 clamp")
})

test("keyHandler: picker PgDn 步长跟随 layout 小终端压缩后的实际可视窗", () => {
  const state = tuiState({ picker: pickerState() })
  const handler = createKeyHandler(keyCtx(state))
  const origRows = process.stdout.rows
  process.stdout.rows = 9 // 触发 pickerFinalH 压缩（6 → 3）
  try {
    const h = computeLayout(state, { cols: 80, rows: 9 }).panels.picker.h
    assert.equal(h, 3, "小终端 picker 被压到 3 行")
    handler("", { name: "pagedown" })
    assert.equal(state.picker.index, h - 1, "PgDn 按实际可视窗（2 行）跳，而不是未压缩的 5 行")
  } finally {
    process.stdout.rows = origRows
  }
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

test("keyHandler: picker Enter 调 popPicker(选中项)、Esc 调 popPicker(null)", () => {
  const pops = []
  const state = tuiState({ picker: pickerState({ index: 3 }) })
  const handler = createKeyHandler({ ...keyCtx(state), popPicker: (v) => { pops.push(v); return true } })
  handler("", { name: "return" })
  assert.equal(pops[0], state.picker.filteredItems[3], "Enter resolve 过滤后列表的当前项")
  handler("", { name: "escape" })
  assert.equal(pops[1], null, "Esc resolve null")
})

test("keyHandler: Ctrl+C 在 picker 打开时取消 picker 而不是退出", () => {
  const pops = []
  let cleaned = false
  const state = tuiState({ picker: pickerState() })
  const handler = createKeyHandler({ ...keyCtx(state), popPicker: (v) => { pops.push(v); return true }, cleanup: () => { cleaned = true } })
  handler("", { name: "c", ctrl: true })
  assert.deepEqual(pops, [null], "Ctrl+C = 取消当前 picker")
  assert.equal(cleaned, false, "不应触发退出")
})

test("keyHandler: Ctrl+C 无 picker 时第一段仅提示不退出（防误触）", () => {
  let cleaned = false
  const lines = []
  const state = tuiState()
  const ctx = {
    ...keyCtx(state),
    cleanup: () => { cleaned = true },
    exitDelay: 60_000,
    exitArmDelay: 60_000,
    pushLine: (text) => lines.push(text),
  }
  const handler = createKeyHandler(ctx)
  try {
    handler("", { name: "c", ctrl: true })
    assert.equal(cleaned, false, "第一次 Ctrl+C 不应退出")
    assert.equal(state.exitArmed, true, "第一次 Ctrl+C 武装 exitArmed")
    assert.ok(ctx.exitArmTimer, "武装定时器已创建")
    assert.ok(lines.some((l) => l.includes("again")), "给出再按确认提示")
    // 第二次 Ctrl+C 才真正退出
    handler("", { name: "c", ctrl: true })
    assert.equal(cleaned, true, "第二次 Ctrl+C 走 cleanup 退出路径")
    assert.ok(ctx.exitTimer, "退出定时器已创建")
  } finally {
    clearTimeout(ctx.exitArmTimer)
    clearTimeout(ctx.exitTimer)
  }
})

test("keyHandler: Ctrl+C 武装超时后自动解除，需重新武装", async () => {
  let cleaned = false
  const state = tuiState()
  const ctx = {
    ...keyCtx(state),
    cleanup: () => { cleaned = true },
    exitDelay: 60_000,
    exitArmDelay: 10,
  }
  const handler = createKeyHandler(ctx)
  handler("", { name: "c", ctrl: true })
  assert.equal(state.exitArmed, true)
  await new Promise((r) => setTimeout(r, 30))
  assert.equal(state.exitArmed, false, "窗口过期后自动解除")
  handler("", { name: "c", ctrl: true })
  assert.equal(cleaned, false, "解除后再次 Ctrl+C 仍只是武装")
  assert.equal(state.exitArmed, true)
  clearTimeout(ctx.exitArmTimer)
  clearTimeout(ctx.exitTimer)
})

test("renderPicker: 位置指示 / filter 标题 / ↑ more / ↓ more", () => {
  const picker = pickerState({ index: 2, scroll: 5, filter: "ab" })
  const state = tuiState({ picker })
  const out = renderPicker(state, 60, { y: 0, h: 6 }, picker).map(stripAnsi)
  assert.ok(out[0].includes("❯ Demo"), "标题行含 picker 标题")
  assert.ok(out[0].includes("│ ab"), "标题行含 filter 输入")
  assert.ok(out[0].includes("3/20"), "标题行右侧含位置指示")
  assert.ok(out[1].includes("↑ more"), "窗口上方有更多内容时首行提示")
  assert.ok(out[5].includes("↓ more"), "窗口下方有更多内容时末行提示")
})

test("renderPicker: 超长 filter 的标题行被截断，右侧位置指示保留", () => {
  const picker = pickerState({ index: 2, filter: "x".repeat(200) })
  const state = tuiState({ picker })
  const out = renderPicker(state, 40, { y: 0, h: 3 }, picker).map(stripAnsi)
  assert.ok(stringWidth(out[0]) <= 39, `标题行不超终端宽（实际 ${stringWidth(out[0])}）`)
  assert.ok(out[0].includes("3/20"), "右侧位置指示保留")
})

test("renderStatus: picker 激活时提示输入即过滤与 PgUp/PgDn", () => {
  const state = tuiState({ picker: pickerState() })
  const agent = { provider: { model: "test" }, cwd: "/test", planMode: false, autoApprove: false, config: {} }
  const line = stripAnsi(renderStatus(state, agent, 120, []))
  assert.ok(line.includes("filter"), "提示输入即过滤")
  assert.ok(line.includes("PgUp/PgDn"), "提示翻页导航")
})

test("keyHandler: picker 中粘贴多行文本先清洗换行再进 filter", () => {
  const state = tuiState({ picker: pickerState() })
  const handler = createKeyHandler(keyCtx(state))
  handler("ab\ncd\r\nef", {})
  assert.equal(state.picker.filter, "abcdef", "换行被清洗，其余字符进入 filter")
  // 清洗后仍含其他控制字符的整段丢弃
  handler("x\x07y", {})
  assert.equal(state.picker.filter, "abcdef", "含控制字符的输入仍被丢弃")
})

test("renderPicker: 单行可视窗时上下都有更多内容显示合并指示 ↑↓ more", () => {
  const picker = pickerState({ scroll: 5 }) // 20 项，窗口夹在中间
  const state = tuiState({ picker })
  const out = renderPicker(state, 60, { y: 0, h: 2 }, picker).map(stripAnsi) // h=2 → winH=1
  assert.ok(out[1].includes("↑↓ more"), "首行即末行时两个方向的 more 指示合并")
  assert.ok(out[1].includes("item5"), "条目内容仍正常显示")
})

test("pendingNoticeReady: picker/permission/question 任一激活时不弹后台更新提示", async () => {
  const { pendingNoticeReady } = await import("../src/tui/index.mjs")
  const base = { pendingNotice: { newer: true }, picker: null, permission: null, question: null }
  assert.equal(pendingNoticeReady(base), true, "无弹层时可弹")
  assert.equal(pendingNoticeReady({ ...base, picker: {} }), false, "picker 激活时不弹")
  assert.equal(pendingNoticeReady({ ...base, permission: {} }), false, "权限确认激活时不弹")
  assert.equal(pendingNoticeReady({ ...base, question: {} }), false, "提问弹层激活时不弹")
  assert.equal(pendingNoticeReady({ ...base, pendingNotice: null }), false, "无挂起提示不弹")
})

test("upgradeFailureText: 失败提示附 npm 输出尾部（最多 3 行）", async () => {
  const { upgradeFailureText } = await import("../src/tui/index.mjs")
  const text = upgradeFailureText(1, "line1\nline2\nline3\nnpm ERR! code EACCES\n")
  assert.ok(text.includes("exit 1"))
  assert.ok(text.includes("npm ERR! code EACCES"), "含输出尾部，方便定位失败原因")
  assert.ok(!text.includes("line1"), "只保留最后 3 行")
  assert.ok(!upgradeFailureText(1, "").includes("\n"), "无输出时不加尾巴")
})

test("renderPicker: 超宽行截断加省略号且不超宽", () => {
  const picker = pickerState({ lines: [{ text: "x".repeat(200), color: "" }], scroll: 0 })
  const state = tuiState({ picker })
  const out = renderPicker(state, 40, { y: 0, h: 3 }, picker).map(stripAnsi)
  assert.ok(out[1].endsWith("…"), "截断行末尾加省略号")
  assert.ok(stringWidth(out[1]) <= 39, "不超终端宽")
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
