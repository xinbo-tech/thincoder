import { homedir } from "node:os"
import { resolve } from "node:path"
import { listSlots, ledgerHealth } from "@thincoder/core/session.mjs"
import { stripAtRefs } from "@thincoder/core/file-refs.mjs"
import { ansi, C } from "./ansi.mjs"
import { describeToolArgs, toolArgsLines } from "./tool-args.mjs"
import { slimToolResultForDisplay } from "./tool-events.mjs"
import { countConvLines } from "./render-conversation.mjs"
// TUI-OOM-ROOTCAUSE（TUI-SESSION-VIEW.md §5.3/§5.4）：恢复/翻页行过额度 + state.lines 总量对账。
import { capLine, accountLine, accountAll, releaseLine, syncLineBudget } from "./display-budget.mjs"
import { shiftFreezeAnchors } from "./subagent-blocks.mjs"
// #726 记录分支承载（痕行文案 live∥重建同调 ∥ 跨页回扫 ∥ subagent 合成件）
import { digestTraceLines, resolveSplitTerminalNs, resolvedStartN, synthSubTask } from "./lifecycle-records.mjs"

/** Lazy history window (parity with VS Code HISTORY_PAGE_SIZE): first paint loads
 *  the latest INITIAL_HISTORY_MESSAGES, then PgUp-at-top loads HISTORY_PAGE_MESSAGES
 *  more. Rebuilding an 8000-message session eagerly froze startup + first render. */
export const INITIAL_HISTORY_MESSAGES = 200
export const HISTORY_PAGE_MESSAGES = 20

/**
 * Convert history[startIdx, endIdx) into conversation source lines (label lines
 * with a leading blank separator, content lines, tool summaries). `history` is the
 * FULL array so the tool-result lookahead (history[i+1]) works across the page edge.
 */
export function historyToLines(history, startIdx, endIdx) {
  const lines = []
  // 痕行复列 = 全量（本批 2026-10-01 · 台账 #768 自然形跟正）：逐记录出（记录序 ≡ 恢复序——零截点；
  // 未结末轮照现——沿现行口径）。
  // Cross-page turn state: if the message BEFORE this page is a tool/assistant,
  // the page starts mid-turn and must NOT emit a fresh "❯ ThinCoder:" label
  // (a turn gets ONE label in the live run; history stores one assistant
  // message per LLM call, so a multi-call turn would otherwise paint a label
  // on every segment — the reported "why so many ❯ ThinCoder:" bug).
  let inTurn = false
  if (startIdx > 0) {
    const prev = history[startIdx - 1]
    inTurn = prev?.role === "assistant" || prev?.role === "tool"
  }
  for (let i = startIdx; i < endIdx; i++) {
    const m = history[i]
    if (m.role === "user") {
      if (typeof m.content === "string" && m.content.startsWith("[System reminder:")) continue
      // Label only when there is something to show: multimodal user messages
      // (content = [text, image] array, injected after read_image) render NO
      // text on restore — the image is invisible to the terminal and the user
      // just saw it live. A label with no content under it is noise (user
      // report 2026-08-30: stray "❯ You:" after the read_image block).
      // B5 消（#677 · 跨线清零批）：恢复面剥离——注入展开文 → `@原文`（核单源 `stripAtRefs`，零第二实现；
      // 手打 `[File: x]` 形近文本零误伤 = 核件 fail-closed 判据——与 VSC `panel-session.mjs` 同款逆变换）。
      const userText = typeof m.content === "string"
        ? stripAtRefs(m.content)
        : (Array.isArray(m.content) ? stripAtRefs(m.content.find((p) => p?.type === "text")?.text ?? "") : "")
      const displayable = typeof m.content === "string" ? !!m.content : !!(userText && userText.trim())
      if (!displayable) continue
      if (lines.length > 0) lines.push({ text: "", color: C.dim })
      lines.push({ text: "❯ You:", color: ansi.bold + C.user })
      if (userText) lines.push({ text: userText, color: C.text, _kind: "text" })
      inTurn = false
    } else if (m.role === "assistant") {
      if (!inTurn) {
        // Turn start — the only place the assistant label is emitted.
        if (lines.length > 0) lines.push({ text: "", color: C.dim })
        lines.push({ text: "❯ ThinCoder:", color: ansi.bold + C.assistant })
      }
      inTurn = true
      // Reasoning restored as ONE C.reason line entry — the exact shape
      // flushStream produces live (single line, full string, no indent), so
      // buildConvLines treats restored thinking IDENTICALLY: >12 wrapped rows
      // fold under the named "▶ thinking" header, short fragments stay visible
      // — same thresholds, same label, both paths. (History: restored thinking
      // used to be split into dim fragments — the consecutive-dim rule's >8
      // threshold never fired on short agentic thinking bursts, so restored
      // sessions showed every fragment unfolded and mislabeled "tool output";
      // user reported thinking "no longer folds" after a restart, 2026-08-30.)
      const reasoning = m.reasoning_content ?? m.reasoning
      if (typeof reasoning === "string" && reasoning.trim()) lines.push({ text: reasoning, color: C.reason, _kind: "thinking" })
      if (typeof m.content === "string" && m.content) lines.push({ text: m.content, color: C.text })
      for (const tc of m.tool_calls ?? []) {
        const toolResult = history[i + 1]
        const hasResult = toolResult?.role === "tool" && toolResult?.tool_call_id === tc.id
        const tcName = tc.function?.name ?? "?"
        // Tool arguments are part of the visible conversation (2026-08-30 user
        // report: restored sessions showed no args at all — the deprecated
        // display snapshot made historyToLines the ONLY restore path, and it
        // never rendered arguments). Header line = readable key-args summary
        // (describeToolArgs, vscode card-header parity); full pretty JSON rides
        // below as dim lines, auto-folded by the consecutive-dim rule exactly
        // like the restored tool result — same convention, same readability.
        let argsSummary = ""
        let argJson = []
        let rawArgs = null
        try {
          const args = JSON.parse(tc.function?.arguments || "{}")
          argsSummary = describeToolArgs(tcName, args)
          argJson = toolArgsLines(args)
        } catch { rawArgs = String(tc.function?.arguments ?? "").slice(0, 120) /* malformed — raw fallback */ }
        // ONE BLOCK PER TOOL CALL — same carrier the live path emits (user
        // ruling 2026-08-30): header=name+args, body=args JSON + result.
        // Same carrier the live path emits — identical fields, so buildConvLines
        // renders both through one code path (line-level parity by construction).
        lines.push({
          text: "", color: C.tool,
          _kind: "tool",
          _toolBlock: {
            name: tcName,
            roundTag: "",
            argsSummary,
            argsJson: rawArgs ? [rawArgs] : argJson,
            output: [],
            result: hasResult ? slimToolResultForDisplay(String(toolResult.content)) : null,
            summary: null,
            started: 0,
            done: true,
            elapsed: null,
          },
        })
      }
    } else if (m.kind === "digest") {
      // #726 记录分支：痕行逐条复列（文案 = lifecycle-records 单一实现——与活流同算式）；
      // **本批 2026-10-01（台账 #768 自然形跟正）**：复列 = **全量**（记录序 ≡ 恢复序——零截点；
      // 未结末轮照现——沿现行口径）；
      // end 的 `n` 解析序 = 预解析注记（跨页回扫产物）→ 页内（含 ±1 页沿）回扫。
      const startN = m.status === "end" ? resolvedStartN(history, i) : null
      lines.push(...digestTraceLines(m, startN))
    } else if (m.kind === "subagent") {
      // #726 记录分支：归档快照 ⇒ 冻结载体行 + 合成件（渲染端零改消费）；#790：行文取值同源自合成件 `key`
      const frozen = synthSubTask(m) // 读面已剥 `sub:` 前缀——显示 = 本地无前缀形（与活流冻结载体同形）
      lines.push({ text: `subagent activity: ${frozen.key}`, color: C.dim, _frozenSubTask: frozen })
    }
  }
  return lines
}


/**
 * Lazy-restore a session into state.lines: materialize only the latest
 * INITIAL_HISTORY_MESSAGES, set the _history* counters the loadOlder closure
 * reads, and prepend the "… N more earlier messages" placeholder. Shared by
 * startup restore and /session switching (the display snapshot is deprecated).
 * TUI-OOM-ROOTCAUSE（SESSION.md §6.14）：desc = `{ history, total, base? }`——
 * history = 尾窗（≤200，含 ±1 页沿头一条——跨页回标判定用；不渲染）、total = 绝对总条数
 * （「N messages」标签口径）、base = history[0] 的绝对序号（缺省由 total − len 推导）。
 */
export function restoreLines(state, desc) {
  const window = Array.isArray(desc?.history) ? desc.history : (Array.isArray(desc) ? desc : [])
  const total = Number.isFinite(desc?.total) ? desc.total : window.length
  if (window.length === 0 || total === 0) return
  const base = Number.isFinite(desc?.base) ? desc.base : Math.max(0, total - window.length)
  // 已载入量 = 渲染窗口大小（±1 页沿头一条不计数），绝对起点 = total − loaded
  const loaded = Math.min(INITIAL_HISTORY_MESSAGES, total)
  const start = total - loaded
  state._lineIdCounter = state._lineIdCounter ?? 0
  // #726 终态行 `n` 预解析（跨页分裂 ⇒ 存储回扫——调用面持有存储读口；页内直用者零回扫）
  resolveSplitTerminalNs(window, base, state._agent?._recordStore)
  const fresh = historyToLines(window, Math.max(0, start - base), window.length)
  for (const l of fresh) l.text = capLine(l.text) // 行额度（§5.3 恢复行过 capText）
  // Stable per-line ids (P1, 2026-08-30): fold keys for tool blocks derive from
  // _lineId so loadOlder's head-unshift cannot re-bind an expanded block to a
  // different tool (positional tool-{i} keys drift under unshift).
  for (const l of fresh) l._lineId = ++state._lineIdCounter
  state.lines.push(...fresh)
  state._historyLoaded = loaded
  state._historyTotal = total
  state._hasOlder = start > 0
  if (state._hasOlder) {
    state.lines.unshift({ text: `… ${start} more earlier messages (PgUp at top to load)`, color: C.dim })
  }
  accountAll(state) // 行集重建 → 总量直算重对账（§5.4）
  syncLineBudget(state, { onTrim: (st, n) => shiftFreezeAnchors(st, n) })
}
/** 懒加载更早历史（2026-08-31 用户约定："滚动到头自动加载"——滚轮/PgUp 到顶皆触发；
 *  2026-08-31 前只挂 PgUp 键 = 违约，滚轮到头无反应）。加载后滚动补偿保持锚定。
 *  2026-09-03 D-S1b 自 index.mjs 迁入（startup 职责本含懒加载历史窗口——TUI.md §1 归属修复）：
 *  调用方（index.mjs）= stdin data 滚轮分支 + createKeyHandler ctx（PgUp 分支）。
 *  ctx: { agent, state, render } */
export function createLoadOlder({ agent, state, render }) {
  return () => {
    if (!state._hasOlder) return
    // 翻页锚 = 恢复时点 total（state._historyTotal）——活消息增长不再使页码漂移
    // （§6.14 事实 4 顺带修复）。
    const total = state._historyTotal ?? 0
    const loaded = state._historyLoaded
    const start = Math.max(0, total - loaded - HISTORY_PAGE_MESSAGES)
    const end = total - loaded
    if (start >= end) return

    const d = state.dims ? state.dims.get() : {}
    const cols = d.cols ?? ((state.dims?.get() ?? {}).cols ?? (process.stdout.columns || 80))
    const before = countConvLines(state, cols, d.rows ?? (process.stdout.rows || 24))

    if (state.lines[0]?.text?.startsWith("… ")) releaseLine(state, state.lines.shift()) // 移除必出账（§5.5 记账口径——releaseLine 同额负向）
    state._lineIdCounter = state._lineIdCounter ?? 0
    // 页源（§6.14）：绑定态 → store.page 绝对区间 + ±1 页沿（页前一消息供跨页回合
    // 标签判定、页后一消息供 tool_result 配对）；未绑定（模式 F）→ 内存全量数组回退。
    const store = agent._recordStore
    let older
    if (store?.page) {
      const { messages, base } = store.page(start, end, { margin: 1 })
      // #726 终态行 `n` 预解析（页内（含 ±1 页沿）缺席本轮 start ⇒ 存储回扫）
      resolveSplitTerminalNs(messages, base, store)
      older = historyToLines(messages, Math.max(0, start - base), Math.min(messages.length, end - base))
    } else {
      older = historyToLines(agent._fullHistory ?? [], start, end)
    }
    for (const l of older) l.text = capLine(l.text) // 行额度（§5.3 翻页行过 capText）
    for (const l of older) l._lineId = ++state._lineIdCounter
    state.lines.unshift(...older)
    for (const l of older) accountLine(state, l)
    state._historyLoaded += end - start
    state._hasOlder = start > 0
    if (state._hasOlder) {
      const ph = { text: `… ${start} more earlier messages (scroll to top to load)`, color: C.dim }
      state.lines.unshift(ph)
      accountLine(state, ph)
    }
    // 页内不裁头（保锚定）——§5.3：总量的裁头由 syncLineBudget 兜（此处只对账字符预算）
    syncLineBudget(state, { onTrim: (st, n) => shiftFreezeAnchors(st, n) })

    const after = countConvLines(state, cols, (state.dims?.get() ?? {}).rows ?? (process.stdout.rows || 24))
    state.scroll += Math.max(0, after - before)
    render()
  }
}

/** Startup screen + session recovery + background indexing.
 *  Extracted from index.mjs.
 *  ctx: { agent, state, opts, pushLine, pushLabel, render, startWizard } */
export function showStartup(ctx) {
  const { agent, state, opts, pushLine, pushLabel, render, startWizard } = ctx

  // Startup screen
  // 2026-09-02 Q1（SESSION.md §6.8 D-S2）：provider 可为 null（无效 provider 被清空后用户 Esc 取消重选）
  // —— 可选链守卫；`!apiKey` 触发既有 wizard（其 provider 菜单列出已存在 providers，可选中恢复，F3）
  if (!agent.provider?.apiKey) {
    pushLabel(`Welcome to ThinCoder!`, ansi.bold + C.tool)
    pushLine("No API key configured yet — entering initial setup (Esc to skip anytime)", C.text)
    startWizard()
  } else {
    pushLine(`Welcome to ThinCoder. Provider: ${agent.activeProvider} / ${agent.provider?.model ?? "(none)"}`, C.dim)
  }
  pushLine(`Tools: ${agent.tools.map((t) => t.name).join(", ")}`, C.dim)

  // R25（F-R25c）：上次运行异常终止提示——bin 入口扫描 crash-reports（24h 窗）经
  // startTUI opts.crashNotice 传入——无匹配为 undefined → 不提示（负例）
  if (opts.crashNotice) pushLine(opts.crashNotice, C.warn)

  // Recover previous session: rebuild from history (lazy — display snapshot is
  // deprecated; it drifted out of sync with history on VS Code writes).
  if (opts.restored?.history?.length) {
    restoreLines(state, opts.restored)
    // 「N messages」标签口径 = total（§6.14——非窗口长度）
    const total = Number.isFinite(opts.restored.total) ? opts.restored.total : opts.restored.history.length
    pushLabel(`── Restored previous session (${total} messages); /new for a fresh session ──`, C.warn)
  }

  // Hint when multiple sessions exist
  const allSlots = listSlots(agent.cwd)
  if (allSlots.length > 1) {
    pushLine(`Tip: ${allSlots.length} sessions — /session to view/switch`, C.dim)
  }
  // F-L4（账本可靠批 · SESSION.md §6.25 判据句 4）：账本异常警示行——**不继承** `allSlots.length > 1`（单 / 零会话项目同样在场）；正常 ⇒ 零行。
  const lh = ledgerHealth(agent.cwd)
  if (lh.refused > 0 || lh.scene) pushLine(`会话账本异常（${lh.refused > 0 ? lh.lastReason : "scene"}）——打开会话即自动补回${lh.scene ? "；损坏现场档保留 30 天" : ""}`, C.warn)
  render()
}

/** home 根防护（#867 · `MEMORY.md` §6.14 L-④）：`cwd` = 用户主目录（resolve 后；win32 大小写不敏感）。 */
const isHomeDir = (dir) => typeof dir === "string" && dir !== "" &&
  (process.platform === "win32" ? resolve(dir).toLowerCase() === resolve(homedir()).toLowerCase() : resolve(dir) === resolve(homedir()))

/** Background indexing (runs after startup screen, non-blocking); progress shown in status bar, not conversation.
 *   Prefers git diff incremental (fast); falls back to full scan when git is unavailable or on first run. */
export async function backgroundIndex(ctx) {
  const { agent, state, render, pushLine } = ctx
  const cwd = agent.cwd
  if (isHomeDir(cwd)) { // #867：home 根 ⇒ 跳过索引（三 sync 零调用；不阻断启动）
    pushLine("[index] Skipped: working directory is the home directory — start in a project dir (or declare index.excludePaths to narrow scope)", C.warn)
    return
  }
  const { codeSync, docSync, gitSync } = await import("@thincoder/core/memory.mjs")
  let codeFiles = 0, docFiles = 0

  state.status = "Indexing..."
  render()

  const gitRes = await gitSync(agent.memory, cwd, {
    onProgress: (p) => {
      if (p.phase === "index" && p.current % 5 === 0) {
        state.status = `Indexing... ${p.current}/${p.total}`
        render()
      }
    }
  })

  if (gitRes !== null) {
    // Git incremental succeeded, count directly
    codeFiles = agent.memory.db.prepare(`SELECT COUNT(DISTINCT path) AS n FROM code_chunks`).get()?.n ?? 0
    docFiles = agent.memory.db.prepare(`SELECT COUNT(DISTINCT path) AS n FROM doc_chunks`).get()?.n ?? 0
  } else {
    // Fall back to full scan (codeSync and docSync in parallel — read/write different tables, SQLite WAL supports this natively)
    const [codeRes, docRes] = await Promise.allSettled([
      codeSync(agent.memory, cwd, {
        onProgress: (p) => {
          if (p.phase === "index" && p.current % 30 === 0) {
            state.status = `Indexing code... ${p.current}/${p.total}`
            render()
          }
        }
      }),
      docSync(agent.memory, cwd, {
        onProgress: (p) => {
          if (p.phase === "index" && p.current % 10 === 0) {
            state.status = `Indexing docs... ${p.current}/${p.total}`
            render()
          }
        }
      }),
    ])
    if (codeRes.status === "fulfilled") {
      codeFiles = agent.memory.db.prepare(`SELECT COUNT(DISTINCT path) AS n FROM code_chunks`).get()?.n ?? 0
    }
    if (docRes.status === "fulfilled") {
      docFiles = agent.memory.db.prepare(`SELECT COUNT(DISTINCT path) AS n FROM doc_chunks`).get()?.n ?? 0
    }
  }

  state.status = codeFiles || docFiles
    ? `Ready — idx code ${codeFiles} doc ${docFiles}`
    : "Ready"
  render()
}
