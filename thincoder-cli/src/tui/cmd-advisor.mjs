/** /advisor command: configure review model/thinking and toggle the review guard.
 *  Interactive loop UX — stays in menu after each action, Esc to exit.
 *  ctx: { agent, showPicker, pushLine, pushLabel, persistRaw } */
import { readFileSync } from "node:fs"
import { ansi, C } from "./ansi.mjs"
import { activeSlot, slotPath } from "@thincoder/core/session.mjs"
// off 形族单源（`docs/core/design/MODEL-SPECS.md` §16.2 / §16.3 / §16.4）——取形与「有效 off 路径」
// 判据一律自本档取，本档零副本（叶档：零 import 纯函数）。
import { thinkOffShape, thinkOffPath } from "@thincoder/core/think-off.mjs"
import { writeSessionFile } from "./cmd-eng.mjs"

export async function handleAdvisorCommand(ctx) {
  const { agent, showPicker, pushLine, pushLabel } = ctx
  const cfg = agent.config.advisor ??= {}
  // 入口预载规格面（懒加载面零改：不做顶层静态 import）——同步的状态行（`advisorStatus`）亦须取 spec。
  const { specForModel } = await import("@thincoder/core/config.mjs")
  // Deprecated field cleanup (2026-08-21): advisor.enabled is no longer read
  // anywhere; drop it here so persist() never re-writes the stale flag.
  delete cfg.enabled

  const persist = async () => {
    if (ctx.persistRaw) {
      await ctx.persistRaw((raw) => {
        raw.agent ??= {}
        raw.agent.advisor = cfg
      })
    }
  }

  // Guard-only dual write (2026-08-29 — advisor.guard is session-level): the guard goes into
  // the CURRENT session slot first (shared with VS Code), the config.json mirror follows.
  // Other advisor keys (model/thinking/effort/timeout) stay config-scoped — persist() only.
  const persistGuard = async () => {
    try {
      const p = slotPath(agent.cwd, agent._slot ?? activeSlot(agent.cwd))
      const data = JSON.parse(readFileSync(p, "utf8"))
      if (data && typeof data === "object" && Array.isArray(data.history)) {
        data.advisor = { ...(typeof data.advisor === "object" && data.advisor !== null ? data.advisor : {}), guard: cfg.guard === true }
        writeSessionFile(p, data)
      }
    } catch { /* slot missing/unreadable — config mirror still written */ }
    await persist()
  }

  // Lazy model cache — fetched once per /advisor session
  let modelCache = null

  // ── State helpers ──
  /** 状态行（§16.4）：无有效 off 路径（`thinkOffPath === false`）⇒ **不报 off**——残留 off 标记
   *  （`null` / `{type:"disabled"}`）按「未设档」渲染：有档报 `on (<档>)`，无档报 `on`
   *  （服务端恒思考 / 形不发字段 ⇒ 「Think: off」会是假断言）。 */
  function advisorStatus() {
    const curModel = cfg.model || agent.provider.model
    const offPath = thinkOffPath(specForModel(getEffectiveModel(agent, cfg)))
    const offMarked = cfg.thinking === null || cfg.thinking?.type === "disabled"
    const thinkInfo = offPath && offMarked ? "off"
      : cfg.reasoningEffort ? `on (${cfg.reasoningEffort})`
      : offMarked ? "on"
      : cfg.thinking ? `on (${cfg.thinking.type})` : "(main)"
    return `Advisor | Model: ${curModel} | Think: ${thinkInfo}`
  }

  function headerLine() {
    return `    ${advisorStatus()}`.replace(/\|/g, ansi.dim + "|" + ansi.reset)
  }

  /** off 形落盘（`think_off` 与归一后的 `effort_none` 共用——单一口径，防同状态两公式）：
   *  取形 = 单源 `thinkOffShape`（`@thincoder/core/think-off.mjs`；§15.4-2 族别判据 / §16.2 生产者表）——
   *  effort 族（`thinkApi === "effort"`）⇒ `thinking: null`（载荷层 off 门首款要求；`{type:"disabled"}`
   *  不开门 ⇒ 关思考静默失效）；其余（type 族默认 / 自定义开值族）⇒ `{type:"disabled"}`（达载荷层）。
   *  三支同清 `reasoningEffort`（§16.6-⑵：off 标记与档位不得同盘——F2 违约族）。 */
  async function applyThinkOff() {
    const spec = specForModel(getEffectiveModel(agent, cfg))
    cfg.thinking = thinkOffShape(spec)
    delete cfg.reasoningEffort
  }

  // ── Model picker sub-loop ──
  async function modelPicker() {
    if (!modelCache) {
      modelCache = await fetchAdvisorModels(agent)
    }
    let modelIdx = 0
    for (;;) {
      const entries = buildModelEntries(agent, cfg, modelCache)
      const c = await showPicker("Advisor Model", entries, { defaultIndex: modelIdx })
      if (!c) return
      modelIdx = Math.max(0, entries.filter((e) => e.type === "item").indexOf(c))

      if (c.action === "inherit") {
        delete cfg.provider
        delete cfg.model
        await persist()
        pushLabel("❯ Advisor", ansi.bold + C.tool)
        pushLine("Model: using main model", C.tool)
      } else if (c.action === "switch") {
        cfg.provider = c.provider
        cfg.model = c.model
        await persist()
        pushLabel("❯ Advisor", ansi.bold + C.tool)
        pushLine(`Model: ${c.provider}/${c.model}`, C.tool)
      }
    }
  }

  // ── Thinking picker sub-loop ──
  async function thinkingPicker() {
    let thinkIdx = 0
    for (;;) {
      const entries = await buildThinkingEntries(agent, cfg)
      const c = await showPicker("Advisor Thinking", entries, { defaultIndex: thinkIdx })
      if (!c) return
      thinkIdx = Math.max(0, entries.filter((e) => e.type === "item").indexOf(c))

      if (c.action === "inherit") {
        delete cfg.thinking
        delete cfg.reasoningEffort
        await persist()
        pushLabel("❯ Advisor", ansi.bold + C.tool)
        pushLine("Thinking: using main model settings", C.tool)
      } else if (c.action === "think_on") {
        const spec = specForModel(getEffectiveModel(agent, cfg))
        cfg.thinking = { type: spec.thinkEnabledValue ?? "enabled" }
        if (spec.thinkApi === "effort") delete cfg.thinking
        await persist()
        pushLabel("❯ Advisor", ansi.bold + C.tool)
        pushLine(`Thinking: ON`, C.tool)
      } else if (c.action === "think_off") {
        await applyThinkOff()
        await persist()
        pushLabel("❯ Advisor", ansi.bold + C.tool)
        pushLine("Thinking: OFF", C.tool)
      } else if (c.action === "effort_none") {
        // 归一（镜像 `cmd-think.mjs:104` 归一式 / `:127` 删档 / `:82` 回执）：档位 `none` 不是
        // 「强度零」而是**关思考**——与菜单 off 项同语义。不归一则残留 `reasoningEffort:"none"`
        // 被载荷层当强度档送（`provider/core.mjs:197-204`）⇒ 与 off 形矛盾同发、服务端仍思考。
        delete cfg.reasoningEffort
        await applyThinkOff()
        await persist()
        pushLabel("❯ Advisor", ansi.bold + C.tool)
        pushLine("Thinking: OFF", C.tool)
      } else if (c.action.startsWith("effort_")) {
        // #346-①（§16.4 表末行）：选档 = 要思考 ⇒ 先清 `thinking === null` 标记（对齐
        // `cmd-think.mjs:119-120` 先例 / §15.4-2 末句）；`{type:"disabled"}` 不动（同先例；
        // 残余登记 = §16.6-⑸——type 族 off ⇒ 选档 后该标记保持）。
        if (cfg.thinking === null) delete cfg.thinking
        cfg.reasoningEffort = c.action.slice(7)
        await persist()
        pushLabel("❯ Advisor", ansi.bold + C.tool)
        pushLine(`Reasoning effort: ${cfg.reasoningEffort}`, C.tool)
      }
    }
  }

  // ── Main loop ──
  let mainIdx = 0
  for (;;) {
    const curProvider = cfg.provider || "(main)"
    const curModel = cfg.model || agent.provider.model
    const guardInfo = cfg.guard === true ? "on" : "off"

    const entries = [
      { type: "header", text: headerLine() },
      { type: "item", text: `Model: ${curModel}`, action: "model", note: `Provider: ${curProvider}` },
      { type: "item", text: `Thinking: ${advisorStatus().split("|")[2]?.trim() || "(main)"}`, action: "thinking" },
      { type: "item", text: `Advisor: ${guardInfo}`, action: "guard" },
      { type: "item", text: "View full config", action: "view" },
    ]

    const choice = await showPicker("Advisor", entries, { defaultIndex: mainIdx })
    if (!choice) return // Esc
    mainIdx = Math.max(0, entries.filter((e) => e.type === "item").indexOf(choice))

    if (choice.action === "view") {
      pushLabel("❯ Advisor", ansi.bold + C.tool)
      pushLine(`Model:    ${curModel} (provider: ${curProvider})`, C.dim)
      pushLine(`Advisor:    ${guardInfo}`, C.dim)
      pushLine(`Thinking: ${advisorStatus().split("|")[2]?.trim() || "(main)"}`, C.dim)
      continue
    }

    if (choice.action === "guard") {
      cfg.guard = !(cfg.guard === true)
      await persistGuard().catch(err => pushLine(`[error] ${err.message}`, C.error))
      pushLabel("❯ Advisor", ansi.bold + C.tool)
      pushLine(`Advisor: ${cfg.guard === true ? "on" : "off"} (session)`, C.tool)
      continue
    }

    if (choice.action === "model") {
      await modelPicker()
      continue
    }

    if (choice.action === "thinking") {
      await thinkingPicker()
      continue
    }
  }
}

// ── Model helpers ──

function getEffectiveModel(agent, cfg) {
  const providerForDefaults = cfg.provider
    ? agent.providers?.find(p => p.name === cfg.provider) || agent.provider
    : agent.provider
  return cfg.model || providerForDefaults.model
}

async function fetchAdvisorModels(agent) {
  const { listModels } = await import("@thincoder/core/provider/index.mjs")
  const result = new Map()
  await Promise.all((agent.providers || []).map(async (p) => {
    try {
      // format 透传（M1 分派依据——claude/gemini 走 anthropic/google 拉取分支）
      const models = await listModels({ baseURL: p.baseURL, apiKey: p.apiKey ?? "", format: p.format }, { signal: AbortSignal.timeout(10000) })
      result.set(p.name, { models, error: null })
    } catch (err) {
      result.set(p.name, { models: [], error: err.message.slice(0, 40) })
    }
  }))
  return result
}

function buildModelEntries(agent, cfg, cache) {
  const entries = []
  entries.push({ type: "item", text: (!cfg.provider ? "● " : "  ") + "Use main model", action: "inherit" })

  for (const p of agent.providers || []) {
    const cached = cache.get(p.name)
    const hasKey = !!p.apiKey
    const noteParts = [p.baseURL]
    if (!hasKey) noteParts.push("(no key)")
    if (agent.activeProvider === p.name) noteParts.push("← active")
    if (cached?.error) noteParts.push(`(fetch failed: ${cached.error})`)
    entries.push({ type: "header", text: p.name, note: noteParts.join(" ") })

    // Default model
    const isDefault = cfg.provider === p.name && cfg.model === p.model
    entries.push({ type: "item", text: `${isDefault ? "● " : "  "}${p.model}`, action: "switch", provider: p.name, model: p.model })

    // Additional models from API, excluding the default model
    if (cached?.models) {
      for (const m of cached.models) {
        if (m === p.model) continue
        const isSelected = cfg.provider === p.name && cfg.model === m
        entries.push({ type: "item", text: `${isSelected ? "● " : "  "}${m}`, action: "switch", provider: p.name, model: m })
      }
    }
  }
  return entries
}

async function buildThinkingEntries(agent, cfg) {
  const { specForModel } = await import("@thincoder/core/config.mjs")
  const providerForDefaults = cfg.provider
    ? agent.providers?.find(p => p.name === cfg.provider) || agent.provider
    : agent.provider
  const effectiveModel = cfg.model || providerForDefaults.model
  const spec = specForModel(effectiveModel)
  const thinkOnValue = spec.thinkEnabledValue ?? "enabled"
  const isCustomThink = thinkOnValue !== "enabled"
  const isEffortOnly = spec.thinkApi === "effort"
  const offPath = thinkOffPath(spec)
  const effortLevels = spec.reasoningEffortEnum ?? ["high", "max"]

  const curEffort = cfg.reasoningEffort ?? providerForDefaults.reasoningEffort
  const curThinking = cfg.thinking ?? providerForDefaults.thinking
  const thinkingEnabled = curThinking?.type === thinkOnValue
    || (curThinking?.type === undefined && !isCustomThink)

  const entries = [
    { type: "item", text: "Use main model settings", action: "inherit" },
  ]
  if (!isEffortOnly) {
    entries.push({ type: "header", text: "Thinking mode" })
    entries.push({ type: "item", text: `Enabled  ${thinkingEnabled ? "← current" : ""}`, action: "think_on" })
    // §16.4：无有效 off 路径（服务端强制族 / 形不发字段）⇒ Disabled 项**不渲染**；
    // Enabled 项保留 = 残留 `{type:"disabled"}` 标记的恢复径（`/think on` 同旨）。
    if (offPath) {
      entries.push({ type: "item", text: `Disabled ${(curThinking?.type === "disabled" || curThinking === null) ? "← current" : ""}`, action: "think_off" })
    }
  }
  entries.push({ type: "header", text: "Reasoning effort" })
  for (const level of effortLevels) {
    entries.push({ type: "item", text: `${level} ${curEffort === level ? "← current" : ""}`, action: `effort_${level}` })
  }
  return entries
}
