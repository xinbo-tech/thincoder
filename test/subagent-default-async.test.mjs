/**
 * subagent-default-async.test.mjs — AGENT-LOOP.md §18 D-E1a（2026-09-06 需求池 R12）：
 * depth-0 spawn 缺省 async（全角色）/ depth>0 缺省 sync（强制同步现状保留）。
 *
 * 用例映射：T-A1 depth-0 缺省 async / T-A2 async:false 逃逸口 / T-A4 depth>0 async 拒绝 /
 * T-A4b depth>0 缺省同步不拒绝（公式 asyncArg ?? (depth === 0)）。
 * T-A3（eng-coder 缺省 async 回归）由 eng-delivery.test.mjs T-E1/T-E17 原样守住（不改语义）；
 * T-A5（async settle → digest 注入拉回——§17 挂起回归）由 suspension-core.test.mjs T-E9/E10 守住。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { mockLLM } from "./helpers/mock-llm.mjs"
import { LONG_REPORT } from "./helpers/long-report.mjs"

test("T-A1: depth-0 spawn explore 缺省（不传 async）→ 返回 {id, running} 不阻塞；后台 settle 落报告", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const { server, port } = await mockLLM([{ content: LONG_REPORT("A1 探索"), delay: 300 }])
  const cwd = mkdtempSync(join(tmpdir(), "cli-a1-"))
  try {
    const agent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [], config: { agent: {} }, cwd,
    })
    const out = JSON.parse(String(await subagentTool.execute(
      { task: "探索仓库", role: "explore" }, // 不传 async —— R12 缺省 async
      { agent, cwd, callbacks: {}, depth: 0 },
    )))
    assert.equal(out.status, "running", "T-A1: 缺省 async → 立即返回 running")
    assert.ok(out.id && out.role === "explore", "T-A1: id+role 随返回")
    const entry = agent._asyncSubagents.get(String(out.id))
    assert.ok(entry, "T-A1: _asyncSubagents 登记")
    assert.notEqual(entry.done, true, "T-A1: 返回时未 settle——确定性不阻塞证据（替代墙钟断言，R4）")
    await entry.promise
    assert.equal(entry.done, true, "T-A1: 后台 settle")
    assert.ok(String(entry.report).includes("A1 探索 report"), "T-A1: 报告落 entry（自动通道送达基础）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-A2: depth-0 spawn explore + async:false → 同步阻塞返回报告（逃逸口保留）；不进 async 池", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const { server, port } = await mockLLM([{ content: LONG_REPORT("A2 同步") }])
  const cwd = mkdtempSync(join(tmpdir(), "cli-a2-"))
  try {
    const agent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [], config: { agent: {} }, cwd,
    })
    const r = String(await subagentTool.execute(
      { task: "同步探索", role: "explore", async: false },
      { agent, cwd, callbacks: {}, depth: 0 },
    ))
    assert.ok(r.includes("A2 同步 report"), "T-A2: async:false → 阻塞返回报告")
    assert.equal(agent._asyncSubagents?.size ?? 0, 0, "T-A2: 同步 spawn 不进 async 池")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-A4: depth>0 spawn async → 机械拒绝（强制 sync 不变）", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const agent = createAgent({
    provider: { baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m" },
    tools: [], config: { agent: {} }, cwd: process.cwd(),
  })
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "explore", async: true }, { agent, cwd: process.cwd(), callbacks: {}, depth: 1 }),
    /async spawn only available at the top level/,
    "T-A4: depth>0 async 拒绝",
  )
})

test("T-A4b: depth>0 spawn 缺省（不传 async）→ 同步执行、不拒绝（深度门控 asyncArg ?? (depth === 0)）", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const { server, port } = await mockLLM([{ content: LONG_REPORT("A4b 内部同步") }])
  const cwd = mkdtempSync(join(tmpdir(), "cli-a4b-"))
  try {
    const agent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [], config: { agent: {} }, cwd,
    })
    const r = String(await subagentTool.execute(
      { task: "内部探索", role: "explore" }, // depth>0 缺省 → sync（eng-coder 内部审计 spawn 同路径不破坏）
      { agent, cwd, callbacks: {}, depth: 1 },
    ))
    assert.ok(r.includes("A4b 内部同步 report"), "T-A4b: depth>0 缺省同步执行、不拒绝")
    assert.equal(agent._asyncSubagents?.size ?? 0, 0, "T-A4b: 不进 async 池")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("R12 schema 锚: async 描述 = 深度门控措辞；角色级默认零残留；D-CH2 收尾锚尾部同步修订", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const d = subagentTool.parameters.properties.async.description
  assert.ok(d.includes("Default: depth-0 → true (async"), "async 描述 = depth-0 缺省 async（§18 D-E1a）")
  assert.ok(d.includes("depth>0 → sync (forced)"), "async 描述 = depth>0 强制 sync")
  assert.ok(d.includes("async:false"), "async:false 逃逸口在描述中")
  const td = subagentTool.description
  assert.ok(td.includes("The DEFAULT is depth-gated"), "工具描述 Async spawn 段 = 深度门控默认")
  assert.ok(!td.includes("The DEFAULT is role-level"), "角色级默认措辞零残留（R12 supersede）")
  assert.ok(!td.includes("every other role defaults to blocking"), "其余角色默认阻塞措辞零残留")
  assert.ok(
    td.includes("pass `async:false` (at depth 0 every role defaults to async — async:false is the only way to block; depth>0 is always sync)."),
    "D-CH2 收尾锚尾部同步修订（fail-when-unchanged——同批锚迁移）",
  )
})
