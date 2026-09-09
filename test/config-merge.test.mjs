/**
 * config-merge.test.mjs — MODEL-MERGE-SESSION 迁移折中 C + schema 校验（CLI 面——AC-2/AC-1）。
 * loadConfig 经 _setConfigPathForTest 指向 tmp config——无真实 ~/.thincoder 干扰。
 * 覆盖：老 fixture → 复合 + models（幂等 + 失败不阻断 + 凭据不丢）；无 model 渠道 →
 * models:[] → D-S1 路径；defaultModel 校验（provider ∈ providers ∧ model ∈ models——
 * 无效不 throw）；候选外拒绝语义。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { loadConfig, _setConfigPathForTest, _resetConfigPathForTest } from "../src/config.mjs"
import { migrateLegacyModelFields } from "../src/config-migrate.mjs"

function tmpCfg(content) {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-merge-"))
  const p = join(dir, "config.json")
  writeFileSync(p, JSON.stringify(content, null, 2) + "\n", "utf8")
  return { dir, p }
}

test("AC-2 迁移折中 C：老 fixture → 复合 + models（凭据不丢、覆盖值入候选、写回新 schema）", () => {
  const t = tmpCfg({
    providers: [
      { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro", apiKey: "sk-keep", thinking: { type: "enabled" } },
      { name: "kimi", baseURL: "https://api.moonshot.cn/v1", model: "kimi-k3", apiKey: "sk-kimi" },
    ],
    activeProvider: "deepseek",
    activeModel: "deepseek-v4-flash", // override ≠ 渠道 model——必须并入候选（迁移产物 defaultModel 要能通过严格校验）
  })
  try {
    _setConfigPathForTest(t.p)
    const c = loadConfig()
    assert.equal(c.defaultModel, "deepseek:deepseek-v4-flash")
    assert.equal(c.provider.name, "deepseek")
    assert.equal(c.provider.model, "deepseek-v4-flash")
    assert.deepEqual(c.providers[0].models, ["deepseek-v4-flash", "deepseek-v4-pro"]) // 覆盖值在前 + 渠道 model
    assert.equal(c.providers[0].apiKey, "sk-keep", "凭据不丢")
    assert.equal(c.providers[0].thinking.type, "enabled", "渠道非 model 字段保持渠道级零动")
    assert.equal(c.providerInvalidReason, null)
    // 磁盘已写回新 schema（无老字段）
    const disk = JSON.parse(readFileSync(t.p, "utf8"))
    assert.equal("activeProvider" in disk, false)
    assert.equal("activeModel" in disk, false)
    assert.equal("model" in disk.providers[0], false)
    assert.equal(disk.defaultModel, "deepseek:deepseek-v4-flash")
    const diskText1 = readFileSync(t.p, "utf8")
    // 幂等：第二次 load 不重写（磁盘字节不变）
    loadConfig()
    assert.equal(readFileSync(t.p, "utf8"), diskText1, "幂等——已迁移文件不再触发写回")
  } finally {
    _resetConfigPathForTest()
    rmSync(t.dir, { recursive: true, force: true })
  }
})

test("AC-2 迁移纯函数幂等 + 老指针失效走 C 第三级（首渠道首候选）", () => {
  // 老 activeProvider 指向不存在渠道 → activeModel 无法归属 → 首渠道首候选兜底（折中 C 第三级）
  const raw = { providers: [{ name: "a", baseURL: "https://a", model: "a1" }], activeProvider: "ghost", activeModel: "x" }
  assert.equal(migrateLegacyModelFields(raw), true)
  assert.equal(raw.defaultModel, "a:a1")
  assert.deepEqual(raw.providers[0].models, ["a1"]) // x 归属 ghost——不并入 a 的候选
  assert.equal(migrateLegacyModelFields(raw), false, "二次调用幂等")
  // 无老字段的新 schema → false 不动
  const fresh = { providers: [{ name: "a", models: ["a1"] }], defaultModel: "a:a1" }
  assert.equal(migrateLegacyModelFields(fresh), false)
})

test("AC-2 写回失败绝不阻断启动（内存迁移态继续——下次 load 重试）", () => {
  const t = tmpCfg({
    providers: [{ name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro", apiKey: "k" }],
    activeProvider: "deepseek",
  })
  try {
    _setConfigPathForTest(t.p)
    chmodSync(t.p, 0o444) // 只读——写回必失败
    const c = loadConfig() // 不 throw
    assert.equal(c.defaultModel, "deepseek:deepseek-v4-pro", "内存迁移态继续")
    assert.equal(c.provider.name, "deepseek")
    const disk = JSON.parse(readFileSync(t.p, "utf8"))
    assert.equal(disk.activeProvider, "deepseek", "磁盘未被写坏——老形态保留（下次重试）")
    chmodSync(t.p, 0o644)
    const c2 = loadConfig()
    assert.equal(c2.defaultModel, "deepseek:deepseek-v4-pro")
    const disk2 = JSON.parse(readFileSync(t.p, "utf8"))
    assert.equal("activeProvider" in disk2, false, "写回恢复后磁盘迁移完成")
  } finally {
    _resetConfigPathForTest()
    rmSync(t.dir, { recursive: true, force: true })
  }
})

test("无 model 渠道 → models:[] → D-S1 路径（不静默破——评审 #7）", () => {
  const t = tmpCfg({
    providers: [{ name: "custom", baseURL: "https://custom.example" }], // 无 .model 字段
    activeProvider: "custom",
  })
  try {
    _setConfigPathForTest(t.p)
    const c = loadConfig()
    assert.deepEqual(c.providers[0].models, [])
    assert.equal(c.providerInvalidReason, "defaultModel 未设置（config 顶层 defaultModel — 新会话起点；/config → 默认模型 设置）")
    assert.equal(c.provider.name, undefined, "D-S1：runtime {} → 弹选择引导")
  } finally {
    _resetConfigPathForTest()
    rmSync(t.dir, { recursive: true, force: true })
  }
})

test("AC-1 schema 新形态 + defaultModel 校验（provider ∈ providers ∧ model ∈ models——无效 D-S1 不 throw）", () => {
  const t = tmpCfg({
    defaultModel: "kimi:no-such-model",
    providers: [{ name: "kimi", baseURL: "https://x", models: ["kimi-k3"], apiKey: "k" }],
  })
  try {
    _setConfigPathForTest(t.p)
    const c = loadConfig()
    assert.equal(c.providerInvalidReason, 'model "no-such-model" is not in provider "kimi" candidates (models[]: "kimi-k3")')
    assert.equal(c.provider.name, undefined, "D-S1：runtime {}——name 缺")
    // 合法 defaultModel
    writeFileSync(t.p, JSON.stringify({ defaultModel: "kimi:kimi-k3", providers: [{ name: "kimi", baseURL: "https://x", models: ["kimi-k3"], apiKey: "k" }] }), "utf8")
    const c2 = loadConfig()
    assert.equal(c2.providerInvalidReason, null)
    assert.equal(c2.provider.model, "kimi-k3")
    // 无 defaultModel + 有渠道 → F-6 引导（不再静默首渠道）
    writeFileSync(t.p, JSON.stringify({ providers: [{ name: "kimi", baseURL: "https://x", models: ["kimi-k3"], apiKey: "k" }] }), "utf8")
    const c3 = loadConfig()
    assert.equal(c3.providerInvalidReason, "defaultModel 未设置（config 顶层 defaultModel — 新会话起点；/config → 默认模型 设置）")
    // 非字符串/畸形 models 归一空候选（内存——不落盘）
    writeFileSync(t.p, JSON.stringify({ providers: [{ name: "kimi", baseURL: "https://x", models: "kimi-k3" }] }), "utf8")
    const c4 = loadConfig()
    assert.deepEqual(c4.providers[0].models, [])
  } finally {
    _resetConfigPathForTest()
    rmSync(t.dir, { recursive: true, force: true })
  }
})
