/**
 * ledger-surface.mjs — TUI 台账可见面胶水（K-LX3 归核：实现单源 = `@thincoder/core/ledger-surface.mjs`，
 * 本档只剩**动态 import + TUI 色表注入**两件事——端壳静态链不得达 `node:sqlite`（W8 契约②）；
 * 载入失败 = 降级不崩（N1），扫描拍重试）。
 *
 * 三面语义（启动行 / 变化行 / 状态位）见核档头注；判活展示（F-LX1）亦随归核自动带上——
 * 本档零实现、零复刻（KD-M2-3）。
 */
import { C } from "./ansi.mjs"

/** 核台账面惰性载入（动态 import——失败不缓存，下次扫描拍重试；N1 降级不崩）。 */
let _core = null
function loadCore() {
  if (!_core) {
    _core = import("@thincoder/core/ledger-surface.mjs")
    _core.catch(() => { _core = null })
  }
  return _core
}

/** 单次扫描（直驱面——直通核实现；TUI 色表 `C` 注入）。 */
export async function runLedgerScan(opts = {}) {
  const core = await loadCore()
  return core.runLedgerScan({ ...opts, colors: C })
}

/** TUI 挂载（首扫 + 周期——直通核实现；载入失败 → 空句柄 = 无周期，N1 降级不崩）。 */
export function startLedgerSurface(ctx = {}) {
  return loadCore()
    .then((core) => core.startLedgerSurface({ ...ctx, colors: C }))
    .catch(() => ({ dispose() {} }))
}
