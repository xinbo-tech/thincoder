/**
 * config-migrate.mjs — migration cores for the shared ~/.thincoder/config.json.
 * ① legacy VS Code key stores → config.json (migrateCore, below).
 * ② 模型字段老形态迁移（migrateLegacyModelFields——2026-09-10 MODEL-SELECTION M7 v2：
 *    `providers[].models[]` 候选清单退场 + 渠道单值 `providers[].model` 恢复；与 CLI
 *    `thincoder/src/config-migrate.mjs` 同规则——语义同源，各端独立实现（不做逐字硬一致，
 *    N4 多实现面纪律）。双端差异只许在头注释/语言/导入行。
 * Split out of config-io.mjs (500-line hard limit). The VS Code glue (settings +
 * SecretStorage wiring) lives in extension/migrate-settings.mjs.
 */

import { PROVIDER_PRESETS, presetToEntry } from "./config-presets.mjs"
import { loadRaw, saveRaw, conflictError } from "./config-io.mjs"

const EMBEDDING_DEFAULTS = { baseURL: "https://api.siliconflow.cn/v1", model: "BAAI/bge-m3" }

/** 迁移 v2（MODEL-SELECTION M7——形态 A/B → 单值 C）：
 *
 * | 老形态 | 迁移动作 |
 * |---|---|
 * | A：`providers[].model` + `activeProvider/activeModel` | `p.model` 保留为新形态单值默认模型（不再搬入 models）；`activeProvider/activeModel` → `defaultModel` 复合（同旧：`activeModel` 优先；AP 不存在 → 首渠道回退） |
 * | B：`providers[].models[]`（+ 混合） | `p.model = defaultModel 属本渠道的模型段 ?? 现有 p.model（非空字符串）?? models[] 首个非空字符串`；`delete p.models` |
 * | 垃圾 | 非字符串 `p.model` / 非数组 `p.models` → 删除（清理） |
 *
 * 顺序：先构造/读取有效 `defaultModel`（含老 active* 转换），再按它给各渠道播种 `p.model`。
 * 幂等：无老字段 → false 不动。空结果合法：渠道无模型来源 → `p.model` 不设（模型选择经
 * `/models` 拉取候选——准入判据 M8/M9）。写回编排在调用侧（VSC loadRaw = saveRaw——
 * 失败不阻断——内存态继续）。
 */
export function migrateLegacyModelFields(raw) {
  if (!raw || typeof raw !== "object") return false
  const providers = Array.isArray(raw.providers) ? raw.providers : []
  let changed = false

  // ── ① 先定有效 defaultModel（含老 active* 转换——播种取数序第一级）──
  const hasAP = raw.activeProvider !== undefined
  const hasAM = raw.activeModel !== undefined
  let dm = compositeOf(raw.defaultModel)
  if (hasAP || hasAM) {
    const apName = typeof raw.activeProvider === "string" && raw.activeProvider.trim() ? raw.activeProvider.trim() : ""
    const amValue = typeof raw.activeModel === "string" && raw.activeModel.trim() ? raw.activeModel.trim() : ""
    let constructed = null
    const ap = apName ? providers.find((p) => p?.name === apName) : null
    if (ap) {
      const m = amValue || seedSourceOf(ap)
      if (m) constructed = `${ap.name}:${m}`
    }
    // 老 activeProvider 指向不存在的渠道 → 复合跳过（AM 无法归属）→ 首渠道兜底——
    // 迁移产物必可用（不留下每启必弹的破损态）
    if (!constructed) {
      const first = providers.find((p) => seedSourceOf(p))
      if (first) constructed = `${first.name}:${seedSourceOf(first)}`
    }
    if (!dm) dm = constructed
    if (raw.defaultModel == null && dm) { raw.defaultModel = dm; changed = true }
    delete raw.activeProvider
    delete raw.activeModel
    changed = true
  }

  // ── ② 各渠道：单值化 + 清 models（候选清单退场）──
  for (const p of providers) {
    if (!p || typeof p !== "object") continue
    const existing = typeof p.model === "string" && p.model.trim() ? p.model.trim() : ""
    const dmSeg = dm && providerPartOf(dm) === p.name ? modelPartOf(dm) : ""
    const legacy = Array.isArray(p.models) ? p.models : null
    // 形态 B / 混合（models 在场）：DM 段优先于遗留 p.model；形态 A / 新形态：p.model 保留
    const next = legacy ? (dmSeg || existing || firstModelOf(legacy)) : (existing || dmSeg)
    if (next) {
      if (p.model !== next) { p.model = next; changed = true }
    } else if (p.model !== undefined) {
      delete p.model // 非字符串/空串归一删除（清理）
      changed = true
    }
    if (p.models !== undefined) { delete p.models; changed = true }
  }
  return changed
}

/** 有效复合 `provider:model`（两段均非空）——否则 null。 */
function compositeOf(value) {
  if (typeof value !== "string") return null
  const sep = value.indexOf(":")
  return sep > 0 && value.slice(sep + 1) ? value : null
}

function providerPartOf(dm) { return dm.slice(0, dm.indexOf(":")) }
function modelPartOf(dm) { return dm.slice(dm.indexOf(":") + 1) }

/** 渠道的种子来源：现有单值（非空字符串） ?? models[] 首个非空字符串。 */
function seedSourceOf(p) {
  if (typeof p?.model === "string" && p.model.trim()) return p.model.trim()
  return firstModelOf(Array.isArray(p?.models) ? p.models : null)
}

function firstModelOf(models) {
  if (!Array.isArray(models)) return ""
  return models.find((m) => typeof m === "string" && m && m.trim())?.trim() ?? ""
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
