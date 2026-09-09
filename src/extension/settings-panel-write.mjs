/**
 * settings-panel-write.mjs — ChatPanel 面板写面（MODEL-MERGE-SESSION 拆分产物：自
 * config-io.mjs 迁出——config-io 需容纳 schema 镜像/迁移/解析增长——拆分先行）。
 * 纯 Node——无 vscode import——单测可在 extension host 外运行。
 * 面板写面 = saveAgentSettingsFromPanel（agent.* + defaultModel 顶层单写通道）+ 
 * saveShellSettingsFromPanel——config-io.mjs hub re-export（import 面不变——
 * settings.mjs/tests 照旧）。
 */
import { persistRaw, conflictError, loadAgentSettings } from "../config-io.mjs"

/** 单写通道：agent.* 键合并语义 = config-io saveAgentSettings（delete on
 *  undefined/null/""/空对象）——同文件内联执行（defaultModel 顶层 + agent 一次落盘——
 *  防两次写间 mtime 窗）。 */
function applyAgentPatch(raw, patch) {
  raw.agent = raw.agent && typeof raw.agent === "object" ? raw.agent : {}
  for (const [k, v] of Object.entries(patch ?? {})) {
    if (v === undefined || v === null || v === "") delete raw.agent[k]
    else if (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0) delete raw.agent[k]
    else raw.agent[k] = v
  }
}

/** Panel persistence: build the agent.* patch from a webview payload (CLI-parity field names).
 *  MODEL-MERGE-SESSION：payload.defaultModel = 顶层 config 键（"provider:model" 复合——
 *  空串/非串删除——新会话起点专用入口）。其余语义 verbatim（单写通道——所有字段经一次
 *  persistRaw——冲突提示同 saveAgentSettings）。 */
export function saveAgentSettingsFromPanel(payload) {
  const patch = {}
  if (payload.maxTurns != null) patch.maxTurns = Number(payload.maxTurns) || undefined
  if (payload.subagentTurns != null) patch.subagentTurns = Number(payload.subagentTurns) || undefined
  // "in payload" guards let explicit undefined (cleared field) flow through as deletion
  if ("subagentModel" in payload) patch.subagentModel = payload.subagentModel || undefined
  if ("subagentModels" in payload) {
    // Per-type overrides: only non-empty values kept; empty object deletes the whole key
    const m = {}
    for (const [role, v] of Object.entries(payload.subagentModels ?? {})) {
      if (v && typeof v === "string" && v.trim()) m[role] = v.trim()
    }
    patch.subagentModels = Object.keys(m).length > 0 ? m : undefined
  }
  if (payload.compactThreshold !== undefined) patch.compactThreshold = payload.compactThreshold === "" ? undefined : (Number(payload.compactThreshold) || undefined)
  if (payload.verifyGuard !== undefined) patch.verifyGuard = !!payload.verifyGuard
  if (payload.engineering !== undefined) patch.engineering = !!payload.engineering
  if (payload.consultTurns != null) patch.consultTurns = Number(payload.consultTurns) || undefined
  if (payload.consultTimeoutMs != null) patch.consultTimeoutMs = Number(payload.consultTimeoutMs) || undefined
  // Consultation models (CONSULTATION.md): array of {provider, model}, ≤5, validated.
  if (payload.consultModels !== undefined) {
    const arr = Array.isArray(payload.consultModels) ? payload.consultModels : []
    const clean = arr
      .filter((m) => m && typeof m.provider === "string" && m.provider.trim() && typeof m.model === "string" && m.model.trim())
      .slice(0, 5)
      .map((m) => ({
        provider: m.provider.trim(),
        model: m.model.trim(),
        ...(typeof m.effort === "string" && m.effort.trim() ? { effort: m.effort.trim() } : { effort: null }),
      }))
    patch.consultModels = clean.length > 0 ? clean : undefined
  }
  // §11.1/§11.2（R14/R13——POOL-CONFIG-UNIFIED 2026-09-09）：并发池三域容量（面板写
  // 同一键）。逐键正整数 ≥1；非法键丢弃（空对象/全非法 → 删整键——运行期回退默认
  // 4/4/4 + 文案）。
  if ("poolLimits" in payload) {
    const pl = {}
    for (const key of ["engCoder", "other", "advisor"]) {
      const v = payload.poolLimits?.[key]
      if (Number.isInteger(v) && v >= 1) pl[key] = v
    }
    patch.poolLimits = Object.keys(pl).length > 0 ? pl : undefined
  }
  if (payload.advisor !== undefined) {
    // Merge semantics (GitHub #3, 2026-08-29): the panel payload only carries the fields
    // the panel owns. A MISSING key backfills from config.json — the CLI may have written
    // advisor.provider/model/thinking/reasoningEffort that must survive a panel save
    // (the old "in"-guard merge treated a missing key as "don't merge", so
    // saveAgentSettings replaced the whole object and silently wiped them). An explicit
    // null / '' / undefined in the payload is a CLEARED field and deletes the key
    // (the webview sends null because postMessage JSON serialization drops undefined
    // keys — "slot missing" and "explicitly cleared" must stay distinguishable on the wire).
    // advisor.enabled is deprecated (2026-08-21) — never written; guard defaults OFF.
    const adv = payload.advisor ?? {}
    const current = loadAgentSettings().advisor ?? {}
    // Seed from disk: every scalar/plain-object advisor key survives the merge.
    // Arrays (and functions, which JSON files can't have) are never written by either
    // side — don't resurrect them.
    const merged = {}
    for (const [k, v] of Object.entries(current)) {
      if (v === null || Array.isArray(v)) continue
      merged[k] = v
    }
    // Payload wins where it speaks (guard / timeoutMs / effort / provider / model).
    merged.guard = adv.guard !== undefined ? !!adv.guard : (merged.guard ?? false)
    // timeoutMs passthrough (AGENT-PARAMS-TUNING, P4): the panel has no timeoutMs
    // input — an explicit valid payload value wins, otherwise the hand-written
    // config.json value survives a panel save (never silently dropped, never stored invalid).
    if (typeof adv.timeoutMs === "number" && adv.timeoutMs > 0) merged.timeoutMs = adv.timeoutMs
    if (!Number.isFinite(merged.timeoutMs) || merged.timeoutMs <= 0) delete merged.timeoutMs
    if ("effort" in adv) {
      if (typeof adv.effort === "string" && adv.effort.trim()) merged.effort = adv.effort.trim()
      else delete merged.effort
    }
    for (const key of ["provider", "model"]) {
      if (key in adv) {
        if (typeof adv[key] === "string" && adv[key].trim()) merged[key] = adv[key].trim()
        else delete merged[key] // explicit null / '' / undefined = CLEARED slot
      }
    }
    delete merged.enabled // deprecated 2026-08-21 — never resurrect a stale key
    patch.advisor = merged
  }
  const r = persistRaw((raw) => {
    // defaultModel = 顶层键（F-5 VSC 面板入口——provider:model 复合）
    if ("defaultModel" in payload) {
      const v = payload.defaultModel
      if (typeof v === "string" && v.trim()) raw.defaultModel = v.trim()
      else delete raw.defaultModel
    }
    applyAgentPatch(raw, patch)
  })
  return conflictError(r)
}

/** Persist shell setting from the panel. value: string path/command, '' or null = system default.
 *  F5b 冲突提示同 saveAgentSettings。 */
export function saveShellSettingsFromPanel(value) {
  const v = typeof value === "string" ? value.trim() : ""
  const r = persistRaw((raw) => {
    if (!v) delete raw.shell
    else raw.shell = v
  })
  return conflictError(r)
}
