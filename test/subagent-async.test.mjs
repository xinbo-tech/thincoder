/**
 * subagent-async.test.mjs — async subagent pool — spawn/check/status/cancel/queue mechanics / §15 §17 §19.5 §19.5.6 (T1-T16, T5/T5b/T8, T-M2..M10 + T-M18..M27 动作族, T-SF).
 *
 * Split from test/subagent.test.mjs (AGENT-LOOP.md §18.14/§18.14.1 D-T1.1 domain rule —
 * blocks moved verbatim; test names/semantics unchanged).
 */

import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative } from "node:path"
import { createServer } from "node:http"

/** Fake SSE LLM: the first `walls` calls demand a read tool (loop), then it answers. */
function wallServer(walls) {
  const calls = { n: 0 }
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      calls.n++
      const frame = calls.n <= walls
        ? { choices: [{ index: 0, finish_reason: "tool_calls", delta: { content: "", tool_calls: [{ index: 0, id: "t1", type: "function", function: { name: "read", arguments: JSON.stringify({ path: "x" }) } }] } }] }
        : { choices: [{ index: 0, finish_reason: "stop", delta: { content: "child done" } }] }
      res.end(`data: ${JSON.stringify(frame)}\n\ndata: [DONE]\n\n`)
    })
  })
  return { server, calls }
}

async function runChild(parent, walls, onQuestion) {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  const ctx = { agent: parent, cwd, callbacks: { onQuestion } }
  const r = String(await subagentTool.execute({ task: "loop until the cap", role: "coder" }, ctx))
  rmSync(cwd, { recursive: true, force: true })
  return r
}

/** Real unsigned token with a fixed uuid+expiry (2026-09-06 设计 B — token = 无签名流程凭证
 *  uuid:expiresAt; HMAC 防伪层已删——测试辅助随签名路径一并退役), minted at runtime —
 *  TTL'd tokens must never be baked into test files (expired-fixture lesson 2026-08-31). */
async function unsignedToken(uuid, expiresAt) {
  return `${uuid}:${expiresAt}`
}

/** 按任务文本响应的 async 子代理 mock：fast 立即完成；slow/queued-* 延迟完成；其他 "child done"。 */
function asyncChildServer(delayMs = 0) {
  const calls = { n: 0 }
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      calls.n++
      const isSlow = /slow|queued/.test(body)
      const send = () => {
        const content = isSlow ? `slow result ${calls.n}` : `fast result ${calls.n}`
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          "data: [DONE]\n\n"
        )
      }
      if (isSlow && delayMs > 0) setTimeout(send, delayMs)
      else send()
    })
  })
  return { server, calls }
}

function asyncParent(port, extra = {}) {
  const base = {
    _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
    config: {
      providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
      agent: { subagentTurns: 5, engineering: false },
    },
    _subIdCounter: 0,
    _touchedFiles: [],
    _asyncSubagents: new Map(),
    _asyncCheckN: 0,
  }
  return { ...base, ...extra }
}

function asyncCtx(parent, cwd, extra = {}) {
  return { agent: parent, cwd, callbacks: {}, ...extra }
}

/** Async spawn results are JSON STRINGS (tool-result contract — §18 code review #1);
 *  parse for shape assertions. */
const spawnJson = (raw) => JSON.parse(String(raw))

test("T1/T2 (vscode): async spawn 立即返回 {id, status:running}，不等待子代理完成；主会话可继续", async () => {
  const { server } = await asyncChildServer(400)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const t0 = Date.now()
    const r = spawnJson(await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctx))
    const elapsed = Date.now() - t0
    assert.equal(r.status, "running", "async spawn 立即返回 running（不 await 报告）")
    assert.equal(r.id, 1)
    assert.ok(elapsed < 300, `spawn 返回早于子代理完成（elapsed=${elapsed}ms < 400ms 延迟）`)
    const entry = parent._asyncSubagents.get(1)
    assert.ok(entry && entry.status === "running", "_asyncSubagents 有该项且 running")
    // 子代理后台照常跑完（T1 补：settle 后落 report）
    await entry.settled
    assert.ok(entry.done && entry.report.includes("slow result"), "后台完成并落 report")
    // T2：async spawn 后同一回合再做只读操作不被阻塞（execute 已返回，直接再调一个只读工具）
    const again = spawnJson(await subagentTool.execute({ task: "slow task 2", role: "coder", async: true }, ctx))
    assert.equal(again.status, "running", "同回合第二个 async spawn 照常立即返回")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T3 (vscode): 完成顺序——快先慢后，arrival order 消费；全消费 → {done:true}", async () => {
  const { server } = await asyncChildServer(300)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const fast = spawnJson(await subagentTool.execute({ task: "fast task", role: "coder", async: true }, ctx))
    const slow = spawnJson(await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctx))
    assert.equal(fast.status, "running")
    assert.equal(slow.status, "running")
    // 无 id 检查：先完成先返回（快）
    const first = JSON.parse(await subagentTool.execute({ action: "check", n: 1 }, ctx))
    assert.equal(first.id, fast.id, "先返回快的")
    assert.equal(first.status, "done")
    assert.match(first.report, /fast result/)
    // 第二次：慢的
    const second = JSON.parse(await subagentTool.execute({ action: "check", n: 2 }, ctx))
    assert.equal(second.id, slow.id, "第二次返回慢的")
    assert.match(second.report, /slow result/)
    // 全消费 → done:true
    const done = JSON.parse(await subagentTool.execute({ action: "check", n: 3 }, ctx))
    assert.deepEqual(done, { done: true })
    assert.equal(parent._asyncSubagents.size, 0, "消费后注册表清空")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T4 (vscode): 带 id 等待特定子代理——阻塞到该 id 完成返回其报告", async () => {
  const { server } = await asyncChildServer(200)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctx)
    await subagentTool.execute({ task: "slow task 2", role: "coder", async: true }, ctx)
    const r = JSON.parse(await subagentTool.execute({ action: "check", id: 2, n: 1 }, ctx))
    assert.equal(r.id, 2, "按 id 取回指定子代理")
    assert.equal(r.status, "done")
    assert.match(r.report, /slow result/)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T6/T10/T11 (vscode): 槽位队列——超限入队 + 位置递增 + 腾槽自动补位", async () => {
  const { server } = await asyncChildServer(250)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const spawned = []
    for (let i = 1; i <= 4; i++) {
      const r = spawnJson(await subagentTool.execute({ task: `queued task ${i}`, role: "coder", async: true }, ctx))
      spawned.push(r)
      assert.equal(r.status, "running", `第 ${i} 个 running`)
    }
    const fifth = spawnJson(await subagentTool.execute({ task: "queued task 5", role: "coder", async: true }, ctx))
    assert.equal(fifth.status, "queued", "第 5 个入队（不拒绝）")
    assert.equal(fifth.position, 1, "position=1")
    const sixth = spawnJson(await subagentTool.execute({ task: "queued task 6", role: "coder", async: true }, ctx))
    assert.equal(sixth.status, "queued")
    assert.equal(sixth.position, 2, "position 递增（6→2）")
    assert.equal(parent._asyncSubagents.get(fifth.id).status, "queued")
    // T10：任一 running settle → 队列头部自动启动（无需模型再 spawn）
    await parent._asyncSubagents.get(1).settled
    // 等补位逻辑跑完（onSettled 微任务链）
    for (let i = 0; i < 50 && parent._asyncSubagents.get(fifth.id)?.status === "queued"; i++) {
      await new Promise((r) => setTimeout(r, 20))
    }
    assert.notEqual(parent._asyncSubagents.get(fifth.id).status, "queued", "running settle 后队列头部自动启动（status→running）")
    // 全部最终完成
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.settled))
    assert.ok([...parent._asyncSubagents.values()].every((e) => e.done), "全部完成")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T12/T13/T14 (vscode): check 错误路径——未知 id / n 超限 / 乱序重复 n", async () => {
  const { server } = await asyncChildServer()
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    // T12：未知 id
    const unknown = JSON.parse(await subagentTool.execute({ action: "check", id: 999, n: 1 }, ctx))
    assert.equal(unknown.status, "error")
    assert.match(unknown.error, /unknown async subagent id: 999/)
    // T14：乱序/重复 n——先消费一个，再传 n=1（非 lastN+1）
    await subagentTool.execute({ task: "fast task", role: "coder", async: true }, ctx)
    await subagentTool.execute({ task: "fast task 2", role: "coder", async: true }, ctx)
    const first = JSON.parse(await subagentTool.execute({ action: "check", n: 1 }, ctx))
    assert.equal(first.status, "done")
    const dup = JSON.parse(await subagentTool.execute({ action: "check", n: 1 }, ctx))
    assert.equal(dup.status, "error")
    assert.equal(dup.error, "invalid read counter — pass n = lastN+1")
    const skip = JSON.parse(await subagentTool.execute({ action: "check", n: 3 }, ctx))
    assert.equal(skip.status, "error", "跳号 n=3（lastN=1）→ 拒绝")
    // T13：n 超限（> MAX_ASYNC_CHECKS=3）
    const over = JSON.parse(await subagentTool.execute({ action: "check", n: 4 }, ctx))
    assert.equal(over.status, "error")
    assert.equal(over.error, "check limit exceeded — use turn-end auto-wait for the rest")
    // 已消费 id → unknown（T12 补）
    const consumed = JSON.parse(await subagentTool.execute({ action: "check", id: first.id, n: 2 }, ctx))
    assert.equal(consumed.status, "error", "已消费 id 视为 unknown")
    assert.match(consumed.error, /unknown async subagent id/)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("depth>0 传 async → 报错拒绝（§15 D-A3：async 仅顶层可用）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const parent = asyncParent(1)
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "coder", async: true }, asyncCtx(parent, process.cwd(), { depth: 1 })),
    /async spawn only available at the top level/,
  )
})

test("T5 (vscode, §17 D-S1 superseded): 回合收尾——回合内已 settle 的 async 收已完成直注入 + 注册表清空（collectSettledAsync 语义；不再 allSettled 等待——未完成项移交挂起会话，见 suspension.test.mjs T-S1）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  const { runAgent } = await import("../src/agent.mjs")
  let parentCalls = 0
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      const hasToolCalls = body.includes('"tool_calls"') // 父回合 2 的历史含工具调用；子请求与父回合 1 无
      if (!hasToolCalls && body.includes("child job")) {
        // 子代理请求：直接完成（与父回合 2 到达顺序无关——按体区分）
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "child report" } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          "data: [DONE]\n\n"
        )
        return
      }
      parentCalls++
      if (parentCalls === 1) {
        // 父回合 1：spawn async 子代理
        const frame = { choices: [{ index: 0, finish_reason: "tool_calls", delta: { content: "", tool_calls: [{ index: 0, id: "t1", type: "function", function: { name: "subagent", arguments: JSON.stringify({ task: "child job", role: "coder", async: true }) } }] } }] }
        res.end(`data: ${JSON.stringify(frame)}\n\ndata: [DONE]\n\n`)
      } else {
        // 父回合 2（最终回复）延迟 400ms：无论子代理请求是否晚于本请求到达
        // （prepareRun 竞态），子代理 settle（即刻响应）都先于父回合收尾——
        // collectSettledAsync 直注入路径的确定断言（CLI T5 同款手法）。
        setTimeout(() => {
          res.end(
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "final" } }] })}\n\n` +
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
            "data: [DONE]\n\n"
          )
        }, 400)
      }
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  try {
    const history = []
    const fullHistory = []
    const out = await runAgent(
      { baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
      cwd, "spawn and finish", {}, undefined, true,
      { history, fullHistory },
    )
    assert.equal(out, "final")
    const injected = history.filter((m) => typeof m.content === "string" && m.content.includes("async subagent #1 (coder) finished"))
    assert.equal(injected.length, 1, "收尾注入 reminder")
    assert.ok(injected[0].content.includes("child report"), "报告文本注入（XML 转义后仍在）")
    // pushReal 双线同步：真实消息 + 收尾注入都进人读线（机读线另有 system/time 注入，天然更长）
    assert.equal(fullHistory.filter((m) => typeof m.content === "string" && m.content.includes("async subagent #1")).length, 1, "人读线同步注入")
    assert.equal(history._asyncSubagents, undefined, "收尾后注册表清空（depth-0 载体释放——已注入项移出池）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T5b (vscode, §17.5): collectSettledAsync suspDriven 驱动分支——驱动回合尾不直注入：settled 留池 → sweep → 消化轮 run 首行注入（round1 #2：无驱动兜底 = T5 直注入）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  const { runAgent } = await import("../src/agent.mjs")
  let parentCalls = 0
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      const hasToolCalls = body.includes('"tool_calls"') // 父回合 2/消化轮的历史含工具调用；子请求与父回合 1 无
      if (!hasToolCalls && body.includes("child job")) {
        // 子代理请求：直接完成（先于父回合收尾）
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "child report" } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          "data: [DONE]\n\n"
        )
        return
      }
      if (body.includes("async subagent #1 (coder) finished")) {
        // 消化轮（auto-turn）：pending 已在其 run 首行注入——返回消化总结
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "digest summary" } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          "data: [DONE]\n\n"
        )
        return
      }
      parentCalls++
      if (parentCalls === 1) {
        // 父回合 1：spawn async 子代理
        const frame = { choices: [{ index: 0, finish_reason: "tool_calls", delta: { content: "", tool_calls: [{ index: 0, id: "t1", type: "function", function: { name: "subagent", arguments: JSON.stringify({ task: "child job", role: "coder", async: true }) } }] } }] }
        res.end(`data: ${JSON.stringify(frame)}\n\ndata: [DONE]\n\n`)
      } else {
        setTimeout(() => {
          res.end(
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "final" } }] })}\n\n` +
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
            "data: [DONE]\n\n"
          )
        }, 400)
      }
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  try {
    const history = []
    const fullHistory = []
    const out = await runAgent(
      { baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
      cwd, "spawn and finish", {}, undefined, true,
      { history, fullHistory, suspDriven: true }, // §17.5: 面板驱动（回合尾 collect 不排空）
    )
    assert.equal(out, "final")
    assert.ok(!history.some((m) => typeof m.content === "string" && m.content.includes("async subagent #1 (coder) finished")),
      "驱动回合尾不直注入（settled 留池——等待挂起消化轮）")
    assert.ok(history._asyncSubagents?.size === 1, "settled 条目留池（settled not consumed）")
    const entry = [...history._asyncSubagents.values()][0]
    assert.equal(entry.done, true, "条目已 settle 未消费")
    // 挂起会话首轮 sweep（suspension.mjs sweepSettledToPending 同语义）→ pending
    const pend = (history._pendingAsyncResults ??= [])
    for (const e of [...history._asyncSubagents.values()]) {
      if (e.done && !e._inPending) {
        e._inPending = true
        pend.push(e)
        history._asyncSubagents.delete(e.id)
      }
    }
    // 消化轮（auto-turn）：run 首行统一注入 pending
    const digestOut = await runAgent(
      { baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
      cwd, "", {}, undefined, true,
      { history, fullHistory, autoTurn: true, suspDriven: true },
    )
    assert.equal(digestOut, "digest summary")
    const injected = history.filter((m) => typeof m.content === "string" && m.content.includes("async subagent #1 (coder) finished"))
    assert.equal(injected.length, 1, "消化轮 run 首行注入 reminder")
    assert.ok(injected[0].content.includes("child report"), "报告文本注入（XML 转义后仍在）")
    assert.equal(history._pendingAsyncResults?.length ?? 0, 0, "pending 消费清空")
    assert.equal(history._asyncSubagents, undefined, "消化轮收尾注册表清空（depth-0 载体释放）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("D-A3 (vscode): async 子代理 settle 即发 onSubagent done 通知——完成即冻结信号，不等到回合收尾", async () => {
  const { server } = await asyncChildServer(200)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const notes = []
    const ctx = asyncCtx(parent, cwd, { callbacks: { onSubagent: (info) => notes.push(info) } })
    const r = spawnJson(await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctx))
    assert.equal(r.status, "running")
    assert.ok(!notes.some((n) => n.status === "done"), "spawn 返回时尚无 done 通知")
    const entry = parent._asyncSubagents.get(r.id)
    await entry.settled
    // settle 即发 done（webview 区块完成态信号，runChild 完成路径——无需回合收尾）
    const doneNote = notes.find((n) => n.id === r.id && n.status === "done")
    assert.ok(doneNote, "settle 时收到 onSubagent done 通知（完成即冻结）")
    assert.equal(doneNote.role, "coder")
    // 收尾注入仍在（既有 T5 已断言 reminder 注入 + 注册表清空——本用例只验证通知时机）
    assert.equal(entry.done, true)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T8 (vscode): 中断——signal aborted → 注册表立即清空、不注入陈旧错误", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "tc-sub-"))
  const { runAgent } = await import("../src/agent.mjs")
  const server = createServer(() => {})
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  try {
    const history = []
    // 预置一个未完成的 async 项（模拟上一轮残留）
    const entry = { id: 1, role: "coder", status: "running", report: null, error: null, done: false, settled: new Promise(() => {}) }
    const map = new Map([[1, entry]])
    history._asyncSubagents = map
    const ctrl = new AbortController()
    ctrl.abort()
    await assert.rejects(
      runAgent(
        { baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
        cwd, "x", {}, ctrl.signal, true, { history, fullHistory: [] },
      ),
      (e) => e?.name === "AbortError",
      "已 abort 的 signal → runAgent 抛 AbortError",
    )
    assert.equal(map.size, 0, "中断后注册表立即清空（不注入陈旧错误）")
    assert.ok(!history.some((m) => typeof m.content === "string" && m.content.includes("async subagent")), "无注入")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

/** 工程模式父会话 fake（eng-coder spawn 需槽位 + 无签名 token——2026-09-06 设计 B：uuid:expiresAt；async 池字段齐备）。 */
function engParent(port, token, extra = {}) {
  return {
    _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
    config: {
      providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
      agent: { subagentTurns: 5, engineering: true },
    },
    _subIdCounter: 0,
    _touchedFiles: [],
    _engDesignTokens: new Map([["eng", token]]),
    _engDesignToken: token,
    _asyncSubagents: new Map(),
    _asyncCheckN: 0,
    ...extra,
  }
}

/** eng-coder 子代理上下文 fake（depth>0、_role="eng-coder"——内部 spawn 门作用对象）。 */

test("T-M2..M4 (vscode mirror): check 迁移回归——既有 subagent_check 用例以 action:'check' 全绿", async () => {
  // 迁移本身在文件上方 T3/T4/T12-14（改 action:"check" 后原样通过）——此处补一条
  // 显式的"单工具可寻址"断言：spawn 返回的 id 直接喂给同一工具的 check/status。
  const { server } = await asyncChildServer(50)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-m2-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const spawned = spawnJson(await subagentTool.execute({ task: "fast task", role: "coder", async: true }, ctx))
    const fetched = JSON.parse(await subagentTool.execute({ action: "check", id: spawned.id, n: 1 }, ctx))
    assert.equal(fetched.id, spawned.id, "同一工具的 check 动作按 spawn id 取回")
    assert.equal(fetched.status, "done")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-M5: status 指定 running id → 立即返回 running（不阻塞——主回合查进度不挂）", async () => {
  const { server } = await asyncChildServer(400)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-m5-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const spawned = spawnJson(await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctx))
    const t0 = Date.now()
    const st = JSON.parse(await subagentTool.execute({ action: "status", id: spawned.id }, ctx))
    const elapsed = Date.now() - t0
    assert.equal(st.id, spawned.id)
    assert.equal(st.role, "coder")
    assert.equal(st.status, "running")
    assert.ok(elapsed < 300, `status 不等待子代理完成（elapsed=${elapsed}ms < 400ms 延迟）`)
    // 子代理继续在后台跑完（status 不消费不取消）
    await parent._asyncSubagents.get(spawned.id).settled
    assert.equal(parent._asyncSubagents.get(spawned.id).done, true, "status 后子代理照常 settle")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-M6: status 指定 queued id → 返回 position", async () => {
  const { server } = await asyncChildServer(300)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-m6-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    for (let i = 1; i <= 4; i++) {
      await subagentTool.execute({ task: `slow task ${i}`, role: "coder", async: true }, ctx)
    }
    const fifth = spawnJson(await subagentTool.execute({ task: "slow task 5", role: "coder", async: true }, ctx))
    assert.equal(fifth.status, "queued", "第 5 个入队")
    const st = JSON.parse(await subagentTool.execute({ action: "status", id: fifth.id }, ctx))
    assert.equal(st.status, "queued")
    assert.equal(st.position, 1, "position 随返回")
    // 收尾：等全部 settle，不悬挂 server
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.settled))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-M7: status 指定 done 未取 id（回合内 settle）→ done + 未取注记——不消费（随后 check 仍可取回）", async () => {
  const { server } = await asyncChildServer(0)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-m7-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const spawned = spawnJson(await subagentTool.execute({ task: "fast task", role: "coder", async: true }, ctx))
    const entry = parent._asyncSubagents.get(spawned.id)
    await entry.settled
    assert.equal(entry.done, true, "回合内 settle——done 条目仍留池（未取）")
    const st = JSON.parse(await subagentTool.execute({ action: "status", id: spawned.id }, ctx))
    assert.equal(st.status, "done")
    assert.ok(st.note && st.note.includes("unconsumed"), "带未取注记")
    assert.ok(parent._asyncSubagents.has(spawned.id), "status 不消费——条目仍在池")
    const fetched = JSON.parse(await subagentTool.execute({ action: "check", id: spawned.id, n: 1 }, ctx))
    assert.equal(fetched.status, "done", "status 后 check 照常取回（n 从 1 开始——status 不动读数）")
    assert.match(fetched.report, /fast result/)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-M8: status 省略 id → 全部概览（running/queued/done 三类）", async () => {
  const { server } = await asyncChildServer(200)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-m8-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    // done：快任务 settle 留池（未取）；running：慢任务延迟中
    const fast = spawnJson(await subagentTool.execute({ task: "fast task", role: "coder", async: true }, ctx))
    await parent._asyncSubagents.get(fast.id).settled
    const slow = spawnJson(await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctx))
    assert.equal(slow.status, "running")
    const ov = JSON.parse(await subagentTool.execute({ action: "status" }, ctx)).overview
    assert.ok(Array.isArray(ov.running) && Array.isArray(ov.queued) && Array.isArray(ov.done), "三类数组齐备")
    assert.ok(ov.running.some((x) => x.id === slow.id), "running 列出进行中 id（结构化对象——§19.5 D-M5）")
    assert.equal(ov.running.find((x) => x.id === slow.id).role, "coder", "running 条目带 role")
    assert.ok(ov.done.some((x) => x.id === fast.id), "done 列出 settle 未取 id（结构化对象——§19.5 D-M5）")
    assert.equal(ov.done.find((x) => x.id === fast.id).role, "coder", "done 条目带 role")
    assert.equal(ov.queued.length, 0)
    // 空池概览
    const doneAll = JSON.parse(await subagentTool.execute({ action: "check", id: fast.id, n: 1 }, ctx))
    assert.equal(doneAll.status, "done")
    await parent._asyncSubagents.get(slow.id).settled
    const ov2 = JSON.parse(await subagentTool.execute({ action: "status" }, ctx)).overview
    assert.deepEqual(ov2, { running: [], queued: [], done: [{ id: slow.id, role: "coder" }] }, "empty-pool overview 形状")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-M9: status 未知 id → error（与 check 同——不消费不悬挂）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const parent = asyncParent(1)
  const ctx = asyncCtx(parent, process.cwd())
  const st = JSON.parse(await subagentTool.execute({ action: "status", id: 999 }, ctx))
  assert.equal(st.status, "error")
  assert.match(st.error, /unknown async subagent id: 999/)
  assert.equal(parent._asyncSubagents.size, 0)
})

test("T-M10: status 后接 check——n 计数不受 status 影响（只读查询零消耗零计数）", async () => {
  const { server } = await asyncChildServer(0)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-m10-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const a = spawnJson(await subagentTool.execute({ task: "fast task a", role: "coder", async: true }, ctx))
    const b = spawnJson(await subagentTool.execute({ task: "fast task b", role: "coder", async: true }, ctx))
    const first = JSON.parse(await subagentTool.execute({ action: "check", n: 1 }, ctx))
    assert.equal(first.id, a.id)
    await parent._asyncSubagents.get(b.id).settled // 确定性：b 已 settle 留池（未取）
    // 两轮 status（带 id + 概览）夹在两次 check 之间
    const st = JSON.parse(await subagentTool.execute({ action: "status", id: b.id }, ctx))
    assert.equal(st.status, "done")
    await subagentTool.execute({ action: "status" }, ctx)
    const second = JSON.parse(await subagentTool.execute({ action: "check", n: 2 }, ctx))
    assert.equal(second.id, b.id, "status 未消耗第二项、未扰乱 n 计数")
    assert.equal(parent._asyncCheckN, 2)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("advisor#1: id 分配跨 runAgent 单调——遗留 running 池项 + 新 run spawn 不复用旧 id、不覆盖池条目", async () => {
  const { server } = await asyncChildServer(300)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-id1-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    // run 1：spawn 慢 child（id 1，跑完后仍在池中未取）
    const parent1 = asyncParent(port)
    const r1 = spawnJson(await subagentTool.execute({ task: "slow task", role: "coder", async: true }, asyncCtx(parent1, cwd)))
    assert.equal(r1.id, 1)
    const entry1 = parent1._asyncSubagents.get(1)
    // run 2：新 agent 对象（per-run 重建——_subIdCounter 清零）但共享同一 history 池
    const parent2 = asyncParent(port, { _asyncSubagents: parent1._asyncSubagents })
    const r2 = spawnJson(await subagentTool.execute({ task: "slow task 2", role: "coder", async: true }, asyncCtx(parent2, cwd)))
    assert.equal(r2.id, 2, "新 run spawn 在池内遗留 id 之上续号（不复用 1）")
    assert.equal(parent1._asyncSubagents.get(1), entry1, "run-1 条目未被覆盖（同对象引用）")
    assert.equal(parent1._asyncSubagents.size, 2, "两条目共存")
    // 两个 child 各按自身 id 取回（无错指）
    await Promise.allSettled([...parent1._asyncSubagents.values()].map((e) => e.settled))
    const ctx2 = asyncCtx(parent2, cwd)
    const a = JSON.parse(await subagentTool.execute({ action: "check", id: 1, n: 1 }, ctx2))
    assert.equal(a.id, 1)
    assert.match(a.report, /slow result/)
    const b = JSON.parse(await subagentTool.execute({ action: "check", id: 2, n: 2 }, ctx2))
    assert.equal(b.id, 2)
    assert.match(b.report, /slow result/)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("advisor#1: nextSubagentId 单测——计数器 + 池内 max 双源取上界", async () => {
  const { nextSubagentId } = await import("../src/agent-tools/subagent-async.mjs")
  const parent = { _asyncSubagents: new Map() }
  assert.equal(nextSubagentId(parent), 1, "空池首号")
  assert.equal(nextSubagentId(parent), 2, "计数器续号")
  // 池内出现更高的遗留 id（跨 run 场景）→ 从池取上界
  parent._asyncSubagents.set(7, { status: "running" })
  assert.equal(nextSubagentId(parent), 8, "池内遗留 id 之上续号")
  assert.equal(nextSubagentId(parent), 9)
  // 无池（escalate-only 上下文也安全）
  assert.equal(nextSubagentId({}), 1)
})

test("advisor#3: check/status 容错字符串 id——模型原样回传工具返回的 id 不误报 unknown", async () => {
  const { server } = await asyncChildServer(0)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-idstr-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const spawned = spawnJson(await subagentTool.execute({ task: "fast task", role: "coder", async: true }, ctx))
    await parent._asyncSubagents.get(spawned.id).settled
    // status 以字符串 id 查询 → 命中（done + 未取注记）
    const st = JSON.parse(await subagentTool.execute({ action: "status", id: String(spawned.id) }, ctx))
    assert.equal(st.status, "done", "字符串 id 命中 done 条目")
    // check 以字符串 id 取回 → 命中（响应回显调用方原值——字符串进字符串出）
    const fetched = JSON.parse(await subagentTool.execute({ action: "check", id: String(spawned.id), n: 1 }, ctx))
    assert.equal(fetched.id, String(spawned.id))
    assert.equal(fetched.status, "done")
    // 非数字字符串 → 仍 unknown（不乱归一化）
    const junk = JSON.parse(await subagentTool.execute({ action: "status", id: "abc" }, ctx))
    assert.equal(junk.status, "error")
    assert.match(junk.error, /unknown async subagent id: abc/)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("advisor#2: status queued position 实时计算——腾槽补位后不再报陈旧位置", async () => {
  const { server } = await asyncChildServer(800) // 800ms 慢任务——断言窗口（fifth running 期间查 sixth queued）需盖过全量并行 CPU 负载下 status 调用耗时——150ms 曾两次全量 flake（L753 expected queued got running——fifth 在 status 调用窗口内 settle 触发 sixth 补位）
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-pos-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    for (let i = 1; i <= 4; i++) {
      await subagentTool.execute({ task: `slow task ${i}`, role: "coder", async: true }, ctx)
    }
    const fifth = spawnJson(await subagentTool.execute({ task: "slow task 5", role: "coder", async: true }, ctx))
    const sixth = spawnJson(await subagentTool.execute({ task: "slow task 6", role: "coder", async: true }, ctx))
    assert.equal(sixth.status, "queued")
    let st6 = JSON.parse(await subagentTool.execute({ action: "status", id: sixth.id }, ctx))
    assert.equal(st6.position, 2, "入队时位置 2")
    // 一个 running settle → 队列头部（5th）补位启动 → 6th 位置应实时变 1
    await parent._asyncSubagents.get(1).settled
    for (let i = 0; i < 50 && parent._asyncSubagents.get(fifth.id)?.status === "queued"; i++) {
      await new Promise((r) => setTimeout(r, 20))
    }
    assert.equal(parent._asyncSubagents.get(fifth.id).status, "running", "5th 已补位")
    st6 = JSON.parse(await subagentTool.execute({ action: "status", id: sixth.id }, ctx))
    assert.equal(st6.status, "queued")
    assert.equal(st6.position, 1, "补位后 position 实时更新为 1（非陈旧快照 2）")
    const ov = JSON.parse(await subagentTool.execute({ action: "status" }, ctx)).overview
    assert.deepEqual(ov.queued, [{ id: sixth.id, role: "coder", position: 1, touched: "—（未启动）" }], "概览 queued 同样实时（§19.5 D-M5——带 role + §19.5.6 T-SF2b 未启动占位）")
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.settled))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

/** 等待条件为真（settle 补位等异步链——既有测试同款轮询）。 */
async function waitFor(fn, ms = 1500) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    if (fn()) return true
    await new Promise((r) => setTimeout(r, 20))
  }
  return fn()
}

test("T-M18: status 决策字段（§19.5 D-M5）——running 条目带 role/model/elapsedSec/turn/maxTurns；单查同字段", async () => {
  const { server } = await asyncChildServer(400)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-m18-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const spawned = spawnJson(await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctx))
    assert.equal(spawned.status, "running")
    // 子代理已进入 runAgent（慢 LLM 挂起中——turn≥1 已报）
    await waitFor(() => parent._asyncSubagents.get(spawned.id)?.turn >= 1)
    const entry = parent._asyncSubagents.get(spawned.id)
    assert.equal(entry.model, "deepseek-v4-pro", "条目记录 childProvider.model（spawn 时装配）")
    assert.equal(entry.maxTurns, 5, "条目记录 maxTurns（config.agent.subagentTurns）")
    assert.ok(entry.startedAt && entry.startedAt > 0, "startedAt 记录于实际启动")
    const st = JSON.parse(await subagentTool.execute({ action: "status", id: spawned.id }, ctx))
    assert.equal(st.id, spawned.id)
    assert.equal(st.role, "coder")
    assert.equal(st.status, "running")
    assert.equal(st.model, "deepseek-v4-pro", "单查 running 带 model")
    assert.equal(typeof st.elapsedSec, "number", "elapsedSec 计算于查询时")
    assert.ok(st.elapsedSec >= 0)
    assert.equal(typeof st.turn, "number", "turn 实时同步（onAgentTurn）")
    assert.equal(st.maxTurns, 5)
    // 全览 running 条目同字段（D-M5 结构化对象）
    const ov = JSON.parse(await subagentTool.execute({ action: "status" }, ctx)).overview
    assert.equal(ov.running.length, 1)
    const item = ov.running[0]
    assert.equal(item.id, spawned.id)
    assert.equal(item.role, "coder")
    assert.equal(item.model, "deepseek-v4-pro")
    assert.equal(item.maxTurns, 5)
    assert.equal(typeof item.elapsedSec, "number")
    // 收尾
    await entry.settled
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-M18b: turn 跟踪子代理真实轮次——回合收尾时 entry.turn = LLM 调用数（wall 循环 4 次）", async () => {
  const { server, calls } = wallServer(3)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-m18b-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const spawned = spawnJson(await subagentTool.execute({ task: "loop until done", role: "coder", async: true }, ctx))
    const entry = parent._asyncSubagents.get(spawned.id)
    await entry.settled
    assert.equal(calls.n, 4, "3 个 wall + 1 次收尾 = 4 次 LLM 调用")
    assert.equal(entry.turn, 4, "entry.turn 跟踪到真实轮次（非 0/1 静态值）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-M19: cancel 定向中止——目标 interrupted settle（无陈旧注入/无 error 报告）+ 停止冻结通知——其余子代理继续跑", async () => {
  const { server } = await asyncChildServer(400)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-m19-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const notes = []
    const parent = asyncParent(port, { history: [] }) // history = 机读线（取消提醒注入载体）
    const ctx = asyncCtx(parent, cwd, { callbacks: { onSubagent: (info) => notes.push(info) } })
    const a = spawnJson(await subagentTool.execute({ task: "slow task a", role: "coder", async: true }, ctx))
    const b = spawnJson(await subagentTool.execute({ task: "slow task b", role: "coder", async: true }, ctx))
    assert.equal(a.status, "running")
    assert.equal(b.status, "running")
    const entryA = parent._asyncSubagents.get(a.id)
    const entryB = parent._asyncSubagents.get(b.id)
    // 定向 cancel A（id 必填——只停 A）
    const res = JSON.parse(await subagentTool.execute({ action: "cancel", id: a.id }, ctx))
    assert.equal(res.id, a.id)
    assert.equal(res.status, "cancelled", "cancel 返回确认（定向中止——异步生效）")
    assert.equal(entryA.cancelled, true, "条目置 cancelled 标记")
    assert.equal(entryA.controller.signal.aborted, true, "条目级 controller 已 abort")
    assert.equal(entryB.cancelled, false, "B 不受影响")
    assert.equal(entryB.controller.signal.aborted, false, "B 的 controller 未被 abort——其余子代理继续跑")
    // cancelled settle：出池 + 停止冻结通知（status:"cancelled"——无 error 报告）
    await entryA.settled
    assert.equal(parent._asyncSubagents.has(a.id), false, "cancel 后条目出池清理")
    assert.ok(parent._asyncSubagents.has(b.id), "B 仍留池")
    const cancelNote = notes.find((n) => n.id === a.id && n.status === "cancelled")
    assert.ok(cancelNote, "settle 时收到停止冻结通知（onSubagent cancelled——webview stopped 相位）")
    assert.equal(cancelNote.role, "coder")
    assert.ok(!notes.some((n) => n.id === a.id && n.status === "error"), "cancelled settle 无 error 通知（无陈旧错误形态）")
    // 模型可见提醒（机读线注入——cancelled settle 不注入报告——提醒补位）
    const reminder = parent.history.filter((m) => typeof m.content === "string" && m.content.includes(`subagent coder#${a.id} cancelled by user`))
    assert.equal(reminder.length, 1, "取消提醒注入机读线（半成品警示——模型可见）")
    assert.match(reminder[0].content, /partial changes not merged\/audited/, "半成品警示措辞")
    // B 照常完成
    await entryB.settled
    assert.equal(entryB.done, true, "其余子代理不受 cancel 影响（正常 settle）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-M20: cancel 错误路径——未知 id / 已完成 id / 省略 id → error（防误全停）", async () => {
  const { server } = await asyncChildServer(0)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-m20-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    // 省略 id → error（防误全停——全停走 Ctrl+C / Stop）
    const noId = JSON.parse(await subagentTool.execute({ action: "cancel" }, ctx))
    assert.equal(noId.status, "error")
    assert.match(noId.error, /requires an id/)
    // 未知 id → error（同 status/check 形态）
    const unknown = JSON.parse(await subagentTool.execute({ action: "cancel", id: 999 }, ctx))
    assert.equal(unknown.status, "error")
    assert.match(unknown.error, /unknown async subagent id: 999/)
    // 已完成 id（回合内 settle 未取）→ error——nothing to cancel
    const spawned = spawnJson(await subagentTool.execute({ task: "fast task", role: "coder", async: true }, ctx))
    const entry = parent._asyncSubagents.get(spawned.id)
    await entry.settled
    assert.equal(entry.done, true, "settle 留池（未取）")
    const doneRes = JSON.parse(await subagentTool.execute({ action: "cancel", id: spawned.id }, ctx))
    assert.equal(doneRes.status, "error")
    assert.match(doneRes.error, /already finished/)
    assert.equal(entry.cancelled, false, "已完成条目不置 cancelled——报告照常可取")
    assert.equal(parent._asyncSubagents.has(spawned.id), true, "cancel error 不消费/不删除条目（check 仍可取回）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-M21: cancel 后槽位补位——queued 自动启动（既有补位机制回归——D-M6）+ 处置 #4（评审 #4——queued→running ⏹ 可见性）：补位启动发 started + pool:true（webview ⏹ 门控源——async 池条目才挂 ⏹）", async () => {
  const { server } = await asyncChildServer(300)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-m21-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const notes = []
    const ctx = asyncCtx(parent, cwd, { callbacks: { onSubagent: (info) => notes.push(info) } })
    for (let i = 1; i <= 4; i++) {
      await subagentTool.execute({ task: `slow task ${i}`, role: "coder", async: true }, ctx)
    }
    const fifth = spawnJson(await subagentTool.execute({ task: "slow task 5", role: "coder", async: true }, ctx))
    assert.equal(fifth.status, "queued", "第 5 个入队")
    // §20 D-SD3b（supersede §19.5 处置 #4 旧"入队不 paint"语义）：排队 spawn 返回即发
    // queued 行通知（waiting/等位标注——webview 行——CLI waiting 块的 VS Code 等价）；
    // started 仍只在实际启动发（⏹ 门控源不提前）。
    const queuedNote = notes.find((n) => n.id === fifth.id && n.status === "queued")
    assert.ok(queuedNote, "排队 spawn 返回即发 queued 行通知（D-SD3b——不等启动）")
    assert.equal(queuedNote.position, 1, "queued 通知带等位 position")
    assert.ok(!notes.some((n) => n.id === fifth.id && n.status === "started"), "未启动——无 started 事件（⏹ 随实际启动出现——处置 #4 门控不变）")
    // cancel 一个 running（id 1）→ 腾槽 → 队首（5th）自动补位启动
    const res = JSON.parse(await subagentTool.execute({ action: "cancel", id: 1 }, ctx))
    assert.equal(res.status, "cancelled")
    await parent._asyncSubagents.get(1).settled
    const started = await waitFor(() => parent._asyncSubagents.get(fifth.id)?.status === "running")
    assert.ok(started, "cancel 腾槽后 queued 队首自动启动（补位机制未被 cancel 破坏）")
    // 处置 #4：补位启动（实际启动时）发 started 且带 pool:true——webview ⏹ 门控源
    // （started 恒于 entry.start 发——块由事件创建——无缺失 key 窗口——CLI routeSubToken
    // pending 缓冲无对应物——同语义：queued→running 后 ⏹ 可见）
    const fifthStarted = await waitFor(() => notes.some((n) => n.id === fifth.id && n.status === "started" && n.pool === true))
    assert.ok(fifthStarted, "补位启动发 started+pool:true（queued→running ⏹ 可见性门控源——处置 #4）")
    // 收尾
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.settled))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-M27: queued 取消（round2 #1）——出队移除 + position 前移 + running 槽不受影响 + 无 abort", async () => {
  const { server } = await asyncChildServer(300)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-m27-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const notes = []
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd, { callbacks: { onSubagent: (info) => notes.push(info) } })
    for (let i = 1; i <= 4; i++) {
      await subagentTool.execute({ task: `slow task ${i}`, role: "coder", async: true }, ctx)
    }
    const fifth = spawnJson(await subagentTool.execute({ task: "slow task 5", role: "coder", async: true }, ctx))
    const sixth = spawnJson(await subagentTool.execute({ task: "slow task 6", role: "coder", async: true }, ctx))
    assert.equal(fifth.status, "queued")
    assert.equal(sixth.status, "queued")
    const entry5 = parent._asyncSubagents.get(fifth.id)
    // 取消队首 queued（5th）→ 出队确认——不 abort（未启动无 controller abort）
    const res = JSON.parse(await subagentTool.execute({ action: "cancel", id: fifth.id }, ctx))
    assert.deepEqual(res, { id: fifth.id, status: "cancelled", was: "queued" }, "queued 取消返回 was:'queued' 确认")
    assert.equal(parent._asyncSubagents.has(fifth.id), false, "queued 条目出队移除")
    assert.equal(entry5.controller.signal.aborted, false, "queued 取消无 abort 发生（未启动）")
    assert.ok(notes.some((n) => n.id === fifth.id && n.status === "cancelled"), "queued 取消即时冻结通知（无 settle 依赖）")
    // 后续项 position 前移（status 实时计算）
    const st6 = JSON.parse(await subagentTool.execute({ action: "status", id: sixth.id }, ctx))
    assert.equal(st6.status, "queued")
    assert.equal(st6.position, 1, "出队后后续条目 position 前移（6th: 2 → 1）")
    assert.equal(st6.role, "coder", "queued 单查带 role（D-M5）")
    // running 槽不受影响：4 个 running 仍 running（无补位启动——6th 保持 queued）
    const running = [...parent._asyncSubagents.values()].filter((x) => x.status === "running")
    assert.equal(running.length, 4, "running 槽位不受 queued 取消影响")
    assert.equal(parent._asyncSubagents.get(sixth.id).status, "queued", "6th 未自动启动（无腾槽——取消的是 queued 非 running）")
    // 收尾
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.settled))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-M19c（advisor round 2 #4）: eng-coder cancel——partial 磁盘写入不 merge 父 guard（not merged/audited 文案与实现一致）", async () => {
  const token = await unsignedToken("f9f9f9f9-1111-4111-8111-0000000000f9", Date.now() + 24 * 3600 * 1000)
  const bodies = []
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      bodies.push(body)
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      if (bodies.length === 1) {
        // eng-coder 第 1 回合：真实 write 工具调用（磁盘半成品）
        const frame = { choices: [{ index: 0, finish_reason: "tool_calls", delta: { content: "", tool_calls: [{ index: 0, id: "t1", type: "function", function: { name: "write", arguments: JSON.stringify({ path: "out.mjs", content: "partial-x" }) } }] } }] }
        res.end(`data: ${JSON.stringify(frame)}\n\ndata: [DONE]\n\n`)
      } else {
        // 第 2 回合：慢响应——给 cancel 留窗口（写已执行后挂起中取消）
        setTimeout(() => {
          res.end(
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "child done" } }] })}\n\n` +
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
            "data: [DONE]\n\n",
          )
        }, 800)
      }
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-m19c-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const { existsSync } = await import("node:fs")
    const parent = engParent(port, token, { history: [] })
    const ctx = { agent: parent, cwd, callbacks: {} }
    // eng-coder 缺省 async
    const spawned = spawnJson(await subagentTool.execute({ task: "child eng task", role: "eng-coder", designId: "eng", designToken: token }, ctx))
    assert.equal(spawned.status, "running")
    const entry = parent._asyncSubagents.get(spawned.id)
    // 等写入执行 + 第二轮请求发出（child 挂在慢 LLM 上——cancel 窗口）
    const twoCalls = await waitFor(() => bodies.length >= 2, 3000)
    assert.ok(twoCalls, "子代理第二轮请求已发出（写已执行）")
    assert.ok(existsSync(join(cwd, "out.mjs")), "半成品确在磁盘（写工具真实执行）")
    const res = JSON.parse(await subagentTool.execute({ action: "cancel", id: spawned.id }, ctx))
    assert.equal(res.status, "cancelled")
    await entry.settled
    assert.equal(parent._asyncSubagents.has(spawned.id), false, "settle 出池")
    // #4 核心：取消路径不 merge——partial changes NOT merged/audited（描述/提醒文案与行为一致）
    assert.equal(parent._touchedFiles.length, 0, "cancel 不合并 touched files（不入父 guard 记账）")
    assert.notEqual(parent._mutatedThisRun, true, "cancel 不置父 mutation 标记（不触发 verify/advisor 推回）")
    const reminder = parent.history.filter((m) => typeof m.content === "string" && m.content.includes("cancelled by user"))
    assert.equal(reminder.length, 1, "机读线取消提醒在")
    assert.match(reminder[0].content, /partial changes not merged\/audited/)
    // 顺带：取消后同一 id 不可再 cancel（settle 已出池 → unknown）
    const again = JSON.parse(await subagentTool.execute({ action: "cancel", id: spawned.id }, ctx))
    assert.equal(again.status, "error")
    assert.match(again.error, /unknown async subagent id/)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-M27b: cancel depth>0 → 拒绝（子代理上下文无 cancel 意义——D-M6 只允许主会话）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const parent = asyncParent(1)
  const r = JSON.parse(await subagentTool.execute({ action: "cancel", id: 1 }, asyncCtx(parent, process.cwd(), { depth: 1 })))
  assert.equal(r.status, "error")
  assert.match(r.error, /only available at the top level/)
  assert.equal(parent._asyncSubagents.size, 0)
})

test("T-M19b（审计 F2）: cancel 幂等——settle 前重复 cancel 同一 running 条目 → 确认返回、提醒只注入一次", async () => {
  const { server } = await asyncChildServer(400)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-m19b-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port, { history: [] })
    const ctx = asyncCtx(parent, cwd)
    const spawned = spawnJson(await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctx))
    const first = JSON.parse(await subagentTool.execute({ action: "cancel", id: spawned.id }, ctx))
    assert.equal(first.status, "cancelled")
    // settle 前（⏹ 尚在、模型再 cancel）二次取消 → 确认返回、不重复注入
    const second = JSON.parse(await subagentTool.execute({ action: "cancel", id: spawned.id }, ctx))
    assert.equal(second.status, "cancelled", "重复 cancel 幂等确认（无 error）")
    const reminders = parent.history.filter((m) => typeof m.content === "string" && m.content.includes("cancelled by user"))
    assert.equal(reminders.length, 1, "机读线提醒只注入一次（无重复半成品警示）")
    await parent._asyncSubagents.get(spawned.id).settled
    assert.equal(parent._asyncSubagents.has(spawned.id), false, "settle 出池照常")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-SF1/T-SF2a: status running 条目带 touched files 摘要（相对查询方 cwd；cwd 外 ../ 前缀）；0 改动 = touched 占位字符串（区分 queued）", async () => {
  const { server } = await asyncChildServer(1500)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sf1-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const spawned = spawnJson(await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctx))
    const entry = parent._asyncSubagents.get(spawned.id)
    await waitFor(() => entry.childAgent, 3000)
    assert.ok(entry.childAgent._touchedFiles instanceof Array, "childAgent 对象引用已绑（非数组引用）")
    // T-SF2a：running 但 0 改动 → touched 占位字符串（区分占位——queued 是另一文案——T-SF2b）
    let st = JSON.parse(await subagentTool.execute({ action: "status", id: spawned.id }, ctx))
    assert.equal(st.status, "running")
    assert.equal(st.touched, "—（尚无改动）", "running 0 改动 = 占位字符串（T-SF2a）")
    assert.ok(!("touchedFiles" in st), "0 改动无 touchedFiles 数组")
    // T-SF1：1 个 cwd 内 + 1 个 cwd 外（绝对形态 + "../" 前缀）——运行期实时读
    const inside = join(cwd, "src", "x.mjs")
    const outside = join(cwd, "..", "sf-outside", "y.mjs") // 相对化后以 .. 开头（cwd 外）
    entry.childAgent._touchedFiles.push(inside, outside)
    st = JSON.parse(await subagentTool.execute({ action: "status", id: spawned.id }, ctx))
    assert.deepEqual(st.touchedFiles, [join("src", "x.mjs"), "../" + outside], "摘要相对化（cwd 内相对——cwd 外 ../ 前缀）")
    assert.ok(!("touched" in st), "有改动时无 touched 占位字符串（数组形态替代）")
    assert.ok(!("touchedMore" in st), "≤5 个无 touchedMore（仅超出时出现）")
    // 全览 running 条目同字段（N-SF2 追加——既有字段零破坏）
    const item = JSON.parse(await subagentTool.execute({ action: "status" }, ctx)).overview.running.find((x) => x.id === spawned.id)
    assert.deepEqual(item.touchedFiles, [join("src", "x.mjs"), "../" + outside])
    // 收尾（status 不消费——子代理照常 settle）
    await entry.settled
    assert.equal(entry.done, true)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-SF2b: status queued 条目（spawn-ack 未启动——无子代理对象）带 touched 占位——确定性不崩", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = process.cwd()
  const q = {
    id: 1, role: "coder", status: "queued", position: 0,
    report: null, error: null, done: false, cancelled: false,
    _files: [], _dependsOn: [], _auto: () => false,
    childAgent: null,
    settled: new Promise(() => {}),
  }
  const agent = asyncParent(0, { _asyncSubagents: new Map([[1, q]]) })
  const ctx = asyncCtx(agent, cwd)
  // 单查
  const st = JSON.parse(await subagentTool.execute({ action: "status", id: 1 }, ctx))
  assert.equal(st.status, "queued")
  assert.equal(st.touched, "—（未启动）", "queued 未启动占位（T-SF2b）")
  assert.ok(!("touchedFiles" in st), "queued 无 touchedFiles 字段（区别于 running 数组/占位）")
  // 概览
  const row = JSON.parse(await subagentTool.execute({ action: "status" }, ctx)).overview.queued[0]
  assert.equal(row.id, 1)
  assert.equal(row.touched, "—（未启动）", "概览 queued 行同样带未启动占位")
})

test("T-SF3: touchedFiles >5 → 限长（前 5 + touchedMore 超出计数——N-SF1）", async () => {
  const { server } = await asyncChildServer(1500)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sf3-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const spawned = spawnJson(await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctx))
    const entry = parent._asyncSubagents.get(spawned.id)
    await waitFor(() => entry.childAgent, 3000)
    const seven = Array.from({ length: 7 }, (_, i) => join(cwd, "src", `f${i}.mjs`))
    entry.childAgent._touchedFiles.push(...seven)
    const st = JSON.parse(await subagentTool.execute({ action: "status", id: spawned.id }, ctx))
    assert.equal(st.touchedFiles.length, 5, "前 5 个")
    assert.deepEqual(st.touchedFiles, seven.slice(0, 5).map((p) => relative(cwd, p)), "前 5 相对路径")
    assert.equal(st.touchedMore, 2, "超出计数 = 7 - 5（「… 2 more」）")
    assert.ok(!("touched" in st), "有改动无占位字符串")
    await entry.settled
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-SF4: 路径 >80 字符 → 截尾（+…）——不超行（N-SF1）", async () => {
  const { server } = await asyncChildServer(1500)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-sf4-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const spawned = spawnJson(await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctx))
    const entry = parent._asyncSubagents.get(spawned.id)
    await waitFor(() => entry.childAgent, 3000)
    const deep = join(cwd, "a".repeat(50), "b".repeat(40), "c.mjs") // 相对化后 97 字符 > 80
    assert.ok(relative(cwd, deep).length > 80, "夹具确认：相对路径确实超 80")
    entry.childAgent._touchedFiles.push(deep)
    const st = JSON.parse(await subagentTool.execute({ action: "status", id: spawned.id }, ctx))
    assert.equal(st.touchedFiles.length, 1)
    assert.equal(st.touchedFiles[0].length, 80, "截尾后 80 字符（79 + …）——不超行")
    assert.ok(st.touchedFiles[0].endsWith("…"), "截尾以 … 标记")
    await entry.settled
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-F1b (2026-09-05, 复审 🟡#2): check 等待期 ctx.signal 中止（Ctrl+I/Stop）→ 返回 {done,stopped} 不悬挂（CLI 同款出口）", async () => {
  const { server } = await asyncChildServer(900) // 子代理远慢于中止——验证 check 先出
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-f1b-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctrl = new AbortController()
    const ctx = asyncCtx(parent, cwd, { signal: ctrl.signal })
    const a = spawnJson(await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctx))
    assert.equal(a.status, "running")
    const checkP = subagentTool.execute({ action: "check", n: 1, id: a.id }, ctx) // 等待 running 条目
    await new Promise((r) => setTimeout(r, 50))
    ctrl.abort({ interrupt: true, message: "interrupt while checking" })
    const out = JSON.parse(await Promise.race([
      checkP,
      new Promise((_, rej) => setTimeout(() => rej(new Error("check hung — signal abort 出口缺失")), 3000)),
    ]))
    assert.equal(out.done, true)
    assert.equal(out.stopped, true)
    assert.ok(parent._asyncSubagents.has(a.id), "中止不消费条目——子代理继续后台跑（F2 语义）")
    await parent._asyncSubagents.get(a.id).settled
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-F1 (2026-09-05): check(id) 在途等待期依赖被取消 → 唤醒重判返回 dependency-cancelled（不悬挂——CLI waiters 镜像）", async () => {

  const { server } = await asyncChildServer(800) // slow dep——给取消留窗口
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-f1-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = asyncCtx(parent, cwd)
    const dep = spawnJson(await subagentTool.execute({ task: "slow dep", role: "coder", async: true }, ctx))
    assert.equal(dep.status, "running")
    const child = spawnJson(await subagentTool.execute({ task: "dep-child", role: "coder", async: true, dependsOn: [String(dep.id)] }, ctx))
    assert.equal(child.status, "queued", "依赖未完成 → 排队")
    const entry = parent._asyncSubagents.get(child.id)
    assert.equal(entry._dependsOn[0], String(dep.id))
    // 在途 check：调用时刻守卫通过（依赖 running——池非死端）→ 阻塞等待
    const checkP = subagentTool.execute({ action: "check", id: child.id, n: 1 }, ctx)
    // 等待期间依赖被取消（running → abort → cancelled settle → 墓碑 → refill → E depc）
    const cancelled = spawnJson(await subagentTool.execute({ action: "cancel", id: dep.id }, ctx))
    assert.equal(cancelled.status, "cancelled")
    const out = JSON.parse(await Promise.race([
      checkP,
      new Promise((_, rej) => setTimeout(() => rej(new Error("check hung — F1 regression: depc 死端无唤醒")), 5000)),
    ]))
    assert.equal(out.status, "queued", "唤醒后重判 → depc 死端返回 queued（不悬挂不消费）")
    assert.equal(out.waiting, "dependency-cancelled")
    assert.ok(parent._asyncSubagents.has(child.id), "未被消费——模型可 cancel 处置")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-F2 (2026-09-05): Ctrl+I（interrupt）不中止池内子代理——全停（plain abort）才传播（keeps-the-pool 对齐）", async () => {
  const { server } = await asyncChildServer(600)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-f2-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    // 场景 1：interrupt 形态中止 spawn 信号 → 条目 controller 不传播 → 子代理照常完成
    const parent1 = asyncParent(port)
    const ctrlI = new AbortController()
    const ctxI = asyncCtx(parent1, cwd, { signal: ctrlI.signal })
    const a = spawnJson(await subagentTool.execute({ task: "slow task", role: "coder", async: true }, ctxI))
    const entryA = parent1._asyncSubagents.get(a.id)
    assert.equal(entryA.controller.signal.aborted, false)
    ctrlI.abort({ interrupt: true, message: "test interrupt" })
    assert.equal(entryA.controller.signal.aborted, false, "interrupt 不传播到条目 controller——子代理继续跑")
    await entryA.settled
    assert.ok(entryA.done && entryA.report?.includes("slow result"), "interrupt 后子代理正常完成落报告")
    // 复审 🟡#1：interrupt 形态 settle 不得静默出池（丢弃分支豁免）——留池 done 供注入/消化
    assert.equal(parent1._asyncSubagents.has(a.id), true, "interrupt 后 settle 的条目留池（不再静默丢弃——check 可取回）")
    const ctxConsume = asyncCtx(parent1, cwd) // 无 abort signal 的新 ctx——消费不受已中止 signal 影响
    const got = JSON.parse(await subagentTool.execute({ action: "check", n: 1, id: a.id }, ctxConsume))
    assert.equal(got.status, "done", "报告经 check 正常取回")
    assert.ok(got.report?.includes("slow result"))
    // 场景 2：plain abort（全停形态）→ 传播 → 条目中止出池
    const parent2 = asyncParent(port)
    const ctrlS = new AbortController()
    const ctxS = asyncCtx(parent2, cwd, { signal: ctrlS.signal })
    const b = spawnJson(await subagentTool.execute({ task: "slow task 2", role: "coder", async: true }, ctxS))
    const entryB = parent2._asyncSubagents.get(b.id)
    assert.equal(entryB.controller.signal.aborted, false)
    ctrlS.abort()
    assert.equal(entryB.controller.signal.aborted, true, "全停（plain abort）传播到条目 controller")
    await entryB.settled
    assert.equal(parent2._asyncSubagents.has(b.id), false, "中止条目出池（settle aborted 分支清理）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

