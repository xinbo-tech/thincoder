/**
 * model-ref.test.mjs — MODEL-SELECTION v2 复合解析 + /model 会话级写槽（AC-4/AC-5 CLI 面）。
 * - parseModelRef v2（M4）：放行（候选外 / 多冒号首分割）/ 无效三类（空值 / 裸值 / 未知 provider
 *   / 空模型段）；resolveRuntimeProvider 无效 → {}（D-S1 形状）
 * - specMatch（M5）：已知模型 matched:true；未知模型 matched:false（DEFAULT 兜底）
 * - /model selectModel（model-picker.mjs）：写槽不写 config（**config 内容字节断言**——写前快照
 *   对比——非 mtime）；候选外可切换（不再 throw）；切换回显两分支（正常色 / DEFAULT 警示色 + /config 提示）
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync, unlinkSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { parseModelRef, resolveRuntimeProvider, specMatch, _setConfigPathForTest, _resetConfigPathForTest } from "@thincoder/core/config.mjs"
import { sessionPath as sessionFilePath } from "@thincoder/core/session.mjs"

const PROVIDERS = [
  { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro", apiKey: "sk-ds" },
  { name: "kimi", baseURL: "https://api.moonshot.cn/v1", model: "kimi-k3", apiKey: "sk-kimi" },
  { name: "nomodel", baseURL: "https://x" }, // 无默认模型合法（模型选择经 /models 拉取）
]

test("T7 放行：候选外（provider 在、model 任意非空）→ ok:true（不再成员校验）", () => {
  const r = parseModelRef("kimi:any-model", PROVIDERS)
  assert.equal(r.ok, true)
  assert.equal(r.provider.name, "kimi")
  assert.equal(r.model, "any-model")
})

test("T8 边界：多冒号首分割（a:b:c → provider=a、model=b:c）", () => {
  const r = parseModelRef("kimi:llama3:70b", PROVIDERS)
  assert.equal(r.ok, true)
  assert.equal(r.provider.name, "kimi")
  assert.equal(r.model, "llama3:70b")
})

test("T9 无效三类：空值 / 裸值 / 未知 provider（+ 空模型段）各带 reason", () => {
  for (const bad of ["", "   ", "kimi", ":m"]) {
    const r = parseModelRef(bad, PROVIDERS)
    assert.equal(r.ok, false, `"${bad}" 必须拒`)
  }
  assert.match(parseModelRef("kimi:", PROVIDERS).reason, /model part is empty/, "provider: → 空模型段新文案")
  const ghost = parseModelRef("ghost:m", PROVIDERS)
  assert.equal(ghost.ok, false)
  assert.match(ghost.reason, /unknown provider "ghost"/)
  assert.match(ghost.reason, /deepseek, kimi, nomodel/, "保留 available 列表文案")
})

test("resolveRuntimeProvider：候选外不再无效（M4）；无效三类 → {}（D-S1——不 throw）", () => {
  const ok = resolveRuntimeProvider(PROVIDERS, "kimi:kimi-k3")
  assert.equal(ok.name, "kimi")
  assert.equal(ok.model, "kimi-k3")
  assert.equal(ok.apiKey, "sk-kimi", "渠道字段随行（凭据不丢）")
  const outside = resolveRuntimeProvider(PROVIDERS, "kimi:outside")
  assert.equal(outside.name, "kimi", "候选外放行——渠道仍解析")
  assert.equal(outside.model, "outside")
  assert.deepEqual(resolveRuntimeProvider(PROVIDERS, null), {})
  assert.deepEqual(resolveRuntimeProvider(PROVIDERS, "ghost:m"), {})
  assert.deepEqual(resolveRuntimeProvider(PROVIDERS, "kimi:"), {}, "空模型段仍无效")
  assert.deepEqual(resolveRuntimeProvider([], "a:b"), {})
})

test("T21 specMatch：已知模型 matched:true / 未知模型 matched:false（DEFAULT 兜底）", () => {
  const known = specMatch("kimi-k3")
  assert.equal(known.matched, true)
  assert.equal(known.spec.context, 1_000_000)
  const unknown = specMatch("totally-unknown-model-x")
  assert.equal(unknown.matched, false)
  assert.deepEqual(unknown.spec, { context: 128_000, maxOutput: 32_000, cacheMode: "none" })
})

// ── M2：会话面 L2 候选 = 运行期拉取（mock 注入断言）+ 失败态（M8）──

/** 迷你 picker 绑定：state.picker 仿真实实现（loader 的 entries 恒等判定依赖它）；
 *  **0 item 保护同真实 showPicker**（pickers.mjs:48——0 item 立即 resolve(null)、不打开）——
 *  本夹具必须同形，否则「非会话渠道 L2 不打开」类回归测不出来。 */
function miniPickers() {
  const state = {}
  let pending = null
  return {
    state,
    showPicker(title, entries, opts = {}) {
      const itemCount = entries.filter((e) => e.type === "item").length
      if (itemCount === 0) return Promise.resolve(null) // 真实实现同形（0 item 不打开）
      state.picker = { title, entries, index: opts.defaultIndex ?? 0 }
      return new Promise((resolve) => { pending = resolve })
    },
    settle(value) {
      const r = pending
      pending = null
      state.picker = null
      if (r) r(value)
    },
    closePicker() { const r = pending; pending = null; state.picker = null; if (r) r(null) },
    renderPickerLines() {},
  }
}
/** 微任务/宏任务清空（无定时器等待——mock fetch 即时解析；setImmediate 不吃 1ms 定时器惩罚）。 */
const flush = async (n = 5) => { for (let i = 0; i < n; i++) await new Promise((r) => setImmediate(r)) }

function mockFetchOnce(handler) {
  const calls = []
  const orig = globalThis.fetch
  globalThis.fetch = async (url, opts) => {
    calls.push({ url: String(url), opts })
    const r = await handler(String(url), opts)
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      json: async () => r.body,
      text: async () => (typeof r.body === "string" ? r.body : JSON.stringify(r.body)),
    }
  }
  return { calls, restore: () => { globalThis.fetch = orig } }
}

test("M2 回归：非当前渠道 L2 仍可打开（占位行——0-item 不自闭）+ 拉取候选可选", async () => {
  const { _clearModelCatalogCache } = await import("../src/tui/model-catalog.mjs")
  const providers = [
    { name: "kimi", baseURL: "https://kimi.test/v1", model: "kimi-k3", apiKey: "k" },
    { name: "deepseek", baseURL: "https://ds.test/v1", model: "deepseek-v4-pro", apiKey: "k" },
  ]
  const agent = {
    cwd: process.cwd(), history: [], tasks: [],
    activeProvider: "kimi", activeModel: "kimi-k3", // ← 非当前渠道 = deepseek（无 keep 行）
    providers, provider: { ...providers[0] },
    config: { agent: {}, defaultModel: "kimi:kimi-k3" },
  }
  _clearModelCatalogCache()
  const m = mockFetchOnce(() => ({ status: 200, body: { data: [{ id: "deepseek-v4-pro" }, { id: "deepseek-v4-flash" }] } }))
  try {
    const { createModelPicker } = await import("../src/tui/model-picker.mjs")
    const p = miniPickers()
    const picker = createModelPicker({
      agent, state: p.state, ansi: {}, C: { tool: "T_TOOL", error: "T_ERROR", dim: "T_DIM" },
      pushLine: () => {}, askQuestion: async () => "", maskKey: (k) => k, persistRaw: async () => {},
      showPicker: p.showPicker, closePicker: p.closePicker, renderPickerLines: p.renderPickerLines,
    })
    const opening = picker.openModelPicker() // L1
    await flush()
    p.settle({ action: "open-models", provider: "deepseek" })
    await flush()
    assert.equal(p.state.picker?.title, "deepseek models", "非当前渠道 L2 已打开（0-item 未自闭——占位行生效）")
    await flush(20)
    const rows = p.state.picker.entries.filter((e) => e.action === "switch").map((e) => e.model)
    assert.deepEqual(rows, ["deepseek-v4-flash", "deepseek-v4-pro"], "拉取候选可选（跨渠道切换可达；dedupeModels 排序）")
    assert.equal(p.state.picker.entries.some((e) => e.placeholder), false, "占位行已移除")
    assert.equal(m.calls.length, 1)
    p.settle(null)
    await flush()
    p.settle(null)
    await opening
  } finally {
    m.restore()
    _clearModelCatalogCache()
  }
})

test("M2/T5 会话面 L2：候选行来自运行期拉取（mock）；失败 → 该渠道不可选 + M8 长句", async () => {
  const { _clearModelCatalogCache } = await import("../src/tui/model-catalog.mjs")
  const providers = [{ name: "kimi", baseURL: "https://kimi.test/v1", model: "kimi-k3", apiKey: "k" }]
  const agent = {
    cwd: process.cwd(), history: [], tasks: [],
    activeProvider: "kimi", activeModel: "kimi-k3",
    providers, provider: { ...providers[0] },
    config: { agent: {}, defaultModel: "kimi:kimi-k3" },
  }
  // ① 拉通：候选行出现（mock 数据）
  _clearModelCatalogCache()
  const okMock = mockFetchOnce(() => ({ status: 200, body: { data: [{ id: "kimi-k4" }, { id: "kimi-k5" }] } }))
  const p = miniPickers()
  const lines = []
  let picker
  try {
    const { createModelPicker } = await import("../src/tui/model-picker.mjs")
    picker = createModelPicker({
      agent, state: p.state, ansi: {}, C: { tool: "T_TOOL", error: "T_ERROR", dim: "T_DIM" },
      pushLine: (text, color) => lines.push({ text, color }),
      askQuestion: async () => "", maskKey: (k) => k, persistRaw: async () => {},
      showPicker: p.showPicker, closePicker: p.closePicker, renderPickerLines: p.renderPickerLines,
    })
    const opening = picker.openModelPicker() // L1
    await flush()
    p.settle({ action: "open-models", provider: "kimi" }) // → L2（进入即触发拉取）
    await flush()
    const title = p.state.picker?.title
    assert.equal(title, "kimi models")
    await flush(20) // 等 mock 拉取落地（纯微任务链）
    const rows = p.state.picker.entries.filter((e) => e.action === "switch").map((e) => e.model)
    assert.deepEqual(rows, ["kimi-k4", "kimi-k5"], "候选行 = 拉取结果（不再有 models[] 候选区；当前行保留在 keep 行）")
    assert.equal(p.state.picker.entries.filter((e) => e.type === "header").map((h) => h.text).join(" | "), "Current (session): kimi-k3 | Available models (2 — type to filter)")
    p.settle(null) // Esc 回 L1
    await flush()
    p.settle(null) // Esc 出
    await opening
    assert.equal(okMock.calls.length, 1)
    assert.equal(okMock.calls[0].url, "https://kimi.test/v1/models")
  } finally {
    okMock.restore()
    _clearModelCatalogCache()
  }

  // ② 拉取失败：无可选行 + 失败 header + M8 长句（该渠道不可选）
  _clearModelCatalogCache()
  const failMock = mockFetchOnce(() => ({ status: 503, body: "down" }))
  const p2 = miniPickers()
  const lines2 = []
  try {
    const { createModelPicker } = await import("../src/tui/model-picker.mjs")
    const picker2 = createModelPicker({
      agent, state: p2.state, ansi: {}, C: { tool: "T_TOOL", error: "T_ERROR", dim: "T_DIM" },
      pushLine: (text, color) => lines2.push({ text, color }),
      askQuestion: async () => "", maskKey: (k) => k, persistRaw: async () => {},
      showPicker: p2.showPicker, closePicker: p2.closePicker, renderPickerLines: p2.renderPickerLines,
    })
    const opening = picker2.openModelPicker()
    await flush()
    p2.settle({ action: "open-models", provider: "kimi" })
    await flush(20)
    const headers = p2.state.picker.entries.filter((e) => e.type === "header").map((h) => h.text)
    assert.ok(headers.some((h) => h.startsWith("Available models (fetch failed:")), "失败 header")
    const switchRows = p2.state.picker.entries.filter((e) => e.action === "switch")
    assert.equal(switchRows.length, 0, "拉不到的渠道不可选（无可选候选行）")
    assert.ok(lines2.some((l) => l.text === "该渠道不提供模型列表（GET /models 503）——无法选择模型，请改用其他渠道"), "M8 长句逐字")
    p2.settle(null)
    await flush()
    p2.settle(null)
    await opening
  } finally {
    failMock.restore()
    _clearModelCatalogCache()
  }
})


// ── AC-4：/model 会话级——selectModel 写槽不写 config（内容字节断言）──

function pickerHarness(agent, overrides = {}) {
  const lines = []
  const C = { tool: "T_TOOL", error: "T_ERROR", warn: "T_WARN", dim: "T_DIM" }
  return {
    lines,
    picker: null,
    async build() {
      const { createModelPicker } = await import("../src/tui/model-picker.mjs")
      this.picker = createModelPicker({
        agent, state: {}, ansi: {}, C,
        pushLine: (text, color) => lines.push({ text, color }),
        askQuestion: async () => "", maskKey: (k) => k,
        persistRaw: overrides.persistRaw ?? (async () => {}),
        showPicker() {}, closePicker() {}, renderPickerLines() {},
      })
      return this.picker
    },
  }
}

test("AC-4/AC-5 selectModel：写槽不写 config（字节断言）+ 恢复 = 槽值 + 回显（正常分支）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-model-sel-"))
  const cfgPath = join(dir, "config.json")
  const cfgBody = {
    defaultModel: "deepseek:deepseek-v4-pro",
    providers: PROVIDERS.map((p) => ({ ...p })),
  }
  writeFileSync(cfgPath, JSON.stringify(cfgBody, null, 2) + "\n", "utf8")
  _setConfigPathForTest(cfgPath)
  const cwd = join(dir, "proj")
  mkdirSync(cwd, { recursive: true })
  const base = sessionFilePath(cwd)
  const cleanupSession = () => {
    for (const f of [base + ".1", base + ".manifest", base + ".manifest.cli", base + ".2"]) {
      try { if (existsSync(f)) unlinkSync(f) } catch {}
    }
  }
  try {
    cleanupSession()
    const agent = {
      cwd,
      history: [{ role: "user", content: "hi" }],
      tasks: [],
      title: "",
      activeProvider: "deepseek",
      activeModel: "deepseek-v4-pro",
      providers: PROVIDERS.map((p) => ({ ...p })),
      provider: { name: "deepseek", model: "deepseek-v4-pro", apiKey: "sk-ds" },
      config: { agent: { compactThresholdAuto: true, compactThreshold: 100000 }, defaultModel: "deepseek:deepseek-v4-pro" },
    }
    const before = readFileSync(cfgPath, "utf8")
    let persistCalls = 0
    const h = pickerHarness(agent, { persistRaw: async () => { persistCalls++ } })
    const picker = await h.build()
    // kimi:kimi-k3 —— 已知 spec（命中 MODEL_SPECS）
    await picker.selectModel({ provider: "kimi", model: "kimi-k3" })
    assert.equal(readFileSync(cfgPath, "utf8"), before, "config 内容字节不变——/model 纯会话级")
    assert.equal(persistCalls, 0, "persistRaw 零调用")
    assert.equal(agent.activeProvider, "kimi")
    assert.equal(agent.activeModel, "kimi-k3")
    assert.equal(agent.provider.model, "kimi-k3")
    assert.equal(h.lines.length, 1, "M6 回显一行")
    assert.match(h.lines[0].text, /^Model: kimi:kimi-k3 — spec found \(ctx 1M \/ out 128K\)$/)
    assert.equal(h.lines[0].color, "T_TOOL", "正常分支走 C.tool")
    const { loadSession } = await import("@thincoder/core/session.mjs")
    const restored = await loadSession(cwd)
    assert.equal(restored.activeProvider, "kimi")
    assert.equal(restored.activeModel, "kimi-k3")
  } finally {
    cleanupSession()
    _resetConfigPathForTest()
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T17 候选外可切换：非成员模型不再 throw + 回显 + config 零动", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-model-out-"))
  const cfgPath = join(dir, "config.json")
  writeFileSync(cfgPath, JSON.stringify({ defaultModel: "deepseek:deepseek-v4-pro", providers: PROVIDERS.map((p) => ({ ...p })) }, null, 2) + "\n", "utf8")
  _setConfigPathForTest(cfgPath)
  const cwd = join(dir, "proj")
  mkdirSync(cwd, { recursive: true })
  const base = sessionFilePath(cwd)
  const cleanupSession = () => {
    for (const f of [base + ".1", base + ".manifest", base + ".manifest.cli"]) {
      try { if (existsSync(f)) unlinkSync(f) } catch {}
    }
  }
  try {
    cleanupSession()
    const agent = {
      cwd, history: [], tasks: [],
      activeProvider: "deepseek", activeModel: "deepseek-v4-pro",
      providers: PROVIDERS.map((p) => ({ ...p })),
      provider: { name: "deepseek", model: "deepseek-v4-pro" },
      config: { agent: {}, defaultModel: "deepseek:deepseek-v4-pro" },
    }
    const before = readFileSync(cfgPath, "utf8")
    const h = pickerHarness(agent, { persistRaw: async () => { throw new Error("候选外选择不得写 config") } })
    const picker = await h.build()
    await picker.selectModel({ provider: "kimi", model: "kimi-outside" })
    assert.equal(agent.activeProvider, "kimi", "切换成功（不再 throw）")
    assert.equal(agent.activeModel, "kimi-outside")
    assert.equal(readFileSync(cfgPath, "utf8"), before, "config 内容零动")
  } finally {
    cleanupSession()
    _resetConfigPathForTest()
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T16 回显 DEFAULT 分支：警示色 + /config 提示（未命中 MODEL_SPECS）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-model-echo-"))
  const cfgPath = join(dir, "config.json")
  writeFileSync(cfgPath, JSON.stringify({ providers: [{ name: "kimi", baseURL: "https://x", model: "kimi-k3", apiKey: "k" }] }), "utf8")
  _setConfigPathForTest(cfgPath)
  const cwd = join(dir, "proj")
  mkdirSync(cwd, { recursive: true })
  const base = sessionFilePath(cwd)
  const cleanupSession = () => {
    for (const f of [base + ".1", base + ".manifest", base + ".manifest.cli"]) {
      try { if (existsSync(f)) unlinkSync(f) } catch {}
    }
  }
  try {
    cleanupSession()
    const agent = {
      cwd, history: [], tasks: [],
      activeProvider: "kimi", activeModel: "kimi-k3",
      providers: [{ name: "kimi", baseURL: "https://x", model: "kimi-k3", apiKey: "k" }],
      provider: { name: "kimi", model: "kimi-k3" },
      config: { agent: {}, defaultModel: "kimi:kimi-k3" },
    }
    const h = pickerHarness(agent)
    const picker = await h.build()
    await picker.selectModel({ provider: "kimi", model: "zzz-unknown-9000" })
    assert.equal(h.lines.length, 1)
    assert.match(h.lines[0].text, /spec not found in MODEL_SPECS/)
    assert.match(h.lines[0].text, /set context in \/config to override/, "DEFAULT 分支带 /config 提示")
    assert.equal(h.lines[0].color, "T_ERROR", "DEFAULT 兜底走警示色")
  } finally {
    cleanupSession()
    _resetConfigPathForTest()
    rmSync(dir, { recursive: true, force: true })
  }
})

test("回显 ctx/out 取最终生效值（providers[].context 覆盖 + 未知模型 DEFAULT 不参与）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-model-echo2-"))
  const cfgPath = join(dir, "config.json")
  writeFileSync(cfgPath, JSON.stringify({ providers: [{ name: "kimi", baseURL: "https://x", model: "kimi-k3", context: 256, apiKey: "k" }] }), "utf8")
  _setConfigPathForTest(cfgPath)
  const cwd = join(dir, "proj")
  mkdirSync(cwd, { recursive: true })
  const base = sessionFilePath(cwd)
  const cleanupSession = () => {
    for (const f of [base + ".1", base + ".manifest", base + ".manifest.cli"]) {
      try { if (existsSync(f)) unlinkSync(f) } catch {}
    }
  }
  try {
    cleanupSession()
    const agent = {
      cwd, history: [], tasks: [],
      activeProvider: "kimi", activeModel: "kimi-k3",
      providers: [{ name: "kimi", baseURL: "https://x", model: "kimi-k3", context: 256, apiKey: "k" }],
      provider: { name: "kimi", model: "kimi-k3", context: 256 },
      config: { agent: {}, defaultModel: "kimi:kimi-k3" },
    }
    const h = pickerHarness(agent)
    const picker = await h.build()
    await picker.selectModel({ provider: "kimi", model: "kimi-k3" })
    assert.match(h.lines[0].text, /ctx 256K \/ out 128K/, "context 覆盖值参与回显")
  } finally {
    cleanupSession()
    _resetConfigPathForTest()
    rmSync(dir, { recursive: true, force: true })
  }
})
