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
