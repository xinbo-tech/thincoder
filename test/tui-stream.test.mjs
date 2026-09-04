/**
 * tui-stream.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): tui.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { buildConvLines } from "../src/tui/render-conversation.mjs"
import { C } from "../src/tui/ansi.mjs"
import { renderConversation } from "../src/tui/render-frame.mjs"

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


// ---------------------------------------------------------------- streaming line-diff simulation



test("streaming simulation: 流式主输出也有前导空行（2026-08-30——streaming 分支此前漏接空行逻辑）", () => {
  const state = tuiState({
    lines: [{ text: "", color: C.tool, _kind: "tool", _toolBlock: { name: "read", id: "t1", argsSummary: "a", argsJson: [], output: [], result: null, summary: null, started: 0, done: true, elapsed: null } }],
  })
  state.streaming = "正在输出"
  const out = buildConvLines(state, 80)
  assert.equal(out[0].text, "❯ read a  · done", "工具块头在前")
  assert.equal(out[1].text, "", "工具块与流式主输出之间有前导空行")
  assert.equal(out[2].text, "正在输出", "流式内容紧随其后")
  // 流式结束（flush 落盘）后行路径接管——不双空行
  state.streaming = ""
  state.lines.push({ text: "正在输出", color: C.text, _kind: "text" })
  const out2 = buildConvLines(state, 80)
  // 落盘后行路径接管：段首 + 段末各 1 空行（streaming 分支已不渲染，无叠加）
  const blanks = out2.filter((l) => l.text === "").length
  assert.equal(blanks, 2, "落盘后段首+段末各 1")
  for (let i = 0; i < out2.length - 1; i++) {
    assert.ok(!(out2[i].text === "" && out2[i + 1].text === ""), "空行不相邻（无双重插入）")
  }
});



test("streaming simulation: only last line changes during token append", () => {
  // Simulate the conversation panel line caching logic:
  // initial state → token arrives → verify only new/changed lines differ
  const cols = 80, visibleH = 5
  const _empty = renderConversation(tuiState({ lines: [] }), cols, visibleH, 0)
  // Unique line length below — the module-level _convCache keys on
  // lastLine.text.length, and a generic 5-char "hello" collides with other
  // test states across the file (P1 2026-08-30 pattern).
  const hello = "hello streaming cache key unique 9f8e2"
  const withText = renderConversation(tuiState({
    lines: [{ text: hello, color: C.text, _kind: "text" }],
  }), cols, visibleH, 0)
  const withStream = renderConversation(tuiState({
    lines: [{ text: hello, color: C.text, _kind: "text" }],
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
  // Since 2026-08-30 the main-output breathing room adds a leading blank to the
  // streamed segment: the first-token frame gains the blank (ANSI-colored "" ≠ "")
  // AND the bottom-anchored content shifts up by one row — a bounded one-shot
  // cost, then every following token touches only the streaming line.

test("行级渲染缓存（2026-08-31 懒加载卡顿修复）：同内容行复用一致，streaming 行 text 变 → 失效重算", async () => {

test("段级缓存（2026-08-31 懒加载卡顿优化②）：loadOlder unshift 后尾部段命中、工具块 append 失效", async () => {
  const { buildConvLines } = await import("../src/tui/render-conversation.mjs")
  const cols = 80, rows = 24
  const mk = (lines, extra = {}) => ({
    search: null, interruptPrompt: null, input: [], cursor: 0, question: null,
    picker: null, wizard: null, tasks: [], processing: false, subTasks: {}, outputPanels: {},
    permission: null, permissionPreview: [], queue: [],
    lines, reasoning: "", streaming: "", _advisorBlocks: [], foldEnabled: true,
    expandedBlocks: null, scroll: 0, ...extra,
  })
  // 行 A（普通文本）+ 行 B（工具块）
  const lineA = { text: "lineA unique " + "data ".repeat(6), color: "", _kind: "text", _lineId: 1 }
  const toolLine = {
    text: "", color: "", _lineId: 2,
    _toolBlock: {
      name: "read", roundTag: "", argsSummary: "a.txt", done: true, elapsed: 12,
      argsJson: ["{\"path\":\"a.txt\"}"], output: [], result: ["file content"], summary: "ok",
    },
  }
  const s = mk([lineA, toolLine])
  const first = buildConvLines(s, cols, rows)
  // 模拟 loadOlder：头部 unshift 新行（新对象）——尾部行对象引用不变 → 段缓存应命中
  const newLine = { text: "new older line unique " + "x ".repeat(4), color: "", _kind: "text", _lineId: 99 }
  s.lines.unshift(newLine)
  const second = buildConvLines(s, cols, rows)
  // 输出长度变化 = 新行贡献（段命中不复制旧行内容变化）
  assert.ok(second.length > first.length, "unshift 后行数增长（新行段计算）")
  // 尾部行体（lineA + toolLine 的 conv 行）应在 second 中存在且与 first 一致（段命中复用）
  const firstToolHead = first.find((l) => l.text?.includes("❯ read"))
  const secondToolHead = second.find((l) => l.text?.includes("❯ read"))
  assert.ok(firstToolHead && secondToolHead, "工具块头行存在")
  assert.equal(secondToolHead.text, firstToolHead.text, "工具块头行一致（段命中复用）")
  // 工具块流式 append → output.length 变 → 段失效 → 输出变
  toolLine._toolBlock.output.push("new output line")
  const third = buildConvLines(s, cols, rows)
  assert.notDeepEqual(third, second, "output append → 工具块段失效重算")
})

  const { buildConvLines } = await import("../src/tui/render-conversation.mjs")
  const cols = 80, rows = 24
  const hello = "hello wrap cache unique 7c3d1 " + "**bold** markdown ".repeat(4)
  const mk = (extra = {}) => ({
    search: null, interruptPrompt: null, input: [], cursor: 0, question: null,
    picker: null, wizard: null, tasks: [], processing: false, subTasks: {}, outputPanels: {},
    permission: null, permissionPreview: [], queue: [],
    lines: [{ text: hello, color: "", _kind: "text", _lineId: 1 }],
    reasoning: "", streaming: "", _advisorBlocks: [], foldEnabled: true, expandedBlocks: null,
    scroll: 0, ...extra,
  })
  const s = mk()
  const a = buildConvLines(s, cols, rows)
  // 逼重建（streaming 分量进 conv 键）——旧行对象不变 → 行缓存复用——输出与首轮一致
  s.streaming = "x"
  const b = buildConvLines(s, cols, rows)
  assert.deepEqual(b.slice(0, a.length), a, "未变行复用缓存 → 输出一致")
  s.streaming = ""
  // 同对象 text 变（流式追加语义）→ 行缓存失效 → 输出变化
  s.lines[0].text = hello + " 追加内容"
  const c = buildConvLines(s, cols, rows)
  assert.notDeepEqual(c, a, "text 变 → 行缓存失效重算（不吐旧内容）")
})

  assert.ok(diffCount <= 4, `first-token frame: blank + content shift, got ${diffCount}`)

  // Same baseline, streaming content changes → ONLY the last line differs.
  const s1 = renderConversation(tuiState({
    lines: [{ text: hello, color: C.text, _kind: "text" }],
    streaming: " world",
  }), cols, visibleH, 0)
  const s2 = renderConversation(tuiState({
    lines: [{ text: hello, color: C.text, _kind: "text" }],
    streaming: " world2",
  }), cols, visibleH, 0)
  let streamDiff = 0
  for (let i = 0; i < visibleH; i++) {
    if (s1[i] !== s2[i]) streamDiff++
  }
  assert.equal(streamDiff, 1, "同基线流式追加只动最后一行（空行静态）")
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
