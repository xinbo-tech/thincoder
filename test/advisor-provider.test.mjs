/**
 * advisor-provider.test.mjs — F-1 候选源修复（ISSUE-FIX-BATCH §1，Gitee IKE85W——
 * docs/design/ISSUE-FIX-BATCH.md，2026-09-09）：resolveAdvisorProvider 在 cfg.provider
 * 场景的候选源 = agent.providers（父——全量）→ config.providersList（child——spawn
 * childConfig 拷贝父 config 带全量，child 无 agent.providers）→ [agent.provider] 遗留。
 * .length 空数组守卫：providers=[] 不得静默跳过列表查找（?? 遇 [] 不落链）。错配场景
 * （advisor.provider ≠ child 实际 provider）从 providersList 正确解析——无 throw 无 warn。
 * 纯函数直驱——import 无真实 config 读（同 advisor-description 先例）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { resolveAdvisorProvider } from "../src/advisor/run.mjs"

const P_MAIN = { name: "main", baseURL: "https://main.example/v1", model: "m-main" }
const P_ALT = { name: "alt", baseURL: "https://alt.example/v1", model: "m-alt", apiKey: "k-alt" }
const CFG = { provider: "alt", model: "m-alt-x" } // advisor 配置：provider≠child 实际

/** agent 夹具：child 形态（无 agent.providers）默认；父形态/守卫态由 overrides 覆盖 */
const childAgent = () => ({ provider: P_MAIN, config: { providersList: [P_MAIN, P_ALT], advisor: { ...CFG } } })

/** 捕获 console.warn——断言解析成功路径不落警告（旧代码错配场景必 warn） */
function captureWarns(fn) {
  const warns = []
  const orig = console.warn
  console.warn = (...a) => warns.push(a.join(" "))
  try {
    return { result: fn(), warns }
  } finally {
    console.warn = orig
  }
}

test("F-1 父侧不回归——agent.providers 全量优先解析", () => {
  // providersList 故意不含目标——能解析即证明源是 agent.providers（优先级不回归）
  const agent = { provider: P_MAIN, providers: [P_MAIN, P_ALT], config: { providersList: [P_MAIN], advisor: { ...CFG } } }
  const { result, warns } = captureWarns(() => resolveAdvisorProvider(agent))
  assert.deepEqual(result, { ...P_ALT, model: "m-alt-x" }, "agent.providers 全量命中 cfg.provider——model override 应用")
  assert.equal(warns.length, 0, "父侧解析成功——无 warn")
})

test("F-1 child 错配场景——无 agent.providers——从 config.providersList 正确解析（无 throw/无 warn）", () => {
  // child 实际 provider = main；advisor.provider = alt ≠ main——旧代码单元素 [main] 找不到 → throw+warn+错用
  const { result, warns } = captureWarns(() => resolveAdvisorProvider(childAgent()))
  assert.equal(result.name, "alt", "从 providersList 找到 alt——不再退化 [agent.provider]")
  assert.equal(result.baseURL, P_ALT.baseURL, "命中 alt 端点——不把 m-alt-x 错发到 main 端点（403 根因消）")
  assert.equal(result.model, "m-alt-x", "cfg.model override 应用")
  assert.equal(warns.length, 0, "解析成功路径无 warn")
})

test("F-1 空数组守卫——agent.providers=[] 落 providersList（?? 遇 [] 不落链——length 判断生效）", () => {
  const agent = { provider: P_MAIN, providers: [], config: { providersList: [P_MAIN, P_ALT], advisor: { ...CFG } } }
  const { result, warns } = captureWarns(() => resolveAdvisorProvider(agent))
  assert.equal(result.name, "alt", "空 providers 不静默跳过列表查找")
  assert.equal(warns.length, 0, "守卫路径无 warn 回退")
})

test("F-1 遗留腿——providersList 也缺——[agent.provider] 回退仍可解析自身", () => {
  const agent = { provider: P_MAIN, config: { advisor: { provider: "main", model: "m1x" } } }
  const { result, warns } = captureWarns(() => resolveAdvisorProvider(agent))
  assert.deepEqual(result, { ...P_MAIN, model: "m1x" }, "候选源全缺 → [agent.provider] 旧语义保留")
  assert.equal(warns.length, 0, "自身 provider 在候选内——无 warn")
})

test("F-1 未知 provider 错误路径不变——throw 契约保留——warn + 回退主 provider", () => {
  const agent = { provider: P_MAIN, providers: [P_MAIN, P_ALT], config: { providersList: [P_MAIN, P_ALT], advisor: { provider: "nope", model: "mx" } } }
  const { result, warns } = captureWarns(() => resolveAdvisorProvider(agent))
  assert.equal(result.name, "main", "两源皆无 → 回退主 provider（原语义）")
  assert.equal(result.model, "mx", "回退仍应用 cfg.model（表面化——但非静默）")
  assert.equal(warns.length, 1, "warn 明示原因——不静默错用")
  assert.match(warns[0], /not in providers list/, "warn 带 findProvider 原因")
})
