/**
 * config-merge.test.mjs — MODEL-MERGE-SESSION 迁移折中 C + defaultModel 解析（VSC 面——AC-2/AC-1）。
 * loadRaw/saveRaw/persistRaw 经 _setConfigPathForTest 指向 tmp config。
 * 覆盖：老 fixture → 复合 + models（幂等 + 失败不阻断 + 凭据不丢）；无 model 渠道 → models:[]
 * → 无效引导路径；resolveProviders activeProvider = defaultModel 渠道（回退首渠道）；providerFromConfig
 * 运行时 model 解析（defaultModel 属该渠道 → 用之；否则首候选）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { chmodSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  loadRaw, resolveProviders, providerFromConfig, resolveDefaultModel,
  _setConfigPathForTest, migrateLegacyModelFields,
} from "../src/config-io.mjs"

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

test("AC-2 VSC 迁移：老 fixture → models + defaultModel（凭据不丢——写回新 schema——幂等）", () => {
  const p = tmpCfg({
    providers: [
      { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro", apiKey: "sk-keep" },
      { name: "kimi", baseURL: "https://x", model: "kimi-k3" },
    ],
    activeProvider: "deepseek",
  })
  const raw = loadRaw()
  assert.equal(raw.defaultModel, "deepseek:deepseek-v4-pro")
  assert.deepEqual(raw.providers[0].models, ["deepseek-v4-pro"])
  assert.equal(raw.providers[0].apiKey, "sk-keep")
  assert.equal("activeProvider" in raw, false)
  assert.equal("model" in raw.providers[0], false)
  const disk1 = readFileSync(p, "utf8")
  loadRaw()
  assert.equal(readFileSync(p, "utf8"), disk1, "幂等——已迁移文件不再重写")
})

test("AC-2 覆盖值入候选：activeModel ≠ 渠道 model → 并入 + defaultModel = AP:AM（严格校验可通过）", () => {
  tmpCfg({
    providers: [{ name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro" }],
    activeProvider: "deepseek",
    activeModel: "deepseek-v4-flash",
  })
  const raw = loadRaw()
  assert.equal(raw.defaultModel, "deepseek:deepseek-v4-flash")
  assert.deepEqual(raw.providers[0].models, ["deepseek-v4-flash", "deepseek-v4-pro"])
  const { providers, activeProvider } = resolveProviders()
  assert.equal(activeProvider, "deepseek")
  assert.equal(providers[0].models.length, 2)
})

test("AC-2 写回失败不阻断（内存迁移态继续——下次重试——saveRaw 冲突路径幂等）", () => {
  const p = tmpCfg({
    providers: [{ name: "kimi", baseURL: "https://x", model: "kimi-k3", apiKey: "k" }],
    activeProvider: "kimi",
  })
  chmodSync(p, 0o444) // 只读——写回失败
  const raw = loadRaw() // 不 throw
  assert.equal(raw.defaultModel, "kimi:kimi-k3", "内存迁移态继续")
  assert.deepEqual(raw.providers[0].models, ["kimi-k3"])
  const disk = JSON.parse(readFileSync(p, "utf8"))
  assert.equal(disk.activeProvider, "kimi", "磁盘保留老形态（下次重试）")
  chmodSync(p, 0o644)
  const raw2 = loadRaw()
  assert.equal(raw2.defaultModel, "kimi:kimi-k3")
  const disk2 = JSON.parse(readFileSync(p, "utf8"))
  assert.equal("activeProvider" in disk2, false)
})

test("无 model 渠道 → models:[]（D-S1 路径——resolveProviders 首渠道回退不静默破）", () => {
  tmpCfg({ providers: [{ name: "custom", baseURL: "https://custom.example" }], activeProvider: "custom" })
  const raw = loadRaw()
  assert.deepEqual(raw.providers[0].models, [])
  assert.equal(raw.defaultModel, undefined)
})

test("AC-1 defaultModel 解析：resolveProviders activeProvider = defaultModel 渠道；失效回退首渠道", () => {
  tmpCfg({
    defaultModel: "kimi:kimi-k3",
    providers: [
      { name: "deepseek", baseURL: "https://a", models: ["d1"], apiKey: "k" },
      { name: "kimi", baseURL: "https://b", models: ["kimi-k3"], apiKey: "k" },
    ],
  })
  let { providers, activeProvider } = resolveProviders()
  assert.equal(activeProvider, "kimi", "activeProvider = defaultModel 渠道")
  // providerFromConfig 运行时 model：defaultModel 属该渠道 → 用之；非默认渠道 → 首候选
  const prov = providerFromConfig("kimi")
  assert.equal(prov.model, "kimi-k3")
  assert.equal(prov.apiKey, "k")
  assert.equal(providerFromConfig("deepseek").model, "d1")
  // 失效（defaultModel 渠道不在 providers）→ 回退首渠道
  writeFileSync(join(dir, "config.json"), JSON.stringify({ defaultModel: "ghost:x", providers: [{ name: "deepseek", baseURL: "https://a", models: ["d1"], apiKey: "k" }] }), "utf8")
  ;({ providers, activeProvider } = resolveProviders())
  assert.equal(activeProvider, "deepseek")
  assert.equal(providerFromConfig("deepseek").model, "d1")
  // resolveDefaultModel 纯函数
  assert.equal(resolveDefaultModel({ name: "kimi", models: ["kimi-k3"] }, { defaultModel: "kimi:kimi-k3" }), "kimi-k3")
  assert.equal(resolveDefaultModel({ name: "kimi", models: ["kimi-k3"] }, { defaultModel: "deepseek:deepseek-v4-pro" }), "kimi-k3")
  assert.equal(resolveDefaultModel({ name: "kimi", models: [] }, { defaultModel: "kimi:kimi-k3" }), null)
})

test("迁移纯函数幂等 + 新 schema 零动 + 老指针失效走 C 第三级", () => {
  const legacy = { providers: [{ name: "a", baseURL: "https://a", model: "a1" }], activeProvider: "ghost", activeModel: "x" }
  assert.equal(migrateLegacyModelFields(legacy), true)
  assert.equal(legacy.defaultModel, "a:a1")
  assert.deepEqual(legacy.providers[0].models, ["a1"])
  assert.equal(migrateLegacyModelFields(legacy), false)
  const fresh = { providers: [{ name: "a", models: ["a1"] }], defaultModel: "a:a1" }
  assert.equal(migrateLegacyModelFields(fresh), false)
})
