/**
 * provider-admission.test.mjs — M9 渠道准入校验（配置阶段）+ N2 运行期零探测（CLI 面——T23/T24/T25）。
 *
 * 判据（PROVIDER.md §16.2 M8/M9）：
 * - 探通 → 渠道可用；探得候选直接可用（入会话缓存——不列不可用清单）
 * - 探不通 → 失败消息**逐字长句**（`该渠道不提供模型列表（GET /models {状态}）——无法选择模型，请改用其他渠道`）
 *   + 行内标 `不可用` + 不入默认模型可选来源 + 渠道条目仍可保存（不阻断）
 * - 运行期零探测：非配置流（会话面 L1 / 命令面 / 启动恢复纯函数）零 `/models` 调用
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { loadConfig, _setConfigPathForTest, _resetConfigPathForTest } from "@thincoder/core/config.mjs"
import { handleConfigCommand } from "../src/tui/cmd-config.mjs"
import { handleModelCommand } from "../src/tui/cmd-model.mjs"
import { createModelPicker } from "../src/tui/model-picker.mjs"
import { createConfigHelpers } from "../src/tui/config-helpers.mjs"
import { _clearModelCatalogCache } from "../src/tui/model-catalog.mjs"
import { resolveChildProvider } from "../src/agent-tools/subagent-async.mjs"
import { resolveAdvisorProvider } from "@thincoder/core/advisor/run.mjs"
import { applySession } from "@thincoder/core/session.mjs"

function tmpCfg(content) {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-adm-"))
  const p = join(dir, "config.json")
  writeFileSync(p, JSON.stringify(content, null, 2) + "\n", "utf8")
  return { dir, p }
}

/** fetch 注入（同 list-models 测试型）：记录 (url, opts)；handler 返回 {status, body} 或抛错。 */
function mockFetch(handler) {
  const calls = []
  const orig = globalThis.fetch
  globalThis.fetch = async (url, opts) => {
    calls.push({ url: String(url), opts })
    const r = await handler(String(url), opts, calls.length)
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      json: async () => r.body,
      text: async () => (typeof r.body === "string" ? r.body : JSON.stringify(r.body)),
    }
  }
  return { calls, restore: () => { globalThis.fetch = orig } }
}

const KIMI = { name: "kimi", baseURL: "https://kimi.example/v1", model: "kimi-k3", apiKey: "k" }
const FAIL_TEXT = "该渠道不提供模型列表（GET /models 500）——无法选择模型，请改用其他渠道"

function makeAgent(cfg, provider = KIMI) {
  return {
    providers: cfg.providersList,
    config: cfg,
    activeProvider: provider.name,
    activeModel: provider.model,
    provider: { ...provider },
  }
}

/** ctx 装配：showPicker 走脚本（title → entry|null）；persistRaw 走注入路径的 config helpers。 */
function makeCtx(agent, configPath, pick) {
  const lines = []
  const pickerCalls = []
  const helper = createConfigHelpers(agent, { configPath })
  const ctx = {
    agent,
    pushLine: (text, color) => lines.push({ text, color }),
    pushLabel: () => {},
    askQuestion: async () => "",
    maskKey: (k) => k,
    persistRaw: helper.persistRaw,
    pickModelForSlot: async () => null,
    showPicker: async (title, entries) => {
      pickerCalls.push({ title, entries })
      return pick(title, entries, pickerCalls)
    },
  }
  return { ctx, lines, pickerCalls }
}

function itemByAction(entries, action) {
  return entries.find((e) => e.type === "item" && e.action === action)
}

test("T23 配置阶段准入探通（设默认模型）：渠道可用 + 探得候选直接可选 + 可保存", async () => {
  const t = tmpCfg({ defaultModel: "kimi:kimi-k3", providers: [KIMI] })
  _clearModelCatalogCache()
  _setConfigPathForTest(t.p)
  const m = mockFetch(() => ({ status: 200, body: { data: [{ id: "kimi-k3" }, { id: "kimi-k4" }] } }))
  try {
    const agent = makeAgent(loadConfig())
    let mainVisits = 0
    let dmVisits = 0
    const pick = (title, entries) => {
      if (title === "Config") { mainVisits++; return mainVisits === 1 ? itemByAction(entries, "defaultModel") : null }
      if (title === "Default Model (新会话起点)") { dmVisits++; return dmVisits === 1 ? entries.find((e) => e.provider === "kimi") : null }
      if (title === "kimi models") return { action: "model", model: "kimi-k4" }
      return null
    }
    const { ctx, lines, pickerCalls } = makeCtx(agent, t.p, pick)
    await handleConfigCommand(ctx, [])

    assert.equal(m.calls.length, 1, "配置阶段探一次 /models")
    assert.equal(m.calls[0].url, "https://kimi.example/v1/models")
    const dmMenu = pickerCalls.find((c) => c.title === "Default Model (新会话起点)")
    const row = dmMenu.entries.find((e) => e.type === "item" && e.provider === "kimi")
    assert.match(row.text, /\(2 models\)/, "探得候选数展示——渠道可用")
    assert.doesNotMatch(row.text, /不可用/, "探通渠道不入不可用清单")
    const l2 = pickerCalls.find((c) => c.title === "kimi models")
    const modelRows = l2.entries.filter((e) => e.type === "item").map((e) => e.model)
    assert.deepEqual(modelRows, ["kimi-k3", "kimi-k4"], "探得候选直接可用于默认模型选择")
    assert.equal(JSON.parse(readFileSync(t.p, "utf8")).defaultModel, "kimi:kimi-k4", "默认模型已保存")
    assert.equal(lines.some((l) => l.text.includes("不可用")), false)
  } finally {
    _clearModelCatalogCache()
    _resetConfigPathForTest()
    m.restore()
    rmSync(t.dir, { recursive: true, force: true })
  }
})

test("T24 配置阶段探不通（设默认模型）：逐字长句 + 行内标 不可用 + 不入可选来源 + 不阻断", async () => {
  const t = tmpCfg({ defaultModel: "kimi:kimi-k3", providers: [KIMI] })
  _clearModelCatalogCache()
  _setConfigPathForTest(t.p)
  const m = mockFetch(() => ({ status: 500, body: "boom" }))
  try {
    const agent = makeAgent(loadConfig())
    let mainVisits = 0
    let dmVisits = 0
    const pick = (title, entries) => {
      if (title === "Config") { mainVisits++; return mainVisits === 1 ? itemByAction(entries, "defaultModel") : null }
      if (title === "Default Model (新会话起点)") {
        dmVisits++
        if (dmVisits === 1) return entries.find((e) => e.type === "item" && e.provider === "kimi")
        return null
      }
      return null
    }
    const { ctx, lines, pickerCalls } = makeCtx(agent, t.p, pick)
    await handleConfigCommand(ctx, [])

    const dmMenu = pickerCalls.find((c) => c.title === "Default Model (新会话起点)")
    const row = dmMenu.entries.find((e) => e.type === "item" && e.provider === "kimi")
    assert.match(row.text, /不可用/, "行内标 不可用")
    assert.deepEqual(lines.filter((l) => l.text === FAIL_TEXT).length, 1, "失败消息逐字长句（消息本体）")
    assert.equal(pickerCalls.some((c) => c.title === "kimi models"), false, "不入默认模型可选来源（不展开候选）")
    assert.equal(JSON.parse(readFileSync(t.p, "utf8")).defaultModel, "kimi:kimi-k3", "未改写默认模型——配置流不阻断")
    assert.equal(JSON.parse(readFileSync(t.p, "utf8")).providers[0].name, "kimi", "渠道条目零损")
  } finally {
    _clearModelCatalogCache()
    _resetConfigPathForTest()
    m.restore()
    rmSync(t.dir, { recursive: true, force: true })
  }
})

test("T24 加渠道探不通：条目仍可保存（不阻断）+ 标不可用 + 明示原因", async () => {
  const t = tmpCfg({ providers: [] })
  _clearModelCatalogCache()
  _setConfigPathForTest(t.p)
  const m = mockFetch(() => ({ status: 404, body: "nope" }))
  try {
    const cfg = loadConfig()
    const agent = makeAgent(cfg, { name: "", baseURL: "", model: "" })
    agent.providers = []
    let mainVisits = 0
    const pick = (title, entries) => {
      if (title === "Models & Providers") { mainVisits++; return mainVisits === 1 ? itemByAction(entries, "add") : null }
      if (title === "Add Provider") return entries.find((e) => e.kind === "preset" && e.name === "kimi")
      return null
    }
    const { ctx, lines } = makeCtx(agent, t.p, pick)
    ctx.askQuestion = async () => "sk-key"
    const picker = createModelPicker({ ...ctx, state: {}, ansi: {}, C: { tool: "t", error: "e", dim: "d" }, closePicker() {}, renderPickerLines() {} })
    await picker.openModelPicker()

    const disk = JSON.parse(readFileSync(t.p, "utf8"))
    assert.equal(disk.providers[0].name, "kimi", "探不通不阻断保存——条目已落盘")
    assert.equal(disk.providers[0].model, "kimi-k3", "单值播种（preset.model）")
    assert.equal(disk.providers[0].apiKey, "sk-key")
    assert.equal("models" in disk.providers[0], false, "无候选清单字段")
    assert.equal(agent.providers[0]._unavailable, true, "会话内存标「不可用」")
    assert.equal(m.calls.length, 1, "加渠道流探一次（不重复探测）")
    assert.ok(lines.some((l) => l.text.includes("不可用")), "界面明示不可用")
    assert.ok(lines.some((l) => l.text.includes("该渠道不提供模型列表（GET /models 404）——无法选择模型，请改用其他渠道")), "明示原因（长句）")
  } finally {
    _clearModelCatalogCache()
    _resetConfigPathForTest()
    m.restore()
    rmSync(t.dir, { recursive: true, force: true })
  }
})

test("T23/T24 设 API key 面（M9）：探通清标记 / 探不通标不可用——精确一次探测", async () => {
  const t = tmpCfg({ providers: [KIMI] })
  _clearModelCatalogCache()
  _setConfigPathForTest(t.p)
  let fail = false
  const m = mockFetch(() => (fail ? { status: 500, body: "boom" } : { status: 200, body: { data: [{ id: "kimi-k3" }] } }))
  try {
    const agent = makeAgent(loadConfig())
    agent.providers[0]._unavailable = true // 旧标记——探通应清
    const { ctx, lines } = makeCtx(agent, t.p, () => null)
    const picker = createModelPicker({ ...ctx, state: {}, ansi: {}, C: { tool: "t", error: "e", dim: "d" }, closePicker() {}, renderPickerLines() {} })
    await picker.setProviderKey("kimi", "sk-new")
    assert.equal(m.calls.length, 1, "设 key 探一次（fresh——真发请求）")
    assert.equal(agent.providers[0]._unavailable, undefined, "探通清「不可用」标记")
    assert.equal(agent.providers[0].apiKey, "sk-new", "key 已保存（不阻断）")
    assert.ok(lines.some((l) => l.text.includes("/models 可用")), "探通明示")
    // 探不通：仍不阻断（key 已存），标不可用 + 长句；**TTL 内也真发请求**（不被同渠道旧缓存短路）
    fail = true
    await picker.setProviderKey("kimi", "sk-2")
    assert.equal(m.calls.length, 2, "换 key 后再探——未被 60s 会话缓存短路")
    assert.equal(agent.providers[0]._unavailable, true, "探不通标「不可用」")
    assert.equal(agent.providers[0].apiKey, "sk-2", "key 仍保存（不阻断配置流）")
    assert.ok(lines.some((l) => l.text.includes("该渠道不提供模型列表（GET /models 500）——无法选择模型，请改用其他渠道")), "长句明示原因")
  } finally {
    _clearModelCatalogCache()
    _resetConfigPathForTest()
    m.restore()
    rmSync(t.dir, { recursive: true, force: true })
  }
})

test("T25 运行期零探测：会话面 L1 / 命令面 / 启动恢复纯函数零 /models 调用", async () => {
  const t = tmpCfg({ defaultModel: "kimi:kimi-k3", providers: [KIMI] })
  _clearModelCatalogCache()
  _setConfigPathForTest(t.p)
  const m = mockFetch(() => ({ status: 200, body: { data: [{ id: "should-not-fetch" }] } }))
  try {
    const cfg = loadConfig() // 启动读配置
    assert.equal(m.calls.length, 0, "启动零探测")
    const agent = makeAgent(cfg)
    agent.providers = cfg.providersList

    // 会话面 L1（渠道列表）——零探测（拉取只在进入 L2 时发生）
    const { ctx } = makeCtx(agent, t.p, () => null)
    const picker = createModelPicker({ ...ctx, state: {}, ansi: {}, C: { tool: "t", error: "e", dim: "d" }, closePicker() {}, renderPickerLines() {} })
    await picker.openModelPicker()
    assert.equal(m.calls.length, 0, "L1 渠道面零探测（无启动期网络依赖）")

    // 命令面 /model provider:model 放行（R4——不受渠道准入约束）——零探测
    let selected = null
    await handleModelCommand({
      agent,
      openModelPicker: async () => {},
      selectModel: async (x) => { selected = x },
      pushLine: () => {},
    }, ["kimi:any-model-at-all"])
    assert.deepEqual(selected, { provider: "kimi", model: "any-model-at-all" }, "命令面放行不变")
    assert.equal(m.calls.length, 0, "命令面零探测")

    // 启动恢复 / 克隆解析纯函数——零探测
    applySession(agent, { history: [], contextHistory: [], activeProvider: "kimi", activeModel: "kimi-k3" })
    resolveChildProvider({ provider: { ...KIMI }, config: { providersList: [KIMI] } }, "kimi")
    resolveAdvisorProvider({ provider: { ...KIMI }, providers: [KIMI], config: { providersList: [KIMI], advisor: { provider: "kimi" } } })
    assert.equal(m.calls.length, 0, "恢复/克隆链零 /models")
  } finally {
    _clearModelCatalogCache()
    _resetConfigPathForTest()
    m.restore()
    rmSync(t.dir, { recursive: true, force: true })
  }
})
