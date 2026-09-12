/**
 * provider-timeout-semantics.test.mjs — 群 A 批 A1（VSC-MIRROR-SWEEP）。
 * 设计权威：`docs/design/PROVIDER.md` §4.3（契约（c）1–4 / 用例 T-MA1-1–5 / AC-MA1-1–3）。
 *
 * 覆盖：绝对墙钟废除（请求 signal = 用户 signal 原样；不再合成 AbortSignal.timeout）+
 * 头/body 相位参数在位 + 四 transport 读侧 idle 看门狗（判死 + 零误杀成对）+ 源文本零残留。
 * 零网络：globalThis.fetch 桩（proxyFetch 无代理 → 单测唯一网络面）+ 假流。
 * 2026-09-12 收尾轮 9：T-MA1-4 原余量（chunk 20ms / idle 40ms = 2×）在并发负载下
 * 真判死（20ms 定时器被拖过 40ms）——idleMs 放宽至 300（余量 15×，语义零改：
 * 持续有数据的零误杀不变量与 timer 清理断言原样保留——非断言放宽，是抗负载硬化）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { PassThrough } from "node:stream"
import { chat } from "../src/provider.mjs"
import { parseStream as openaiParseStream } from "../src/provider/transports/openai.mjs"

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

// ─── T-MA1-3 错误：静默挂起 → idle 判死（AC-MA1-2）─────────────────────────────

test("T-MA1-3 两 chunk 后静默挂起 + idleMs=40 → TimeoutError（消息含 SSE idle timeout）", async () => {
  // ① 直连形态（Web 流——undici ReadableStream）：静默挂起 → race 判死
  const frames = [contentFrame("a"), contentFrame("b")]
  let i = 0
  const hanging = new ReadableStream({
    pull(controller) { if (i < frames.length) controller.enqueue(enc.encode(frames[i++])) /* 之后既不 enqueue 也不 close——静默挂起 */ },
  })
  await assert.rejects(
    () => openaiParseStream(sseResponse(hanging), { onToken: () => {}, idleMs: 40 }),
    (e) => {
      assert.equal(e.name, "TimeoutError", "idle 判死以 TimeoutError 终止")
      assert.match(String(e.message), /SSE idle timeout/, "消息含 SSE idle timeout")
      return true
    },
  )

  // ② 代理形态（Node 流——PassThrough 有 destroy）：释放路径真达（destroy(err)）
  const pt = new PassThrough()
  pt.write(contentFrame("a"))
  let destroyed = null
  const origDestroy = pt.destroy.bind(pt)
  pt.destroy = (err) => { destroyed = err; return origDestroy(err) }
  await assert.rejects(
    () => openaiParseStream(sseResponse(pt), { onToken: () => {}, idleMs: 40 }),
    (e) => {
      assert.equal(e.name, "TimeoutError", "代理形态同样以 TimeoutError 判死")
      assert.match(String(e.message), /SSE idle timeout/)
      return true
    },
  )
  assert.equal(destroyed?.name, "TimeoutError", "Node 流释放 = destroy(idle 错误)")
})

// ─── T-MA1-4 边界（对照）：持续有数据 → 零误杀 + timer 已清理（AC-MA1-2）────────

test("T-MA1-4 每 20ms 持续有 chunk（idleMs=300——余量 15×，抗负载抖动）→ 正常完成零误杀 + timer 清理", async () => {
  const frames = [contentFrame("x"), contentFrame("y"), "data: [DONE]\n\n"]
  let i = 0
  const paced = new ReadableStream({
    pull(controller) {
      return new Promise((resolve) => {
        setTimeout(() => {
          if (i < frames.length) { controller.enqueue(enc.encode(frames[i++])); resolve() }
          else { controller.close(); resolve() }
        }, 20)
      })
    },
  })

  // timer 记账（idleMs=300 的 timer 全部被 clear——无悬挂 handle）
  const origSet = globalThis.setTimeout
  const origClear = globalThis.clearTimeout
  const idleTimers = []
  const cleared = new Set()
  globalThis.setTimeout = (fn, delay, ...rest) => { const id = origSet(fn, delay, ...rest); if (delay === 300) idleTimers.push(id); return id }
  globalThis.clearTimeout = (id) => { cleared.add(id); return origClear(id) }
  let result
  try {
    result = await openaiParseStream(sseResponse(paced), { onToken: () => {}, idleMs: 300 })
  } finally {
    globalThis.setTimeout = origSet
    globalThis.clearTimeout = origClear
  }

  assert.equal(result.content, "xy", "零误杀——正常完成")
  assert.ok(idleTimers.length >= 2, "每 chunk 重置（≥2 次臂）")
  assert.ok(idleTimers.every((t) => cleared.has(t)), "idle timer 全部清理（无悬挂 handle）")
})

// ─── T-MA1-5 边界（静态）：源文本零残留 + 四 transport 看门狗在位（AC-MA1-3）────

test("T-MA1-5 源文本：绝对墙钟零残留 + _anySignal 退场 + 四 transport READ_IDLE_MS 在位", () => {
  const providerSrc = readFileSync(new URL("../src/provider.mjs", import.meta.url), "utf8")
  assert.ok(!providerSrc.includes("AbortSignal.timeout(FETCH_TIMEOUT_MS)"), "绝对墙钟零命中")
  assert.ok(!/_anySignal/.test(providerSrc), "_anySignal 零残留（polyfill 退场）")
  for (const f of ["openai", "anthropic", "google", "responses"]) {
    const src = readFileSync(new URL(`../src/provider/transports/${f}.mjs`, import.meta.url), "utf8")
    assert.ok(src.includes("READ_IDLE_MS = 120_000"), `${f}.mjs 读侧 idle 120s 在位`)
  }
})
