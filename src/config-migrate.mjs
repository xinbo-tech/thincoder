/**
 * config-migrate.mjs — model-schema legacy-shape migration core (MODEL-SELECTION v2, §16.2 M7).
 * Split out of config.mjs (500-line hard limit). Pure function, zero imports — the
 * write-back orchestration (writeConfigAtomic / persistRaw, failure tolerance) stays in
 * the caller (CLI: config.mjs loadConfig; VSC: config-io.mjs loadRaw — same rule, 双端各自
 * 独立实现——不做同步依赖).
 *
 * 目标形态 C：每渠道恰好一个默认模型（`providers[].model` 单值）+ 顶层 `defaultModel` 复合。
 * 老形态迁移（v2）：
 * - A：`providers[].model` + `activeProvider/activeModel` → `p.model` **保留**（不再搬入 models）；
 *   `activeProvider/activeModel` → `defaultModel` 复合（`activeModel` 优先；AP 不存在/AM 空 → 首渠道回退）
 * - B：`providers[].models[]` → `p.model = defaultModel 属本渠道的模型段 ?? 现有 p.model（非空字符串）
 *   ?? models[] 首个非空字符串`，然后 `delete p.models`
 * - 混合/垃圾：非数组 `p.models` / 非字符串（空串）`p.model` → 删除（清理）
 * - 顺序：先构造/读取有效 `defaultModel` 值（含老 active* 转换），再按它给各渠道播种 `p.model`
 * - 幂等：无老字段（无 `models` / 无 active* / 无垃圾值）→ 返回 false 不动；slot 旧字段
 *   （会话文件内）不迁移——读侧容忍
 * - 空结果合法：渠道无模型来源 → `p.model` 不设（模型选择经 `/models` 拉取候选——M8/M9）
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

  // ── ② 渠道播种单值 `p.model` + 清 models ──
  const dm = typeof raw.defaultModel === "string" && raw.defaultModel.trim() ? raw.defaultModel : null
  const dmSep = dm ? dm.indexOf(":") : -1
  const dmProvider = dmSep > 0 ? dm.slice(0, dmSep) : null
  const dmModel = dmSep > 0 && dmSep < dm.length - 1 ? dm.slice(dmSep + 1) : null
  for (const p of providers) {
    if (!p || typeof p !== "object") continue
    if (Array.isArray(p.models)) {
      const next = (p.name === dmProvider && dmModel)
        ? dmModel
        : (typeof p.model === "string" && p.model.trim() ? p.model : seedModel(p))
      if (next == null) delete p.model
      else p.model = next
      delete p.models
      changed = true
      continue
    }
    if (p.models !== undefined) { delete p.models; changed = true } // 非数组 models —— 垃圾清理
    if (p.model !== undefined && !(typeof p.model === "string" && p.model.trim())) { delete p.model; changed = true }
  }
  return changed
}

/** 渠道级模型来源读数（迁移用）：现有 `p.model`（非空字符串优先）或 `models[]` 首个非空字符串。 */
function seedModel(p) {
  if (typeof p?.model === "string" && p.model.trim()) return p.model
  const models = Array.isArray(p?.models) ? p.models : []
  return models.find((m) => typeof m === "string" && m.trim()) ?? null
}
