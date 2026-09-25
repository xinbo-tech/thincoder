/**
 * config-merge.test.mjs — MODEL-SELECTION v2 迁移（§16.2 M7）+ schema 校验（CLI 面——AC-2/AC-3）。
 * loadConfig 经 _setConfigPathForTest 指向 tmp config——无真实 ~/.thincoder 干扰。
 * 覆盖：形态 A（p.model + active*）/ 形态 B（models[] + defaultModel）→ 单值 `providers[].model`
 * （磁盘无 `models` 键）；垃圾清理；幂等；写回失败不阻断；预设 21 条单值（+`tokenhub`——MODEL-SPECS §9.6）；defaultModel 校验
 * （provider ∈ providers——模型不再有成员校验，M4）。
 *
 * 并档注（2026-09-11 TEST-LIFECYCLE 扫①——设计档 TESTING.md §7.2 #1）：原 config.test.mjs 全量并入
 * （reloadMcpFromDisk / mcp.servers 形态两用例——CODE-HARDENING-BATCH §2.3；源档随并删除）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { loadConfig, PROVIDER_PRESETS, reloadMcpFromDisk, _setConfigPathForTest, _resetConfigPathForTest } from "@thincoder/core/config.mjs"
import { migrateLegacyModelFields } from "@thincoder/core/config-migrate.mjs"

function tmpCfg(content) {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-merge-"))
  const p = join(dir, "config.json")
  writeFileSync(p, JSON.stringify(content, null, 2) + "\n", "utf8")
  return { dir, p }
}

test("AC-3 预设 21 条：各携单值 `model`，无 `models` 键（R3 播种）", () => {
  const names = Object.keys(PROVIDER_PRESETS)
  assert.equal(names.length, 21, "内置预设 21 条")
  for (const [name, p] of Object.entries(PROVIDER_PRESETS)) {
    assert.equal(typeof p.model, "string", `${name}.model 为字符串`)
    assert.ok(p.model.length > 0, `${name}.model 非空`)
    assert.equal("models" in p, false, `${name} 无 models 候选字段`)
  }
  assert.equal(PROVIDER_PRESETS.deepseek.model, "deepseek-flash", "播种 = V4.1-Flash 在役名（第 6 批——R15/T35）")
  assert.deepEqual(PROVIDER_PRESETS.deepseek.thinking, { type: "enabled" }, "第 6 批 T35：thinking 不变（V4.1-Flash 默认开——显式 enabled 合法）")
  assert.equal(PROVIDER_PRESETS.deepseek.reasoningEffort, "max", "第 6 批 T35：effort 不变（∈ enum low/high/max）")
  assert.equal(PROVIDER_PRESETS.deepseek.maxTokens, 384_000, "maxTokens 随清理批降值 ⇒ 384_000（≤ 规格行 maxOutput——MODEL-SPECS §14.2 #19）")
  assert.equal(PROVIDER_PRESETS.claude.format, "anthropic", "预设扩展字段原样保留")
})

test("AC-2 迁移 B：models[] + defaultModel → 单值 p.model（defaultModel 段优先）+ 磁盘无 models 键", () => {
  const t = tmpCfg({
    defaultModel: "a:a2",
    providers: [{ name: "a", baseURL: "https://a", models: ["a1", "a2"], apiKey: "sk-keep" }],
  })
  try {
    _setConfigPathForTest(t.p)
    const c = loadConfig()
    assert.equal(c.defaultModel, "a:a2")
    assert.equal(c.providers[0].model, "a2", "defaultModel 属本渠道的模型段优先")
    assert.equal("models" in c.providers[0], false, "内存无 models 键")
    assert.equal(c.providers[0].apiKey, "sk-keep", "凭据不丢")
    assert.equal(c.provider.model, "a2", "运行时解析跟随")
    const disk = JSON.parse(readFileSync(t.p, "utf8"))
    assert.equal("models" in disk.providers[0], false, "迁移即删（磁盘无 models 键）")
    assert.equal(disk.providers[0].model, "a2")
    const diskText = readFileSync(t.p, "utf8")
    loadConfig()
    assert.equal(readFileSync(t.p, "utf8"), diskText, "幂等——已迁移文件不再触发写回")
  } finally {
    _resetConfigPathForTest()
    rmSync(t.dir, { recursive: true, force: true })
  }
})

test("AC-2 迁移 A：p.model + active* → p.model 保留（不再搬入 models）+ defaultModel 复合", () => {
  const t = tmpCfg({
    providers: [
      { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro", apiKey: "sk-keep", thinking: { type: "enabled" } },
      { name: "kimi", baseURL: "https://api.moonshot.cn/v1", model: "kimi-k3", apiKey: "sk-kimi" },
    ],
    activeProvider: "deepseek",
    activeModel: "deepseek-v4-flash",
  })
  try {
    _setConfigPathForTest(t.p)
    const c = loadConfig()
    assert.equal(c.defaultModel, "deepseek:deepseek-v4-flash", "activeModel 优先构造 defaultModel")
    assert.equal(c.provider.name, "deepseek")
    assert.equal(c.provider.model, "deepseek-v4-flash", "会话起点 = defaultModel 段")
    assert.equal(c.providers[0].model, "deepseek-v4-pro", "渠道单值保留（不被 models 吸收）")
    assert.equal(c.providers[0].apiKey, "sk-keep", "凭据不丢")
    assert.equal(c.providers[0].thinking.type, "enabled", "渠道非 model 字段零动")
    assert.equal(c.providerInvalidReason, null)
    const disk = JSON.parse(readFileSync(t.p, "utf8"))
    assert.equal("activeProvider" in disk, false)
    assert.equal("activeModel" in disk, false)
    assert.equal("models" in disk.providers[0], false)
    assert.equal(disk.defaultModel, "deepseek:deepseek-v4-flash")
  } finally {
    _resetConfigPathForTest()
    rmSync(t.dir, { recursive: true, force: true })
  }
})

test("AC-2 混合/垃圾清理 + 幂等 + 老指针失效走首渠道回退", () => {
  // 非数组 models / 非字符串 model → 删除（清理）
  const dirty = { providers: [{ name: "a", baseURL: "https://a", models: "kimi-k3", model: 42 }] }
  assert.equal(migrateLegacyModelFields(dirty), true)
  assert.deepEqual(dirty.providers[0], { name: "a", baseURL: "https://a" })
  assert.equal(migrateLegacyModelFields(dirty), false, "二次调用幂等")
  // 老 activeProvider 指向不存在渠道 → activeModel 无法归属 → 首渠道回退（有模型来源的渠道）
  const ghost = { providers: [{ name: "a", baseURL: "https://a", model: "a1" }], activeProvider: "ghost", activeModel: "x" }
  assert.equal(migrateLegacyModelFields(ghost), true)
  assert.equal(ghost.defaultModel, "a:a1", "首渠道回退")
  assert.equal(ghost.providers[0].model, "a1", "渠道单值不动")
  assert.equal(migrateLegacyModelFields(ghost), false, "幂等")
  // 目标形态（新 schema）→ false 不动
  const fresh = { providers: [{ name: "a", baseURL: "https://a", model: "a1" }], defaultModel: "a:a1" }
  assert.equal(migrateLegacyModelFields(fresh), false)
})

test("AC-2 空结果合法：渠道无模型来源 → p.model 不设（D-S1 引导）", () => {
  const t = tmpCfg({ providers: [{ name: "custom", baseURL: "https://custom.example" }], activeProvider: "custom" })
  try {
    _setConfigPathForTest(t.p)
    const c = loadConfig()
    assert.equal("model" in c.providers[0], false, "无模型来源 → 不设 model（空结果合法）")
    assert.equal(c.providerInvalidReason, "defaultModel 未设置（config 顶层 defaultModel — 新会话起点；/config → 默认模型 设置）")
    assert.equal(c.provider.name, undefined, "D-S1：runtime {} → 弹选择引导")
  } finally {
    _resetConfigPathForTest()
    rmSync(t.dir, { recursive: true, force: true })
  }
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

test("AC-1 schema：defaultModel 校验（provider ∈ providers；模型无成员校验——候选外放行 M4）+ 单值归一", () => {
  const t = tmpCfg({
    defaultModel: "kimi:no-such-model",
    providers: [{ name: "kimi", baseURL: "https://x", model: "kimi-k3", apiKey: "k" }],
  })
  try {
    _setConfigPathForTest(t.p)
    const c = loadConfig()
    assert.equal(c.providerInvalidReason, null, "候选外不再无效（清单 provider 化——M4）")
    assert.equal(c.provider.model, "no-such-model", "显式复合放行")
    // 未知 provider 仍无效（D-S1 不 throw）
    writeFileSync(t.p, JSON.stringify({ defaultModel: "ghost:m", providers: [{ name: "kimi", baseURL: "https://x", model: "kimi-k3", apiKey: "k" }] }), "utf8")
    const c2 = loadConfig()
    assert.match(c2.providerInvalidReason, /unknown provider "ghost"/)
    assert.equal(c2.provider.name, undefined, "D-S1：runtime {}——name 缺")
    // 无 defaultModel + 有渠道 → F-6 引导（不静默首渠道）
    writeFileSync(t.p, JSON.stringify({ providers: [{ name: "kimi", baseURL: "https://x", model: "kimi-k3", apiKey: "k" }] }), "utf8")
    const c3 = loadConfig()
    assert.equal(c3.providerInvalidReason, "defaultModel 未设置（config 顶层 defaultModel — 新会话起点；/config → 默认模型 设置）")
    // 非字符串 / 空串 model 归一删除（内存——不落盘）
    writeFileSync(t.p, JSON.stringify({ providers: [{ name: "kimi", baseURL: "https://x", model: 123, apiKey: "k" }, { name: "b", baseURL: "https://y", model: "  " }] }), "utf8")
    const c4 = loadConfig()
    assert.equal("model" in c4.providers[0], false, "非字符串 model 删除")
    assert.equal("model" in c4.providers[1], false, "空串 model 删除")
  } finally {
    _resetConfigPathForTest()
    rmSync(t.dir, { recursive: true, force: true })
  }
})

// ─── config 磁盘读层（并档：原 config.test.mjs——CODE-HARDENING-BATCH §2.3，2026-09-08）───
// reloadMcpFromDisk（内含 readMcpSection）mcp.servers 非数组 → ok:false 走畸形回退；
// 正常数组 → ok:true。纯单元：tmp config.json 注入（readMcpSection 文档化的测试缝）。

function tmpConfig(content) {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cfg-"))
  const path = join(dir, "config.json")
  writeFileSync(path, content, "utf8")
  return { path, cleanup: () => rmSync(dir, { recursive: true, force: true }) }
}

test("2.3 mcp.servers 非数组 → ok:false（畸形磁盘配置回退——不再静默空表）", () => {
  const agent = {}
  const t = tmpConfig(JSON.stringify({ mcp: { servers: "not-an-array" } }))
  try {
    const r = reloadMcpFromDisk(agent, t.path)
    assert.equal(r.ok, false)
    assert.ok(r.error, "error carries the malformed-config reason")
  } finally {
    t.cleanup()
  }
})

test("2.3 mcp.servers 正常数组 → ok:true 且 servers 原样返回", () => {
  const agent = {}
  const servers = [{ name: "s1", command: "npx", args: ["-y", "mcp-server"] }]
  const t = tmpConfig(JSON.stringify({ mcp: { servers } }))
  try {
    const r = reloadMcpFromDisk(agent, t.path)
    assert.equal(r.ok, true)
    assert.equal(r.servers.length, 1)
    assert.equal(r.servers[0].name, "s1")
  } finally {
    t.cleanup()
  }
})
