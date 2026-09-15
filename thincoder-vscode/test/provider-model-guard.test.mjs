/**
 * provider-model-guard.test.mjs — MODEL-400-FIX（docs/design/MODEL-400-FIX.md——评审采纳版）
 * F-1 请求体断言 + F-2 克隆现场 model 重派生（VSC 面——CLI test/provider-model-guard 镜像）。
 * W10 改判（2026-09-15）：F-1 guard 随 provider 面迁核（核 `@thincoder/core/provider/errors.mjs`
 * `assertProviderModel`——核 chat 在 body 组装前调用）；本档 F-1 直驱面由 `buildRequest`（已删档）
 * 改为经核 `chat()` 真路驱动（守卫在 fetch 之前生效——零网络）；F-2 家族模块未迁、原文保留。
 *
 * 根因：渠道裸克隆（`{...渠道}`）不重派生 .model → model 键缺失 → JSON.stringify 丢
 * undefined 键 → 无 model 请求 → serde 400（digest/advisor 无 echo 走克隆链落空）。
 * MODEL-SELECTION（2026-09-10）M3④：渠道默认单值 `providers[].model` 优先，无则父
 * provider 兜底（`_provider.model`）——绝不产出 undefined-model 请求。
 *
 * 覆盖（用例表 + 验收 AC-1/AC-2）：
 * - F-1 provider.model undefined/null/空串 → 核 chat 可读 throw（ProviderError——带
 *   provider 名 + 修复线索）——不发病体（guard 在 body 组装前——不 mock fetch）
 * - F-2b resolveAdvisorProvider：cfg.provider 命中但无 cfg.model → model = 命中渠道默认单值；
 *   渠道无默认模型 → 父 provider 兜底（T28）；cfg.model 显式 → override 不变
 * - F-1（QUICKFIX-BATCH-2——CLI F-2c 镜像）：resolveChildProvider byName 裸渠道名 →
 *   渠道默认单值；无一→ parent model 兜底（T28）
 * - F-2d saveLines 槽装配面（panel-session.mjs 镜像——CLI applySession `||` 语义）：extra 带
 *   activeModel="" 不把空串钉进槽（回退 existing——槽 model 恒有值/恒缺失）；null/缺席保留
 *   槽值（不回归）；真实模型照常替换
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { _setConfigPathForTest } from "../src/config-io.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest, slotPath } from "../src/extension/session-io.mjs"

let dir
let cfgPath
let sessionsDir

before(() => {
  dir = mkdtempSync(join(tmpdir(), "tc-m400-"))
  sessionsDir = join(dir, "sessions")
  mkdirSync(sessionsDir, { recursive: true })
  cfgPath = join(dir, "config.json")
  writeFileSync(cfgPath, JSON.stringify({
    defaultModel: "deepseek:deepseek-v4-pro",
    providers: [
      { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro", apiKey: "k1" },
      { name: "kimi", baseURL: "https://x", model: "kimi-k3", apiKey: "k2" },
    ],
  }, null, 2) + "\n", "utf8")
  _setConfigPathForTest(cfgPath)
  _setSessionsDirForTest(sessionsDir)
})

after(() => {
  _setConfigPathForTest(null)
  _resetSessionsDirForTest()
  try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ }
})

// ─── F-1 请求体断言（AC-1）───

import { chat } from "@thincoder/core/provider/core.mjs"

const F1_RE = /provider "deepseek": model is undefined — provider cloned without model re-derivation/

function runProvider(model) {
  return { name: "deepseek", baseURL: "https://api.deepseek.com/v1", apiKey: "k-test", model }
}

const enc = new TextEncoder()
/** 成功路径桩：closed SSE 流（仅「有 model 不拦」用例需要——捕获请求体）。 */
function stubFetchOk() {
  const orig = globalThis.fetch
  const reqs = []
  globalThis.fetch = async (url, opts) => {
    reqs.push({ url: String(url), ...opts })
    const frames = [
      `data: ${JSON.stringify({ choices: [{ delta: { content: "ok" }, finish_reason: "stop" }] })}\n\n`,
      "data: [DONE]\n\n",
    ]
    let i = 0
    return {
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "text/event-stream" }),
      body: new ReadableStream({ pull(c) { if (i < frames.length) c.enqueue(enc.encode(frames[i++])); else c.close() } }),
      text: async () => "",
    }
  }
  return { reqs, restore: () => { globalThis.fetch = orig } }
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

test("F-1 有 model 不拦——线上请求体照常带 model 键", async () => {
  const stub = stubFetchOk()
  try {
    await chat(runProvider("deepseek-v4-flash"), { messages: [{ role: "user", content: "hi" }] })
    assert.equal(stub.reqs.length, 1, "请求照发")
    assert.equal(JSON.parse(stub.reqs[0].body).model, "deepseek-v4-flash")
  } finally { stub.restore() }
})

// ─── F-2 克隆现场 model 重派生（AC-2）───

// F-2b advisor：cfg.provider 命中渠道（新 schema——渠道默认单值）但无 cfg.model
const MAIN = { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-flash", apiKey: "k-main" }
// W12（2026-09-15）：核 `resolveAdvisorProvider`（`@thincoder/core/advisor/run.mjs`）读
// `agent.provider` + `agent.config.providersList`（核载体——非端侧 `_provider` + 磁盘 config-io）；
// 夹具同批适配（生产装配面 = `agent-state.mjs` 的 `providersList: cfg.providersList` 同形）。
const PROVIDERS_LIST = [
  { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro", apiKey: "k1" },
  { name: "kimi", baseURL: "https://x", model: "kimi-k3", apiKey: "k2" },
]

 test("F-2b advisor 跨渠道 无 cfg.model → model = 命中渠道默认单值（非主 provider model——M3④）", async () => {
  const { resolveAdvisorProvider } = await import("@thincoder/core/advisor/run.mjs") // W12：advisor 镜像删旧——核单源
  const r = resolveAdvisorProvider({ provider: MAIN, config: { advisor: { provider: "kimi" }, providersList: PROVIDERS_LIST } })
  assert.equal(r.name, "kimi", "渠道命中")
  assert.equal(r.baseURL, "https://x", "端点=advisor 渠道——model 重派生不换端点")
  assert.equal(r.model, "kimi-k3", "model = 命中渠道（kimi 渠道）默认单值——非主 provider model")
})

test("F-2b cfg.model 显式 → override 不变（model: cfg.model 分支零回归）", async () => {
  const { resolveAdvisorProvider } = await import("@thincoder/core/advisor/run.mjs") // W12：advisor 镜像删旧——核单源
  const r = resolveAdvisorProvider({ provider: MAIN, config: { advisor: { provider: "kimi", model: "kimi-k3" }, providersList: PROVIDERS_LIST } })
  assert.equal(r.model, "kimi-k3")
})

test("F-2b 同渠道（cfg.provider=主渠道）无 cfg.model → model = 主渠道默认单值（渠道自己的模型——不回归）", async () => {
  const { resolveAdvisorProvider } = await import("@thincoder/core/advisor/run.mjs") // W12：advisor 镜像删旧——核单源
  const r = resolveAdvisorProvider({ provider: MAIN, config: { advisor: { provider: "deepseek" }, providersList: PROVIDERS_LIST } })
  assert.equal(r.model, "deepseek-v4-pro", "config deepseek 渠道默认单值（非 MAIN.model）——主渠道自己的模型")
})

test("F-1 byName 裸渠道名 → model = 渠道默认单值（克隆重派生——CLI F-2c 镜像）；渠道无默认模型 → parent model 兜底（T28）", async () => {
  const { resolveChildProvider } = await import("../src/agent-tools/subagent.mjs")
  const parent = { _provider: MAIN, config: { providersList: [{ name: "kimi", baseURL: "https://x", model: "kimi-k3", apiKey: "k2" }] } }
  assert.equal(resolveChildProvider(parent, "kimi").model, "kimi-k3", "渠道默认单值命中")
  assert.equal(resolveChildProvider({ _provider: MAIN, config: { providersList: [{ name: "kimi", baseURL: "https://x", apiKey: "k2" }] } }, "kimi").model, MAIN.model, "渠道无默认模型 → parent model 兜底")
})

test("T28 渠道无默认模型时 advisor 克隆：provider.model ?? agent.provider.model（父兜底——无 undefined-model 请求）", async () => {
  const { resolveAdvisorProvider } = await import("@thincoder/core/advisor/run.mjs") // W12：advisor 镜像删旧——核单源
  // W12：核解析面读 `agent.config.providersList`（不经磁盘 config-io）——夹具直供无默认模型渠道
  const r = resolveAdvisorProvider({ provider: MAIN, config: { advisor: { provider: "kimi" }, providersList: [
    { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro", apiKey: "k1" },
    { name: "kimi", baseURL: "https://x", apiKey: "k2" },
  ] } })
  assert.equal(r.name, "kimi")
  assert.equal(r.model, MAIN.model, "渠道无默认单值 → 父 provider 兜底（不产出 undefined-model）")
})

test("F-2b 无 cfg.provider → 主 provider 原样（含 model——fallback 分支零回归）", async () => {
  const { resolveAdvisorProvider } = await import("@thincoder/core/advisor/run.mjs") // W12：advisor 镜像删旧——核单源
  const r = resolveAdvisorProvider({ provider: MAIN, config: { advisor: {}, providersList: PROVIDERS_LIST } })
  assert.equal(r.model, MAIN.model)
})

// F-2d panel-session saveLines 槽装配镜像（CLI applySession `||` 语义）——每测试独立 slot
// （消除声明序耦合——单跑/乱序各自成立）
const panelAt = (slot) => ({ _ensureSlot: () => slot })

test("F-2d extra activeModel='' 不钉空串——回退 existing（槽 model 恒有值/恒缺失）", async () => {
  const { saveLines } = await import("../src/extension/panel-session.mjs")
  const panel = panelAt(2)
  saveLines(panel, [{ role: "user", type: "user", content: "a" }], [], { activeProvider: "deepseek", activeModel: "deepseek-v4-flash" }, 2)
  saveLines(panel, [], [], { activeProvider: "deepseek", activeModel: "" }, 2)
  const data = JSON.parse(readFileSync(slotPath(process.cwd(), 2), "utf8"))
  assert.equal(data.activeModel, "deepseek-v4-flash", "空串视为缺失——不清既有槽 model")
})

test("F-2d null/缺席 extra 保留槽值（??→|| 语义零回归——slotStamp null 不落链）", async () => {
  const { saveLines } = await import("../src/extension/panel-session.mjs")
  const panel = panelAt(3)
  saveLines(panel, [], [], { activeProvider: "deepseek", activeModel: "deepseek-v4-flash" }, 3)
  saveLines(panel, [], [], { activeProvider: "deepseek", activeModel: null }, 3)
  saveLines(panel, [], [], { activeProvider: "deepseek" }, 3)
  const data = JSON.parse(readFileSync(slotPath(process.cwd(), 3), "utf8"))
  assert.equal(data.activeModel, "deepseek-v4-flash")
})

test("F-2d 真实模型照常替换（新选择写槽不回归）", async () => {
  const { saveLines } = await import("../src/extension/panel-session.mjs")
  const panel = panelAt(4)
  saveLines(panel, [], [], { activeProvider: "deepseek", activeModel: "deepseek-v4-pro" }, 4)
  const data = JSON.parse(readFileSync(slotPath(process.cwd(), 4), "utf8"))
  assert.equal(data.activeModel, "deepseek-v4-pro")
})
