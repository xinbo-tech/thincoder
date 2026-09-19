/**
 * activity-diag.js — 子代理活动块诊断痕迹（2026-09-19 出生可见性批——WEBVIEW.md §5.3；D-W22
 * 自 `activity.js` 迁出——原 `state.js` 的 `_subTraceLog` / `SUB_TRACE_MAX` 载体同迁）。
 *
 * 单一写点：`activity.js`（编排面调用点）· `streaming.js`（内容 chunk 面）；读者 = 主侧日志
 * （经 `panelDiag` 上行 → host `ev:subtrace`）——NFR-A2：复发时「host 投了没（`ev:subdeliver`）
 * 与「webview 收了做什么（`ev:subtrace`）」两面同载，判定缺口闭合。
 *
 * kind 族（七类——§5.3）：`birth`（新块出生——正收据）· `takeover`（新代接管）·
 * `late-terminal-stub`（终态补桩）· `drop-frozen`（冻结键吞掉的非出生消息）·
 * `drop-tombstone`（元素被移除的键吞掉）· `drop-unknown-role`（前置不满足的终态）·
 * `reassert-hit`（心跳命中已 live 块——正收据）。
 * 留痕节律：出生 / 状态面**逐条**（`traceSub`）；高频面（内容 chunk / 心跳命中）**每频道每
 * 生命周期首条**（`traceSubOnce`——`clearSubTraceChannel` 随新代接管重置该频道去重键）。
 * 环形上界 `SUB_TRACE_MAX = 50`（丢最旧）；上行 = `panelDiag`（批内合并——最多一消息 / 批）。
 */
import { vscode } from "./state.js"

export const SUB_TRACE_MAX = 50

const _log = [] // 环形载体（末 SUB_TRACE_MAX 条）——{ kind, channel, at }
const _once = new Set() // 高频面去重键：`${kind}|${channel}`（每频道每生命周期首条）
let _batch = [] // 上行批缓冲（panelDiag 批内合并）
let _scheduled = false

/** 逐条留痕（出生 / 状态面——§5.3 节律）。 */
export function traceSub(kind, channel) {
  push({ kind, channel, at: Date.now() })
}

/** 每频道每生命周期首条（高频面：内容 chunk 丢弃 / 心跳命中——量级不可控）。 */
export function traceSubOnce(kind, channel) {
  const key = `${kind}|${channel}`
  if (_once.has(key)) return false
  _once.add(key)
  push({ kind, channel, at: Date.now() })
  return true
}

/** 生命周期边界（新代接管）：重置该频道去重键——新一代的丢弃 / 命中面重新计首条。 */
export function clearSubTraceChannel(channel) {
  for (const key of [..._once]) {
    if (key.endsWith(`|${channel}`)) _once.delete(key)
  }
}

/** 环形快照（测试 / 诊断读面——返回载体本身：调用方只读）。 */
export function subTraceEntries() {
  return _log
}

/** 全清（测试复位面——环载体随 webview 生命周期，不随 resetActivity 清）。 */
export function resetSubTrace() {
  _log.length = 0
  _once.clear()
  _batch = []
  _scheduled = false
}

function push(entry) {
  _log.push(entry)
  if (_log.length > SUB_TRACE_MAX) _log.splice(0, _log.length - SUB_TRACE_MAX)
  _batch.push(entry)
  scheduleFlush()
}

function scheduleFlush() {
  if (_scheduled) return
  _scheduled = true
  setTimeout(flushSubTrace, 0)
}

/** 批内合并上行（`WEBVIEW-PROTOCOL.md` §3.2 行 8——最多一消息 / 批）：`panelDiag{subTrace}`
 *  → host case → `logEvent("ev:subtrace", …)`。上行失败静默（诊断面不反噬主流程）。 */
function flushSubTrace() {
  _scheduled = false
  if (_batch.length === 0) return
  const entries = _batch
  _batch = []
  try {
    vscode.postMessage({ type: "panelDiag", kind: "subTrace", entries })
  } catch { /* 诊断上行失败不反噬 */ }
}
