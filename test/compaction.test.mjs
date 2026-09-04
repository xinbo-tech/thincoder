/**
 * compaction.test.mjs — context compaction — model-aware threshold / §9 tail-token budget / V4 visibility (T-C, T-DT, D-C).
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

describe("compaction — threshold is model-aware", () => {
  it("does not compact below 60% of context", async () => {
    const cwd = setupTempDir()
    try {
      const messages = []
      // Create messages totaling ~50K estimated tokens for a 1M model
      for (let i = 0; i < 200; i++) {
        messages.push({ role: "user", content: `test ${i} `.repeat(40) })
        messages.push({ role: "assistant", content: `response ${i} `.repeat(30) })
      }

      // 1M model: threshold = 600K — 50K should not trigger
      const result = await compactHistory(messages, "system prompt", mockProvider("deepseek-v4-pro"))
      assert.equal(result, null, "50K tokens on 1M model should not compact")
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("compacts when over threshold", async () => {
    const cwd = setupTempDir()
    const { server, port } = await mockLLMServer()
    try {
      const messages = []
      // Create many large messages to force compaction on default 128K model
      for (let i = 0; i < 600; i++) {
        messages.push({ role: "user", content: `test message number ${i} `.repeat(80) })
        messages.push({ role: "assistant", content: `response number ${i} `.repeat(60) })
      }

      // Default model = 128K, threshold = 76.8K. Large messages should trigger.
      const result = await compactHistory(
        messages, "system prompt",
        mockProvider("unknown-model", port),
      )
      assert.notEqual(result, null, "should trigger compaction")
      assert.ok(result.some((m) => m.content?.includes("compacted")), "should have compaction notice")
      assert.ok(result.some(m => m.role === "assistant"), "should have assistant ack")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("T-C2: providers[].context 覆盖后压缩阈值跟随（128K 覆盖 → 触发；同消息在 1M spec 下不触发）", async () => {
    const cwd = setupTempDir()
    const { server, port } = await mockLLMServer()
    try {
      const messages = []
      for (let i = 0; i < 600; i++) {
        messages.push({ role: "user", content: `test message number ${i} `.repeat(80) })
        messages.push({ role: "assistant", content: `response number ${i} `.repeat(60) })
      }

      // 同批消息 ~90K tokens：1M spec 阈值 600K 不触发；providers[].context=128
      // （128K 覆盖）阈值 = 131072×0.6 ≈ 76.8K → 触发（PROVIDER.md §15 T-C2）。
      const noOverride = await compactHistory(messages, "system prompt", mockProvider("deepseek-v4-pro", port))
      assert.equal(noOverride, null, "1M spec (no override): 90K must NOT trigger")

      const overridden = await compactHistory(
        messages, "system prompt",
        { ...mockProvider("deepseek-v4-pro", port), context: 128 },
      )
      assert.notEqual(overridden, null, "128K override: same messages MUST trigger")
      assert.ok(overridden.some((m) => m.content?.includes("compacted")), "压缩提示存在")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("preserves tool_call—tool_response pairing", async () => {
    const cwd = setupTempDir()
    const { server, port } = await mockLLMServer()
    try {
      // Create a conversation with tool calls at the boundary
      const messages = []
      for (let i = 0; i < 500; i++) {
        messages.push({ role: "user", content: `msg ${i} `.repeat(80) })
        messages.push({ role: "assistant", content: `resp ${i} `.repeat(60) })
      }
      // Add tool call + response pair at the end
      messages.push({
        role: "assistant",
        content: "let me check",
        tool_calls: [{ id: "tool_1", type: "function", function: { name: "read", arguments: "{}" } }],
      })
      messages.push({ role: "tool", tool_call_id: "tool_1", content: "file content here" })
      messages.push({ role: "assistant", content: "I see the file" })

      const result = await compactHistory(
        messages, "system prompt",
        mockProvider("unknown-model", port),
      )
      assert.notEqual(result, null, "should compact")
      // The tool response should be in the tail (not summarized)
      const hasToolResponse = result.some(
        m => m.role === "tool" && m.tool_call_id === "tool_1"
      )
      assert.ok(hasToolResponse, "tool response should survive compaction")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("KEEP_HEAD=0: early tool_calls messages enter the serialization (no orphan tool messages)", async () => {
    const cwd = setupTempDir()
    const { server, port, requests } = await mockLLMServer()
    try {
      // KEEP_HEAD=0: the head is EMPTY — an early assistant with tool_calls (and its
      // tool response) both land in the middle and are serialized as TEXT with a
      // tool-name marker, not preserved as a raw pair (CLI parity — no orphan risk).
      const messages = [
        { role: "user", content: "最初需求" },
        { role: "assistant", content: null, tool_calls: [{ id: "call_1", type: "function", function: { name: "read", arguments: "{}" } }] },
        { role: "tool", tool_call_id: "call_1", content: "结果" },
      ]
      for (let i = 0; i < 500; i++) {
        messages.push({ role: "user", content: `msg ${i} `.repeat(80) })
        messages.push({ role: "assistant", content: `resp ${i} `.repeat(60) })
      }
      const result = await compactHistory(messages, "system prompt", mockProvider("unknown-model", port))
      assert.notEqual(result, null, "should compact")
      // The compaction note is the FIRST message (no verbatim head is kept)
      assert.match(result[0].content, /compacted/)
      // The early tool_calls pair entered the summary serialization with the tool-name marker
      assert.match(requests[0] ?? "", /\[assistant\] \[called tools: read\]/, "early tool_calls message must be serialized")
      // No orphan tool messages: every tool message still has its assistant caller
      const byId = new Map()
      for (const m of result) {
        if (m.role === "assistant" && m.tool_calls) for (const tc of m.tool_calls) byId.set(tc.id, true)
      }
      for (const m of result) {
        if (m.role === "tool") assert.ok(byId.has(m.tool_call_id), `orphan tool message: ${m.tool_call_id}`)
      }
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("multimodal message text is extracted into the serialization (CLI parity)", async () => {
    const cwd = setupTempDir()
    const { server, port, requests } = await mockLLMServer()
    try {
      const messages = [
        { role: "user", content: [{ type: "text", text: "看这张图并修复问题" }, { type: "image_url", image_url: { url: "data:image/png;base64,xx" } }] },
      ]
      for (let i = 0; i < 500; i++) {
        messages.push({ role: "user", content: `msg ${i} `.repeat(80) })
        messages.push({ role: "assistant", content: `resp ${i} `.repeat(60) })
      }
      const result = await compactHistory(messages, "system prompt", mockProvider("unknown-model", port))
      assert.notEqual(result, null, "should compact")
      assert.match(requests[0] ?? "", /看这张图并修复问题/, "multimodal text part must survive into the summary serialization")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("pure-estimation path counts the tools schema overhead (CLI parity)", async () => {
    const cwd = setupTempDir()
    const { server, port } = await mockLLMServer()
    try {
      const messages = []
      for (let i = 0; i < 14; i++) messages.push({ role: "user", content: `m${i} ` + "x".repeat(4) })
      // ~28 history + ~15 system tokens is far below the explicit threshold 500…
      const noTrigger = await compactHistory(messages, "system prompt", mockProvider("unknown-model", port), 500)
      assert.equal(noTrigger, null, "without the schema overhead the estimate stays below threshold")
      // …but a large tools schema pushes the pure-estimation total over it.
      const bigSchema = Array.from({ length: 20 }, (_, i) => ({ name: `tool_${i}_` + "x".repeat(300), parameters: { type: "object" } }))
      const result = await compactHistory(messages, "system prompt", mockProvider("unknown-model", port), 500, null, bigSchema)
      assert.notEqual(result, null, "tools schema overhead must trigger compaction")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("abort signal cancels the in-flight summary request (Stop must not wait)", async () => {
    const { createServer } = await import("node:http")
    // A server that accepts but NEVER responds — simulates a slow summarization model.
    const hanging = createServer(() => {})
    await new Promise((r) => hanging.listen(0, "127.0.0.1", r))
    try {
      const port = hanging.address().port
      const messages = []
      for (let i = 0; i < 600; i++) {
        messages.push({ role: "user", content: `test ${i} `.repeat(80) })
        messages.push({ role: "assistant", content: `resp ${i} `.repeat(60) })
      }
      const ctrl = new AbortController()
      const p = compactHistory(messages, "system", mockProvider("unknown-model", port), 500, null, null, ctrl.signal)
      await new Promise((r) => setTimeout(r, 80))  // let the request reach the server
      ctrl.abort()
      const t0 = Date.now()
      await assert.rejects(p, (e) => e.name === "AbortError", "abort must reject with AbortError")
      assert.ok(Date.now() - t0 < 2000, "abort must cancel the request immediately, not wait for the summary")
    } finally {
      hanging.close()
    }
  })

  it("handles empty history gracefully", async () => {
    const result = await compactHistory([], "system", mockProvider())
    assert.equal(result, null)
  })

  it("handles single message gracefully", async () => {
    const result = await compactHistory(
      [{ role: "user", content: "hi" }],
      "system",
      mockProvider(),
    )
    assert.equal(result, null)
  })

  it("no provider throws — caller degrades via truncateFallback (heuristic summary deprecated)", async () => {
    const cwd = setupTempDir()
    try {
      const messages = []
      for (let i = 0; i < 600; i++) {
        messages.push({ role: "user", content: `test ${i} `.repeat(80) })
        messages.push({ role: "assistant", content: `resp ${i} `.repeat(60) })
      }
      await assert.rejects(
        () => compactHistory(messages, "system", null),
        /no provider available/,
        "null provider must throw so the caller can count failures and degrade",
      )
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("measured baseline triggers compaction even when estimation is below threshold", async () => {
    const cwd = setupTempDir()
    const { server, port } = await mockLLMServer()
    try {
      const messages = []
      for (let i = 0; i < 14; i++) {
        messages.push({ role: "user", content: `m${i} ` + "x".repeat(4) }) // ~28 tokens total
      }
      // Pure estimation (~28 + system) is far below threshold 500 — but the measured
      // baseline 10_000 + appended messages exceeds it, so compaction must trigger.
      const result = await compactHistory(messages, "system prompt", mockProvider("unknown-model", port), 500, {
        lastPromptTokens: 10_000,
        usageAtLen: 0,
      })
      assert.notEqual(result, null, "measured baseline must trigger compaction")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("truncateFallback drops the middle deterministically (no LLM call)", () => {
    const history = []
    for (let i = 0; i < 40; i++) {
      history.push({ role: "user", content: `消息 ${i}` })
      history.push({ role: "assistant", content: `回复 ${i}` })
    }
    const out = truncateFallback(history, mockProvider("deepseek-v4-pro"))
    assert.ok(out, "should truncate")
    assert.ok(out.length < history.length, "result must be shorter")
    // KEEP_HEAD=0: the blunt note is the FIRST message — no verbatim head is kept
    assert.match(out[0].content, /truncated/)
    assert.ok(!out.some((m) => m.content.includes("消息 0")), "earliest message is NOT kept verbatim (KEEP_HEAD=0)")
    assert.ok(out.some((m) => m.content.includes("回复 39")), "tail kept")
  })

  it("shrinkOversized truncates a single giant user/tool message body", () => {
    const history = [
      { role: "user", content: "需求" },
      { role: "user", content: "开".repeat(60_000) },
      { role: "assistant", content: "收到" },
      { role: "tool", tool_call_id: "c1", content: "结果 " + "y".repeat(20_000) },
      { role: "user", content: "继续" },
    ]
    const out = shrinkOversized(history)
    assert.ok(out, "should shrink")
    assert.ok(out[1].content.length < 7_000, "giant user message truncated")
    assert.ok(out[1].content.includes("truncated"), "stub marker present")
    assert.equal(out[3].tool_call_id, "c1", "tool_call_id untouched (no protocol 400 risk)")
    assert.ok(out[3].content.length < 7_000, "giant tool result truncated")
  })

  it("401 with sk-kimi- key hints at the Kimi two-platform mismatch (IK5VGJ)", async () => {
    const { chat } = await import("../src/provider.mjs")
    const origFetch = globalThis.fetch
    globalThis.fetch = async () => ({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: { message: "invalid api key" } }),
    })
    try {
      // Kimi For Coding key on a non-kimi endpoint → hint appended
      await assert.rejects(
        () => chat({ baseURL: "https://api.moonshot.cn/v1", apiKey: "sk-kimi-abc", model: "k3" }, {
          messages: [{ role: "user", content: "hi" }],
        }),
        /Kimi|Moonshot/,
        "401 with sk-kimi- key must hint at the two-platform mismatch",
      )
      // Plain key on a plain endpoint → bare message preserved
      const err = await chat({ baseURL: "https://api.other.com/v1", apiKey: "sk-abc", model: "m" }, {
        messages: [{ role: "user", content: "hi" }],
      }).then(() => null, (e) => e)
      assert.ok(!/tip: Kimi/.test(err.message), "non-Kimi 401 keeps the bare message")
    } finally {
      globalThis.fetch = origFetch
    }
  })
})

/** ASCII/4 + 非 ASCII/1（compact.mjs estimateText parity，测试侧实现）。 */
const estText = (s) => {
  let na = 0
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) > 0x7f) na++
  return Math.ceil((s.length - na) / 4) + na
}

/** 消息数组估算（compact.mjs estimateTokens parity：content/reasoning/tool_calls 计入）。 */
const estMsgs = (msgs) =>
  msgs.reduce((t, m) => {
    if (typeof m.content === "string") t += estText(m.content)
    else if (Array.isArray(m.content)) for (const p of m.content) if (p?.type === "text") t += estText(p.text)
    if (typeof m.reasoning_content === "string") t += estText(m.reasoning_content)
    for (const tc of m.tool_calls ?? []) t += estText(tc.function?.name ?? "") + estText(tc.function?.arguments ?? "")
    return t
  }, 0)

/** 文本对：user 499 字符（125 tok）+ assistant 400 字符（100 tok）→ 每对 225 tok（全 ASCII 估算精确）。 */
const estPair = (i) => [
  { role: "user", content: "u".repeat(495) + String(i).padStart(4, "0") },
  { role: "assistant", content: "a".repeat(400) },
]

describe("§9 tail token 预算（CONTEXT-COMPACTION §9 D-T1..T7 + T-DT8 倒序配对增强）", () => {
  it("T-DT1/T-DT7/T-DT4: 600K 场景 → 压缩后段估算 ≤15% 窗口；摘要输入 ≤ 0.6×ctx − tail 预算；摘要指令带 ≤1K 句", async () => {
    const cwd = setupTempDir()
    const { server, port, requests } = await mockLLMServer()
    try {
      // providers[].context 600K 覆盖 → 窗口 614_400；阈值 0.6 = 368_640；预算 = 0.15 − 1100 = 91_060
      const provider = { ...mockProvider("unknown-model", port), context: 600 }
      const W = 614_400
      const history = []
      for (let i = 0; i < 830; i++) history.push(...estPair(i)) // mid 830×225 = 186_750
      for (let i = 0; i < 184; i++) history.push({ role: "assistant", content: "t".repeat(4000) }) // tail 候选 184×1000 = 184_000
      // 总量 370_750 ≥ 368_640 触发；keepCount = floor(614.4K/100K×30) = 184；tail 超预算 → 裁剪
      const agent = {}
      const result = await compactHistory(history, "system", provider, null, null, null, null, null, agent)
      assert.notEqual(result, null, "应触发压缩")
      // 裁剪循环确定性：91 条 × 1000 = 91_000 ≤ 91_060（下一裁剪点 92_000 超）
      assert.equal(result.length, 2 + 91, `tail 184 → 91 条（实际 ${result.length - 2}）`)
      const tailEst = estMsgs(result.slice(2))
      assert.ok(tailEst <= Math.floor(W * 0.15) - 1100 && tailEst > Math.floor(W * 0.15) - 2100, `tail 估算 ${tailEst} 落在预算内（最小裁剪）`)
      const seg = estMsgs(result)
      assert.ok(seg <= W * 0.15, `压缩后 history 段估算 ${seg} ≤ 窗口 15%（${W * 0.15}，±5% 容差内）`)
      assert.ok(agent._lastCompressInfo.tokensFreed > 0, "释放 token 数可见")
      // T-DT7（D-T3）：摘要调用输入 ≤ 0.6×ctx − tail 预算（不超模型窗口）
      const bound = 0.6 * W - (Math.floor(W * 0.15) - 1100)
      assert.ok(estText(requests[0]) <= bound, `摘要输入 ${estText(requests[0])} ≤ 声明界 ${bound}`)
      // T-DT4 协同（§8）：同一压缩的摘要指令携带 ≤1K 目标句
      assert.match(requests[0], /~1K tokens/, "摘要请求体含 §8 ≤1K 目标句")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("T-DT2: 普通会话预算未超 → tailStart 与现状完全一致（零变化回归）", async () => {
    const cwd = setupTempDir()
    const { server, port } = await mockLLMServer()
    try {
      const provider = mockProvider("unknown-model", port) // 128K：阈值 76_800，预算 18_100
      const history = []
      for (let i = 0; i < 400; i++) history.push(...estPair(i)) // 90_000 ≥ 阈值
      // keepCount = min(max(10, 38), 0.4×800) = 38；tail 38×225 = 8_550 ≤ 预算 → 不裁剪
      const result = await compactHistory(history, "system", provider)
      assert.notEqual(result, null, "应触发压缩")
      assert.equal(result.length, 2 + 38, "tail 保持 count 公式位置（38 条）")
      assert.deepEqual(
        result.slice(2).map((m) => m.content),
        history.slice(800 - 38).map((m) => m.content),
        "tail 逐条与压缩前一致——预算未超时行为零变化",
      )
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("T-DT3a: 预算不足以保 10 条 → 保底 10 条原文（超支接受）", async () => {
    const cwd = setupTempDir()
    const { server, port } = await mockLLMServer()
    try {
      const provider = { ...mockProvider("unknown-model", port), context: 64 } // 65_536：阈值 39_321
      const history = []
      for (let i = 0; i < 100; i++) history.push(...estPair(i)) // 22_500
      for (let i = 0; i < 19; i++) history.push({ role: "assistant", content: "t".repeat(4000) }) // 19×1000
      // 总量 41_500 ≥ 阈值；keepCount = min(max(10, 19), 0.4×219 = 87) = 19
      // 预算 = 9_830 − 1100 = 8_730：19 条 19K 超、10 条 10K 仍超 → 无边界满足 → 保底 10
      const result = await compactHistory(history, "system", provider)
      assert.notEqual(result, null, "应触发压缩")
      assert.equal(result.length, 2 + 10, "保底 10 条原文（floor = len − 10）")
      assert.deepEqual(
        result.slice(2).map((m) => m.content),
        history.slice(219 - 10).map((m) => m.content),
        "最近 10 条原文保底保留",
      )
      assert.ok(estMsgs(result.slice(2)) > 0.15 * 65_536, "15% 目标让位于保底（超支被接受）")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("T-DT3b: 短历史（候选 <10）→ 预算逻辑不触发（保底上限 = 候选条数，不突破 40% cap）", async () => {
    const cwd = setupTempDir()
    const { server, port } = await mockLLMServer()
    try {
      const provider = { ...mockProvider("unknown-model", port), context: 64 } // 阈值 39_321
      const history = []
      for (let i = 0; i < 10; i++) {
        history.push({ role: "user", content: "u".repeat(8000) }) // 2000 tok
        history.push({ role: "assistant", content: "a".repeat(8000) }) // 2000 tok
      }
      // 总量 40_000 ≥ 阈值；len 20 → keepCount = min(19, 0.4×20 = 8) = 8 < 10 → 无预算逻辑
      // tail 8×2000 = 16_000 远超预算 8_730 仍保留（40% cap 是短历史唯一约束）
      const result = await compactHistory(history, "system", provider)
      assert.notEqual(result, null, "应触发压缩")
      assert.equal(result.length, 2 + 8, "tail 保持 8 条候选（未被预算砍）")
      assert.deepEqual(
        result.slice(2).map((m) => m.content),
        history.slice(12).map((m) => m.content),
        "候选尾完整保留（防压缩了个寂寞）",
      )
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("T-DT6: 预算裁剪只落 pair-safe 边界——tool 位跳过、整对同切，无 orphan（D5 回归）", async () => {
    const cwd = setupTempDir()
    const { server, port, requests } = await mockLLMServer()
    try {
      const provider = mockProvider("unknown-model", port) // 128K：预算 18_100
      const history = []
      for (let i = 0; i < 300; i++) history.push(...estPair(i)) // 67_500
      // tail 38 条：头部 = assistant(tool X)（500 字符 ≈127 tok）→ tool X 结果（50 tok）→ 36 条 × 2000 字符（500 tok）
      history.push({
        role: "assistant",
        content: "x".repeat(500),
        tool_calls: [{ id: "tX", type: "function", function: { name: "read", arguments: "{}" } }],
      })
      history.push({ role: "tool", tool_call_id: "tX", name: "read", content: "t".repeat(200) })
      for (let i = 0; i < 36; i++) history.push({ role: "assistant", content: "t".repeat(2000) })
      // 总量 ≈ 85_700 ≥ 76_800；tail ≈ 18_177 > 预算；裸切在 q=601（tool 位）估 18_050 ≤ 预算——
      // 若允许 orphan 会停在那；pair-safe 跳过 → q=602（36 条大消息整对进摘要）
      const result = await compactHistory(history, "system", provider)
      assert.notEqual(result, null, "应触发压缩")
      assert.equal(result.length, 2 + 36, "边界跳过 tool 位，落在配对之后的 36 条")
      assert.ok(!result.some((m) => m.role === "tool"), "无 orphan tool 留在 tail（整对进摘要）")
      assert.match(requests[0], /\[assistant\] \[called tools: read\]/, "配对（owner + 结果）序列化进摘要材料")
      const tailEst = estMsgs(result.slice(2))
      assert.ok(tailEst <= 0.15 * 128_000, `tail 估算 ${tailEst} ≤ 15% 窗口`)
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("T-DT8: 预算收紧 × 倒序配对——不停在倒序 assistant 位（results 已切），边界落安全位；tail 无悬空 tool_calls", async () => {
    // 不变式（发送 400 防护）：tail 内每个 assistant(tool_calls) 声明的 id 都须有对应 tool 结果
    const assertNoDangling = (tailMsgs) => {
      const haveIds = new Set(tailMsgs.filter((m) => m.role === "tool").map((m) => m.tool_call_id))
      for (const m of tailMsgs) {
        if (m.role !== "assistant" || !m.tool_calls?.length) continue
        for (const tc of m.tool_calls) {
          assert.ok(haveIds.has(tc.id), `tail 内 assistant 声明的 tool_call ${tc.id} 无对应 tool 结果（悬空 → 400）`)
        }
      }
    }
    // 场景 A（主循环收紧）：倒序配对 [tool tX, assistant(tX)] 在候选尾头部，预算拟合点恰在 assistant
    // 位——修复前停在此（tX 结果已切进中段 → 悬空）；修复后 callsGapAfter 判据跳过 → 边界落在其后
    {
      const { server, port, requests } = await mockLLMServer()
      try {
        const provider = mockProvider("unknown-model", port) // 128K：预算 = 0.15×128K − 1100 = 18_100
        const history = []
        for (let i = 0; i < 300; i++) history.push(...estPair(i)) // mid 67_500
        history.push({ role: "tool", tool_call_id: "tX", name: "read", content: "t".repeat(300) }) // 75 tok —— tool 结果块在 assistant 前（倒序）
        history.push({
          role: "assistant",
          content: "x".repeat(500), // 125 tok
          tool_calls: [{ id: "tX", type: "function", function: { name: "read", arguments: "{}" } }],
        }) // +2 tok
        for (let i = 0; i < 36; i++) history.push({ role: "assistant", content: "t".repeat(1992) }) // 36×498 tok
        // tail 候选 38 条 = 18_130 > 预算 → 收紧；q=601（倒序 assistant 位）cut 75 → 18_055 拟合——
        // 悬空点；跳过 → q=602 拟合（17_928），tail = 36 条
        const result = await compactHistory(history, "system", provider)
        assert.notEqual(result, null, "应触发压缩")
        assert.equal(result.length, 2 + 36, "边界跳过倒序 assistant 位，落在其后安全位")
        assertNoDangling(result.slice(2))
        assert.match(requests[0], /\[tool\]/, "倒序配对的 tool 结果并入中段（摘要材料）")
        assert.match(requests[0], /\[assistant\] \[called tools: read\]/, "倒序配对的 assistant 并入中段——配对在中段序列化无害")
      } finally {
        server.close()
      }
    }
    // 场景 B（floor 回退）：保底边界（len−10）正落在倒序 assistant 位（其 results 在 len−11 已被切），
    // 预算无任何拟合位 → floor 回退——修复前回退只跳 tool 位、停在此 → 悬空；修复后继续回退到安全位
    {
      const { server, port } = await mockLLMServer()
      try {
        const provider = mockProvider("unknown-model", port)
        const history = []
        for (let i = 0; i < 300; i++) history.push(...estPair(i))
        for (let i = 0; i < 27; i++) history.push({ role: "assistant", content: "t".repeat(4000) }) // 27×1000
        history.push({ role: "tool", tool_call_id: "tX", name: "read", content: "t".repeat(300) }) // len−11
        history.push({
          role: "assistant",
          content: "x".repeat(500), // len−10 = floor 位
          tool_calls: [{ id: "tX", type: "function", function: { name: "read", arguments: "{}" } }],
        })
        for (let i = 0; i < 9; i++) history.push({ role: "assistant", content: "t".repeat(12_000) }) // 9×3000
        // tail ≈ 54_202：任意 q ≤ floor 的剩余都 > 18_100 → floor 回退；越过 628（倒序 assistant）与
        // 627（tool）→ 626 安全位——tail 12 条 ≥ 保底 10 条（按消息计数不变）
        const result = await compactHistory(history, "system", provider)
        assert.notEqual(result, null, "应触发压缩")
        assert.equal(result.length, 2 + 12, "floor 回退越过倒序 assistant 位到安全位（12 条 ≥ 10 条）")
        assertNoDangling(result.slice(2)) // tool tX 与 assistant(tX) 同在 tail 内——非空断言
      } finally {
        server.close()
      }
    }
  })
})

/** 构造超阈值历史（128K 模型 60% = 76.8K；600 条大消息远超）。 */
function oversizedHistory() {
  const messages = []
  for (let i = 0; i < 600; i++) {
    messages.push({ role: "user", content: `test message number ${i} `.repeat(80) })
    messages.push({ role: "assistant", content: `response number ${i} `.repeat(60) })
  }
  return messages
}

/** 脚本化 mock：主会话返回 tool_calls（前 2 轮）或 done，摘要请求返回 400。 */
function compressFailureServer() {
  return import("node:http").then(({ createServer }) => {
    const requests = []
    const server = createServer((req, res) => {
      let body = ""
      req.on("data", (c) => (body += c))
      req.on("end", () => {
        requests.push(body)
        const n = requests.length
        const isSummary = body.includes("conversation compressor") // SUMMARIZE_PROMPT 特征
        if (isSummary) {
          res.writeHead(400, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: { message: "invalid api key" } }))
          return
        }
        res.writeHead(200, { "Content-Type": "text/event-stream" })
        if (n < 6) {
          // 主会话前 2 轮：tool_calls（读不同路径，避免 stall 检测触发）
          const path = "x" + Math.floor((n + 1) / 2)
          const frame = { choices: [{ index: 0, finish_reason: "tool_calls", delta: { content: "", tool_calls: [{ index: 0, id: `t${n}`, type: "function", function: { name: "read", arguments: JSON.stringify({ path }) } }] } }] }
          res.end(`data: ${JSON.stringify(frame)}\n\ndata: [DONE]\n\n`)
          return
        }
        res.end(`data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: "done" } }] })}\n\n` + `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` + "data: [DONE]\n\n")
      })
    })
    return new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve({ server, requests, port: server.address().port }))
    })
  })
}

/** 400-响应 mock：每次请求都回 400（压缩摘要失败路径）。 */

describe("V4 压缩可见性（§7 D-C1/D-C3，VS Code 对齐形态）", () => {
  it("compactHistory: onCompressStart 在摘要调用前触发（messages 计数），完成后 agent._lastCompressInfo 落位", async () => {
    const cwd = setupTempDir()
    const { server, port, requests } = await mockLLMServer()
    try {
      const events = []
      const agent = {}
      const result = await compactHistory(
        oversizedHistory(), "system prompt", mockProvider("unknown-model", port), null, null, null, null,
        { onCompressStart: (i) => events.push(["start", i.messages]) },
        agent,
      )
      assert.notEqual(result, null, "应触发压缩")
      assert.equal(requests.length, 1)
      assert.ok(events.length === 1 && events[0][0] === "start", "onCompressStart 恰好一次")
      assert.ok(events[0][1] > 0, `summarizing N messages（N=${events[0][1]}）`)
      assert.equal(agent._lastCompressInfo.mode, "summary", "完成信息 mode=summary")
      assert.ok(agent._lastCompressInfo.tokensFreed > 0, `释放 token 数=${agent._lastCompressInfo.tokensFreed}`)
      assert.ok(agent._lastCompressInfo.elapsedMs >= 0, "耗时存在")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("compactHistory: 无 callbacks/agent 不崩（F4 回调缺省 no-op）", async () => {
    const cwd = setupTempDir()
    const { server, port } = await mockLLMServer()
    try {
      const result = await compactHistory(oversizedHistory(), "system prompt", mockProvider("unknown-model", port))
      assert.notEqual(result, null, "无回调环境压缩照常执行")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("runAgent: 压缩失败 → onCompressFail + console.error（不再静默）；3 次失败 → 降级截断 + onCompress(fallback)", async () => {
    const cwd = setupTempDir()
    const { server, port, requests } = await compressFailureServer()
    const errs = []
    const origError = console.error
    console.error = (...a) => errs.push(a.join(" "))
    const compressEvents = []
    try {
      const history = oversizedHistory()
      const opts = { history, fullHistory: [] }
      const out = await runAgent(mockProvider("unknown-model", port), cwd, "do it", {
        onCompressFail: (e) => compressEvents.push(["fail", e?.message ?? String(e)]),
        onCompress: (info) => compressEvents.push(["done", info?.mode]),
      }, undefined, true, opts)
      assert.equal(out, "done", "run 正常结束")
      // 3 轮压缩检查：每轮摘要 400 → onCompressFail；第 3 次失败后降级截断 → onCompress(mode=fallback)
      assert.equal(compressEvents.filter(([k]) => k === "fail").length, 3, "连续 3 次 onCompressFail")
      assert.ok(compressEvents.some(([k, mode]) => k === "done" && mode === "fallback"), "3 次失败后 onCompress 带 mode=fallback（降级说明）")
      assert.ok(errs.some((e) => e.includes("compression failed")), "console.error 落错误（Q3 不再静默）")
      // 降级截断真实发生：历史被 note + tail 替换
      const fallbackNote = history.findIndex((m) => typeof m.content === "string" && m.content.includes("truncated after repeated summarization"))
      assert.ok(fallbackNote >= 0, "降级 note 注入历史")
      // 摘要请求确实发了 3 次（其余为主会话）
      assert.equal(requests.filter((b) => b.includes("conversation compressor")).length, 3, "3 次摘要尝试")
    } finally {
      console.error = origError
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("runAgent: 压缩成功 → onCompress 带 mode=summary + 释放 token 数", async () => {
    const cwd = setupTempDir()
    const { server, port } = await mockLLMServer("这是摘要")
    const compressEvents = []
    try {
      const history = oversizedHistory()
      const out = await runAgent(mockProvider("unknown-model", port), cwd, "do it", {
        onCompress: (info) => compressEvents.push(info),
      }, undefined, true, { history, fullHistory: [] })
      assert.equal(out, "这是摘要", "mock 内容即最终回复")
      const done = compressEvents.filter((i) => i?.mode === "summary")
      assert.ok(done.length >= 1, "onCompress 触发（mode=summary）")
      assert.ok(done[0].tokensFreed > 0, "释放 token 数可见")
      assert.ok(done[0].elapsedMs != null, "耗时可见")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("runAgent: 无 onCompressStart/onCompressFail handler 不崩（headless/桥接 no-op）", async () => {
    const cwd = setupTempDir()
    const { server, port } = await mockLLMServer("这是摘要")
    try {
      const history = oversizedHistory()
      const out = await runAgent(mockProvider("unknown-model", port), cwd, "do it", {}, undefined, true, { history, fullHistory: [] })
      assert.equal(out, "这是摘要", "无回调环境压缩照常执行、run 正常返回")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })
})
