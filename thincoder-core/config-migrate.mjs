/**
 * config-migrate.mjs — model-schema legacy-shape migration core (MODEL-SELECTION v2, §16.2 M7).
 * Split out of config.mjs (500-line hard limit). Pure function, zero imports — the
 * write-back orchestration (writeConfigAtomic / persistRaw, failure tolerance) stays in
 * the caller (CLI: config.mjs loadConfig; VSC: config-io.mjs loadRaw — same rule, 双端各自
 * 独立实现——不做同步依赖).
 *
 * 目标形态 C（2026-10-09 清除批：渠道单值模型退场——M7 v2）：渠道**不携模型**（`providers[].model` /
 * `models[]` 一律删）+ 顶层 `defaultModel` 复合（新会话起点）。
 * 老形态迁移（v2）：
 * - A：`activeProvider/activeModel` → `defaultModel` 复合（`activeModel` 优先；AP 不存在/AM 空 → 首渠道回退）
 * - B：`providers[].models[]` / `providers[].model` → 一律删除（清理）
 * - 顺序：先构造/读取有效 `defaultModel` 值（含老 active* 转换），再清各渠道 `model` / `models` 键
 * - 幂等：无老字段（无 `models` / 无 `model` / 无 active*）→ 返回 false 不动；slot 旧字段
 *   （会话文件内）不迁移——读侧容忍
 *
 * ── 核内合并（CORE-UNIFICATION §2.5 #79 · CONFIG 组「取并集」）──
 * ② `migrateCore`（VS Code 旧设置 / 密钥库迁移遍——VSC 侧逐字随迁 + 依赖面收核为注入参数）：
 *    CLI 侧无此通道，VSC 侧「不迁即丢密钥」⇒ 进核。读-改-写编排（loadRaw / saveRaw /
 *    conflictError——写回失败绝不阻断）由调用方注入（核内 = `config.mjs`）；
 *    本档被 `config.mjs` import ⇒ 不得反向 import（循环）——故 ② 保持纯函数形态。
 */

export function migrateLegacyModelFields(raw) {
  if (!raw || typeof raw !== "object") return false
  const providers = Array.isArray(raw.providers) ? raw.providers : []
  let changed = false

  // ── ① 有效 defaultModel 值（含老 active* 转换）──
  if (raw.activeProvider !== undefined || raw.activeModel !== undefined) {
    const rawAP = typeof raw.activeProvider === "string" && raw.activeProvider.trim() ? raw.activeProvider : ""
    const rawAM = typeof raw.activeModel === "string" && raw.activeModel.trim() ? raw.activeModel : ""
    const ap = rawAP ? providers.find((p) => p?.name === rawAP) : null
    if (ap && rawAM) {
      if (raw.defaultModel == null) { raw.defaultModel = `${rawAP}:${rawAM}`; changed = true }
    } else {
      // AP 已不存在 / AM 无法归属 → 首渠道回退（该渠道有模型来源才可用——迁移产物必可用）
      const first = providers.find((p) => seedModel(p) != null)
      if (first && raw.defaultModel == null) { raw.defaultModel = `${first.name}:${seedModel(first)}`; changed = true }
    }
    delete raw.activeProvider
    delete raw.activeModel
    changed = true
  }

  // ── ② 渠道模型键清除（2026-10-09 清除批——M7 v2：渠道不携模型，`model` / `models` 一律删；
  //    幂等 = 无键零改）──
  for (const p of providers) {
    if (!p || typeof p !== "object") continue
    if (p.models !== undefined) { delete p.models; changed = true }
    if (p.model !== undefined) { delete p.model; changed = true }
  }
  return changed
}

/** 渠道级模型来源读数（迁移用）：现有 `p.model`（非空字符串优先）或 `models[]` 首个非空字符串。 */
function seedModel(p) {
  if (typeof p?.model === "string" && p.model.trim()) return p.model
  const models = Array.isArray(p?.models) ? p.models : []
  return models.find((m) => typeof m === "string" && m.trim()) ?? null
}

/**
 * ② VS Code 旧设置 / 密钥库迁移遍（CORE-UNIFICATION §2.5 #79——**取并集**：CLI 侧无此通道，
 * VSC 侧「不迁即丢密钥」）。来源 = `thincoder-vscode/src/config-migrate.mjs` 的 `migrateCore`
 * ——逐字随迁，**依赖面收核**（原 import 的 `PROVIDER_PRESETS` / `presetToEntry` 与
 * `loadRaw` / `saveRaw` / `conflictError` 改为**注入参数**——本档由 `config.mjs` import，
 * 不得反向 import `config.mjs`（循环）⇒ 纯函数形态保留，调用方供应依赖）。
 *
 * Pure function:
 *   deps.secrets            — { get(key), delete(key) } (async, may throw)
 *   deps.flags              — { get(): Promise<boolean>, set(): Promise<void> } (one-shot guard)
 *   deps.legacySettings     — the old `thincoder.providers` settings value (object or undefined)
 *   deps.clearLegacySettings— async fn that deletes the legacy settings key
 *   deps.loadRaw / deps.saveRaw / deps.conflictError — 核内单一读写面（config.mjs）
 *   deps.presets / deps.presetToEntry                — 核内预设表（config.mjs）
 *
 * Never overwrites an apiKey already present in config.json (the CLI may have written it first).
 * Builtin preset names missing from providers[] are created from PROVIDER_PRESETS; unknown
 * names are only created when baseURL metadata is recoverable (渠道不携模型——2026-10-09 清除批).
 */
export async function migrateCore(deps) {
  const { secrets, flags, legacySettings, clearLegacySettings } = deps
  const loadRaw = deps.loadRaw
  const saveRaw = deps.saveRaw
  const conflictError = deps.conflictError
  const PROVIDER_PRESETS = deps.presets
  const presetToEntry = deps.presetToEntry
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
        if (!meta?.baseURL) return // orphan key, no way to reconstruct（渠道不携模型——2026-10-09 清除批：门只认 baseURL，model 零读零落）
        entry = { name, baseURL: meta.baseURL }
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

const EMBEDDING_DEFAULTS = { baseURL: "https://api.siliconflow.cn/v1", model: "BAAI/bge-m3" }
