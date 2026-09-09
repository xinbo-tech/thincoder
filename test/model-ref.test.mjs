/**
 * model-ref.test.mjs — MODEL-MERGE-SESSION 复合解析器 + /model 会话级写槽（AC-3/AC-4 CLI 面）。
 * - parseModelRef：合法 / 未知 provider / models[] 外 / 空候选 / 裸 provider 拒 / 裸 model 拒
 * - resolveRuntimeProvider：无效 → {}（D-S1 形状）
 * - /model selectModel（model-picker.mjs）：写槽不写 config——**config 内容字节断言**（写前快照
 *   对比——非 mtime——AC-4）；候选外拒；恢复 = 槽值（AC-5 CLI 侧）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync, unlinkSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { parseModelRef, resolveRuntimeProvider, firstCandidate, _setConfigPathForTest, _resetConfigPathForTest } from "../src/config.mjs"
import { sessionPath as sessionFilePath } from "../src/session.mjs"

const PROVIDERS = [
  { name: "deepseek", baseURL: "https://api.deepseek.com", models: ["deepseek-v4-pro", "deepseek-v4-flash"], apiKey: "sk-ds" },
  { name: "kimi", baseURL: "https://api.moonshot.cn/v1", models: ["kimi-k3"], apiKey: "sk-kimi" },
  { name: "empty", baseURL: "https://x", models: [] },
]

test("AC-3 合法复合：provider:model ∈ models[] → ok", () => {
  const r = parseModelRef("deepseek:deepseek-v4-pro", PROVIDERS)
  assert.equal(r.ok, true)
  assert.equal(r.provider.name, "deepseek")
  assert.equal(r.model, "deepseek-v4-pro")
})

test("AC-3 未知 provider → ok:false（带可用列表）", () => {
  const r = parseModelRef("ghost:model-x", PROVIDERS)
  assert.equal(r.ok, false)
  assert.match(r.reason, /unknown provider "ghost"/)
  assert.match(r.reason, /deepseek, kimi, empty/)
})

test("AC-3 models[] 外 → ok:false（候选硬约束——F-1）", () => {
  const r = parseModelRef("deepseek:not-in-list", PROVIDERS)
  assert.equal(r.ok, false)
  assert.match(r.reason, /not in provider "deepseek" candidates/)
})

test("AC-3 空候选渠道 → ok:false（无候选不可选）", () => {
  const r = parseModelRef("empty:anything", PROVIDERS)
  assert.equal(r.ok, false)
  assert.match(r.reason, /no candidates/)
})

test("F-7 裸 provider / 裸 model / 缺段 → 拒（显式 p:m——裁定③）", () => {
  for (const bad of ["deepseek", "deepseek:", ":model", "kimi-k3", "a:b:c"]) {
    const r = parseModelRef(bad, PROVIDERS)
    assert.equal(r.ok, false, `"${bad}" 必须拒`)
  }
})

test("resolveRuntimeProvider：合法 → 带 model 的 provider 拷贝；无效 → {}（D-S1——不 throw）", () => {
  const ok = resolveRuntimeProvider(PROVIDERS, "kimi:kimi-k3")
  assert.equal(ok.name, "kimi")
  assert.equal(ok.model, "kimi-k3")
  assert.equal(ok.apiKey, "sk-kimi", "渠道字段随行（凭据不丢）")
  assert.deepEqual(resolveRuntimeProvider(PROVIDERS, null), {})
  assert.deepEqual(resolveRuntimeProvider(PROVIDERS, "kimi:outside"), {})
  assert.deepEqual(resolveRuntimeProvider([], "a:b"), {})
  assert.equal(firstCandidate(PROVIDERS[0]), "deepseek-v4-pro")
  assert.equal(firstCandidate(PROVIDERS[2]), "")
})

// ── AC-4：/model 会话级——selectModel 写槽不写 config（内容字节断言）──

test("AC-4/AC-5 selectModel：写槽不写 config（字节断言）+ 恢复 = 槽值", async () => {
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
    const { loadSession } = await import("../src/session.mjs")
    const { createModelPicker } = await import("../src/tui/model-picker.mjs")
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
    const picker = createModelPicker({
      agent, state: {}, ansi: {}, C: {},
      pushLine() {}, askQuestion: async () => "", maskKey: (k) => k,
      persistRaw: async () => { persistCalls++ }, // 若 selectModel 触碰 config → 立现
      showPicker() {}, closePicker() {}, renderPickerLines() {},
    })
    // 候选内切换（跨渠道——kimi:kimi-k3）
    await picker.selectModel({ provider: "kimi", model: "kimi-k3" })
    const after = readFileSync(cfgPath, "utf8")
    assert.equal(after, before, "config 内容字节不变——/model 纯会话级（写槽不写 config）")
    assert.equal(persistCalls, 0, "persistRaw 零调用")
    assert.equal(agent.activeProvider, "kimi")
    assert.equal(agent.activeModel, "kimi-k3")
    assert.equal(agent.provider.model, "kimi-k3")
    // 槽已落盘（saveSession）——恢复 = 槽值（AC-5——不看 config）
    const restored = loadSession(cwd)
    assert.equal(restored.activeProvider, "kimi")
    assert.equal(restored.activeModel, "kimi-k3")
  } finally {
    cleanupSession()
    _resetConfigPathForTest()
    rmSync(dir, { recursive: true, force: true })
  }
})

test("F-1 候选外拒：models[] 外 selectModel throw + config/session 零动", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-model-rej-"))
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
    const { createModelPicker } = await import("../src/tui/model-picker.mjs")
    const agent = {
      cwd,
      history: [],
      tasks: [],
      activeProvider: "deepseek",
      activeModel: "deepseek-v4-pro",
      providers: PROVIDERS.map((p) => ({ ...p })),
      provider: { name: "deepseek", model: "deepseek-v4-pro" },
      config: { agent: {}, defaultModel: "deepseek:deepseek-v4-pro" },
    }
    const before = readFileSync(cfgPath, "utf8")
    const picker = createModelPicker({
      agent, state: {}, ansi: {}, C: {},
      pushLine() {}, askQuestion: async () => "", maskKey: (k) => k,
      persistRaw: async () => { throw new Error("候选外选择不得写 config") },
      showPicker() {}, closePicker() {}, renderPickerLines() {},
    })
    await assert.rejects(() => picker.selectModel({ provider: "kimi", model: "kimi-outside" }), /不在 kimi 的候选/)
    assert.equal(readFileSync(cfgPath, "utf8"), before)
    assert.equal(agent.activeProvider, "deepseek", "会话态不动")
  } finally {
    cleanupSession()
    _resetConfigPathForTest()
    rmSync(dir, { recursive: true, force: true })
  }
})
