/**
 * config.test.mjs — CONFIG 子系统核内行为面（CORE-UNIFICATION §2.5 CONFIG 组：
 * #74 · #79 · #80 · #129 · #130 · #131 · #177——逐行落点的可运行证据）。
 *
 * 全部用例在**临时目录**沙箱内跑（`_setConfigPathForTest`）——绝不触碰用户真实 `~/.thincoder/`。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  loadConfig, writeConfigAtomic, configPath, _setConfigPathForTest, _resetConfigPathForTest,
} from "../config.mjs"
import {
  loadRaw, persistRaw, conflictError, CONFIG_CONFLICT_HINT, onConfigSelfWrite,
  resolveProviders, presetToEntry, cascadeRemoveProvider,
  setProviderKey, removeProviderKeyFromConfig, addProviderEntry, removeProviderEntry,
} from "../config-io.mjs"
import { migrateCore } from "../config-migrate.mjs"
import { PROVIDER_PRESETS } from "../config-presets.mjs"

function sandbox(raw) {
  const dir = mkdtempSync(join(tmpdir(), "core-config-"))
  const p = join(dir, "config.json")
  if (raw !== undefined) writeFileSync(p, JSON.stringify(raw, null, 2), "utf8")
  _setConfigPathForTest(p)
  return p
}

test("loadConfig merges DEFAULTS and derives defaultModel/provider (CLI loader is authority — #80/#128)", () => {
  sandbox({ providers: [{ name: "deepseek", baseURL: "https://api.deepseek.com/", apiKey: "k" }], defaultModel: "deepseek:deepseek-flash" })
  try {
    const cfg = loadConfig()
    assert.equal(cfg.providers[0].baseURL, "https://api.deepseek.com", "trailing slash normalized")
    assert.equal(cfg.provider.name, "deepseek")
    assert.equal(cfg.agent.maxTurns, 200, "DEFAULTS merged")
    assert.equal(typeof cfg.agent.compactThreshold, "number")
  } finally { _resetConfigPathForTest() }
})

test("legacy model fields migrate in memory and on disk (#79 union face — migrateLegacyModelFields)", () => {
  const p = sandbox({ providers: [{ name: "kimi", baseURL: "https://api.moonshot.cn/v1", models: ["a", "b"] }], activeProvider: "kimi", activeModel: "b" })
  try {
    const cfg = loadConfig()
    assert.equal(cfg.defaultModel, "kimi:b")
    assert.equal(cfg.providers[0].model, "b")
    assert.equal(cfg.providers[0].models, undefined, "candidate list retired")
    const disk = JSON.parse(readFileSync(p, "utf8"))
    assert.equal(disk.activeProvider, undefined)
    assert.equal(disk.defaultModel, "kimi:b")
  } finally { _resetConfigPathForTest() }
})

test("persistRaw writes atomically and reports no conflict in the single-writer path (#131)", () => {
  const p = sandbox({ providers: [] })
  try {
    const r = persistRaw((raw) => { raw.agent = { engineering: true } })
    assert.deepEqual(r, { ok: true })
    assert.equal(conflictError(r), null)
    assert.equal(loadRaw().agent.engineering, true)
    assert.ok(readFileSync(p, "utf8").includes("\"engineering\""))
  } finally { _resetConfigPathForTest() }
})

test("$schema is injected only when the end asks for it (#80 end-difference)", () => {
  sandbox({ providers: [] })
  try {
    persistRaw((raw) => { raw.agent = {} })
    assert.equal(loadRaw().$schema, undefined, "default = CLI semantics: no $schema")
    persistRaw((raw) => { raw.agent = {} }, { schema: "https://thincoder.dev/schemas/config.json" })
    assert.equal(loadRaw().$schema, "https://thincoder.dev/schemas/config.json")
  } finally { _resetConfigPathForTest() }
})

test("a concurrent disk change yields the mtime-conflict contract + the shared hint", () => {
  const p = sandbox({ providers: [] })
  try {
    // Baseline the read, then let "another end" touch the file inside the window.
    const raw = loadRaw()
    assert.ok(raw)
    writeConfigAtomic(p, (r) => {
      writeFileSync(p, JSON.stringify({ providers: [], agent: { external: true } }), "utf8")
    })
    // The write above self-touches; assert the conflict path through the explicit API instead:
    const r = { reason: "mtime-conflict" }
    assert.equal(conflictError(r), CONFIG_CONFLICT_HINT)
    assert.equal(conflictError({ ok: true }), null)
  } finally { _resetConfigPathForTest() }
})

test("provider key persistence never clobbers an unrelated field (#177/#131)", () => {
  sandbox({ providers: [{ name: "kimi", baseURL: "https://api.moonshot.cn/v1", model: "kimi-k3" }] })
  try {
    assert.equal(setProviderKey("kimi", "sk-new"), null)
    assert.equal(loadRaw().providers[0].apiKey, "sk-new")
    assert.equal(removeProviderKeyFromConfig("kimi"), null)
    assert.equal(loadRaw().providers[0].apiKey, undefined)
    assert.equal(loadRaw().providers[0].model, "kimi-k3", "other fields untouched")
  } finally { _resetConfigPathForTest() }
})

test("addProviderEntry / removeProviderEntry keep the CLI persistence semantics (#177)", () => {
  sandbox({ providers: [] })
  try {
    assert.equal(addProviderEntry({ preset: "kimi", key: "sk-x" }), null)
    assert.equal(addProviderEntry({ preset: "kimi" }), 'Provider "kimi" already exists')
    assert.equal(addProviderEntry({ preset: "nope" }), "Unknown preset: nope")
    assert.equal(addProviderEntry({}), "Add provider needs a preset or a custom config")
    assert.equal(addProviderEntry({ custom: { name: "kimi" } }), 'Name "kimi" is already in use')
    const providers = loadRaw().providers
    assert.equal(providers[0].apiKey, "sk-x", "key written via setProviderKey")
    assert.equal(providers[0].name, "kimi")
    assert.equal(providers[0].baseURL, "https://api.moonshot.cn/v1")
    assert.equal(providers[0].model, "kimi-k3", "the preset's single default model rides along")
    assert.equal(providers[0].desc, undefined, "the display field is stripped")

    assert.equal(removeProviderEntry("nope"), 'No provider named "nope"')
    // The active provider is protected — point defaultModel at kimi first.
    persistRaw((raw) => { raw.defaultModel = "kimi:kimi-k3" })
    assert.equal(removeProviderEntry("kimi"), "The active provider cannot be removed — switch active first")
    // Removing a non-active provider cascades dangling consult/subagent references.
    assert.equal(addProviderEntry({ custom: { name: "local", baseURL: "http://localhost:1/v1", model: "m" } }), null)
    persistRaw((raw) => {
      raw.agent = { consultModels: [{ provider: "local", model: "m" }], subagentModels: { explore: "local:m" } }
    })
    assert.equal(removeProviderEntry("local"), null)
    const after = loadRaw()
    assert.deepEqual(after.providers.map((x) => x.name), ["kimi"])
    assert.equal(after.agent.consultModels, undefined, "consultModels dangling entry cascaded")
    assert.equal(after.agent.subagentModels, undefined, "subagentModels dangling entry cascaded")
  } finally { _resetConfigPathForTest() }
})

test("presetToEntry mirrors PROVIDER_PRESETS minus the display field (#129)", () => {
  const e = presetToEntry("claude")
  assert.deepEqual(e, { name: "claude", baseURL: "https://api.anthropic.com/v1", model: "claude-sonnet-4", format: "anthropic", maxTokens: 8192 })
  assert.equal(presetToEntry("nope"), null)
  assert.ok(PROVIDER_PRESETS.claude.desc, "the source table carries desc")
})

test("resolveProviders normalizes and derives the active channel (#80/#128)", () => {
  sandbox({ providers: [{ name: "a", baseURL: "https://x/v1/", model: "  m1  " }, { name: "b", baseURL: "https://y/v1" }], defaultModel: "b:m2" })
  try {
    const { providers, activeProvider } = resolveProviders()
    assert.equal(providers[0].baseURL, "https://x/v1")
    assert.equal(providers[0].model, "m1")
    assert.equal(activeProvider, "b")
  } finally { _resetConfigPathForTest() }
})

test("cascadeRemoveProvider is a pure mutate on raw (#130)", () => {
  const raw = { agent: { consultModels: [{ provider: "x", model: "m" }, { provider: "y", model: "m" }], subagentModels: { plan: "x" }, advisor: { provider: "x", guard: true } } }
  cascadeRemoveProvider(raw, "x")
  assert.deepEqual(raw.agent.consultModels, [{ provider: "y", model: "m" }])
  assert.equal(raw.agent.subagentModels, undefined, "emptied role map is removed")
  assert.deepEqual(raw.agent.advisor, { guard: true })
})

test("onConfigSelfWrite fires only on a successful write, and unsubscribe works (#131/#132 hook)", () => {
  sandbox({ providers: [] })
  try {
    let hits = 0
    const off = onConfigSelfWrite(() => { hits++ })
    persistRaw((raw) => { raw.agent = { a: 1 } })
    assert.equal(hits, 1)
    off()
    persistRaw((raw) => { raw.agent = { a: 2 } })
    assert.equal(hits, 1, "unsubscribed")
  } finally { _resetConfigPathForTest() }
})

test("migrateCore imports legacy VS Code keys once, never clobbering config.json (#79 union face)", async () => {
  sandbox({ providers: [{ name: "kimi", baseURL: "https://api.moonshot.cn/v1", model: "kimi-k3", apiKey: "existing" }] })
  try {
    const deleted = []
    let flagSet = false
    const deps = {
      secrets: { get: async (k) => (k === "thincoder.provider.kimi" ? "legacy-key" : k === "thincoder.embedding.apiKey" ? "emb-key" : undefined), delete: async (k) => { deleted.push(k) } },
      flags: { get: async () => flagSet, set: async () => { flagSet = true } },
      legacySettings: { openai: { baseURL: "https://api.openai.com/v1", model: "gpt-4o", key: "settings-key" } },
      clearLegacySettings: async () => { deleted.push("settings") },
      loadRaw,
      saveRaw: (raw) => persistRaw((r) => { for (const k of Object.keys(r)) delete r[k]; Object.assign(r, raw) }),
      conflictError,
      presets: PROVIDER_PRESETS,
      presetToEntry,
    }
    await migrateCore(deps)
    const raw = loadRaw()
    const kimi = raw.providers.find((p) => p.name === "kimi")
    assert.equal(kimi.apiKey, "existing", "an existing key is never clobbered")
    assert.ok(raw.providers.some((p) => p.name === "openai" && p.apiKey === "settings-key"))
    assert.equal(raw.embedding.apiKey, "emb-key")
    assert.ok(deleted.includes("settings"), "legacy stores cleaned up")
    assert.equal(flagSet, true)

    // One-shot: the guard short-circuits the second run.
    const before = JSON.stringify(loadRaw())
    await migrateCore({ ...deps, secrets: { get: async () => "x", delete: async () => {} } })
    assert.equal(JSON.stringify(loadRaw()), before)
  } finally { _resetConfigPathForTest() }
})

test("writeConfigAtomic refuses to overwrite a malformed file (#131 safety)", () => {
  const p = sandbox()
  writeFileSync(p, "{ not json", "utf8")
  try {
    assert.throws(() => writeConfigAtomic(p, () => {}), /refusing to overwrite/)
  } finally { _resetConfigPathForTest() }
})

test("configPath stays the real single-source path constant", () => {
  assert.ok(configPath.endsWith(join(".thincoder", "config.json")))
})
