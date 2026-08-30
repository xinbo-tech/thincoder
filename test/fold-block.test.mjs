/**
 * fold-block.test.mjs — 公共可折叠区块组件单测（2026-08-30）。
 * 覆盖：60% 封顶数学、展开态三种形态（≤cap / >cap / unfold-all）、
 * 底部可达控制行、blocks→时间线渲染契约、tail 提取、toggle。
 */
import test from "node:test"
import assert from "node:assert/strict"
import {
  foldCapRows, isExpanded, toggleFoldBlock, foldHintLine, blankLine,
  renderExpandedBlock, renderBlockTimeline, renderFoldedHead,
} from "../src/tui/fold-block.mjs"
import { ADVISOR_THINKING_PLACEHOLDER } from "../src/advisor/run.mjs"
import { C } from "../src/tui/ansi.mjs"

test("foldCapRows: 屏幕行数 60% 向下取整，边界安全", () => {
  assert.equal(foldCapRows(24), 14)
  assert.equal(foldCapRows(50), 30)
  assert.equal(foldCapRows(1), 1, "极小终端不低于 1 行")
  assert.equal(foldCapRows(0), Infinity, "rows 未知 → 不封顶")
  assert.equal(foldCapRows(undefined), Infinity)
})

test("isExpanded / toggleFoldBlock: 双向切换 + unfold-all 强制展开", () => {
  const state = { foldEnabled: true, expandedBlocks: new Set() }
  assert.equal(isExpanded(state, "k1"), false)
  toggleFoldBlock(state, "k1")
  assert.equal(isExpanded(state, "k1"), true, "toggle 展开")
  toggleFoldBlock(state, "k1")
  assert.equal(isExpanded(state, "k1"), false, "toggle 收回")
  assert.equal(isExpanded({ foldEnabled: false, expandedBlocks: new Set() }, "k1"), true, "foldEnabled=false 全展开")
})

test("renderExpandedBlock: body ≤ cap → 全量 + 顶部控制行", () => {
  const body = Array.from({ length: 5 }, (_, i) => ({ text: `l${i}`, color: C.dim }))
  const out = renderExpandedBlock({ body, foldKey: "k", state: { foldEnabled: true, expandedBlocks: new Set(["k"]) }, maxRows: 24, label: "blk" })
  // blank + ▼ + 5 body
  assert.equal(out.length, 7)
  assert.ok(out[1]._foldToggle === "k" && out[1].text.includes("click to collapse"), "顶部折叠控制行")
  assert.ok(out.some((l) => l.text === "l4"), "内容完整")
  assert.ok(!out.some((l) => l.text.includes("capped")), "未触封顶无标记")
})

test("renderExpandedBlock: body > cap → 封顶 + 底部控制行必在区块末尾（可达性核心保证）", () => {
  const body = Array.from({ length: 100 }, (_, i) => ({ text: `line${i}`, color: C.dim }))
  const cap = foldCapRows(24) // 14
  const out = renderExpandedBlock({ body, foldKey: "k", state: { foldEnabled: true, expandedBlocks: new Set(["k"]) }, maxRows: 24, label: "blk" })
  assert.ok(out.length <= cap + 2, `区块总高 ≤ cap+2（blank 上下文），实际 ${out.length}`)
  assert.ok(out.some((l) => l.text.includes("capped at 60%")), "封顶提示行存在")
  assert.ok(out.some((l) => l.text === "line0"), "保留开头内容")
  assert.ok(!out.some((l) => l.text === "line99"), "超限尾部不渲染")
  const last = out[out.length - 1]
  assert.equal(last._foldToggle, "k", "最后一个是折叠控制行——始终可点击收起")
  assert.ok(last.text.includes("click to collapse"))
})

test("renderExpandedBlock: foldEnabled=false → 裸内容无控制行无封顶（unfold-all 语义）", () => {
  const body = Array.from({ length: 100 }, (_, i) => ({ text: `line${i}`, color: C.dim }))
  const out = renderExpandedBlock({ body, foldKey: "k", state: { foldEnabled: false }, maxRows: 24, label: "blk" })
  assert.equal(out.length, 100)
  assert.ok(!out.some((l) => l._foldToggle), "无控制行（toggle 无效，提示会撒谎）")
})

test("renderExpandedBlock: maxRows 未传 → 不封顶（测试/无终端环境兼容）", () => {
  const body = Array.from({ length: 100 }, (_, i) => ({ text: `line${i}`, color: C.dim }))
  const out = renderExpandedBlock({ body, foldKey: "k", state: { foldEnabled: true, expandedBlocks: new Set(["k"]) }, label: "blk" })
  assert.equal(out.length, 102, "blank + ▼ + 全量")
})

test("renderBlockTimeline: kind 配色契约 + _skipDimFold + placeholder 剥离", () => {
  const blocks = [
    { kind: "think", text: "thinking line" },
    { kind: "text", text: "**bold** text" },
    { kind: "tool", text: "→ read x.mjs" },
    { kind: "meta", text: "…（已省略 3 行）" },
  ]
  const out = renderBlockTimeline(blocks, 80)
  const think = out.find((l) => l.text.includes("thinking line"))
  assert.equal(think.color, C.reason, "think=C.reason")
  const tool = out.find((l) => l.text.includes("→ read"))
  assert.equal(tool.color, C.tool, "tool=C.tool")
  const bold = out.find((l) => l.text.includes("bold"))
  assert.ok(bold.text.includes("\x1b[1m"), "text 块走 markdown 渲染")
  assert.ok(bold.text.startsWith("│ "), "gutter 前缀")
  assert.ok(out.every((l) => l._skipDimFold === true), "全部行 _skipDimFold（连续 dim 折叠不套叠）")
  const ph = renderBlockTimeline([{ kind: "text", text: `x${ADVISOR_THINKING_PLACEHOLDER}y` }], 80, { stripPlaceholder: true })
  assert.ok(!ph.some((l) => l.text.includes(ADVISOR_THINKING_PLACEHOLDER)), "stripPlaceholder 剥离标记")
})

test("renderBlockTimeline: gutter 空串全宽模式（冻结 advisor 无槽线惯例）", () => {
  const out = renderBlockTimeline([{ kind: "tool", text: "→ read x" }], 80, { gutter: "", pad: 1 })
  assert.ok(!out[0].text.startsWith("│ "), "无 gutter")
})

test("renderFoldedHead: 统一折叠形态 = 命名头 + 末 3 行（dim + _skipDimFold）", () => {
  const body = Array.from({ length: 10 }, (_, i) => ({ text: `line${i}`, color: C.text }))
  const header = { text: "▶ thinking · 10 lines — click to expand", color: C.fold, _foldToggle: "long-3" }
  const out = renderFoldedHead({ header, body })
  assert.equal(out.length, 4, "header + 3 tail lines")
  assert.equal(out[0], header, "header 原样在最前")
  assert.deepEqual(out.slice(1).map((l) => l.text), ["line7", "line8", "line9"], "tail = 末 3 行（非前 4 行——旧形态已废弃）")
  assert.ok(out.slice(1).every((l) => l.color === C.dim && l._skipDimFold === true), "tail dim + 防连续 dim 套叠")
  // 空行被过滤（不占 tail 名额）
  const withBlanks = renderFoldedHead({ header, body: [...body.slice(0, 8), { text: "  ", color: C.text }, ...body.slice(8)] })
  assert.deepEqual(withBlanks.slice(1).map((l) => l.text), ["line7", "line8", "line9"], "空白行不进 tail")
  // tailLines 可调
  assert.equal(renderFoldedHead({ header, body, tailLines: 1 }).length, 2)
})

test("foldHintLine: 下划线只落在 click 短语上", () => {
  const line = foldHintLine("▶ … 9 more lines — click to expand", "fold-0")
  assert.ok(line.text.includes("\x1b[4mclick to expand\x1b[24m"))
  assert.equal(line._foldToggle, "fold-0")
  assert.ok(blankLine().text === "" , "blankLine 辅助")
})
