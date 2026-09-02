/**
 * agent.test.mjs — Agent infrastructure tests
 * Tests compaction, model specs, and tool error handling.
 * Full agent loop is tested via smoke-provider.mjs.
 * Run: node --test test/agent.test.mjs
 */
import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, existsSync, readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { tmpdir } from "node:os"
import { compactHistory, truncateFallback, shrinkOversized, summarizeRunExplorations, SUMMARIZE_PROMPT, EXPLORE_TOOLS } from "../src/compact.mjs"
import { specForModel, ctxPercentForModel, contextWindowForModel, providerSpec } from "../src/config.mjs"
import { _setConfigPathForTest } from "../src/config-io.mjs"
import { MAX_ADVISOR_PUSHBACKS, loadEngineeringPrompt } from "../src/agent/run-helpers.mjs"
import { pushModeReminders } from "../src/agent/setup-reminders.mjs"
import { runAgent } from "../src/agent.mjs"

// ─── Helpers ────────────────────────────────────────────────────

function setupTempDir() {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-test-"))
  mkdirSync(join(dir, ".thincoder"), { recursive: true })
  return dir
}

function mockProvider(model = "deepseek-v4-pro", port = null) {
  return { baseURL: port ? `http://127.0.0.1:${port}` : "https://api.test/v1", apiKey: "sk-test", model }
}

// ─── Model specs ────────────────────────────────────────────────

describe("model specs", () => {
  it("1M context models", () => {
    assert.equal(specForModel("deepseek-v4-pro").context, 1_000_000)
    assert.equal(specForModel("kimi-k3").context, 1_000_000)
    assert.equal(specForModel("glm-5.2").context, 1_000_000)
    assert.equal(specForModel("gpt-4.1").context, 1_000_000)
    assert.equal(specForModel("qwen3.8-max").context, 1_000_000)
    assert.equal(specForModel("MiniMax-M3").context, 1_000_000)
  })

  it("qwen3.7-max is text-only (DashScope 400 on images — CLI parity)", () => {
    // CLI config.mjs marks qwen3.7-max WITHOUT multimodal (it rejects image parts with
    // DashScope 400 "Unexpected item type in content"). A drift here (multimodal: true)
    // makes the extension send images to a model that refuses them — every request 400s.
    assert.equal(specForModel("qwen3.7-max").multimodal, undefined)
  })

  it("2M context model", () => {
    assert.equal(specForModel("gemini-2.5-pro").context, 2_000_000)
  })

  it("200K-500K context models", () => {
    assert.equal(specForModel("claude-sonnet-4").context, 200_000)
    assert.equal(specForModel("grok-4").context, 500_000) // grok-4.x family: 500K (xAI Grok 4.6 spec; was 1M, corrected 2026-08)
    assert.equal(specForModel("kimi-k2-retired-fallback").context, 128_000) // unknown ids → 128K default
  })

  it("maxOutput values are reasonable", () => {
    assert.equal(specForModel("deepseek-v4-pro").maxOutput, 384_000)
    assert.equal(specForModel("claude-sonnet-4").maxOutput, 32_000)
    assert.equal(specForModel("gemini-2.5-pro").maxOutput, 64_000)
  })

  it("unknown model defaults to 128K", () => {
    assert.equal(specForModel("some-fake-model").context, 128_000)
    assert.equal(specForModel("").context, 128_000)
    assert.equal(specForModel().context, 128_000)
  })

  it("prefix matching is case-insensitive", () => {
    assert.equal(specForModel("DEEPSEEK-V4-PRO").context, 1_000_000)
    assert.equal(specForModel("Kimi-K3").context, 1_000_000)
    assert.equal(specForModel("GLM-5.2").context, 1_000_000)
  })

  it("longest prefix wins (deepseek-v4-pro before deepseek-v4-flash)", () => {
    assert.equal(specForModel("deepseek-v4-pro").maxOutput, 384_000)
    assert.equal(specForModel("deepseek-v4-flash").context, 1_000_000) // official: dual v4 models both 1M
  })

  it("kimi-code preset + short ID k3 get the kimi-k3 spec (IK5VGJ)", async () => {
    const { PROVIDER_PRESETS } = await import("../src/config-io.mjs")
    const preset = PROVIDER_PRESETS["kimi-code"]
    assert.ok(preset, "kimi-code preset must exist")
    assert.equal(preset.baseURL, "https://api.kimi.com/coding/v1")
    assert.equal(preset.model, "k3")
    const s = specForModel("k3")
    assert.equal(s.context, 1_000_000, "k3 must get 1M context (not the 128K default)")
    assert.equal(s.multimodal, true, "k3 supports images — read_image must not be gated off")
    assert.equal(s.partialMode, true)
    assert.equal(s.reasoningEcho, "required")
    assert.equal(specForModel("kimi-k3").context, 1_000_000, "kimi-k3 itself unaffected")
  })

  it("glm-5.3-flash: 1M context / 128K output / multimodal / effort low-high-max (default max)", async () => {
    const s = specForModel("glm-5.3-flash")
    assert.equal(s.context, 1_000_000)
    assert.equal(s.maxOutput, 128_000)
    assert.equal(s.multimodal, true, "glm-5.3-flash is multimodal — read_image must not be gated off")
    assert.deepEqual(s.reasoningEffortEnum, ["low", "high", "max"])
    assert.equal(s.reasoningEffortDefault, "max")
    assert.equal(s.noUsageStream, true)
    assert.equal(s.thinkApi, "type", "thinking 始终开（thinking.type，不可关闭）")
    // 默认预设未动（方案 A：只加可用性，不惊动存量用户默认）
    const { PROVIDER_PRESETS } = await import("../src/config-io.mjs")
    assert.equal(PROVIDER_PRESETS.glm.model, "glm-5.2")
    assert.equal(PROVIDER_PRESETS["glm-code"].model, "glm-5.2")
  })

  it("unknown model name warns once, not per request (IK5VGJ)", () => {
    const warns = []
    const orig = console.warn
    console.warn = (...a) => warns.push(a.join(" "))
    try {
      const name = `no-such-model-${Date.now()}`
      assert.equal(specForModel(name).context, 128_000)
      assert.equal(specForModel(name).context, 128_000)
      assert.equal(warns.length, 1, "warn exactly once per model name")
      assert.ok(warns[0].includes(name))
    } finally {
      console.warn = orig
    }
  })

  it("ctxPercentForModel divides by the REAL spec context (1M models, not 128K)", () => {
    // Regression: the status bar read a non-existent `contextWindow` field and
    // fell back to 128K — a 1M-context model at 175K tokens showed "137%".
    // Provider-aware since PROVIDER.md §15: takes the provider object (context
    // override included), not the bare model name.
    assert.equal(ctxPercentForModel(175_000, { model: "deepseek-v4-pro" }), 18)
    assert.equal(ctxPercentForModel(1_000_000, { model: "deepseek-v4-pro" }), 100)
    assert.equal(ctxPercentForModel(200_000, { model: "deepseek-v4-pro" }), 20)
    assert.equal(contextWindowForModel("deepseek-v4-pro"), 1_000_000)
  })

  it("ctxPercentForModel returns null without token data and 128K for unknown models", () => {
    assert.equal(ctxPercentForModel(0, { model: "deepseek-v4-pro" }), null)
    assert.equal(ctxPercentForModel(null, { model: "deepseek-v4-pro" }), null)
    assert.equal(ctxPercentForModel(64_000, { model: `no-such-${Date.now()}` }), 50)  // 128K default window
  })

  it("T-C1: providerSpec 用 providers[].context（K 单位）覆盖 spec；specForModel 纯函数不受污染", () => {
    const p = { model: "deepseek-v4-pro", context: 128 }
    assert.equal(providerSpec(p).context, 131_072, "128K override → 128 × 1024")
    assert.equal(providerSpec(p).maxOutput, 384_000, "其余字段拷贝保留")
    assert.equal(specForModel("deepseek-v4-pro").context, 1_000_000, "specForModel 不受覆盖污染")
    // 未配置 → spec 值（T-C4 回归）
    assert.equal(providerSpec({ model: "deepseek-v4-pro" }).context, 1_000_000)
    assert.equal(providerSpec({ model: "deepseek-v4-pro", context: undefined }).context, 1_000_000)
    // 拷贝覆盖：每次返回独立对象，不共享可变状态
    const a = providerSpec(p)
    a.context = 1
    assert.equal(providerSpec(p).context, 131_072, "每次调用返回独立拷贝")
  })

  it("T-C3: context 非法值（0/负数/非数字/小数/带单位串）→ providerSpec 忽略，用 spec 值", () => {
    for (const bad of [0, -5, "abc", 1.5, "128k", null]) {
      assert.equal(
        providerSpec({ model: "deepseek-v4-pro", context: bad }).context,
        1_000_000,
        `invalid context ${JSON.stringify(bad)} must be ignored`,
      )
    }
  })

  it("T-C6: 显示跟随——ctxPercentForModel 用覆盖后的 provider 窗口", () => {
    // 覆盖 128K：65_536 tokens = 50%（1M spec 下只有 7%）
    assert.equal(ctxPercentForModel(65_536, { model: "deepseek-v4-pro", context: 128 }), 50)
    assert.equal(ctxPercentForModel(131_072, { model: "deepseek-v4-pro", context: 128 }), 100)
  })
})

// ─── Compaction ─────────────────────────────────────────────────

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

// ─── §9 tail token 预算（CONTEXT-COMPACTION §9 D-T1..T7，VS Code 语义） ───
// 测试侧估算与 src/compact.mjs 同口径（estimateText：ASCII/4 + 非 ASCII/1）。

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


// ─── V4（CONTEXT-COMPACTION §7 D-C1/D-C3）：压缩可见性回调 + 3 次失败降级 ───

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
function failingServer() {
  return import("node:http").then(({ createServer }) => {
    const requests = []
    const server = createServer((req, res) => {
      req.resume()
      req.on("end", () => {
        requests.push(1)
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: { message: "invalid api key" } }))
      })
    })
    return new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve({ server, requests, port: server.address().port }))
    })
  })
}
void failingServer // 保留供调试（未直接使用——V4 runAgent 失败路径用 compressFailureServer）

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


// ─── Tool execution edge cases ──────────────────────────────────

describe("tool edge cases", () => {
  it("read tool throws for nonexistent file", async () => {
    const { readTool } = await import("../src/tools/file.mjs")
    const cwd = setupTempDir()
    try {
      await assert.rejects(
        () => readTool.execute(
          { path: "nonexistent.txt" },
          { cwd, agent: {}, callbacks: {}, signal: undefined },
        ),
        (err) => err.code === "ENOENT" || err.message?.includes("no such file"),
        "should throw ENOENT",
      )
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("read tool reads existing file", async () => {
    const { readTool } = await import("../src/tools/file.mjs")
    const cwd = setupTempDir()
    try {
      writeFileSync(join(cwd, "hello.txt"), "Hello, World!")
      const result = await readTool.execute(
        { path: "hello.txt" },
        { cwd, agent: {}, callbacks: {}, signal: undefined },
      )
      assert.ok(typeof result === "string")
      assert.ok(result.includes("Hello, World!"), "should contain file content")
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("bash tool with invalid command returns error", async () => {
    const { bashTool } = await import("../src/tools/shell.mjs")
    const result = await bashTool.execute(
      { command: "nonexistent_command_xyz_123" },
      { cwd: process.cwd(), agent: {}, callbacks: {}, signal: undefined },
    )
    assert.ok(typeof result === "string")
    // Should contain some output (error message or exit code)
    assert.ok(result.length > 0, "should return output even for failed commands")
  })

  it("bash tool with valid command returns output", async () => {
    const { bashTool } = await import("../src/tools/shell.mjs")
    const cmd = process.platform === "win32" ? "echo hello" : "echo hello"
    const result = await bashTool.execute(
      { command: cmd },
      { cwd: process.cwd(), agent: {}, callbacks: {}, signal: undefined },
    )
    assert.ok(typeof result === "string")
    assert.ok(result.includes("hello"), "should contain echo output: " + result.slice(0, 50))
  })
})

describe("pending-task pushback fires at most once (CLI parity)", () => {
  it("one reminder per task-list state, then the model finishes", async () => {
    const http = await import("node:http")
    const { runAgent } = await import("../src/agent.mjs")
    const cwd = setupTempDir()
    const taskArgs = JSON.stringify({ items: [{ title: "T1", status: "pending" }] })
    const responses = [
      // Turn 1: model creates a pending task via the task tool
      [
        { choices: [{ index: 0, delta: { role: "assistant", tool_calls: [{ index: 0, id: "call_1", type: "function", function: { name: "task", arguments: taskArgs } }] } }] },
        { choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] },
      ],
      // Turn 2: model declares done → first pushback
      [
        { choices: [{ index: 0, delta: { content: "done" } }] },
        { choices: [{ index: 0, delta: {}, finish_reason: "stop" }] },
      ],
      // Turn 3: model declares done again → allowed to finish
      [
        { choices: [{ index: 0, delta: { content: "done" } }] },
        { choices: [{ index: 0, delta: {}, finish_reason: "stop" }] },
      ],
    ]
    const server = http.createServer((req, res) => {
      let body = ""
      req.on("data", (c) => (body += c))
      req.on("end", () => {
        res.writeHead(200, { "Content-Type": "text/event-stream" })
        const chunks = responses.shift() ?? []
        res.end(chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join("") + "data: [DONE]\n\n")
      })
    })
    await new Promise((r) => server.listen(0, "127.0.0.1", r))
    const port = server.address().port
    const history = []
    try {
      const result = await runAgent(
        mockProvider("deepseek-v4-pro", port), cwd, "do it", {}, undefined, true,
        { history, fullHistory: [] },
      )
      assert.equal(result, "done", "final reply surfaces")
      const reminders = history.filter((m) => typeof m.content === "string" && m.content.includes("you still have pending tasks"))
      assert.equal(reminders.length, 1, "pushed back exactly once: " + JSON.stringify(reminders))
      assert.ok(reminders[0].content.includes("only reminder"), "copy says it is the only reminder")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })
})

// ─── Advisor guard loop pushback (CLI parity, 2026-08-21) ─────────────
// The guard logic is INLINE in runAgent's loop (agent.mjs) — these tests drive
// the real loop through a scripted SSE server, so the extension's own copy of
// the pushback condition is covered without depending on the CLI side.

/** Scripted SSE server: serves `responses` (one chunk array per request) in order. */
async function scriptedServer(responses) {
  const http = await import("node:http")
  const server = http.createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      const chunks = responses.shift() ?? []
      res.end(chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join("") + "data: [DONE]\n\n")
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  return { server, port: server.address().port }
}

/** Turn that mutates code: one `write` tool call into src/ (triggers _mutatedThisRun + hasCodeMutations). */
function writeTurnChunks(file = "src/a.mjs") {
  const args = JSON.stringify({ path: file, content: "export const x = 1\n" })
  return [
    { choices: [{ index: 0, delta: { role: "assistant", tool_calls: [{ index: 0, id: "call_1", type: "function", function: { name: "write", arguments: args } }] } }] },
    { choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] },
  ]
}

/** Turn that declares done with no tool calls (end-of-run attempt). */
function doneTurnChunks() {
  return [
    { choices: [{ index: 0, delta: { content: "done" } }] },
    { choices: [{ index: 0, delta: {}, finish_reason: "stop" }] },
  ]
}

const ADVISOR_REMINDER = "MUST get an advisor review"

describe("advisor guard loop pushback (2026-08-21 semantic refactor)", () => {
  let cfgDir

  before(() => {
    cfgDir = mkdtempSync(join(tmpdir(), "thincoder-guard-"))
    _setConfigPathForTest(join(cfgDir, "config.json"))
  })

  after(() => {
    _setConfigPathForTest(null)
    rmSync(cfgDir, { recursive: true, force: true })
  })

  function setAdvisorConfig(advisor) {
    writeFileSync(join(cfgDir, "config.json"), JSON.stringify({ agent: { advisor } }))
  }

  it("guard default OFF: advisor {} + code mutation finishes without pushback", async () => {
    setAdvisorConfig({})
    const cwd = setupTempDir()
    const { server, port } = await scriptedServer([writeTurnChunks(), doneTurnChunks()])
    const history = []
    try {
      const { runAgent } = await import("../src/agent.mjs")
      const result = await runAgent(mockProvider("deepseek-v4-pro", port), cwd, "do it", {}, undefined, true, { history, fullHistory: [] })
      assert.equal(result, "done", "run finishes normally")
      const reminders = history.filter((m) => typeof m.content === "string" && m.content.includes(ADVISOR_REMINDER))
      assert.equal(reminders.length, 0, "no advisor reminder when guard is absent: " + JSON.stringify(reminders))
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("guard ON: advisor { guard: true } + code mutation without review is pushed back, then converges", async () => {
    setAdvisorConfig({ guard: true })
    const cwd = setupTempDir()
    // tool-call turn + (MAX_ADVISOR_PUSHBACKS pushbacks + 1 final acceptance) "done" turns
    const responses = [writeTurnChunks(), ...Array.from({ length: MAX_ADVISOR_PUSHBACKS + 1 }, doneTurnChunks)]
    const { server, port } = await scriptedServer(responses)
    const history = []
    try {
      const { runAgent } = await import("../src/agent.mjs")
      const result = await runAgent(mockProvider("deepseek-v4-pro", port), cwd, "do it", {}, undefined, true, { history, fullHistory: [] })
      assert.equal(result, "done", "the loop converges once the pushback budget is exhausted")
      const reminders = history.filter((m) => typeof m.content === "string" && m.content.includes(ADVISOR_REMINDER))
      assert.equal(reminders.length, MAX_ADVISOR_PUSHBACKS, "pushed back exactly MAX_ADVISOR_PUSHBACKS times: " + JSON.stringify(reminders))
      assert.ok(reminders[0].content.includes("round 1"), "first reminder names round 1 (advisorRound starts at 0)")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("engineering mode exemption: guard: true + engineering with design token finishes without pushback", async () => {
    setAdvisorConfig({ guard: true })
    const cwd = setupTempDir()
    const { server, port } = await scriptedServer([writeTurnChunks(), doneTurnChunks()])
    const history = []
    try {
      const { runAgent } = await import("../src/agent.mjs")
      const result = await runAgent(
        mockProvider("deepseek-v4-pro", port), cwd, "do it", {}, undefined, true,
        { history, fullHistory: [], engState: { enabled: true, engDesignToken: "test-token" } },
      )
      assert.equal(result, "done", "engineering mode finishes normally")
      const reminders = history.filter((m) => typeof m.content === "string" && m.content.includes(ADVISOR_REMINDER))
      assert.equal(reminders.length, 0, "engineering mode is exempt from the advisor guard: " + JSON.stringify(reminders))
      // The write went through (design token present) — the mutation really happened,
      // so the absence of a pushback proves the exemption, not a failed mutation.
      assert.ok(existsSync(join(cwd, "src", "a.mjs")), "code mutation landed on disk")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("legacy enabled does not trigger: advisor { enabled: true } finishes without pushback", async () => {
    setAdvisorConfig({ enabled: true })
    const cwd = setupTempDir()
    const { server, port } = await scriptedServer([writeTurnChunks(), doneTurnChunks()])
    const history = []
    try {
      const { runAgent } = await import("../src/agent.mjs")
      const result = await runAgent(mockProvider("deepseek-v4-pro", port), cwd, "do it", {}, undefined, true, { history, fullHistory: [] })
      assert.equal(result, "done", "run finishes normally")
      const reminders = history.filter((m) => typeof m.content === "string" && m.content.includes(ADVISOR_REMINDER))
      assert.equal(reminders.length, 0, "deprecated enabled field is not read anymore: " + JSON.stringify(reminders))
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })
})

// ─── Prompt borrowing increments (kimi-code comparison, 2026-08-21) ───
// 两端 src/prompts/ 必须 byte-identical（项目铁律）；①—③ 在本端断言内容，
// 两端 15 文件比对断言在 CLI 侧（thincoder/test/agent.test.mjs）。

const PROMPTS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "prompts")
const SRC_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src")

describe("prompt borrowing increments (kimi-code comparison)", () => {
  it("explore.md: Thoroughness levels — three levels with default", () => {
    const text = readFileSync(join(PROMPTS_DIR, "explore.md"), "utf8")
    assert.ok(text.includes("Thoroughness levels"), "section header present")
    const lines = text.split("\n")
    assert.ok(lines.some((l) => l.trim().startsWith("- quick")), "quick level present")
    const medium = lines.find((l) => /^- medium/.test(l.trim()))
    assert.ok(medium, "medium level present")
    assert.ok(/default/i.test(medium), `medium marked as default: ${medium}`)
    const thorough = lines.find((l) => /^- thorough/.test(l.trim()))
    assert.ok(thorough, "thorough level present")
    assert.ok(/NOT find/i.test(thorough), `thorough requires reporting what was not found: ${thorough}`)
  })

  it("main.md: Delegate well includes thoroughness guidance for explore delegation", () => {
    const text = readFileSync(join(PROMPTS_DIR, "main.md"), "utf8")
    assert.ok(text.includes("quick / medium / thorough"), "three levels named in main.md")
    assert.match(text, /Delegate well[\s\S]*thoroughness/, "guidance sits in the Delegate well section")
  })

  it("system.md: confirmation sentence names the most important acceptance criteria", () => {
    const text = readFileSync(join(PROMPTS_DIR, "system.md"), "utf8")
    const line = text.split("\n").find((l) => l.includes("Confirm understanding"))
    assert.ok(line, "Confirm understanding sentence exists")
    assert.ok(line.includes("most important acceptance criteria"), line)
    assert.ok(line.includes("Wait for confirmation"), "rest of the sentence preserved")
  })

  it("system.md: confirmed doc IS the contract — no silent mid-implementation downgrade (2026-08-30)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "system.md"), "utf8")
    assert.ok(text.includes("This binding is UNCONDITIONAL and does not wait for a formal confirmation round"), "binding is unconditional, no formal round needed")
    assert.ok(text.includes("every requirement the user states — mid-conversation, in a design doc, or in a confirmed plan — binds the moment it is stated"), "in-conversation requests bind immediately")
    assert.ok(text.includes("A stated request IS the contract"), "stated request = contract")
    assert.ok(text.includes("implementation may not quietly shrink it"), "no quiet shrinking")
    assert.ok(text.includes("implement it anyway and note the cost, or stop and surface the trade-off BEFORE building the reduced version"), "costly elements still get implemented, or surface first")
    assert.ok(text.includes("Disclosing a downgrade after delivery is not compliance"), "disclose-after is not compliance")
    assert.ok(text.includes("reported instead of avoided"), "transparency duty prevents, not reports")
  })

  it("system.md: parallelize aggressively — parallel discipline with F7 trigger conditions and do-not-parallelize boundaries (2026-09-01)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "system.md"), "utf8")
    assert.match(text, /Parallelize aggressively/, "proactive parallel guidance present")
    assert.match(text, /splitting changes across independent sub-projects/, "F7: split changes across independent sub-projects")
    assert.match(text, /share no files, have no cross-dependencies, and each has its own tests/, "F7 trigger conditions (all required)")
    assert.match(text, /Do NOT parallelize/, "do-not-parallelize boundary guidance")
    assert.match(text, /approval storms/, "approval-storm boundary named")
    assert.match(text, /micro-parallelism/, "micro-parallelism skipped (value judgment)")
  })
})

// ─── Pre-work plan confirmation discipline (2026-08-21) ───

describe("pre-work plan confirmation discipline", () => {
  it("system.md: confirmation discipline — file-writing tool list + explicit gate + doc/code consistency carve-out", () => {
    const text = readFileSync(join(PROMPTS_DIR, "system.md"), "utf8")
    assert.ok(/write \/ edit \/ apply_patch \/ insert_after \/ delete \/ hashline_edit/.test(text), "file-writing tool list present")
    assert.ok(text.includes("For the changes you propose, there are no exemptions"), "gate is exemption-free for proposed changes")
    assert.ok(text.includes("obvious enough to skip"), "self-exemption excuse explicitly blocked")
    assert.ok(text.includes("a new question from the user is not a confirmation"), "a new user question is not a confirmation")
    assert.ok(text.includes("Re-confirm when the requirement changes"), "re-confirm on requirement change present")
    assert.ok(text.includes("outranks this gate"), "doc/code consistency carve-out present")
    assert.ok(text.includes("standing obligations you already owe"), "carve-out covers existing obligations only")
    assert.ok(text.includes("the user already confirmed"), "carve-out limited to already-confirmed work")
  })

  it("engineering.md: plan confirmation before writing docs (no exemptions)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
    assert.ok(/Plan confirmation before writing any doc/i.test(text), "clause heading present")
    assert.ok(text.includes("before writing the requirements doc"), "confirmation before writing requirements/design docs")
    assert.ok(text.includes("no exemptions"), "no-exemption wording present")
    assert.ok(text.includes("obvious enough to skip"), "self-exemption excuse explicitly blocked")
  })

  it("engineering.md: UI/interaction decisions must land in the design doc AND the eng-coder task (2026-08-29)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
    // 设计文档要素扩项：UI 决策必须落档，未定标 open、绝不静默发明
    assert.ok(
      /MUST also\s+capture every UI\/interaction decision agreed with the user/.test(text),
      "design-doc step requires UI/interaction decisions",
    )
    assert.ok(text.includes("marked open, never silently invented"), "undecided parts marked open, not invented")
    // 任务书传递强制：eng-coder 无对话上下文
    assert.ok(
      text.includes("MUST restate the agreed\n   UI/interaction decisions"),
      "eng-coder task must restate UI/interaction decisions",
    )
    assert.ok(
      text.includes("an eng-coder has NO conversation context"),
      "mechanism named: zero-context subagent",
    )
    // Hard Rules 独立条目：点破"讨论过但没落文档"是实现无视的根因
    assert.ok(text.includes("UI/interaction decisions ride the full chain"), "hard-rule entry present")
    assert.ok(
      text.includes('"Discussed but not written down" is the most common reason'),
      "root cause named in the hard rule",
    )
  })

  it("eng-coder.md: implement UI exactly as briefed; missing decisions → stop and report (2026-08-29)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "eng-coder.md"), "utf8")
    assert.ok(text.includes("UI/interaction: implement exactly what the task brief and design doc state"), "follow-the-brief clause")
    assert.ok(text.includes("stop and report the gap"), "missing-decision → stop and report")
    assert.ok(text.includes("do not invent your own interaction design"), "self-invention blocked")
  })

  it("methodology-template.md: requirements doc carries the three layers (2026-08-29 dangling-reference fix)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "methodology-template.md"), "utf8")
    assert.ok(text.includes("three layers"), "three-layer structure named")
    assert.ok(text.includes("Overall goal"), "layer 1: overall goal")
    assert.ok(text.includes("Functional user stories"), "layer 2: functional user stories")
    assert.ok(text.includes("Non-functional standards"), "layer 3: non-functional standards")
    assert.ok(text.includes("concrete enough to design against"), "doneness criterion present")
    assert.ok(text.includes("traces back to a user story"), "design acceptance criteria trace to stories")
  })

  it("engineering.md: METHODOLOGY test document is part of the delivery review (2026-08-29 test-doc alignment)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
    assert.ok(text.includes("METHODOLOGY test document is part of the delivery"), "test-doc required at delivery")
    assert.ok(text.includes("normal / edge / error"), "coverage triple named")
    assert.ok(text.includes("a delivery without\n   its test coverage fails the review"), "missing coverage fails the review")
  })

  it("engineering.md: delegation guidance (explore/plan offload + precision exception + parallel exclusion + escalate unavailable)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
    assert.ok(text.includes("goes to an `explore` subagent"), "breadth-first exploration delegates to explore")
    assert.ok(text.includes("quick / medium / thorough"), "thoroughness levels stated")
    assert.ok(text.includes("never enter your history"), "isolated-context benefit stated")
    assert.ok(text.includes("about to edit it immediately"), "precision exception present")
    assert.ok(text.includes("same\n  file — conflicts waste"), "no same-file parallel edits")
    assert.ok(text.includes("Do NOT redo the exploration you already delegated"), "no redoing delegated exploration")
    assert.ok(text.includes("`escalate` is unavailable in engineering mode"), "escalate unavailable (matches setup.mjs fail-closed)")
    assert.ok(text.includes("`consult` stays available"), "consult remains available")
  })

  it("engineering.md: first-delivery divergence audit + eng-coder fix round (2026-08-30)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
    assert.ok(text.includes("7. **Divergence audit"), "flow step 7 = divergence audit (automatic node)")
    assert.ok(text.includes("do NOT go straight to the delivery review"), "first delivery does not go straight to the delivery review")
    assert.ok(text.includes("spawn an `explore` subagent"), "audit runs via an explore subagent")
    assert.ok(text.includes("silent simplifications"), "audit names silent simplifications")
    assert.ok(text.includes("SECOND time with the\n     divergence list as the task brief"), "divergences → eng-coder second fix round")
    assert.ok(text.includes("invent nothing new"), "fix round invents nothing new (audit report IS the task)")
    assert.ok(text.includes("verify the\n     divergence list point by point"), "fix-round delivery verified point by point")
    assert.ok(text.includes("First delivery audit"), "work-loop state table carries the audit state")
  })

  it("engineering.md: multi-task parallelism discipline injected at top level (2026-09-01, CLI parity)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
    assert.ok(text.includes("## Multi-Task Parallelism"), "top-level parallelism section present")
    assert.ok(text.includes("Parallelize aggressively: send multiple\nindependent tool calls in one response"), "§14 D1 clause appears inside engineering.md (top-level mode never loads system.md)")
    assert.ok(text.includes("splitting changes across independent\nsub-projects"), "F7 sub-project split trigger")
    assert.ok(text.includes("Do NOT parallelize:\nwrites to the same file, dependent steps, bash/approval-gated commands"), "five no-parallel boundaries")
    assert.ok(text.includes("approval storms"), "approval storms named")
    assert.ok(text.includes("skip micro-parallelism (<1s ops)"), "no micro-parallelism")
    assert.ok(text.includes("share NO file"), "parallel pre-check: affected-file sets disjoint")
    assert.ok(text.includes("Dependency chain → serial"), "dependency chains run serially")
    assert.ok(text.includes("at most 4 concurrent eng-coders"), "≤4 concurrency cap")
    assert.ok(text.includes('designId=<id-A>,\n  designToken=<token-A>'), "parallel spawn call form (each with designId+token)")
    assert.ok(text.includes("each parallel\n   design keeps its own designId+token pair"), "token isolation semantics")
    assert.ok(text.includes("the DESIGN review is still only fired when\n  the user asks"), "initiation rights unchanged")
    assert.ok(text.includes("plus its designId parameter"), "work-loop approval line mentions designId")
  })

  it("engineering.md: divergence-audit fix round reuses the same designId+token (2026-09-01, T19)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
    assert.ok(text.includes("This audit is an automatic flow node — no user initiation needed"), "audit is an automatic node (AC9)")
    assert.ok(text.includes("same `designToken`\n     and `designId` parameters"), "fix round reuses the same designId+token")
  })

  it("engineering.md: no duplicated section headers (2026-09-01 fix #4 hygiene)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
    const dupes = [...text.matchAll(/^## .+$/gm)].map((m) => m[0])
    assert.equal(dupes.length, new Set(dupes).size,
      "every ## header appears exactly once: " + dupes.filter((h, i) => dupes.indexOf(h) !== i).join(" | "))
    assert.ok(text.includes("## Questioning Style (requirement clarification)"), "header kept (dedup only)")
  })

  it("eng-coder.md: full-design fidelity — no silent degradation (2026-08-30)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "eng-coder.md"), "utf8")
    assert.ok(text.includes("Implement to the full design — no silent degradation"), "positive prohibition present")
    assert.ok(text.includes("implement it anyway and note the cost"), "costly elements still get implemented")
    assert.ok(text.includes("A \"simpler\n  approximation\" of a specified behavior IS a deviation"), "approximation = deviation")
    assert.ok(text.includes("BEFORE coding —\n  never ship a reduced version and disclose it afterwards"), "surface first, never disclose-after")
    assert.ok(text.includes("the parent approved the design, not your\n  discount"), "approved the design, not the discount")
  })

  it("eng-coder.md: final-review item 6 — structural snapshot sync (2026-08-30)", () => {
    const text = readFileSync(join(PROMPTS_DIR, "eng-coder.md"), "utf8")
    assert.ok(text.includes("6. Update the affected design-doc sections"), "final-review item 6 present")
    assert.ok(text.includes("module map / affected-files table"), "module map / affected-files table named")
  })

  it("setup-reminders: METHODOLOGY-missing warning names the consequence, not just absence (2026-08-29)", () => {
    const text = readFileSync(join(SRC_DIR, "agent", "setup-reminders.mjs"), "utf8")
    assert.ok(text.includes("every 'per METHODOLOGY' reference in the engineering prompt is dangling"), "dangling-reference consequence named")
    assert.ok(text.includes("three-document hard flow"), "hard-flow consequence named")
    assert.ok(text.includes("Ask the user whether to create METHODOLOGY.md"), "recovery path: ask the user")
    assert.ok(!text.includes("eng tool's write mode"), "stale VS Code-specific scaffold pointer removed")
  })

  it("setup-reminders: METHODOLOGY-missing warning carries absolute template path + body (2026-09-02 D-M1/D-M2)", () => {
    const dir = setupTempDir() // no METHODOLOGY.md → methodologyMissing branch
    const engResult = loadEngineeringPrompt(dir, "eng-coder")
    assert.equal(engResult.methodologyMissing, true)
    assert.ok(engResult.methodologyTemplatePath, "template absolute path resolved")
    assert.match(engResult.methodologyTemplatePath, /(?:thincoder|thincoder-vscode)[\\/].*methodology-template\.md/, "absolute path shape")
    assert.ok(existsSync(engResult.methodologyTemplatePath), "template path exists on disk (D-AC2)")
    assert.ok(engResult.methodologyTemplateBody?.startsWith("# METHODOLOGY — AI Agent Collaboration"), "template body loaded (first line)")
    const history = []
    pushModeReminders(history, { depth: 0, freshMachineLine: true, getAuto: () => false, role: "eng-coder", engPromptActive: true, engResult })
    const warning = history.map((m) => m.content).join("\n")
    assert.ok(warning.includes(engResult.methodologyTemplatePath), "warning contains absolute path")
    assert.ok(warning.includes("# METHODOLOGY — AI Agent Collaboration"), "warning contains template body")
    assert.ok(warning.includes("Ask the user whether to create METHODOLOGY.md"), "recovery path: ask the user")
    assert.ok(warning.includes("write cwd/METHODOLOGY.md before designing"), "confirm-then-write flow kept (D-M3, CLI parity)")
    assert.ok(warning.includes("built-in template（可 read"), "prefix literal intact (D-M2 design literal, audit-fix 2026-09-02)")
    rmSync(dir, { recursive: true, force: true })
  })
})
// ─── Workflow/Debugging 必须用 task（2026-08-23）───
// discipline.md 内容级断言：不能只靠「两端 byte-identical」漂绿——副本内容未改时必须能失败。

describe("discipline.md: workflow/debugging require `task` (content-level)", () => {
  it("Workflow 总规 + 各层追踪工具断言", () => {
    const text = readFileSync(join(PROMPTS_DIR, "discipline.md"), "utf8")
    const lines = text.split("\n")

    // 关键短语全文断言（不受两端比对影响——内容一旦回退即失败）
    assert.ok(/every tier/i.test(text), "全英文短语 every tier 在（文件为 EVERY tier，大小写不敏感）")
    assert.ok(text.includes("one in_progress"), "短语 one in_progress 在")

    // Workflow 总规句：use `task` … every tier … one (item) in_progress
    const rule = lines.find((l) => /every tier/i.test(l))
    assert.ok(rule, "Workflow 总规行存在")
    assert.ok(/use `task`/i.test(rule), "总规含 use `task`")
    assert.ok(/one .*in_progress/i.test(rule), "总规含 one … in_progress（原文为 one item in_progress）")

    // 分层追踪工具断言
    const complex = lines.find((l) => /Complex \(3\+ steps/.test(l.trim()))
    assert.ok(complex, "Complex 层存在")
    assert.ok(complex.includes("`checklist`"), "Complex 层仍含 checklist 双轨")
    const medium = lines.find((l) => /Medium \(2-3 steps/.test(l.trim()))
    assert.ok(medium, "Medium 层存在")
    assert.ok(medium.includes("`task`"), "Medium 层含 task")
    const small = lines.find((l) => /Small \(typo, one-line fix\)/.test(l.trim()))
    assert.ok(small, "Small 层存在")
    assert.ok(small.includes("`task`"), "Small 层含 task（单行小改也要 task）")
  })

  it("Debugging 段含四步 + task + one in_progress", () => {
    const text = readFileSync(join(PROMPTS_DIR, "discipline.md"), "utf8")
    const lines = text.split("\n")
    assert.ok(text.includes("reproduce → locate root cause → fix → verify"), "Debugging 段含调试四步")
    const debugLine = lines.find((l) => l.includes("reproduce → locate root cause → fix → verify"))
    assert.ok(debugLine, "Debugging 调试句存在")
    assert.ok(debugLine.includes("`task`"), "调试句含 task")
    assert.ok(debugLine.includes("one in_progress"), "调试句含 one in_progress")
  })
})
// ─── 读/更新文档嵌入 Workflow 箭头序列（2026-08-23）───
// discipline.md 内容级断言：不能只靠「两端 byte-identical」漂绿——副本内容未改时必须能失败。

describe("discipline.md: read/update docs embedded in Workflow arrows (no standalone Documentation section)", () => {
  it("无独立 Documentation 段 + 读文档总规句 + 各层箭头 + 归属句", () => {
    const text = readFileSync(join(PROMPTS_DIR, "discipline.md"), "utf8")
    const lines = text.split("\n")

    // 无独立 Documentation 段头（上版「Documentation — read before you write」已删除）
    assert.ok(
      !lines.some((l) => l.trim().startsWith("Documentation —")),
      "不存在 Documentation — 段头（读/更新文档已嵌入 Workflow）",
    )

    // 读文档总规句（Workflow 段首）：read the relevant docs + document map + ANY tier
    const readLine = lines.find((l) => /read the relevant docs before changing code/i.test(l))
    assert.ok(readLine, "读文档总规句存在")
    assert.ok(readLine.includes("at ANY tier"), "范围标记 ANY tier 在")
    assert.ok(readLine.includes("the document map"), "the document map（文档地图）在")
    assert.ok(readLine.includes("docs/design/README.md"), "文档地图路径 docs/design/README.md 在")
    assert.ok(readLine.includes("AGENTS.md if present"), "AGENTS.md if present 在")

    // Complex 层箭头：Read the docs → Requirements → Design → Development → Testing（不加 update the owning doc——已写设计文档）
    const complex = lines.find((l) => /Complex \(3\+ steps/.test(l.trim()))
    assert.ok(complex, "Complex 层存在")
    assert.ok(complex.includes("Read the docs → Requirements → Design → Development → Testing"), "Complex 箭头完整")
    assert.ok(!complex.includes("update the owning doc"), "Complex 层不含 update the owning doc")

    // Medium 层箭头：Read the docs → Plan → Change → update the owning doc if you spotted a gap
    const medium = lines.find((l) => /Medium \(2-3 steps/.test(l.trim()))
    assert.ok(medium, "Medium 层存在")
    assert.ok(medium.includes("Read the docs → Plan → Change"), "Medium 箭头含 Read the docs → Plan → Change")
    assert.ok(medium.includes("update the owning doc if you spotted a gap"), "Medium 箭头含 update the owning doc if you spotted a gap")

    // Small 层箭头：Read the docs → Change → Verify → update the owning doc if you spotted a gap
    const small = lines.find((l) => /Small \(typo, one-line fix\)/.test(l.trim()))
    assert.ok(small, "Small 层存在")
    assert.ok(small.includes("Read the docs → Change → Verify"), "Small 箭头含 Read the docs → Change → Verify")
    assert.ok(small.includes("update the owning doc if you spotted a gap"), "Small 箭头含 update the owning doc if you spotted a gap")

    // 归属句（Workflow 段末）：Never create a new doc + find the owner and amend
    const ownLine = lines.find((l) => l.includes("Never create a new doc"))
    assert.ok(ownLine, "归属句存在")
    assert.ok(ownLine.includes("find the owner and amend"), "归属句含 find the owner and amend")
  })
})
// ─── 委托策略 A（AGENT-LOOP §13）与历史卫生 C（CONTEXT-COMPACTION §5）───

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

  it("main.md: 收益句 + 委托规则句 + 精度例外 + 验证句；其余条保留", () => {
    const text = readFileSync(join(PROMPTS_DIR, "main.md"), "utf8")
    assert.match(text, /isolated context/, "收益句点破子 agent 隔离上下文")
    assert.match(text, /only their final report comes back/, "收益句：只有最终报告回到主历史")
    assert.match(text, /floods? your own window/, "收益句：内联探索会淹没自己的窗口")
    assert.match(text, /Breadth-first exploration[\s\S]*?`explore` subagent/, "广度探索下沉 explore 的规则句")
    assert.match(text, /Read a file yourself only when you are about to edit it immediately/, "即时编辑例外触发句")
    assert.match(text, /precision exception, not a token-saving trick/, "精度例外不是省 token 技巧")
    assert.match(text, /When a coder subagent finishes, verify its work/, "coder 完成后的验证句")
    assert.match(text, /do NOT redo the whole exploration/, "不重做已委托的整段探索")
    assert.match(text, /Never give parallel subagents tasks that edit the same files/, "并行不编辑同一文件条款保留")
    assert.match(text, /When multiple subagent reports conflict, read the relevant code yourself/, "冲突仲裁条款保留")
  })

  it("SUMMARIZE_PROMPT 区分已完成/进行中 + 两清单：已改动文件 + 未决点/待办", () => {
    assert.ok(
      SUMMARIZE_PROMPT.includes("Distinguish COMPLETED vs IN-PROGRESS work"),
      "区分 COMPLETED vs IN-PROGRESS 指令句在"
    )
    assert.ok(
      SUMMARIZE_PROMPT.includes("completed tasks get a ONE-LINE recap each"),
      "已完成任务一行回述在"
    )
    assert.ok(
      SUMMARIZE_PROMPT.includes("spend the detail budget on unresolved issues, next steps, and the CURRENT task"),
      "细节预算留给未决项/下一步/当前任务在"
    )
    assert.ok(
      SUMMARIZE_PROMPT.includes("The user's most recent request defines the current task"),
      "以用户最近请求为当前任务锚点在"
    )
    assert.match(SUMMARIZE_PROMPT, /Explicitly list FILES CHANGED/, "已改动文件清单在")
    assert.match(SUMMARIZE_PROMPT, /Explicitly list UNRESOLVED ISSUES \/ TODOs/, "未决点/待办清单在")
  })

  it("SUMMARIZE_PROMPT §8 D13：≤1K 硬目标句 + 砍价优先级 ①②③④（旧无界指引删除）", () => {
    assert.ok(SUMMARIZE_PROMPT.includes("~1K tokens"), "≤1K 硬目标句在（D13-1）")
    assert.ok(SUMMARIZE_PROMPT.includes("1000 Chinese chars / 4000 ASCII chars"), "中/英文直觉换算在（D13-1）")
    assert.ok(!SUMMARIZE_PROMPT.includes("err on the long side"), "旧无界长度指引已删除（D13-1）")
    assert.ok(SUMMARIZE_PROMPT.includes("When over budget, trim in this order"), "砍价优先级句在（D13-2）")
    assert.ok(SUMMARIZE_PROMPT.includes("completed recaps to one line"), "① 已完成 recap → 一行")
    assert.ok(SUMMARIZE_PROMPT.includes("FILES CHANGED why-notes to bare paths"), "② FILES CHANGED why 注释 → 裸路径")
    assert.ok(SUMMARIZE_PROMPT.includes("in-progress prose tightened"), "③ 进行中叙述 → 收紧")
    assert.ok(SUMMARIZE_PROMPT.includes("NEVER cut design anchors or UNRESOLVED ISSUES/TODOs"), "④ 永不砍设计锚点/未决清单")
  })

  it("EXPLORE_TOOLS 只含只读知识型（execute 不计入）", () => {
    for (const name of ["read", "grep", "glob", "ls", "code_search", "doc_search", "repo_outline"]) {
      assert.ok(EXPLORE_TOOLS.has(name), `${name} 属于探索类`)
    }
    assert.ok(!EXPLORE_TOOLS.has("execute"), "execute 写文件，不属于探索类")
  })

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


// ─── End-of-run distillation is async (SEND-STALL-DISTILL) ─────────────────

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


// ─── ENG 状态提醒补全（2026-08-25）：vscode resume 重通知 + OFF 双向 ───
describe("ENG state reminders (2026-08-25)", () => {
  it("setupAgentRun seeds _lastEngState=false — a resumed engineering session re-notifies on turn 1", async () => {
    const src = await import("../src/agent/setup.mjs")
    // setupAgentRun needs a full agent; assert the seed contract at the source level:
    // the literal must seed false (not the live engineering flag) so the injector fires.
    const fs = await import("node:fs")
    const text = fs.readFileSync(new URL("../src/agent/setup.mjs", import.meta.url), "utf8")
    assert.ok(text.includes("_lastEngState: false"),
      "setup must seed _lastEngState=false (resume re-notify contract)")
  })

  it("injectEngineeringReminder: every transition (ON and OFF) injects exactly one reminder", async () => {
    const { ENG_ON_REMINDER, ENG_OFF_REMINDER } = await import("../src/agent.mjs")
    const agent = {
      config: { agent: { engineering: true } },
      _lastEngState: false,
      history: [],
    }
    // The injector is module-private; the runAgent loop calls it. Simulate its contract:
    const inject = (a) => {
      const eng = a.config?.agent?.engineering ?? false
      if (eng !== a._lastEngState) {
        a.history.push({ role: "user", content: eng ? ENG_ON_REMINDER : ENG_OFF_REMINDER, transient: true })
      }
      a._lastEngState = eng
    }
    inject(agent) // resume → ON: notifies
    assert.equal(agent.history.length, 1, "resume into ON notifies once")
    inject(agent) // stable ON: no repeat
    assert.equal(agent.history.length, 1, "stable state stays silent")
    agent.config.agent.engineering = false
    inject(agent) // OFF transition: notifies (was silence before 2026-08-25)
    assert.equal(agent.history.length, 2)
    assert.match(agent.history[1].content, /engineering mode is now OFF/)
    inject(agent) // stable OFF
    assert.equal(agent.history.length, 2)
  })

  it("agent.mjs exports ENG_OFF_REMINDER and eng exit pushes it", async () => {
    const { ENG_OFF_REMINDER, engTool } = await import("../src/agent.mjs")
    const { engTool: eng } = await import("../src/agent-tools/eng.mjs")
    assert.match(ENG_OFF_REMINDER, /engineering mode is now OFF/)
    const agent = { config: { agent: { engineering: true } }, _pendingReminders: [] }
    await eng.execute({ action: "exit" }, { agent })
    assert.ok(agent._pendingReminders.includes(ENG_OFF_REMINDER))
  })
})
