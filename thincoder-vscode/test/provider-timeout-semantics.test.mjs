/**
 * provider-timeout-semantics.test.mjs — 群 A 批 A1（VSC-MIRROR-SWEEP）· W10 改判登记（2026-09-15）。
 *
 * W10（PROVIDER 单元）后 LLM 调用 = 核实现（`@thincoder/core/provider/core.mjs`——原 VSC provider
 * 镜像与四 transport 已删）⇒ 本档由「VSC 镜像超时语义」改判为
 * 「VSC 调用面契约」（测试纪律① 逐条判）：
 * - 保留 2 例：T-MA1-1 / T-MA1-2——VSC 调用面不合成绝对墙钟（用户 signal 原样透传、零合成）
 *   + 头/body 相位参数在位（群 A 批 A1 核心契约）。驱动面 = 核 `chat`（VSC 实际消费面）。
 * - 退役 3 例：T-MA1-3 / T-MA1-4（镜像 `parseStream` 的 `idleMs` 测试缝随删档消失；核
 *   `readSSE` 看门狗无测试缝、不可稳定驱动）· T-MA1-5（源文本 grep 静态断言——镜像档已删，
 *   且属「散文锚」禁止形态）。
 * 零网络：globalThis.fetch 桩（无代理 → 核 chat 直连 fetch）+ 假流。
 * 射程注（内部评审轮 1 · 🔵#7）：两例锁的是核装配面的 fetch 选项形状（跨端契约锁）——
 * 实现体在核（`@thincoder/core/provider/core.mjs:414-415`）；核侧若有对位用例，可考虑并入核测试树。
 */
import test from "node:test"
import assert from "node:assert/strict"

import { chat } from "@thincoder/core/provider/core.mjs"

const enc = new TextEncoder()

/** 桩 SSE 响应（openai 形态——content-type event-stream 走流路径）。 */
function sseResponse(body, extra = {}) {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ "content-type": "text/event-stream" }),
    body,
    text: async () => "",
    ...extra,
  }
}

/** 正常结束的假流：逐帧 enqueue 后 close。 */
function closedStream(frames) {
  let i = 0
  return new ReadableStream({
    pull(controller) {
      if (i < frames.length) controller.enqueue(enc.encode(frames[i++]))
      else controller.close()
    },
  })
}

const contentFrame = (text) => `data: ${JSON.stringify({ choices: [{ delta: { content: text }, finish_reason: "stop" }] })}\n\n`

async function withFetch(handler, fn) {
  const orig = globalThis.fetch
  const reqs = []
  globalThis.fetch = async (url, opts) => { reqs.push({ url: String(url), ...opts }); return handler(String(url), opts) }
  try { return await fn(reqs) } finally { globalThis.fetch = orig }
}

const provider = { name: "stub", baseURL: "https://stub.invalid/v1", model: "stub-unknown-model", apiKey: "sk-stub" }

// ─── T-MA1-1 正常：用户 signal 原样透传 + 相位参数在位（AC-MA1-1）───────────────

test("T-MA1-1 请求 options = 用户 signal 原样（非复合）+ _headerTimeoutMs 600s / _bodyIdleMs 120s", async () => {
  const userSignal = new AbortController().signal
  await withFetch(() => sseResponse(closedStream([contentFrame("hi"), "data: [DONE]\n\n"])), async (reqs) => {
    const result = await chat(provider, {
      messages: [{ role: "user", content: "hi" }],
      tools: [],
      signal: userSignal,
    })
    assert.equal(reqs.length, 1, "恰一次请求")
    assert.equal(reqs[0].signal, userSignal, "options.signal === 用户 signal（不再复合 AbortSignal.timeout）")
    assert.equal(reqs[0]._headerTimeoutMs, 600_000, "头相位 600s 在位")
    assert.equal(reqs[0]._bodyIdleMs, 120_000, "body 相位 idle 120s 在位")
    assert.equal(result.content, "hi")
  })
})

// ─── T-MA1-2 边界：无用户 signal → 不合成（AC-MA1-1）────────────────────────────

test("T-MA1-2 无用户 signal：options.signal === undefined（零合成）+ 请求照发", async () => {
  await withFetch(() => sseResponse(closedStream([contentFrame("ok"), "data: [DONE]\n\n"])), async (reqs) => {
    const result = await chat(provider, { messages: [{ role: "user", content: "hi" }], tools: [] })
    assert.equal(reqs.length, 1, "请求照发")
    assert.equal(reqs[0].signal, undefined, "零合成 AbortSignal.timeout")
    assert.equal(result.content, "ok")
  })
})
