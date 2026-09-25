/** /think command: toggle thinking mode, set reasoning effort.
 *  Interactive loop UX — stays in menu after each action, Esc to exit.
 *  ctx: { agent, showPicker, syncProviderField, pushLine, pushLabel } */
import { ansi, C } from "./ansi.mjs"
// off 形族单源（`docs/core/design/MODEL-SPECS.md` §16.2 / §16.4）——取形与「有效 off 路径」判据
// 一律自本档取，本档零副本（叶档：零 import 纯函数）。
import { thinkOffShape, thinkOffPath } from "@thincoder/core/think-off.mjs"

export async function handleThinkCommand(ctx, args = []) {
  const { agent, showPicker, syncProviderField, pushLine, pushLabel } = ctx
  const { specForModel } = await import("@thincoder/core/config.mjs")

  // Fast path: direct args — exit immediately
  const cur = agent.provider
  const spec = specForModel(cur.model)
  const isEffortOnly = spec.thinkApi === "effort"
  const thinkOnValue = spec.thinkEnabledValue ?? "enabled"
  const isCustomThink = thinkOnValue !== "enabled"
  const effortLevels = spec.reasoningEffortEnum ?? ["high", "max"]
  // 有效 off 路径（判据单源 = `@thincoder/core/think-off.mjs`；§16.4）——无 ⇒ 不提供 / 不宣称 off。
  const offPath = thinkOffPath(spec)

  /** 环内头与回执共用的状态式（§16.4）：无有效 off 路径 ⇒ 恒报 ON——残留 off 标记（`null` /
   *  `{type:"disabled"}`）不生效（服务端恒思考 / 形不发字段），「Thinking: OFF」会是假断言。
   *  `thinking:null` 是显式 off 标记（NF1 约定）——不得落入"未设置即 ON"的默认显示（评审 #3）；
   *  用 `!== null` 而非 `!= null`：undefined（从未设置）须保持既有 ON 显示（qwen3.x 服务端默认开思考）。 */
  const thinkingOn = () => !offPath || cur.thinking?.type === thinkOnValue
    || (cur.thinking !== null && cur.thinking?.type === undefined && !isCustomThink)

  const autoThinkEnabled = agent.config?.agent?.autoThink === true
  const sub = args[0]?.toLowerCase()
  if (sub === "on" || sub === "off") {
    if (autoThinkEnabled) { pushLine("Auto-think is ON — manual settings are overridden each turn; turn Auto off first via /think", C.error); return }
    // §16.4：无有效 off 路径 ⇒ 拒绝该动作（不写盘）——服务端恒思考 / 形不发字段，供一个不生效
    // 的入口 + 措辞免责 = 半实现（§16.12 项 3）。`/think on` 与档位面零改。
    if (sub === "off" && !offPath) {
      pushLine("No off path for this model — thinking cannot be turned off here (use /think effort <level>)", C.error)
      return
    }
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
    // none = 关思考档（applyThink 内归一到 off 路径）⇒ 回执同 off 文案，不比照档位报“…none”
    pushLine(level === "none" ? "Thinking: OFF" : `Thinking effort: ${level}`, C.tool)
    return
  }
  if (sub) { pushLine("Usage: /think [on|off|effort <level>]", C.error); return }

  // ── Interactive loop ──
  let mainIdx = 0
  for (;;) {
    const autoOn = agent.config?.agent?.autoThink === true
    // 头 / 回执同式（`thinkingOn` 单口径）——状态与回执不得各自成式。
    const thinkingEnabled = thinkingOn()

    const entries = [
      { type: "header", text: `Auto: ${autoOn ? "ON" : "OFF"} | Thinking: ${thinkingEnabled ? "ON" : "OFF"} | Effort: ${cur.reasoningEffort || "—"}` },
      { type: "item", text: `Auto: ${autoOn ? "ON" : "OFF"}`, action: "auto" },
    ]
    // Thinking 开关项：非 effort 族 ∧ 有有效 off 路径才渲染（§16.4——无有效 off 路径族不提供该动作，
    // 入口在位 = 对无效操作的假告知）。
    if (!isEffortOnly && offPath && !autoOn) {
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

    await applyThink(e, agent, syncProviderField, spec, isEffortOnly, isCustomThink, thinkOnValue)

    // Feedback
    pushLabel("❯ Think", ansi.bold + C.tool)
    if (e.action === "auto") {
      const newAuto = agent.config?.agent?.autoThink === true
      pushLine(`Auto-think: ${newAuto ? "ON" : "OFF"}`, C.tool)
      return // exit loop — no useful actions remain when auto mode just changed (T8b 锁定——toggle 即退是已批准语义——2026-09-05 曾误改 OFF 回菜单——测试抓回归——已撤销)
    } else if (e.action === "effort") {
      pushLine(e.level === "none" ? "Thinking: OFF" : `Reasoning effort: ${e.level}`, C.tool)
    } else {
      // 与菜单头（`thinkingOn`）同式：`thinking:null`（NF1 显式 off）落 OFF；无有效 off 路径族
      // 恒报 ON（§16.4——残留 off 标记不生效；本式缺守卫时 effort 型 off 后回执误报 ON = 红）。
      pushLine(`Thinking: ${thinkingOn() ? "ON" : "OFF"}`, C.tool)
    }
  }
}

/** Shared apply logic — extracted from handleThinkCommand for reuse in both fast path and loop.
 *  Named export (2026-09-20): the on-default-effort rule (§2.8) is unit-tested by driving this
 *  directly with a synthetic spec — behavior otherwise unchanged.
 *  Effort 档位 `"none"` = 关思考 ⇒ 入口归一到 off 路径（与菜单 off 项同形——见内注释）。
 *  `spec` 同时供 off 取形（单源 = `@thincoder/core/think-off.mjs`）；`isCustomThink` 参数为调用面
 *  既有形状保留（off 支取形已归单源，本档不再自行分族）。 */
export async function applyThink(e, agent, syncProviderField, spec, isEffortOnly, isCustomThink, thinkOnValue) {
  const cur = agent.provider
  // `effort` 档位取 `"none"` = **关思考**（非“强度零”）：与本面 off 动作同语义 ⇒ 归一到 off 路径
  // （各族取其原生 off 形：effort 型 = `thinking:null`＋删 effort；type 型 = `{type:"disabled"}`）。
  // 不归一的两处违约：① 菜单头同拍显示「Thinking: ON | Effort: none」自相矛盾（off 标记缺失）；
  // ② 残留 `reasoningEffort:"none"` 会被载荷层当强度档送（`provider/core.mjs:197-204`），与百炼
  // qwen 侧 off 判据（`config.mjs:133-139` 的 `thinking === null ⇒ false`）错位 ⇒ 服务端仍思考。
  if (e.action === "effort" && e.level === "none") e = { action: "off" }
  if (e.action === "auto") {
    const cfg = agent.config.agent ??= {}
    cfg.autoThink = !cfg.autoThink
    if (cfg.autoThink) {
      // 开 auto = 要思考：清显式 off 标记（thinking:null，NF1 约定；交付评审 #1）——残留 null
      // 会让 auto 每轮写入的 reasoning_effort 与 enable_thinking:false 矛盾同发（F2 违约）。
      // 仅清 null：thinking-type 模型的 {type:"disabled"} 不在评审 #1 范围，保持既有语义。
      if (cur.thinking === null) { delete cur.thinking; await syncProviderField(agent.activeProvider, "thinking", undefined) }
      delete cur.reasoningEffort
      await syncProviderField(agent.activeProvider, "reasoningEffort", undefined)
    }
  } else if (e.action === "effort") {
    // 选档位 = 要思考：清显式 off 标记（thinking:null，NF1 约定；交付评审 #1）——残留 null 会让
    // enable_thinking:false 与 reasoning_effort 矛盾同发（F2 违约）。仅清 null（同上注释）。
    if (cur.thinking === null) { delete cur.thinking; await syncProviderField(agent.activeProvider, "thinking", undefined) }
    cur.reasoningEffort = e.level
    await syncProviderField(agent.activeProvider, "reasoningEffort", e.level)
  } else {
    const enable = e.action === "on"
    if (isEffortOnly) {
      // Explicit off persists thinking:null (NF1 convention — distinguishable from autoThink's
      // delete/undefined); "on" deletes the marker so enable_thinking maps from effort again.
      // off 取形同走单源（`thinkOffShape`——effort 族 ⇒ `null`；本支与下方非 effort 支同源零副本）。
      if (!enable) { cur.thinking = thinkOffShape(spec); delete cur.reasoningEffort }
      // "on" 默认 effort 取 spec 枚举的**首个非 "none"** 档（批次档 §1.8-② / 设计 §2.8 D-9）：硬编码 "high"
      // 对 qwen3.8-max（enum xhigh/medium/low）无效，会被 core.mjs 枚举校验 throw（400 前置）；而直接取枚举
      // 首项在新档（首项 "none"）等于把思考关掉 ⇒ 跳过 "none"；枚举全 "none" 时与无枚举同型 ⇒ 回退 "high"
      else { delete cur.thinking; if (!cur.reasoningEffort) cur.reasoningEffort = spec.reasoningEffortEnum?.find((v) => v !== "none") ?? "high" }
      await syncProviderField(agent.activeProvider, "thinking", cur.thinking)
      if (!enable) await syncProviderField(agent.activeProvider, "reasoningEffort", undefined)
      else await syncProviderField(agent.activeProvider, "reasoningEffort", cur.reasoningEffort)
    } else {
      if (enable) {
        cur.thinking = { type: thinkOnValue }
        if (!cur.reasoningEffort) cur.reasoningEffort = "high"
      } else {
        // off 取形 = 单源 `thinkOffShape`（§15.4-2 / §16.2 生产者表第 2 行）：非 effort 族 ⇒
        // `{type:"disabled"}`——自定义开值族随 §15.4-2 表改判由 `undefined`（不发字段 = 服务端
        // 默认 = 想）改本形（达载荷层 = 真 off）。
        cur.thinking = thinkOffShape(spec)
        delete cur.reasoningEffort
      }
      await syncProviderField(agent.activeProvider, "thinking", cur.thinking)
      if (enable) {
        await syncProviderField(agent.activeProvider, "reasoningEffort", cur.reasoningEffort)
      } else {
        await syncProviderField(agent.activeProvider, "reasoningEffort", undefined)
      }
    }
  }
}
