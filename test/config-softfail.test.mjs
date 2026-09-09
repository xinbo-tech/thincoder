/**
 * config-softfail.test.mjs — F-4 (ISSUE-FIX-BATCH §2, IKCDMR) VSC 面。
 * 共享 config——CLI loadConfig 同规则（AC-5 双端锁步）：consultModels 软失败（读面过滤 +
 * 进程级一次性警告——不崩）+ 面板写路径清洗对齐 + removeProvider 级联清理（AC-4——
 * consultModels/subagentModels/advisor.provider 悬挂——下次读盘无悬挂）。
 * 纯单元：_setConfigPathForTest tmp config（同 config-io-panel.test.mjs）——vscode mock
 * 供 provider-flows（node_modules/vscode）。一次性警告 = 模块标志——首个触发用例即消耗。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { _setConfigPathForTest } from "../src/config-io.mjs"
import { loadAgentSettings, loadConsultPool, loadRaw } from "../src/config-io.mjs"
import { saveAgentSettingsFromPanel } from "../src/extension/settings-panel-write.mjs"
import { removeProviderEntry } from "../src/extension/provider-flows.mjs"

let dir
let cfgPath

const fixture = () => ({
  defaultModel: "deepseek:deepseek-v4-pro",
  providers: [
    { name: "deepseek", baseURL: "https://api.deepseek.com", models: ["deepseek-v4-pro"], apiKey: "k1" },
    { name: "kimi", baseURL: "https://api.moonshot.cn/v1", models: ["kimi-k3"], apiKey: "k2" },
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

test("AC-3/AC-5 读面软失败：loadAgentSettings 过滤未知渠道条目 + 进程级一次性警告（不崩）", () => {
  const raw = loadRaw()
  raw.agent = { consultModels: [
    { provider: "deepseek", model: "deepseek-v4-pro" },
    { provider: "ghost", model: "g1" }, // 悬挂（IKCDMR 触发源——共享 config 手改/他端删除渠道）
    { provider: "kimi", model: "kimi-k3" },
  ] }
  writeFileSync(cfgPath, JSON.stringify(raw, null, 2) + "\n", "utf8")
  const logs = captureWarns(() => {
    const s1 = loadAgentSettings()
    const s2 = loadAgentSettings() // 面板快照/设置工具高频调用——只警告一次
    assert.deepEqual(s1.consultModels, [
      { provider: "deepseek", model: "deepseek-v4-pro" },
      { provider: "kimi", model: "kimi-k3" },
    ], "合法条目保留——悬挂过滤")
    assert.equal(s1.consultModels.length, s2.consultModels.length)
  })
  const consultWarns = logs.filter((l) => l.includes("consultModels"))
  assert.equal(consultWarns.length, 1, "一次性警告——双读仅一条")
  assert.match(consultWarns[0], /ghost:g1/, "警告列出被滤条目（discoverability）")
  assert.match(consultWarns[0], /Fix:/, "警告含修复指引")
  // 运行读面同规则（setup.mjs withPool/cfgConsultModels 共用面）
  const pool = loadConsultPool()
  assert.deepEqual(pool, [
    { provider: "deepseek", model: "deepseek-v4-pro" },
    { provider: "kimi", model: "kimi-k3" },
  ])
})

test("AC-5 写路径清洗对齐：saveAgentSettingsFromPanel 丢弃未知渠道 consult 条目（全悬挂 = 删键）", () => {
  writeFileSync(cfgPath, JSON.stringify(fixture(), null, 2) + "\n", "utf8")
  const r = saveAgentSettingsFromPanel({
    consultModels: [
      { provider: "deepseek", model: "deepseek-v4-pro" },
      { provider: "ghost", model: "g1" }, // 未知渠道——写面不落盘
    ],
  })
  assert.equal(r, null, "无冲突——正常写")
  assert.deepEqual(loadRaw().agent.consultModels, [{ provider: "deepseek", model: "deepseek-v4-pro", effort: null }], "写面规范形态保留（effort:null 既有）——悬挂条目不落盘")
  // 全悬挂 → 键删除（空池 = 未启用——规范形态）
  const r2 = saveAgentSettingsFromPanel({ consultModels: [{ provider: "ghost", model: "g1" }] })
  assert.equal(r2, null)
  assert.equal("consultModels" in loadRaw().agent, false)
})

test("AC-4 级联清理：removeProviderEntry 删渠道清 consultModels/subagentModels/advisor.provider——下次读盘无悬挂", () => {
  const raw = fixture()
  raw.agent = {
    consultModels: [{ provider: "deepseek", model: "deepseek-v4-pro" }, { provider: "kimi", model: "kimi-k3" }],
    subagentModels: { coder: "kimi:k3", explore: "deepseek:deepseek-v4-pro" }, // 角色值 = "provider:model"
    advisor: { provider: "kimi", model: "m" },
  }
  writeFileSync(cfgPath, JSON.stringify(raw, null, 2) + "\n", "utf8")
  const err = removeProviderEntry("kimi") // 非 active（deepseek 是 defaultModel 渠道）——可删
  assert.equal(err, null)
  const disk = loadRaw()
  assert.deepEqual(disk.providers.map((p) => p.name), ["deepseek"])
  assert.deepEqual(disk.agent.consultModels, [{ provider: "deepseek", model: "deepseek-v4-pro" }], "consultModels 悬挂条目级联清")
  assert.deepEqual(disk.agent.subagentModels, { explore: "deepseek:deepseek-v4-pro" }, "subagentModels 角色引用级联清")
  assert.equal("provider" in disk.agent.advisor, false, "advisor.provider 悬挂级联清")
  // “下次启动无崩”：级联后读面无过滤无警告
  assert.deepEqual(loadAgentSettings().consultModels, [{ provider: "deepseek", model: "deepseek-v4-pro" }])
  // active 渠道不可删（removeProviderEntry 既有保护——回归）
  const err2 = removeProviderEntry("deepseek")
  assert.match(err2, /active provider cannot be removed/)
  // 配置文件字节回读——正常 json
  assert.doesNotThrow(() => JSON.parse(readFileSync(cfgPath, "utf8")))
})
