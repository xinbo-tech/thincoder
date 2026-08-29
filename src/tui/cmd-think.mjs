/** /think command: toggle thinking mode, set reasoning effort.
 *  Interactive loop UX — stays in menu after each action, Esc to exit.
 *  ctx: { agent, showPicker, syncProviderField, pushLine, pushLabel } */
import { ansi, C } from "./ansi.mjs"

export async function handleThinkCommand(ctx, args = []) {
  const { agent, showPicker, syncProviderField, pushLine, pushLabel } = ctx
  const { specForModel } = await import("../config.mjs")

  // Fast path: direct args — exit immediately
  const cur = agent.provider
  const spec = specForModel(cur.model)
  const isEffortOnly = spec.thinkApi === "effort"
  const thinkOnValue = spec.thinkEnabledValue ?? "enabled"
  const isCustomThink = thinkOnValue !== "enabled"
  const effortLevels = spec.reasoningEffortEnum ?? ["high", "max"]

  const autoThinkEnabled = agent.config?.agent?.autoThink === true
  const sub = args[0]?.toLowerCase()
  if (sub === "on" || sub === "off") {
    if (autoThinkEnabled) { pushLine("Auto-think is ON — manual settings are overridden each turn; turn Auto off first via /think", C.error); return }
    await applyThink({ action: sub }, agent, syncProviderField, spec, isEffortOnly, isCustomThink, thinkOnValue)
    pushLabel("❯ Think", ansi.bold + C.tool)
    pushLine(`Thinking: ${sub}`, C.tool)
    return
  }
  if (sub === "effort") {
    const level = args[1]?.toLowerCase()
    if (!level || !effortLevels.includes(level)) {
      pushLine(`Usage: /think effort <${effortLevels.join("|")}>`, C.error)
      return
    }
    if (autoThinkEnabled) { pushLine("Auto-think is ON — manual settings are overridden each turn; turn Auto off first via /think", C.error); return }
    await applyThink({ action: "effort", level }, agent, syncProviderField, spec, isEffortOnly, isCustomThink, thinkOnValue)
    pushLabel("❯ Think", ansi.bold + C.tool)
    pushLine(`Thinking effort: ${level}`, C.tool)
    return
  }
  if (sub) { pushLine("Usage: /think [on|off|effort <level>]", C.error); return }

  // ── Interactive loop ──
  let mainIdx = 0
  for (;;) {
    const autoOn = agent.config?.agent?.autoThink === true
    // thinking:null 是显式 off 标记（NF1 约定）——不得落入"未设置即 ON"的默认显示（评审 #3）。
    // 用 !== null 而非 != null：undefined（从未设置）须保持既有 ON 显示（qwen3.x 服务端默认开思考）。
    const thinkingEnabled = cur.thinking?.type === thinkOnValue
      || (cur.thinking !== null && cur.thinking?.type === undefined && !isCustomThink)

    const entries = [
      { type: "header", text: `Auto: ${autoOn ? "ON" : "OFF"} | Thinking: ${thinkingEnabled ? "ON" : "OFF"} | Effort: ${cur.reasoningEffort || "—"}` },
      { type: "item", text: `Auto: ${autoOn ? "ON" : "OFF"}`, action: "auto" },
    ]
    if (!isEffortOnly && !autoOn) {
      entries.push({ type: "item", text: `Thinking: ${thinkingEnabled ? "ON" : "OFF"}`, action: thinkingEnabled ? "off" : "on" })
    }
    if (!autoOn) {
      for (const level of effortLevels) {
        const mark = cur.reasoningEffort === level ? "▸ " : "  "
        entries.push({ type: "item", text: `${mark}effort: ${level}`, action: "effort", level })
      }
    }

    const e = await showPicker("Think", entries, { defaultIndex: mainIdx })
    if (!e) return // Esc
    mainIdx = Math.max(0, entries.filter((en) => en.type === "item").indexOf(e))

    const prevAuto = autoOn
    const prevThinking = thinkingEnabled
    const prevEffort = cur.reasoningEffort

    await applyThink(e, agent, syncProviderField, spec, isEffortOnly, isCustomThink, thinkOnValue)

    // Feedback
    pushLabel("❯ Think", ansi.bold + C.tool)
    if (e.action === "auto") {
      const newAuto = agent.config?.agent?.autoThink === true
      pushLine(`Auto-think: ${newAuto ? "ON" : "OFF"}`, C.tool)
      return // exit loop — no useful actions remain when auto mode just changed
    } else if (e.action === "effort") {
      pushLine(`Reasoning effort: ${e.level}`, C.tool)
    } else {
      const nowEnabled = cur.thinking?.type === thinkOnValue
        || (cur.thinking?.type === undefined && !isCustomThink)
      pushLine(`Thinking: ${nowEnabled ? "ON" : "OFF"}`, C.tool)
    }
  }
}

/** Shared apply logic — extracted from handleThinkCommand for reuse in both fast path and loop */
async function applyThink(e, agent, syncProviderField, spec, isEffortOnly, isCustomThink, thinkOnValue) {
  const cur = agent.provider
  if (e.action === "auto") {
    const cfg = agent.config.agent ??= {}
    cfg.autoThink = !cfg.autoThink
    if (cfg.autoThink) {
      // 开 auto = 要思考：清显式 off 标记（thinking:null，NF1 约定；交付评审 #1）——残留 null
      // 会让 auto 每轮写入的 reasoning_effort 与 enable_thinking:false 矛盾同发（F2 违约）。
      // 仅清 null：thinking-type 模型的 {type:"disabled"} 不在评审 #1 范围，保持既有语义。
      if (cur.thinking === null) { delete cur.thinking; await syncProviderField("thinking", undefined) }
      delete cur.reasoningEffort
      await syncProviderField("reasoningEffort", undefined)
    }
  } else if (e.action === "effort") {
    // 选档位 = 要思考：清显式 off 标记（thinking:null，NF1 约定；交付评审 #1）——残留 null 会让
    // enable_thinking:false 与 reasoning_effort 矛盾同发（F2 违约）。仅清 null（同上注释）。
    if (cur.thinking === null) { delete cur.thinking; await syncProviderField("thinking", undefined) }
    cur.reasoningEffort = e.level
    await syncProviderField("reasoningEffort", e.level)
  } else {
    const enable = e.action === "on"
    if (isEffortOnly) {
      // Explicit off persists thinking:null (NF1 convention — distinguishable from autoThink's
      // delete/undefined); "on" deletes the marker so enable_thinking maps from effort again.
      if (!enable) { cur.thinking = null; delete cur.reasoningEffort }
      // "on" 默认 effort 取 spec 枚举首值（交付评审 #2）：硬编码 "high" 对 qwen3.8-max
      // （enum xhigh/medium/low）无效，会被 core.mjs 枚举校验 throw（400 前置）
      else { delete cur.thinking; if (!cur.reasoningEffort) cur.reasoningEffort = spec.reasoningEffortEnum?.[0] ?? "high" }
      await syncProviderField("thinking", cur.thinking)
      if (!enable) await syncProviderField("reasoningEffort", undefined)
      else await syncProviderField("reasoningEffort", cur.reasoningEffort)
    } else {
      if (enable) {
        cur.thinking = { type: thinkOnValue }
        if (!cur.reasoningEffort) cur.reasoningEffort = "high"
      } else {
        cur.thinking = isCustomThink ? undefined : { type: "disabled" }
        delete cur.reasoningEffort
      }
      await syncProviderField("thinking", cur.thinking)
      if (enable) {
        await syncProviderField("reasoningEffort", cur.reasoningEffort)
      } else {
        await syncProviderField("reasoningEffort", undefined)
      }
    }
  }
}
