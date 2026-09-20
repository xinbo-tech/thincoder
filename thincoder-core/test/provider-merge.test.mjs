/**
 * provider-merge.test.mjs — PROVIDER 子系统并入面用例（§2.5 #114 / #115 / #163）。
 *
 * 覆盖：rate.mjs 的 abortableSleep（VSC 可中断等待）+ token 估算取并集 +
 * list-models 的排序 / 明确报错 / 渠道准入探针 + generate-title 三格式分派；
 * 末段：effort 族载荷面——qwen flash（T-8/T-9）+ TokenHub/方舟 off 补发（B-1…B-6，
 * 设计 `docs/core/design/MODEL-SPECS.md` §9.6–§9.9）。
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
import { chat } from "../provider/core.mjs"
import { resolveEnableThinking } from "../config.mjs"
import { specForModel } from "../model-specs.mjs"

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
    const okRec = admissionOf("good")
    assert.equal(okRec.ok, true, "探通 ⇒ 准入记录 ok")
    assert.equal("failure" in okRec, false, "成功记录不携带失败分类（§6.16 M8/M9 补）")
    assert.ok(Number.isFinite(okRec.ts), "落账统一盖 ts（F-W19）")

    globalThis.fetch = async () => ({ ok: false, status: 503, text: async () => "down" })
    const bad = await probeChannelModels("bad", { baseURL: "https://x.test/v1", apiKey: "k" })
    assert.equal(bad.ok, false, "探针失败不抛（不阻断配置写）")
    const badRec = admissionOf("bad")
    assert.equal(badRec.ok, false)
    assert.equal(badRec.failure, "malformed", "HTTP 503 非超时族 ⇒ 核侧两档归 malformed")
    assert.ok(Number.isFinite(badRec.ts), "失败记录亦盖 ts")
    assert.match(badRec.reason, /不可用|不提供模型列表/)

    globalThis.fetch = async () => { const e = new Error("The operation was aborted due to timeout"); e.name = "TimeoutError"; throw e }
    await probeChannelModels("slow", { baseURL: "https://x.test/v1", apiKey: "k" })
    assert.equal(admissionOf("slow").failure, "timeout", "超时族 ⇒ timeout（hostBusy 不由核判——端侧采样器证据覆盖）")
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

// ─── 批 2026-09-20-qwen-flash-specs（设计 `docs/core/design/MODEL-SPECS.md` §6 T-8 / T-9）───

const BAILIAN = "https://dashscope.aliyuncs.com/compatible-mode/v1"

/** fetch 桩：捕获出站请求体 + 回最小 SSE 流（形态同 compress-form.test.mjs 的 stubFetch）。 */
function stubSSE(content = "ok") {
  const calls = []
  const saved = globalThis.fetch
  globalThis.fetch = async (_url, opts) => {
    calls.push(JSON.parse(opts.body))
    const sse = `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`
    return { ok: true, status: 200, headers: { get: () => "text/event-stream" }, body: [new TextEncoder().encode(sse)] }
  }
  return { calls, restore: () => { globalThis.fetch = saved } }
}

test("T-8/A-3 effort 越界门：qwen3.7-flash + reasoningEffort max ⇒ 组体前抛错（枚举无 max）", async () => {
  const stub = stubSSE()
  try {
    const provider = { name: "qwen", model: "qwen3.7-flash", baseURL: BAILIAN, apiKey: "k", reasoningEffort: "max" }
    await assert.rejects(
      chat(provider, { messages: [{ role: "user", content: "hi" }] }),
      /reasoning_effort "max" not supported by model "qwen3\.7-flash"/,
      "枚举外取值 ⇒ 本地抛错（早于 rateGate / 网络）",
    )
    assert.equal(stub.calls.length, 0, "门在 fetch 之前：零出站请求")
    await assert.rejects(chat(provider, { messages: [{ role: "user", content: "hi" }] }), (e) => {
      assert.match(e.message, /valid values: none, minimal, low, medium, high, xhigh$/, "报错列出服务端原文序枚举（可自查）")
      return true
    }, "越界错误面稳定（重复调用同形）")

    // 正控（区分力）：同档 + 枚举内取值 ⇒ 过门，出站体带 reasoning_effort
    const result = await chat({ ...provider, reasoningEffort: "xhigh" }, { messages: [{ role: "user", content: "hi" }] })
    assert.equal(result.content, "ok", "枚举内取值 ⇒ 走完整路径（桩 SSE 回包）")
    assert.equal(stub.calls.length, 1, "恰一次出站")
    assert.equal(stub.calls[0].reasoning_effort, "xhigh", "均按 provider 对象取值组装")
    assert.equal(stub.calls[0].model, "qwen3.7-flash")
  } finally { stub.restore() }
})

test("T-9/A-7 enable_thinking 四态零回归：两新档 × 百炼 host＋非百炼负控", () => {
  const pairs = ["qwen3.8-flash", "qwen3.8-omni-flash"]
  for (const model of pairs) {
    const spec = specForModel(model)
    const p = (extra) => ({ name: "qwen", model, baseURL: BAILIAN, apiKey: "k", ...extra })
    assert.equal(resolveEnableThinking(p({ thinking: null }), spec), false, `${model} 显式 off ⇒ false（NF1 约定）`)
    assert.equal(resolveEnableThinking(p({ reasoningEffort: "high" }), spec), true, `${model} effort 档 ⇒ true（随 reasoning_effort 同行）`)
    assert.equal(resolveEnableThinking(p({}), spec), undefined, `${model} 均无 ⇒ undefined（字段不发，服务端默认不变）`)
    // 第四态（裁定② · A-18 同携态）：修复后 `/think effort none` 落 off 标记——档位「保留/清除」两写法均可（设计 §2.8-2）
    // ⇒ 同携态须 false（`thinking === null` 先判、truthy 档位次判，§2.6-2）；判序颠倒即回归 true。
    assert.equal(resolveEnableThinking(p({ thinking: null, reasoningEffort: "none" }), spec), false, `${model} 同携态（off 标记 + "none" 档）⇒ false；判序颠倒即回归 true（§2.6-2）`)
    assert.equal(
      resolveEnableThinking({ ...p({ reasoningEffort: "high" }), baseURL: "https://api.other-host.test/v1" }, spec),
      undefined,
      `${model} 非百炼 host 负控 ⇒ 白名单不命中`,
    )
    assert.equal(spec.reasoningEffortEnum.includes("none"), true, `${model} 枚举含 none（显式 off 面已在枚举内）`)
  }
})

// ─── 批 2026-09-20-channel-onboarding（设计 `docs/core/design/MODEL-SPECS.md` §9.6–§9.9 · 用例 B-1..B-6）───
// D-14（AC-9）：effort 族非百炼渠道的 off 标记（`thinking:null`）在载荷组装层补发 `reasoning_effort:"none"`。
const TOKENHUB = "https://tokenhub.tencentmaas.com/v1"
const SEED_CODE = "doubao-seed-2-0-code-preview-260215"

/** 捕获出站体（桩 SSE 回包）：provider 名随意——本批载荷面不看渠道名，只看 model/host/字段。 */
async function sentBody(model, extra = {}, baseURL = TOKENHUB) {
  const stub = stubSSE()
  try {
    const res = await chat({ name: "ch", model, baseURL, apiKey: "k", ...extra }, { messages: [{ role: "user", content: "hi" }] })
    assert.equal(res.content, "ok", `${model} 走完整路径（桩 SSE 回包）`)
    assert.equal(stub.calls.length, 1, `${model} 恰一次出站`)
    return stub.calls[0]
  } finally { stub.restore() }
}

test("B-1 hy3 + reasoningEffort:\"none\" ⇒ 出站体携该字段（枚举内取值照发）", async () => {
  const body = await sentBody("hy3", { reasoningEffort: "none" })
  assert.equal(body.reasoning_effort, "none")
  assert.equal("thinking" in body, false, "provider 未设 thinking ⇒ 不发（现状零变）")
})

test("B-2 hy3 + 域外档 \"zzz\" ⇒ 本地抛错并列合法档位（越界门零改）", async () => {
  const stub = stubSSE()
  try {
    await assert.rejects(
      chat({ name: "ch", model: "hy3", baseURL: TOKENHUB, apiKey: "k", reasoningEffort: "zzz" }, { messages: [{ role: "user", content: "hi" }] }),
      (e) => {
        assert.match(e.message, /not supported by model "hy3"/, "错误面点名模型")
        assert.match(e.message, /valid values: none, minimal, low, medium, high, xhigh, max/, "并列合法档位（服务端原文序）")
        return true
      },
    )
    assert.equal(stub.calls.length, 0, "门在 fetch 之前：零出站")
  } finally { stub.restore() }
})

test("B-3 无枚举行（hy4-preview）+ 任意档 ⇒ 原样透传（无校验 = 零变化）", async () => {
  const body = await sentBody("hy4-preview", { reasoningEffort: "xhigh" })
  assert.equal(body.reasoning_effort, "xhigh", "无枚举 ⇒ 不校验不失真")
})

test("B-4 seed-code + \"max\" ⇒ 七档内取值过门并携出", async () => {
  const body = await sentBody(SEED_CODE, { reasoningEffort: "max" })
  assert.equal(body.reasoning_effort, "max")
})

test("B-5 D-14 off 补发：thinking:null 且无显式档 ⇒ 携 none；五 guard 零变面同断", async () => {
  const off = await sentBody("hy3", { thinking: null })
  assert.equal(off.reasoning_effort, "none", "off 标记 ⇒ 补发 none")
  assert.equal("thinking" in off, false, "thinking:null 仍不发（falsy 跳过 = 现状）")

  const noEnum = await sentBody("hy4-preview", { thinking: null })
  assert.equal("reasoning_effort" in noEnum, false, "guard①：无枚举行 ⇒ 零变化")

  const explicit = await sentBody("hy3", { thinking: null, reasoningEffort: "low" })
  assert.equal(explicit.reasoning_effort, "low", "guard②：显式档优先，不叠 none")

  const flash = await sentBody("qwen3.7-flash", { thinking: null }, BAILIAN)
  assert.equal(flash.enable_thinking, false, "guard③：百炼 host ⇒ enable_thinking:false 照发")
  assert.equal(flash.reasoning_effort, "none", "guard③：同义多携（非回归，§1.8-① 实测支持）")

  const kimi = await sentBody("kimi-k3", { thinking: null })
  assert.equal("reasoning_effort" in kimi, false, "guard④：枚举无 none 者不发")

  const router = await sentBody("x/hy3", { thinking: null })
  assert.equal("reasoning_effort" in router, false, "guard⑤：含 / 路由名不发（复用 !isRouter 门）")
})

test("B-6 后台路径形态（`{...provider, thinking:null}`）同样携 none = 认账交付", async () => {
  const uiProvider = { name: "ch", model: "hy3", baseURL: TOKENHUB, apiKey: "k" }
  const background = { ...uiProvider, thinking: null } // context.mjs:401 / explore-distill.mjs:98 同形
  const stub = stubSSE()
  try {
    await chat(background, { messages: [{ role: "user", content: "hi" }] })
    assert.equal(stub.calls[0].reasoning_effort, "none", "后台调用不再想（§9.6 副作用面，防误当缺陷改掉）")
    assert.equal("enable_thinking" in stub.calls[0], false, "非百炼 host ⇒ 零变面")
  } finally { stub.restore() }
})
