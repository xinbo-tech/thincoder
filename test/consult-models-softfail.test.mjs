/**
 * consult-models-softfail.test.mjs — ISSUE-FIX-BATCH F-4 (IKCDMR) CLI 面：AC-3 consultModels
 * 软失败（不崩——过滤 + 一次性警告 + 过滤态标记）+ AC-4 级联清理（删渠道清 consultModels/
 * subagentModels/advisor.provider 悬挂——下次启动无崩）。tmp config 注入；警告 = 进程级一次。 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { loadConfig, _setConfigPathForTest, _resetConfigPathForTest, writeConfigAtomic } from "../src/config.mjs"
import { cascadeRemoveProvider } from "../src/tui/model-picker.mjs"

function tmpCfg(content) {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-f4-"))
  const p = join(dir, "config.json")
  writeFileSync(p, JSON.stringify(content, null, 2) + "\n", "utf8")
  return { dir, p }
}
function captureWarns(fn) {
  const logs = []
  const orig = console.warn
  console.warn = (...a) => logs.push(a.join(" "))
  try { fn() } finally { console.warn = orig }
  return logs
}
const validFixture = () => ({
  defaultModel: "A:a1",
  providers: [
    { name: "A", baseURL: "https://a", models: ["a1", "a2"], apiKey: "k" },
    { name: "B", baseURL: "https://b", models: ["b1"], apiKey: "k" },
  ],
})

test("AC-3 软失败：未知渠道条目过滤不 throw——双 load 仅一次警告 + 过滤态标记 + 修复指引", () => {
  const cfg = validFixture()
  cfg.agent = { consultModels: [
    { provider: "A", model: "a1" }, { provider: "B", model: "b1" },
    { provider: "ghost", model: "g1" }, // 悬挂（IKCDMR 触发源）
  ] }
  const t = tmpCfg(cfg)
  try {
    _setConfigPathForTest(t.p)
    let cfg2
    const logs = captureWarns(() => { loadConfig(); cfg2 = loadConfig() })
    const consultWarns = logs.filter((l) => l.includes("consultModels"))
    assert.equal(consultWarns.length, 1, "一次性启动警告")
    assert.match(consultWarns[0], /ghost:g1/, "警告列出被滤条目（discoverability）")
    assert.match(consultWarns[0], /Fix:/, "警告含修复指引")
    assert.deepEqual(cfg2.agent.consultModels, [{ provider: "A", model: "a1" }, { provider: "B", model: "b1" }])
    assert.deepEqual(cfg2.agent.consultModelsFiltered, ['entry "ghost:g1" references unknown provider "ghost" (available: A, B)'], "过滤记录挂 consultModelsFiltered——首帧引导载体")
  } finally { _resetConfigPathForTest(); rmSync(t.dir, { recursive: true, force: true }) }
})

test("AC-3 边界：非数组 → 空池；形状非法丢弃；超 5 截断（保留前 5 合法）——均不 throw", () => {
  const t = tmpCfg(validFixture())
  const w = (agent) => writeFileSync(t.p, JSON.stringify({ ...validFixture(), agent }, null, 2) + "\n", "utf8")
  try {
    _setConfigPathForTest(t.p)
    w({ consultModels: "not-an-array" })
    assert.deepEqual(loadConfig().agent.consultModels, [], "非数组 → [] 不 throw")
    w({ consultModels: Array.from({ length: 8 }, (_, i) => ({ provider: "A", model: `a${i + 1}` })) })
    assert.equal(loadConfig().agent.consultModels.length, 5, "超 5 → 前 5（面板写 slice 同规则）")
    w({ consultModels: [{ provider: "A" }, { provider: "A", model: "a1" }, 42] }) // 缺 model / 非对象
    assert.deepEqual(loadConfig().agent.consultModels, [{ provider: "A", model: "a1" }], "形状非法丢弃——合法保留")
  } finally { _resetConfigPathForTest(); rmSync(t.dir, { recursive: true, force: true }) }
})

test("AC-4 级联清理：removeProvider 盘级 mutate（splice + cascade）后——下次 loadConfig 无悬挂无崩", () => {
  const cfg = validFixture()
  cfg.agent = {
    consultModels: [{ provider: "A", model: "a1" }, { provider: "B", model: "b1" }],
    subagentModels: { coder: "B:b1", explore: "A:a1" },
    advisor: { guard: false, provider: "B", model: "m" },
  }
  const t = tmpCfg(cfg)
  try {
    _setConfigPathForTest(t.p)
    const r = writeConfigAtomic(t.p, (raw) => { // removeProviderFlow persistRaw mutate 同型
      raw.providers = raw.providers.filter((p) => p?.name !== "B")
      cascadeRemoveProvider(raw, "B")
    })
    assert.equal(r.ok, true)
    const c = loadConfig() // “下次启动”——不崩
    assert.deepEqual(c.agent.consultModels, [{ provider: "A", model: "a1" }], "consultModels 悬挂级联清")
    assert.deepEqual(c.agent.subagentModels, { explore: "A:a1" }, "subagentModels 角色引用级联清")
    assert.equal(c.agent.advisor?.provider, undefined, "advisor.provider 悬挂级联清")
    assert.equal(c.agent.consultModelsFiltered, undefined, "级联后过滤态不复现")
    const merged = { agent: { consultModels: [{ provider: "B", model: "b1" }], subagentModels: { coder: "B:b1" }, advisor: { provider: "B" } }, advisor: { provider: "B" } }
    cascadeRemoveProvider(merged, "B") // 内存镜像同型（merged.agent 子树与 raw 同构）
    if (merged.advisor?.provider === "B") delete merged.advisor.provider // 提升拷贝镜像行
    assert.deepEqual(merged.agent, { advisor: {} }, "空键删除 + advisor.provider 清")
    assert.equal(merged.advisor.provider, undefined)
  } finally {
    _resetConfigPathForTest()
    rmSync(t.dir, { recursive: true, force: true })
  }
})
