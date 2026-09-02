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
