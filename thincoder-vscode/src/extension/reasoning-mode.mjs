/**
 * reasoning-mode.mjs — resolve the panel's reasoning selector into provider fields.
 *
 * Pure function (testable outside the extension host). The UI dropdown's levels come
 * from the model spec's reasoningEffortEnum; the "none" entry (button label "off")
 * is the LOWEST effort level, not a mode switch — while a spec with thinkApi "type"
 * treats "off"/"none" as a true thinking toggle. Both semantics must map correctly:
 *
 *   UI value          → provider patch
 *   "enabled"         → thinking:{type:<thinkEnabledValue>}, effort cleared (thinkApi "type")
 *   "off" / "none"    → thinking:<族别 off 形> + reasoningEffort:null (true off)
 *   any effort level  → reasoningEffort:<level> + thinking:undefined (clears a prior off-marker on merge)
 *
 * 族别 off 形的取形 = **单源** `@thincoder/core/think-off.mjs` 的 `thinkOffShape`（MODEL-SPECS.md §16.2-3 / §15.4-2）：
 * effort 族 ⇒ `null`（载荷层 off 门首款要求）；type 族（含自定义开值族）⇒ `{type:"disabled"}`。
 * 旧式全族一形 `null` 使 type 族 off 不发字段 = 未达载荷层（台账 #335 本体）。
 *
 * Note: some endpoints (Zhipu coding plan) force thinking server-side and ignore
 * thinking:"disabled" entirely — that is a provider behavior, not something the
 * client can control; the wiring here at least makes the request honest.
 */
import { thinkOffShape } from "@thincoder/core/think-off.mjs"

/** Resolve the provider patch for a reasoning selection. Returns an object to merge. */
export function resolveReasoningMode(reasoning, model, specForModelFn) {
  const spec = specForModelFn(model) || {}
  if (reasoning === "off" || reasoning === "none") {
    return { thinking: thinkOffShape(spec), reasoningEffort: null }
  }
  if (reasoning === "enabled") {
    const thinkVal = spec.thinkEnabledValue || "enabled"
    return { thinking: { type: thinkVal }, ...(spec.thinkApi === "effort" ? { reasoningEffort: null } : {}) }
  }
  // Effort tier = thinking wanted: explicitly clear a prior thinking:null off-marker (merge
  // overwrites the key with undefined), else enable_thinking:false would ride alongside
  // reasoning_effort — a contradictory payload (PROVIDER.md §12 F2, delivery review #1).
  if (reasoning) return { reasoningEffort: reasoning, thinking: undefined }
  return {}
}
