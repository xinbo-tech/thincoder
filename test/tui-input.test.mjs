/**
 * tui-input.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): tui.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { computeLayout } from "../src/tui/layout.mjs"
import { createKeyHandler } from "../src/tui/key-handler.mjs"
import { C } from "../src/tui/ansi.mjs"
import { renderRows } from "../src/tui/render-frame.mjs"

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


// ====================================================================
// clipboard.mjs — insertPastedText routing
// ====================================================================


test("insertPastedText: free-text question active → splices into answer at cursor, \r\n → space, input untouched", async () => {
  const { insertPastedText } = await import("../src/tui/clipboard.mjs")
  const state = tuiState()
  state.question = { text: "Enter API key:", options: [], answer: [..."sk-"], cursor: 3, resolve: noop }
  insertPastedText(state, "abc123\r\n")
  assert.equal(state.question.answer.join(""), "sk-abc123 ", "answer 是 codepoint 数组；尾随 \r\n → 空格（保文本）")
  assert.equal(state.question.cursor, 10)
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
  const state = tuiState({ question: { text: "What?", options: [], answer: [..."my answer"], cursor: 9, resolve: () => {} } })
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


// ====================================================================
// question 自由文本态：光标与编辑键（TUI-INPUT-BOX.md §7——T-Q1..Q11）
// ====================================================================


test("T-Q1 renderRows: question 自由文本态保留反显光标 + 硬件定位（hasOverlay 例外细化）", () => {
  const agent = tuiAgent()
  const state = tuiState({ question: { text: "q", options: [], answer: [..."abc"], cursor: 1, resolve: noop } })
  const { rows, layout, cursorRow, cursorCol } = renderRows(state, agent, { cols: 80, rows: 24, slashCommands: [] })
  assert.equal(layout.questionLayout.cursorCol, 3, "中段光标列 = 2（前缀） + 1（a 后）")
  assert.equal(layout.questionLayout.cursorLine, 0)
  const boxRow = rows[layout.panels.inputBox.y + 1]
  assert.ok(boxRow.includes("\x1b[7mb\x1b[27m"), "光标在 'b' 上反显（▸ abc 第 3 列）")
  assert.ok(cursorRow > 0 && cursorCol > 0, "自由文本态硬件光标定位恢复（不再整体隐藏）")
  assert.equal(cursorRow, layout.panels.inputBox.y + 2, "硬件光标行 = box 首行（1-based）")
  assert.equal(cursorCol, 3 + layout.questionLayout.cursorCol)
})



test("T-Q2 keyHandler: question 自由文本态 ←→/Home/End 移动（0 与 len 边界停）", () => {
  const state = tuiState({ question: { text: "q", options: [], answer: [..."ab"], cursor: 1, resolve: noop } })
  const handler = createKeyHandler(keyCtx(state))
  handler("", { name: "home" })
  assert.equal(state.question.cursor, 0)
  handler("", { name: "left" })
  assert.equal(state.question.cursor, 0, "左边界停")
  handler("", { name: "right" })
  assert.equal(state.question.cursor, 1)
  handler("", { name: "end" })
  assert.equal(state.question.cursor, 2)
  handler("", { name: "right" })
  assert.equal(state.question.cursor, 2, "右边界停")
})



test("T-Q3 keyHandler: question 自由文本态中段插入 + Backspace 位置感知（非仅尾删）", () => {
  const state = tuiState({ question: { text: "q", options: [], answer: [..."ac"], cursor: 1, resolve: noop } })
  const handler = createKeyHandler(keyCtx(state))
  handler("b", { name: "b" })
  assert.equal(state.question.answer.join(""), "abc")
  assert.equal(state.question.cursor, 2)
  handler("", { name: "backspace" })
  assert.equal(state.question.answer.join(""), "ac", "光标位置感知——删 'b' 而非尾字符")
  assert.equal(state.question.cursor, 1)
  handler("", { name: "backspace" })
  assert.equal(state.question.answer.join(""), "c")
  assert.equal(state.question.cursor, 0)
  handler("", { name: "backspace" })
  assert.equal(state.question.answer.join(""), "c", "0 处不再删")
})



test("T-Q4 keyHandler: question 自由文本态 Ctrl+U 清空（cursor 归 0）", () => {
  const state = tuiState({ question: { text: "q", options: [], answer: [..."xyz"], cursor: 2, resolve: noop } })
  const handler = createKeyHandler(keyCtx(state))
  handler("", { name: "u", ctrl: true })
  assert.deepEqual(state.question.answer, [])
  assert.equal(state.question.cursor, 0)
})



test("T-Q5 renderRows: question options 态无光标（选择标记即反馈——回归）", () => {
  const agent = tuiAgent()
  const state = tuiState({ question: { text: "pick", options: ["A", "B", "C"], selected: 0, resolve: noop } })
  const { rows, layout, cursorRow, cursorCol } = renderRows(state, agent, { cols: 80, rows: 24, slashCommands: [] })
  const boxRows = rows.slice(layout.panels.inputBox.y + 1, layout.panels.inputBox.y + 4).join("")
  assert.ok(!boxRows.includes("\x1b[7m"), "options 态无反显光标")
  assert.equal(cursorRow, 0, "硬件光标行 0（隐藏）")
  assert.equal(cursorCol, 0, "硬件光标列 0（隐藏）")
  assert.ok(boxRows.includes("\u25b8 A"), "选中项标记不变（▸ A）")
})



test("T-Q7 keyHandler: question Esc 语义——Custom 自由文本态 Esc 回 options；无 options 中止", () => {
  // (a) options → 选 ✍ Custom answer… → 输入 → Esc → 回 options（逃生口，选中位恢复）
  let resolved = "unset"
  const state = tuiState({
    question: { text: "pick", options: ["A", "B", "C", "\u0001custom-answer"], selected: 3, resolve: (v) => { resolved = v } },
  })
  const handler = createKeyHandler(keyCtx(state))
  handler("", { name: "return" })
  assert.deepEqual(state.question.options, [], "Custom → 自由文本态")
  assert.deepEqual(state.question.answer, [])
  assert.equal(state.question.cursor, 0)
  handler("z", { name: "z" })
  assert.equal(state.question.answer.join(""), "z")
  handler("", { name: "escape" })
  assert.deepEqual(state.question.options, ["A", "B", "C", "\u0001custom-answer"], "Esc 回 options 态")
  assert.equal(state.question.selected, 3, "选中位恢复")
  assert.equal(state.question.answer, undefined, "options 态无 answer/cursor（不变量）")
  assert.equal(resolved, "unset", "未 resolve（非中止）")
  // options 态再 Esc = 中止
  handler("", { name: "escape" })
  assert.equal(state.question, null)
  assert.equal(resolved, "")
  // (b) 无 options 的自由文本 Esc = 中止 question
  const state2 = tuiState({ question: { text: "q", options: [], answer: [..."hi"], cursor: 2, resolve: noop } })
  let resolved2 = "unset"
  state2.question.resolve = (v) => { resolved2 = v }
  const handler2 = createKeyHandler(keyCtx(state2))
  handler2("", { name: "escape" })
  assert.equal(state2.question, null)
  assert.equal(resolved2, "")
})



test("T-Q9 keyHandler: question 自由文本态 Ctrl+J no-op + 未列键吞（无 fall-through——search 穿透教训回归）", () => {
  const state = tuiState({ question: { text: "q", options: [], answer: [..."ab"], cursor: 2, resolve: noop } })
  const handler = createKeyHandler(keyCtx(state))
  handler("\n", { name: "enter" }) // Ctrl+J（\n → name "enter"）
  assert.equal(state.question.answer.join(""), "ab", "Ctrl+J 不插换行")
  assert.equal(state.question.cursor, 2)
  handler("\t", { name: "tab" })
  assert.equal(state.question.answer.join(""), "ab", "Tab 未列键吞")
  handler("", { name: "up" })
  handler("", { name: "pagedown" })
  handler("", { name: "delete" })
  assert.equal(state.question.answer.join(""), "ab")
  assert.equal(state.input.length, 0, "无 fall-through——主输入框未被触碰")
  assert.ok(state.question, "question 仍激活")
})



test("T-Q10 computeLayout: question 长答案折行 + MAX_INPUT_LINES cap 滚动（光标随行）", () => {
  const long = "x".repeat(400) // 内容宽 ~73 → 6 行
  const state = tuiState({ question: { text: "q", options: [], answer: [...long], cursor: 400, resolve: noop } })
  const layout = computeLayout(state, { cols: 80, rows: 24 })
  assert.ok(layout.questionLayout.lines.length > 5, "长答案多行展开")
  assert.equal(layout.boxLines.length, 5, "cap 5 行（同主输入 MAX_INPUT_LINES）")
  assert.ok(layout.questionOffset > 0, "光标在尾部 → offset > 0（滚动到底）")
  assert.equal(layout.boxLines.at(-1), layout.questionLayout.lines.at(-1), "末行可见（可视窗尾 = 布局末行）")
  assert.equal(layout.panels.inputBox.h, 7, "box 高 = 5 + 2 边框")
})



test("T-Q11 keyHandler: question 自由文本态 emoji 不劈半（codepoint 数组移动/删除）", () => {
  const state = tuiState({ question: { text: "q", options: [], answer: [..."a\u{1F600}b"], cursor: 3, resolve: noop } })
  assert.deepEqual(state.question.answer, ["a", "\u{1F600}", "b"], "emoji 单 codepoint 元素（代理对不劈半）")
  const handler = createKeyHandler(keyCtx(state))
  handler("", { name: "left" })
  assert.equal(state.question.cursor, 2)
  handler("", { name: "backspace" })
  assert.equal(state.question.answer.join(""), "ab", "退格删整个 emoji")
  assert.equal(state.question.cursor, 1)
  // ←→ 步进 codepoint：从头部右移两格 = 越过 emoji（不在代理对中间停）
  const state2 = tuiState({ question: { text: "q", options: [], answer: [..."a\u{1F600}b"], cursor: 0, resolve: noop } })
  const handler2 = createKeyHandler(keyCtx(state2))
  handler2("", { name: "right" })
  assert.equal(state2.question.cursor, 1)
  handler2("", { name: "right" })
  assert.equal(state2.question.cursor, 2)
  handler2("", { name: "right" })
  assert.equal(state2.question.cursor, 3)
  assert.equal(state2.question.answer.join(""), "a\u{1F600}b", "移动不改变内容")
})



test("askQuestion: 自由文本态装配 q.answer=codepoint 数组 + q.cursor（options 态无 cursor）", async () => {
  const { createInteraction } = await import("../src/tui/interaction.mjs")
  const agent = tuiAgent()
  const state = tuiState()
  const lines = []
  const inter = createInteraction({
    agent, state, pushLine: (t) => lines.push(t), pushLabel: () => {}, render: noop, summarize: () => "",
  })
  const p1 = inter.askQuestion("type:")
  assert.deepEqual(state.question.answer, [], "answer 初始化为 codepoint 数组")
  assert.equal(state.question.cursor, 0, "进入自由文本态 cursor = answer.length")
  state.question.resolve("")
  await p1
  state.question = null // 生产清空在 key-modes（Enter/Esc）——测试手动复位以发第二个问
  const p2 = inter.askQuestion("pick:", ["x"])
  assert.equal(state.question.answer, undefined, "options 态无 answer（不变量）")
  assert.equal(state.question.cursor, undefined, "options 态无 cursor（不变量）")
  state.question.resolve("x")
  await p2
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



test("pendingNoticeReady: picker/permission/question 任一激活时不弹后台更新提示", async () => {
  const { pendingNoticeReady } = await import("../src/tui/index.mjs")
  const base = { pendingNotice: { newer: true }, picker: null, permission: null, question: null }
  assert.equal(pendingNoticeReady(base), true, "无弹层时可弹")
  assert.equal(pendingNoticeReady({ ...base, picker: {} }), false, "picker 激活时不弹")
  assert.equal(pendingNoticeReady({ ...base, permission: {} }), false, "权限确认激活时不弹")
  assert.equal(pendingNoticeReady({ ...base, question: {} }), false, "提问弹层激活时不弹")
  assert.equal(pendingNoticeReady({ ...base, pendingNotice: null }), false, "无挂起提示不弹")
})
