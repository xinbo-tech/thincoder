/**
 * session-title-surface.test.mjs — D8（会话标题常显 · CLI 状态行段）机器验收。
 * 设计权威：`docs/cli/design/TUI.md` §7.4（落点 = `buildStatusLine` 状态段簇尾——`ledgerHint`
 * 后、键位组前 · 取值 = `agent.title` 活读 · 空值零注入 · 40 显示列截断）；批次档
 * `2026-09-21-vsc-block-title-align.md` §2.12（逐字设计 + 用例 T1–T3）。
 * 手法：`renderStatus` 纯函数直驱（最小状态 / agent 桩——先例 `ledger-surface.test.mjs`）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { renderStatus } from "../src/tui/render-frame.mjs"
import { stringWidth } from "../src/tui/render.mjs"

const stripAnsi = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, "")
const baseState = (over = {}) => ({
  input: [], cursor: 0, scroll: 0, tasks: [], queue: [], history: [], historyIndex: -1, _draft: null,
  processing: false, processingStarted: Date.now(), status: "Ready", currentTool: null,
  tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
  ctxCache: { tokens: 0 },
  permission: null, question: null, picker: null, wizard: null, search: null, interruptPrompt: null,
  suspended: false, _suspPending: false, attentionAwaiting: false,
  ...over,
})
const agentStub = (over = {}) => ({
  provider: null, cwd: "x", autoApprove: false, planMode: false, config: null, _currentTurn: 0, _maxTurns: 0,
  ...over,
})

test("T1 有标题（正常）：状态段簇尾含 ` │ <title>`（键位组之前）∧ 整行 ≤ cols−1", () => {
  const flat = stripAnsi(renderStatus(baseState(), agentStub({ title: "修复 VSC 标题行" }), 80, []))
  assert.ok(flat.includes(" │ 修复 VSC 标题行"), `标题段在位（实到 ${JSON.stringify(flat)}）`)
  assert.ok(flat.indexOf(" │ 修复 VSC 标题行") < flat.indexOf(" │ Enter: send"), "落点 = 状态段簇尾（键位组之前）")
  assert.ok(stringWidth(flat) <= 79, `整行 ≤ cols−1（实 ${stringWidth(flat)}）`)
})

test("T2 空值零注入（负向锁）：空串 / undefined 两形态与无题行逐字节等价（零字节注入）", () => {
  const bare = renderStatus(baseState(), agentStub(), 80, [])
  const empty = renderStatus(baseState(), agentStub({ title: "" }), 80, [])
  const undef = renderStatus(baseState(), agentStub({ title: undefined }), 80, [])
  assert.equal(empty, bare, "空串 ⇒ 半态逐字节等价")
  assert.equal(undef, bare, "undefined ⇒ 半态逐字节等价")
  assert.equal(empty, undef, "两形态输出相同（无占位符混入）")
})

test("T3 截断（边界）：50 字符标题 ⇒ 段 ≤ 40 显示列 + 尾 `…`；键位组仍在行", () => {
  const flat = stripAnsi(renderStatus(baseState(), agentStub({ title: "T".repeat(50) }), 80, []))
  assert.ok(flat.includes(" │ " + "T".repeat(39) + "…"), `截断至 39 列 + …（实到 ${JSON.stringify(flat)}）`)
  assert.ok(!flat.includes("T".repeat(40)), "超宽部分不入行")
  assert.ok(flat.includes("Enter: send"), "键位组仍在行（标题段不吞键位组）")
})
