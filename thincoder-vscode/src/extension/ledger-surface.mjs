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
 *
 * M2/KD-M2-3：核台账面**动态 import**（`ledger.mjs` 静态链 `node:sqlite`——静态 import 会把
 * `node:sqlite` 拽进端壳静态闭包、破 W8 契约②；机检 = `test/engine-floor-guard.test.mjs`）。
 * 载入失败 = 低宿主 / 打包缺件 → 本面降级不崩（N1），刷新拍重试。
 */
import * as vscode from "vscode"
import { _cwd } from "./panel-messages.mjs"

let _item = null
let _timer = null
let _notifyFile = null // 测试缝（_setLedgerSurfaceForTest；null = 生产缺省——扫描时走核 NOTIFY_FILE）
let _anchor = null

/** 核台账面惰性载入（KD-M2-3 动态 import——失败不缓存，下次刷新拍重试；N1 降级不崩）。 */
let _core = null
function loadCore() {
  if (!_core) {
    _core = Promise.all([
      import("@thincoder/core/ledger.mjs"),
      import("@thincoder/core/ledger-surface.mjs"),
    ]).then(([ledger, surface]) => ({ ledger, surface }))
    _core.catch(() => { _core = null })
  }
  return _core
}

/** 核机制状态位载体（`runLedgerScan` 写 `state.ledger` = L1 标记位；item 面经端侧明细扫描渲染）。 */
const _state = { ledger: null }

/** 测试缝：注入去重档路径 / 当前项目锚（不设 = 生产缺省；同 config-io `_setConfigPathForTest` 先例）。 */
export function _setLedgerSurfaceForTest(opts = {}) {
  if ("notifyFile" in opts) _notifyFile = opts.notifyFile ?? null
  if ("cwd" in opts) _anchor = opts.cwd ?? null
  return { notifyFile: _notifyFile, cwd: _anchor }
}

/** 族扫描（项目解析 + 汇总——不可读项目跳过，余者照常；N1/T110①）。 */
async function scanFamily(ledger) {
  const family = ledger.discoverFamily(_anchor ?? _cwd())
  const scans = []
  for (const p of family.projects) {
    try { scans.push(ledger.buildScan({ cwd: p.root })) } catch { /* 不可读 → 跳过 */ }
  }
  const current = family.current ? scans.find((s) => s.root === family.current.root) ?? null : null
  return { scans, current }
}

/** item 更新（缝值 `render` 的端侧实现）：无台账 → hide（K6/U4）；aged>0 → 警示底色。 */
function updateItem(ledger, scans, current) {
  if (!_item) return
  if (!current) { _item.hide(); return }
  _item.text = ledger.formatMarker(current)
  _item.tooltip = new vscode.MarkdownString(ledger.detailScans(scans, current).map((s) => ledger.formatDetailLine(s)).join("\n"))
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
async function runScan(panel, { startup = false } = {}) {
  const { ledger, surface } = await loadCore()
  const { scans, current } = await scanFamily(ledger) // 端侧明细面（tooltip 行集——与核机制扫描同拍同锚）
  surface.runLedgerScan({
    state: _state,
    anchor: _anchor ?? _cwd(),
    notifyFile: _notifyFile ?? undefined,
    startup,
    colors: SEAM_COLORS,
    pushLine: (text, warn) => {
      if (!post(panel, { type: "ledgerNotice", lines: [{ text, warn }] })) throw new Error("ledger line undelivered")
    },
    render: () => updateItem(ledger, scans, current),
  })
}

/** 周期 / 事件刷新：`emit:false` = 仅 item（换项目即时刷新——不投递不记账）。 */
export async function refreshLedger(panel, { emit = true } = {}) {
  try {
    if (!emit) {
      const { ledger } = await loadCore()
      const { scans, current } = await scanFamily(ledger)
      updateItem(ledger, scans, current)
      return
    }
    await runScan(panel, { startup: false })
  } catch { /* 载入 / 扫描失败 → 降级不崩（N1）；下次周期拍重试 */ }
}

/** 启动行（webviewReady 时机——K3/U5：每次 webview 创建一次；post 门 = 任一项目可动作）。 */
export async function pushLedgerStartup(panel) {
  try { await runScan(panel, { startup: true }) } catch { /* 降级不崩（N1） */ }
}

/** item 建立 + 周期注册（幂等——`_initStatusBar` 每次 resolve 调用）。 */
export async function initLedgerSurface(panel) {
  if (!_item) {
    _item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99) // 先例 = chat-panel.mjs:156（主 item priority 100）
    _item.name = "ThinCoder Ledger"
  }
  await refreshLedger(panel, { emit: false })
  if (_timer) return
  const { ledger } = (await loadCore().catch(() => null)) ?? {}
  if (!ledger) return // 载入失败 → 无周期刷新（N1——降级不崩；再次 init 重试）
  _timer = setInterval(() => { refreshLedger(panel, { emit: true }) }, ledger.REFRESH_MS)
  _timer.unref?.()
}

/** 释放（panel dispose——重载 / 扩展卸载；再次 init 可重建）。 */
export function dispose() {
  if (_timer) clearInterval(_timer)
  _timer = null
  _item?.dispose?.()
  _item = null
}
