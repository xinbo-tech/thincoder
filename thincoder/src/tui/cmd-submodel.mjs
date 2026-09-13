import { ansi, C } from "./ansi.mjs"

/** Subagent role slots — each has an independent model override slot */
export const SUBMODEL_SLOTS = ["explore", "plan", "coder", "eng-coder", "eng-designer"]

/** Human-readable effective display with inheritance source. role=null → global slot.
 *  source semantics: "type" = role-specific override (subagentModels[role]),
 *  "global" = falls back to subagentModel, "parent" = no override, inherits the
 *  parent agent's provider. */
function slotDisplay(agent, role) {
  const cfg = agent.config?.agent ?? {}
  if (role === null) {
    return cfg.subagentModel ? { value: cfg.subagentModel, source: "global" } : { value: null, source: "parent" }
  }
  const type = cfg.subagentModels?.[role]
  const global = cfg.subagentModel
  if (type) return { value: type, source: "type" }
  if (global) return { value: global, source: "global" }
  return { value: null, source: "parent" }
}

/** /submodel command: subagent model config — picker menu (default) or direct args.
 *  ctx: { agent, pushLine, showPicker, askQuestion, persistRaw, pickModelForSlot }
 *  /submodel                        → picker: global + 5 role slots
 *  /submodel <value>                → set global default
 *  /submodel <type> <value>         → set a role slot
 *  /submodel <type>                 → show a slot
 *  /submodel reset [type]           → clear global (or a slot)
 *  value forms: provider:model | provider name | model name (same as subagent tool model arg) —
 *  MODEL-MERGE-SESSION：会话模型 = provider:model 复合（agent.activeProvider/activeModel 双字段
 *  恒非空——无渠道默认字段——父会话模型引用一律复合值）。 */
export async function handleSubmodelCommand(ctx, args = []) {
  const { agent, pushLine, showPicker, askQuestion, persistRaw, pickModelForSlot } = ctx
  const input = args.join(" ").trim()

  // Single write channel: mutate BOTH in-memory agent.config.agent and the disk raw
  // with the same function (no divergent double-writes). Agent config is created
  // lazily here — an Esc-cancelled picker never writes anything.
  const persist = async (mutate) => {
    agent.config.agent ??= {}
    const a = agent.config.agent
    mutate(a)
    await persistRaw((raw) => {
      raw.agent ??= {}
      mutate(raw.agent)
    }).catch((e) => pushLine(`[error] ${e.message}`, C.error))
  }

  // ── Direct args ──
  if (input) {
    const parts = input.split(/\s+/)
    const first = parts[0].toLowerCase()
    if (first === "reset") {
      const type = parts[1]?.toLowerCase()
      if (type) {
        if (!SUBMODEL_SLOTS.includes(type)) {
          pushLine(`Unknown subagent type: ${type} (available: ${SUBMODEL_SLOTS.join(", ")})`, C.error)
          return
        }
        await persist((a) => { a.subagentModels ??= {}; delete a.subagentModels[type]; if (Object.keys(a.subagentModels).length === 0) delete a.subagentModels })
        pushLine(`Subagent type ${type}: reset to inherit (${slotDisplay(agent, type).source === "global" ? `global: ${slotDisplay(agent, type).value}` : "parent provider"}).`, C.text)
      } else {
        await persist((a) => { a.subagentModel = null })
        pushLine("Subagent global model: reset to inherit parent provider.", C.text)
      }
      return
    }
    if (SUBMODEL_SLOTS.includes(first)) {
      const value = parts.slice(1).join(" ")
      if (!value) {
        const d = slotDisplay(agent, first)
        pushLine(`Subagent ${first}: ${d.value ? `\`${d.value}\` (${d.source} config)` : "(inherit: parent provider)"}`, C.text)
        return
      }
      await persist((a) => { a.subagentModels ??= {}; a.subagentModels[first] = value })
      pushLine(`Subagent ${first} model set to \`${value}\`.`, C.text)
      return
    }
    if (parts.length >= 2) {
      // Two+ tokens and the first is not a known slot → user probably meant a type
      pushLine(`Unknown subagent type: ${first} (available: ${SUBMODEL_SLOTS.join(", ")})`, C.error)
      return
    }
    // Global value (provider:model | provider | model)
    await persist((a) => { a.subagentModel = input })
    pushLine(`Subagent global model set to \`${input}\`.`, C.text)
    return
  }

  // ── Picker menu: global + 5 role slots ──
  // for(;;) loop relies on showPicker's async/Promise suspension — every iteration
  // awaits a user choice; Esc (null) exits. Mirrors openModelPicker's menu-loop pattern.
  for (;;) {
    const g = slotDisplay(agent, null)
    const entries = [
      { type: "header", text: "Subagent models — pick a slot to edit (Esc exits)" },
      { type: "item", text: `${g.value ? `Global default: ${g.value}` : "Global default: (inherit parent)"}`, action: "slot", slot: "global", marker: g.value ? "●" : "○" },
      ...SUBMODEL_SLOTS.map((role) => {
        const d = slotDisplay(agent, role)
        const label = d.value ? `${role}: ${d.value}${d.source === "global" ? " (←global)" : ""}` : `${role}: (inherit: ${d.source === "global" ? "global" : "parent"})`
        return { type: "item", text: label, action: "slot", slot: role, marker: d.source === "type" ? "●" : "○" }
      }),
      { type: "header", text: "Actions" },
      { type: "item", text: "Reset all (inherit parent)", action: "resetall" },
    ]
    const picked = await showPicker("Subagent Models", entries)
    if (!picked) return // Esc

    if (picked.action === "resetall") {
      await persist((a) => { a.subagentModel = null; delete a.subagentModels })
      pushLine("All subagent model overrides cleared — inherit parent provider.", C.text)
      continue
    }

    const role = picked.slot === "global" ? null : picked.slot
    const cur = slotDisplay(agent, role)
    const sub = await showPicker(`Subagent ${picked.slot}`, [
      { type: "header", text: `Current: ${cur.value ? `\`${cur.value}\` (${cur.source})` : "(inherit)"}` },
      { type: "item", text: "Set model… (provider → model picker)", action: "set" },
      { type: "item", text: "Set to parent provider model", action: "parent" },
      { type: "item", text: "Reset (inherit)", action: "reset" },
    ])
    if (!sub) continue // Esc → back to slots

    if (sub.action === "set") {
      const sel = await pickModelForSlot()
      if (!sel) continue
      const value = `${sel.provider}:${sel.model}`
      if (role) {
        await persist((a) => { a.subagentModels ??= {}; a.subagentModels[role] = value })
        pushLine(`Subagent ${role} model set to \`${value}\`.`, C.text)
      } else {
        await persist((a) => { a.subagentModel = value })
        pushLine(`Subagent global model set to \`${value}\`.`, C.text)
      }
    } else if (sub.action === "parent") {
      // 会话复合值语义（MODEL-MERGE-SESSION——activeModel 恒非空——不再回退渠道字段）
      const value = `${agent.activeProvider}:${agent.activeModel ?? ""}`
      if (role) {
        await persist((a) => { a.subagentModels ??= {}; a.subagentModels[role] = value })
      } else {
        await persist((a) => { a.subagentModel = value })
      }
      pushLine(`Subagent ${picked.slot} set to parent model \`${value}\`.`, C.text)
    } else if (sub.action === "reset") {
      if (role) {
        await persist((a) => { a.subagentModels ??= {}; delete a.subagentModels[role]; if (Object.keys(a.subagentModels).length === 0) delete a.subagentModels })
      } else {
        await persist((a) => { a.subagentModel = null })
      }
      pushLine(`Subagent ${picked.slot} reset to inherit.`, C.text)
    }
  }
}
