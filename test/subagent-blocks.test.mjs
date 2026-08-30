/**
 * subagent-blocks.mjs 单测 — 子agent 活动区块数据层（§7.2 D4/D5，消费端）。
 * 覆盖：前缀路由（token/reasoning/toolCall/toolOutput）、事件 token 头部更新、
 * N2 环形上限、done 标记。渲染断言在 tui.test.mjs。
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import {
  SUB_BLOCK_LINE_LIMIT, finishSubTask, applySubEvent,
  routeSubToken, routeSubReasoning, routeSubToolCall, routeSubToolOutput,
} from "../src/tui/subagent-blocks.mjs"

const noop = () => {}
const state = () => ({ subTasks: {} })

test("routeSubToken: 无前缀 → false（主路径）；带前缀 → 区块 + 主流隔离", () => {
  const s = state()
  assert.equal(routeSubToken(s, "plain", noop), false)
  assert.equal(routeSubToken(s, "coder#1/hello", noop), true)
  const sub = s.subTasks["coder#1"]
  assert.ok(sub.blocks.some((b) => b.kind === "text" && b.text === "hello"))
})

test("routeSubToken: [model] 元数据只记录一次；后续 [model] 开头的内容照常入块", () => {
  const s = state()
  routeSubToken(s, "coder#1/[model]glm-5.3", noop)
  assert.equal(s.subTasks["coder#1"].model, "glm-5.3")
  // model 已设置 → 第二个 [model] 开头 token 视为内容（不吞）
  routeSubToken(s, "coder#1/[model] not metadata", noop)
  assert.ok(s.subTasks["coder#1"].blocks.some((b) => b.text.includes("[model] not metadata")))
})

test("routeSubToken: 事件 token 只进头部，不进 blocks", () => {
  const s = state()
  routeSubToken(s, "coder#1/⟦ev⟧turn\x1e3\x1e100\x1ellm\x1e", noop)
  const sub = s.subTasks["coder#1"]
  assert.equal(sub.turn, 3)
  assert.equal(sub.maxTurns, 100)
  assert.equal(sub.blocks.length, 0)
  assert.equal(applySubEvent(sub, "⟦ev⟧approval\x1e3\x1e100\x1eapproval\x1ewrite x".slice(0)), true)
  // applySubEvent 直接调用：detail 超长截断 ≤ 40
  applySubEvent(sub, `⟦ev⟧approval\x1e4\x1e100\x1eapproval\x1e${"y".repeat(60)}`)
  assert.ok(s.subTasks["coder#1"].approval.length <= 40)
})

test("routeSubReasoning / routeSubToolCall / routeSubToolOutput 路由与合并", () => {
  const s = state()
  assert.equal(routeSubReasoning(s, "main reasoning", noop), false)
  routeSubReasoning(s, "coder#1/think a", noop)
  routeSubReasoning(s, "coder#1/think b", noop)
  routeSubToolCall(s, "coder#1/bash", { command: "npm  test" }, noop)
  routeSubToolOutput(s, "coder#1/bash", { kind: "text", text: "line1\nline2" }, noop)
  routeSubToolOutput(s, "coder#1/bash", { kind: "text", text: "line3" }, noop)
  const sub = s.subTasks["coder#1"]
  const thinks = sub.blocks.filter((b) => b.kind === "think")
  assert.equal(thinks.length, 1, "连续 think 合并")
  assert.equal(thinks[0].text, "think athink b")
  const tools = sub.blocks.filter((b) => b.kind === "tool")
  assert.equal(tools.length, 1, "tool call 标题块与后续同名输出合并为单块（标题+输出一体）")
  assert.ok(tools[0].text.startsWith("❯ bash") && tools[0].text.includes("npm test"))
  assert.ok(tools[0].text.includes("line1\nline2\nline3\n"))
  assert.equal(sub.currentTool, "bash")
})

test("finishSubTask: 最早运行的同角色子代理标记 done + lastError + epoch 递增", () => {
  const s = state()
  routeSubToken(s, "coder#1/a", noop)
  routeSubToken(s, "coder#2/b", noop)
  s.subTasks["coder#1"].started = 1000
  s.subTasks["coder#2"].started = 2000
  const epochBefore = s.subTasks["coder#1"].blockEpoch
  finishSubTask(s, SUB_BLOCK_LINE_LIMIT ? ["coder"] : [], "turn cap reached — work may be partial")
  const done1 = s.subTasks["coder#1"]
  assert.equal(done1.done, true, "最早启动的先 done")
  assert.equal(done1.lastError, "turn cap reached — work may be partial")
  assert.ok(done1.doneAt >= done1.started)
  assert.notEqual(done1.blockEpoch, epochBefore, "fold 签名失效（epoch bump）")
  assert.equal(s.subTasks["coder#2"].done, false, "其余不受影响")
})

test("N2: 环形上限经路由同样生效（跨回调类型）", () => {
  const s = state()
  for (let i = 1; i <= 600; i++) routeSubToolOutput(s, "coder#1/bash", { kind: "text", text: `row ${i}\n` }, noop)
  const sub = s.subTasks["coder#1"]
  const total = sub.blocks.reduce((n, b) => n + b.text.split("\n").length, 0)
  assert.ok(total <= SUB_BLOCK_LINE_LIMIT + 1, `≤ 501（500 + meta 标记行），实际 ${total}`)
})
