/**
 * provider-merge.test.mjs — PROVIDER 子系统并入面用例（§2.5 #114 / #115 / #163）。
 *
 * 覆盖：rate.mjs 的 abortableSleep（VSC 可中断等待）+ token 估算取并集 +
 * list-models 的排序 / 明确报错 / 渠道准入探针 + generate-title 三格式分派。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  abortableSleep, estimateText, estimateRequestTokens, _rateHooks, rateGate,
} from "../provider/rate.mjs"
import {
  listModels, probeChannelModels, admissionOf, _setProbeImplForTest, _resetAdmissionForTest,
} from "../provider/list-models.mjs"
import { generateTitle } from "../generate-title.mjs"

// ─── #114 rate.mjs ──────────────────────────────────────────────────────────

test("abortableSleep：无 signal 走 _rateHooks.sleep；abort 时立即拒绝", async () => {
  // 无 signal：走测试钩子（不真等）
  let slept = null
  const saved = _rateHooks.sleep
  _rateHooks.sleep = (ms) => { slept = ms; return Promise.resolve() }
  await abortableSleep(50, null)
  assert.equal(slept, 50, "无 signal 回退 hook sleep")
  _rateHooks.sleep = saved

  // 已 aborted：立即拒绝 AbortError
  const ctrl = new AbortController()
  ctrl.abort()
  await assert.rejects(abortableSleep(60_000, ctrl.signal), (e) => e.name === "AbortError")

  // 等待中被 abort：提前拒绝（不等满 60s）
  const ctrl2 = new AbortController()
  const p = abortableSleep(60_000, ctrl2.signal)
  ctrl2.abort()
  await assert.rejects(p, (e) => e.name === "AbortError")
})

test("estimateText / estimateRequestTokens：图片 part 与 max_tokens 取并集", () => {
  assert.equal(estimateText("abcd"), 1, "ASCII ~4 chars/token")
  assert.equal(estimateText("中文中文"), 4, "非 ASCII 1 char/token")
  const withImage = estimateText([
    { type: "text", text: "abcd" },
    { type: "image_url", image_url: { url: "x" } },
  ])
  assert.equal(withImage, 1 + 85, "图片 part 计 85 tokens")
  const body = { messages: [{ role: "user", content: "abcd" }], max_tokens: 100 }
  assert.equal(estimateRequestTokens(body), 1 + 100, "max_tokens 计入请求估算")
})

test("rateGate：estimated > effectiveTpm 提前放行（防死等守护——VSC 并入）", { timeout: 5000 }, async () => {
  const seen = []
  // 只配 rpm + 单请求估算超默认 TPM（1M）：旧实现 overTokens 恒真、sleep 循环无限空转；
  // 守护下立即放行（告警 + 记账），零等待。
  await rateGate(
    { baseURL: "https://rate-guard.test/v1", apiKey: "guard", model: "guard-model", rpm: 10 },
    2_000_000, (w) => seen.push(w), null,
  )
  assert.ok(seen.some((w) => w.phase === "warn"), "超限告警发出")
  // 窗口有空位（常规情形）：零等待零告警。
  const seen2 = []
  await rateGate(
    { baseURL: "https://rate-guard-2.test/v1", apiKey: "g2", model: "m", rpm: 10 },
    1000, (w) => seen2.push(w), null,
  )
  assert.equal(seen2.length, 0, "有空位 → 不进等待")
})

// ─── #115 list-models.mjs ───────────────────────────────────────────────────

test("listModels：本端排序 + 缺 baseURL 明确报错 + 非 JSON 明确报错", async () => {
  const savedFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => ({ ok: true, text: async () => JSON.stringify({ data: [{ id: "z-model" }, { id: "a-model" }] }) })
    const ids = await listModels({ baseURL: "https://x.test/v1", apiKey: "k" })
    assert.deepEqual(ids, ["a-model", "z-model"], "返回前排序")

    globalThis.fetch = async () => ({ ok: true, text: async () => "<html>not json</html>" })
    await assert.rejects(listModels({ baseURL: "https://x.test/v1", apiKey: "k" }), /non-JSON response/)

    await assert.rejects(listModels({ apiKey: "k" }), /baseURL is missing/)

    globalThis.fetch = async () => ({ ok: false, status: 503, text: async () => "down" })
    await assert.rejects(listModels({ baseURL: "https://x.test/v1", apiKey: "k" }), (e) => e.status === 503)
  } finally {
    globalThis.fetch = savedFetch
  }
})

test("probeChannelModels：探针不抛 + 准入展示态记录（成功 / 失败不阻断）", async () => {
  _resetAdmissionForTest()
  const savedFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => ({ ok: true, text: async () => JSON.stringify({ data: [{ id: "m2" }, { id: "m1" }] }) })
    const ok = await probeChannelModels("good", { baseURL: "https://x.test/v1", apiKey: "k" })
    assert.deepEqual(ok, { ok: true, models: ["m1", "m2"] })
    assert.deepEqual(admissionOf("good"), { ok: true })

    globalThis.fetch = async () => ({ ok: false, status: 503, text: async () => "down" })
    const bad = await probeChannelModels("bad", { baseURL: "https://x.test/v1", apiKey: "k" })
    assert.equal(bad.ok, false, "探针失败不抛（不阻断配置写）")
    assert.equal(admissionOf("bad").ok, false)
    assert.match(admissionOf("bad").reason, /不可用|不提供模型列表/)
  } finally {
    globalThis.fetch = savedFetch
    _resetAdmissionForTest()
  }
  assert.equal(admissionOf("bad"), null, "重置后无记录")
})

// ─── #163 generate-title.mjs ───────────────────────────────────────────────

test("generateTitle：按 provider.format 三格式分派（openai / anthropic / google）", async () => {
  const savedFetch = globalThis.fetch
  const calls = []
  try {
    globalThis.fetch = async (url, opts) => {
      calls.push({ url, opts })
      if (url.endsWith("/messages")) {
        return { ok: true, json: async () => ({ content: [{ type: "text", text: "  Anthropic Title  " }] }) }
      }
      if (url.includes(":generateContent")) {
        return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: "Gemini Title" }] } }] }) }
      }
      return { ok: true, json: async () => ({ choices: [{ message: { content: "OpenAI Title" } }] }) }
    }
    const content = [{ type: "text", text: "hello world, this is the first user message" }]

    const t1 = await generateTitle(content, { format: "anthropic", baseURL: "https://a.test/v1", apiKey: "ak", model: "claude-x" })
    assert.equal(t1, "Anthropic Title")
    assert.equal(calls[0].opts.headers["x-api-key"], "ak")
    assert.equal(calls[0].opts.headers.Authorization, undefined)

    const t2 = await generateTitle(content, { format: "google", baseURL: "https://g.test/v1beta", apiKey: "gk", model: "gemini-x" })
    assert.equal(t2, "Gemini Title")
    assert.ok(calls[1].url.includes(":generateContent?key=gk"))
    const gbody = JSON.parse(calls[1].opts.body)
    assert.equal(gbody.generationConfig.thinkingConfig.thinkingLevel, "none")

    const t3 = await generateTitle(content, { baseURL: "https://o.test/v1", apiKey: "ok", model: "gpt-x", headers: { "X-Custom": "1" } })
    assert.equal(t3, "OpenAI Title")
    assert.ok(calls[2].url.endsWith("/chat/completions"))
    assert.equal(calls[2].opts.headers.Authorization, "Bearer ok")
    assert.equal(calls[2].opts.headers["X-Custom"], "1", "定制头随请求发出")
    const obody = JSON.parse(calls[2].opts.body)
    assert.deepEqual(obody.thinking, { type: "disabled" }, "thinking 禁用保留")
  } finally {
    globalThis.fetch = savedFetch
  }
})
