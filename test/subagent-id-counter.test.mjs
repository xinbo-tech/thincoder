/**
 * subagent-id-counter.test.mjs — 子代理 id 计数器载体（SUBAGENT-ID-COUNTER-AGENT，
 * 2026-09-09）：设计用例表逐条锁定真实 spawn 链路——分配点（buildSpawnChild async
 * 分支 nextSubagentId）与消费点（executeAsyncSpawn id 直读 counter）同链同号；
 * 压缩替换 history 数组后链路续号递增（载体= agent 本体 _subAgentCounter——跨
 * run/跨压缩存活）。池活续号/进程重启边界由 subagent-scheduler.test.mjs 同批
 * 覆盖（本文件补链路形态）。纯单元：池 other 域 4 槽占满 → 新 spawn 一律 queued
 * （不触发 entry.start/子代理 runAgent——零网络零异步残留）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { buildSpawnChild } from "../src/agent-tools/subagent-spawn.mjs"
import { executeAsyncSpawn } from "../src/agent-tools/subagent-run.mjs"

/** 最小 parent：other 域 4 个 running 占满槽——链路 spawn 入队（queued——不启动）。 */
const spawnAgent = () => ({
  cwd: "C:/w",
  provider: { name: "p", model: "m" },
  config: { agent: {} },
  tools: [{ name: "read", readonly: true }],
  _asyncSubagents: new Map(
    [1, 2, 3, 4].map((i) => [String(i), { id: i, role: "explore", status: "running", _pool: "other" }]),
  ),
})

const chainSpawn = (p, task = "t") => {
  const built = buildSpawnChild(p, { agent: p }, { task }, "explore", true, [], [], null) // engAuditAttempt=null（非 eng-coder——gateEngCoderSpawn 返回形态）
  const ack = JSON.parse(executeAsyncSpawn(p, {}, "explore", {}, built.child, task, built.childOpts, built.childRunOpts, built.relayPrefix, built.childProvider, [], []))
  return { built, ack }
}

test("ID-COUNTER 链路：relay 前缀与 ack id 同号——counter 缺省时池活续号兜底（4 → 5）", () => {
  const p = spawnAgent() // counter 缺省（丢失面）——nextSubagentId 从池 max 4 续 5
  const { built, ack } = chainSpawn(p)
  assert.equal(built.relayPrefix, "explore#5/", "分配点（前缀）取号 5")
  assert.equal(ack.id, "5", "消费点（executeAsyncSpawn）同号——分配/消费无错位")
  assert.equal(ack.status, "queued", "池满入队——entry.start 未触发（纯单元安全）")
  assert.equal(p._subAgentCounter, 5, "首取号初始化：counter 同步回写本体")
})

test("ID-COUNTER 链路：压缩替换 history 数组后 spawn id 仍递增（agent 本体计数器存活）", () => {
  const p = spawnAgent()
  chainSpawn(p) // #5
  p.history = [{ role: "user", content: "compacted" }] // 模拟压缩：history 数组被整体替换
  const { built, ack } = chainSpawn(p)
  assert.equal(built.relayPrefix, "explore#6/", "压缩后 relay 前缀续 6（本体计数器不随 history 丢）")
  assert.equal(ack.id, "6", "压缩后链路取号 6")
  assert.equal(p._subAgentCounter, 6)
})
