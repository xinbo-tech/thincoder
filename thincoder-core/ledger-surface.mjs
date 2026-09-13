/**
 * ledger-surface.mjs — 台账可见面（核内结构归位；CORE-UNIFICATION §2.5 #174
 * 「融合：取一侧 + 渲染面按端注入」）。
 *
 * 来源 = `thincoder-cli/src/tui/ledger-surface.mjs`（CLI 住 `tui/`、VSC 住 `extension/`；
 * VSC 头注自述同构）——逐字随迁，**渲染面收核为注入**：原档 `import { C } from "./ansi.mjs"`
 * 是 TUI 专用件的颜色表 ⇒ ④ 端差，改由调用方传入 `colors`（未注入 ⇒ 空对象，输出纯文本，
 * 核内零端名分支——契约 5 / 10）。
 *
 * 三面：① 启动行（首扫、**任一项目可动作**才出——明细行集每项目一行）② 变化行（老化首次
 * 越线 / 池达阈值——一次性去重 + **送达门**：未送达不记账）③ 状态位（`state.ledger`——L1
 * 常驻标记，渲染端消费；**不受启动行门约束**——F2 按标记态照显）。
 * 只读台账；唯一写面 = 去重档（`~/.thincoder/ledger-notify.json`）。
 */
import { blameAges, detailScans, discoverFamily, formatDetailLine, formatMarker, loadNotifyState, NOTIFY_FILE, notifyKey, planChangeLines, REFRESH_MS, saveNotifyState, summarizeLedger } from "./ledger.mjs"

/** 单次扫描（直驱面——timer 包装见 `startLedgerSurface`）。
 *  `startup=true` = 会话首扫（补启动行；变化行在前、明细行在后）。
 *  `colors` = 端注入的渲染色表（`{ warn, dim }`）；未注入 ⇒ `{}`（`undefined` 色值 = 纯文本）。 */
export function runLedgerScan({ state, agent = null, anchor = null, notifyFile = NOTIFY_FILE, pushLine = () => {}, render = () => {}, startup = false, ageOf = blameAges, colors = {} } = {}) {
  const base = anchor ?? agent?.cwd ?? process.cwd()
  const family = discoverFamily(base)
  const scans = []
  for (const p of family.projects) {
    try { scans.push(summarizeLedger(p, { ageOf })) } catch { /* 台账不可读 → 该项目跳过（余者照常——N1/T110①） */ }
  }
  const current = family.current ? scans.find((s) => s.root === family.current.root) ?? null : null
  const notify = loadNotifyState(notifyFile)
  const plans = scans.map((s) => ({ s, plan: planChangeLines(notify.ledgers[notifyKey(s.ledger)], s) }))
  const changeLines = plans.flatMap(({ plan }) => plan.lines)
  const showStartup = startup && scans.some((s) => s.actionable)
  const rows = showStartup
    ? [...changeLines, ...detailScans(scans, current).map((s) => ({ text: formatDetailLine(s), warn: s.actionable }))]
    : changeLines
  let delivered = true
  for (const line of rows) {
    try { pushLine(line.text, line.warn ? colors.warn : colors.dim) } catch { delivered = false; break }
  }
  // 送达门（F5）：有事件行 → 仅在送达后记账；无事件行 → 仅状态确有变化时静默同步（跌回 false 即重置）
  const changed = plans.some(({ s, plan }) => {
    const prev = notify.ledgers[notifyKey(s.ledger)]
    return !prev || JSON.stringify(prev.aged ?? []) !== JSON.stringify(plan.next.aged) || Boolean(prev.threshold) !== plan.next.threshold
  })
  if (changeLines.length ? delivered : changed) {
    const ledgers = { ...notify.ledgers }
    for (const { s, plan } of plans) ledgers[notifyKey(s.ledger)] = { ...plan.next, updatedAt: Date.now() }
    saveNotifyState(notifyFile, { version: 1, ledgers })
  }
  state.ledger = { marker: current ? formatMarker(current) : null, warn: Boolean(current && current.aged > 0), scannedAt: Date.now() }
  render()
}

/** 挂载：首扫（`setImmediate`——不抢首帧）+ 周期（`REFRESH_MS`；`state.processing` 期间跳过本轮）。
 *  端注入的渲染面（`ctx.colors`）与推送面（`ctx.pushLine` / `ctx.render`）照传。 */
export function startLedgerSurface(ctx = {}) {
  let disposed = false
  let timer = null
  const tick = (startup) => {
    if (disposed) return
    if (!startup && ctx.state?.processing) return // git 子进程不打断回合帧
    try { runLedgerScan({ ...ctx, startup }) } catch { /* 可见面尽力——不崩（N1） */ }
  }
  setImmediate(() => {
    if (disposed) return
    tick(true)
    timer = setInterval(() => tick(false), REFRESH_MS)
    timer.unref?.()
  })
  return {
    dispose() {
      disposed = true
      if (timer) clearInterval(timer)
      timer = null
    },
  }
}
