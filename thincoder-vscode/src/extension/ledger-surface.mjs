/**
 * ledger-surface.mjs — VSC 台账可见面（LEDGER-SURFACE 批——设计档 §2.30.3.5）。
 *
 * 面：① 状态栏 item（text = L1 / tooltip = 明细行集 L2 行 / aged>0 → warningBackground /
 * 无台账 → hide；无点击命令——K4）② chat 流文本行（启动行 | 变化行——**送达门**：webview
 * 未就绪 / post 失败不记账）③ 周期刷新（`REFRESH_MS`）+ 换项目事件（`emit:false`）。
 * 只读台账；唯一写面 = 去重档（跨端共享 `~/.thincoder/ledger-notify.json`）。
 */
import * as vscode from "vscode"
import { blameAges, detailScans, discoverFamily, formatDetailLine, formatMarker, loadNotifyState, NOTIFY_FILE, notifyKey, planChangeLines, REFRESH_MS, saveNotifyState, summarizeLedger } from "../ledger.mjs"
import { _cwd } from "./panel-messages.mjs"

let _item = null
let _timer = null
let _notifyFile = NOTIFY_FILE // 测试缝（_setLedgerSurfaceForTest——生产 = NOTIFY_FILE）
let _anchor = null
let _ageOf = blameAges // 测试缝（确定性行龄；生产 = 真 git blame）

/** 测试缝：注入去重档路径 / 当前项目锚 / 行龄源（不设 = 生产缺省；同 config-io `_setConfigPathForTest` 先例）。 */
export function _setLedgerSurfaceForTest(opts = {}) {
  if ("notifyFile" in opts) _notifyFile = opts.notifyFile ?? NOTIFY_FILE
  if ("cwd" in opts) _anchor = opts.cwd ?? null
  if ("ageOf" in opts) _ageOf = opts.ageOf ?? blameAges
  return { notifyFile: _notifyFile, cwd: _anchor }
}

/** 族扫描（项目解析 + 汇总——不可读项目跳过，余者照常；N1/T110①）。 */
function scanFamily() {
  const family = discoverFamily(_anchor ?? _cwd())
  const scans = []
  for (const p of family.projects) {
    try { scans.push(summarizeLedger(p, { ageOf: _ageOf })) } catch { /* 不可读 → 跳过 */ }
  }
  const current = family.current ? scans.find((s) => s.root === family.current.root) ?? null : null
  return { scans, current }
}

/** item 更新：无台账 → hide（K6/U4）；aged>0 → 警示底色。 */
function updateItem(scans, current) {
  if (!_item) return
  if (!current) { _item.hide(); return }
  _item.text = formatMarker(current)
  _item.tooltip = new vscode.MarkdownString(detailScans(scans, current).map(formatDetailLine).join("\n"))
  _item.backgroundColor = current.aged > 0 ? new vscode.ThemeColor("statusBarItem.warningBackground") : undefined
  _item.show()
}

/** 投递（送达门前置判据）：webview 不在 / 未就绪 / post 抛错 = 未送达。 */
function post(panel, payload) {
  if (!panel?._panel || !panel._wvReady) return false
  try { panel._panel.webview.postMessage(payload); return true } catch { return false }
}

/** 单次扫描：item 更新 + 行投递 + 送达后记账（启动行受可动作门；变化行恒发）。 */
function runScan(panel, { startup = false } = {}) {
  const { scans, current } = scanFamily()
  updateItem(scans, current)
  const notify = loadNotifyState(_notifyFile)
  const plans = scans.map((s) => ({ s, plan: planChangeLines(notify.ledgers[notifyKey(s.ledger)], s) }))
  const changeLines = plans.flatMap(({ plan }) => plan.lines)
  const rows = startup && scans.some((s) => s.actionable)
    ? [...changeLines, ...detailScans(scans, current).map((s) => ({ text: formatDetailLine(s), warn: s.actionable }))]
    : changeLines
  let delivered = true
  if (rows.length) delivered = post(panel, { type: "ledgerNotice", lines: rows })
  const changed = plans.some(({ s, plan }) => {
    const prev = notify.ledgers[notifyKey(s.ledger)]
    return !prev || JSON.stringify(prev.aged ?? []) !== JSON.stringify(plan.next.aged) || Boolean(prev.threshold) !== plan.next.threshold
  })
  if (changeLines.length ? delivered : changed) {
    const ledgers = { ...notify.ledgers }
    for (const { s, plan } of plans) ledgers[notifyKey(s.ledger)] = { ...plan.next, updatedAt: Date.now() }
    saveNotifyState(_notifyFile, { version: 1, ledgers })
  }
}

/** 周期 / 事件刷新：`emit:false` = 仅 item（换项目即时刷新——不投递不记账）。 */
export function refreshLedger(panel, { emit = true } = {}) {
  if (!emit) {
    const { scans, current } = scanFamily()
    updateItem(scans, current)
    return
  }
  runScan(panel, { startup: false })
}

/** 启动行（webviewReady 时机——K3/U5：每次 webview 创建一次；post 门 = 任一项目可动作）。 */
export function pushLedgerStartup(panel) {
  runScan(panel, { startup: true })
}

/** item 建立 + 周期注册（幂等——`_initStatusBar` 每次 resolve 调用）。 */
export function initLedgerSurface(panel) {
  if (!_item) {
    _item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99) // 先例 = chat-panel.mjs:156（主 item priority 100）
    _item.name = "ThinCoder Ledger"
  }
  refreshLedger(panel, { emit: false })
  if (!_timer) {
    _timer = setInterval(() => refreshLedger(panel, { emit: true }), REFRESH_MS)
    _timer.unref?.()
  }
}

/** 释放（panel dispose——重载 / 扩展卸载；再次 init 可重建）。 */
export function dispose() {
  if (_timer) clearInterval(_timer)
  _timer = null
  _item?.dispose?.()
  _item = null
}
