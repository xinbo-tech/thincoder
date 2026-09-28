/**
 * turn-face.mjs — 宿主**单回合执行面**出档（桌面空闲唤醒批：自 `agent-host.mjs` 提取 —— 该档触 300 行顾问线，
 * 在册预案「回合执行面再出档」落形；`docs/desktop/design/PROJECT.md` §4.2 本批行 · KD-34）。
 * 单源面（`send` ∕ 挂起驱动**同源**调用）：① 在飞表占位（单驱动器 ⇒ 禁双 `runAgent`）② 起跑（`suspDriven: true`
 * = 已 settle **留池等消化** —— 撤回合尾直注入兜底，消化由回合尾挂起接管承担）③ 三径结算（落盘 → 读数 →
 * 终局事件：done / stopped / error）④ 释放在飞 + 附件清理；**步边界取批缝**（「回合中插入」批 —— 用户回合传
 * `consumeQueuedInput` ∕ 消化轮不传 —— 取批策略住 `turn-chain.mjs`）。
 * **点修轮（U-6 ∕ U-7）**：回合起跑落**回合代次**（`turnGate.stamp`）· 回合尾落盘前查位（`turnGate.revoked` ——
 * 会话中止径 ⇒ 零写：已删会话不得被回合尾落盘复活）；两查位同源 = 回合驱动族 `turn-driver.mjs` 中止墓碑单点。
 * 失败**抛回调用面**：`send` 径自吞（终局事件已出）；驱动径消费核件 catch 语义（AbortError = 回合级 ⇒ 核件循环重入）。
 * **输入逻辑收正轮（Ctrl+I 同上下文续跑）**：`run` 调用收进内层续跑循环 —— 中止携 `signal.reason.interrupt + message`
 * （宿主 `interrupt` 的核 abort 面 / VSC `panel-messages-turn.mjs:129-138`）⇒ 换代 controller 并 `resume: true` 重入
 * （核已提交部分输出 + `[User interrupt: …]` 已落历史 —— VSC `panel-turn-loop.mjs:114-129` ∕ CLI `agent-turn.mjs:159-179` 同式）。
 * 提示面档①（用户回合完成）**不在本档**：判据在调用面（`!autoTurn` 且成功径 —— VSC `panel-callbacks.mjs:233` 同源）。
 * 零宿主依赖（注入面清单见工厂注）⇒ 平 node 直测。
 * **对齐第三批（`docs/desktop/design/UI.md` §1 本批注项 9 / KD-37）**：错误径 `ev:error` 携 `techInfo`
 * （宿主 `err.stack` —— 缺 ⇒ 键缺席；错误横幅 `details` 载波）；落点说明 = 结算三径实现体住本档
 * （自 `agent-host.mjs` 提取后为 `ev:error` 唯一出站点）。
 * **R3（#505 · 撞帽续跑 —— KD-T8）**：续跑循环接纳**撞帽三径**（核 `agent/helpers.mjs:237` `ContinueError`；
 * 抛出点 `agent.mjs:451`）：`autoTurn`（消化 ∕ 上行 ∕ timer 轮——无人值守档）⇒ **cap 即收口**（核 D-TC15 同支，
 * 零自续）；用户回合 ⇒ **「继续？」薄形询问**（`askContinue` 注入面 —— 载体 = 既有待决门，不造第二交互面）⇒
 * 同意 = 重建 controller + `resume: true` 重入同回合（历史已在 ⇒ 不重推用户消息）∕ 拒绝（∥ 缺注入 ∥ 会话已中止
 * 墓碑命中）⇒ `stopped` 结算（同中止三径序：落盘 → 读数 → 终局事件）。
 */
import { ContinueError } from "@thincoder/core/agent.mjs"
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
 *  `turnGate` = 回合代次面（`{ stamp(key, agent), revoked(key, agent) }` —— 中止墓碑两查位同源；缺省 ⇒ 零落位 ∥ 恒不判失）·
 *  `askContinue(key, turn)` = 撞帽询问缝（R3 · #505 —— 返回是否同意续跑；缺省 ∥ 非函数 ⇒ 视为拒绝：收口零静默续）。
 *  返回 `{ executeTurn }`。 */
export function createTurnFace({ post, run, bridge, postUsage, flights, queuedPickup = null, turnGate = null, askContinue = null }) {
  /** 中止墓碑查位（U-7）：本回合代次 ≠ 当前代次 ⇒ 会话中止径（`dispose` ∕ 切项目）⇒ 落盘零写；
   *  `turnGate` 缺省 ∥ 代理未落代次 ⇒ 恒假（零回归）。 */
  const revokedTurn = (key, agent) => turnGate?.revoked?.(key, agent) === true
  /** 撞帽询问（R3 · #505 —— `askContinue` 注入面转口）：缺注入 ⇒ 视为拒绝（收口不静默续）；
   *  返回是否同意续跑（**严格布尔** —— 作答串比对住注入面 `turn-driver.mjs`）。 */
  const consentOf = async (key, turn) => (typeof askContinue === "function" ? (await askContinue(key, turn)) === true : false)
  /** 单回合执行（调用面不 await 亦可 —— 结算自吞；拒绝向调用面抛回，见档头）。
   *  `sessionSignal` 在场（窗内回合）⇒ 会话中止逐链中止本回合（`dispose` / 切项目级联 —— 已中止则即时中止）。 */
  async function executeTurn(key, agent, text, opts = {}) {
    const controller = new AbortController()
    flights.set(key, controller)
    turnGate?.stamp?.(key, agent) // 回合代次落位（U-6 ∕ U-7 两查位同源 —— 缺省 ⇒ 零动作）
    const sessionSignal = opts.sessionSignal ?? null
    /** 会话级中止绑定（**逐代同绑** —— 中断续跑换代后旧绑定随旧 controller 作废；不重绑则续跑段逃逸会话中止）：
     *  已中止 ⇒ 即时中止本代；未中止 ⇒ 挂 once 监听。返 `target`（链式取用）。 */
    const bindSession = (target) => {
      if (sessionSignal === null) return target
      if (sessionSignal.aborted) target.abort()
      else sessionSignal.addEventListener("abort", () => target.abort(), { once: true })
      return target
    }
    bindSession(controller)
    /** **现代** controller（中断续跑换代 ⇒ 此处同换）——结算判据 / 释放在飞两查位同读。 */
    let live = controller
    const attached = opts.attached ?? null
    // 步边界取批缝（「回合中插入」批 · KD-40 ②）：**用户回合传 ∕ 消化轮（`autoTurn`）不传**
    //（沿 VSC 分流 `panel-turn-loop.mjs` —— `autoTurn ? null : …`；系统轮不接步边界 pickup）。
    const pickup = opts.autoTurn === true || typeof queuedPickup !== "function" ? null : queuedPickup(key)
    /** 续跑循环（内层 —— 两族同环：Ctrl+I 同上下文续跑 ∕ 撞帽续跑）：判据源 = **本代 controller 的
     *  `signal.reason`**（核 `annotateAbort` 不保 `err.reason` ⇒ 以信号面为准 —— CLI `agent-turn.mjs:166-167` 同取法）；
     *  `interrupt` 真 ∧ `message` 非空串 ⇒ 换代（新 controller 重绑会话信号 + 落 `flights`）并
     *  `resume: true` 重入（核已提交部分输出 + 注入消息已落历史 —— 输入不重推）。其余中止（普通 stop ∕
     *  会话中止）与一切错误照旧上抛 —— 结算径零变。**返回结算态** `"done"` ∥ `"stopped"`（撞帽收口两径 —— R3）。 */
    const runWithResume = async () => {
      for (let resume = false; ; resume = true) {
        try {
          await run(agent, text, bridge(key), {
            signal: live.signal,
            resume,
            autoTurn: opts.autoTurn === true,
            upstreamTurn: opts.upstreamTurn === true,
            timerTurn: opts.timerTurn === true, // 旗标仅供域文本选择（核 opts 四件 ⇒ 五件 —— §6.30.11 透传）
            suspDriven: true,
            ...(pickup === null ? {} : { consumeQueuedInput: pickup }), // 核循环头缝（`thincoder-core/agent.mjs:247` —— 只接不改）
          })
          return "done"
        } catch (err) {
          const reason = live.signal.reason
          if (err?.name === "AbortError" && reason?.interrupt === true) {
            if (typeof reason.message !== "string" || reason.message === "") throw err // 无 message 的 interrupt = 停回合不续跑
            live = bindSession(new AbortController())
            flights.set(key, live) // 换代（后续 Stop ∕ 会话中止命中新代 —— 单在飞表不变量保位）
            continue
          }
          // 撞帽三径（R3 · #505 —— 核 `ContinueError(maxTurns)` 抛出点 `agent.mjs:451`）：
          if (err instanceof ContinueError) {
            if (opts.autoTurn === true) return "stopped" // 无人值守档（消化 ∕ 上行 ∕ timer 轮）⇒ cap 即收口（核 D-TC15 同支，零自续）
            const consent = await consentOf(key, err.turn)
            if (consent !== true || revokedTurn(key, agent)) return "stopped" // 拒绝 ∥ 会话已中止（墓碑命中）⇒ stopped 结算
            live = bindSession(new AbortController()) // 同意 ⇒ 重建 controller（同 Ctrl+I 换代式：终局同释新代）
            flights.set(key, live)
            continue // 重入同回合（核 `agent.mjs:150`：resume 不重推用户消息）
          }
          throw err
        }
      }
    }
    try {
      const outcome = await runWithResume()
      if (!revokedTurn(key, agent)) saveAgentSlot(agent) // 落盘先于终局事件（§1.14 ②；中止径零写 —— U-7）
      postUsage(key, agent) // 回合尾读数（同点：落盘后 · 终局事件前）
      post("ev:activity", { key, event: outcome === "stopped" ? "stopped" : "done" }) // 收口两径同序：done ∕ stopped（R3）
    } catch (err) {
      if (!revokedTurn(key, agent)) saveAgentSlot(agent) // 三路同序（CLI 先例 = 回合 finally 尾部保存；中止径零写 —— U-7）
      postUsage(key, agent) // 三径同点（中断 / 错误同样出本回合读数）
      if (live.signal.aborted) post("ev:activity", { key, event: "stopped" })
      else post("ev:error", { key, message: String(err?.message ?? err), ...techInfoOf(err) })
      throw err
    } finally {
      if (flights.get(key) === live) flights.delete(key) // 先释放在飞（**现代** —— 中断续跑换代后同释）—— 清理自吞错（`cleanupTurn` 出口零抛 —— 回合驱动零承担）
      cleanupTurn(attached?.paths ?? [])
    }
    return { ok: true }
  }
  return { executeTurn }
}
