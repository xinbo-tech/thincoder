/**
 * session-compaction.test.mjs — verify that compaction never destroys the persisted full history.
 *
 * Regression coverage for the bug where the CLI's single agent.history doubled as both the machine
 * context AND the persistence source: once compaction replaced it, saveSession wrote the shrunk
 * history to disk, so the VS Code history panel (and CLI resume fallback) lost all pre-compaction
 * content. The fix keeps a never-compacted agent._fullHistory and double-writes the session file:
 *   history        = full, never-compacted (human-readable)
 *   contextHistory = machine context (possibly compacted)
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, existsSync, unlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { compressFallback, compressIfNeeded, estimateTokens, pushReal, SUMMARIZE_PROMPT } from "../src/context.mjs"
import { estimateText } from "../src/provider/rate.mjs"
import { saveSession, loadSession, applySession, sessionPath } from "../src/session.mjs"
import { slow } from "./slow.mjs"
import { mockLLM } from "./helpers/mock-llm.mjs"

/** Build a long, splittable history (alternating user/assistant so splitHistory finds a middle). */
function makeHistory(exchanges) {
  const h = []
  for (let i = 0; i < exchanges; i++) {
    h.push({ role: "user", content: `user message ${i} ${"x".repeat(50)}` })
    h.push({ role: "assistant", content: `assistant reply ${i} ${"y".repeat(50)}` })
  }
  return h
}

/** Minimal agent shape needed by context.mjs + session.mjs. */
function makeAgent(cwd, history) {
  const agent = {
    cwd,
    history: [],
    _fullHistory: [],
    tasks: [],
    planMode: false,
    autoApprove: false,
    config: {},
    providers: [],
  }
  // Seed via pushReal — mirrors the source double-write so both lines hold the real messages.
  for (const m of history) pushReal(agent, m)
  return agent
}

/** Remove every file this cwd's session may have created (slots + manifest + legacy). */
function cleanup(cwd) {
  const base = sessionPath(cwd)
  for (const suffix of ["", ".manifest", ".1", ".2", ".3", ".tmp", ".corrupted"]) {
    try { if (existsSync(base + suffix)) unlinkSync(base + suffix) } catch {}
  }
}

test("compaction preserves full history in _fullHistory while shrinking agent.history", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-cmp-"))
  try {
    const full = makeHistory(20) // 40 messages, splittable
    const agent = makeAgent(cwd, [...full])

    const ok = compressFallback(agent)
    assert.equal(ok, true, "fallback compaction should succeed on a long history")

    // Machine context shrank; full record kept every original message.
    assert.ok(agent.history.length < full.length, "agent.history should be compacted")
    assert.equal(agent._fullHistory.length, full.length, "_fullHistory must keep all pre-compaction messages")
    // The compacted-away middle content is still present in the full record.
    assert.ok(
      agent._fullHistory.some((m) => m.content.includes("user message 5")),
      "middle messages compacted out of agent.history must survive in _fullHistory"
    )
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("saveSession double-writes full history + compacted contextHistory; loadSession returns full history", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-cmp-"))
  try {
    const full = makeHistory(20)
    const agent = makeAgent(cwd, [...full])
    compressFallback(agent) // compact BEFORE saving — the regression scenario

    saveSession(agent, [])
    const data = loadSession(cwd)
    assert.ok(data, "session should load")

    // history field = full, never-compacted (what the VS Code panel & CLI resume read).
    assert.equal(data.history.length, full.length, "persisted history must be the full record")
    assert.ok(
      data.history.some((m) => m.content.includes("user message 5")),
      "persisted history must retain compacted-away content"
    )
    // contextHistory field = the compacted machine context.
    assert.ok(Array.isArray(data.contextHistory), "contextHistory must be persisted")
    assert.ok(
      data.contextHistory.length < data.history.length,
      "contextHistory should be the compacted (shorter) machine context"
    )
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("applySession resumes machine context from contextHistory, full record from history", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-cmp-"))
  try {
    const full = makeHistory(20)
    const writer = makeAgent(cwd, [...full])
    compressFallback(writer)
    saveSession(writer, [])

    const data = loadSession(cwd)
    const reader = makeAgent(cwd, [])
    applySession(reader, data)

    // Dual-track: machine line resumes from the COMPACTED contextHistory (keeps token savings),
    // human line resumes from the FULL history.
    assert.ok(reader.history.length < full.length, "resumed machine context should keep compaction")
    assert.equal(reader._fullHistory.length, full.length, "_fullHistory reseeded from full record")

    // A post-resume exchange appends to BOTH the machine context and the full record via pushReal.
    pushReal(reader, { role: "user", content: "post-resume question" })
    pushReal(reader, { role: "assistant", content: "post-resume answer" })
    assert.equal(reader._fullHistory.length, full.length + 2, "new exchange appended onto full history")
    assert.ok(reader._fullHistory.some((m) => m.content === "post-resume question"))
    assert.ok(reader.history.some((m) => m.content === "post-resume question"), "machine line also gets the new exchange")
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("legacy session file without contextHistory still loads (backwards compatible)", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-cmp-"))
  try {
    const full = makeHistory(4)
    const agent = makeAgent(cwd, [...full])
    // Never compact: simulates an old session written before the contextHistory field existed.
    saveSession(agent, [])
    const data = loadSession(cwd)
    // Strip the field to emulate a legacy file, then re-apply.
    delete data.contextHistory
    const reader = makeAgent(cwd, [])
    applySession(reader, data)
    assert.equal(reader.history.length, full.length, "falls back to full history when contextHistory absent")
    assert.equal(reader._fullHistory.length, full.length)
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("machine line (contextHistory) keeps transient messages — resume must rebuild a byte-identical prefix for provider caches", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-tran-"))
  try {
    const agent = makeAgent(cwd, [{ role: "user", content: "hi" }, { role: "assistant", content: "yo" }])
    // simulate a run's machine-only injections (git/OS/time reminders are transient)
    agent.history.push({ role: "user", content: "[System reminder: git context: branch main]", transient: true })
    agent.history.push({ role: "user", content: "[System reminder: current time is 2026-08-16 11:00:00]", transient: true })
    saveSession(agent)

    const restored = loadSession(cwd)
    const restoredAgent = { ...agent, history: [], _fullHistory: [] }
    applySession(restoredAgent, restored)
    // the MACHINE line must equal the saved machine line (transient included) so the
    // next request's prefix matches what the provider cached
    assert.deepEqual(restoredAgent.history, agent.history, "machine line survives save→load byte-identical (transient kept)")
    // the HUMAN line must NOT contain transient
    assert.ok(!restoredAgent._fullHistory.some((m) => m.transient), "human line stays clean")
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

// ─── §9 tail 按 token 预算（CONTEXT-COMPACTION.md §9 D-T1..D-T7，2026-09-02）───
// 预算只作用于压缩发生时 tail 选择；触发阈值/压缩入口不动（D-T4）。既有 tail 自适应断言
// （agent.test.mjs）基于小消息、预算永不触及——本条仅验预算路径本身与零变化回归。

/** SSE mock for compressIfNeeded 的摘要 LLM 调用（与 exploration-summary 测试同形）。 */
function mockSummaryServer(text) {
  return import("node:http").then(({ createServer }) => {
    const requests = []
    const server = createServer((req, res) => {
      let body = ""
      req.on("data", (c) => (body += c))
      req.on("end", () => {
        requests.push(body)
        res.writeHead(200, { "Content-Type": "text/event-stream" })
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: text } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          `data: [DONE]\n\n`,
        )
      })
    })
    return new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port, requests }))
    })
  })
}

/** provider with an explicit window override in K units（providerSpec 遵循 providers[].context，§9 随窗口）。 */
function ctxProvider(port, contextK) {
  return { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m", context: contextK }
}

/** 一条 assistant(tool_calls)→tool 配对；tool 结果为 `chars` 个 ASCII 字符（≈ chars/4 token）。 */
function toolPair(id, chars) {
  return [
    { role: "assistant", content: null, tool_calls: [{ id, type: "function", function: { name: "read", arguments: "{}" } }] },
    { role: "tool", tool_call_id: id, name: "read", content: "x".repeat(chars) },
  ]
}

/** `pre` 前缀 + user 引导 + nPairs 对工具配对的历史。 */
function toolDenseHistory(nPairs, chars, pre = []) {
  const h = [...pre, { role: "user", content: "go" }]
  for (let i = 1; i <= nPairs; i++) h.push(...toolPair(`call_${i}`, chars))
  return h
}

/** 预算测试专用 agent（纯估算路径：无实测基线 / tasks / planMode）。 */
function mkBudgetAgent(provider, history) {
  return { provider, history: [...history], _fullHistory: JSON.parse(JSON.stringify(history)), tasks: [], planMode: false }
}

/** 每条 tool 消息都必须能在机器线找到其 owner assistant 的 tool_calls。 */
function assertNoOrphanTools(history, label) {
  const ids = new Set()
  for (const m of history) {
    if (m.role === "assistant" && m.tool_calls) for (const tc of m.tool_calls) ids.add(tc.id)
  }
  for (const m of history) {
    if (m.role === "tool") assert.ok(ids.has(m.tool_call_id), `${label}: orphan tool message ${m.tool_call_id}`)
  }
}

test("T-DT1: 600K 工具密集超预算 → 压缩后 history 段 ≤ 窗口 15%（±5% 容差）", async () => {
  const { server, port } = await mockSummaryServer("ok")
  try {
    // 600K 窗口（context: 600 → 614,400）。120 对工具配对（tool 结果 10K ASCII ≈ 2500 tok）→
    // 241 条；候选尾 = ⌊241×0.4⌋ = 96 条 ≈ 120K ≫ 预算（614,400×0.15 − 1K ≈ 91K）；
    // 最近 10 条 ≈ 12.5K ≤ 预算 → 收紧可行（非保底场景）。
    const agent = mkBudgetAgent(ctxProvider(port, 600), toolDenseHistory(120, 10_000))
    const done = await compressIfNeeded(agent, 100)
    assert.equal(done, true)
    const est = estimateTokens(agent.history)
    assert.ok(est <= 614_400 * 0.15 * 1.05, `压缩后 history 段 ${est} ≤ 15% 窗口 +5% 容差（F1/D-T1）`)
    assert.ok(agent.history.length - 2 < 96, `tail 已按预算收紧（保留 ${agent.history.length - 2} 条 < 候选 96 条）`)
    assert.ok(agent.history.length - 2 >= 10, "tail 不低于保底 10 条")
    assertNoOrphanTools(agent.history, "T-DT1")
  } finally {
    server.close()
  }
})

test("T-DT2: 普通会话预算未超 → tailStart 与现状一致（零变化回归，F2）", () => {
  const h = makeHistory(20) // 40 条 ≈ 16 tok/条 — 预算 18.2K（128K 窗口）远未触及
  const agent = {
    provider: { baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m" },
    history: [...h], tasks: [], planMode: false,
  }
  assert.equal(compressFallback(agent), true)
  assert.equal(agent.history.length, 18, "note+ack+候选 16 条（⌊40×0.4⌋）——条数公式原样")
  assert.equal(agent.history[2].content, h[24].content, "tail 首条 = 原第 24 条——tailStart 未前移")
})

test("T-DT3: 保底优先——预算不足仍保 10 条原文；短历史保底 = min(10, 候选) 不破 40% cap（D-T2）", () => {
  const giantUsers = (n) => Array.from({ length: n }, (_, i) => ({ role: "user", content: `u${i} ` + "y".repeat(8000) }))
  // (a) 30 条巨型 user（~2001 tok/条）→ 候选 12 > 保底 10；10 条（~20K）仍超预算（64K 窗口 ≈ 8.8K）
  //     → 收紧扫到 floor 仍超 → 保底 10 条原文、接受超支
  const ha = giantUsers(30)
  const agentA = {
    provider: { baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m", context: 64 },
    history: [...ha], tasks: [], planMode: false,
  }
  assert.equal(compressFallback(agentA), true)
  assert.equal(agentA.history.length, 12, "note+ack+保底 10 条原文")
  assert.equal(agentA.history[2].content, ha[20].content, "保底尾首条 = 原第 20 条（原文逐字保留）")
  assert.ok(estimateTokens(agentA.history) > 65_536 * 0.15 - 1000, "10 条估算仍超预算——保底优先于预算")
  // (b) 短历史 20 条 <25：候选 = ⌊20×0.4⌋ = 8 < 10 → 保底 = min(10, 8) = 8（40% cap 原样，预算不介入）
  const hb = giantUsers(20)
  const agentB = {
    provider: { baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m", context: 64 },
    history: [...hb], tasks: [], planMode: false,
  }
  assert.equal(compressFallback(agentB), true)
  assert.equal(agentB.history.length, 10, "note+ack+8 条（候选原样，不破 40% cap）")
  assert.equal(agentB.history[2].content, hb[12].content, "tail 首条 = 原第 12 条——tailStart 未动")
})

test("T-DT4: 摘要 ~1K token 协同——压缩后 history 段仍 ≤ 15%+容差（§8 F3 不回归）", async () => {
  const { server, port } = await mockSummaryServer("摘".repeat(1000)) // ≈1000 token 的摘要（§8 目标上限）
  try {
    const agent = mkBudgetAgent(ctxProvider(port, 600), toolDenseHistory(120, 10_000))
    assert.equal(await compressIfNeeded(agent, 100), true)
    const est = estimateTokens(agent.history)
    assert.ok(est <= 614_400 * 0.15 * 1.05, `摘要 ~1K + tail 预算后仍 ≤ 15%+5%（实际 ${est}）`)
    assert.ok(agent.history[0].content.includes("摘"), "摘要正文落位（压缩注记 = 首条）")
  } finally {
    server.close()
  }
})

test("T-DT6a: pair-safe 边界——预算收紧不切在 assistant(tool_calls) 与其 tool 结果之间（评审 #2）", async () => {
  const { server, port } = await mockSummaryServer("ok")
  try {
    // 100K 窗口（预算 = 0.15×102,400 − 1K ≈ 14.4K）。第 13 对 assistant 带 40K ASCII 正文（~10K tok）：
    // 候选尾（16 条 ≈ 18K）超预算；切在 A13 之后（26 号位，tool_13）单独满足预算——但那是孤儿切点
    // （owner A13 进中段）。收紧必须跳过 tool 位置、上移到配对安全起点 A14（27 号位）。
    const h = [{ role: "user", content: "go" }]
    for (let i = 1; i <= 20; i++) {
      const isBig = i === 13
      h.push({
        role: "assistant",
        content: isBig ? "x".repeat(40_000) : null,
        tool_calls: [{ id: `call_${i}`, type: "function", function: { name: "read", arguments: "{}" } }],
      })
      h.push({ role: "tool", tool_call_id: `call_${i}`, name: "read", content: "x".repeat(4_000) })
    }
    const agent = mkBudgetAgent(ctxProvider(port, 100), h)
    const done = await compressIfNeeded(agent, 100)
    assert.equal(done, true)
    const firstTail = agent.history[2]
    assert.equal(firstTail.role, "assistant", "tail 首条不是 tool 消息（边界不在配对中间）")
    assert.equal(firstTail.tool_calls[0].id, "call_14", "边界上移到完整配对起点 A14（跳过孤儿切点 26 号位）")
    assertNoOrphanTools(agent.history, "T-DT6a")
    const est = estimateTokens(agent.history)
    assert.ok(est <= 14_360 + 500, `收紧后 tail 估算 ${est} ≤ 预算 + note 余量`)
  } finally {
    server.close()
  }
})

test("T-DT6b: 无 pair-safe 边界能满足预算 → 进保底 10 条且不产生 orphan（D5 回归）", () => {
  // 64K 窗口（预算 ≈ 8.8K）：tool 结果 8K ASCII（2K tok）→ 收紧扫到 floor（10 条 ≈ 10K）仍超预算
  // → 保底 10 条、接受超支；tail = 5 个完整配对（A16 起），无孤儿
  const h = [{ role: "user", content: "go" }]
  for (let i = 1; i <= 20; i++) h.push(...toolPair(`call_${i}`, 8_000))
  const agent = {
    provider: { baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m", context: 64 },
    history: [...h], tasks: [], planMode: false,
  }
  assert.equal(compressFallback(agent), true)
  assert.equal(agent.history.length, 12, "note+ack+保底 10 条")
  assert.equal(agent.history[2].role, "assistant", "floor 边界 = 配对安全起点（A16）")
  assertNoOrphanTools(agent.history, "T-DT6b")
  assert.ok(estimateTokens(agent.history) > 65_536 * 0.15 - 1000, "floor 估算仍超预算——保底优先、超支被接受")
})

test("T-DT7: 600K 工具密集压缩的摘要调用输入 ≤ 0.6×ctx − tail 预算（D-T3 输入界锁）", async () => {
  const { server, port, requests } = await mockSummaryServer("ok")
  try {
    // 巨型 user 消息（100×8K ASCII ≈ 200K tok）挤在中段（user 序列化 cap 8K 字符 = 2K tok/条）
    // + 工具密集尾段 68 对 ≈ 170K → 估算 ≈ 370K ≥ 阈值 370K 触发；tail 收紧到预算后中段最大
    const giantUsers = Array.from({ length: 100 }, (_, i) => ({ role: "user", content: `u${i} ` + "y".repeat(8000) }))
    const agent = mkBudgetAgent(ctxProvider(port, 600), toolDenseHistory(68, 10_000, giantUsers))
    assert.equal(await compressIfNeeded(agent, 370_000), true)
    assert.equal(requests.length, 1, "恰好一次摘要调用")
    const fullPrompt = JSON.parse(requests[0]).messages[0].content
    const serialized = fullPrompt.slice(SUMMARIZE_PROMPT.length)
    const bound = 0.6 * 614_400 - (0.15 * 614_400 - 1000) // 0.6×ctx − tail 预算 ≈ 277K
    const serializedEst = estimateText(serialized)
    assert.ok(serializedEst <= bound + 5000, `摘要输入 ${serializedEst} ≤ ${bound}（+5K 序列化标签容差）`)
  } finally {
    server.close()
  }
})







test("runAgent: 工具链末尾（last=tool）也是压缩安全点", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const bigNoop = {
    name: "noop",
    description: "noop",
    parameters: { type: "object", properties: {} },
    readonly: true,
    execute: async () => "x".repeat(400), // 100 token，增量推过阈值
  }
  // 主循环第 1 次调用 → 工具（带实测 usage 19950）；工具结果落尾（last=tool）→ 下一轮
  // 实测基线 19950 + 增量 100 = 20050 > 阈值 20000 → 触发压缩（第 2 次调用是摘要）；压缩后
  // 基线失效回到纯估算（历史 ~250 + system/tools 开销），低于 20000 → 第 3 次返回最终答案。
  // 阈值 20000（而非旧 8000）：纯估算含 systemPrompt+tools 开销（内部动态值——2026-08-31
  // discipline.md 路由总表 8KB 后开销 ~8-9K，旧 8000 阈值会在 turn 0 误触发压缩），留 11K
  // 余量使测试对 prompt 增长稳健；实测分支用 19950 保持"增量推过阈值"的比值不破。
  const script = [
    { toolCall: { name: "noop" }, usage: { prompt_tokens: 19950 } },
    { content: "这是摘要" },
    { content: "done" },
  ]
  const { server, port, requests } = await mockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-compress-tool-"))
    const agent = createAgent({ provider, tools: [bigNoop], config: { agent: { compactThreshold: 20000 } }, cwd })
    // 预填 12 条小消息：turn 0 纯估算（~150 + system/tools 开销）低于 20000，不提前压缩
    agent.history = Array.from({ length: 12 }, (_, i) => ({ role: "user", content: `消息 ${i} ` + "x".repeat(32) }))
    let compressed = 0
    const out = await runAgent(agent, "继续", { onCompress: () => compressed++ })
    assert.equal(out, "done")
    assert.equal(compressed, 1)
    assert.equal(requests.length, 3) // 主调用 + 摘要调用 + 主调用
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})



test("runAgent: 上下文压缩时触发 onCompress 回调", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  // 第 1 个请求是压缩摘要调用，第 2 个是主循环调用
  const script = [{ content: "摘要" }, { content: "done" }]
  const { server, port } = await mockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-compress-test-"))
    const agent = createAgent({ provider, tools: [], config: { agent: { compactThreshold: 10 } }, cwd })
    agent.history = Array.from({ length: 14 }, (_, i) => ({ role: "user", content: `历史消息 ${i} ` + "x".repeat(50) }))
    let compressed = 0
    const out = await runAgent(agent, "继续", { onCompress: () => compressed++ })
    assert.equal(out, "done")
    assert.equal(compressed, 1)
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})


// ---------------------------------------------------------------- 压缩可见性（CONTEXT-COMPACTION §7）

/** 压缩可见性测试共用的历史：12 条 × ~505 token，加上 system+tools 估算开销 ~9059
 *  → 首轮检查 ~15179 token（> threshold 10000 触发）；fallback 后 ~9248 回落不复发。
 *  模型 "m" → DEFAULT_SPEC 128K → keepTail = min(max(10,38), 40% 上限)。 */
function compressTestHistory() {
  return Array.from({ length: 12 }, (_, i) => ({ role: "user", content: `历史消息 ${i} ` + "x".repeat(2000) }))
}

/** 压缩面板接线测试的 TUI state 夹具（buildToolCallbacks 数据层所需字段）。 */
function mkCompressTuiState() {
  return {
    lines: [], subTasks: {}, tasks: [],
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
    reasoning: "", streaming: "", _advisorBlocks: [],
    currentTool: null, status: "", _lineIdCounter: 0,
  }
}

/** 用真实 tool-events 接线装配压缩回调（onCompressStart/onCompressFail/onCompress → 面板）。
 *  buildToolCallbacks 为动态 import（测试文件顶部不引 TUI 模块），经 _tuiWire 缓存。 */
let _tuiWire = null
async function wireCompressTui(agent, state) {
  _tuiWire ??= await import("../src/tui/tool-events.mjs")
  return _tuiWire.buildToolCallbacks({
    agent, state,
    pushLine: (text, color) => state.lines.push({ text, color }),
    render: () => {}, scheduleRender: () => {},
    ensureAssistantLabel: () => {},
    askPermission: async () => true, askQuestion: async () => null,
    saveSessionImpl: () => {},
  }).callbacks
}


test("T1 runAgent: 压缩开始时 onCompressStart 先于 onCompress 触发（摘要条数/释放 token/耗时）", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  // 第 1 个请求是压缩摘要调用（触发 onCompressStart→onCompress），第 2 个是主循环调用
  const script = [{ content: "摘要" }, { content: "done" }]
  const { server, port } = await mockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-compress-vis-"))
    const agent = createAgent({ provider, tools: [], config: { agent: { compactThreshold: 10000 } }, cwd })
    agent.history = compressTestHistory()
    const events = []
    const out = await runAgent(agent, "继续", {
      onCompressStart: (info) => events.push(["start", info]),
      onCompress: (info) => events.push(["compress", info]),
    })
    assert.equal(out, "done")
    assert.equal(events.length, 2, "start + compress 各一次（压缩后不再复发）")
    assert.equal(events[0][0], "start", "onCompressStart 先于 onCompress")
    assert.ok(events[0][1].messages >= 5, `summarizing N messages（N=${events[0][1].messages}）`)
    assert.equal(events[1][0], "compress")
    assert.equal(events[1][1].mode, "summary")
    assert.ok(events[1][1].tokensFreed > 0, `压缩释放 token 数 > 0（实际 ${events[1][1].tokensFreed}）`)
    assert.ok(events[1][1].elapsedMs >= 0, "耗时毫秒数存在")
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})



test("T2 TUI 接线: 压缩面板 进行中→完成冻结（Compressed: N tokens freed → summary (Xs)，可折叠载体）", async () => {
  const agent = { history: [], tasks: [], planMode: false }
  const state = mkCompressTuiState()
  const callbacks = await wireCompressTui(agent, state)
  // 开始态：面板区块出现（头部 Compressing… + summarizing N messages + 耗时基座）
  callbacks.onCompressStart({ messages: 9 })
  const running = Object.values(state.subTasks).find((s) => s.role === "compress")
  assert.ok(running, "压缩面板区块出现")
  const text = () => running.blocks.map((b) => b.text).join("")
  assert.match(text(), /Compressing context…/)
  assert.match(text(), /summarizing 9 messages/)
  assert.ok(Number.isFinite(running.started), "耗时 ticker 基座（started）")
  assert.equal(running.done, false)
  // 完成态：更新 + 冻结 + 释放 live 条目
  callbacks.onCompress({ mode: "summary", tokensFreed: 1234, elapsedMs: 12_345 })
  assert.equal(running.done, true)
  assert.match(text(), /Compressed: 1234 tokens freed → summary \(12s\)/)
  assert.equal(state.subTasks[running.key], undefined, "live 条目释放（冻结后不悬空）")
  const frozen = state.lines.find((l) => l._frozenSubTask?.role === "compress")
  assert.ok(frozen, "完成态冻结进会话流（可折叠保留，同子 agent 完成形态）")
  assert.ok(state._frozenSubKeys.has(running.key), "冻结 tombstone 防复活")
})



test("T3 runAgent: 压缩失败 onCompressFail 携带错误（单次失败不降级，计数 +1）", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  // 第 1 个请求是压缩摘要调用（400），第 2 个是主循环调用
  const script = [{ fail: 400 }, { content: "done" }]
  const { server, port } = await mockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-compress-fail-"))
    const agent = createAgent({ provider, tools: [], config: { agent: { compactThreshold: 10000 } }, cwd })
    agent.history = compressTestHistory()
    const fails = []
    let compressCalls = 0
    const out = await runAgent(agent, "继续", {
      onCompressFail: (e) => fails.push(e),
      onCompress: () => compressCalls++,
    })
    assert.equal(out, "done")
    assert.equal(fails.length, 1, "onCompressFail 触发一次")
    assert.match(fails[0].message, /400/, "错误文本可见（API error: HTTP 400）")
    assert.equal(compressCalls, 0, "未达阈值 → 不触发 onCompress（无降级）")
    assert.equal(agent._compressFailures, 1, "失败计数 +1 未达阈值")
    assert.ok(!agent.history[0].content.includes("truncated after repeated summarization failures"), "无降级说明")
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})



test("T3b runAgent: 连续 3 次失败 → compressFallback 实际运行（面板 进行中→失败→重试→降级说明）", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const noop = {
    name: "noop", description: "noop", parameters: { type: "object", properties: {} },
    readonly: true, execute: async () => "ok",
  }
  // 每轮：压缩摘要 400 → 主循环调 noop（保下一轮仍超阈值）→ 第 3 次失败后 fallback → 主循环收尾
  // 阈值档位：fallback 后检查必须低于阈值（不复发），首轮检查必须高于阈值——压缩 fixture 对
  // 工具 schema 变化天生敏感（纯估算路径含 depth-0 全工具 schema——context.mjs extras.tools——
  // setup.mjs 注记同源）。沿革：11000 →（read_history schema 入 depth-0 工具集 +~470 token
  // 越过刀锋，余量耗尽）→ 12500 →（2026-09-03 §19.5.5 D-CL1 cancel 描述尾句 +~330 字符
  // ≈ +85 token 再越 12500 刀锋——fallback 后档位实测已漂至 ≈12600）→ 14000 重校准
  // （fallback 后 ≈12600、首轮 ≈15-17K——双面余量 ~1.1-2.4K）。
  // 阈值曾为 11000（fallback 后 ~10910，余 90 token）时 read_history schema 抬升 ~470 token
  // 即越线——任何 tool schema 文本增删都要重跑本测试。
  const script = [
    { fail: 400 }, { toolCall: { name: "noop" } },
    { fail: 400 }, { toolCall: { name: "noop" } },
    { fail: 400 }, { toolCall: { name: "noop" } },
    { content: "done" },
  ]
  const { server, port } = await mockLLM(script)
  const origError = console.error
  const errLogs = []
  console.error = (...a) => errLogs.push(a.join(" "))
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-compress-fallback-"))
    const agent = createAgent({ provider, tools: [noop], config: { agent: { compactThreshold: 14000 } }, cwd })
    agent.history = compressTestHistory()
    const state = mkCompressTuiState()
    const callbacks = await wireCompressTui(agent, state)
    const out = await runAgent(agent, "继续", callbacks)
    assert.equal(out, "done")
    assert.equal(agent._compressFailures, 0, "达阈值后计数重置")
    assert.ok(agent.history[0].content.includes("truncated after repeated summarization failures"), "compressFallback 实际运行（FALLBACK_NOTE 在历史首条）")
    // 面板最终态：3× 进行中 + 3× 失败（仅错误，无降级）+ 1× 降级说明
    const frozen = state.lines.find((l) => l._frozenSubTask?.role === "compress")
    assert.ok(frozen, "面板冻结进会话流")
    const text = frozen._frozenSubTask.blocks.map((b) => b.text).join("")
    assert.equal((text.match(/Compressing context…/g) ?? []).length, 3, "每次 onCompressStart 回到进行中")
    assert.equal((text.match(/Compression failed: [^\n]*400/g) ?? []).length, 3, "3 次失败错误文本可见（不含降级说明）")
    assert.ok(!text.includes("tokens freed"), "失败路径无 LLM 摘要完成态")
    assert.match(text, /Compression failed — fallback: truncated to \d+ messages/, "第 3 次失败后降级说明出现")
    assert.equal(errLogs.filter((l) => l.includes("compression failed") && l.includes("400")).length, 3, "console.error 同步落（诊断可追踪）")
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    console.error = origError
    server.close()
  }
})



test("T4 runAgent: 无 callbacks 环境压缩不崩（回调缺省 no-op）", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const script = [{ content: "摘要" }, { content: "done" }]
  const { server, port } = await mockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-compress-nocb-"))
    const agent = createAgent({ provider, tools: [], config: { agent: { compactThreshold: 10000 } }, cwd })
    agent.history = compressTestHistory()
    const out = await runAgent(agent, "继续") // 无 callbacks —— onCompressStart/onCompressFail/onCompress 全缺省
    assert.equal(out, "done")
    assert.ok(agent.history[0].content.includes("[Context was automatically compacted"), "压缩照常完成（headless 安全）")
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})

