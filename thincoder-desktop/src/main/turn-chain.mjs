/**
 * turn-chain.mjs — 回合尾续发链 + 排队面出站（「回合中插入」批 · 机制单源 = `docs/desktop/design/PROJECT.md`
 * §2 **KD-40 ②③④**；出档 = 拆分层 —— `agent-host.mjs` 触 300 行顾问线，在册预案「续发链提取」本批落形）。
 *
 * 三面：
 *   ① `postQueue(key, delivered?)` —— `ev:queue` 出站两形（快照恒整置 · 幂等；`delivered` 在场 ⇒ 消费回执形 ——
 *      形 ∕ 推送点单源 = `docs/desktop/design/IPC.md` §1 `ev:queue` 行）；推送点三处 = 入队（调用面）·
 *      取批两时刻（本档）· 会话中止清队（调用面）。
 *   ② `stepBoundaryPickup(key, agent)` —— **步边界取批注入**（核循环头缝 `consumeQueuedInput` ——
 *      `pushReal` 普通 user 消息，**不中断**：在飞工具 ∕ signal 零触碰 · 下一步生效）；零消费三径 =
 *      空队 ∥ `slash` 首动作（防御面 —— 桌面无斜杠面，不留步边界）∥ **批内含图**（整批让位 —— 同步缝不可
 *      落盘 ∕ 降级，KD-40 ⑤）。
 *   ③ `continueTurn(key, agent)` —— **回合尾续发**（结算后队非空 ⇒ 取批以普通回合送达，递归至队空；
 *      起跑前查在飞表 —— 已有在飞 ⇒ 零续发，队列留待该回合结算点 —— 单驱动器不变量）；队空 ∥ 取批失败 ⇒
 *      `false` ⇒ 调用面进既有挂起窗接管（**队列先于接管**）。取批**整批不拆**（携图批同批送达 —— 防文本与
 *      图分离）；`slash` 首动作 ⇒ 逐条直发（单条 · 保序 · 不合并 —— 父侧 2026-09-28 裁定：桌面闲态同文本即
 *      普通消息 ⇒ 送达同义，零静默丢）；送达面 `prepareTurnAttachments` 判决 ⇒ `degraded` 随消费回执浮出；
 *      取批失败 ⇒ 该条留队 + 一行诊断（零静默丢条）。
 *
 * 取批面（「桌面处理流 · VSC 对齐」批 R3）：批计划单源 = 核件 `@thincoder/core/queued.mjs`（经 `queued-input.mjs` `plan` 面消费）；
 * **取项边缘 = KD-40 在册裁定**（slash 逐条直发 ∕ 携图批不拆 —— 父侧 2026-09-28 裁）⇒ 桌面不消费核
 * `takeQueuedBatchItem`（VSC 载具取项面：携图批退化逐条 ∕ slash 零动作）。
 *
 * 注入面（`queue` / `post` / `prepare` / `drive` / `busyOf` 五件）—— 零宿主依赖 ⇒ 平 node 直测。
 */
import { pushReal } from "@thincoder/core/context.mjs"
import { entryTimeOf } from "./queued-input.mjs"

/** 续发链工厂：`queue` = 宿主队列表（`queued-input.mjs` `createQueuedInput`）· `post(channel, payload)` = 出站面 ·
 *  `prepare(text, images, agent)` = 送达面附件装配（`prepareTurnAttachments` 转口 —— 出口零抛）·
 *  `drive(key, agent, text, attached)` = 普通回合起跑（宿主单回合执行面 + 接管尾 —— `send` 径同源）·
 *  `busyOf(key)` = 在飞判据（缺省 ⇒ 恒假）。返回 `{ postQueue, stepBoundaryPickup, continueTurn }`。 */
export function createTurnChain({ queue, post, prepare, drive, busyOf = () => false } = {}) {
  if (!queue || typeof post !== "function") throw new Error("[turn-chain] queue and post required (queue single source)")
  if (typeof prepare !== "function" || typeof drive !== "function") throw new Error("[turn-chain] prepare and drive required (delivery seams)")

  /** `ev:queue` 出站（快照整置；`delivered` = 消费回执 —— 步边界注入 ∕ 回合尾送达两时刻同形）。 */
  const postQueue = (key, delivered = null) => post("ev:queue", {
    key,
    items: queue.snapshot(key),
    ...(delivered === null ? {} : { delivered }),
  })

  /** ② 步边界取批注入（返回是否注入；零消费三径见档头 —— 队列零触碰）。 */
  function stepBoundaryPickup(key, agent) {
    const plan = queue.plan(key)
    if (plan === null || plan.slash || plan.images.length > 0) return false
    queue.take(key, plan.entries.length)
    pushReal(agent, { role: "user", content: plan.text }) // 下一步生效（非中断通道）
    postQueue(key, { text: plan.text, ts: entryTimeOf(plan.entries[0]) })
    return true
  }

  /** ③ 回合尾续发（返回是否已续发 —— `false` ⇒ 调用面进既有接管）。 */
  function continueTurn(key, agent) {
    if (busyOf(key) === true) return false // 单驱动器不变量：起跑前查在飞表（队列留待该回合结算点）
    const plan = queue.plan(key)
    if (plan === null) return false
    let attached = null
    try {
      attached = prepare(plan.text, plan.images, agent) // 送达面判决（落盘 ∕ 非视觉降级 ∕ 弃项）
    } catch (err) {
      console.error(`[turn-chain] queue delivery failed (${key}): ${err?.message ?? err} — kept`)
      return false // 该条留队（零静默丢条 —— 未取即未失）
    }
    queue.take(key, plan.entries.length)
    const delivered = { text: plan.text, ts: entryTimeOf(plan.entries[0]) }
    if (typeof attached?.degraded === "string" && attached.degraded !== "") delivered.degraded = attached.degraded
    postQueue(key, delivered)
    drive(key, agent, typeof attached?.text === "string" ? attached.text : plan.text, attached)
    return true
  }

  return { postQueue, stepBoundaryPickup, continueTurn }
}
