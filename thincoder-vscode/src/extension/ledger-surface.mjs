/**
 * ledger-surface.mjs — VSC 台账可见面（W4 接入核机制）。
 *
 * 面：① 状态栏 item（text = L1 标记——核 `scopeMarkerOf` 单源（范围合计，§7.2）/ tooltip =
 * 明细行集 L2 行（端侧 `scanFamily` 直取——与核同文）/ warn → warningBackground / 空标记
 * （空范围）→ hide；无点击命令——K4）② 周期刷新（`REFRESH_MS`）与换项目即时刷新。
 * 只读台账——本面零写。
 *
 * 数据面（`@thincoder/core/ledger.mjs`）**动态 import**（KD-M2-3：`ledger.mjs` 静态链
 * `node:sqlite`——静态 import 会把 `node:sqlite` 拽进端壳静态闭包、破 W8 契约②；机检 = 批件
 * `docs/batches/2026-09-29-residuals-round2.test.mjs`——W8 契约②判据现载体，单测树重建时回迁端侧单测档）。
 * 载入失败 = 低宿主 / 打包缺件 → 本面降级不崩（N1），刷新拍重试。
 */
import * as vscode from "vscode"
import { _cwd } from "./panel-messages.mjs"

let _item = null
let _timer = null
let _anchor = null

/** 核台账数据面惰性载入（KD-M2-3 动态 import——失败不缓存，下次刷新拍重试；N1 降级不崩）。 */
let _core = null
function loadCore() {
  if (!_core) {
    _core = import("@thincoder/core/ledger.mjs")
    _core.catch(() => { _core = null })
  }
  return _core
}

/** 测试缝：注入当前项目锚（不设 = 生产缺省；同 config-io `_setConfigPathForTest` 先例）。 */
export function _setLedgerSurfaceForTest(opts = {}) {
  if ("cwd" in opts) _anchor = opts.cwd ?? null
  return { cwd: _anchor }
}

/** 族扫描（项目解析 + 汇总——不可读项目跳过，余者照常；N1/T110①）。
 *  **async**（F-LX1）：await 判活解析（resolveExecutorStates——一次探束 + TTL 缓存；
 *  无在途零 exec），tooltip 行集与核 L2 同拍同文（K-LX3 同源 `formatDetailLine`）。 */
async function scanFamily(ledger) {
  const family = ledger.discoverFamily(_anchor ?? _cwd())
  const scans = []
  for (const p of family.projects) {
    try { scans.push(ledger.buildScan({ cwd: p.root })) } catch { /* 不可读 → 跳过 */ }
  }
  await ledger.resolveExecutorStates(scans)
  const current = family.current ? scans.find((s) => s.root === family.current.root) ?? null : null
  return { scans, current, family }
}

/** item 更新（端侧实现）：标记 ∥ warn 走核单源 `scopeMarkerOf`（范围归约——§7.2；
 *  端零自算）；空标记（空范围）→ hide（K6/U4）。 */
function updateItem(ledger, scans, current, family) {
  if (!_item) return
  const { marker, warn } = ledger.scopeMarkerOf(scans, family)
  if (!marker) { _item.hide(); return }
  _item.text = marker
  _item.tooltip = new vscode.MarkdownString(ledger.detailScans(scans, current).map((s) => ledger.formatDetailLine(s)).join("\n"))
  _item.backgroundColor = warn ? new vscode.ThemeColor("statusBarItem.warningBackground") : undefined
  _item.show()
}

/** 刷新（周期 ∕ 换项目事件 ∥ 首建共用一径）：族扫描 → item 更新——不投递。 */
export async function refreshLedger(panel) {
  try {
    const ledger = await loadCore()
    const { scans, current, family } = await scanFamily(ledger)
    updateItem(ledger, scans, current, family)
  } catch { /* 载入 / 扫描失败 → 降级不崩（N1）；下次周期拍重试 */ }
}

/** item 建立 + 周期注册（幂等——`_initStatusBar` 每次 resolve 调用）。 */
export async function initLedgerSurface(panel) {
  if (!_item) {
    _item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99) // 先例 = chat-panel.mjs:156（主 item priority 100）
    _item.name = "ThinCoder Ledger"
  }
  await refreshLedger(panel)
  if (_timer) return
  const ledger = await loadCore().catch(() => null)
  if (!ledger) return // 载入失败 → 无周期刷新（N1——降级不崩；再次 init 重试）
  _timer = setInterval(() => { refreshLedger(panel) }, ledger.REFRESH_MS)
  _timer.unref?.()
}

/** 释放（panel dispose——重载 / 扩展卸载；再次 init 可重建）。 */
export function dispose() {
  if (_timer) clearInterval(_timer)
  _timer = null
  _item?.dispose?.()
  _item = null
}
