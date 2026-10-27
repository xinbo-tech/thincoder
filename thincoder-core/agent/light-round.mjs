/**
 * agent/light-round.mjs — 轻通道代码笔通路谓词（F-LC5 · 设计 = `docs/core/design/LIGHT-CHANNEL.md` §2.8）。
 *
 * `lightRoundOpen(agent)`：闸读判据——**两件双在盘**才算轻通道轮在盘：
 *   ① 轮次台账行：`status = 在途` ∧ `title` 携「收尾链待跑」（轮型标记 = 闸凭据）∧ `task_book` 非空；
 *   ② 该指针指向的轮次批档：`§1` 状态行 = 「进行中」（判定器单源 = `readBatchStatusLine`）。
 * 语义：开门动作 ≡ 开轮两件落盘（「启动即挂账」本体——无独立于账的开门面）；单件不放行（轮档独在 ∥ 行独在 ∥
 * 无标记 ∥ 行非在途 ∥ 指针失据 ∥ 档已收口 ⇒ 皆 false）；收口即自闭（信号生命周期 = 账生命周期——零撤销动作 ∥
 * 零跨轮残留）。读错 ∥ 不可判 ⇒ `false`（fail-closed——照拦；被拦时文案不因读错而变）。
 *
 * 2026-10-27（三链统一批 · 设计档 §2.2）：谓词与查找面**迁 `live-batch.mjs` 单源**——它与「活批档」
 * （写锁的判据）同形，两份实现必然漂移（漂移后「闸放的」和「锁拦的」各说各话）。本档只剩薄壳：
 * 同一读法 + 一个轮型标记过滤（`title` 必须携「收尾链待跑」）。导出名与签名零变。
 */

/** 轻通道轮在盘谓词（异步 · 只读 · fail-closed）。契约见头注。
 * @param {object} agent — 会话 agent（读 `cwd`）
 * @returns {Promise<boolean>} true = 放行（在盘轮次）；读错 ∥ 不可判 ⇒ false（照拦）
 */
export async function lightRoundOpen(agent) {
  try {
    const cwd = agent?.cwd
    if (typeof cwd !== "string" || cwd.trim() === "") return false
    // 判据与查找面单源 = `live-batch.mjs`（本档只加轮型标记过滤）；两枚都动态 import（惰性 + W8 契约②）。
    const { liveBatchOpen } = await import("./live-batch.mjs")
    const { ROUND_MARKER } = await import("../ledger.mjs")
    const res = await liveBatchOpen(agent, { roundMarker: ROUND_MARKER })
    return res.open === true
  } catch {
    return false // 读错 ∥ 不可判 ⇒ fail-closed（照拦）
  }
}
