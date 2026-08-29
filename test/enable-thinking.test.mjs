/**
 * enable-thinking.test.mjs — Qwen 思考关闭映射 enable_thinking（docs/design/PROVIDER.md §12, 2026-08-28）
 *
 * 覆盖：T1-T5 纯函数白名单/映射、T6 /think off→thinking:null 与 autoThink 清空语义（NF1）、
 * T8-T10 交付评审 #1-#3 修订（off→effort/auto 清 null 标记、on 默认枚举首值、头部 null 显示 OFF）、
 * body 注入端到端（stub globalThis.fetch，断言请求体）、双端 parity（函数体比对，
 * thincoder-vscode 不存在时动态 skip —— 同 cross-repo-parity.test.mjs 先例）。
 * T7（真实端点冒烟）不在此——由用户在真实 qwen 会话验收。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { resolveEnableThinking, isBailianHost, specForModel } from "../src/config.mjs"
import { handleThinkCommand } from "../src/tui/cmd-think.mjs"

const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const VS_CONFIG = join(TEST_DIR, "..", "..", "thincoder-vscode", "src", "config.mjs")

const BAILIAN = "https://dashscope.aliyuncs.com/compatible-mode/v1"
const specOf = (model) => specForModel(model)

// ─── T1-T5：resolveEnableThinking 纯函数（PROVIDER.md §12 测试表）──

test("T1: 百炼 qwen 显式 off（thinking:null）→ enable_thinking false", () => {
  const p = { model: "qwen3.8-max", baseURL: "https://dashscope.aliyuncs.com/v1", thinking: null }
  assert.equal(resolveEnableThinking(p, specOf(p.model)), false)
})

test("T2: 百炼 qwen 带 effort 档位 → enable_thinking true", () => {
  const p = { model: "qwen3.8-max", baseURL: "https://dashscope.aliyuncs.com/v1", reasoningEffort: "xhigh" }
  assert.equal(resolveEnableThinking(p, specOf(p.model)), true)
})

test("T3: 非白名单模型（kimi-k3）显式 off → undefined（不映射）", () => {
  const p = { model: "kimi-k3", baseURL: "https://api.moonshot.cn/v1", thinking: null }
  assert.equal(resolveEnableThinking(p, specOf(p.model)), undefined)
})

test("T4: qwen 但非百炼域名（自建代理）→ undefined", () => {
  const p = { model: "qwen3.7-max", baseURL: "https://my-proxy.example.com/v1", reasoningEffort: "high" }
  assert.equal(resolveEnableThinking(p, specOf(p.model)), undefined)
})

test("T5: qwen3-coder（无思考编码型号）→ undefined（百炼域名也排除）", () => {
  const p = { model: "qwen3-coder-plus", baseURL: "https://coding-intl.dashscope.aliyuncs.com/v1", reasoningEffort: "high" }
  assert.equal(resolveEnableThinking(p, specOf(p.model)), undefined)
})

test("补充: .maas.aliyuncs.com 套餐域名入白名单；未设置 thinking/effort → undefined（服务端默认不变）", () => {
  const maas = { model: "qwen3.7-max", baseURL: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", reasoningEffort: "high" }
  assert.equal(resolveEnableThinking(maas, specOf(maas.model)), true)
  const unset = { model: "qwen3.8-max", baseURL: BAILIAN }
  assert.equal(resolveEnableThinking(unset, specOf(unset.model)), undefined)
})

test("isBailianHost: dashscope / .maas 命中，其余（含非字符串）不命中", () => {
  assert.equal(isBailianHost("https://dashscope.aliyuncs.com/v1"), true)
  assert.equal(isBailianHost("https://token-plan.cn-beijing.maas.aliyuncs.com/v1"), true)
  assert.equal(isBailianHost("https://api.moonshot.cn/v1"), false)
  assert.equal(isBailianHost(undefined), false)
  assert.equal(isBailianHost(null), false)
})

// ─── T6：/think off → thinking:null（NF1 显式 off 约定）；autoThink 清空保持 undefined ──

function thinkCtx(agent, picker) {
  const synced = []
  const ctx = {
    agent,
    showPicker: picker ?? (async () => null),
    syncProviderField: async (field, value) => { synced.push([field, value]) },
    pushLine: () => {},
    pushLabel: () => {},
  }
  return { ctx, synced }
}

test("T6a: /think off（effort-only qwen）→ thinking:null 且 reasoningEffort 删除，并同步落盘", async () => {
  const agent = { provider: { model: "qwen3.7-max", reasoningEffort: "high" }, config: {} }
  const { ctx, synced } = thinkCtx(agent)
  await handleThinkCommand(ctx, ["off"])
  assert.equal(agent.provider.thinking, null)
  assert.ok(!("reasoningEffort" in agent.provider))
  assert.deepEqual(synced, [["thinking", null], ["reasoningEffort", undefined]])
  // off 状态直接驱动映射：enable_thinking false（F1 闭环）
  assert.equal(resolveEnableThinking({ baseURL: BAILIAN, ...agent.provider }, specOf(agent.provider.model)), false)
})

test("T6b: /think on（effort-only qwen）→ 删除 thinking 标记（不携带 null），effort 恢复枚举首值", async () => {
  const agent = { provider: { model: "qwen3.7-max", thinking: null }, config: {} }
  const { ctx, synced } = thinkCtx(agent)
  await handleThinkCommand(ctx, ["on"])
  assert.ok(!("thinking" in agent.provider))
  // 默认值取 spec 枚举首值（评审 #2）：qwen3.7-max enum ["xhigh","high"] → "xhigh"
  assert.equal(agent.provider.reasoningEffort, "xhigh")
  assert.deepEqual(synced, [["thinking", undefined], ["reasoningEffort", "xhigh"]])
  // on 状态驱动映射：enable_thinking true（F2 闭环）
  assert.equal(resolveEnableThinking({ baseURL: BAILIAN, ...agent.provider }, specOf(agent.provider.model)), true)
})

test("T6c: autoThink 开启清空 → thinking 与 reasoningEffort 皆 undefined（null 只来自显式 off）", async () => {
  const agent = { provider: { model: "qwen3.7-max", reasoningEffort: "high" }, config: { agent: {} } }
  const picker = async (_title, entries) => entries.find((e) => e.action === "auto")
  const { ctx } = thinkCtx(agent, picker)
  await handleThinkCommand(ctx, [])
  assert.equal(agent.config.agent.autoThink, true)
  assert.equal(agent.provider.reasoningEffort, undefined)
  assert.equal(agent.provider.thinking, undefined)
})

test("回归: thinking-type 模型（glm-5.2）/think off|on 语义不变", async () => {
  const agent = { provider: { model: "glm-5.2", thinking: { type: "enabled" }, reasoningEffort: "max" }, config: {} }
  const { ctx } = thinkCtx(agent)
  await handleThinkCommand(ctx, ["off"])
  assert.deepEqual(agent.provider.thinking, { type: "disabled" })
  assert.ok(!("reasoningEffort" in agent.provider))
  await handleThinkCommand(ctx, ["on"])
  assert.deepEqual(agent.provider.thinking, { type: "enabled" })
  assert.equal(agent.provider.reasoningEffort, "high")
})

// ─── T8-T10：交付评审 #1-#3 修订（PROVIDER.md §12 测试表，2026-08-28）──

test("T8: /think off → /think effort xhigh → null 标记被清，无矛盾载荷（评审 #1）", async () => {
  const agent = { provider: { model: "qwen3.8-max" }, config: {} }
  const { ctx, synced } = thinkCtx(agent)
  await handleThinkCommand(ctx, ["off"])
  assert.equal(agent.provider.thinking, null)
  // off 后再选档位：thinking:null 必须被清，effort 生效
  await handleThinkCommand(ctx, ["effort", "xhigh"])
  assert.ok(!("thinking" in agent.provider), "thinking:null off 标记必须被清除")
  assert.equal(agent.provider.reasoningEffort, "xhigh")
  assert.deepEqual(synced.slice(2), [["thinking", undefined], ["reasoningEffort", "xhigh"]])
  // 映射闭环：enable_thinking true（F2），不存在 enable_thinking:false + reasoning_effort 矛盾
  assert.equal(resolveEnableThinking({ baseURL: BAILIAN, ...agent.provider }, specOf(agent.provider.model)), true)
})

test("T8b: /think off → 开 autoThink → null 标记被清（评审 #1 的 auto 序列）", async () => {
  const agent = { provider: { model: "qwen3.8-max" }, config: { agent: {} } }
  const { ctx, synced } = thinkCtx(agent)
  await handleThinkCommand(ctx, ["off"])
  assert.equal(agent.provider.thinking, null)
  // 交互菜单开 auto：清 off 标记（否则 auto 每轮写的 reasoning_effort 与 enable_thinking:false 矛盾）
  const picker = async (_title, entries) => entries.find((e) => e.action === "auto")
  await handleThinkCommand({ ...ctx, showPicker: picker }, [])
  assert.equal(agent.config.agent.autoThink, true)
  assert.equal(agent.provider.thinking, undefined, "开 auto 必须清 thinking:null off 标记")
  assert.ok(synced.some(([f, v]) => f === "thinking" && v === undefined), "thinking 清除须落盘")
  // autoThink off 侧语义不动：再关 auto 不产生 thinking 字段
  await handleThinkCommand({ ...ctx, showPicker: picker }, [])
  assert.equal(agent.config.agent.autoThink, false)
  assert.ok(!("thinking" in agent.provider))
})

test("T9: /think on（effort-only，无既有 effort）默认 effort 取 spec 枚举首值（评审 #2）", async () => {
  for (const model of ["qwen3.8-max", "qwen3.7-max"]) {
    const agent = { provider: { model, thinking: null }, config: {} }
    const { ctx } = thinkCtx(agent)
    await handleThinkCommand(ctx, ["on"])
    const spec = specOf(model)
    assert.equal(agent.provider.reasoningEffort, "xhigh", `${model} 默认取枚举首值`)
    assert.ok(spec.reasoningEffortEnum.includes(agent.provider.reasoningEffort),
      `${model} 默认值必须在枚举内（core.mjs 校验不 throw）`)
  }
})

test("T10: /think 交互菜单头部对 thinking:null（effort-only 显式 off）显示 OFF（评审 #3）", async () => {
  const headerOf = async (provider) => {
    let header
    const picker = async (_title, entries) => { header = entries.find((e) => e.type === "header")?.text; return null }
    await handleThinkCommand(thinkCtx({ provider, config: {} }, picker).ctx, [])
    return header
  }
  const offHeader = await headerOf({ model: "qwen3.8-max", thinking: null })
  assert.match(offHeader, /Thinking: OFF/, "thinking:null 显式 off 不得显示 ON")
  // 对照：undefined（未设置）保持既有 ON 显示——qwen3.x 服务端默认开思考，不得随 #3 误改
  const unsetHeader = await headerOf({ model: "qwen3.8-max", reasoningEffort: "xhigh" })
  assert.match(unsetHeader, /Thinking: ON/, "未设置时维持既有 ON 显示")
})

// ─── body 注入端到端（stub fetch，断言请求体）──

test("body 注入: off → enable_thinking:false；档位 → true + reasoning_effort；非白名单无字段", async () => {
  const { chat } = await import("../src/provider/index.mjs")
  const bodies = []
  const origFetch = globalThis.fetch
  globalThis.fetch = async (_url, opts) => {
    bodies.push(JSON.parse(opts.body))
    return new Response(
      'data: {"choices":[{"index":0,"delta":{"content":"ok"}}]}\n\n' +
      'data: {"choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":1,"completion_tokens":1,"total_tokens":2}}\n\n' +
      "data: [DONE]\n\n",
      { status: 200, headers: { "Content-Type": "text/event-stream" } },
    )
  }
  const hi = { messages: [{ role: "user", content: "hi" }] }
  try {
    // 显式 off → enable_thinking:false，且无 thinking / reasoning_effort
    await chat({ baseURL: BAILIAN, apiKey: "x", model: "qwen3.8-max", thinking: null }, hi)
    assert.equal(bodies[0].enable_thinking, false)
    assert.ok(!("thinking" in bodies[0]))
    assert.ok(!("reasoning_effort" in bodies[0]))

    // effort 档位 → enable_thinking:true 与既有 reasoning_effort 并存（F2）
    await chat({ baseURL: BAILIAN, apiKey: "x", model: "qwen3.8-max", reasoningEffort: "xhigh" }, hi)
    assert.equal(bodies[1].enable_thinking, true)
    assert.equal(bodies[1].reasoning_effort, "xhigh")

    // 百炼套餐（.maas 域名）档位 → enable_thinking:true
    await chat({ baseURL: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", apiKey: "x", model: "qwen3.7-max", reasoningEffort: "high" }, hi)
    assert.equal(bodies[2].enable_thinking, true)
    assert.equal(bodies[2].reasoning_effort, "high")

    // 非白名单（kimi 显式 off）→ 无 enable_thinking 字段（F4 零变化）
    await chat({ baseURL: "https://api.moonshot.cn/v1", apiKey: "x", model: "kimi-k3", thinking: null }, hi)
    assert.ok(!("enable_thinking" in bodies[3]))

    // qwen 但非百炼域名（自建代理）→ reasoning_effort 照发，无 enable_thinking（T4 body 层）
    await chat({ baseURL: "https://my-proxy.example.com/v1", apiKey: "x", model: "qwen3.7-max", reasoningEffort: "high" }, hi)
    assert.ok(!("enable_thinking" in bodies[4]))
    assert.equal(bodies[4].reasoning_effort, "high")
  } finally {
    globalThis.fetch = origFetch
  }
})

// ─── 双端 parity：函数体比对（NF3，vscode 不在时动态 skip）──

test("双端 parity: resolveEnableThinking / isBailianHost 函数体与 thincoder-vscode 一致", { skip: !existsSync(VS_CONFIG) }, () => {
  const vsSrc = readFileSync(VS_CONFIG, "utf8")
  const extract = (name) => {
    const i = vsSrc.indexOf(`export function ${name}`)
    assert.ok(i >= 0, `vscode config.mjs 缺少 ${name}（可能已漂移）`)
    const end = /^}/m.exec(vsSrc.slice(i))
    assert.ok(end, `${name} 函数体提取失败`)
    return vsSrc.slice(i, i + end.index + 1)
  }
  const norm = (s) => s.replace(/^export\s+/, "").replace(/\s+/g, "")
  for (const fn of [resolveEnableThinking, isBailianHost]) {
    assert.equal(norm(extract(fn.name)), norm(fn.toString()), `${fn.name} 两端实现漂移`)
  }
})
