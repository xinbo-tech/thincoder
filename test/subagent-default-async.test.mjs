/**
 * subagent-default-async.test.mjs — AGENT-LOOP.md §18 D-E1a（2026-09-06 需求池 R12，
 * VS Code 侧——CLI subagent-default-async.test.mjs 同构）：
 * depth-0 spawn 缺省 async（全角色）/ depth>0 缺省 sync（强制同步现状保留）。
 *
 * 用例映射：T-A1 depth-0 缺省 async / T-A2 async:false 逃逸口 / T-A4 depth>0 async 拒绝 /
 * T-A4b depth>0 缺省同步不拒绝（公式 asyncArg ?? (depth === 0)）。
 * T-A3（eng-coder 缺省 async 回归）由 eng-delivery.test.mjs T-E1/T-E17 原样守住；
 * T-A5（async settle → digest 注入拉回——§17 挂起回归）由 suspension 系列测试守住。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createServer } from "node:http"

/** 单发 SSE server：每个 LLM 请求一律立即以 `text` 完成（无工具调用）。 */
function oneShotServer(text) {
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: text } }] })}\n\n` +
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
        "data: [DONE]\n\n",
      )
    })
  })
  return { server }
}

/** 慢速 SSE server：delay ms 后才完成（T-A1 不阻塞时序断言用）。 */
function slowServer(text, delay) {
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      setTimeout(() => {
        res.writeHead(200, { "Content-Type": "text/event-stream" })
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: text } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          "data: [DONE]\n\n",
        )
      }, delay)
    })
  })
  return { server }
}

function asyncParent(port, extra = {}) {
  return {
    _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
    config: {
      providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
      agent: { subagentTurns: 5, engineering: false },
    },
    _subIdCounter: 0,
    _touchedFiles: [],
    _asyncSubagents: new Map(),
    ...extra,
  }
}

const asyncCtx = (parent, cwd, extra = {}) => ({ agent: parent, cwd, callbacks: {}, ...extra })
const spawnJson = (raw) => JSON.parse(String(raw))

test("T-A1: depth-0 spawn explore 缺省（不传 async）→ 返回 {id, running} 不阻塞；后台 settle 落报告", async () => {
  const { server } = slowServer("A1 探索报告 " + "x".repeat(220), 300)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-a1-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const r = spawnJson(await subagentTool.execute({ task: "探索仓库", role: "explore" }, asyncCtx(parent, cwd))) // 不传 async —— R12 缺省 async
    assert.equal(r.status, "running", "T-A1: 缺省 async → 立即返回 running")
    assert.ok(r.id && r.role === "explore", "T-A1: id+role 随返回")
    const entry = parent._asyncSubagents.get(r.id)
    assert.ok(entry, "T-A1: _asyncSubagents 登记")
    assert.notEqual(entry.done, true, "T-A1: 返回时未 settle——确定性不阻塞证据（替代墙钟断言，R4）")
    await entry.settled
    assert.ok(entry.done, "T-A1: 后台 settle")
    assert.ok(String(entry.report).includes("A1 探索报告"), "T-A1: 报告落 entry")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-A2: depth-0 spawn explore + async:false → 同步阻塞返回报告（逃逸口保留）；不进 async 池", async () => {
  const { server } = oneShotServer("A2 同步报告 " + "x".repeat(220))
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-a2-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const r = String(await subagentTool.execute({ task: "同步探索", role: "explore", async: false }, asyncCtx(parent, cwd)))
    assert.ok(r.includes("Subagent (explore) completed"), "T-A2: async:false → 阻塞返回报告")
    assert.ok(r.includes("A2 同步报告"), "T-A2: 报告内容在")
    assert.equal(parent._asyncSubagents.size, 0, "T-A2: 同步 spawn 不进 async 池")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-A4: depth>0 spawn async → 机械拒绝（强制 sync 不变）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const parent = asyncParent(0)
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "explore", async: true }, asyncCtx(parent, process.cwd(), { depth: 1 })),
    /async spawn only available at the top level/,
    "T-A4: depth>0 async 拒绝",
  )
})

test("T-A4b: depth>0 spawn 缺省（不传 async）→ 同步执行、不拒绝（深度门控 asyncArg ?? (depth === 0)）", async () => {
  const { server } = oneShotServer("A4b 内部同步报告 " + "x".repeat(220))
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-a4b-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const r = String(await subagentTool.execute(
      { task: "内部探索", role: "explore" }, // depth>0 缺省 → sync（eng-coder 内部审计 spawn 同路径不破坏）
      asyncCtx(parent, cwd, { depth: 1 }),
    ))
    assert.ok(r.includes("Subagent (explore) completed"), "T-A4b: depth>0 缺省同步执行、不拒绝")
    assert.equal(parent._asyncSubagents.size, 0, "T-A4b: 不进 async 池")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("R12 schema 锚 (vscode): async 描述 = 深度门控措辞；角色级默认零残留；D-CH2 收尾锚尾部同步修订", async () => {
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
