/**
 * config-softfail.test.mjs — ISSUE-FIX-BATCH F-4 (IKCDMR) VSC 面：共享 config——CLI loadConfig
 * 同规则（AC-5 双端锁步）：consultModels 软失败（读面过滤 + 一次性警告——不崩）+ 面板写路径
 * 清洗对齐 + removeProvider 级联清理（AC-4——consultModels/subagentModels/advisor.provider——
 * 下次读盘无悬挂）。_setConfigPathForTest tmp config；vscode mock 供 provider-flows。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { _setConfigPathForTest, loadRaw, removeProviderEntry } from "@thincoder/core/config-io.mjs"
import { loadConsultPool } from "../src/extension/presets.mjs"
import { loadAgentSettings } from "../src/extension/settings.mjs"
import { saveAgentSettingsFromPanel } from "../src/extension/settings-panel-write.mjs"

let dir
let cfgPath
const fixture = () => ({
  defaultModel: "deepseek:deepseek-v4-pro",
  providers: [
    { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro", apiKey: "k1" },
    { name: "kimi", baseURL: "https://api.moonshot.cn/v1", model: "kimi-k3", apiKey: "k2" },
  ],
})

before(() => {
  dir = mkdtempSync(join(tmpdir(), "tc-softfail-"))
  cfgPath = join(dir, "config.json")
  writeFileSync(cfgPath, JSON.stringify(fixture(), null, 2) + "\n", "utf8")
  _setConfigPathForTest(cfgPath)
})
after(() => {
  _setConfigPathForTest(null)
  try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ }
})

function captureWarns(fn) {
  const logs = []
  const orig = console.warn
  console.warn = (...a) => logs.push(a.join(" "))
  try { fn() } finally { console.warn = orig }
  return logs
}

test("AC-3/AC-5 读面软失败：loadAgentSettings 过滤未知渠道条目 + 一次性警告（不崩）", () => {
  const raw = loadRaw()
  raw.agent = { consultModels: [
    { provider: "deepseek", model: "deepseek-v4-pro" },
    { provider: "ghost", model: "g1" }, // 悬挂（共享 config 手改/他端删渠道）
    { provider: "kimi", model: "kimi-k3" },
  ] }
  writeFileSync(cfgPath, JSON.stringify(raw, null, 2) + "\n", "utf8")
  const logs = captureWarns(() => {
    const s1 = loadAgentSettings()
    const s2 = loadAgentSettings() // 面板快照高频调用——只警告一次
    const want = [
      { provider: "deepseek", model: "deepseek-v4-pro" },
      { provider: "kimi", model: "kimi-k3" },
    ]
    assert.deepEqual(s1.consultModels, want, "合法保留——悬挂过滤")
    assert.equal(s1.consultModels.length, s2.consultModels.length)
  })
  const consultWarns = logs.filter((l) => l.includes("consultModels"))
  assert.equal(consultWarns.length, 1, "一次性警告")
  assert.match(consultWarns[0], /ghost:g1/, "警告列出被滤条目")
  assert.match(consultWarns[0], /Fix:/, "警告含修复指引")
  assert.deepEqual(loadConsultPool(), [
    { provider: "deepseek", model: "deepseek-v4-pro" },
    { provider: "kimi", model: "kimi-k3" },
  ], "运行读面（setup.mjs withPool/cfgConsultModels 共用面）同规则")
})

test("AC-5 写路径清洗对齐：saveAgentSettingsFromPanel 丢弃未知渠道 consult 条目（全悬挂 = 删键）", () => {
  writeFileSync(cfgPath, JSON.stringify(fixture(), null, 2) + "\n", "utf8")
  assert.equal(saveAgentSettingsFromPanel({ consultModels: [
    { provider: "deepseek", model: "deepseek-v4-pro" },
    { provider: "ghost", model: "g1" },
  ] }), null, "无冲突")
  assert.deepEqual(loadRaw().agent.consultModels, [{ provider: "deepseek", model: "deepseek-v4-pro", effort: null }], "规范形态保留——悬挂不落盘")
  assert.equal(saveAgentSettingsFromPanel({ consultModels: [{ provider: "ghost", model: "g1" }] }), null)
  assert.equal("consultModels" in loadRaw().agent, false, "全悬挂 = 删键（空池 = 未启用）")
})

test("AC-4 级联清理：removeProviderEntry 删渠道清悬挂引用——下次读盘无悬挂", () => {
  const raw = fixture()
  raw.agent = {
    consultModels: [{ provider: "deepseek", model: "deepseek-v4-pro" }, { provider: "kimi", model: "kimi-k3" }],
    subagentModels: { coder: "kimi:k3", explore: "deepseek:deepseek-v4-pro" },
    advisor: { provider: "kimi", model: "m" },
  }
  writeFileSync(cfgPath, JSON.stringify(raw, null, 2) + "\n", "utf8")
  assert.equal(removeProviderEntry("kimi"), null) // 非 active（deepseek 是 defaultModel 渠道）——可删
  const disk = loadRaw()
  assert.deepEqual(disk.providers.map((p) => p.name), ["deepseek"])
  assert.deepEqual(disk.agent.consultModels, [{ provider: "deepseek", model: "deepseek-v4-pro" }], "consultModels 悬挂级联清")
  assert.deepEqual(disk.agent.subagentModels, { explore: "deepseek:deepseek-v4-pro" }, "subagentModels 引用级联清")
  assert.equal("provider" in disk.agent.advisor, false, "advisor.provider 级联清")
  assert.deepEqual(loadAgentSettings().consultModels, [{ provider: "deepseek", model: "deepseek-v4-pro" }], "读面无悬挂无过滤")
  assert.match(removeProviderEntry("deepseek"), /active provider cannot be removed/, "active 渠道保护回归")
})

test("W16 面：consult 读/清洗面 = VSC 端单源（presets.mjs——hub/leaf 双档形态随 config-io 删旧退场）", async () => {
  // W16：config-io / config-consult 双档退场——consult 读面/清洗面单源 = `src/extension/presets.mjs`
  // （核无对位件——CORE-UNIFICATION §2.5 #130 端侧消费面）；消费方（agent/setup · 面板 · 本档）同源。
  const mod = await import("../src/extension/presets.mjs")
  for (const name of ["sanitizeConsultModels", "warnConsultModelsFiltered", "loadConsultPool"]) {
    assert.equal(typeof mod[name], "function", `presets 导出 ${name}`)
  }
})
