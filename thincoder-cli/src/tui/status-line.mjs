/**
 * status-line.mjs — 状态栏族（2026-10-15 · car2 批 · 台账 #1437 自 `render-frame.mjs` 拆出）：
 *   `SLASH_HINTS` ∥ `QUIET_MS` ∥ `attentionKind` ∥ `renderStatus` ∥ `buildStatusLine` ∥
 *   `sessionTitleFallback` ∥ `teamSegmentHint` ∥ `teamServerHost`。
 * 拆分 = 结构零语义（render-frame.mjs 495 近线 ⇒ 拆后两档均 <500）：函数体逐字随迁，仅 import 面
 * 归位；导出面（`QUIET_MS` ∥ `attentionKind` ∥ `renderStatus`）经 render-frame.mjs 转发再出口——
 * 既有 import 面零破坏；render-frame 自引 `renderStatus`（renderRows 状态行 put）。
 * 语义单源：停滞轻显形 = `docs/cli/design/TUI.md` §7.7 ∥ 注意力态 = §14.3 ∥ 团队状态段 = §7.8 ∥
 * timer 段 = §7.6 ∥ D8 会话标题 = §7.4 ∥ LEDGER-SURFACE = `docs/core/design/SESSION.md` §2.30.3。
 */
import { ansi, C } from "./ansi.mjs"
import { sliceByWidth, stringWidth } from "./render.mjs"
import { providerSpec } from "@thincoder/core/config.mjs"
import { t } from "@thincoder/core/i18n.mjs" // 停滞轻显形（TUI.md §7.7）：句式键 status.quiet——词面单源（CLI 直取）
import { isRealUserMsg } from "@thincoder/core/history-window.mjs" // B6 回退链：首条真实 user 消息谓词（纯件单源）
import { isYesNoModal } from "./interaction.mjs" // X8 跟进①：y/n-only 族判据单源

/** 标题单行化（docs/cli/design/TUI.md §7.4 = 单源）：固定断行字符集命中 ⇒ 一个空格（一字符换一空格——
 *  宽度账逐个守恒）；具名导出——入口 / 回退 / status 行写出口三处同用。 */
const TITLE_BREAK_RE = /[\r\n\t\v\f\u0085\u2028\u2029]/g
export function singleLineTitle(s) { return typeof s === "string" ? s.replace(TITLE_BREAK_RE, " ") : s }

// ---------- status bar slash-command hints ----------
const SLASH_HINTS = {
  "/config": "open config menu",
  "/model": "select model & manage providers",
  "/think": "open thinking mode menu",
  "/mcp": "open MCP management menu",
  "/goal": "open goal management menu",
  "/session": "select archived session",
  "/restore": "select checkpoint to restore",
}

// ---------- 停滞轻显形阈值（docs/cli/design/TUI.md §7.7 · stall-indicator 批 2026-09-29）----------
/** 静默显示阈值（毫秒）——静默 ≥ 本值才注入读数（首显值 = 10s）；跳秒 = 既有 1s 拍
 *  （agent-turn ticker——零新定时器）；三端同值（VSC ∕ 桌面各自持有常量面）。 */
export const QUIET_MS = 10_000

/** 第 33 批（TUI §14.3(a)——纯函数派生，无副作用）：blocked = 审批/提问卡挂起（实时派生，
 *  提示消解即消失）；awaiting = 回合结束等待输入（链尾置位——processing / 挂起两态期间不派生）。
 *  @returns {"blocked"|"awaiting"|null} */
export function attentionKind(state) {
  // SSH 凭据窗（SSH-SESSION 批 §6.22 ⑧）：与审批/提问同族——回合被用户面阻塞（chip 显「等待你的回答」）
  if (state.permission || state.question || state.secretPrompt) return "blocked"
  if (state.attentionAwaiting && !state.processing && !state.suspended && !state._suspPending) return "awaiting"
  return null
}

/** Status bar (always 1 line). */
export function renderStatus(state, agent, cols, slashCommands) {
  const statusLine = buildStatusLine(state, agent, { cols, slashCommands })
  const autoBanner = agent.autoApprove ? `${C.warn} AUTO${ansi.reset}${ansi.dim}│` : ""
  const planBanner = agent.planMode ? `${C.tool} PLAN${ansi.reset}${ansi.dim}│` : ""
  const advisorBanner = agent.config?.advisor?.guard === true ? `${C.advisor} ADVISOR${ansi.reset}${ansi.dim}│` : ""
  const engBanner = agent.config?.agent?.engineering ? `${C.advisor} ENG${ansi.reset}${ansi.dim}│` : ""
  const bannerPrefix = (agent.planMode ? " PLAN│ " : "") + (agent.autoApprove ? " AUTO│ " : "") + (agent.config?.advisor?.guard === true ? " ADVISOR│ " : "") + (agent.config?.agent?.engineering ? " ENG│ " : "")
  // 第 33 批（TUI §14.3(b)/(c)）：attention 态 = chip 行首 + 整行注意力色对包裹（blocked >
  // awaiting；blocked 内 permission > question——与按键分发优先级同序）；平态零注入。
  const kind = attentionKind(state)
  const chip = kind === "blocked" ? (state.permission ? "⚠ 等待你的审批" : "⚠ 等待你的回答")
    : kind === "awaiting" ? "⚠ 等待你的输入" : ""
  const attentionPad = chip ? `${chip} │ ` : ""
  // 宽度预算（N9④）：chip 占位计入——整行仍 ≤ cols − 1（既有口径）。
  const statusMax = cols - 1 - (bannerPrefix ? stringWidth(bannerPrefix) : 0) - (attentionPad ? stringWidth(attentionPad) : 0)
  const inner = `${ansi.dim}${planBanner}${autoBanner}${advisorBanner}${engBanner}${sliceByWidth(statusLine, Math.max(10, statusMax))}`
  // 负向锁（§14.3）：attention 为 null ⇒ 半态路径逐字节等价（不经包裹 / 零字节注入）。
  if (!chip) return `${inner}${ansi.reset}`
  // 底色存活（§14.3）：既有内容含内部 ansi.reset（banner / ctx 警示段）——每次内部复位后
  // 重施加注意力色对，再整体包裹（内容零省略）。
  return `${C.attention}${(chip + " │ " + inner).replaceAll(ansi.reset, ansi.reset + C.attention)}${ansi.reset}`
}

/** 标题回退链（B6 消 · #677——对位 VSC `panel-session.mjs` 链值 `title → "firstMessage" → "(empty)"`；
 *  截断逐字同该链 `truncate(s, 40)`——生成前 ∕ 失败期两端同值）。首条真实 user 消息 = 活读单源：
 *  绑定态取槽摘要字段（`counters().firstMessage`——与 VSC `listSlots` 同字段）；未绑定回退内存人读线。 */
function sessionTitleFallback(agent) {
  const fm = (agent?._recordStore?.counters?.().firstMessage ?? "")
    || (agent?._fullHistory ?? agent?.history ?? []).find(isRealUserMsg)?.content
  if (typeof fm !== "string" || fm === "") return "(empty)"
  // TUI.md §7.4：回退标题同规则单行化（`"(empty)"` 分支无控制字符，不处理）
  const title = singleLineTitle(fm)
  return `"${title.length <= 40 ? title : title.slice(0, 39) + "…"}"`
}

function buildStatusLine(state, agent, { cols, slashCommands }) {
  const scrollHint = state.scroll > 0 ? ` │ scrolled ${state.scroll}` : ""
  const rawInput = state.input.join("")

  if (state.question) {
    const q = state.question
    return q.options.length > 0
      ? " ↑↓: select │ Enter: confirm │ Esc: cancel"
      : " Type answer then Enter │ Esc: cancel"
  }
  if (state.permission) {
    if (isYesNoModal(state.permission.name)) {
      return state.permission.name === "continue" ? " y: continue │ n: stop" : " y: retry │ n: stop"
    }
    if (state.permission.batch) return " a: approve all │ o: one by one │ n: deny"
    return " y: approve │ n: deny │ a: approve all (AUTO)"
  }
  if (state.picker) return " type: filter │ ↑↓/PgUp/PgDn: select │ Enter: confirm │ Esc: cancel"
  // 团队问句面（模态族第三支——登录面补全批）：主键面 = Esc 取消 ∥ Enter 提交（输入框编辑·零滚动）
  if (state.teamAsk) return " Type then Enter │ Esc: cancel"
  if (state.secretPrompt) return " Type then Enter │ Esc: cancel" // SSH 凭据窗（SSH-SESSION 批 §6.22 ⑧）
  if (state.wizard) {
    const w = state.wizard
    // route 屏与 provider 步同为列表步；团队步焦点在回退行上时 Enter = 确认回退
    if (w.step === "provider" || w.step === "route") return " ↑↓: select │ Enter: confirm │ Esc: skip"
    if (w.teamFocusBack === true) return " ↑↓: select │ Enter: confirm │ Esc: cancel"
    return " Type then Enter │ Esc: cancel"
  }
  if (rawInput.startsWith("/") && !state.processing && !state.permission) {
    const [cmd] = rawInput.split(/\s+/)
    const cmds = slashCommands.filter((c) => c.name.startsWith(cmd))
    const match = cmds.length === 1 ? cmds[0] : null
    if (match && SLASH_HINTS[match.name]) return ` ${match.name} ${SLASH_HINTS[match.name]}`
    if (cmds.length > 0) {
      if (cmds.length <= 4) return ` ${cmds.map((c) => `${c.name} ${c.desc}`).join("  │  ")}`
      return ` ${cmds.map((c) => c.name).join("  ")}  │  Tab complete`
    }
    return ` unknown command (/help for available commands)`
  }

  const taskHint = state.tasks.length > 0
    ? ` │ ✓${state.tasks.filter((t) => t.status === "done").length}/${state.tasks.length}` : ""
  const turnHint = agent._currentTurn > 0 && agent._maxTurns > 0
    ? ` │ turn ${agent._currentTurn}/${agent._maxTurns}` : ""
  const tk = state.tokens
  const fmtK = (n) => (n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`)
  const cacheTotal = tk.cacheHit + tk.cacheMiss
  const tokenHint = tk.prompt > 0
    ? ` │ ↑${fmtK(tk.prompt)} ↓${fmtK(tk.completion)}${tk.reasoningTokens > 0 ? ` ✦${fmtK(tk.reasoningTokens)}` : ""}${cacheTotal > 0 ? ` hit${Math.round((tk.cacheHit / cacheTotal) * 100)}%` : ""}` : ""
  const elapsed = state.processing ? ` ${Math.floor((Date.now() - state.processingStarted) / 1000)}s` : ""
  const toolHint = state.currentTool ? ` ${state.currentTool}…` : ""
  // 停滞轻显形（docs/cli/design/TUI.md §7.7 · stall-indicator 批 2026-09-29）：显示位 = elapsed 之后；
  // 静默 = 距最近一次可见输出（`state.lastOutputAt`——回合起刻为初始锚，重置点三类见 tool-events ∕
  // subagent-blocks）；非显示条件（未至阈值 ∕ 非在飞 ∕ 未起算）零注入（负向锁——逐字节等价）；纯读数零警示色。
  const lastOut = state.lastOutputAt ?? 0
  const quietHint = state.processing && lastOut > 0 && Date.now() - lastOut >= QUIET_MS
    ? ` ${t("status.quiet", { s: Math.floor((Date.now() - lastOut) / 1000) })}`
    : ""
  const statusText = state.processing ? `${state.status}${toolHint}${elapsed}${quietHint}` : state.status
  // 2026-09-02 Q1（SESSION.md §6.8）：provider 可为 null —— providerSpec(null) 保守 128K 不抛错
  // 2026-09-02 §15：context 窗口跟随 providers[].context 覆盖（T-C6——百分比基于覆盖后的窗口）
  const modelContext = providerSpec(agent.provider).context
  const ctxPct = Math.round((state.ctxCache.tokens / modelContext) * 100)
  const ctxTokensHint = state.ctxCache.tokens > 0 ? ` ${fmtK(state.ctxCache.tokens)}` : ""
  const ctxHint = ctxPct > 0
    ? ctxPct >= 80 ? ` │ ${ansi.reset}${C.warn}context ${ctxPct}%${ctxTokensHint}${ansi.reset}${ansi.dim}` : ` │ context ${ctxPct}%${ctxTokensHint}` : ""
  // INPUT-LOCK-ASYNC（C'——F-3）：busy（processing 含 digest）状态栏提示——取代旧排队提示
  // （F-7 已删）；F16（TUI.md §7.5）**四态分流**（queue-visible 批 2026-09-24）：队列非空 ⇒
  // 条数段（dim 段样式 · 零注意力色对——F13 豁免 · 消费即消失）；队空 ⇒ 按 busy 面分排队句
  // （普通 / 挂起内用户回合 = 步边界「当前步骤结束后自动发送」· 挂起内系统轮 = 轮末「本轮结束后
  // 优先发送」）（判据同 TUI-INPUT-BOX.md §4.1；面感知 = `agent._inAutoTurn` 活读）。
  const queuedN = state.pendingInput?.length ?? 0
  const enterHint = state.processing
    ? (queuedN > 0 ? `已排队 ${queuedN} 条消息`
      : state.suspended || state._suspPending
        ? (agent._inAutoTurn === true
          ? `会话内回合处理中 — Enter 排队（本轮结束后优先发送）`
          : `会话内回合处理中 — Enter 排队（当前步骤结束后自动发送）`)
        : `主会话处理中 — Enter 排队（当前步骤结束后自动发送）`)
    : "Enter: send"
  // LEDGER-SURFACE（§2.30.3.3/§2.30.3.4）：L1 常驻标记——状态段簇尾（scrollHint 后、键位组前）；
  // 空标记零注入（半态逐字节等价——同 :233-238 纪律）；warn = 当前项目老化 > 0（警示色段包裹）
  const lg = state.ledger
  const ledgerHint = lg?.marker
    ? ` │ ${lg.warn ? `${ansi.reset}${C.warn}${lg.marker}${ansi.reset}${ansi.dim}` : lg.marker}`
    : ""
  // timer 可见面（`docs/cli/design/TUI.md` §7.6 · timer-wake 批 2026-09-27）：状态段簇尾（ledgerHint 后、
  // titleHint 前）——取值 = `agent._pendingTimers` 活读（每帧 recompute / 零缓存副本 / 不显倒计时）；
  // 零在途 ⇒ 零注入（负向锁——半态逐字节等价）；到期态（任一在途项已过期未送达）⇒ 同段警示色。
  const timers = agent._pendingTimers ?? []
  const timerHint = timers.length === 0 ? "" : ` │ ${timers.some((t) => t.expiresAt <= Date.now()) ? `${ansi.reset}${C.warn}⏰${timers.length}${ansi.reset}${ansi.dim}` : `⏰${timers.length}`}`
  // D8（2026-09-21 块标题行对齐批——会话标题常显 · `docs/cli/design/TUI.md` §7.4）：状态段簇尾
  // （ledgerHint 后、键位组前）；取值 = `agent.title` 活读（每帧 recompute）· 40 列截断。
  // B6 消（#677）：空白 ⇒ 回退链值（对位 VSC 顶栏——生成前 ∕ 失败期两端同值；值逐字，行级超宽走 statusMax）。
  const titleRaw = typeof agent.title === "string" ? singleLineTitle(agent.title).trim() : ""
  const titleShown = titleRaw ? (stringWidth(titleRaw) > 40 ? sliceByWidth(titleRaw, 39) + "…" : titleRaw) : sessionTitleFallback(agent)
  const titleHint = ` │ ${titleShown}`
  // 团队登录态段（登录面补全批 · `docs/cli/design/TUI.md` §7.8）：簇尾末位（titleHint 后、`│ <enterHint>` 前）
  const teamHint = teamSegmentHint(state.team)
  return ` ${statusText}${taskHint}${turnHint}${tokenHint}${ctxHint}${scrollHint}${ledgerHint}${timerHint}${titleHint}${teamHint} │ ${enterHint} │ /: commands │ wheel/PgUp/PgDn: scroll │ Ctrl+I: inject │ Ctrl+C: exit (×2)`
}

/** 团队状态段（TUI.md §7.8——三态闭集）：未登录 ⇒ `""`（**负控：零注入——整行逐字节等价**）；
 *  已登录 ⇒ ` │ <成员>@<主机>`（成员 = `member.name ?? member.username`；主机 = `URL.host`——不搬
 *  URL 全串）；`verify === "invalid"` ⇒ ` │ ` + 核字典键词形（警示色包裹——同 timerHint 到期态形；
 *  `t()` 出词 ⇒ CLI 现渲缺省 en，沿 §7.7 同注）。成员 ∥ 主机两缺 ⇒ 零注入（防御位——不产空段）。 */
function teamSegmentHint(team) {
  if (team == null || team.loggedIn !== true) return ""
  if (team.verify === "invalid") return ` │ ${ansi.reset}${C.warn}${t("status.team.invalid")}${ansi.reset}${ansi.dim}`
  const member = team.member?.name ?? team.member?.username ?? ""
  const host = teamServerHost(team.server)
  const text = member !== "" && host !== "" ? `${member}@${host}` : (member !== "" ? member : host)
  return text === "" ? "" : ` │ ${text}`
}

/** 团队服务器主机名（段面只显 `<主机>`）：`URL.host`（默认端口已去）；不可解析 ⇒ `""`。 */
function teamServerHost(server) {
  if (typeof server !== "string" || server === "") return ""
  try { return new URL(server).host } catch { return "" }
}
