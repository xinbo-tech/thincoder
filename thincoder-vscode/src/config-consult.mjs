/**
 * config-consult.mjs — agent.consultModels 软失败 + 级联清理（VS Code 侧）。
 * Split out of config-io.mjs (2026-09-09 — BATCH-3-STRUCTURE F-1 预拆：config-io 距 500
 * 硬限 1 行——consult 块迁此——same hub pattern as config-presets/config-migrate/
 * config-mcp.mjs splits; re-exported from config-io.mjs so existing `from "../config-io.mjs"`
 * import sites keep working——API 面零改). F-4 (IKCDMR): consultModels 软失败清洗（读面
 * 过滤 + 一次性警告——不崩）+ removeProvider 级联清理（consultModels/subagentModels/
 * advisor.provider——下次读盘无悬挂）。镜像 CLI config.mjs 同规则（AC-5 双端锁步）。
 * Pure Node — no `vscode` import — unit tests can run outside the extension host.
 */
import { loadRaw, _configPath } from "./config-io.mjs"

// ─── F-4 (IKCDMR) consultModels 软失败 + 级联清理（共享 config——CLI 同规则——AC-5 双端锁步）───
/** 软失败清洗（纯）：非数组 → []；形状非法/未知渠道丢弃；超 5 截断。返回 { keep, dropped }。 */
export function sanitizeConsultModels(cm, providerNames) {
  if (cm === undefined || cm === null) return { keep: [], dropped: [] }
  if (!Array.isArray(cm)) {
    return { keep: [], dropped: [`agent.consultModels must be an array of { provider, model } entries (got ${typeof cm})`] }
  }
  const names = providerNames instanceof Set ? providerNames : new Set(providerNames ?? [])
  const keep = []
  const dropped = []
  for (const entry of cm) {
    if (keep.length >= 5) { dropped.push(`over the 5-entry cap — dropped ${JSON.stringify(entry)}`); continue }
    if (!entry || typeof entry !== "object" || typeof entry.provider !== "string" || !entry.provider.trim()
        || typeof entry.model !== "string" || !entry.model.trim()) {
      dropped.push(`invalid entry (expected { provider: string, model: string }) — got ${JSON.stringify(entry)}`)
      continue
    }
    if (!names.has(entry.provider)) {
      dropped.push(`entry "${entry.provider}:${entry.model}" references unknown provider "${entry.provider}" (available: ${[...names].join(", ") || "none"})`)
      continue
    }
    keep.push(entry)
  }
  return { keep, dropped }
}

/** 一次性过滤警告——进程级（VSC 读点高频调用——模块标志去重）。 */
let warnedConsultModels = false
export function warnConsultModelsFiltered(dropped, path = _configPath()) {
  if (warnedConsultModels || dropped.length === 0) return
  warnedConsultModels = true
  console.warn(`[config] agent.consultModels: ${dropped.length} invalid entr${dropped.length === 1 ? "y ignored" : "ies ignored"} (filtered — no crash):\n` +
    dropped.map((d) => `  - ${d}`).join("\n") +
    `\n  Fix: clean agent.consultModels in ${path} (VS Code: Settings → consult pool; CLI: /config).`)
}

/** 运行时读面（setup.mjs withPool/工具注册/hydrate cfgConsultModels 共用）：单读盘 + 清洗 + 警告。 */
export function loadConsultPool() {
  const raw = loadRaw()
  const names = (Array.isArray(raw?.providers) ? raw.providers : []).map((p) => p?.name).filter(Boolean)
  const { keep, dropped } = sanitizeConsultModels(raw?.agent?.consultModels ?? [], names)
  warnConsultModelsFiltered(dropped)
  return keep
}

/** 级联清理（provider-flows removeProviderEntry 调用的共享写点）：raw 移除 name 渠道后清悬挂——
 *  consultModels 条目 / subagentModels 角色值（=== name 或 "name:…"）/ advisor.provider。纯 mutate。 */
export function cascadeRemoveProvider(raw, name) {
  const a = raw?.agent
  if (!a || typeof a !== "object" || Array.isArray(a)) return
  if (Array.isArray(a.consultModels)) {
    const keep = a.consultModels.filter((m) => m?.provider !== name)
    if (keep.length) a.consultModels = keep
    else delete a.consultModels
  }
  if (a.subagentModels && typeof a.subagentModels === "object" && !Array.isArray(a.subagentModels)) {
    for (const role of Object.keys(a.subagentModels)) {
      const v = a.subagentModels[role]
      if (typeof v === "string" && (v === name || v.startsWith(`${name}:`))) delete a.subagentModels[role]
    }
    if (!Object.keys(a.subagentModels).length) delete a.subagentModels
  }
  if (a.advisor && typeof a.advisor === "object" && !Array.isArray(a.advisor) && a.advisor.provider === name) {
    delete a.advisor.provider
  }
}
