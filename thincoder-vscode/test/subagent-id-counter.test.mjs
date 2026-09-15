/**
 * subagent-id-counter.test.mjs — SUBAGENT-ID-COUNTER-AGENT（2026-09-09）VSC 端。
 * W13（2026-09-15）：计数器单源 = 核 `nextSubagentId`（`@thincoder/core/agent-tools/subagent-scheduler.mjs`
 * ——原端侧镜像同机制；载体字段 = 核名 `_subAgentCounter`，夹具随改指同步）。
 * nextSubagentId 计数器载体 = agent 本体（设计 F-1）——
 * history 线随压缩重建/会话恢复换数组不再丢计数——spawn id 跨线持续递增；
 * poolMax 兜底保留（两池最大 id 续号——池活续号现行为）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { nextSubagentId } from "@thincoder/core/agent-tools/subagent-scheduler.mjs"

/** 最小 parent 形态（agent 本体 + 双池字段——nextSubagentId 仅触达这些）。 */
const mkParent = () => ({
  _asyncSubagents: new Map(),
  _asyncAdvisors: new Map(),
  history: [],
})

test("压缩替换 history 数组后 spawn id 仍递增（计数器挂 agent 本体——F-1 主用例）", () => {
  const parent = mkParent()
  assert.equal(nextSubagentId(parent), 1)
  assert.equal(nextSubagentId(parent), 2)
  // 压缩/会话恢复：history 线整体换数组——旧载体形态下 expando 计数在此丢失
  parent.history = [{ role: "user", content: "[compacted]" }]
  assert.equal(nextSubagentId(parent), 3)
  assert.equal(parent._subAgentCounter, 3)
})

test("计数器不在 history expando 上（载体迁移断言——AC-1 行为面）", () => {
  const parent = mkParent()
  nextSubagentId(parent)
  assert.equal(parent.history._subAgentCounter, undefined)
  assert.equal(parent._subAgentCounter, 1)
})

test("池活续号：subagent/advisor 两池最大 id 兜底（现行为保持）", () => {
  const parent = mkParent()
  parent._asyncSubagents.set("7", { id: 7 }) // W13 键形单源：池键恒 String(id)
  assert.equal(nextSubagentId(parent), 8)
  parent._asyncAdvisors.set("9", { id: 9 })
  assert.equal(nextSubagentId(parent), 10)
  // 计数器同步到 next——此后仅靠本体继续递增
  assert.equal(parent._subAgentCounter, 10)
})

test("poolMax 兜底优先级：counter 与池内最大 id 取大 + 1", () => {
  const parent = mkParent()
  parent._subAgentCounter = 20
  parent._asyncSubagents.set("30", { id: 30 })
  assert.equal(nextSubagentId(parent), 31)
  assert.equal(parent._subAgentCounter, 31)
  // 池清空后计数器仍兜底——不复用
  parent._asyncSubagents.clear()
  assert.equal(nextSubagentId(parent), 32)
})
