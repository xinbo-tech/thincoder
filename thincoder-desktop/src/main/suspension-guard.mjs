/**
 * suspension-guard.mjs — 降级窗占位守卫序列出档（自 `suspension-drive.mjs` 拆出——该档越 300 顾问线，
 * 按在册拆分预案「窗内时效 ∕ 时序守卫面出档（≈30 行）」落形；批档 =
 * `docs/batches/2026-09-29-queue-pickup-edge.md` §2.10 出档预案）。
 *
 * 序列（hold 占位三件——链径现式，纯结构搬 ∕ 零行为变）：起窗（缺省 ⇒ 零占位）⇒ 送达面（降级信号 =
 * 占位信号直通）⇒ 窗后查位（裁定 (i)：「占位仍在」判据）⇒ `release`（幂等且仅当占位仍属本刻）。
 * 差异面留调用点：裁决回传后的控制流（`return` ∕ `break`）与 `consumed` 用法（`driveTurn` 用户回合支 ·
 * `resumeResidual` 残值链两处）。
 *
 * 零宿主依赖（`hold` ∕ `deliver` 两注入，缺省 ∥ 非函数 ⇒ 零占位径）⇒ 平 node 直测。
 */

/** 守卫序列：起窗 ⇒ `deliver(signal)` ⇒ 窗后查位 ⇒ `release`；返回 `{ stillHeld, consumed }`——
 *  `stillHeld` 假 ⇒ 零起跑（调用点自处本径落盘件自清 ∧ 不重投——判据同链径）。 */
export async function guardedDeliver(key, hold, deliver) {
  const held = typeof hold === "function" ? hold(key) : null // 起窗（降级 await 窗占位 —— 单驱动器不变量；缺省 ⇒ 零占位）
  let stillHeld = true
  let consumed = null
  try {
    consumed = await deliver(held?.signal ?? null) // 送达面（携图径）⇒ 消费帧（降级信号 = 占位）
    stillHeld = held?.active?.() ?? true // 窗后查位（裁定 (i)：「占位仍在」判据）
  } finally {
    held?.release?.() // 占位释放（链径现式 —— 幂等且仅当占位仍属本刻）
  }
  return { stillHeld, consumed }
}
