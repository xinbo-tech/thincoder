/**
 * advisor-description.test.mjs — 模型可见文案去数字化（POOL-CONFIG-UNIFIED F-6/AC-6，
 * 2026-09-09）：advisor 工具描述无死数字（旧 "at most 2 reviews run in parallel"——
 * 池默认已 2 → 4）——活引用配置键 agent.poolLimits.advisor（可配——默认 4——拒文案
 * 报当前生效上限）。纯断言：import 无真实 config 读（描述为模块静态文本——启动后
 * 运行中 /config 变更由 launch 侧拒文案如实报值——subagent 描述同款先例）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { advisorTool } from "../src/agent-tools/advisor.mjs"

test("F-6 描述无死数字——活引用 agent.poolLimits.advisor + 默认 4", () => {
  const d = advisorTool.description
  assert.ok(!d.includes("at most 2 reviews"), "旧死数字 'at most 2 reviews' 已删除")
  assert.ok(!/pool limit 2/.test(d), "无 'pool limit 2' 残留")
  assert.ok(d.includes("agent.poolLimits.advisor"), "活引用配置键（可配）")
  assert.ok(d.includes("default 4"), "默认值 4 明示（与三池默认一致）")
  assert.ok(d.includes("§11.2"), "锚 §11.2（旧 §24 已更新）")
})
