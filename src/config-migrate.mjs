/**
 * config-migrate.mjs — migration cores for the shared ~/.thincoder/config.json.
 * ① legacy VS Code key stores → config.json (migrateCore, below).
 * ② MODEL-MERGE-SESSION 老形态迁移（migrateLegacyModelFields——与 CLI
 *    thincoder/src/config-migrate.mjs 同规则同字节语义——防各写各的——AC-8 diff 核对照；
 *    双端差异只许在头注释/语言/导入行）。
 * Split out of config-io.mjs (500-line hard limit). The VS Code glue (settings +
 * SecretStorage wiring) lives in extension/migrate-settings.mjs.
 */

import { PROVIDER_PRESETS, presetToEntry } from "./config-presets.mjs"
import { loadRaw, saveRaw, conflictError } from "./config-io.mjs"

const EMBEDDING_DEFAULTS = { baseURL: "https://api.siliconflow.cn/v1", model: "BAAI/bge-m3" }

/** 迁移折中 C（MODEL-MERGE-SESSION §3）：老形态（providers[].model || activeModel ||
 *  activeProvider）→ 新 schema：每渠道 .model → models:[model]（models 已存在且非空则保留）；
 *  defaultModel = (activeModel ?? activeProvider 渠道 model ?? 首渠道首候选) 复合。纯函数：
 *  入参 raw 就地变换，返回是否 changed——幂等（无老字段 → false 不动）。写回编排在调用侧
 *  （CLI loadConfig = writeConfigAtomic / VSC loadRaw = saveRaw——失败不阻断——内存态继续）。
 *  语义细则：
 *  - rawAM 覆盖值并入渠道候选（老 override 可不在渠道 .model——默认 AP:AM 必须能通过
 *    严格成员校验，迁移不自产无效 defaultModel）
 *  - 无 .model 的渠道 → models 留空 []（→ D-S1 弹选择——不静默破——评审 #7）
 *  - 老 activeProvider 指向不存在的渠道 → 跳过 AP:AM 复合（AM 无法归属）→ 走折中 C 第三级
 *    「首渠道首候选」兜底——迁移产物必可用（不留下每启必弹的破损态）
 *  - slot 旧字段（会话文件内 activeProvider/activeModel）不迁移——读侧容忍 */
export function migrateLegacyModelFields(raw) {
  if (!raw || typeof raw !== "object") return false
  const providers = Array.isArray(raw.providers) ? raw.providers : []
  const provModel = new Map() // provider name → 旧 .model 值
  let changed = false
  for (const p of providers) {
    if (!p || typeof p !== "object") continue
    if (typeof p.model === "string" && p.model) {
      provModel.set(p.name, p.model)
      const models = Array.isArray(p.models) ? p.models : []
      if (models.length === 0) p.models = [p.model]
      delete p.model
      changed = true
    } else if (p.model !== undefined) {
      delete p.model // 空/非字符串 model —— 老字段垃圾一并清
      changed = true
    }
    if (p.models === undefined) { p.models = []; changed = true } // 新 schema 归一：渠道必有 models 字段
  }
  const hasAP = raw.activeProvider !== undefined
  const hasAM = raw.activeModel !== undefined
  if (hasAP || hasAM) {
    const rawAP = typeof raw.activeProvider === "string" && raw.activeProvider.trim() ? raw.activeProvider : ""
    const rawAM = typeof raw.activeModel === "string" && raw.activeModel.trim() ? raw.activeModel : ""
    let dm = null
    const ap = rawAP ? providers.find((p) => p?.name === rawAP) : null
    if (ap) {
      const models = Array.isArray(ap.models) ? ap.models : (ap.models = [])
      if (rawAM && !models.includes(rawAM)) { models.unshift(rawAM); changed = true }
      const m = rawAM || provModel.get(rawAP) || (Array.isArray(ap.models) && ap.models.length ? ap.models[0] : "")
      if (m) dm = `${rawAP}:${m}`
    } else {
      dm = null // 老 activeProvider 已不存在 —— 走下方首渠道兜底
    }
    if (!dm) {
      const first = providers.find((p) => Array.isArray(p?.models) && p.models.length > 0)
      if (first) dm = `${first.name}:${first.models[0]}`
    }
    if (dm && raw.defaultModel == null) { raw.defaultModel = dm; changed = true }
    delete raw.activeProvider
    delete raw.activeModel
    changed = true
  }
  return changed
}

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
