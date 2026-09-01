/**
 * render-frame.mjs — terminal frame renderer (pure computation, no side effects)
 * Produces an ANSI frame string from state + agent + layout, returns cursor position.
 *
 * Panel render functions are exported individually for incremental rendering
 * (only changed panels are written to the terminal, eliminating flicker on Windows).
 * The legacy renderFrame() wrapper is kept for compatibility.
 */
import { ansi, C, ESC } from "./ansi.mjs"
import { convCacheKey, renderConversation, countConvLines } from "./render-conversation.mjs"
import { sliceByWidth, stringWidth } from "./render.mjs"
import { providerSpec } from "../config.mjs"
import { computeLayout, subagentVisibleLines } from "./layout.mjs"
import { basename } from "node:path"
import { readFileSync } from "node:fs"

export { convCacheKey, renderConversation, countConvLines } from "./render-conversation.mjs"

// Module-load read, once per process (same pattern as cmd-upgrade.mjs): the
// header shows the installed version next to the logo (user request 2026-08-31).
const THINCODER_VERSION = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")).version

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

// ====================================================================
// Panel render functions (exported for incremental rendering)
// Each returns string[] — one element per screen row, ANSI-colored,
// WITHOUT \x1b[K (clear-line) or cursor positioning (added by caller).
// ====================================================================

/** Header panel (always 1 line). */
export function renderHeader(agent, cols) {
  // 2026-09-02 Q1（SESSION.md §8）：provider 可为 null（无效 provider 被清空后用户 Esc 取消重选）
  // —— 可选链守卫，头部显示 "no provider" 占位
  const model = agent.provider?.model ?? "no provider"
  // providerSpec（PROVIDER.md §15）：模型信息显示跟随 provider 级 context 覆盖（D-C5）；
  // provider 为 null 时返回默认 spec 且不产生 "no provider" 查表警告（specForModel("") 空串不告警）
  const spec = providerSpec(agent.provider)
  const thinkOnValue = spec.thinkEnabledValue ?? "enabled"
  const t = agent.provider?.thinking
  const effort = agent.provider?.reasoningEffort
  const thinkBadge = t?.type === "disabled" ? "│ think: off"
    : effort ? `│ think: ${effort}`
    : t?.type === thinkOnValue ? "│ think: on" : ""
  return `${ansi.bold}${C.tool} ThinCoder ${ansi.reset}${ansi.dim}${THINCODER_VERSION} │ ${sliceByWidth(model, 30)}${thinkBadge ? " " + thinkBadge : ""} │ ${sliceByWidth(basename(agent.cwd), Math.max(10, cols - 60))}${ansi.reset}`
}

/** Todo/task panel. Returns empty array when no tasks visible. The first row is
 *  a divider line separating the panel from the conversation above it (user
 *  request 2026-08-30). */
export function renderTodo(visibleTasks, cols) {
  const divider = `${C.dim}${"─".repeat(Math.max(1, cols - 1))}${ansi.reset}`
  return [divider, ...visibleTasks.map((t) => {
    const mark = t.status === "done" ? "✓" : t.status === "in_progress" ? "▶" : "○"
    const color = t.status === "done" ? `${C.dim}${ESC}[9m` : t.status === "in_progress" ? C.tool : C.text
    return `${color} ${mark} ${sliceByWidth(t.title, cols - 4)}${ansi.reset}`
  })]
}

/** Permission preview panel. Returns empty when no permission request. */
export function renderPermission(permPreviewLines) {
  if (permPreviewLines.length === 0) return []
  return [`${ansi.bold}${C.warn}❯ Permission Request${ansi.reset}`, ...permPreviewLines.map((w) => `${C.warn}${w}${ansi.reset}`)]
}

/** Queue preview (1 line when queue has items during processing). */
export function renderQueue(state, W) {
  if (state.queue.length === 0 || !state.processing) return ""
  const preview = sliceByWidth(state.queue[0].text, W - 20)
  return `${C.dim}❯ Queue: ${state.queue.length} pending${state.queue.length > 1 ? ` (next: ${preview}…)` : ` (next: ${preview})`} — Ctrl+D delete │ Ctrl+I inject${ansi.reset}`
}

/** Picker/wizard overlay panel. Returns empty when no overlay. */
export function renderPicker(state, cols, panel, overlay) {
  if (!panel || !overlay) return []
  const out = []
  const winH = panel.h - 1
  const total = overlay.lines.length
  const start = Math.max(0, Math.min(overlay.scroll, Math.max(0, total - winH)))
  const shown = overlay.lines.slice(start, start + winH)
  // 标题行：左侧标题 + 过滤输入提示/内容（截断防撑破帧），右侧位置指示
  const p = state.picker
  const right = p && p.filteredItems?.length ? `${p.index + 1}/${p.filteredItems.length} ` : ""
  // 过滤提示：无filter时显示 "type to filter"，有filter时显示输入内容
  const filterHint = p ? (p.filter ? `│ ${p.filter}` : "│ type to filter") : ""
  const rawLeft = p ? ` ❯ ${p.title} ${filterHint} ` : " ❯ Setup "
  // 2026-08-31 会诊（advisor round1 🔵）：标题行与条目行一致留 8 格余量——Ambiguous 字符
  // （❯/│ 等）在 CJK 终端渲染 2 格，余量不足时右侧 n/m 位置指示会被截。
  const left = sliceByWidth(rawLeft, Math.max(1, cols - 8 - stringWidth(right)))
  const titlePad = " ".repeat(Math.max(1, cols - 8 - stringWidth(left) - stringWidth(right)))
  out.push(`${ansi.bold}${C.tool}${left}${ansi.reset}${ansi.dim}${titlePad}${right}${ansi.reset}`)
  const hasMoreAbove = start > 0
  const hasMoreBelow = start + winH < total
  for (let i = 0; i < shown.length; i++) {
    const l = shown[i]
    // 可视窗上方/下方有更多内容时，在首行/末行右侧给 dim 提示；单行窗口两个方向都有则合并指示
    const moreAbove = i === 0 && hasMoreAbove
    const moreBelow = i === shown.length - 1 && hasMoreBelow
    const ind = moreAbove && moreBelow ? "↑↓ more" : moreAbove ? "↑ more" : moreBelow ? "↓ more" : ""
    // 2026-08-31 会诊：右边距留 8 格余量——Ambiguous 宽度字符（│/—/●/▸/…/↑↓ 等）在中文
    // locale 终端渲染 2 格而 stringWidth 按 1 格算，/session 行最坏带 ~7 个（▸ 前缀 +
    // │×3 + … + — + ●）→ 行宽低估 7+ 格 → 实际超宽 → 物理 wrap → 残影；8 格余量覆盖
    // 常见低估，最坏残余由 DECAWM 关闭硬截断兜底（见 render-loop）。
    const maxW = cols - 8 - (ind ? stringWidth(ind) + 1 : 0)
    // 超宽行截断并加省略号
    const text = stringWidth(l.text) > maxW ? sliceByWidth(l.text, Math.max(0, maxW - 1)) + "…" : l.text
    const pad = ind ? " ".repeat(Math.max(1, cols - 8 - stringWidth(text) - stringWidth(ind))) : ""
    out.push(`${l.color}${text}${ansi.reset}${ind ? `${ansi.dim}${pad}${ind}${ansi.reset}` : ""}`)
  }
  for (let i = shown.length; i < winH; i++) out.push("")
  return out
}

/** Input box (border-bounded text entry area). Always visible. */
/**
 * Render the input box. When inputLayout is provided, renders a visual cursor
 * (SGR reverse video) so the hardware cursor can stay hidden at all times,
 * matching pi-tui's approach.
 */
export function renderInputBox(state, W, boxLines, cols, inputLayout, inputOffset) {
  const { borderColor, title } = inputBoxStyle(state)
  let topBorder
  if (title === " Input " || title === " Question " || title === " Inject Message " || title === " Processing... ") {
    const parts = []
    if (title === " Input " || title === " Processing... ") parts.push(" Ctrl+U clear ")
    if (title === " Question ") parts.push(" Enter submit ")
    if (title === " Inject Message ") parts.push(" Enter send, Esc cancel ")
    parts.push(" Shift+Enter / Ctrl+J newline ")
    parts.push(" Ctrl+V paste ")
    parts.push(" Ctrl+I inject ")
    const hint = parts.join("")
    topBorder = `╭─${title}${"─".repeat(Math.max(0, W - 4 - stringWidth(title) - stringWidth(hint)))}${hint}─╮`
  } else {
    topBorder = `╭─${title}${"─".repeat(Math.max(0, W - 3 - stringWidth(title)))}╮`
  }
  const out = [`${borderColor}${topBorder}${ansi.reset}`]

  // Visual cursor position in the input box (hardware cursor stays hidden)
  const hasOverlay = state.permission || state.question || state.picker || state.wizard?.step === "provider"
  const curLine = (!hasOverlay && inputLayout) ? inputLayout.cursorLine - (inputOffset ?? 0) : -1
  const curCol = (!hasOverlay && inputLayout) ? inputLayout.cursorCol : -1

  // Interrupt prompt 空文本占位符：灰色提示用户该做什么
  const isInterruptEmpty = state.interruptPrompt && !state.interruptPrompt.text
  const interruptPlaceholder = "Type message to inject (Enter send, Esc cancel)"

  for (let li = 0; li < boxLines.length; li++) {
    const l = boxLines[li]
    // 第一行且 interrupt prompt 为空时，用灰色占位符替代 prompt
    if (li === 0 && isInterruptEmpty) {
      const prompt = "▸ "
      const ph = `${prompt}${interruptPlaceholder}`
      const phWidth = stringWidth(ph)
      const fill = " ".repeat(Math.max(0, W - 4 - phWidth))
      out.push(`${borderColor}│${ansi.reset} ${ansi.dim}${ph}${ansi.reset}${fill} ${borderColor}│${ansi.reset}`)
      continue
    }
    const original = sliceByWidth(l, W - 4)
    let content = original
    const contentWidth = stringWidth(original)
    let fillLen = W - 4 - contentWidth

    if (li === curLine && curCol >= 0) {
      const beforeWidth = Math.min(curCol, contentWidth)
      const before = sliceByWidth(content, beforeWidth)
      const atIdx = before.length   // character index (not display width — CJK chars diverge)
      const at = content[atIdx] ?? " "
      const after = content.slice(atIdx + 1)
      content = before + `${ansi.reset}\x1b[7m${at}\x1b[27m${ansi.reset}` + after
      // Cursor at end of input: at=[\x20] adds one display column — compensate fill.
      // When fill is already 0 (content fills the line), don't add the extra space at all
      // — instead, move the cursor to the last real character.
      if (atIdx >= original.length) {
        if (fillLen > 0) {
          fillLen = Math.max(0, fillLen - 1)
        } else {
          // No room for extra space: place cursor on last character instead
          const lastIdx = original.length - 1
          if (lastIdx >= 0) {
            const before2 = sliceByWidth(original, stringWidth(original.slice(0, lastIdx)))
            const at2 = original[lastIdx] ?? " "
            content = before2 + `${ansi.reset}\x1b[7m${at2}\x1b[27m${ansi.reset}`
          }
        }
      }
    }
    const fill = " ".repeat(Math.max(0, fillLen))

    out.push(`${borderColor}│${ansi.reset} ${content}${fill} ${borderColor}│${ansi.reset}`)
  }
  out.push(`${borderColor}╰${"─".repeat(Math.max(0, W - 2))}╯${ansi.reset}`)
  return out
}

/** Status bar (always 1 line). */
export function renderStatus(state, agent, cols, slashCommands) {
  const statusLine = buildStatusLine(state, agent, { cols, slashCommands })
  const autoBanner = agent.autoApprove ? `${C.warn} AUTO${ansi.reset}${ansi.dim}│` : ""
  const planBanner = agent.planMode ? `${C.tool} PLAN${ansi.reset}${ansi.dim}│` : ""
  const advisorBanner = agent.config?.advisor?.guard === true ? `${C.advisor} ADVISOR${ansi.reset}${ansi.dim}│` : ""
  const engBanner = agent.config?.agent?.engineering ? `${C.advisor} ENG${ansi.reset}${ansi.dim}│` : ""
  const bannerPrefix = (agent.planMode ? " PLAN│ " : "") + (agent.autoApprove ? " AUTO│ " : "") + (agent.config?.advisor?.guard === true ? " ADVISOR│ " : "") + (agent.config?.agent?.engineering ? " ENG│ " : "")
  const statusMax = cols - 1 - (bannerPrefix ? stringWidth(bannerPrefix) : 0)
  return `${ansi.dim}${planBanner}${autoBanner}${advisorBanner}${engBanner}${sliceByWidth(statusLine, Math.max(10, statusMax))}${ansi.reset}`
}

// ====================================================================
// Frame composition
// ====================================================================

/**
 * Compose the whole screen as a rows array, placing each panel at its
 * layout-computed y coordinate. Single source of truth for what the screen
 * should look like — the render loop diffs these rows against what it last
 * wrote and repaints only changed rows (absolute positioning).
 *
 * @returns {{ rows: string[], cursorRow: number, cursorCol: number, layout: object }}
 */
export function renderRows(state, agent, opts) {
  const cols = opts.cols || 80
  const rows = opts.rows || 24
  const slashCommands = opts.slashCommands ?? []

  const layout = computeLayout(state, { cols, rows })
  const { W, panels, inputLayout, inputOffset, boxLines, visibleTasks, permPreviewLines, overlay, subagentLines } = layout

  const screen = new Array(rows).fill("")
  const put = (y, lines) => {
    for (let i = 0; i < lines.length && y + i < rows; i++) {
      if (y + i >= 0) screen[y + i] = `${lines[i]}\x1b[K`
    }
  }

  put(panels.header.y, [renderHeader(agent, cols)])
  put(panels.conversation.y, renderConversation(state, cols, panels.conversation.h, state.scroll, rows))
  // §7.2.1 D2: running-subagent fixed panel (between conversation and todo) —
  // lines precomputed by layout (subagent-panel.mjs, neutral module), put
  // directly (no double render); absent when no block is running (F6). Lines
  // are objects ({text, color, _foldToggle/_foldBlock…} — mouse hit-testing
  // reads the same array), converted to ANSI strings here like renderTodo.
  if (panels.subagent) {
    // 评审 #4：部分压缩（h < 全长）时保底截断——分隔线 + 末尾区块行（最新活动
    // 优先），与 mouse 命中映射同一几何契约（subagentVisibleLines / subagentLineIndex）。
    put(panels.subagent.y, subagentVisibleLines(subagentLines, panels.subagent.h).map((l) => `${l.color ?? ""}${l.text}${ansi.reset}`))
  }
  if (panels.todo) put(panels.todo.y, renderTodo(visibleTasks, cols))
  if (panels.picker) put(panels.picker.y, renderPicker(state, cols, panels.picker, overlay))
  if (panels.permission) put(panels.permission.y, renderPermission(permPreviewLines))
  if (panels.queue) put(panels.queue.y, [renderQueue(state, W)])
  put(panels.inputBox.y, renderInputBox(state, W, boxLines, cols, inputLayout, inputOffset))
  put(panels.status.y, [renderStatus(state, agent, cols, slashCommands)])

  let cursorRow = 0, cursorCol = 0
  if (!state.permission && !state.question && !state.picker && state.wizard?.step !== "provider") {
    cursorRow = panels.inputBox.y + 1 + (inputLayout.cursorLine - inputOffset) + 1
    cursorCol = 3 + inputLayout.cursorCol
  }

  return { rows: screen, cursorRow, cursorCol, layout }
}

/**
 * Render one frame, returns { frame, cursorRow, cursorCol }.
 * @deprecated Use renderRows + row-diff (render-loop). Kept for tests/legacy callers.
 */
export function renderFrame(state, agent, opts) {
  const { rows, cursorRow, cursorCol } = renderRows(state, agent, opts)
  return { frame: rows.join("\r\n"), cursorRow, cursorCol }
}

// ====================================================================
// Internal helpers (unchanged from original)
// ====================================================================

function inputBoxStyle(state) {
  let borderColor = C.tool
  let title
  if (state.search) {
    borderColor = C.tool; title = ` Search ${state.search.matches.length > 0 ? `(${state.search.index + 1}/${state.search.matches.length})` : state.search.query ? "(no match)" : ""} `
  } else if (state.interruptPrompt) {
    borderColor = C.warn; title = " Inject Message "
  } else if (state.question) {
    borderColor = C.tool; title = " Question "
  } else if (state.permission) {
    borderColor = C.warn
    title = state.permission.name === "continue" ? " Continue? (y/n) "
      : state.permission.batch ? ` Allow ${state.permission.name}? (a/o/n) `
      : ` Allow ${state.permission.name}? (y/n/a) `
  } else if (state.picker) {
    title = " Select "
  } else if (state.wizard) {
    title = " Setup "
  } else if (state.processing) {
    title = " Processing... "
  } else {
    title = " Input "
  }
  return { borderColor, title }
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
    if (state.permission.name === "continue") return " y: continue │ n: stop"
    if (state.permission.batch) return " a: approve all │ o: one by one │ n: deny"
    return " y: approve │ n: deny │ a: approve all (AUTO)"
  }
  if (state.picker) return " type: filter │ ↑↓/PgUp/PgDn: select │ Enter: confirm │ Esc: cancel"
  if (state.wizard) {
    return state.wizard.step === "provider"
      ? " ↑↓: select │ Enter: confirm │ Esc: skip"
      : " Type then Enter │ Esc: cancel"
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
  const statusText = state.processing ? `${state.status}${toolHint}${elapsed}` : state.status
  // 2026-09-02 Q1（SESSION.md §8）：provider 可为 null —— providerSpec(null) 保守 128K 不抛错
  // 2026-09-02 §15：context 窗口跟随 providers[].context 覆盖（T-C6——百分比基于覆盖后的窗口）
  const modelContext = providerSpec(agent.provider).context
  const ctxPct = Math.round((state.ctxCache.tokens / modelContext) * 100)
  const ctxTokensHint = state.ctxCache.tokens > 0 ? ` ${fmtK(state.ctxCache.tokens)}` : ""
  const ctxHint = ctxPct > 0
    ? ctxPct >= 80 ? ` │ ${ansi.reset}${C.warn}context ${ctxPct}%${ctxTokensHint}${ansi.reset}${ansi.dim}` : ` │ context ${ctxPct}%${ctxTokensHint}` : ""
  const queueHint = state.queue.length > 0 ? ` │ queue: ${state.queue.length}` : ""
  return ` ${statusText}${taskHint}${turnHint}${tokenHint}${ctxHint}${queueHint}${scrollHint} │ Enter: send${state.processing ? " (queue)" : ""} │ /: commands │ wheel/PgUp/PgDn: scroll │ Ctrl+I: inject │ Ctrl+C: exit (×2)`
}
