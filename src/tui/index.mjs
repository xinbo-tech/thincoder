/**
 * tui.mjs — bare ANSI terminal UI
 * Zero dependencies: raw mode keyboard input, ANSI escape rendering, custom wide-char wrapping.
 * Layout: header / conversation (scrollable) / todo panel (when tasks exist) / input box / status bar.
 *
 * Large logic blocks extracted to independent modules:
 *   agent-turn.mjs    — agent loop + callback construction
 *   render-loop.mjs  — frame scheduler + incremental panel rendering
 *   startup.mjs       — startup screen + session restore + background indexing
 *   interaction.mjs   — permission approval + Q&A
 *   pickers.mjs       — generic list picker + model picker
 *   wizard.mjs        — first-launch config wizard
 *   slash-commands.mjs — slash command dispatch
 *   config-helpers.mjs — persistRaw / syncProviderField / maskKey
 *   clipboard.mjs     — clipboard image paste
 *   distill-cmd.mjs   — /distill command
 */

import { emitKeypressEvents } from "node:readline"
import { PassThrough } from "node:stream"
import { saveSession } from "../session.mjs"
import { closeAllMcp } from "../mcp.mjs"
import { ansi, C } from "./ansi.mjs"
import { createRenderLoop } from "./render-loop.mjs"
import { makeDimsState } from "./dims.mjs"
import { SLASH_COMMANDS, SLASH_ALIASES, createSlashCommands } from "./slash-commands.mjs"
import { createWizard } from "./wizard.mjs"
import { writeStartupSequence, createExitCleanup } from "./tui-lifecycle.mjs"
import { createPickers } from "./pickers.mjs"
import { runDistill as runDistillImpl } from "./distill-cmd.mjs"
import { createInteraction } from "./interaction.mjs"
import { pasteClipboardImage as pasteClipboardImageImpl, insertPastedText, translateShiftEnter, stripKeyboardProtocol } from "./clipboard.mjs"
import { parseMouseClicks, handleMouseClick, handleWheel } from "./mouse.mjs"
import { runAgentTurn } from "./agent-turn.mjs"
import { createKeyHandler, convMaxScroll } from "./key-handler.mjs"
import { showStartup, backgroundIndex, historyToLines, HISTORY_PAGE_MESSAGES } from "./startup.mjs"
import { countConvLines } from "./render-conversation.mjs"
import { shiftFreezeAnchors } from "./subagent-blocks.mjs"
import { createConfigHelpers } from "./config-helpers.mjs"

/** 升级失败提示文案：附 npm 输出尾部（最多 3 行），方便定位失败原因。 */
export function upgradeFailureText(code, output) {
  const tail = (output ?? "").trimEnd().split("\n").slice(-3).join("\n")
  return `✗ Upgrade failed (exit ${code}). Run \`thincoder upgrade\` manually.${tail ? `\n${tail}` : ""}`
}

/** 后台更新提示可弹出的条件：无任何交互弹层（picker/permission/question）激活。 */
export function pendingNoticeReady(state) {
  return Boolean(state.pendingNotice && !state.picker && !state.permission && !state.question)
}

/**
 * SESSION.md §8 D-S2 — TUI 启动首帧前的 provider 重选流程：
 * provider 无效（`_providerInvalid` 标记或 provider 为 null）→ 先弹模型选择 picker
 * （复用 openModelPicker，展示当前可用 providers）；用户选定后继续正常启动。
 * 选择取消（Esc）→ 仍进入 TUI，推送提示行（"未配置有效 provider，可用 /model 选择或
 * /provider 配置"）——绝不因无 provider 拒绝进入。返回 true 表示弹过选择流程。
 */
export async function promptProviderIfInvalid(agent, openModelPicker, pushLine) {
  if (!(agent._providerInvalid || !agent.provider)) return false
  await openModelPicker()
  if (!agent.provider) {
    pushLine("未配置有效 provider，可用 /model 选择或 /provider 配置", C.warn)
  }
  return true
}

/**
 * Start the TUI, taking over the terminal until exit.
 * agent: return value of createAgent
 * opts: { projectDir?, team?, author? } — used by /distill when writing to project/team layers
 */
export async function startTUI(agent, opts = {}) {
  if (!process.stdin.isTTY) {
    throw new Error("TUI requires a TTY; use 'thincoder chat' for non-interactive use")
  }

  const distillOpts = opts

  // Capture terminal dimensions BEFORE raw mode & alt buffer switch as the
  // state.dims seed (ConPTY reads are unstable: falsy at startup, stale-small
  // during output activity). Refresh happens ONLY in event hooks — startup
  // convergence retry, the 300ms delayed resample, resize events, the idle
  // watchdog, agent-turn finally — never in the render path (2026-08-30).
  const startupCols = process.stdout.columns || 80
  const startupRows = process.stdout.rows || 24

  const state = {
    lines: [], // conversation lines: { text, color }
    streaming: "", // current streaming buffer
    _advisorBlocks: [], // advisor ordered blocks: [{ kind: "think"|"text", text }] — preserves emission order (think ↔ tool interleaving)
    input: [], // input buffer (codepoint array)
    cursor: 0,
    history: [],
    historyIndex: -1,
    _draft: null, // stashed unsent input while navigating history (restored on down past newest)
    scroll: 0, // scroll lines from bottom upward
    _foldScroll: new Map(), // 2026-08-31 块内滚动：foldKey → 窗口 offset（展开块 ▲▼ 翻窗）
    _followTail: true, // 2026-08-31 流式跟随：渲染前 scroll=0；用户上滚暂停、到底/新消息恢复
    processing: false,
    controller: null, // AbortController for current agent run
    permission: null, // { name, args, resolve }
    permissionPreview: [], // content preview lines for permission approval (rendered above input box, without separation)
    question: null, // { text, options, resolve } — agent question tool callback
    picker: null, // active picker (stack top) { title, entries, lines, index, scroll, selectedLine, filter }
    pickerStack: [], // picker 栈：showPicker push，Enter/Esc pop；state.picker 始终指向栈顶
    pendingNotice: null, // 后台更新提示：有 picker 打开时挂起，picker 全部关闭后再弹
    wizard: null, // first-launch config wizard { step, index, scroll, selectedLine, fields, error, lines }
    tasks: agent.tasks ?? [], // task list from task tool (progress shown in status bar); carried over on session restore, auto-collapsed when all done
    dims: makeDimsState({ cols: startupCols, rows: startupRows }), // terminal dims single source (Windows ConPTY instability, 2026-08-30) — seeded pre-raw-mode, re-sampled by event hooks only (startup retry / resize / idle watchdog)
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 }, // cumulative token usage (shown in status bar)
    ctxCache: { len: -1, tokens: 0 }, // context utilization estimate cache (estimateTokens is O(n), only recompute when history grows)
    reasoning: "", // thinking stream buffer (dimmed display)
    completion: null, // Tab completion state { candidates, index }

    subTasks: {}, // sub-agent activity blocks (§7.2 D4): { "coder#1": { key, role, model, started, done, doneAt, blocks: [{kind,text}], currentTool, toolArgs, turn, maxTurns, approval, lastError, dropped, blockEpoch, awaitingDigest（§17 挂起中间态）, _freezeAt（冻结锚点） } } — rendered as collapsible in-conversation blocks; persists across turns (blocks are the child activity's ONLY carrier — child tool calls never enter the parent history); bounded by the N2 500-line per-child ring buffer
    currentTool: null, // currently executing tool name (shown in status bar)
    processingStarted: 0, // current turn start time (status bar timer)
    status: "Ready",
    queue: [], // queued messages while processing: [{ text }], auto-dequeued when current turn finishes
    interruptPrompt: null, // Ctrl+I interrupt message input: { text: "" } or null
    search: null, // Ctrl+F search mode: { query: "", matches: [{lineIndex, charIndex}], index: 0 } or null
    expandedBlocks: new Set(), // block hashes that are expanded (Enter toggles)
    foldEnabled: true, // global fold toggle — /fold on|off
    exitArmed: false, // Ctrl+C double-confirm: first press arms, second (within window) exits
    // Lazy history window (parity with VS Code): only the latest messages are
    // materialized on restore; PgUp-at-top loads earlier pages via loadOlder.
    _historyLoaded: 0, // messages loaded from the TAIL of _fullHistory
    _historyTotal: 0, // total messages in the restored session
    _hasOlder: false, // more earlier messages remain unloaded
  }

  // On session restore, if all tasks are completed, auto-collapse the todo panel (match runtime behavior)
  if (state.tasks.length > 0 && state.tasks.every((t) => t.status === "done")) {
    state.tasks = []
  }

  // Input stream goes through a filter: mouse sequences (scroll wheel) are intercepted and handled here,
  // stripped clean before passing to keypress parsing, preventing sequence fragments (e.g. "64;72;42M")
  // from leaking into the input box
  const keyStream = new PassThrough()
  let mousePending = "" // incomplete mouse sequence tail spanning chunks
  let lastRenderedScroll = 0
  emitKeypressEvents(keyStream)
  process.stdin.setRawMode(true)
  // Keyboard enhancement — enable BOTH protocols (unsupported terminals ignore them):
  // kitty push (\x1b[>1u): Shift+Enter → \x1b[13;2u (Windows Terminal 1.19+, VS Code, kitty, iTerm2)
  // modifyOtherKeys lvl 2 (\x1b[>4;2m): Shift+Enter → \x1b[27;2;13~ (mintty / Git Bash)
  // translateShiftEnter (stdin layer) maps both to \x1b\r → meta+return → multiline branch.
  writeStartupSequence()

  const utf8Decoder = new TextDecoder("utf-8", { fatal: false })

  let pasteMode = false
  let pasteAccum = ""

  /** 懒加载更早历史（2026-08-31 用户约定："滚动到头自动加载"——滚轮/PgUp 到顶皆触发；
   *  2026-08-31 前只挂 PgUp 键 = 违约，滚轮到头无反应）。加载后滚动补偿保持锚定。
   *  外层作用域：data 回调（滚轮分支）与 createKeyHandler ctx（PgUp 分支）共用。 */
  const loadOlder = () => {
    if (!state._hasOlder) return
    const full = agent._fullHistory ?? []
    const loaded = state._historyLoaded
    const start = Math.max(0, full.length - loaded - HISTORY_PAGE_MESSAGES)
    const end = full.length - loaded
    if (start >= end) return

    const d = state.dims ? state.dims.get() : {}
    const cols = d.cols ?? ((state.dims?.get() ?? {}).cols ?? (process.stdout.columns || 80))
    const before = countConvLines(state, cols, d.rows ?? (process.stdout.rows || 24))

    if (state.lines[0]?.text?.startsWith("… ")) state.lines.shift()
    state._lineIdCounter = state._lineIdCounter ?? 0
    const older = historyToLines(full, start, end)
    for (const l of older) l._lineId = ++state._lineIdCounter
    state.lines.unshift(...older)
    state._historyLoaded += end - start
    state._hasOlder = start > 0
    if (state._hasOlder) {
      state.lines.unshift({ text: `… ${start} more earlier messages (scroll to top to load)`, color: C.dim })
    }

    const after = countConvLines(state, cols, (state.dims?.get() ?? {}).rows ?? (process.stdout.rows || 24))
    state.scroll += Math.max(0, after - before)
    render()
  }


  process.stdin.on("data", (chunk) => {
    try {

      let text = mousePending + utf8Decoder.decode(chunk, { stream: true })
      mousePending = ""

    // Bracketed paste: terminal wraps pasted text in \x1b[200~ ... \x1b[201~
    // Route pasted content to the active text target (question answer / input box) in one shot,
    // avoiding slow char-by-char keypress render — see insertPastedText in clipboard.mjs
    if (pasteMode) {
      const endIdx = text.indexOf("\x1b[201~")
      if (endIdx >= 0) {
        pasteAccum += text.slice(0, endIdx)
        pasteMode = false
        const pasted = pasteAccum
        pasteAccum = ""
        if (pasted) {
          insertPastedText(state, pasted)
          render()
        }
        text = text.slice(endIdx + 6)
      } else {
        pasteAccum += text
        return
      }
    }

    // Check for paste start (may appear mid-chunk alongside other input)
    const pasteStartIdx = text.indexOf("\x1b[200~")
    if (pasteStartIdx >= 0) {
      const before = text.slice(0, pasteStartIdx)
      const after = text.slice(pasteStartIdx + 6)
      const endIdx = after.indexOf("\x1b[201~")
      if (endIdx >= 0) {
        // Paste begin and end in the same chunk: insert pasted content directly
        const pasted = after.slice(0, endIdx)
        if (pasted) {
          insertPastedText(state, pasted)
          render()
        }
        text = before + after.slice(endIdx + 6)
      } else {
        // Paste spans multiple chunks: write prefix, enter paste mode
        if (before) keyStream.write(before)
        pasteMode = true
        pasteAccum = after
        return
      }
    }

    // Scroll wheel: \x1b[<64;col;rowM = up, \x1b[<65;col;rowM = down（3 lines each）
    // 2026-08-31：坐标命中展开块内容行 → 块内滚动（handleWheel）；未命中 → 会话滚动（现状）
  // 有意为之：控制字符协议/转义序列剥离正则（ANSI/⟦ev⟧/SGR/history 双线分隔）
    for (const m of text.matchAll(/\x1b\[<(\d+);(\d+);(\d+)([Mm])/g)) {
      const button = Number(m[1])
      if (button === 64 || button === 65) {
        const consumed = handleWheel(mouseCtx(), button, Number(m[2]), Number(m[3]))
        if (!consumed) {
          if (button === 64) {
            state.scroll += 3
            state._followTail = false // 2026-08-31：用户上滚 = 暂停流式跟随（不抢视角）
            // 2026-08-31 用户约定修复：滚动到头自动加载（原来只挂 PgUp 键——违约）
            if (state._hasOlder && state.scroll >= convMaxScroll(state)) loadOlder()
          } else {
            state.scroll = Math.max(0, state.scroll - 3)
            if (state.scroll === 0) state._followTail = true // 滚回底部恢复跟随
          }
        }
      }
    }

    // Left-click: \x1b[<0;col;rowM → picker selection / line action menu
    for (const click of parseMouseClicks(text)) {
      try {
        onMouseClick(click.col, click.row)
      } catch (e) {
        pushLine(`[mouse] ${e.message || e}`, C.error)
        render()
      }
    }

    // Strip complete mouse sequences; keep incomplete tail for reassembly with next chunk
  // 有意为之：控制字符协议/转义序列剥离正则（ANSI/⟦ev⟧/SGR/history 双线分隔）
    text = text.replace(/\x1b\[<\d+;\d+;\d+[Mm]/g, "")
  // 有意为之：控制字符协议/转义序列剥离正则（ANSI/⟦ev⟧/SGR/history 双线分隔）
    const tail = text.match(/\x1b\[<[\d;]*$/)
    if (tail) {
      mousePending = tail[0]
      text = text.slice(0, -tail[0].length)
    }

    // Shift+Enter (keyboard-enhanced terminals) → Alt+Enter path (\x1b\r = meta+return)
    text = translateShiftEnter(text)
    text = stripKeyboardProtocol(text)

    if (state.scroll !== lastRenderedScroll) {
      lastRenderedScroll = state.scroll
      render()
    }
    if (text) keyStream.write(text)
    } catch (e) {
      pushLine(`[input-error] ${e.message || e}`, C.error)
    }
  })

  const cleanup = createExitCleanup({ agent, saveSession, closeAllMcp })
  process.on("exit", cleanup)

  const pushLine = (text, color, kind) => {
    state.lines.push({ text, color, _kind: kind })
    if (state.lines.length > 5000) {
      state.lines.splice(0, 1000)
      state.lines.unshift({ text: `... [earlier messages trimmed — ${state.lines.length} lines remaining]`, color: C.dim })
      // 2026-09-03 修复轮（冻结锚点）：头裁对在途 settled 锚点整体前移（锚点是绝对
      // 流位置）——不校正则池空补发冻结（freezeSubTaskLines splice）落点漂移；校正量
      // = 净位移（裁 1000 补 1 标记行 → −999，code review round1 #3）。
      shiftFreezeAnchors(state, 1000)
    }
    render()
  }

  /** Message block label: blank line + label line. Breathing space between user/assistant messages */
  const pushLabel = (text, color) => {
    if (state.lines.length > 0) state.lines.push({ text: "", color: C.dim })
    state.lines.push({ text, color })
    render()
  }

  // Only emit the assistant label once per turn (on first token or first tool call)
  let assistantLabeled = false
  const ensureAssistantLabel = () => {
    if (!assistantLabeled) {
      assistantLabeled = true
      pushLabel(`❯ ThinCoder:`, ansi.bold + C.assistant)
    }
  }

  // ---------------------------------------------------------- Render

  const renderLoop = createRenderLoop(state, agent,
    { startupDims: { cols: startupCols, rows: startupRows }, SLASH_COMMANDS,
      pendingNoticeReady, get showUpdateNotice() { return showUpdateNotice } },
    pushLine)
  const { render, scheduleRender } = renderLoop

  // Resize events are genuine dimension changes on every terminal (2026-08-31
  // simplification: the earlier settle-timer/double-confirm machinery was built
  // on the misdiagnosed ConPTY-stale hypothesis and even stalled drag-shrink).
  // Any sane sample — larger or smaller — is accepted immediately; the cache
  // self-corrects on the next real resize.
  process.stdout.on("resize", () => {
    try { state.dims.refresh(); render() } catch { /* resize error — ignore */ }
  })

  // ---------------------------------------------------------- Submit

  async function submit() {
    const text = state.input.join("").trim()
    if (!text) return
    state.input = []
    state.cursor = 0
    const wasInHistory = state.historyIndex !== -1
    state.history.push(text) // review #3 fix: single push (was duplicated — every submit appeared twice in ↑/↓ history)
    state.historyIndex = -1
    if (!wasInHistory) state._draft = null // submitted — the draft is now history. Keep draft when submitting from history mode (↓ can recover)
    state.scroll = 0
    state._followTail = true // 2026-08-31 会诊 deepseek：新消息恢复跟随（注释曾承诺、实现缺漏）

    // Slash commands: handled locally, don't enter agent loop
    if (text.startsWith("/")) {
      if (state.processing) {
        // While processing: allowlisted commands execute directly (they only touch
        // local TUI/agent config, never the in-flight turn); the rest are queued
        const cmd0 = text.split(/\s+/)[0].toLowerCase()
        const resolved0 = SLASH_ALIASES[cmd0] ?? cmd0
        const safeDuringProcessing = new Set(["/help", "/exit", "/model", "/submodel", "/shell", "/think", "/config", "/skills", "/mcp", "/goal", "/session"])
        if (safeDuringProcessing.has(resolved0)) {
          await handleSlash(text)
          render()
        } else {
          state.queue.push({ text })
          render()
        }
        return
      }
      await handleSlash(text)
      render()
      return
    }

    // While processing: queue for later, don't execute immediately.
    // The queue panel (renderQueue) already shows pending items — don't also
    // push to the conversation area, or the text scrolls up with streaming tokens.
    if (state.processing) {
      state.queue.push({ text })
      render()
      return
    }

    await turn(text)
  }

  // Interaction primitives: permission approval + Q&A input, implemented in interaction.mjs
  const { askPermission, askQuestion, askBatchPermission } = createInteraction({
    agent, state, pushLine, pushLabel, render, summarize,
  })

  // Clipboard image paste: implemented in clipboard.mjs
  const pasteClipboardImage = () => pasteClipboardImageImpl({ agent, state, pushLine, render })

  // Agent loop: implemented in agent-turn.mjs
  const turnCtx = {
    agent, state, pushLine, pushLabel, render, scheduleRender: render, ensureAssistantLabel,
    askPermission, askQuestion, askBatchPermission, handleSlash: null,
    get assistantLabeled() { return assistantLabeled },
    set assistantLabeled(v) { assistantLabeled = v },
  }
  const turn = (text) => runAgentTurn(turnCtx, text)

  // ---------------------------------------------------------- Slash Commands

  // Config helpers: implemented in config-helpers.mjs
  const { persistRaw, syncProviderField, maskKey } = createConfigHelpers(agent)

  // Model picker + generic picker: implemented in pickers.mjs
  const { closePicker, showPicker, popPicker, renderPickerLines, openModelPicker, selectModel, setProviderKey, pickModelForSlot } = createPickers({
    agent, state, render, ansi, C, pushLine, pushLabel, persistRaw, askQuestion, maskKey,
  })

  // First-launch config wizard: implemented in wizard.mjs, closure deps passed via ctx
  const { startWizard, renderWizard, wizardChooseProvider, wizardSubmitText, cancelWizard, wizardProviderItems } = createWizard({
    agent, state, pushLine, pushLabel, render, persistRaw,
    openModelPicker: () => openModelPicker(),
  })

  // /distill: impl in distill-cmd.mjs, ctx-passed
  const runDistill = () => runDistillImpl({ agent, state, pushLine, render, askPermission, distillOpts })

  // Slash command dispatch + Tab completion: implemented in slash-commands.mjs, closure deps passed via ctx
  const { handleSlash, completions, handleTab } = createSlashCommands({
    agent, state, distillOpts,
    pushLine, pushLabel, render,
    showPicker, closePicker, askQuestion, askPermission,
    persistRaw, syncProviderField, maskKey,
    openModelPicker: () => openModelPicker(),
    selectModel,
    setProviderKey,
    pickModelForSlot,
    runDistill,
    exit: () => { cleanup(); setTimeout(() => process.exit(0), 100) },
  })
  // handleSlash is referenced by turnCtx (circular dep: submit → turn → handleSlash), backfilled here
  turnCtx.handleSlash = handleSlash

  // ---------------------------------------------------------- Keyboard / Mouse

  // keypress is attached to filtered keyStream: mouse sequences already intercepted and stripped upstream
  const onKeypress = createKeyHandler({
    agent, state, render, popPicker, renderPickerLines,
    handleSlash, handleTab, submit, pasteClipboardImage,
    wizardChooseProvider, wizardSubmitText, cancelWizard, wizardProviderItems,
    renderWizard, pushLine, cleanup, showPicker, loadOlder,
  })
  keyStream.on("keypress", (str, key) => {
    try {
      onKeypress(str, key)
    } catch (e) {
      pushLine(`[input-error] ${e.message || e}`, C.error)
      render()
    }
  })

  // Mouse clicks (SGR \x1b[<0;col;rowM) — picker selection + fold expansion.
  const onMouseClick = (col, row) => handleMouseClick({ state, render, popPicker }, col, row)
  const mouseCtx = () => ({ state, render })

  // ---------------------------------------------------------- Startup screen + background indexing

  // SESSION.md §8 D-S2：startTUI 首帧前 —— provider 无效（_providerInvalid / provider 为 null）
  // → 先弹模型选择 picker（keyStream 已挂 keypress，Esc/Enter 可用）；Esc → 提示行，仍进 TUI
  await promptProviderIfInvalid(agent, () => openModelPicker(), pushLine)

  showStartup({ agent, state, opts, pushLine, pushLabel, render, startWizard })
  backgroundIndex({ agent, state, render })

  // Check for updates (non-blocking, after startup screen)
  // 有 picker 打开时不硬抢：挂到 state.pendingNotice，picker 全部关闭后由 doRender 弹出
  const showUpdateNotice = async (result) => {
    const sel = await showPicker(`Update available: ${result.local} → ${result.latest}`, [
      { type: "header", text: `thincoder ${result.latest} is available (current: ${result.local})` },
      { type: "item", text: "Upgrade now", action: "upgrade" },
      { type: "item", text: "Later", action: "later" },
    ])
    if (sel?.action !== "upgrade") return
    pushLabel(`❯ Upgrade`, ansi.bold + C.tool)
    pushLine(`Upgrading to ${result.latest}...`, C.tool)
    const { exec } = await import("node:child_process")
    const cp = exec("npm install -g thincoder@latest", { windowsHide: true })
    let stdout = ""
    cp.stdout?.on("data", (d) => { stdout += d })
    cp.stderr?.on("data", (d) => { stdout += d })
    cp.on("close", (code) => {
      if (code === 0) {
        pushLine(`✓ Upgraded to ${result.latest}. Restart to apply.`, C.tool)
      } else {
        pushLine(upgradeFailureText(code, stdout), C.error)
      }
      render()
    })
  }
  ;(async () => {
    try {
      const { readFileSync } = await import("node:fs")
      const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"))
      const { checkForUpdate } = await import("../upgrade.mjs")
      const result = await checkForUpdate(pkg.version)
      if (result?.newer) {
        // Defer: if wizard is still active, just show a dim line
        if (state.wizard) {
          pushLine(`Tip: thincoder ${result.latest} is available (run /upgrade later or restart)`, C.dim)
          render()
        } else {
          state.pendingNotice = result
          render()
        }
      }
    } catch { /* network error or timeout — silently skip */ }
  })()
}

function summarize(obj) {
  const s = JSON.stringify(obj)
  if (s === "{}") return "" // no-arg tools (advisor/verify/…) — don't render empty braces
  return s.length > 80 ? s.slice(0, 80) + "…" : s
}
