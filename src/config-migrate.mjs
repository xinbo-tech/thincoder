/**
 * config-migrate.mjs — one-time migration of legacy VS Code key stores into config.json.
 * Split out of config-io.mjs (500-line hard limit). The VS Code glue (settings +
 * SecretStorage wiring) lives in extension/migrate-settings.mjs.
 */

import { PROVIDER_PRESETS, presetToEntry } from "./config-presets.mjs"
import { loadRaw, saveRaw, conflictError } from "./config-io.mjs"

const EMBEDDING_DEFAULTS = { baseURL: "https://api.siliconflow.cn/v1", model: "BAAI/bge-m3" }

/**
 * Pure function:
 *   deps.secrets       — { get(key), delete(key) } (async, may throw)
 *   deps.flags         — { get(): Promise<boolean>, set(): Promise<void> } (one-shot guard)
 *   deps.legacySettings — the old `thincoder.providers` settings value (object or undefined)
 *   deps.clearLegacySettings — async fn that deletes the legacy settings key
 *
 * Never overwrites an apiKey already present in config.json (the CLI may have written it first).
 * Builtin preset names missing from providers[] are created from PROVIDER_PRESETS; unknown
 * names are only created when baseURL/model metadata is recoverable.
 */
export async function migrateCore(deps) {
  const { secrets, flags, legacySettings, clearLegacySettings } = deps
  if (await flags.get()) return

  const raw = loadRaw()
  const providers = Array.isArray(raw.providers) ? raw.providers : []
  raw.providers = providers
  const byName = new Map(providers.filter((p) => p && typeof p === "object" && p.name).map((p) => [p.name, p]))

  const legacyMeta = {}
  for (const [name, entry] of Object.entries(legacySettings || {})) {
    if (entry && typeof entry === "object") legacyMeta[name] = entry
  }

  function applyKey(name, key) {
    if (!key) return
    let entry = byName.get(name)
    if (!entry) {
      if (PROVIDER_PRESETS[name]) {
        entry = presetToEntry(name)
      } else {
        const meta = legacyMeta[name]
        if (!meta?.baseURL || !meta?.model) return // orphan key, no way to reconstruct
        entry = { name, baseURL: meta.baseURL, model: meta.model }
        // PROVIDER.md §15 D-C4: migrate-settings is the same source — a legacy
        // settings entry carrying context (K units) rides along into config.json.
        if (meta.context != null) entry.context = meta.context
      }
      entry.apiKey = key
      providers.push(entry)
      byName.set(name, entry)
      return
    }
    if (!entry.apiKey) entry.apiKey = key // never clobber an existing key
  }

  // SecretStorage keys first, then settings.json keys (both are legacy; config.json wins)
  const legacyNames = [...Object.keys(PROVIDER_PRESETS), "custom"]
  for (const name of legacyNames) {
    try { applyKey(name, await secrets.get(`thincoder.provider.${name}`)) } catch { /* ignore */ }
  }
  for (const [name, entry] of Object.entries(legacySettings || {})) {
    applyKey(name, typeof entry === "string" ? entry : entry?.key)
  }

  // Embedding key (legacy SecretStorage → config.embedding)
  try {
    const embKey = await secrets.get("thincoder.embedding.apiKey")
    if (embKey) {
      const emb = raw.embedding && typeof raw.embedding === "object" ? raw.embedding : {}
      if (!emb.apiKey) emb.apiKey = embKey
      if (!emb.baseURL) emb.baseURL = EMBEDDING_DEFAULTS.baseURL
      if (!emb.model) emb.model = EMBEDDING_DEFAULTS.model
      raw.embedding = emb
    }
  } catch { /* ignore */ }

  // Legacy MCP servers were removed together with the `thincoder.mcpServers`
  // setting itself (pre-release, no migration — see package.json history).

  // F5b（R10——MULTI-INSTANCE-COLLAB.md D-F5b）：迁移是读-改-写链（读后多 await 异步
  // 窗口）——saveRaw 写前 mtime 门控冲突（{ok:false, reason:"mtime-conflict"}）→ 放弃
  // 本次迁移：legacy 存储不清理、flags 不置位——下次启动自动重试（绝不能清了 legacy
  // 又丢了 config 写——密钥才会真正丢失）。
  if (conflictError(saveRaw(raw))) return

  // Clean up legacy stores so nothing reads them again
  for (const name of legacyNames) {
    try { await secrets.delete(`thincoder.provider.${name}`) } catch { /* ignore */ }
  }
  try { await secrets.delete("thincoder.embedding.apiKey") } catch { /* ignore */ }
  try { await clearLegacySettings() } catch { /* ignore */ }
  await flags.set()
}
