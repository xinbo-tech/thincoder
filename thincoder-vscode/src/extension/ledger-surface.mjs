/**
 * ledger-surface.mjs — VSC 台账可见面（LEDGER-SURFACE 批——设计档 §2.30.3.5；W4 接入核机制）。
 *
 * 面：① 状态栏 item（text = L1 / tooltip = 明细行集 L2 行 / aged>0 → warningBackground /
 * 无台账 → hide；无点击命令——K4）② chat 流文本行（启动行 | 变化行——**送达门**：webview
 * 未就绪 / post 失败不记账）③ 周期刷新（`REFRESH_MS`）+ 换项目事件（`emit:false`）。
 * 只读台账；唯一写面 = 去重档（跨端共享 `~/.thincoder/ledger-notify.json`）。
 *
 * 核心统一 W4：数据面（`@thincoder/core/ledger.mjs`）与机制面（`@thincoder/core/ledger-surface.mjs`
 * 的 `runLedgerScan`——族扫描 / 变化行 / 送达门 / 记账）归核；本档 = 端装配层，供台账渲染面
 * 三缝值（§2.13.3）：`colors`（面板警告位哨兵）· `pushLine`（面板逐行推送——计数 = 行数）·
 * `render`（item 刷新）。
 */
import * as vscode from "vscode"
import { blameAges, detailScans, discoverFamily, formatDetailLine, formatMarker, NOTIFY_FILE, REFRESH_MS, summarizeLedger } from "@thincoder/core/ledger.mjs"
import { runLedgerScan } from "@thincoder/core/ledger-surface.mjs"
import { _cwd } from "./panel-messages.mjs"

let _item = null
let _timer = null
let _notifyFile = NOTIFY_FILE // 测试缝（_setLedgerSurfaceForTest——生产 = NOTIFY_FILE）
let _anchor = null
let _ageOf = blameAges // 测试缝（确定性行龄；生产 = 真 git blame）

/** 核机制状态位载体（`runLedgerScan` 写 `state.ledger` = L1 标记位；item 面经端侧明细扫描渲染）。 */
const _state = { ledger: null }

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

/** item 更新（缝值 `render` 的端侧实现）：无台账 → hide（K6/U4）；aged>0 → 警示底色。 */
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

/** 缝色表（缝值 `colors`）：面板渲染面无 ANSI——两值 = payload `warn` 位的哨兵（每行按位推送）。 */
const SEAM_COLORS = { warn: true, dim: false }

/** 单次扫描（emit 径）：机制面归核（`runLedgerScan`——扫描 / 变化行 / 送达门 / 记账）；
 *  本端供三缝值——`pushLine` 逐行投递（未送达 → 抛出 ⇒ 核内不记账）。 */
function runScan(panel, { startup = false } = {}) {
  const { scans, current } = scanFamily() // 端侧明细面（tooltip 行集——与核机制扫描同拍同锚）
  runLedgerScan({
    state: _state,
    anchor: _anchor ?? _cwd(),
    notifyFile: _notifyFile,
    ageOf: _ageOf,
    startup,
    colors: SEAM_COLORS,
    pushLine: (text, warn) => {
      if (!post(panel, { type: "ledgerNotice", lines: [{ text, warn }] })) throw new Error("ledger line undelivered")
    },
    render: () => updateItem(scans, current),
  })
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
