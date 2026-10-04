/**
 * ledger-surface.mjs — 台账可见面（核内结构归位；CORE-UNIFICATION §2.5 #174「融合：取一侧」）。
 *
 * 面：族扫描 → 判活批量解析 → 状态位（`state.ledger`——L1 常驻标记，范围归约 `scopeMarkerOf`
 * 单源 §7.2，渲染端消费）；只读台账，本面零写。
 */
import { buildScan, discoverFamily, REFRESH_MS, resolveExecutorStates, scopeMarkerOf } from "./ledger.mjs"

/** 单次扫描（直驱面——timer 包装见 `startLedgerSurface`）。**async**（F-LX1：await 判活解析——
 *  LEDGER.md §7.3.1 ④ 读面不阻塞事件循环）。 */
export async function runLedgerScan({ state, agent = null, anchor = null, render = () => {} } = {}) {
  const base = anchor ?? agent?.cwd ?? process.cwd()
  const family = discoverFamily(base)
  const scans = []
  for (const p of family.projects) {
    try { scans.push(buildScan({ cwd: p.root })) } catch { /* 台账不可读 → 该项目跳过（余者照常——N1/T110①） */ }
  }
  await resolveExecutorStates(scans) // 判活批量解析（一次探束 + TTL 缓存；无在途零 exec）
  // 范围归约 = `scopeMarkerOf` 单源（§7.2——容器根锚求和 ∥ 具体项目锚只显自身）；warn 判位钉在
  // 判活解析之后（裁定 #7）：属主已死也是可动作态
  const { marker, warn } = scopeMarkerOf(scans, family)
  state.ledger = { marker, warn, scannedAt: Date.now() }
  render()
}

/** 挂载：首扫（`setImmediate`——不抢首帧）+ 周期（`REFRESH_MS`；`state.processing` 期间跳过本轮）。
 *  `tick` 异步化（F-LX1——runLedgerScan async）：await 且 catch 不崩（N1）。重叠防衛：
 *  判活探测秒级可达，上一轮未落定时跳过本轮（防探束堆积）。 */
export function startLedgerSurface(ctx = {}) {
  let disposed = false
  let timer = null
  let inflight = false
  const tick = async () => {
    if (disposed || inflight) return
    if (ctx.state?.processing) return // 扫描不打断回合帧
    inflight = true
    try { await runLedgerScan(ctx) } catch { /* 可见面尽力——不崩（N1） */ } finally { inflight = false }
  }
  setImmediate(() => {
    if (disposed) return
    tick()
    timer = setInterval(() => tick(), REFRESH_MS)
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
