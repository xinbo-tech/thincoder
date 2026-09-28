/**
 * turn-face.mjs — 宿主**单回合执行面**出档（桌面空闲唤醒批：自 `agent-host.mjs` 提取 —— 该档触 300 行顾问线，
 * 在册预案「回合执行面再出档」落形；`docs/desktop/design/PROJECT.md` §4.2 本批行 · KD-34）。
 * 单源面（`send` ∕ 挂起驱动**同源**调用）：① 在飞表占位（单驱动器 ⇒ 禁双 `runAgent`）② 起跑（`suspDriven: true`
 * = 已 settle **留池等消化** —— 撤回合尾直注入兜底，消化由回合尾挂起接管承担）③ 三径结算（落盘 → 读数 →
 * 终局事件：done / stopped / error）④ 释放在飞 + 附件清理；**步边界取批缝**（「回合中插入」批 —— 用户回合传
 * `consumeQueuedInput` ∕ 消化轮不传 —— 取批策略住 `turn-chain.mjs`）。
 * **点修轮（U-6 ∕ U-7）**：回合起跑落**回合代次**（`turnGate.stamp`）· 回合尾落盘前查位（`turnGate.revoked` ——
 * 会话中止径 ⇒ 零写：已删会话不得被回合尾落盘复活）；两查位同源 = 宿主 `agent-host.mjs` 中止墓碑单点。
 * 失败**抛回调用面**：`send` 径自吞（终局事件已出）；驱动径消费核件 catch 语义（AbortError = 回合级 ⇒ 核件循环重入）。
 * 提示面档①（用户回合完成）**不在本档**：判据在调用面（`!autoTurn` 且成功径 —— VSC `panel-callbacks.mjs:233` 同源）。
 * 零宿主依赖（五件注入面）⇒ 平 node 直测。
 * **对齐第三批（`docs/desktop/design/UI.md` §1 本批注项 9 / KD-37）**：错误径 `ev:error` 携 `techInfo`
 * （宿主 `err.stack` —— 缺 ⇒ 键缺席；错误横幅 `details` 载波）；落点说明 = 结算三径实现体住本档
 * （自 `agent-host.mjs` 提取后为 `ev:error` 唯一出站点）。
 */
import { cleanupTurn } from "./attachments.mjs"
import { saveAgentSlot } from "./session-io.mjs"

/** 错误详情载波（「对齐第三批」项 9 · KD-37）：`techInfo` = 宿主 `err.stack` —— 缺 ∥ 非串 ∥ 空串 ⇒ **键缺席**
 *  （错误横幅 `details` 面据此在场；载荷形单源 = `docs/desktop/design/IPC.md` §1 `ev:error` 行）。纯函数、零抛。 */
function techInfoOf(err) {
  const stack = err?.stack
  return typeof stack === "string" && stack !== "" ? { techInfo: stack } : {}
}

/** 单回合执行面工厂：`post(channel, payload)` = 出站面 · `run(agent, text, callbacks, opts)` = 回合运行器 ·
 *  `bridge(key)` = 回调桥取值面 · `postUsage(key, agent)` = 回合尾读数（`agent-host.mjs` 单源）·
 *  `flights` = 在飞表（key → AbortController —— 单驱动器不变量）·
 *  `queuedPickup(key)` = 步边界取批缝供面（「回合中插入」批 —— 返回核 `consumeQueuedInput` 回调 ∥ `null`；缺省 ⇒ 不接缝）·
 *  `turnGate` = 回合代次面（`{ stamp(key, agent), revoked(key, agent) }` —— 中止墓碑两查位同源；缺省 ⇒ 零落位 ∥ 恒不判失）。
 *  返回 `{ executeTurn }`。 */
export function createTurnFace({ post, run, bridge, postUsage, flights, queuedPickup = null, turnGate = null }) {
  /** 中止墓碑查位（U-7）：本回合代次 ≠ 当前代次 ⇒ 会话中止径（`dispose` ∕ 切项目）⇒ 落盘零写；
   *  `turnGate` 缺省 ∥ 代理未落代次 ⇒ 恒假（零回归）。 */
  const revokedTurn = (key, agent) => turnGate?.revoked?.(key, agent) === true
  /** 单回合执行（调用面不 await 亦可 —— 结算自吞；拒绝向调用面抛回，见档头）。
   *  `sessionSignal` 在场（窗内回合）⇒ 会话中止逐链中止本回合（`dispose` / 切项目级联 —— 已中止则即时中止）。 */
  async function executeTurn(key, agent, text, opts = {}) {
    const controller = new AbortController()
    flights.set(key, controller)
    turnGate?.stamp?.(key, agent) // 回合代次落位（U-6 ∕ U-7 两查位同源 —— 缺省 ⇒ 零动作）
    const sessionSignal = opts.sessionSignal ?? null
    if (sessionSignal) {
      if (sessionSignal.aborted) controller.abort()
      else sessionSignal.addEventListener("abort", () => controller.abort(), { once: true })
    }
    const attached = opts.attached ?? null
    // 步边界取批缝（「回合中插入」批 · KD-40 ②）：**用户回合传 ∕ 消化轮（`autoTurn`）不传**
    //（沿 VSC 分流 `panel-turn-loop.mjs` —— `autoTurn ? null : …`；系统轮不接步边界 pickup）。
    const pickup = opts.autoTurn === true || typeof queuedPickup !== "function" ? null : queuedPickup(key)
    try {
      await run(agent, text, bridge(key), {
        signal: controller.signal,
        autoTurn: opts.autoTurn === true,
        upstreamTurn: opts.upstreamTurn === true,
        timerTurn: opts.timerTurn === true, // 旗标仅供域文本选择（核 opts 四件 ⇒ 五件 —— §6.30.11 透传）
        suspDriven: true,
        ...(pickup === null ? {} : { consumeQueuedInput: pickup }), // 核循环头缝（`thincoder-core/agent.mjs:247` —— 只接不改）
      })
      if (!revokedTurn(key, agent)) saveAgentSlot(agent) // 落盘先于终局事件（§1.14 ②；中止径零写 —— U-7）
      postUsage(key, agent) // 回合尾读数（同点：落盘后 · 终局事件前）
      post("ev:activity", { key, event: "done" })
    } catch (err) {
      if (!revokedTurn(key, agent)) saveAgentSlot(agent) // 三路同序（CLI 先例 = 回合 finally 尾部保存；中止径零写 —— U-7）
      postUsage(key, agent) // 三径同点（中断 / 错误同样出本回合读数）
      if (controller.signal.aborted) post("ev:activity", { key, event: "stopped" })
      else post("ev:error", { key, message: String(err?.message ?? err), ...techInfoOf(err) })
      throw err
    } finally {
      if (flights.get(key) === controller) flights.delete(key) // 先释放在飞 —— 清理自吞错（`cleanupTurn` 出口零抛 —— 回合驱动零承担）
      cleanupTurn(attached?.paths ?? [])
    }
    return { ok: true }
  }
  return { executeTurn }
}
