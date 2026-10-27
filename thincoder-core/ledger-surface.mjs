/**
 * ledger-surface.mjs — 台账可见面（核内结构归位；CORE-UNIFICATION §2.5 #174「融合：取一侧」）。
 *
 * 面：族扫描 → 判活批量解析 → 状态位（`state.ledger`——L1 常驻标记，范围归约 `scopeMarkerOf`
 * 单源 §7.2，渲染端消费）；只读台账，本面零写。
 *
 * **写后即时**（2026-10-13 缺陷修复——用户原话「写了以后就要立即更新」）：台账库目录
 * `fs.watch` ⇒ 去抖立即重扫（同进程 ∥ 跨进程写皆覆盖）；`REFRESH_MS` 周期降为兜底。
 */
import { watch } from "node:fs"
import { buildScan, discoverFamily, REFRESH_MS, resolveExecutorStates, scopeMarkerOf } from "./ledger.mjs"
import { ledgerDirPath } from "./ledger-db.mjs"

/** 单次扫描（直驱面——timer 包装见 `startLedgerSurface`）。**async**（F-LX1：await 判活解析——
 *  LEDGER.md §7.3.1 ④ 读面不阻塞事件循环）。 */
export async function runLedgerScan({ state, agent = null, anchor = null, render = () => {} } = {}) {
  const base = anchor ?? agent?.cwd
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

/** 挂载：首扫（`setImmediate`——不抢首帧）+ 周期兜底（`REFRESH_MS`）
 *  + **写后即时**（台账库目录变更 ⇒ 去抖 400ms 重扫——同进程 ∥ 跨进程写皆覆盖）。
 *  `tick` 异步化（F-LX1——runLedgerScan async）：await 且 catch 不崩（N1）。重叠防衛：
 *  判活探测秒级可达，上一轮未落定时跳过本轮（防探束堆积）。
 *  `state.processing` 跳过仅限**定时轮**（不打断回合帧）；库变更轮放行（写后立即可见 ——
 *  用户 2026-10-13「写了以后就要立即更新」）。
 *  评审 #5 修复（2026-10-13）：① 变更轮遇在途扫描 ⇒ 记待办、落定补跑（不丢）；② watcher 缺席
 *  （目录未建）⇒ 2s 短重试补挂（闭「首写才建」窗口）。 */
export function startLedgerSurface(ctx = {}) {
  let disposed = false
  let timer = null
  let inflight = false
  let watcher = null
  let schedTimer = null
  let armTimer = null
  let pendingForce = false
  const tick = async (force = false) => {
    if (disposed) return
    if (inflight) { if (force) pendingForce = true; return } // 在途扫描：变更轮记待办（落定补跑——不丢）
    if (!force && ctx.state?.processing) return // 定时轮不打断回合帧
    inflight = true
    try { await runLedgerScan(ctx) } catch { /* 可见面尽力——不崩（N1） */ } finally { inflight = false }
    armWatcher() // 目录可能首写才建——每轮后补挂一次（零成本：已挂则直接返）
    if (pendingForce && !disposed) { pendingForce = false; void tick(true) } // 补跑被在途挤掉的变更轮
  }
  const onFsEvent = (_evt, name) => {
    if (name && !/\.db($|-(wal|shm|journal)$)/.test(String(name))) return
    if (schedTimer) clearTimeout(schedTimer)
    schedTimer = setTimeout(() => { schedTimer = null; tick(true) }, 400)
    schedTimer.unref?.()
  }
  function armWatcher() {
    if (disposed || watcher) return
    try {
      watcher = watch(ledgerDirPath(), { persistent: false }, onFsEvent)
      watcher.unref?.()
      if (armTimer) { clearTimeout(armTimer); armTimer = null }
    } catch {
      // 目录未建（首写才建）——2s 短重试补挂（评审 #5 发现②：闭「首写不被观测」窗口）
      if (!armTimer) {
        armTimer = setTimeout(() => { armTimer = null; armWatcher() }, 2000)
        armTimer.unref?.()
      }
    }
  }
  setImmediate(() => {
    if (disposed) return
    tick()
    timer = setInterval(() => tick(), REFRESH_MS)
    timer.unref?.()
  })
  armWatcher()
  return {
    dispose() {
      disposed = true
      if (timer) clearInterval(timer)
      if (schedTimer) clearTimeout(schedTimer)
      if (armTimer) clearTimeout(armTimer)
      if (watcher) watcher.close()
      timer = null
      schedTimer = null
      armTimer = null
      watcher = null
    },
  }
}
