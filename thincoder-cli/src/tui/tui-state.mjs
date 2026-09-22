import { makeDimsState } from "./dims.mjs"

/** TUI state 工厂（2026-09-22 structure-debt §2.2 · #159）：state 字面量自 index.mjs startTUI
 *  逐字搬移（仅去包裹）；`dims` 种子以调用侧采样值入参（Cols/Rows 名保持字面量原样），
 *  `tasks` 由 agent 承接（`agent.tasks ?? []` 原地保留）。
 *  @param {{ cols: number, rows: number, agent: object }} deps
 *  @returns {object} TUI state（会话面字段 / dims 单源 / 面板回指位） */
export function createTuiState({ cols, rows, agent }) {
  // 名字桥：字面量内沿用调用侧采样名（逐字搬移所需）
  const startupCols = cols
  const startupRows = rows
  return {
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

    subTasks: {}, // sub-agent activity blocks (§7.2 D4): { "coder#1": { key, role, model, started, done, doneAt, blocks: [{kind,text}], currentTool, toolArgs, turn, maxTurns, approval, lastError, dropped, blockEpoch, awaitingDigest（§17 挂起中间态）, _freezeAt（冻结锚点）, stopped, children: []（SUBAGENT-TAIL：嵌套子代理**守护载体**——内容行并入本块 blocks——subagent-children.mjs） } } — rendered as collapsible in-conversation blocks; persists across turns (blocks are the child activity's ONLY carrier — child tool calls never enter the parent history); bounded by the N2 500-line per-child ring buffer（SUBAGENT-TAIL 单环：内层行同环计数、单载体最旧先行——TUI.md §6）
    currentTool: null, // currently executing tool name (shown in status bar)
    processingStarted: 0, // current turn start time (status bar timer)
    status: "Ready",
    ledger: { marker: null, warn: false, scannedAt: 0 }, // LEDGER-SURFACE（§2.30.3.4）：L1 标记位——ledger-surface 写 / render-frame 读
    queue: [], // 交接残项单容器 [{ text }]（INPUT-LOCK：submit 不再排队——仅释放窗口兜底/挂起中止残余——回合尾队列循环续发，至多一条）
    interruptPrompt: null, // Ctrl+I inject box（第 31 批——TUI-INPUT-BOX.md §8）: { chars: string[], cursor: number } or null
    attentionAwaiting: false, // 第 33 批（TUI §14.3(f)）：回合结束等待输入——链尾置位 / 用户输入清位；不落盘、不进会话
    search: null, // Ctrl+F search mode: { query: "", matches: [{lineIndex, charIndex}], index: 0 } or null
    expandedBlocks: new Set(), // block hashes that are expanded (Enter toggles)
    foldEnabled: true, // global fold toggle — /fold on|off
    exitArmed: false, // Ctrl+C double-confirm: first press arms, second (within window) exits
    // Lazy history window (parity with VS Code): only the latest messages are
    // materialized on restore; PgUp-at-top loads earlier pages via loadOlder.
    _historyLoaded: 0, // messages loaded from the TAIL of _fullHistory
    _historyTotal: 0, // total messages in the restored session
    _hasOlder: false, // more earlier messages remain unloaded
    _linesChars: 0, // TUI-OOM-ROOTCAUSE（§15.3.2）：state.lines 全部行与载体文本总量（字符账——唯一新增状态位）
    _agent: null, // TUI state → agent 回指挂载点：startTUI 装配时置 agent 引用——
    // ① SYNC-CANCEL ⏹ 门控读 state._agent._syncChildAborts（subagent-panel.mjs，2026-09-09）；
    // ② CLI-ACTIVITY-DEBLOAT F-3（2026-09-10）：agent._tuiState = state 反向挂载——
    // action:"panel" 经 ctx.state（= agent._tuiState）**读时现算**面板块（computePanelBlocks
    // ——subTasks 活值纯推导——单账本）。headless/VS Code 无此装配 = 无面板 → panel 动作
    // 恒降级池视图（CLI-only 完整能力——AC-P4）。
  }
}
