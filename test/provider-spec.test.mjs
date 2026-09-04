/**
 * PROVIDER.md §15 — 模型上下文长度可配置（K 单位）：T-C1..C6
 * - T-C1 providerSpec 覆盖（拷贝不污染共享 spec）
 * - T-C2 压缩阈值跟随覆盖（resolveCompactThreshold 传 provider 对象）
 * - T-C3 loadConfig 非法值（0/-5/"abc"）忽略 + 警告一次（fake-HOME spawn 隔离，不碰真实 ~/.thincoder）
 * - T-C4 未配置回归（无 context 字段行为不变）
 * - T-C5 /model setContextFlow：设 128 → 落盘 providers[].context + 显示 128K；非法/清空
 * - T-C6 显示：/model provider 列表 ctx 标签 + 状态栏 context % 基于覆盖窗口
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import { specForModel, providerSpec, resolveCompactThreshold } from "../src/config.mjs"
import { createPickers } from "../src/tui/pickers.mjs"
import { renderStatus } from "../src/tui/render-frame.mjs"

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

// ====================================================================
// T-C1 — provider 级覆盖 + 拷贝不污染
// ====================================================================

test("T-C1 provider 级覆盖：context=128 → providerSpec 131072；specForModel 仍 1M（不污染共享 spec）", () => {
  const shared = specForModel("deepseek-v4-flash")
  assert.equal(shared.context, 1_000_000)

  const overridden = providerSpec({ model: "deepseek-v4-flash", context: 128 })
  assert.equal(overridden.context, 131072, "128K × 1024 → 131072 tokens")
  assert.notEqual(overridden, shared, "拷贝覆盖，非共享引用")
  assert.equal(overridden.maxOutput, shared.maxOutput, "其余字段保留")

  // 覆盖后共享 spec 未被污染
  assert.equal(specForModel("deepseek-v4-flash"), shared, "查表仍返回原共享对象")
  assert.equal(shared.context, 1_000_000, "共享对象 context 未被改写")

  // 未知模型：默认 spec 上叠加覆盖
  assert.equal(providerSpec({ model: "ghost-model-xyz", context: 8 }).context, 8192)
  assert.equal(providerSpec({ model: "deepseek-v4-flash", context: "128" }).context, 131072, "数字字符串覆盖（code review #1）")
})

// ====================================================================
// T-C2 — 压缩阈值跟随覆盖
// ====================================================================

test("T-C2 压缩阈值跟随：auto 阈值 = 131072 × 0.6（非 1M × 0.6）", () => {
  assert.deepEqual(
    resolveCompactThreshold(null, { model: "deepseek-v4-flash", context: 128 }),
    { value: Math.floor(131072 * 0.6), auto: true },
    "provider 对象 → 覆盖窗口生效"
  )
  assert.equal(Math.floor(131072 * 0.6), 78643)
  assert.deepEqual(
    resolveCompactThreshold(null, "deepseek-v4-flash"),
    { value: 600000, auto: true },
    "字符串（legacy 调用方）→ spec 路径不变"
  )
  assert.deepEqual(
    resolveCompactThreshold(50000, { model: "deepseek-v4-flash", context: 128 }),
    { value: 50000, auto: false },
    "显式阈值仍优先"
  )
})

// ====================================================================
// T-C3 — loadConfig 非法值（fake HOME 隔离 spawn）
// ====================================================================

/** 隔离 HOME 的 config.json 写入（spawn 子进程用，不碰真实 ~/.thincoder） */
function fakeHomeWithConfig(config) {
  const home = mkdtempSync(join(tmpdir(), "thincoder-context-"))
  mkdirSync(join(home, ".thincoder"), { recursive: true })
  writeFileSync(join(home, ".thincoder", "config.json"), JSON.stringify(config))
  return home
}

function runInFakeHome(home, script) {
  return execFileSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: projectRoot,
    env: { ...process.env, USERPROFILE: home, HOME: home },
    encoding: "utf8",
  })
}

test("T-C3 非法值：context=0/-5/\"abc\" → 忽略 + 警告一次；合法值保留且阈值跟随", () => {
  const home = fakeHomeWithConfig({
    providers: [
      { name: "zero", baseURL: "https://a.example.com/v1", model: "deepseek-v4-flash", apiKey: "k", context: 0 },
      { name: "neg", baseURL: "https://a.example.com/v1", model: "deepseek-v4-flash", apiKey: "k", context: -5 },
      { name: "abc", baseURL: "https://a.example.com/v1", model: "deepseek-v4-flash", apiKey: "k", context: "abc" },
      { name: "good", baseURL: "https://a.example.com/v1", model: "deepseek-v4-flash", apiKey: "k", context: 128 },
      { name: "str128", baseURL: "https://a.example.com/v1", model: "deepseek-v4-flash", apiKey: "k", context: "128" }, // 数字字符串归一（code review #1）
    ],
    activeProvider: "good",
  })
  try {
    const out = runInFakeHome(home, `
import assert from "node:assert/strict"
const { loadConfig } = await import("./src/config.mjs")
const warns = []
const orig = console.warn
console.warn = (m) => warns.push(String(m))
const cfg = loadConfig()
console.warn = orig
assert.equal(cfg.providers.length, 5) // 输入 5 个全保留（非法值删 context 字段而非删 provider）
for (const n of ["zero", "neg", "abc"]) {
  const p = cfg.providers.find((x) => x.name === n)
  assert.equal(p.context, undefined, n + " 非法 context 被忽略（删除，用 spec 值）")
}
assert.equal(cfg.providers.find((x) => x.name === "good").context, 128, "合法值保留")
assert.equal(cfg.providers.find((x) => x.name === "str128").context, 128, "数字字符串归一为数字（code review #1）")
assert.equal(warns.length, 3, "每个非法 provider 警告一次")
assert.ok(warns.every((w) => w.includes("context") && w.includes("K units")), "警告消息可读")
// 第二次 load 不再警告（一次警告语义）
const warns2 = []
console.warn = (m) => warns2.push(String(m))
loadConfig()
console.warn = orig
assert.equal(warns2.length, 0, "同 provider 名不重复警告")
// 活动 provider 的合法覆盖生效于压缩阈值
assert.equal(cfg.agent.compactThreshold, Math.floor(131072 * 0.6), "loadConfig 阈值跟随覆盖")
assert.equal(cfg.agent.compactThresholdAuto, true)
console.log("T-C3 OK")
`)
    assert.match(out, /T-C3 OK/)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

// ====================================================================
// T-C4 — 未配置回归
// ====================================================================

test("T-C4 未配置：无 context 字段 → 行为与现有一致（回归）", () => {
  // 无覆盖时 providerSpec 直接返回共享 spec（同一对象，零额外分配）
  assert.equal(providerSpec({ model: "deepseek-v4-flash" }), specForModel("deepseek-v4-flash"))
  // provider 缺失/null → 默认 spec，不抛错不告警
  assert.equal(providerSpec(null).context, 128_000)
  assert.equal(providerSpec(undefined).context, 128_000)
  // resolveCompactThreshold 字符串路径（既有语义，agent.test.mjs 同款断言）
  assert.deepEqual(resolveCompactThreshold(null, "deepseek-v4-pro"), { value: 600000, auto: true })
  assert.deepEqual(resolveCompactThreshold(undefined, "deepseek-chat"), { value: 76800, auto: true })
  // loadConfig 无 context 字段：不告警、阈值按 spec（T-C3 已覆盖告警路径；此处锁 spec 路径）
  const home = fakeHomeWithConfig({
    providers: [{ name: "ds", baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro", apiKey: "k" }],
    activeProvider: "ds",
  })
  try {
    const out = runInFakeHome(home, `
import assert from "node:assert/strict"
const { loadConfig } = await import("./src/config.mjs")
const warns = []
const orig = console.warn
console.warn = (m) => warns.push(String(m))
const cfg = loadConfig()
console.warn = orig
assert.equal(warns.length, 0, "无 context 字段不告警")
assert.equal(cfg.agent.compactThreshold, 600000, "1M × 0.6（spec 值）")
assert.equal(cfg.provider.context, undefined)
console.log("T-C4 OK")
`)
    assert.match(out, /T-C4 OK/)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

// ====================================================================
// T-C5 — 配置界面（/model provider 管理流）
// ====================================================================

/** Minimal ctx mock（与 pickers.test.mjs 同风格） */
function pickersCtx(overrides = {}) {
  const state = {}
  const lines = []
  const ctx = {
    agent: { providers: [], activeProvider: "", provider: {}, config: {} },
    state,
    render: () => {},
    ansi: { bold: "" },
    C: { tool: "", text: "", dim: "", error: "" },
    pushLine: (t) => lines.push(t),
    pushLabel: (t) => lines.push(t),
    persistRaw: async () => {},
    askQuestion: async () => "",
    maskKey: () => "***",
    ...overrides,
  }
  return { ctx, state, lines }
}

test("T-C5 配置界面：setContextFlow 设 context=128 → 落盘 providers[].context；显示 128K", async () => {
  const agent = {
    providers: [{ name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-flash", apiKey: "k" }],
    activeProvider: "deepseek",
    activeModel: null,
    provider: { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-flash", apiKey: "k" },
    config: { agent: { compactThresholdAuto: true, compactThreshold: 600000 } },
  }
  const saved = {}
  const { ctx, state, lines } = pickersCtx({
    agent,
    askQuestion: async () => "128",
    persistRaw: async (mutate) => { saved.raw = {}; mutate(saved.raw) },
  })
  const { setContextFlow, popPicker } = createPickers(ctx)
  const flow = setContextFlow()
  await new Promise((r) => setTimeout(r, 20))
  // 选 provider 后 askQuestion 返回 "128"
  popPicker({ name: "deepseek" })
  await flow
  assert.equal(agent.providers[0].context, 128, "内存 providers[].context 写入")
  assert.equal(saved.raw.providers[0].context, 128, "persistRaw 落盘 providers[].context")
  assert.equal(agent.provider.context, 128, "运行时 provider 同步")
  assert.equal(agent.config.agent.compactThreshold, Math.floor(131072 * 0.6), "auto 阈值跟随覆盖（78643）")
  assert.ok(lines.some((l) => l.includes("ctx = 128K (131072 tokens)")), `显示 128K: ${lines}`)
  assert.equal(state.picker, null, "流程结束 picker 关闭")
})

test("T-C5b 非法输入不落盘（报错）；空输入清空（回 spec 值）", async () => {
  // 非法 "abc"
  const agent = {
    providers: [{ name: "p", baseURL: "https://a.example.com/v1", model: "deepseek-v4-flash", apiKey: "k" }],
    activeProvider: "p", activeModel: null,
    provider: { name: "p", baseURL: "https://a.example.com/v1", model: "deepseek-v4-flash", apiKey: "k" },
    config: { agent: {} },
  }
  let persisted = false
  const { ctx, lines } = pickersCtx({ agent, askQuestion: async () => "abc", persistRaw: async () => { persisted = true } })
  const { setContextFlow, popPicker } = createPickers(ctx)
  const flow = setContextFlow()
  await new Promise((r) => setTimeout(r, 20))
  popPicker({ name: "p" })
  await flow
  assert.equal(agent.providers[0].context, undefined, "非法值不落盘")
  assert.equal(persisted, false, "非法值不触发 persistRaw")
  assert.ok(lines.some((l) => l.includes("Invalid context")), `报错提示: ${lines}`)

  // 空输入清空
  const agent2 = {
    providers: [{ name: "p", baseURL: "https://a.example.com/v1", model: "deepseek-v4-flash", apiKey: "k", context: 128 }],
    activeProvider: "p", activeModel: null,
    provider: { name: "p", baseURL: "https://a.example.com/v1", model: "deepseek-v4-flash", apiKey: "k", context: 128 },
    config: { agent: {} },
  }
  const saved2 = {}
  const { ctx: ctx2, lines: lines2 } = pickersCtx({
    agent: agent2,
    askQuestion: async () => "",
    persistRaw: async (mutate) => { saved2.raw = {}; mutate(saved2.raw) },
  })
  const { setContextFlow: set2, popPicker: pop2 } = createPickers(ctx2)
  const flow2 = set2()
  await new Promise((r) => setTimeout(r, 20))
  pop2({ name: "p" })
  await flow2
  assert.equal(agent2.providers[0].context, undefined, "空输入清空 context")
  assert.equal(saved2.raw.providers[0].context, undefined, "清空落盘（字段删除）")
  assert.equal(agent2.provider.context, undefined, "运行时同步清空")
  assert.ok(lines2.some((l) => l.includes("context cleared")), `清空提示: ${lines2}`)
})

// ====================================================================
// T-C6 — 显示：TUI 模型信息 context 窗口跟随覆盖
// ====================================================================

test("T-C6 显示：/model provider 列表 ctx 标签 + 状态栏 context % 基于覆盖窗口", async () => {
  const agent = {
    providers: [
      { name: "local", baseURL: "https://local.example.com/v1", model: "deepseek-v4-flash", apiKey: "k", context: 128 },
      { name: "official", baseURL: "https://api.deepseek.com", model: "deepseek-v4-flash", apiKey: "k" },
    ],
    activeProvider: "local",
    activeModel: null,
    provider: { model: "deepseek-v4-flash" },
    config: {},
  }
  const { ctx, state } = pickersCtx({ agent })
  const { openModelPicker, popPicker } = createPickers(ctx)
  const flow = openModelPicker()
  await new Promise((r) => setTimeout(r, 20))
  const items = state.picker.filteredItems.filter((i) => i.action === "open-models")
  assert.equal(items.length, 2)
  assert.ok(items[0].text.includes("(ctx 128K)"), `覆盖值显示 128K: ${items[0].text}`)
  assert.ok(items[1].text.includes("(ctx 1M)"), `spec 值显示 1M: ${items[1].text}`)
  popPicker(null)
  await flow

  // 状态栏 context 百分比：65536 tokens 在 128K 覆盖窗口 = 50%，在 1M spec 窗口 = 7%
  const st = {
    lines: [], streaming: "", input: [], cursor: 0,
    history: [], historyIndex: -1, _draft: null, scroll: 0,
    processing: false, controller: null,
    permission: null, permissionPreview: [], question: null,
    picker: null, wizard: null, tasks: [],
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
    ctxCache: { len: -1, tokens: 65536 }, reasoning: "",
    currentTool: null, processingStarted: 0, status: "Ready", queue: [],
  }
  const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, "")
  const base = { cwd: "/t", planMode: false, autoApprove: false, config: {} }
  const lineOv = strip(renderStatus(st, { ...base, provider: { model: "deepseek-v4-flash", context: 128 } }, 120, []))
  assert.ok(lineOv.includes("context 50%"), `覆盖窗口 → 50%: ${lineOv}`)
  const lineSpec = strip(renderStatus(st, { ...base, provider: { model: "deepseek-v4-flash" } }, 120, []))
  assert.ok(lineSpec.includes("context 7%"), `spec 窗口 → 7%: ${lineSpec}`)
})






// ---------------------------------------------------------------- 模型上下文窗口 / 阈值推导


test("config: 上下文窗口映射与压缩阈值推导", async () => {
  const { specForModel, resolveCompactThreshold } = await import("../src/config.mjs")
  assert.equal(specForModel("deepseek-v4-pro").context, 1_000_000)
  assert.equal(specForModel("deepseek-v4-flash").context, 1_000_000)
  assert.equal(specForModel("DeepSeek-V4-Pro").context, 1_000_000) // 大小写不敏感
  assert.equal(specForModel("unknown-model-xyz").context, 128_000) // 未知兜底

  // 显式配置优先
  assert.deepEqual(resolveCompactThreshold(50000, "deepseek-v4-pro"), { value: 50000, auto: false })
  // 未配置时按模型推导：1M 窗口 × 0.6 = 60万
  assert.deepEqual(resolveCompactThreshold(null, "deepseek-v4-pro"), { value: 600000, auto: true })
  // 未知/下线模型 → 128K 兜底 × 0.6 = 76,800
  assert.deepEqual(resolveCompactThreshold(undefined, "deepseek-chat"), { value: 76800, auto: true })
})



test("config: Kimi For Coding 短 ID \"k3\" 命中 kimi-k3 规格（IK5VGJ）", async () => {
  const { specForModel, PROVIDER_PRESETS } = await import("../src/config.mjs")
  // k3 别名 → kimi-k3 完整规格：1M 上下文 / 多模态 / 截断续写 / 推理回显
  const s = specForModel("k3")
  assert.equal(s.context, 1_000_000, "k3 must get 1M context (not the 128K default)")
  assert.equal(s.multimodal, true, "k3 supports images — read_image must not be gated off")
  assert.equal(s.partialMode, true)
  assert.equal(s.reasoningEcho, "required")
  // kimi-k3 本身不受影响（前缀匹配长优先）
  assert.equal(specForModel("kimi-k3").context, 1_000_000)
  // kimi-code 预设存在且指向正确端点
  const preset = PROVIDER_PRESETS["kimi-code"]
  assert.ok(preset, "kimi-code preset must exist")
  assert.equal(preset.baseURL, "https://api.kimi.com/coding/v1")
  assert.equal(preset.model, "k3")
})



test("config: MiMo 预设与规格（按量付费 + Token Plan）", async () => {
  const { specForModel, PROVIDER_PRESETS } = await import("../src/config.mjs")
  // 按量付费（sk- keys）
  const mimo = PROVIDER_PRESETS.mimo
  assert.ok(mimo, "mimo preset must exist")
  assert.equal(mimo.baseURL, "https://api.xiaomimimo.com/v1")
  assert.equal(mimo.model, "mimo-v2.5-pro")
  // Token Plan（tp- keys，独立端点，与按量付费密钥不通用）
  const plan = PROVIDER_PRESETS.mimoplan
  assert.ok(plan, "mimoplan preset must exist")
  assert.equal(plan.baseURL, "https://token-plan-cn.xiaomimimo.com/v1")
  assert.equal(plan.model, "mimo-v2.5-pro")
  // 规格：1M 上下文 / 128K 输出 / 深度思考（thinking.type 默认开）/ 多轮工具调用必须回显推理内容
  const s = specForModel("mimo-v2.5-pro")
  assert.equal(s.context, 1_000_000, "mimo-v2.5-pro must get 1M context (not the 128K default)")
  assert.equal(s.maxOutput, 128_000)
  assert.equal(s.thinkApi, "type")
  assert.equal(s.reasoningEcho, "required", "MiMo 多轮回传 reasoning_content 缺失会 400")
  assert.equal(specForModel("mimo-v2.5").multimodal, true, "mimo-v2.5 is the multimodal variant")
})



test("config: GLM-5.3-Flash 规格（1M 上下文 / 128K 输出 / 多模态）", async () => {
  const { specForModel, PROVIDER_PRESETS } = await import("../src/config.mjs")
  const s = specForModel("glm-5.3-flash")
  assert.equal(s.context, 1_000_000)
  assert.equal(s.maxOutput, 128_000)
  assert.equal(s.multimodal, true, "glm-5.3-flash is multimodal — read_image must not be gated off")
  assert.deepEqual(s.reasoningEffortEnum, ["low", "high", "max"])
  assert.equal(s.noUsageStream, true)
  assert.equal(s.thinkApi, "type", "thinking 始终开（thinking.type，不可关闭）")
  // 默认预设未动（方案 A：只加可用性，不惊动存量用户默认）
  assert.equal(PROVIDER_PRESETS.glm.model, "glm-5.2")
  assert.equal(PROVIDER_PRESETS["glm-code"].model, "glm-5.2")
})




test("config: 未知模型名警告一次（不静默降级，防刷屏）", async () => {
  const { specForModel } = await import("../src/config.mjs")
  const warns = []
  const orig = console.warn
  console.warn = (...a) => warns.push(a.join(" "))
  try {
    const name = `no-such-model-${Date.now()}`
    assert.equal(specForModel(name).context, 128_000) // 降级仍发生
    assert.equal(specForModel(name).context, 128_000) // 第二次不再警告
    assert.equal(warns.length, 1, "warn exactly once per model name")
    assert.ok(warns[0].includes(name))
  } finally {
    console.warn = orig
  }
})


test("specForModel：厂商前缀剥离（zhipu/glm-5.3 → glm-5.3）——第三方 token 市场惯例 (2026-09-04)", () => {
  // 完整名未命中 → 剥 vendor/ 前缀再匹配，命中真实规格而非 128K 默认
  assert.equal(specForModel("ZHIPU/GLM-5.3").context, 1_000_000, "zhipu/ 前缀剥除 → glm-5.3 命中 1M")
  assert.equal(specForModel("zhipu/glm-5.3").thinking, true, "能力字段一并生效")
  assert.equal(specForModel("openai/gpt-4o").context, 128_000, "任何 vendor/ 前缀均可剥（含厂商自身）")
  assert.equal(specForModel("vendor/qwen3.8-max-preview").context, 1_000_000, "多级能力 spec 同前缀命中")
})

test("specForModel：厂商前缀剥离不破坏未知模型降级 warn (2026-09-04)", () => {
  const warns = []
  const orig = console.warn
  console.warn = (...a) => warns.push(a.join(" "))
  try {
    const name = `vendor/${Date.now()}`
    assert.equal(specForModel(name).context, 128_000, "未知 vendor/model 仍降级默认 spec")
    assert.equal(warns.length, 1, "warn once（保留原始 model 名）")
    assert.ok(warns[0].includes(name), "warn 中保留原始 vendor/model 名可诊断")
  } finally {
    console.warn = orig
  }
})

