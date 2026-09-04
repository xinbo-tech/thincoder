/**
 * distill.test.mjs — exploration distillation — run-summary shrink / end-of-run async distill (SEND-STALL-DISTILL).
 *
 * Split from test/agent.test.mjs (AGENT-LOOP.md §18.14/§18.14.1 D-T1.1 domain rule —
 * blocks moved verbatim; test names/semantics unchanged).
 */

import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, existsSync, readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { tmpdir } from "node:os"
import { compactHistory, truncateFallback, shrinkOversized, summarizeRunExplorations, SUMMARIZE_PROMPT, EXPLORE_TOOLS } from "../src/compact.mjs"
import { runAgent } from "../src/agent.mjs"

function setupTempDir() {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-test-"))
  mkdirSync(join(dir, ".thincoder"), { recursive: true })
  return dir
}

function mockProvider(model = "deepseek-v4-pro", port = null) {
  return { baseURL: port ? `http://127.0.0.1:${port}` : "https://api.test/v1", apiKey: "sk-test", model }
}

// ─── Model specs ────────────────────────────────────────────────

/** Local mock LLM server: returns a single SSE response with the given content.
 *  Captures request bodies into `requests` so tests can assert the serialization. */
function mockLLMServer(content = "这是摘要") {
  return import("node:http").then(({ createServer }) => {
    const requests = []
    const server = createServer((req, res) => {
      let body = ""
      req.on("data", (c) => { body += c })
      req.on("end", () => {
        requests.push(body)
        res.writeHead(200, { "Content-Type": "text/event-stream" })
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          `data: [DONE]\n\n`
        )
      })
    })
    return new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port, requests }))
    })
  })
}

describe("Delegate well rewrite + exploration distillation", () => {

  /** One assistant(tool_calls)→tool-result pair for an exploration tool. */
  const explorePair = (name, id, content) => [
    { role: "assistant", content: null, tool_calls: [{ id, type: "function", function: { name, arguments: "{}" } }] },
    { role: "tool", tool_call_id: id, name, content },
  ]
  const makeRun = (n, final = "investigation done") => {
    const run = []
    for (let i = 0; i < n; i++) run.push(...explorePair(i % 2 === 0 ? "read" : "grep", `call_${i}`, `exploration result ${i}`))
    run.push({ role: "assistant", content: final })
    return run
  }
  const countNotes = (h) => h.filter((m) => typeof m.content === "string" && m.content.startsWith("[Exploration summary]")).length
  const assertNoOrphans = (h, label) => {
    const byId = new Set()
    for (const m of h) if (m.role === "assistant" && m.tool_calls) for (const tc of m.tool_calls) byId.add(tc.id)
    for (const m of h) if (m.role === "tool") assert.ok(byId.has(m.tool_call_id), `${label}: orphan tool message ${m.tool_call_id}`)
  }


  it("≥3 探索结果 → 收缩为一条 note、无孤儿、原数组不变", async () => {
    const { server, port, requests } = await mockLLMServer("found the config and call sites")
    try {
      const pre = [
        { role: "user", content: "earlier task" },
        { role: "assistant", content: "earlier done" },
        { role: "user", content: "investigate the wiring" },
      ]
      const run = makeRun(3)
      const history = [...pre, ...run]

      const shrunk = await summarizeRunExplorations(history, pre.length, mockProvider("unknown-model", port), undefined)

      assert.ok(shrunk, "应返回收缩后的新数组")
      assert.equal(countNotes(shrunk), 1, "整体替换为一条 note")
      assert.equal(shrunk.findIndex((m) => typeof m.content === "string" && m.content.startsWith("[Exploration summary]")), pre.length)
      assertNoOrphans(shrunk, "收缩结果")
      assert.ok(shrunk.some((m) => m.role === "assistant" && m.content === "investigation done"), "最终回复保留")
      assert.equal(history.length, pre.length + run.length, "原数组不被就地改动")
      assert.equal(requests.length, 1, "恰好一次静默摘要调用")
    } finally {
      server.close()
    }
  })

  it("<3 探索结果 → 返回 null（不发 LLM 调用）", async () => {
    const { server, port, requests } = await mockLLMServer("should not be called")
    try {
      const pre = [{ role: "user", content: "investigate" }]
      const history = [...pre, ...makeRun(2)]
      assert.equal(await summarizeRunExplorations(history, pre.length, mockProvider("unknown-model", port), undefined), null)
      assert.equal(requests.length, 0, "<3 条不应发起摘要请求")
    } finally {
      server.close()
    }
  })

  it("LLM 摘要失败 → 返回 null（静默跳过、不丢历史）", async () => {
    const http = await import("node:http")
    const server = http.createServer((req, res) => {
      req.resume()
      req.on("end", () => {
        res.writeHead(401, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: { message: "invalid api key" } }))
      })
    })
    await new Promise((r) => server.listen(0, "127.0.0.1", r))
    const port = server.address().port
    try {
      const pre = [{ role: "user", content: "investigate" }]
      const history = [...pre, ...makeRun(3)]
      assert.equal(await summarizeRunExplorations(history, pre.length, mockProvider("unknown-model", port), undefined), null, "失败返回 null（N3）")
    } finally {
      server.close()
    }
  })

  it("混合配对（read+edit 同一回合）不被拆分、无孤儿", async () => {
    const { server, port } = await mockLLMServer("mixed summary")
    try {
      const history = [
        { role: "user", content: "go" },
        ...explorePair("read", "r1", "pure read"),
        { role: "assistant", content: null, tool_calls: [
          { id: "c1", type: "function", function: { name: "read", arguments: "{}" } },
          { id: "c2", type: "function", function: { name: "write", arguments: "{}" } },
        ] },
        { role: "tool", tool_call_id: "c1", name: "read", content: "file content" },
        { role: "tool", tool_call_id: "c2", name: "write", content: "ok" },
        ...explorePair("grep", "r2", "pure grep"),
        ...explorePair("glob", "r3", "pure glob"),
        { role: "assistant", content: "done" },
      ]
      const shrunk = await summarizeRunExplorations(history, 1, mockProvider("unknown-model", port), undefined)
      assert.ok(shrunk, "应返回收缩结果")
      assert.ok(shrunk.some((m) => m.role === "tool" && m.tool_call_id === "c2"), "write 工具结果保留")
      assertNoOrphans(shrunk, "收缩结果")
      assert.equal(countNotes(shrunk), 1, "纯探索块仍被收缩为一条 note")
    } finally {
      server.close()
    }
  })

  it("中途压缩重建机器线 → stale 边界静默跳过，重置到 tail 起点(2) 后蒸馏恢复", async () => {
    const { server, port } = await mockLLMServer("post-compaction exploration summary")
    try {
      const provider = mockProvider("unknown-model", port)
      // 40 条前序消息（run 起点 = 40）→ 压缩后数组大幅缩短，原始边界下标比数组还长（stale）
      const pre = Array.from({ length: 40 }, (_, i) =>
        i % 2 === 0 ? { role: "user", content: `prompt ${i}` } : { role: "assistant", content: `reply ${i}` }
      )
      const history = [...pre, ...makeRun(3)]
      const staleStart = pre.length // 40

      // 中途确定性压缩（fallback，无 LLM 调用）→ 重建为 [note, "Understood", ...verbatim tail]
      const rebuilt = truncateFallback(history, provider)
      assert.ok(rebuilt, "fallback 压缩应发生")
      assert.ok(rebuilt.length < staleStart, "重建后的数组比 run 起点还短（旧边界已失效）")

      // 形状：index 0 = 摘要 note、index 1 = "Understood" 占位、index 2 = verbatim tail 起点
      // （等价 CLI 的 head.length + 2，head 恒空 KEEP_HEAD = 0）
      assert.match(rebuilt[0].content, /Context was truncated/, "index 0 = 摘要 note")
      assert.match(rebuilt[1].content, /^Understood\. I'll continue/, "index 1 = Understood 占位")

      // 压缩后继续探索：追加新一轮纯探索配对
      const combined = [...rebuilt, ...makeRun(3, "second investigation done")]

      // bug 表现：旧边界下标超过重建后数组长度 → distillExplorations 静默跳过（返回 null）
      assert.equal(
        await summarizeRunExplorations(combined, staleStart, provider, undefined),
        null,
        "stale 边界导致静默跳过",
      )

      // 修复后边界 = verbatim tail 起点 2 → 蒸馏恢复
      const shrunk = await summarizeRunExplorations(combined, 2, provider, undefined)
      assert.ok(shrunk, "重置边界后蒸馏恢复")
      assert.equal(countNotes(shrunk), 1, "tail 内 raw 探索 + 新增探索收缩为一条 note")
      assert.ok(shrunk.some((m) => m.role === "assistant" && m.content === "second investigation done"), "压缩后最终回复保留")
      assertNoOrphans(shrunk, "收缩结果")
    } finally {
      server.close()
    }
  })

})

/** One-frame SSE replies (same shape as continue-on-turn-cap.test.mjs). */
const sseTurn = (content) => `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content }, finish_reason: "stop" }] })}\n\ndata: [DONE]\n\n`

const sseTools = (toolCalls) => `data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: toolCalls }, finish_reason: "stop" }] })}\n\ndata: [DONE]\n\n`

/** Three explore-tool calls the loop executes against real files (read a/b/c.mjs). */
const readCalls = () => ["a.mjs", "b.mjs", "c.mjs"].map((f, i) => ({
  index: i, id: `call_${i}`, type: "function", function: { name: "read", arguments: JSON.stringify({ path: f }) },
}))

/** Scripted local provider: onRequest(index, body) → SSE string | { status, body } (may be async). */
async function scriptedLLMServer(onRequest) {
  const http = await import("node:http")
  const requests = []
  const server = http.createServer((req, res) => {
    let body = ""
    req.on("data", (c) => { body += c })
    req.on("end", () => {
      requests.push(body)
      Promise.resolve(onRequest(requests.length, body))
        .then((r) => {
          if (r && r.status) { res.writeHead(r.status, { "Content-Type": "application/json" }); res.end(r.body ?? ""); return }
          res.writeHead(200, { "Content-Type": "text/event-stream" })
          res.end(r)
        })
        .catch(() => { try { res.writeHead(500); res.end() } catch { /* socket already closed (client abort) */ } })
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  return { server, port: server.address().port, requests }
}

describe("end-of-run distillation is async (SEND-STALL-DISTILL)", () => {
  const mkFiles = (cwd) => { for (const f of ["a.mjs", "b.mjs", "c.mjs"]) writeFileSync(join(cwd, f), `export const ${f[0]} = 1\n`) }
  // Distill requests are a single user message carrying EXPLORE_SUMMARY_PROMPT. Detect by
  // message shape + prompt prefix — a raw body.includes() on the prompt fails because JSON
  // escapes the trailing newline (\\n in the wire body).
  const isDistillReq = (body) => {
    try {
      const m = JSON.parse(body)?.messages
      return m?.length === 1 && m[0]?.role === "user" && typeof m[0]?.content === "string"
        && m[0].content.startsWith("You are distilling exploration tool results")
    } catch { return false }
  }
  const noteIdx = (msgs) => msgs.findIndex((m) => typeof m.content === "string" && m.content.startsWith("[Exploration summary]"))

  it("AC1/AC2/AC3 — onComplete fires before a slow distill; the next run awaits it and starts from the compressed line", async () => {
    const cwd = setupTempDir()
    mkFiles(cwd)
    const { server, port, requests } = await scriptedLLMServer(async (i, body) => {
      if (isDistillReq(body)) {
        await new Promise((r) => setTimeout(r, 5000))   // slow distill — the send button must NOT wait for it
        return sseTurn("async exploration summary")
      }
      if (i === 1) return sseTools(readCalls())
      return sseTurn("final reply")
    })
    const provider = mockProvider("unknown-model", port)
    const opts = { history: [], fullHistory: [], distillState: { pending: null }, distillSignal: new AbortController().signal }
    try {
      // Round 1: exploration tools → final reply → onComplete → async distill
      let onDistilled = 0
      let completeAt = null
      let histAtComplete = null
      const t0 = Date.now()
      await runAgent(provider, cwd, "explore the code", {
        onComplete: () => {
          completeAt = Date.now() - t0
          histAtComplete = opts.history.map((m) => ({ role: m.role, content: typeof m.content === "string" ? m.content.slice(0, 40) : null }))
        },
        onDistilled: () => { onDistilled++ },
      }, undefined, false, opts)

      // AC1: onComplete fired quickly while the distill is still in flight
      assert.ok(completeAt !== null, "onComplete fired")
      assert.ok(completeAt < 1000, `onComplete within 1s of send (got ${completeAt}ms)`)
      assert.ok(opts.distillState.pending instanceof Promise, "distill still pending after runAgent returned")
      // P1 regression guard: at onComplete time the machine line was NOT yet compressed
      assert.ok(noteIdx(histAtComplete) < 0, "no summary note at onComplete time")
      assert.ok(histAtComplete.some((m) => m.role === "tool"), "raw exploration results still in the machine line at onComplete")

      // AC2: fire round 2 while the distill is in flight — runAgent awaits it BEFORE pushing input2
      const out2 = await runAgent(provider, cwd, "second request", {}, undefined, false, opts)
      assert.equal(out2, "final reply")
      assert.equal(onDistilled, 1, "onDistilled exactly once (round 1 shrank; round 2 had no exploration — AC3)")

      // Round 2's first LLM request: the compressed note sits BEFORE the new user input
      const run2Body = requests.find((b) => !isDistillReq(b) && b.includes("second request"))
      assert.ok(run2Body, "round-2 request captured")
      const msgs = JSON.parse(run2Body).messages
      const ni = noteIdx(msgs)
      const ii = msgs.findIndex((m) => typeof m.content === "string" && m.content.includes("second request"))
      assert.ok(ni >= 0, "compressed note present in round-2 request")
      assert.ok(ii > ni, "summary note lands BEFORE the new user input (AC2)")
      assert.ok(!msgs.some((m) => m.role === "tool"), "exploration tool results dropped from round-2 request")
      // The slow (5s-delayed) distill response is the one that landed — proves the async path
      assert.ok(requests.some((b) => isDistillReq(b)), "distill request was made")
      assert.ok(msgs[ni].content.includes("async exploration summary"), "delayed distill summary reached the machine line")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("AC4 — distill failure is silent: pending resolves null, history untouched, onComplete still fired", async () => {
    const cwd = setupTempDir()
    mkFiles(cwd)
    const { server, port, requests } = await scriptedLLMServer((i, body) => {
      if (isDistillReq(body)) return { status: 400, body: JSON.stringify({ error: { message: "invalid api key" } }) }
      if (i === 1) return sseTools(readCalls())
      return sseTurn("done")
    })
    const opts = { history: [], fullHistory: [], distillState: { pending: null }, distillSignal: new AbortController().signal }
    let completeFired = false
    let distilledFired = false
    try {
      const out = await runAgent(mockProvider("unknown-model", port), cwd, "explore", {
        onComplete: () => { completeFired = true },
        onDistilled: () => { distilledFired = true },
      }, undefined, false, opts)
      assert.equal(out, "done")
      assert.ok(completeFired, "onComplete fired despite distill failure")
      // Await the pending distill first — only then is the request guaranteed to have arrived
      assert.equal(await opts.distillState.pending, null, "failed distill resolves null")
      assert.ok(requests.some((b) => isDistillReq(b)), "distill request was made and failed")
      assert.equal(distilledFired, false, "onDistilled NOT fired when nothing shrank")
      assert.ok(noteIdx(opts.history) < 0, "no note after failed distill")
      assert.ok(opts.history.some((m) => m.role === "tool"), "raw exploration results kept")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("AC6b — subruns (depth>0) never trigger distillation", async () => {
    const cwd = setupTempDir()
    const { server, port } = await scriptedLLMServer(() => sseTurn("child done"))
    const opts = { depth: 1, role: "explore", history: [], fullHistory: [], distillState: { pending: null }, distillSignal: new AbortController().signal }
    let completeFired = false
    let distilledFired = false
    try {
      const out = await runAgent(mockProvider("unknown-model", port), cwd, "child task", {
        onComplete: () => { completeFired = true },
        onDistilled: () => { distilledFired = true },
      }, undefined, false, opts)
      assert.equal(out, "child done")
      assert.equal(opts.distillState.pending, null, "distillState.pending stays null (no distill created)")
      assert.equal(distilledFired, false, "onDistilled never fires for a subrun")
      assert.equal(completeFired, false, "onComplete is top-level-only (unchanged)")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })
})
