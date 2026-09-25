/**
 * advisor-provider-resolve.test.mjs — advisor provider 解析链的 off 形保形面（设计 `docs/core/design/MODEL-SPECS.md`
 * §15.4-3 / §15.7 用例 AD-1..AD-4 · 批 2026-09-25-spec-effort · 台账 #329）。
 *
 * 机制：载荷层 off 门（谓词单源 = `docs/core/design/PROVIDER.md:§6.12`）首款要求 `provider.thinking === null`——
 * `resolveAdvisorProvider`（`advisor/run.mjs`）原把 `cfg.thinking === null` 归一为 `undefined` ⇒ 该门永不开
 * （effort 族 advisor「关思考」静默失效）。本档锁：两分支（自定义渠道 / 主 provider 兜底）**off 形保形** +
 * 显式 off 清继承档（渠条目 / 主 provider 的 `reasoningEffort` 不得随行）+ 端到端载荷面（off 形 ⇒ 体携
 * `reasoning_effort:"none"`；枚举不含 `none` 族 ⇒ 不发该字段、不抛错）；`false`（非法原值）归一 `undefined` 零变。
 * 构造手法：agent 夹件直驱解析 + `globalThis.fetch` 出站体捕获桩（形态循 `provider-merge.test.mjs:172-182`）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { resolveAdvisorProvider } from "../advisor/run.mjs"
import { chat } from "../provider/core.mjs"

const TOKENHUB = "https://tokenhub.tencentmaas.com/v1"

/** fetch 桩：捕获出站请求体 + 回最小 SSE 流。 */
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

test("AD-1 自定义渠道分支：cfg.thinking:null ⇒ off 形保形 + 渠条目继承档清出", () => {
  const channel = { name: "p1", baseURL: TOKENHUB, apiKey: "k1", model: "hy3", reasoningEffort: "high", maxTokens: 4096 }
  const agent = {
    config: { advisor: { provider: "p1", model: "hy3", thinking: null }, providersList: [channel] },
    providers: [channel],
    provider: { name: "main", model: "kimi-k3", baseURL: TOKENHUB, apiKey: "km" },
  }
  const p = resolveAdvisorProvider(agent)
  assert.equal(p.thinking, null, "off 形保形（不归一 undefined——载荷层 off 门首款）")
  assert.equal("reasoningEffort" in p, false, "显式 off 清继承档（渠条目 reasoningEffort 不随行）")
  assert.equal(p.model, "hy3", "解析面零改（cfg.model 仍按原判据覆盖）")
  assert.equal(p.baseURL, TOKENHUB, "渠道字段照旧（只动 thinking / 继承档两项）")
})

test("AD-2 主 provider 兜底分支：cfg.thinking:null ⇒ 同上；false 非法原值 ⇒ 归一 undefined（零变）", () => {
  const main = { name: "main", model: "hy3", baseURL: TOKENHUB, apiKey: "km", reasoningEffort: "high" }
  const pOff = resolveAdvisorProvider({ config: { advisor: { thinking: null } }, provider: main })
  assert.equal(pOff.thinking, null, "off 形保形（兜底分支同判据）")
  assert.equal("reasoningEffort" in pOff, false, "主 provider 的 reasoningEffort 不随显式 off 同行")
  assert.equal(pOff.model, "hy3")

  const pFalse = resolveAdvisorProvider({ config: { advisor: { thinking: false } }, provider: main })
  assert.equal(pFalse.thinking, undefined, "非法原值 false ⇒ 归一 undefined（零变面）")
  assert.equal(pFalse.reasoningEffort, "high", "false 分支不清继承档（零变面——清档只随显式 null）")
})

test("AD-3 载荷面（端到端）：effort 族 advisor + off 形 ⇒ 体携 reasoning_effort:\"none\"", async () => {
  const agent = {
    config: { advisor: { thinking: null } },
    provider: { name: "main", model: "hy3", baseURL: TOKENHUB, apiKey: "km", reasoningEffort: "high" },
  }
  const stub = stubSSE()
  try {
    const res = await chat(resolveAdvisorProvider(agent), { messages: [{ role: "user", content: "hi" }] })
    assert.equal(res.content, "ok", "走完整路径（桩 SSE 回包）")
    assert.equal(stub.calls.length, 1, "恰一次出站")
    assert.equal(stub.calls[0].reasoning_effort, "none", "门开：thinking:null 未被抹 ∧ 无继承档 ⇒ 补发 none")
    assert.equal("thinking" in stub.calls[0], false, "thinking:null 本身不发（falsy 跳过——现状）")
  } finally { stub.restore() }
})

test("AD-4 边界：off 形 + 枚举不含 none（kimi-k3 形）⇒ 不发该字段 + 不抛错", async () => {
  const agent = {
    config: { advisor: { thinking: null } },
    provider: { name: "main", model: "kimi-k3", baseURL: "https://api.moonshot.cn/v1", apiKey: "km", reasoningEffort: "low" },
  }
  const p = resolveAdvisorProvider(agent)
  assert.equal("reasoningEffort" in p, false, "继承档清出（不清则显式档支会误发 low，与 off 意图矛盾）")
  const stub = stubSSE()
  try {
    const res = await chat(p, { messages: [{ role: "user", content: "hi" }] })
    assert.equal(res.content, "ok", "不抛错（guard④ 零变：静默不发，非错误路径）")
    assert.equal("reasoning_effort" in stub.calls[0], false, "枚举无 none ⇒ 不发该字段（零变面）")
  } finally { stub.restore() }
})
