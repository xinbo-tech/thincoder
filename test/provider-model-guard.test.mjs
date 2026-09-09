/**
 * provider-model-guard.test.mjs — MODEL-400-FIX（docs/design/MODEL-400-FIX.md——评审采纳版）
 * F-1 请求体断言 + F-2 克隆现场 model 重派生（CLI 面——VSC 同名测试镜像）。
 *
 * 根因：MODEL-MERGE 删渠道 model 字段（渠道只带 models[] 候选）——`{...渠道}` 裸克隆不
 * 重派生 .model → model 键缺失 → JSON.stringify 丢 undefined 键 → 无 model 请求 → serde 400
 * （digest/advisor 无 echo 走克隆链落空；主会话 per-message echo 正常）。
 *
 * 覆盖（用例表 + 验收 AC-1/AC-2）：
 * - F-1 model undefined/null/空串 → 经真实 chat() 可读 throw（ProviderError——带 provider 名
 *   + 修复线索）——不发病体（guard 在 body 组装前——pre-network，不 mock fetch）
 * - F-2a resolveAdvisorProvider：cfg.provider 命中但无 cfg.model → model = 命中渠道 models[0]
 *   （跨渠道——非主 provider model——QUICKFIX-BATCH-2 F-2；渠道自带 .model 优先——legacy
 *   形态不回归）；链式空兜 → 仍 throw（F-1）
 * - F-2c resolveChildProvider：裸渠道名（byName）→ models[0]；渠道无候选 → 主 provider.model
 * - F-2d applySession：槽 activeModel="" + models 有候选 → 兜 models[0]（`||` 非 `??`——
 *   空串也兜）；null 槽回退不回归
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { chat } from "../src/provider/core.mjs"
import { resolveAdvisorProvider } from "../src/advisor/run.mjs"
import { resolveChildProvider } from "../src/agent-tools/subagent-async.mjs"
import { applySession } from "../src/session.mjs"

// ─── F-1 请求体断言（AC-1）───
// 全部同步快（guard 在 body 组装前 throw——pre-network）——快层直跑不标 slow。
const F1_RE = /provider "deepseek": model is undefined — provider cloned without model re-derivation \(MODEL-MERGE schema: channels carry models\[\] not model\)/

function runProvider(model) {
  return { name: "deepseek", baseURL: "https://api.deepseek.com/v1", apiKey: "k-test", model }
}

test("F-1 model undefined → 可读 throw（带 provider 名 + 修复线索）——不发病体", async () => {
  await assert.rejects(() => chat(runProvider(undefined), { messages: [{ role: "user", content: "hi" }] }), F1_RE)
})

test("F-1 model null → 同 throw（另一类 serde 错防住）", async () => {
  await assert.rejects(() => chat(runProvider(null), { messages: [{ role: "user", content: "hi" }] }), F1_RE)
})

test("F-1 model 空串 → 同 throw（falsy 全拦）", async () => {
  await assert.rejects(() => chat(runProvider(""), { messages: [{ role: "user", content: "hi" }] }), F1_RE)
})

// ─── F-2 克隆现场 model 重派生（AC-2）───

// F-2a advisor：cfg.provider 命中渠道（新 schema——models[] 无 model）但无 cfg.model
const MAIN = { name: "deepseek", baseURL: "https://api.deepseek.com/v1", model: "deepseek-v4-flash", apiKey: "k-main" }
// 渠道新 schema 形态：models[] 候选、无 model 字段（MODEL-MERGE）
const KIMI = { name: "kimi", baseURL: "https://api.moonshot.cn/v1", models: ["kimi-k3", "kimi-k2"], apiKey: "k-ch" }

test("F-2a advisor 跨渠道 无 cfg.model → model = 命中渠道 models[0]（非主 provider model——QUICKFIX-BATCH-2 F-2）", () => {
  const agent = { provider: MAIN, providers: [MAIN, KIMI], config: { providersList: [MAIN, KIMI], advisor: { provider: "kimi" } } }
  const r = resolveAdvisorProvider(agent)
  assert.equal(r.name, "kimi", "渠道命中")
  assert.equal(r.baseURL, KIMI.baseURL, "端点=advisor 渠道——model 重派生不换端点")
  assert.equal(r.model, "kimi-k3", "model = 命中渠道（kimi）models[0]")
  assert.notEqual(r.model, MAIN.model, "不再借主 provider 的 model 发别家端点（403 险）")
})

test("F-2a 同渠道（cfg.provider=主渠道 models[] 形态）无 cfg.model → model = 主渠道 models[0]（同渠道不回归）", () => {
  const MAIN_M = { name: "deepseek", baseURL: "https://api.deepseek.com/v1", models: ["deepseek-v4-flash", "deepseek-v4-pro"], apiKey: "k-main" }
  const agent = { provider: MAIN_M, providers: [MAIN_M], config: { providersList: [MAIN_M], advisor: { provider: "deepseek" } } }
  assert.equal(resolveAdvisorProvider(agent).model, "deepseek-v4-flash", "命中渠道 = 主渠道 → 自己的 models[0]")
})

test("F-2a legacy 渠道自带 .model → 保留自身 model（provider.model ?? models[0] 首取渠道值——不回归）", () => {
  const KIMI_L = { name: "kimi", baseURL: "https://x", model: "kimi-legacy", apiKey: "k" }
  const agent = { provider: MAIN, providers: [KIMI_L], config: { providersList: [KIMI_L], advisor: { provider: "kimi" } } }
  assert.equal(resolveAdvisorProvider(agent).model, "kimi-legacy")
})

test("F-2a 渠道无候选（models 空）→ model undefined——留 F-1 断言兜（不发病体）", () => {
  const EMPTY_CH = { name: "kimi", baseURL: "https://x", models: [], apiKey: "k" }
  const agent = { provider: { name: "main", baseURL: "https://x", apiKey: "k" }, providers: [EMPTY_CH], config: { providersList: [EMPTY_CH], advisor: { provider: "kimi" } } }
  const r = resolveAdvisorProvider(agent)
  assert.equal(r.model, undefined, "渠道无候选 → 无 model——留 F-1 断言兜（不发病体）")
  assert.equal(r.name, "kimi")
})

// F-2c byName 裸渠道名
test("F-2c 裸渠道名（byName）→ model = byName.models[0]（候选首——老'渠道默认'残留形态）", () => {
  const parent = { provider: { ...MAIN }, config: { providersList: [KIMI] } }
  const r = resolveChildProvider(parent, "kimi")
  assert.equal(r.name, "kimi")
  assert.equal(r.model, "kimi-k3", "models[0] 命中")
  assert.equal(r.apiKey, KIMI.apiKey.trim(), "withKey 键清理语义保留")
})

test("F-2c 渠道无候选 → model = parent.provider.model（主 provider 兜底）", () => {
  const parent = { provider: { ...MAIN }, config: { providersList: [{ name: "kimi", baseURL: "https://x", models: [], apiKey: "k" }] } }
  const r = resolveChildProvider(parent, "kimi")
  assert.equal(r.model, MAIN.model)
})

test("F-2c 回归——'p:m' 冒号形态 / 裸模型名 / null / 'default' 语义不变", () => {
  const parent = { provider: { ...MAIN }, config: { providersList: [KIMI] } }
  assert.equal(resolveChildProvider(parent, "kimi:kimi-k2").model, "kimi-k2", "p:m 显式模型不变")
  const bare = resolveChildProvider(parent, "deepseek-v4-pro")
  assert.equal(bare.model, "deepseek-v4-pro", "裸模型名 → 主渠道换模型不变")
  assert.equal(resolveChildProvider(parent, null).model, MAIN.model, "null → 主 provider 原样")
  assert.equal(resolveChildProvider(parent, "default").model, MAIN.model, "'default' 别名不变")
})

// F-2d applySession 空槽兜
function slotAgent(models) {
  return {
    providers: [{ name: "deepseek", baseURL: "https://api.deepseek.com/v1", models, apiKey: "k" }],
    activeProvider: null, activeModel: null, provider: {}, config: { agent: {} },
  }
}

test("F-2d 空槽（activeModel=\"\" + models 有候选）→ 兜 models[0]（|| 非 ??——空串也兜）", () => {
  const agent = slotAgent(["deepseek-v4-flash", "deepseek-v4-pro"])
  applySession(agent, { history: [], contextHistory: [], activeProvider: "deepseek", activeModel: "" })
  assert.equal(agent.activeModel, "deepseek-v4-flash")
  assert.equal(agent.provider.model, "deepseek-v4-flash", "provider.model 键不缺失")
})

test("F-2d null 槽（legacy）回退不回归——仍回渠道首候选", () => {
  const agent = slotAgent(["deepseek-v4-flash"])
  applySession(agent, { history: [], contextHistory: [], activeProvider: "deepseek", activeModel: null })
  assert.equal(agent.activeModel, "deepseek-v4-flash")
})

test("F-2d 有值槽（activeModel 非空）按槽值设——不落链", () => {
  const agent = slotAgent(["deepseek-v4-flash", "deepseek-v4-pro"])
  applySession(agent, { history: [], contextHistory: [], activeProvider: "deepseek", activeModel: "deepseek-v4-pro" })
  assert.equal(agent.activeModel, "deepseek-v4-pro")
})
