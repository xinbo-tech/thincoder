/**
 * ledger-surface.mjs — TUI 台账可见面胶水（LEDGER-SURFACE 批——设计档 §2.30.3.4）。
 *
 * 三面：① 启动行（首扫、**任一项目可动作**才出——明细行集每项目一行）② 变化行（老化首次
 * 越线 / 池达阈值——一次性去重 + **送达门**：未送达不记账）③ 状态位（`state.ledger`——L1
 * 常驻标记，`render-frame.mjs` 消费；**不受启动行门约束**——F2 按标记态照显）。
 * 只读台账；唯一写面 = 去重档（`~/.thincoder/ledger-notify.json`）。
 *
 * M2/KD-M2-3：核台账面**动态 import**（`@thincoder/core/ledger.mjs` 静态链 `node:sqlite`——
 * 静态 import 会把 `node:sqlite` 拽进端壳静态面）；载入失败 = 降级不崩（N1），扫描拍重试。
 */
import { C } from "./ansi.mjs"

/** 核台账面惰性载入（KD-M2-3 动态 import——失败不缓存，下次扫描拍重试；N1 降级不崩）。 */
let _core = null
function loadCore() {
  if (!_core) {
    _core = import("@thincoder/core/ledger.mjs")
    _core.catch(() => { _core = null })
  }
  return _core
}

/** 单次扫描（直驱面——timer 包装见 `startLedgerSurface`）。
 *  `startup=true` = 会话首扫（补启动行；变化行在前、明细行在后）。 */
export async function runLedgerScan({ state, agent = null, anchor = null, notifyFile = undefined, pushLine = () => {}, render = () => {}, startup = false } = {}) {
  const core = await loadCore()
  const { buildScan, detailScans, discoverFamily, formatDetailLine, formatMarker, loadNotifyState, NOTIFY_FILE, notifyKey, planChangeLines, saveNotifyState } = core
  const base = anchor ?? agent?.cwd ?? process.cwd()
  const family = discoverFamily(base)
  const scans = []
  for (const p of family.projects) {
    try { scans.push(buildScan({ cwd: p.root })) } catch { /* 台账不可读 → 该项目跳过（余者照常——N1/T110①） */ }
  }
  const current = family.current ? scans.find((s) => s.root === family.current.root) ?? null : null
  const notify = loadNotifyState(notifyFile ?? NOTIFY_FILE)
  const plans = scans.map((s) => ({ s, plan: planChangeLines(notify.ledgers[notifyKey(s.ledger)], s) }))
  const changeLines = plans.flatMap(({ plan }) => plan.lines)
  const showStartup = startup && scans.some((s) => s.actionable)
  const rows = showStartup
    ? [...changeLines, ...detailScans(scans, current).map((s) => ({ text: formatDetailLine(s), warn: s.actionable }))]
    : changeLines
  let delivered = true
  for (const line of rows) {
    try { pushLine(line.text, line.warn ? C.warn : C.dim) } catch { delivered = false; break }
  }
  // 送达门（F5）：有事件行 → 仅在送达后记账；无事件行 → 仅状态确有变化时静默同步（跌回 false 即重置）
  const changed = plans.some(({ s, plan }) => {
    const prev = notify.ledgers[notifyKey(s.ledger)]
    return !prev || JSON.stringify(prev.aged ?? []) !== JSON.stringify(plan.next.aged) || Boolean(prev.threshold) !== plan.next.threshold
  })
  if (changeLines.length ? delivered : changed) {
    const ledgers = { ...notify.ledgers }
    for (const { s, plan } of plans) ledgers[notifyKey(s.ledger)] = { ...plan.next, updatedAt: Date.now() }
    saveNotifyState(notifyFile ?? NOTIFY_FILE, { version: 1, ledgers })
  }
  state.ledger = { marker: current ? formatMarker(current) : null, warn: Boolean(current && current.aged > 0), scannedAt: Date.now() }
  render()
}

/** TUI 挂载：首扫（`setImmediate`——不抢首帧）+ 周期（`REFRESH_MS`；`state.processing` 期间跳过本轮）。 */
export function startLedgerSurface(ctx = {}) {
  let disposed = false
  let timer = null
  const tick = async (startup) => {
    if (disposed) return
    if (!startup && ctx.state?.processing) return // 扫描不打断回合帧
    try { await runLedgerScan({ ...ctx, startup }) } catch { /* 可见面尽力——不崩 TUI（N1） */ }
  }
  setImmediate(async () => {
    if (disposed) return
    tick(true)
    const core = await loadCore().catch(() => null)
    if (disposed || !core) return // 载入失败 → 无周期（N1——降级不崩）
    timer = setInterval(() => tick(false), core.REFRESH_MS)
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
