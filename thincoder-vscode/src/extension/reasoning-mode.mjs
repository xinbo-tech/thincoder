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
 *   "off" / "none"    → thinking:null + reasoningEffort:null (true off)
 *   any effort level  → reasoningEffort:<level> + thinking:undefined (clears a prior off-marker on merge)
 *
 * Note: some endpoints (Zhipu coding plan) force thinking server-side and ignore
 * thinking:"disabled" entirely — that is a provider behavior, not something the
 * client can control; the wiring here at least makes the request honest.
 */

/** Resolve the provider patch for a reasoning selection. Returns an object to merge. */
export function resolveReasoningMode(reasoning, model, specForModelFn) {
  const spec = specForModelFn(model) || {}
  if (reasoning === "off" || reasoning === "none") {
    return { thinking: null, reasoningEffort: null }
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
