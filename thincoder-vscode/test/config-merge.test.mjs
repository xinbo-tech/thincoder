/**
 * config-merge.test.mjs — MODEL-SELECTION 迁移 v2（M7）+ 单值/defaultModel 解析（VSC 面——
 * AC-2/AC-3/AC-6）。loadRaw/saveRaw/persistRaw 经 _setConfigPathForTest 指向 tmp config。
 * 覆盖：老形态 A/B → 单值（幂等 + 失败不阻断 + 凭据不丢；磁盘无 models 键）；预设 20 条单值；
 * resolveDefaultModel 新回退链（复合属本渠道 → 渠道默认单值 → null——不再静默回退 models[0]）；
 * resolveProviders activeProvider = defaultModel 渠道（回退首渠道）；providerFromConfig 运行时解析。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { chmodSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  loadRaw, resolveProviders, _setConfigPathForTest,
} from "@thincoder/core/config-io.mjs"
import { migrateLegacyModelFields, PROVIDER_PRESETS } from "@thincoder/core/config.mjs"
import { providerFromConfig, resolveDefaultModel } from "../src/extension/presets.mjs"

let dir
function tmpCfg(content) {
  dir = mkdtempSync(join(tmpdir(), "tc-merge-"))
  const p = join(dir, "config.json")
  writeFileSync(p, JSON.stringify(content, null, 2) + "\n", "utf8")
  _setConfigPathForTest(p)
  return p
}

test.afterEach(() => {
  _setConfigPathForTest(null)
  try { rmSync(dir, { recursive: true, force: true }) } catch {}
  dir = null
})

// ─── 迁移 v2（T10/T11/T12——AC-2）───

test("AC-2 迁移 B（T10）：models[] + defaultModel → p.model = defaultModel 段；无 models 键；磁盘写回", () => {
  const p = tmpCfg({
    providers: [{ name: "a", baseURL: "https://x", models: ["a1", "a2"], apiKey: "sk-keep" }],
    defaultModel: "a:a2",
  })
  const raw = loadRaw()
  assert.equal(raw.providers[0].model, "a2", "取 defaultModel 属本渠道的模型段")
  assert.equal("models" in raw.providers[0], false, "候选清单字段退场")
  assert.equal(raw.providers[0].apiKey, "sk-keep", "凭据不丢")
  const disk = JSON.parse(readFileSync(p, "utf8"))
  assert.equal(disk.providers[0].model, "a2", "写回新 schema")
  assert.equal("models" in disk.providers[0], false)
  const disk1 = readFileSync(p, "utf8")
  loadRaw()
  assert.equal(readFileSync(p, "utf8"), disk1, "幂等——已迁移文件不再重写")
})

test("AC-2 迁移 A（T11）：p.model + activeProvider → p.model 保留（不再搬入 models）+ defaultModel 构造", () => {
  tmpCfg({
    providers: [{ name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro", apiKey: "sk-keep" }],
    activeProvider: "deepseek",
  })
  const raw = loadRaw()
  assert.equal(raw.defaultModel, "deepseek:deepseek-v4-pro", "activeProvider → defaultModel 复合")
  assert.equal(raw.providers[0].model, "deepseek-v4-pro", "p.model 保留为新形态单值默认模型")
  assert.equal("models" in raw.providers[0], false, "不再搬入 models")
  assert.equal("activeProvider" in raw, false)
  assert.equal("activeModel" in raw, false)
})

test("AC-2 迁移 A + activeModel：defaultModel = AP:AM（AM 优先）；p.model 保留", () => {
  tmpCfg({
    providers: [{ name: "deepseek", baseURL: "https://x", model: "m1" }],
    activeProvider: "deepseek",
    activeModel: "m2",
  })
  const raw = loadRaw()
  assert.equal(raw.defaultModel, "deepseek:m2", "activeModel 优先于渠道 p.model")
  assert.equal(raw.providers[0].model, "m1", "形态 A：p.model 保留（M7 表 A 行）")
})

test("AC-2 迁移 B 无 defaultModel：p.model = models[] 首个非空；无来源渠道不设单值（空结果合法）", () => {
  tmpCfg({
    providers: [
      { name: "a", baseURL: "https://x", models: ["a1", "a2"] },
      { name: "b", baseURL: "https://y", models: [] },
      { name: "c", baseURL: "https://z" },
    ],
  })
  const r = loadRaw()
  assert.equal(r.providers[0].model, "a1", "无 defaultModel → models[] 首个非空")
  assert.equal("model" in r.providers[1], false, "空 models → 不设单值")
  assert.equal("model" in r.providers[2], false, "无来源渠道 → 不设单值")
  assert.equal("models" in r.providers[0], false)
  assert.equal("models" in r.providers[1], false, "空数组垃圾一并清")
})

test("AC-2 迁移垃圾清理 + 幂等（T12）：非字符串 p.model / 非数组 p.models 删除；二次调用 false 不动", () => {
  const legacy = {
    providers: [
      { name: "a", baseURL: "https://a", model: 123, models: "junk" },
      { name: "b", baseURL: "https://b", models: ["b1"] },
    ],
    activeProvider: "ghost",
    activeModel: "x",
  }
  assert.equal(migrateLegacyModelFields(legacy), true)
  assert.equal(legacy.defaultModel, "b:b1", "AP 不存在 → 首渠道回退（迁移产物必可用）")
  assert.equal("model" in legacy.providers[0], false, "非字符串 model 清")
  assert.equal("models" in legacy.providers[0], false, "非数组 models 清")
  assert.equal(legacy.providers[1].model, "b1")
  assert.equal(migrateLegacyModelFields(legacy), false, "幂等——无老字段 → false 不动")
  const fresh = { providers: [{ name: "a", model: "a1" }], defaultModel: "a:a1" }
  assert.equal(migrateLegacyModelFields(fresh), false, "新 schema 零动")
})

test("AC-2 写回失败不阻断（内存迁移态继续——下次重试——saveRaw 冲突路径幂等）", () => {
  const p = tmpCfg({
    providers: [{ name: "kimi", baseURL: "https://x", models: ["kimi-k3"], apiKey: "k" }],
  })
  chmodSync(p, 0o444) // 只读——写回失败
  const raw = loadRaw() // 不 throw
  assert.equal(raw.providers[0].model, "kimi-k3", "内存迁移态继续")
  const disk = JSON.parse(readFileSync(p, "utf8"))
  assert.equal("models" in disk.providers[0], true, "磁盘保留老形态（下次重试）")
  chmodSync(p, 0o644)
  const raw2 = loadRaw()
  assert.equal(raw2.providers[0].model, "kimi-k3")
  const disk2 = JSON.parse(readFileSync(p, "utf8"))
  assert.equal("models" in disk2.providers[0], false, "重试后写回完成")
})

// ─── 预设单值（T13——AC-3）───

test("AC-3 预设 20 条：各携单值 `model`（无 models 键）", () => {
  const entries = Object.entries(PROVIDER_PRESETS)
  assert.equal(entries.length, 20, "预设数 = 20")
  for (const [name, p] of entries) {
    assert.equal(typeof p.model, "string", `${name} 单值 model`)
    assert.ok(p.model.length > 0, `${name} 非空`)
    assert.equal("models" in p, false, `${name} 无 models 候选清单`)
  }
  assert.equal(PROVIDER_PRESETS.deepseek.model, "deepseek-flash", "第 6 批 T37：预设播种 = V4.1-Flash 在役名（R15）")
})

// ─── resolveDefaultModel 新回退链（T18/T19——AC-6）───

test("AC-6 resolveDefaultModel：复合属本渠道 → 渠道默认单值 → null（不再静默回退 models[0]）", () => {
  assert.equal(resolveDefaultModel({ name: "kimi", model: "kimi-k3" }, { defaultModel: "kimi:kimi-k3" }), "kimi-k3", "① 复合属本渠道")
  assert.equal(resolveDefaultModel({ name: "kimi", model: "kimi-k3" }, { defaultModel: "deepseek:deepseek-v4-pro" }), "kimi-k3", "复合不属本渠道 → ② 渠道默认单值")
  assert.equal(resolveDefaultModel({ name: "kimi", model: "kimi-k3" }, {}), "kimi-k3", "② 无 defaultModel → 渠道默认单值")
  assert.equal(resolveDefaultModel({ name: "kimi" }, { defaultModel: "kimi:k3" }), "k3", "无单值渠道：复合仍生效（①）")
  assert.equal(resolveDefaultModel({ name: "kimi" }, {}), null, "③ 两者皆无 → null")
  assert.equal(resolveDefaultModel({ name: "kimi", models: ["old-m1"] }, {}), null, "旧候选字段不再被读（静默回退消失）")
  assert.equal(resolveDefaultModel({ name: "kimi", model: "kimi-k3" }, { defaultModel: "kimi:" }), "kimi-k3", "空模型段复合无效 → 回退单值")
})

test("AC-6 resolveProviders activeProvider = defaultModel 渠道；失效回退首渠道；providerFromConfig 走新链", () => {
  tmpCfg({
    defaultModel: "kimi:kimi-k3",
    providers: [
      { name: "deepseek", baseURL: "https://a", model: "d1", apiKey: "k" },
      { name: "kimi", baseURL: "https://b", model: "kimi-k3", apiKey: "k" },
    ],
  })
  let { providers, activeProvider } = resolveProviders()
  assert.equal(activeProvider, "kimi", "activeProvider = defaultModel 渠道")
  const prov = providerFromConfig("kimi")
  assert.equal(prov.model, "kimi-k3")
  assert.equal(prov.apiKey, "k")
  assert.equal(providerFromConfig("deepseek").model, "d1", "非默认渠道 → 渠道默认单值")
  // 失效（defaultModel 渠道不在 providers）→ 回退首渠道
  writeFileSync(join(dir, "config.json"), JSON.stringify({ defaultModel: "ghost:x", providers: [{ name: "deepseek", baseURL: "https://a", model: "d1", apiKey: "k" }] }), "utf8")
  ;({ providers, activeProvider } = resolveProviders())
  assert.equal(activeProvider, "deepseek")
  assert.equal(providerFromConfig("deepseek").model, "d1")
})

test("AC-3 无 model 渠道 → 单值缺失（D-S1 路径——resolveProviders 首渠道回退不静默破）", () => {
  tmpCfg({ providers: [{ name: "custom", baseURL: "https://custom.example" }] })
  const raw = loadRaw()
  assert.equal("model" in raw.providers[0], false)
  assert.equal(raw.defaultModel, undefined)
  const { activeProvider } = resolveProviders()
  assert.equal(activeProvider, "custom")
})
