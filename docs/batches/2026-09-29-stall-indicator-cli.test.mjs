/**
 * 2026-09-29-stall-indicator-cli.test.mjs — 批次本地单测件 · CLI 舱（停滞轻显形：核键 + CLI 面）。
 * 名随批次档 · 不进仓套件；复跑（仓根）= `node --test .thincoder/tmp/2026-09-29-stall-indicator-cli.test.mjs`
 * （导入以 `process.cwd()` 为仓根解析，须以仓根为 cwd 运行）。
 * 判据面 = `docs/cli/design/TUI.md` §7.7「可机判」行 + 批档 §2.4 AC-4（常量 ∕ 首显值 ∕ 负向锁 ∕ 拍）
 *   + 批档 §4 实施条件②（重置点覆盖 onToolResult 与子代理内容路由——逐坐标行为断言）。
 * 负向锁对拍法（先例 = `.thincoder/tmp/2026-09-29-parity-b3-timer-cli.test.mjs` 同法）：
 *   **OLD 逐字拷贝（代码行，注释未复刻）× NEW 端模块现值**，同比特级相等断言；
 *   OLD 拷贝面 = 改前的 `buildStatusLine` ∕ `renderStatus` ∕ `SLASH_HINTS`（函数互指指向本拷贝体；
 *   `attentionKind` 引模块现值——该函数本批零改）。
 */
import assert from "node:assert/strict"
import test from "node:test"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const root = process.cwd()
const load = (rel) => import(pathToFileURL(join(root, rel)).href)

const R = await load("thincoder-cli/src/tui/render-frame.mjs")
const { ansi, C } = await load("thincoder-cli/src/tui/ansi.mjs")
const { stringWidth, sliceByWidth } = await load("thincoder-cli/src/tui/render.mjs")
const { isYesNoModal } = await load("thincoder-cli/src/tui/interaction.mjs")
const { providerSpec } = await load("thincoder-core/config.mjs")
const I18N = await load("thincoder-core/i18n.mjs")
const SB = await load("thincoder-cli/src/tui/subagent-blocks.mjs")
const TE = await load("thincoder-cli/src/tui/tool-events.mjs")

const attentionKind = R.attentionKind // OLD 拷贝消费面（本批零改该函数）

/* ── OLD 拷贝（render-frame.mjs 改前代码行逐字——SLASH_HINTS ∕ buildStatusLine ∕ renderStatus）── */
const SLASH_HINTS = {
  "/config": "open config menu",
  "/model": "select model & manage providers",
  "/think": "open thinking mode menu",
  "/mcp": "open MCP management menu",
  "/goal": "open goal management menu",
  "/session": "select archived session",
  "/restore": "select checkpoint to restore",
}
function OLDC_buildStatusLine(state, agent, { cols, slashCommands }) {
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
  const modelContext = providerSpec(agent.provider).context
  const ctxPct = Math.round((state.ctxCache.tokens / modelContext) * 100)
  const ctxTokensHint = state.ctxCache.tokens > 0 ? ` ${fmtK(state.ctxCache.tokens)}` : ""
  const ctxHint = ctxPct > 0
    ? ctxPct >= 80 ? ` │ ${ansi.reset}${C.warn}context ${ctxPct}%${ctxTokensHint}${ansi.reset}${ansi.dim}` : ` │ context ${ctxPct}%${ctxTokensHint}` : ""
  const queuedN = state.pendingInput?.length ?? 0
  const enterHint = state.processing
    ? (queuedN > 0 ? `已排队 ${queuedN} 条消息`
      : state.suspended || state._suspPending
        ? (agent._inAutoTurn === true
          ? `会话内回合处理中 — Enter 排队（本轮结束后优先发送）`
          : `会话内回合处理中 — Enter 排队（当前步骤结束后自动发送）`)
        : `主会话处理中 — Enter 排队（当前步骤结束后自动发送）`)
    : "Enter: send"
  const lg = state.ledger
  const ledgerHint = lg?.marker
    ? ` │ ${lg.warn ? `${ansi.reset}${C.warn}${lg.marker}${ansi.reset}${ansi.dim}` : lg.marker}`
    : ""
  const timers = agent._pendingTimers ?? []
  const timerHint = timers.length === 0 ? "" : ` │ ${timers.some((t) => t.expiresAt <= Date.now()) ? `${ansi.reset}${C.warn}⏰${timers.length}${ansi.reset}${ansi.dim}` : `⏰${timers.length}`}`
  const titleRaw = typeof agent.title === "string" ? agent.title.trim() : ""
  const titleHint = titleRaw ? ` │ ${stringWidth(titleRaw) > 40 ? sliceByWidth(titleRaw, 39) + "…" : titleRaw}` : ""
  return ` ${statusText}${taskHint}${turnHint}${tokenHint}${ctxHint}${scrollHint}${ledgerHint}${timerHint}${titleHint} │ ${enterHint} │ /: commands │ wheel/PgUp/PgDn: scroll │ Ctrl+I: inject │ Ctrl+C: exit (×2)`
}
function OLDC_renderStatus(state, agent, cols, slashCommands) {
  const statusLine = OLDC_buildStatusLine(state, agent, { cols, slashCommands })
  const autoBanner = agent.autoApprove ? `${C.warn} AUTO${ansi.reset}${ansi.dim}│` : ""
  const planBanner = agent.planMode ? `${C.tool} PLAN${ansi.reset}${ansi.dim}│` : ""
  const advisorBanner = agent.config?.advisor?.guard === true ? `${C.advisor} ADVISOR${ansi.reset}${ansi.dim}│` : ""
  const engBanner = agent.config?.agent?.engineering ? `${C.advisor} ENG${ansi.reset}${ansi.dim}│` : ""
  const bannerPrefix = (agent.planMode ? " PLAN│ " : "") + (agent.autoApprove ? " AUTO│ " : "") + (agent.config?.advisor?.guard === true ? " ADVISOR│ " : "") + (agent.config?.agent?.engineering ? " ENG│ " : "")
  const kind = attentionKind(state)
  const chip = kind === "blocked" ? (state.permission ? "⚠ 等待你的审批" : "⚠ 等待你的回答")
    : kind === "awaiting" ? "⚠ 等待你的输入" : ""
  const attentionPad = chip ? `${chip} │ ` : ""
  const statusMax = cols - 1 - (bannerPrefix ? stringWidth(bannerPrefix) : 0) - (attentionPad ? stringWidth(attentionPad) : 0)
  const inner = `${ansi.dim}${planBanner}${autoBanner}${advisorBanner}${engBanner}${sliceByWidth(statusLine, Math.max(10, statusMax))}`
  if (!chip) return `${inner}${ansi.reset}`
  return `${C.attention}${(chip + " │ " + inner).replaceAll(ansi.reset, ansi.reset + C.attention)}${ansi.reset}`
}

/* ── 夹具 ── */
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, "")
const stubAgent = (over = {}) => ({
  provider: null, config: {}, autoApprove: false, planMode: false,
  _currentTurn: 0, _maxTurns: 0, title: "", _pendingTimers: [],
  ...over,
})
const stubState = (over = {}) => ({
  lines: [], streaming: "", reasoning: "", _advisorBlocks: [],
  input: [], cursor: 0, scroll: 0, _followTail: true,
  processing: false, status: "Ready", currentTool: null,
  processingStarted: 0, lastOutputAt: 0,
  permission: null, question: null, picker: null, wizard: null,
  tasks: [], tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
  ctxCache: { len: -1, tokens: 0 }, pendingInput: [], suspended: false, _suspPending: false,
  attentionAwaiting: false, ledger: null, subTasks: {}, _linesChars: 0, _lineIdCounter: 0,
  ...over,
})

/* ── T-SI1 · 常量 ∕ 词键单源 ── */
test("T-SI1 · 常量 ∕ 词键单源：QUIET_MS = 10000 ∧ status.quiet 逐字（en ∕ zh）", () => {
  assert.equal(R.QUIET_MS, 10000)
  assert.deepEqual(I18N.CORE_MESSAGES["status.quiet"], { en: "Quiet ${s}s", zh: "已静默 ${s}s" })
  assert.equal(I18N.t("status.quiet", { s: 12 }), "Quiet 12s")
  assert.equal(I18N.t("status.quiet", { s: 12 }, "zh"), "已静默 12s")
})

/* ── T-SI2 · 首显（边界 = 恰 10s）与显示位 ── */
test("T-SI2 · 首显：在飞 ∧ 静默恰 10s ⇒ strip-ANSI 含 `Quiet 10s` ∧ 位在 elapsed 之后", () => {
  const now = Date.now()
  const st = stubState({ processing: true, status: "Thinking...", processingStarted: now - 3000, lastOutputAt: now - 10_000 })
  const text = stripAnsi(R.renderStatus(st, stubAgent(), 120, []))
  assert.ok(text.includes("Quiet 10s"), text)
  const iElapsed = text.indexOf(" 3s")
  assert.ok(iElapsed !== -1 && iElapsed < text.indexOf("Quiet 10s"), text)
})

/* ── T-SI3 · 负向锁（对拍 OLD） ── */
test("T-SI3 · 负向锁：阈值下 ∕ 非在飞 ∕ 未起算 ∕ 缺省 ∕ 模态 ⇒ 与 OLD 逐字节等价 ∧ 零 `Quiet`", () => {
  const now = Date.now()
  const cases = [
    ["阈值下 9.5s", stubState({ processing: true, status: "Thinking...", processingStarted: now - 3000, lastOutputAt: now - 9_500 })],
    ["非在飞（processing 落——终态消失）", stubState({ processing: false, status: "Ready", processingStarted: now - 60_000, lastOutputAt: now - 60_000 })],
    ["未起算（lastOutputAt 缺省）", stubState({ processing: true, status: "Thinking...", processingStarted: now - 3000, lastOutputAt: undefined })],
    ["全缺省", stubState()],
    ["模态态（question——状态行整行让位）", stubState({ processing: true, question: { text: "q", options: [{ label: "a" }] }, lastOutputAt: now - 60_000 })],
  ]
  for (const [label, st] of cases) {
    const a = R.renderStatus(st, stubAgent(), 120, [])
    const b = OLDC_renderStatus(st, stubAgent(), 120, [])
    assert.equal(a, b, label)
    assert.ok(!stripAnsi(a).includes("Quiet"), label)
  }
})

/* ── T-SI4 · 显示条件差分：唯一差异 = 读数段（取 300 列宽 = 无宽度截断——既有 sliceByWidth 预算不参与本断言） ── */
test("T-SI4 · 显示差分：NEW = OLD 恰插入 ` Quiet 10s` 一次（其余零差异；cols = 300 免截断）", () => {
  const now = Date.now()
  const st = stubState({ processing: true, status: "Thinking...", processingStarted: now - 3000, lastOutputAt: now - 10_000 })
  const a = R.renderStatus(st, stubAgent(), 300, [])
  const b = OLDC_renderStatus(st, stubAgent(), 300, [])
  assert.notEqual(a, b)
  assert.equal(a.replace(" Quiet 10s", ""), b)
  assert.ok(stripAnsi(a).includes("Quiet 10s"))
})

/* ── T-SI5 · 重置点（主面 ①②） ── */
test("T-SI5 · 重置点（主面）：onToken ∕ onReasoning ∕ onToolCall ∕ onToolOutput ∕ onToolResult（含子代理 ack）各抬 lastOutputAt；非可见（空输出）不抬", () => {
  const state = stubState({ lastOutputAt: 1 })
  const { callbacks } = TE.buildToolCallbacks({
    agent: stubAgent(), state,
    pushLine: () => {}, render: () => {}, scheduleRender: () => {}, ensureAssistantLabel: () => {},
    saveSessionImpl: () => {},
  })
  const bump = (label, fn) => {
    state.lastOutputAt = 1
    fn()
    assert.ok(state.lastOutputAt > 1e12, `${label} 应重置（实际 ${state.lastOutputAt}）`)
  }
  bump("onToken", () => callbacks.onToken("hello"))
  bump("onReasoning", () => callbacks.onReasoning("think"))
  bump("onToolCall", () => callbacks.onToolCall("read", { path: "/tmp/x" }, 1))
  bump("onToolOutput", () => callbacks.onToolOutput("read", "chunk", 1))
  bump("onToolResult", () => callbacks.onToolResult("read", "ok", 1))
  bump("onToolResult(subagent-ack)", () => callbacks.onToolResult("subagent", JSON.stringify({ id: "7", role: "explore", status: "running" }), 2))
  state.lastOutputAt = 1
  callbacks.onToolOutput("read", "   ", 1) // trimEnd ⇒ 空——非可见事件
  assert.equal(state.lastOutputAt, 1)
})

/* ── T-SI6 · 重置点（子代理面 ③） ── */
test("T-SI6 · 重置点（子代理面 ③）：内容回显四路由 ∕ ⟦ev⟧ 块状态（queued ∕ async 转正 ∕ cancelled 移除）各抬 lastOutputAt；墓碑丢弃不抬", () => {
  const r = () => {}
  const drives = [
    ["text（routeSubToken）", (st) => SB.routeSubToken(st, "explore#1/hello", r)],
    ["think（routeSubReasoning）", (st) => SB.routeSubReasoning(st, "explore#1/think", r)],
    ["工具（routeSubToolCall）", (st) => SB.routeSubToolCall(st, "explore#1/bash", { command: "ls" }, r)],
    ["工具输出（routeSubToolOutput）", (st) => SB.routeSubToolOutput(st, "explore#1/bash", { kind: "text", text: "out" }, r)],
    ["⟦ev⟧queued（块状态——建等待块）", (st) => SB.routeSubToken(st, "explore#1/⟦ev⟧queued\x1eslot\x1e1\x1equeued\x1e", r)],
  ]
  for (const [label, drive] of drives) {
    const st = stubState({ lastOutputAt: 1 })
    drive(st)
    assert.ok(st.lastOutputAt > 1e12, label)
  }
  // async 转正（live 分支——头标 ∕ 走时可见）
  const s1 = stubState({ lastOutputAt: 1 })
  s1.subTasks["explore#1"] = { key: "explore#1", role: "explore", done: false, async: false, queued: { kind: "slot" } }
  SB.routeSubToken(s1, "explore#1/⟦ev⟧async\x1e", r)
  assert.ok(s1.lastOutputAt > 1e12, "async 转正")
  // cancelled 移除（块删除——可见）
  const s2 = stubState({ lastOutputAt: 1 })
  s2.subTasks["explore#1"] = { key: "explore#1", role: "explore", done: false, async: false }
  SB.routeSubToken(s2, "explore#1/⟦ev⟧cancelled\x1e", r)
  assert.equal(s2.subTasks["explore#1"], undefined)
  assert.ok(s2.lastOutputAt > 1e12, "cancelled 移除")
  // 墓碑丢弃（非可见——零重置；降级面无 _agent ⇒ livePoolHas false）
  const s3 = stubState({ lastOutputAt: 1 })
  s3._frozenSubKeys = new Set(["explore#2"])
  SB.routeSubToken(s3, "explore#2/late chunk", r)
  assert.equal(s3.lastOutputAt, 1)
})

/* ── T-SI7 · 重置点（压缩面板——§7.7 语义填充：面板 ∕ 冻结块 = 可见输出；父侧 2026-09-29 裁定①） ── */
test("T-SI7 · 重置点（压缩面板）：ensureCompressPanel ∕ markCompressFailed ∕ markCompressDone ∕ markCompressFallback 各抬 lastOutputAt", () => {
  const st = stubState({ lastOutputAt: 1 })
  SB.ensureCompressPanel(st, { messages: 5 })
  assert.ok(st.lastOutputAt > 1e12, "面板起始")
  st.lastOutputAt = 1
  SB.markCompressFailed(st, new Error("boom"))
  assert.ok(st.lastOutputAt > 1e12, "失败行")
  st.lastOutputAt = 1
  SB.markCompressDone(st, { tokensFreed: 100, elapsedMs: 5000 })
  assert.ok(st.lastOutputAt > 1e12, "完成冻结")
  // 降级路径：另起一局面板
  const st2 = stubState({ lastOutputAt: 1 })
  SB.ensureCompressPanel(st2, { messages: 3 })
  st2.lastOutputAt = 1
  SB.markCompressFallback(st2, { tailMessages: 3 })
  assert.ok(st2.lastOutputAt > 1e12, "降级冻结")
})
