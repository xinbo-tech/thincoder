/**
 * config-migrate.mjs — model-merge legacy-shape migration core (MODEL-MERGE-SESSION §3).
 * Split out of config.mjs (500-line hard limit). Pure function, zero imports — the
 * write-back orchestration (writeConfigAtomic / persistRaw, failure tolerance) stays in
 * the caller (CLI: config.mjs loadConfig; VSC: config-io.mjs loadRaw — same rule, 防各
 * 写各的——AC-8 diff 核对照本文件与 thincoder-vscode/src/config-migrate.mjs 的
 * migrateLegacyModelFields)。
 *
 * 迁移折中 C：老形态（providers[].model || activeModel || activeProvider）→ 新 schema。
 * - 每渠道 .model → models:[model]（models 已存在且非空则保留——新字段优先）
 * - defaultModel = (activeModel ?? activeProvider 渠道 model ?? 首渠道首候选) 复合
 * - 幂等：无老字段 → 返回 false 不动；slot 旧字段（会话文件内）不迁移——读侧容忍
 *
 * 语义细则：
 * - rawAM 覆盖值并入渠道候选（老 override 可不在渠道 .model——默认 AP:AM 必须能通过
 *   parseModelRef 严格成员校验，迁移不自产无效 defaultModel）
 * - 无 .model 的渠道 → models 留空 []（→ D-S1 弹选择——不静默破——评审 #7）
 * - 老 activeProvider 指向不存在的渠道 → 跳过 AP:AM 复合（AM 无法归属）→ 走折中 C 第三级
 *   「首渠道首候选」兜底——迁移产物必可用（不留下每启必弹的破损态）
 */
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
      // 混合形态（.model 与已非空 models 并存）：默认必须 ∈ 候选——models 在场优先于
      // 遗留 .model（后者只在渠道无候选时生效——防迁移自产无效 defaultModel 每启弹）
      const m = rawAM || (models.length > 0 ? models[0] : (provModel.get(rawAP) ?? ""))
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
