/**
 * wizard.mjs — first-launch config wizard
 * 首屏两路（登录面补全批 · TUI-COMMANDS.md §3.1）：`route` 屏（① 登录团队服务器 ∥ ② 配置本地 provider
 * ∥ ③ 以后再说——**零预选**：光标 = 首行；说明行随光标）⇒ ①团队三问步（`server → username →
 * password`——步定义 ∥ 掩码单源 = `ask-steps.mjs`；败 ⇒ 四句逐字就地 + 停留可重试）/ ②既有 provider
 * 步零改。回退行「← 换一种方式」（团队步 ∥ 本地步 1 皆在场）⇒ 回 route；保真 = 已填保留（团队地址/账号
 * ∥ provider 字段—同会话内），密码恒不保留。
 * Extracted from index.mjs: provider select → step-by-step input (name/baseURL/format/key/embedkey)
 * → 末问「走 proxy」（#1049 补步——showPicker，落盘前）→ persist → then model picker. Custom 分支含 API format 步（D-C2，TUI.md §10.6D）。
 * 2026-10-09 清除批：**渠道条目不携模型**（单值 `providers[].model` 退场）——落盘后由模型 picker 显式选定
 * （`selectModel` 选定即写回 config.defaultModel）；零播种 ∥ 零静默回落。
 * Accesses shared state and UI functions from the startTUI closure via ctx object.
 * ctx: { agent, state, pushLine, pushLabel, render, persistRaw, showPicker, openModelPicker, onModalClose }
 */

import { PROVIDER_PRESETS as PRESETS } from "@thincoder/core/config.mjs"
import { teamLogin, teamStatus } from "@thincoder/core/team.mjs"
import { ansi, C } from "./ansi.mjs"
import { computeLayout } from "./layout.mjs"
import { probeChannelModels } from "./model-catalog.mjs"
import { probeTargetOf } from "@thincoder/core/provider-flows.mjs"
import { nextTeamAskStep, teamAskLines, teamAskStepAt } from "./ask-steps.mjs"
import { MODEL_SELECT_HINT, completeTeamLogin } from "./cmd-team.mjs"
import { FAILURE_TEXT } from "../cli/team-command.mjs"

/** 首屏三行（TUI-COMMANDS.md §3.1——文案逐字：① ∥ ② 说明 = 团队卡 ∥ 本地卡同句；③ 零说明行）。 */
const WIZARD_ROUTES = Object.freeze([
  Object.freeze({ kind: "route-team", label: "登录团队服务器", desc: "用团队发的账号登录——模型由服务器提供，不用自己填 key" }),
  Object.freeze({ kind: "route-local", label: "配置本地 provider", desc: "自己填 API key，不依赖团队服务器" }),
  Object.freeze({ kind: "route-later", label: "以后再说", desc: null }),
])

/** 回退行词面（两在场点共用——团队三问步 ∥ 本地 provider 步）。 */
const BACK_ROW_LABEL = "← 换一种方式"

/**
 * Creates the wizard controller.
 * Returns { startWizard, renderWizard, wizardChooseProvider, wizardSubmitText, cancelWizard, finishWizard }
 */
export function createWizard(ctx) {
  const { agent, state, pushLine, pushLabel, render, persistRaw, showPicker, onModalClose = null } = ctx

  /** Candidates for the menu step: existing providers (marked "no key" if missing), unadded presets, custom
   *  渠道条目不携模型（2026-10-09 清除批：单值 `providers[].model` 退场）——条目只携 name/baseURL + 预设扩展字段；
   *  模型在向导尾由模型 picker 显式选定（候选清单运行期拉取）。 */
  function wizardProviderItems() {
    const items = []
    for (const p of agent.providers) {
      items.push({ kind: "existing", name: p.name, baseURL: p.baseURL, label: `${p.name} (added${p.apiKey ? "" : ", no key"})` })
    }
    for (const [name, p] of Object.entries(PRESETS)) {
      if (!agent.providers.some((x) => x.name === name)) {
        items.push({
          kind: "preset", name, baseURL: p.baseURL, label: `${name} (${p.desc})`,
          // 预设自身声明的扩展字段随 preset 直达落盘（code review 🟡——与 pickers preset 路径同构；
          // claude/gemini 缺 format、deepseek/glm 缺 thinking/maxTokens 会静默错配）；不新增提问步。
          format: p.format, thinking: p.thinking, reasoningEffort: p.reasoningEffort,
          maxTokens: p.maxTokens, chatPath: p.chatPath,
        })
      }
    }
    items.push({ kind: "custom", name: null, label: "Custom endpoint…" })
    // 回退行（TUI-COMMANDS.md §3.1 键盘激活裁定）：列表**末行**——↑↓ 选中 + Enter 回 route 屏
    // （与列表步同键，零新键；行文本自含语义）。
    items.push({ kind: "back", name: null, label: BACK_ROW_LABEL })
    return items
  }

  /** Text step definitions: prompt + validation (returns true if valid, otherwise error message) */
  const WIZARD_STEPS = {
    name: {
      prompt: "Name this provider (alphanumeric/-/_ e.g. my-openai)",
      validate: (v) =>
        (/^[\w-]+$/.test(v) && !agent.providers.some((p) => p.name === v)) || "Name must be alphanumeric/-/_ and unique",
    },
    baseURL: {
      prompt: "Enter baseURL (e.g. https://api.openai.com/v1)",
      validate: (v) => /^https?:\/\/.+/.test(v) || "baseURL must start with http(s)://",
    },
    // D-C2（TUI.md §10.6D）：Custom 分支的 API format 步（endpoint 后 key 前——与 Add Provider
    // picker 路径两入口一致；默认 openai）。空输入 = openai 直过（Enter 即默认——同 D-C1 index=0）；
    // Esc 在该步沿用 wizard 既有“Esc 随时跳过”语义（取消整个向导——无半配置落盘）。
    format: {
      prompt: "API format [openai/anthropic/google] (Enter = openai default)",
      // 大小写不敏感（旧手输口径——输入统一 toLowerCase 后落盘）；空输入 = openai 默认
      validate: (v) => !v || /^(openai|anthropic|google)$/i.test(v) || "API format must be one of: openai, anthropic, google",
    },
    key: {
      prompt: "Enter API key",
      validate: (v) => v.length > 0 || "Key must not be empty",
    },
    embedkey: {
      prompt: "Optional: embedding API key (SiliconFlow, for memory vector search; press Enter to skip)",
      validate: () => true, // skippable
    },
  }
  const WIZARD_NEXT = { name: "baseURL", baseURL: "format", format: "key", key: "embedkey", embedkey: null }

  function startWizard() {
    state.wizard = {
      step: "route", index: 0, scroll: 0, selectedLine: 0, fields: {}, error: null, lines: [],
      // 登录面补全批：团队路留存（地址 ∥ 账号——密码零字段：恒不保留）+ 回退行焦点位 + 提交重入闸
      team: { inited: false, server: "", username: "" },
      teamFocusBack: false,
      busy: false,
    }
    renderWizard()
  }

  function renderWizard() {
    const w = state.wizard
    if (!w) return
    const lines = []
    if (w.step === "route") {
      lines.push({ text: " Choose a route:", color: C.text })
      WIZARD_ROUTES.forEach((it, i) => {
        if (i === w.index) w.selectedLine = lines.length
        lines.push({
          text: `${i === w.index ? " ▸ " : "   "}${it.label}`,
          color: i === w.index ? ansi.bold + C.text : C.dim,
        })
        if (i === w.index && it.desc) lines.push({ text: `     ${it.desc}`, color: C.dim })
      })
    } else if (teamAskStepAt(w.step) !== null) {
      lines.push(...teamAskLines(w.step, w.team))
      lines.push(backRowLine(w.teamFocusBack === true))
      w.selectedLine = 0
    } else if (w.step === "provider") {
      lines.push({ text: " Choose a model provider:", color: C.text })
      wizardProviderItems().forEach((it, i) => {
        if (i === w.index) w.selectedLine = lines.length
        lines.push({
          text: `${i === w.index ? " ▸ " : "   "}${it.label}`,
          color: i === w.index ? ansi.bold + C.text : C.dim,
        })
      })
    } else {
      const f = w.fields
      if (f.name) lines.push({ text: ` Provider:  ${f.name}`, color: C.dim })
      if (f.baseURL) lines.push({ text: ` baseURL: ${f.baseURL}`, color: C.dim })
      lines.push({ text: ` ❯ ${WIZARD_STEPS[w.step].prompt}`, color: ansi.bold + C.text })
      lines.push({ text: " (type in input box below)", color: C.dim })
      w.selectedLine = 0
    }
    if (w.error) lines.push({ text: ` ${w.error}`, color: C.error })
    w.lines = lines
    // A4（第 20 批 §12.5——D-SS6）：provider 步选中行自动滚入可视窗——renderWizard 是索引变化的单一路径（产出即一致）；
    // winH 走 computeLayout（同 pickers.mjs 口径）+ try/catch 兜底 8（无 dims/测试环境不崩）。
    if (w.step === "provider") {
      let winH
      try {
        winH = Math.max(1, (computeLayout(state, { cols: (state.dims?.get() ?? {}).cols ?? (process.stdout.columns || 80), rows: (state.dims?.get() ?? {}).rows ?? (process.stdout.rows || 24) }).panels.picker?.h ?? lines.length + 1) - 1)
      } catch {
        winH = 8 // safe fallback for mocks without dims（同 pickers.mjs 兜底口径）
      }
      if (w.selectedLine < w.scroll) w.scroll = w.selectedLine
      if (w.selectedLine >= w.scroll + winH) w.scroll = w.selectedLine - winH + 1
      w.scroll = Math.max(0, Math.min(w.scroll, Math.max(0, lines.length - winH)))
    }
    render()
  }

  function wizardChooseProvider(item) {
    const w = state.wizard
    if (item.kind === "back") {
      wizardBackToRoute() // 「← 换一种方式」（本地步 1）⇒ 回 route 屏（已填保留）
      return
    }
    if (item.kind === "custom") {
      w.step = "name"
    } else {
      // 2026-10-09 清除批：渠道条目不携模型——fields 只收 name/baseURL + 预设扩展字段
      w.fields = { name: item.name, baseURL: item.baseURL }
      // preset 直达：其余扩展字段照旧（随 fields 落盘）
      for (const k of ["format", "thinking", "reasoningEffort", "maxTokens", "chatPath"]) {
        if (item[k]) w.fields[k] = item[k]
      }
      w.step = "key"
    }
    renderWizard()
  }

  /** 回退行渲染（团队步在场）：焦点态 = ↑ 聚焦位（裁定 2026-10-10「↑ 聚焦该行 + Enter」）——
   *  两态行文本都自含可见键提示（不得藏键）。 */
  function backRowLine(focused) {
    return focused
      ? { text: ` ▸ ${BACK_ROW_LABEL}（Enter 确认 · ↓ 回输入框）`, color: ansi.bold + C.text }
      : { text: `   ${BACK_ROW_LABEL}（↑ 选中）`, color: C.dim }
  }

  /** route 步行源（三行——零预选：`index` 初值 0 = 首行高亮，无“常选态”）。 */
  function wizardRouteItems() {
    return WIZARD_ROUTES
  }

  /** route 行选中：① ⇒ 团队三问步（字段首入预填核留存快照）；② ⇒ 既有 provider 步（零改）；
   *  ③ ⇒ 既有 `cancelWizard` 语义（退场 + Skipped 提示——无半配置落盘）。 */
  function wizardChooseRoute(item) {
    const w = state.wizard
    if (!w) return
    if (item.kind === "route-team") {
      initTeamFields(w)
      enterTeamStep(w, "server")
      return
    }
    if (item.kind === "route-local") {
      w.step = "provider"
      w.index = 0
      w.error = null
      state.input = []
      state.cursor = 0
      renderWizard()
      return
    }
    cancelWizard()
  }

  /** 团队字段初值（同会话首入一次——`inited` 门）：核留存快照预填（TEAM.md §2.1 member 行
   *  「表单预填」——桌面表单同款）；读不可用 ⇒ 空。密码零字段（恒不保留）。 */
  function initTeamFields(w) {
    if (w.team.inited === true) return
    let st = null
    try { st = teamStatus() } catch { st = null }
    w.team.server = st?.server ?? ""
    w.team.username = st?.member?.username ?? ""
    w.team.inited = true
  }

  /** 团队步入场：输入框预填该步留存值（地址 ∥ 账号——掩码步恒空）∥ 焦点复位 ∥ 错误清。 */
  function enterTeamStep(w, stepName) {
    const def = teamAskStepAt(stepName)
    w.step = stepName
    w.teamFocusBack = false
    w.error = null
    const value = def.mask ? "" : (w.team[def.field] ?? "")
    state.input = [...value]
    state.cursor = state.input.length
    renderWizard()
  }

  /** 回退到 route 屏（两在场点共用：团队步 ∥ 本地步 1——「← 换一种方式」）。保真判据（§3.1）：
   *  已填保留——未提交的输入框内容在非掩码步收入字段（= 已填）、掩码步（密码）即弃；
   *  `fields`（本地路）与 `team` 地址/账号不动。 */
  function wizardBackToRoute() {
    const w = state.wizard
    if (!w) return
    const def = teamAskStepAt(w.step)
    const typed = state.input.join("")
    if (def !== null && def.mask !== true && typed !== "") w.team[def.field] = def.trim ? typed.trim() : typed
    w.step = "route"
    w.index = 0
    w.teamFocusBack = false
    w.error = null
    state.input = []
    state.cursor = 0
    renderWizard()
  }

  function wizardSubmitText() {
    const w = state.wizard
    const teamDef = teamAskStepAt(w.step)
    if (teamDef !== null) {
      return submitTeamStep(w, teamDef).catch((e) => pushLine(`[error] ${e?.message ?? e}`, C.error))
    }
    const value = state.input.join("").trim()
    const ok = WIZARD_STEPS[w.step].validate(value)
    if (ok !== true) {
      w.error = ok
      renderWizard()
      return
    }
    w.error = null
    state.input = []
    state.cursor = 0
    w.fields[w.step === "key" ? "key" : w.step] = w.step === "baseURL" ? value.replace(/\/+$/, "")
      : w.step === "format" ? (value.toLowerCase() || "openai") // 空输入 = openai 默认（D-C2）
      : value
    const next = WIZARD_NEXT[w.step]
    if (next) {
      w.step = next
      renderWizard()
    } else {
      finishWizard().catch((e) => pushLine(`[error] ${e.message}`, C.error))
    }
  }

  /** 团队步提交：步内推进（末步 ⇒ 核 `teamLogin`）。成 ⇒ 退场 + 公共收尾（结果行 ∥ 两复读 ∥
   *  模型选定——`cmd-team.mjs` 单源）；败 ⇒ 四句逐字就地 + 停留（步不动、输入框清空——密码零留存重输）。 */
  async function submitTeamStep(w, def) {
    if (w.busy === true) return // 提交在途重入闸
    const raw = state.input.join("")
    const value = def.trim ? raw.trim() : raw
    if (def.mask !== true) w.team[def.field] = value // 掩码步（密码）零留存——不着状态
    w.error = null
    const next = nextTeamAskStep(def.step)
    if (next !== null) { enterTeamStep(w, next); return }
    w.busy = true
    try {
      const result = await teamLogin({ server: w.team.server, username: w.team.username, password: value })
      if (state.wizard !== w) return // 在途退场（Esc ∥「以后再说」）⇒ 零动作
      if (result.ok !== true) {
        w.error = FAILURE_TEXT[result.reason] ?? FAILURE_TEXT.network
        state.input = []
        state.cursor = 0
        renderWizard()
        return
      }
      state.wizard = null
      state.input = []
      state.cursor = 0
      await completeTeamLogin(ctx, result)
    } finally {
      w.busy = false
    }
  }

  function cancelWizard() {
    const w = state.wizard
    state.wizard = null
    // 登录面补全批：route ∥ 团队步的输入框归向导面（预填 ∥ 键入）——退场归还（清空）；既有文本步
    // 保持原语义（零行为变更）。
    if (w !== null && (w.step === "route" || teamAskStepAt(w.step) !== null)) { state.input = []; state.cursor = 0 }
    // MODEL-MERGE-SESSION 引导 A（F-6）：有 provider 但 defaultModel 未设时指引 /config 入口
    const hint = (agent.providers?.length ?? 0) > 0 && !agent.config?.defaultModel
      ? "Skipped initial setup. 已配置渠道但 config.defaultModel 未设——新会话无起点：/config → 默认模型 设置一次（或 /model 选定即成为默认模型）。"
      : "Skipped initial setup. Use /model to add providers and configure API keys anytime."
    pushLine(hint, C.dim)
    render()
    // #448①「关闭后补评估」：wizard 面退场（无 picker 同在场）⇒ 通知链尾（闩重武装）
    if (state.picker == null) ctx.onModalClose?.()
  }

  /** Wizard complete: write provider（**渠道条目不携模型**——单值退场 2026-10-09 清除批）、清 legacy 顶层键，
   *  然后打开会话模型 picker——模型由用户在 picker 里**显式选定**（选定即写回 config.defaultModel——判据句 6）。
   *  加渠道 = 配置写入面——落盘后探一次 `/models`（M9：探不通标「不可用」+ 明示原因，不阻断保存）。 */
  async function finishWizard() {
    const f = state.wizard.fields
    state.wizard = null
    // D-C2：format 非默认（anthropic/google）时落盘；openai = 默认省略（与 D-C1 picker 路径同构）
    const providerRec = { name: f.name, baseURL: f.baseURL, apiKey: f.key }
    if (f.format && f.format !== "openai") providerRec.format = f.format
    for (const k of ["thinking", "reasoningEffort", "maxTokens", "chatPath"]) {
      if (f[k]) providerRec[k] = f[k]
    }
    // #1049 补步（2026-10-08 裁「补步」）：向导末问——「走 proxy」问句（形 ≡ add 流既有问句——
    // provider-admin.mjs add 流两支同形：No (direct) / Yes (proxy)，缺省 No/Esc；本档载体 = showPicker
    // 同形调用（ctx 注入——index.mjs 装配处随 openModelPicker 先例）。答 Yes ⇒ 条目 proxy: true
    // （随下方落盘一次写）；No ∥ 缺省 ⇒ 零 proxy 键。
    const route = await showPicker("Route this provider's model requests through the proxy", [
      { type: "item", text: "No (direct)", name: "no" },
      { type: "item", text: "Yes (proxy)", name: "yes" },
    ])
    if (route?.name === "yes") providerRec.proxy = true
    // D-F5a（wizard finishWizard——清单外同型写回补正）先盘后存：磁盘 fresh raw 单操作
    // （upsert 目标项 + 清 legacy 字段）——冲突放弃不留下内存 ghost（F5 约定）。
    // 2026-10-09 清除批：不写 `raw.defaultModel`——模型面写入唯二径 = picker 显式选定（carryoverDefaultModel）
    // ∥ /config 默认模型子菜单；渠道条目零 `model`。
    await persistRaw((raw) => {
      raw.providers ??= []
      const existing = raw.providers.find((p) => p?.name === f.name)
      if (existing) Object.assign(existing, providerRec)
      else raw.providers.push(providerRec)
      delete raw.activeProvider
      delete raw.activeModel
      // 渠道老字段（models 候选清单）由 config-migrate 在下次 load 统一清理（迁移唯一权威）
    })
    const existing = agent.providers.find((p) => p.name === f.name)
    if (existing) Object.assign(existing, providerRec)
    else agent.providers.push(providerRec)
    // 会话槽（activeProvider/activeModel/provider）不在此播种——由向导尾 picker 的显式选定一次写入
    pushLabel(`❯ Setup`, ansi.bold + C.tool)
    pushLine(`Setup complete: ${f.name}（渠道已落盘——默认模型下一步选定）`, C.tool)
    // M9 配置阶段准入：加渠道属配置写入面——保存已落，探一次 `/models`（探不通标「不可用」+ 明示原因；不阻断）
    const channel = agent.providers.find((p) => p.name === f.name) ?? providerRec
    const probe = await probeChannelModels(probeTargetOf(channel)) // 探针目标构造收敛核判据（③′——执行体与返形零改）
    if (probe.ok) {
      delete channel._unavailable
      pushLine(`${f.name}: /models 可用（${probe.list.length} 个模型可候选）`, C.tool)
    } else {
      channel._unavailable = true
      pushLine(`${f.name} 不可用 — ${probe.message}`, C.error)
    }
    // embedding key: if provided, enable vector search; if not, show how to enable later
    if (f.embedkey) {
      // D-F5b 语义先盘后存（embedding 单键补丁——冲突放弃不留 ghost）
      await persistRaw((raw) => { raw.embedding = { ...(raw.embedding ?? {}), apiKey: f.embedkey } })
      agent.config.embedding ??= {}
      agent.config.embedding.apiKey = f.embedkey
      if (agent.memory && !agent.memory.embedder) {
        const { createEmbedder } = await import("@thincoder/core/embedding.mjs")
        agent.memory.embedder = createEmbedder(agent.config.embedding)
      }
      pushLine(`Vector search enabled (${agent.config.embedding.model ?? "BAAI/bge-m3"})`, C.tool)
    } else {
      pushLine(`Vector search disabled (memory falls back to text-only search). Run /config embedkey <key> to enable.`, C.dim)
    }
    pushLine(MODEL_SELECT_HINT, C.dim)
    // #448①「关闭后补评估」：收尾链落定（模型 picker 关闭 ∕ 零弹面两态）⇒ 通知链尾（闩重武装——幂等）。
    ctx.openModelPicker()
      .catch((e) => pushLine(`[error] ${e.message}`, C.error))
      .then(() => { if (state.picker == null && state.wizard == null) ctx.onModalClose?.() })
  }

  return { startWizard, renderWizard, wizardChooseProvider, wizardSubmitText, cancelWizard, finishWizard, wizardProviderItems, wizardRouteItems, wizardChooseRoute, wizardBackToRoute }
}
