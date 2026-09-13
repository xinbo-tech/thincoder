/**
 * provider-model-guard.test.mjs — MODEL-400-FIX（MODEL-400-FIX.md——评审采纳版）
 * F-1 请求体断言 + F-2 克隆现场 model 重派生（CLI 面——VSC 同名测试镜像）。
 *
 * 根因：渠道裸克隆（`{...渠道}`）未重派生 `.model` → model 键缺失 → JSON.stringify 丢 undefined
 * 键 → 无 model 请求 → serde 400（digest/advisor 无 echo 走克隆链落空）。
 *
 * MODEL-SELECTION v2（2026-09-10）契约更新（M3④/T28）：渠道默认模型回归**单值** `providers[].model`
 * （models[] 候选清单退场）——克隆兜底链 = 渠道默认单值 ?? 父 provider.model（父兜底）；
 * 两者皆无（极端）→ model 缺失交 chat 前 guard fail-fast（绝不静默 undefined-model 请求）。
 *
 * 覆盖（用例表 + 验收 AC-3）：
 * - F-1 model undefined/null/空串 → 经真实 chat() 可读 throw（ProviderError——带 provider 名
 *   + 修复线索）——不发病体（guard 在 body 组装前——pre-network，不 mock fetch）
 * - F-2a resolveAdvisorProvider：cfg.provider 命中 → 命中渠道单值 model；渠道无默认模型 → 父兜底
 * - F-2c resolveChildProvider：裸渠道名（byName）→ byName.model；无默认模型 → 父 provider.model
 * - F-2d applySession：槽 activeModel="" / null → 兜渠道单值 `providers[].model`（`||` 非 `??`）
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { chat } from "../src/provider/core.mjs"
import { resolveAdvisorProvider } from "../src/advisor/run.mjs"
import { resolveChildProvider } from "../src/agent-tools/subagent-async.mjs"
import { applySession } from "../src/session.mjs"

// ─── F-1 请求体断言（AC-1）───
// 全部同步快（guard 在 body 组装前 throw——pre-network）——快层直跑不标 slow。
const F1_RE = /provider "deepseek": model is undefined — provider cloned without model re-derivation \(set providers\[\]\.model — the channel default model\)/

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

const MAIN = { name: "deepseek", baseURL: "https://api.deepseek.com/v1", model: "deepseek-v4-flash", apiKey: "k-main" }
// 渠道新 schema 形态：单值 model、无 models 字段（MODEL-SELECTION v2）
const KIMI = { name: "kimi", baseURL: "https://api.moonshot.cn/v1", model: "kimi-k3", apiKey: "k-ch" }

test("F-2a advisor 跨渠道 无 cfg.model → model = 命中渠道单值（不借主 provider model）", () => {
  const agent = { provider: MAIN, providers: [MAIN, KIMI], config: { providersList: [MAIN, KIMI], advisor: { provider: "kimi" } } }
  const r = resolveAdvisorProvider(agent)
  assert.equal(r.name, "kimi", "渠道命中")
  assert.equal(r.baseURL, KIMI.baseURL, "端点=advisor 渠道——model 重派生不换端点")
  assert.equal(r.model, "kimi-k3", "model = 命中渠道单值")
  assert.notEqual(r.model, MAIN.model, "不借主 provider 的 model 发别家端点（403 险）")
})

test("F-2a 同渠道（cfg.provider=主渠道）无 cfg.model → model = 主渠道单值（同渠道不回归）", () => {
  const MAIN_M = { name: "deepseek", baseURL: "https://api.deepseek.com/v1", model: "deepseek-v4-flash", apiKey: "k-main" }
  const agent = { provider: MAIN_M, providers: [MAIN_M], config: { providersList: [MAIN_M], advisor: { provider: "deepseek" } } }
  assert.equal(resolveAdvisorProvider(agent).model, "deepseek-v4-flash", "命中渠道 = 主渠道 → 自己的单值")
})

test("T28 渠道无默认模型 → 父 provider.model 兜底（advisor——无静默 undefined-model 请求）", () => {
  const EMPTY_CH = { name: "kimi", baseURL: "https://x", apiKey: "k" } // 单值缺失（M3：空值合法）
  const agent = { provider: { ...MAIN }, providers: [EMPTY_CH], config: { providersList: [EMPTY_CH], advisor: { provider: "kimi" } } }
  const r = resolveAdvisorProvider(agent)
  assert.equal(r.name, "kimi")
  assert.equal(r.model, MAIN.model, "父 provider 兜底（M3④）——不发病体")
})

test("T28 极端（渠道与父皆无 model）→ 交 chat 前 guard fail-fast（不静默）", async () => {
  const EMPTY_CH = { name: "kimi", baseURL: "https://x", apiKey: "k" }
  const agent = { provider: { name: "main", baseURL: "https://x", apiKey: "k" }, providers: [EMPTY_CH], config: { providersList: [EMPTY_CH], advisor: { provider: "kimi" } } }
  const r = resolveAdvisorProvider(agent)
  assert.equal(r.model, undefined, "两者皆无 → 无 model——留 F-1 断言兜（不发病体）")
  await assert.rejects(() => chat(r, { messages: [{ role: "user", content: "hi" }] }), /model is undefined/)
})

// F-2c byName 裸渠道名
test("F-2c 裸渠道名（byName）→ model = byName.model（渠道默认单值）", () => {
  const parent = { provider: { ...MAIN }, config: { providersList: [KIMI] } }
  const r = resolveChildProvider(parent, "kimi")
  assert.equal(r.name, "kimi")
  assert.equal(r.model, "kimi-k3", "渠道单值命中")
  assert.equal(r.apiKey, KIMI.apiKey.trim(), "withKey 键清理语义保留")
})

test("T28 渠道无默认模型 → model = parent.provider.model（主 provider 兜底保留）", () => {
  const parent = { provider: { ...MAIN }, config: { providersList: [{ name: "kimi", baseURL: "https://x", apiKey: "k" }] } }
  const r = resolveChildProvider(parent, "kimi")
  assert.equal(r.model, MAIN.model)
})

test("F-2c 回归——'p:m' 冒号形态 / 裸模型名 / null / 'default' 语义不变", () => {
  const parent = { provider: { ...MAIN }, config: { providersList: [KIMI] } }
  assert.equal(resolveChildProvider(parent, "kimi:kimi-k2").model, "kimi-k2", "p:m 显式模型不变")
  assert.equal(resolveChildProvider(parent, "kimi:").model, "kimi-k3", "空模型段 → 渠道单值（mname || p.model）")
  const bare = resolveChildProvider(parent, "deepseek-v4-pro")
  assert.equal(bare.model, "deepseek-v4-pro", "裸模型名 → 主渠道换模型不变")
  assert.equal(resolveChildProvider(parent, null).model, MAIN.model, "null → 主 provider 原样")
  assert.equal(resolveChildProvider(parent, "default").model, MAIN.model, "'default' 别名不变")
})

// F-2d applySession 空槽兜
function slotAgent(model) {
  return {
    providers: [{ name: "deepseek", baseURL: "https://api.deepseek.com/v1", model, apiKey: "k" }],
    activeProvider: null, activeModel: null, provider: {}, config: { agent: {} },
  }
}

test("F-2d 空槽（activeModel=\"\" + 渠道单值）→ 兜渠道默认模型（|| 非 ??——空串也兜）", () => {
  const agent = slotAgent("deepseek-v4-flash")
  applySession(agent, { history: [], contextHistory: [], activeProvider: "deepseek", activeModel: "" })
  assert.equal(agent.activeModel, "deepseek-v4-flash")
  assert.equal(agent.provider.model, "deepseek-v4-flash", "provider.model 键不缺失")
})

test("F-2d null 槽（legacy）回退不回归——仍回渠道默认模型", () => {
  const agent = slotAgent("deepseek-v4-flash")
  applySession(agent, { history: [], contextHistory: [], activeProvider: "deepseek", activeModel: null })
  assert.equal(agent.activeModel, "deepseek-v4-flash")
})

test("F-2d 有值槽（activeModel 非空）按槽值设——不落链", () => {
  const agent = slotAgent("deepseek-v4-flash")
  applySession(agent, { history: [], contextHistory: [], activeProvider: "deepseek", activeModel: "deepseek-v4-pro" })
  assert.equal(agent.activeModel, "deepseek-v4-pro")
})

test("T14 R3 槽位空兜底：渠道无默认模型 + 空槽 → model 不设（不静默破）", () => {
  const agent = { providers: [{ name: "deepseek", baseURL: "https://x", apiKey: "k" }], activeProvider: null, activeModel: null, provider: {}, config: { agent: {} } }
  applySession(agent, { history: [], contextHistory: [], activeProvider: "deepseek", activeModel: "" })
  assert.equal(agent.activeModel, undefined, "空结果合法——后续由引导流程接管")
})
