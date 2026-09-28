/**
 * checkpoint.mjs — 撞帽续期检查点叶（TURN-CAP-CONTINUE.md §1 #7 / §3.1）。
 *
 * 异步族（后台子代理 / 异步飞刀 / 会诊）撞帽 ⇒ 不发用户卡：登记「挂起 + 父侧 ask」，
 * 等父代理决定——`send` 兑现（新段预算、history 保留、任务文本不重注入）或
 * `cancel` / 会话收尾 / Stop 降级（既有 partial 路径 + `TURN_CAP_MARK`）。
 * 挂起不 settle、不重派：池条目仍在飞（status / observe 可见）、无新 child / 无新池条目、
 * 兑现后同一 id 继续（D-TC12）。
 *
 * 三档逃逸（§3.1）：
 *   ① 兑现 = 父 `send` 两处（池条目 `settleTurnCheckpoint` · 会诊会话 `settleConsultCheckpoint`）；
 *   ② 中止信号（Stop / cancel / 会话中止）⇒ resolve(false) ⇒ 既有 onDeclined 降级；
 *   ③ 不可答（无 `_upstream.parent` ∨ `sync === true`）⇒ 不登记 ⇒ 既有路径（零新挂起）。
 *
 * 零依赖叶（只引父侧通道 + 池 accessor）：端壳不经本档静态闭包。
 */
import { pushChildUpstream } from "./parent-channel.mjs"
import { getAsyncPool } from "./async-settle.mjs"

/**
 * 段数 / 累计轮次二元文本（§4 留痕口径——两值同读一次）：
 * `_continueSegments`（链内段数，首段 1）· `_turnSeq`（链内累计轮次，跨段不重置）。
 * 两值均挂子 agent 本体。
 * #417 追加第三元「本段零落盘轮数」（`_zeroWriteTurns`——核回合环采集，与 `_turnSeq` 同源面）：
 * **只报数**（零阈值 / 零自动动作——父侧据此判断「在推进」还是「在原地读」）。缺该字段的
 * 执行面（端侧自有回合环、未跟踪）不渲染该元——缺省不冒充 `0`（「未跟踪」不得读作「零消耗」）。
 */
function traceText(child) {
  const base = `segments ${child?._continueSegments ?? 1} · accumulated ${child?._turnSeq ?? 0} turns`
  return Number.isInteger(child?._zeroWriteTurns) ? `${base} · zero-write rounds this segment: ${child._zeroWriteTurns}` : base
}

/** 留痕片段（§3.1 池条目留痕行）：挂池条目摘要**文本**面（status / observe）——桥字段零新增。 */
export function turnCapTrace(entry) {
  return traceText(entry?.childAgent)
}

/** 去向一句话（ask 载荷末项）：答复通道随族——池条目 = `send` / `cancel`；
 *  会诊会话 = `send` / `consult_stop`（会话级停；`cancel` 只认子代理池）。 */
function replyHint(parent, carrier, key) {
  const consult = getAsyncPool(parent, "consult")?.get(key) === carrier
  const stop = consult ? `consult_stop (id ${key})` : `subagent action:'cancel' (id ${key})`
  return `reply with subagent action:'send' (id ${key}) to grant a new segment, or ${stop} to stop it (partial)`
}

/**
 * 登记检查点并挂起（异步族 askContinue 的唯一实现——逃逸 ①②③）：
 * 登记 `carrier._turnCapRec` + 父侧 ask（载荷 = 段数 / 累计轮次 + 去向一句话）——
 * ask 入队即唤醒父侧挂起驱动（`pushChildUpstream`）。
 * @param {object} child   撞帽的子 agent（`_upstream` 携父与来源标签）。
 * @param {object} carrier 兑现载体：池条目（子代 / 飞刀）或会诊 session。
 * @param {{turn?: number, signal?: AbortSignal}} payload 撞帽轮次 + 中止信号。
 * @returns {Promise<boolean>} true = 父 `send` 兑现 ⇒ 重入新段；false = 中止 / 不可答 / 兑现 miss。
 */
export function registerTurnCapCheckpoint(child, carrier, { turn = 0, signal } = {}) {
  const parent = child?._upstream?.parent
  // ③ 不可答降级：无父（headless 内嵌）或同步族（后台检查点只服务异步族——同步族保留用户卡）
  if (!parent || child?._upstream?.sync === true || !carrier) return Promise.resolve(false)
  if (signal?.aborted) return Promise.resolve(false) // ② 已中止 ⇒ 立即降级（不进挂起）
  const key = String(carrier.id ?? "")
  const rec = { child, carrier, turn }
  // 先臂后报请（顺序即防御）：`rec.resolve` 与中止监听在入队**前**就位——否则
  // `pushChildUpstream` 同步唤醒等待栓的窗口里「登记已写、resolve 未挂」，兑现假成功而挂起不收敛。
  let abortedNow = signal?.aborted === true
  const promise = new Promise((resolve) => {
    // 注销单点（幂等）：兑现 / 中止两路共用——登记清除后重复兑现 miss（回落既有路径）。
    const finish = (ok) => {
      if (carrier._turnCapRec === rec) delete carrier._turnCapRec
      signal?.removeEventListener?.("abort", onAbort)
      resolve(ok)
    }
    const onAbort = () => finish(false)
    rec.resolve = finish
    signal?.addEventListener?.("abort", onAbort, { once: true })
    // 注册后复检（`permission-gate.mjs:80-81` 同款序）：监听只认注册后的状态转移，
    // 窗口内已中止 ⇒ 监听不落地，此处兜住。
    if (signal?.aborted) { abortedNow = true; onAbort() }
  })
  if (abortedNow) return promise // ② 窗口内已中止 ⇒ 不登记、不报请（直接走既有 partial 降级）
  carrier._turnCapRec = rec
  pushChildUpstream({
    parent,
    from: child._upstream.label,
    kind: "ask",
    message: `[turn cap] ${traceText(child)} — this child hit its per-segment turn cap and is suspended `
      + `(history kept, no re-dispatch). ${replyHint(parent, carrier, key)}`,
  })
  return promise
}

/** ① 池条目兑现（send 面第一条）：读登记 → 注销 → resolve(true)。
 *  miss（无挂起 / 非检查点 send）⇒ false——调用方回落既有注入路径；兑现后幂等 miss。 */
export function settleTurnCheckpoint(carrier) {
  const rec = carrier?._turnCapRec
  if (!rec) return false
  rec.resolve?.(true)
  return true
}

/** ① 会诊会话兑现（send 面第二条——id 不属子代理池时试会诊会话）：父方向注入该会话在飞
 *  子代理的注入队列（下一回合边界消费；`consumeInjected` 同族）⇒ 兑现登记。
 *  miss ⇒ false——调用方回落 `unknown async subagent id`。 */
export function settleConsultCheckpoint(agent, key, message) {
  const rec = getAsyncPool(agent, "consult")?.get(String(key))?._turnCapRec
  if (!rec) return false
  rec.child._injected ??= []
  rec.child._injected.push(String(message).trim())
  rec.resolve?.(true)
  return true
}

/** ① 兑现后的 send 早返体（既有 send 结果同形 + 检查点语汇）：兑现即不落「未命中 / 静默丢弃」
 *  ——父侧可见它确实续了新段。 */
export function resumedSendResult(key, label) {
  return JSON.stringify({
    id: String(key),
    status: "delivered",
    resumed: true,
    note: `turn-cap checkpoint delivered — ${label} ${key} resumes with a fresh segment budget (history kept, no task-text re-injection); the message is consumed as an ordinary user instruction at its next turn boundary.`,
  })
}
