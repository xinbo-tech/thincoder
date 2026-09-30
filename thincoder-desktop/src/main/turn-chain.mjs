/**
 * turn-chain.mjs — 回合尾续发链 + 排队面出站（「回合中插入」批 · 机制单源 = `docs/desktop/design/PROJECT.md`
 * §2 **KD-40 ②③④**；出档 = 拆分层 —— `agent-host.mjs` 触 300 行顾问线，在册预案「续发链提取」本批落形）。
 *
 * 三面：
 *   ① `postQueue(key, delivered?)` —— `ev:queue` 出站两形（快照恒整置 · 幂等；`delivered` 在场 ⇒ 消费回执形 ——
 *      形 ∕ 推送点单源 = `docs/desktop/design/IPC.md` §1 `ev:queue` 行）；推送点三处 = 入队（调用面）·
 *      取批两时刻（本档）· 会话中止清队（调用面）。
 *   ② `stepBoundaryPickup(key, agent)` —— **步边界取批注入**（核循环头缝 `consumeQueuedInput` ——
 *      `pushReal` 普通 user 消息，**不中断**：在飞工具 ∕ signal 零触碰 · 下一步生效）；零消费两径 =
 *      空队 ∥ **批内含图**（整批让位 —— 同步缝不可落盘 ∕ 降级，KD-40 ⑤）；`slash` 首动作 ⇒ 单条即消费
 *      （统一语义 = 计划首动作即消费）。
 *   ③ `continueTurn(key, agent)` —— **回合尾续发**（结算后队非空 ⇒ 取批以普通回合送达，递归至队空；
 *      起跑前查在飞表 —— 已有在飞 ⇒ 零续发，队列留待该回合结算点 —— 单驱动器不变量）；队空 ∥ 取批失败 ⇒
 *      `false` ⇒ 调用面进既有挂起窗接管（**队列先于接管**）。取项 = **核件单源**（`queue.peek` 试算 ⇒
 *      `queue.take` 落取 —— 试算与落取同界）：合并批 ∕ 携图批**退化逐条**（逐条保图文同投；`slash` ⇒ 单条
 *      原文 · 保序 · 不合并）；送达面 `prepareTurnAttachments` 判决 ⇒ `degraded` 随消费回执浮出；
 *      取批失败 ⇒ 该条留队 + 一行诊断（零静默丢条）。
 *      **W2（parity-b4 · 非视觉降级接线）**：转 **async**（`Promise<boolean>` —— 调用面 `await`）；送达面
 *      与落取之间插**降级 await 窗**：`hold(key)` 占位护**单驱动器不变量**（窗内并发 `send` 同键 ⇒ 落队，
 *      不起第二回合；缺省 = 零占位），占位信号交降级（窗内 `interrupt` 命中占位 ⇒ 读图 fail-fast）；
 *      `release` 后同刻取批 ∕ 起跑（零 microtask 空窗）。**窗后查位**（裁定 (i) · #515② 同不变量）：
 *      `hold` 的「占位仍在」判据不成立（窗内 `dispose` ∕ 切项目级联）⇒ 零取批零起跑 + 本径落盘件自清
 *      （返回 `false`，交调用面窗后复查位收口）。
 *
 * 取批面（「桌面处理流 · VSC 对齐」批 R3）：批计划 ∕ 取项双单源 = 核件 `@thincoder/core/queued.mjs`（经
 * `queued-input.mjs` `plan` ∕ `peek` ∕ `take` 面消费——桌面收编，本档零第二取项判据）：步边界 = 计划首动作
 * 即消费（`slash` 同判）+ 携图批整批让位；尾径 = 核件取项（携图批退化逐条）。
 *
 * 注入面（`queue` / `post` / `prepare` / `drive` / `busyOf` / `degrade` / `hold` 七件）—— 零宿主依赖 ⇒ 平 node 直测。
 */
import { pushReal } from "@thincoder/core/context.mjs"
import { cleanupTurn } from "./attachments.mjs"
import { entryTimeOf } from "./queued-input.mjs"

/** 续发链工厂：`queue` = 宿主队列表（`queued-input.mjs` `createQueuedInput`）· `post(channel, payload)` = 出站面 ·
 *  `prepare(text, images, agent)` = 送达面附件装配（`prepareTurnAttachments` 转口 —— 出口零抛）·
 *  `drive(key, agent, text, attached)` = 普通回合起跑（宿主单回合执行面 + 接管尾 —— `send` 径同源）·
 *  `busyOf(key)` = 在飞判据（缺省 ⇒ 恒假）· `degrade(attached, agent, signal)` = 降级窗面（W2；缺省 ⇒ 零动作）·
 *  `hold(key)` = 降级窗占位（W2 —— 返回 `{ signal, active, release }`：`active()` = 占位仍在判据；缺省 = `null` ⇒ 零占位）。
 *  返回 `{ postQueue, stepBoundaryPickup, continueTurn }`。 */
export function createTurnChain({ queue, post, prepare, drive, busyOf = () => false, degrade = null, hold = null } = {}) {
  if (!queue || typeof post !== "function") throw new Error("[turn-chain] queue and post required (queue single source)")
  if (typeof prepare !== "function" || typeof drive !== "function") throw new Error("[turn-chain] prepare and drive required (delivery seams)")

  /** `ev:queue` 出站（快照整置；`delivered` = 消费回执 —— 步边界注入 ∕ 回合尾送达两时刻同形）。 */
  const postQueue = (key, delivered = null) => post("ev:queue", {
    key,
    items: queue.snapshot(key),
    ...(delivered === null ? {} : { delivered }),
  })

  /** ② 步边界取批注入（返回是否注入；零消费两径 = 空队 ∥ 携图批整批让位 —— 队列零触碰）。 */
  function stepBoundaryPickup(key, agent) {
    const plan = queue.plan(key)
    if (plan === null || plan.images.length > 0) return false
    queue.take(key) // 核件取项（就地消费 —— 与尾径同一取项单源）
    pushReal(agent, { role: "user", content: plan.text }) // 下一步生效（非中断通道）
    postQueue(key, { text: plan.text, ts: plan.ts })
    return true
  }

  /** ③ 回合尾续发（返回是否已续发 —— `false` ⇒ 调用面进既有接管；**async（W2）** —— 调用面 `await`；
   *  窗后查位不成立（占位被摘）⇒ `false` 零取批零起跑（本径落盘件自清 —— 裁定 (i)）。 */
  async function continueTurn(key, agent) {
    if (busyOf(key) === true) return false // 单驱动器不变量：起跑前查在飞表（队列留待该回合结算点）
    const peeked = queue.peek(key) // 试算（核件取项副本 —— 纯读；试算与落取同界）
    if (peeked === null) return false
    let attached = null
    try {
      attached = prepare(peeked.item.text, peeked.item.images, agent) // 送达面判决（落盘 ∕ 非视觉先落盘 ∕ 弃项）
    } catch (err) {
      console.error(`[turn-chain] queue delivery failed (${key}): ${err?.message ?? err} — kept`)
      return false // 该条留队（零静默丢条 —— 未取即未失）
    }
    // 降级窗（W2 · §2.2 径②）：占位落进在飞表 —— 窗内并发 `send` 同键 ⇒ 落队（单驱动器不变量）；
    // 窗内 `interrupt` 命中占位 ⇒ 占位 abort ⇒ 降级信号 abort（读图 fail-fast）。release 后同刻取批 ∕ 起跑。
    const held = typeof hold === "function" ? hold(key) : null
    let stillHeld = true
    try {
      if (typeof degrade === "function") attached = await degrade(attached, agent, held?.signal ?? null)
      stillHeld = held?.active?.() ?? true // 窗后查位（裁定 (i)：「占位仍在」判据）
    } finally {
      held?.release?.()
    }
    if (!stillHeld) {
      cleanupTurn(attached?.paths ?? []) // 本径落盘件自清（回合尾清理面不达 —— 零起跑）
      return false // 零取批零起跑（占位被摘 = 窗内 dispose ∕ 切项目级联；队列随会话已清 —— 交调用面收口）
    }
    queue.take(key) // 落取（核件取项就地 —— 与试算同界）
    const delivered = { text: peeked.item.text, ts: entryTimeOf(peeked.item) }
    if (typeof attached?.degraded === "string" && attached.degraded !== "") delivered.degraded = attached.degraded
    postQueue(key, delivered)
    drive(key, agent, typeof attached?.text === "string" ? attached.text : peeked.item.text, attached)
    return true
  }

  return { postQueue, stepBoundaryPickup, continueTurn }
}
