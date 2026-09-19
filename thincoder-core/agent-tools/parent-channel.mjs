/**
 * parent-channel.mjs — 子代理上行通道（子 → 父 在飞提问 / 上报）（批 SUBAGENT-UPSTREAM-CHANNEL；
 * 设计权威 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.27；需求 = `docs/core/requirements/AGENT-LOOP.md` §4.12）。
 *
 * 补上子代理通信的第三象限：既有两象限 = 父→子在飞（`subagent action:'send'`）+ 子→父**终态**
 * （报告 → settle → digest）；本档 = 子→父**在飞**——子代理运行中向父（spawn 方）发一条决策级
 * 消息，**不中断自身回合**；父在**下一回合边界**合并消费，回复复用既有 `send`（零新下行管子）。
 * F-UC7（2026-09-19 批 · §6.27.12）：ask 入队另**唤一次父侧挂起驱动**（`wakeAsyncWaiters`——
 * 复用 W1 `_asyncWaiters` 通道）+ 三驱动第 2 步谓词 `upstreamWaiting` ⇒ 未 drain 的 ask 即刻
 * 开轮注入——默认异步流下答复不再恒迟到（`note` 不唤醒：无时效义务）。
 *
 * 三面（§6.27.2/§6.27.4）：
 * - 子侧发声 = 工具 `notify_parent`（**depth>0 专有**——`family-tools.mjs` depth>0 段装配，
 *   consult / depth-0 不装配）；调用**同步返回**（零 await、零等待态——本档不提供任何拉取 /
 *   轮询 / 等答复动作：D-UC3 非阻塞 = 结构保证）。
 * - 父侧接收 = 队列 `_childUpstream`（数组；条目 `{seq, from, kind, message, ts}`）+ 单调计数
 *   `_childUpstreamSeq`——**两字段皆属载体字段集**（AGENT-LOOP.md §2.3，与 `_asyncQueue` /
 *   `_asyncAdvisorQueue` 同列）：读单点 = `async-settle.mjs` 的 `carrierField`，写单点 = 本档的
 *   `upstreamHolder`（父字段优先 / `history` 命中即借用 / 皆无则建在父字段 + 载体别名）。
 *   生命周期与子代理生命周期**解耦**（settle / cancel 不迁移、不清队列——F3）。
 * - 父侧唤醒 = ask 入队尾调 `wakeAsyncWaiters(parent)`（**同步**，零 await；`note` 不唤醒）——
 *   零新字段 / 零新容器 / 零新注册：等待栓数组由挂起驱动注册，非挂起期数组空 ⇒ no-op。
 * - 父侧消费 = `drainChildUpstream(agent)`（`thincoder-core/agent.mjs` 循环头单点，紧邻
 *   `consumeInjected?.(agent)`——同址反向）：全部 pending **合并一条** user 消息（`pushReal`
 *   非 transient——事务性事件落盘，D-UC5），每条附结束注脚（已 settle / 已 cancel 两形态；
 *   其余态不附——不臆断）。
 *
 * 三闸（可机判——§6.27.2 ③）：`kind` 枚举 `ask|note` · 同一子代理「未 drain」的 `ask` ≤
 * `UPSTREAM_ASK_MAX_INFLIGHT`（窗口 = 父队列在场，drain 即关闭；机制面不追踪答复）· `message`
 * ≤ `UPSTREAM_MSG_MAX` 且父队列 ≤ `UPSTREAM_QUEUE_MAX`（超限 = 工具**明确报错**，不静默丢）。
 * 射程纪律（两问自检 + 正负清单）在提示词面（§6.27.8），机制面不新增语义判定。
 *
 * 模块图：静态 import 核单点 `async-settle.mjs`（`carrierField` / `getAsyncPool` /
 * `tombstoneOf` / `wakeAsyncWaiters`——同层既有导出，同 `async-discard.mjs:35` 先例；唤醒走
 * 既有静态边，零新增）+ `../context.mjs`（`pushReal`）
 * / `../agent/helpers.mjs`（`escapeXml`）/ `../log.mjs`（`logEvent`）；单向、叶子向、无环。
 * 登记册导出（`agent-tools.mjs`）→ 家族矩阵装配（`agent/family-tools.mjs` depth>0 段）。
 */
import { carrierField, getAsyncPool, tombstoneOf, wakeAsyncWaiters } from "./async-settle.mjs"
import { pushReal } from "../context.mjs"
import { escapeXml } from "../agent/helpers.mjs"
import { logEvent } from "../log.mjs"

/** message 长度上限（字符——闸三上界）。 */
export const UPSTREAM_MSG_MAX = 1500
/** 父队列总长上限（超 ⇒ 子侧工具明确报错——不静默丢）。 */
export const UPSTREAM_QUEUE_MAX = 20
/** 同一子代理「未 drain」的 ask 上限（窗口 = 父队列中存在本子代理的 ask 条目；drain 即关闭）。 */
export const UPSTREAM_ASK_MAX_INFLIGHT = 1

/** 工具返回注（异步形——sync: false；答复按普通指令在下回合边界到达）。 */
const ASYNC_NOTE =
  "delivered to your parent's queue — consumed at the parent's next turn boundary (non-blocking). " +
  "Keep working on the unaffected parts; a reply arrives as an ordinary instruction at your next turn boundary. " +
  "If your run ends first, report the unanswered part as not done."

/** 工具返回注（同步形——`sync: true`：父阻塞在本次运行上 ⇒ **不给「答复到达」承诺**（F6））。 */
const SYNC_NOTE =
  "queued for your parent — but it spawned you synchronously and is blocked on this run, so no reply can reach you " +
  "before you end. It reads this when its call returns and may re-spawn you; report the unanswered part as not done."

/** 错误返回形（fail-closed——与 §6.7.2 / §6.25 的 status / observe / send 拒返回同款 JSON 对象形）。 */
const refused = (error) => JSON.stringify({ status: "error", error })

/**
 * 写侧载体别名单点（§6.27.2 ① / §6.27.4）：`_childUpstream` / `_childUpstreamSeq` 的写恒经本
 * 函数取容器（读恒经 `carrierField`——同两字段集）：
 *   ① 父字段在场 ⇒ 父对象（CLI 形主容器——写侧不变）；
 *   ② 缺 ⇒ `carrierField` 回退 `history` 命中 ⇒ **借用同一容器**（不另建分叉）；
 *   ③ 两者皆无 ⇒ 建在父字段 + **载体别名**（`parent.history._childUpstream = parent._childUpstream`
 *      ——同 `writeTombstone` 借用规则扩张句的既有形态，`agent-tools/async-settle.mjs:73-83`）。
 */
function upstreamHolder(parent) {
  if (!Array.isArray(parent._childUpstream)) {
    const existing = carrierField(parent, "_childUpstream")
    if (Array.isArray(existing)) {
      parent._childUpstream = existing // ② 借用（载体命中——同一容器）
    } else {
      parent._childUpstream = [] // ③ 主容器（父字段）
      if (parent.history && typeof parent.history === "object") {
        parent.history._childUpstream = parent._childUpstream // 载体别名（合成 parent 跨调用存活）
      }
    }
  }
  return parent
}

/**
 * 父侧是否存在「未 drain 的 ask」（唤醒 / 开轮判据单点——三驱动第 2 步共用；载体经
 * `carrierField` 吸收，与写侧 `upstreamHolder` 同口径）。容器缺省 / 非数组 ⇒ `false`
 * （fail-closed——不抛）；`note` 不计（无时效义务——F13 语义零变）。
 * @param {object} carrier 父（接收方）形态 / 载体对象。
 * @returns {boolean}
 */
export function upstreamWaiting(carrier) {
  const q = carrierField(carrier, "_childUpstream")
  return Array.isArray(q) && q.some((e) => e.kind === "ask")
}

/**
 * 子 → 父入队（单点；**同步**——零等待、零 await，非阻塞结构保证；`ask` 另同步唤一次父侧
 * 挂起驱动〔`wakeAsyncWaiters`——无等待 / 无轮询，返回即达〕）。父侧下一回合边界由
 * `drainChildUpstream` 合并消费；入队点直记 `child:upstream` 日志（消费点不另记）。
 * @param {{parent: object, from: string, kind: "ask"|"note", message: string}} entry
 * @returns {{seq: number, position: number}} position = 队列内 1-based 位次。
 */
export function pushChildUpstream({ parent, from, kind, message }) {
  const holder = upstreamHolder(parent)
  const seq = Number(carrierField(parent, "_childUpstreamSeq") ?? 0) + 1
  holder._childUpstream.push({ seq, from, kind, message, ts: Date.now() })
  holder._childUpstreamSeq = seq
  logEvent("child:upstream", { id: from, kind, seq })
  // §6.27.12.4 ① 唤醒（唯一激活点——入队 + 日志之后）：未 drain 的 ask 兑现父侧等待栓 ⇒
  // 挂起驱动重入、第 2 步谓词开轮（唤醒 + 谓词两件一组，缺一无效）；note 不唤醒（避轮风暴）。
  if (kind === "ask") wakeAsyncWaiters(parent)
  return { seq, position: holder._childUpstream.length }
}

/**
 * 结束注脚（drain 时读池状态——§6.27.4 表：两形态判据点 + 一显式不附注脚）：
 * - 已 settle = 池内命中条目且 `entry.done === true`（done-in-pool 表示——§6.7.3）；
 * - 已 cancel = 池**未命中** 且 `tombstoneOf(...).status === "cancelled"`（出池 + 墓碑）；
 * - 其余态（`discarded` / `consumed` / `failed` 墓碑，或池与墓碑皆未命中）⇒ **不附注脚**
 *   （消息本体照常注入——不臆断状态）。
 * @returns {string} 注脚（含前导空格）或空串。
 */
function endNote(agent, entry) {
  const id = String(entry.from).split("#").pop()
  const inPool = getAsyncPool(agent, "subagent")?.get(String(id))
  if (inPool?.done === true) return ` (${entry.from} has since settled — see its report)`
  if (!inPool && tombstoneOf(agent, id)?.status === "cancelled") return ` (${entry.from} has since been cancelled)`
  return ""
}

/**
 * 父侧消费点（回合边界单点——`agent.mjs` 循环头；空队列 no-op = 零历史变更、零开销）：
 * 全部 pending 消息**合并为一条** user 消息注入（`pushReal`——不带 `transient`，事件落盘），
 * 按入队序逐条列示（来源 `role#id` + `kind` + message（`escapeXml`）+ 结束注脚）。
 * @param {object} agent 父（消费方）agent 形态。
 * @returns {number} 本次消费条目数（0 = 空队列 no-op）。
 */
export function drainChildUpstream(agent) {
  const queue = carrierField(agent, "_childUpstream")
  if (!Array.isArray(queue) || queue.length === 0) return 0
  const entries = queue.splice(0) // 消费即清（单一消费者 = 回合边界）
  const many = entries.length > 1
  const header = many
    ? `[System reminder: ${entries.length} in-flight message(s) from your subagents — they keep working on the unaffected parts. `
      + "Answer with subagent action:'send' (id + message) if the decision is yours; an unanswered ask means that child skips the part and reports it as not done.]"
    : `[System reminder: in-flight message from your subagent ${entries[0].from} — it keeps working on the unaffected parts. `
      + "Answer with subagent action:'send' (id + message) if the decision is yours; an unanswered ask means the child skips that part and reports it as not done.]"
  const rows = entries.map((e) => `${many ? "- " : ""}${e.kind} · ${e.from}: ${escapeXml(e.message)}${endNote(agent, e)}`)
  pushReal(agent, { role: "user", content: [header, ...rows].join("\n") })
  return entries.length
}

/**
 * `notify_parent` — 子代理 → 父（spawn 方）单向通道（depth>0 专有）。
 * 只读分类（同 `task` 工具判据「只改 agent 内部状态，不改外部世界」——`readonlyToolNames` 面：
 * ① explore / plan 子代的只读过滤不剔本工具；② 权限门免 ask——子代理无交互 UI，explore / plan
 * 的 childPermission 恒 false 会误拒；③ planMode / digest 面按只读放行）。
 * `execute` 为**同步**函数（A4：工具 execute 无父侧 await——非阻塞结构保证的机判面）。
 */
export const parentChannelTool = {
  name: "notify_parent",
  description:
    "A one-way channel to your PARENT (the agent that spawned you) — you are a subagent, so there is no user to ask.\n" +
    "Queue a message on the parent's side; your turn is not interrupted and nothing is consumed from it.\n" +
    "- kind:'ask' — a question whose answer changes your next step and that you cannot answer from the materials you can read\n" +
    "  (task book / design doc / repo). The parent replies with subagent action:'send'; you receive it as an ordinary\n" +
    "  instruction at your next turn boundary. One ask at a time while the previous one is still waiting in the parent's queue.\n" +
    "- kind:'note' — an FYI that needs no answer (a premise you found broken, a conflict you resolved and want visible early).\n" +
    "- NON-BLOCKING: the call returns immediately. Keep working on the unaffected parts; keep the affected part pending.\n" +
    "  There is no fetch and no waiting — if you finish first, report the unanswered part as not done (never idle, never poll).\n" +
    "- SYNCHRONOUS SPAWN: if the parent is blocked on your run (sync spawn), nothing can be sent back to you — the reply path (`send`) reaches only a RUNNING ASYNC child. The message is read when the parent's call returns (it may re-spawn you with an answer); report the unanswered part as not done.\n" +
    "- Out of scope: naming / implementation / wording details, anything a read or a command would answer, trade-offs the\n" +
    "  task book already states. When in doubt use the stop-and-report discipline — this is not an escape from your own judgment.\n" +
    "- Availability: subagents only (depth > 0). At depth 0 you talk to the user through your normal reply or the question tool.",
  parameters: {
    type: "object",
    properties: {
      kind: {
        type: "string",
        enum: ["ask", "note"],
        description: "ask = a question whose answer changes your next step; note = an FYI that needs no answer",
      },
      message: {
        type: "string",
        description: "The message to deliver to your parent (one short paragraph — details belong to your final report)",
      },
    },
    required: ["kind", "message"],
  },
  readonly: true,
  execute(args, ctx) {
    // depth 门（execute 首行——§6.27.4）：本通道 depth>0 专有（depth-0 与用户的通道 = 普通回复 / question）。
    if ((ctx?.depth ?? 0) === 0) {
      return refused("notify_parent is only available inside a subagent (depth > 0) — at depth 0 you talk to the user through your normal reply or the question tool")
    }
    // 上游面（F7）：`_upstream` 由 spawn 站点装配（W1–W3）；缺失 = 未接线站点 ⇒ 明确报错（不静默成功）。
    const upstream = ctx?.agent?._upstream
    if (!upstream?.parent) {
      return refused("notify_parent: this agent has no parent channel (not spawned through the subagent pipeline)")
    }
    const kind = args?.kind
    if (kind !== "ask" && kind !== "note") {
      return refused('notify_parent requires kind: "ask" (a question whose answer changes your next step) or "note" (an FYI that needs no answer)')
    }
    const message = typeof args?.message === "string" ? args.message.trim() : ""
    if (!message) return refused("notify_parent requires a non-empty message")
    if (message.length > UPSTREAM_MSG_MAX) {
      return refused(`notify_parent message exceeds ${UPSTREAM_MSG_MAX} chars — one short paragraph; details belong to your final report`)
    }
    const { parent, label, sync } = upstream
    const queue = carrierField(parent, "_childUpstream")
    const pending = Array.isArray(queue) ? queue : []
    // 闸二（窗口 = 「未 drain」——§6.27.2 ③）：本子代理的 ask 仍在父队列中 ⇒ 拒（不投递）。
    if (kind === "ask") {
      const mine = pending.filter((e) => e.from === label && e.kind === "ask")
      if (mine.length >= UPSTREAM_ASK_MAX_INFLIGHT) {
        return refused(`notify_parent: your earlier ask (#${mine[0].seq}) is still queued for your parent — one ask at a time until the parent picks it up; fold this into your final report if you cannot continue without an answer`)
      }
    }
    // 闸三（父队列总长上限——超 ⇒ 报错，不静默丢）。
    if (pending.length >= UPSTREAM_QUEUE_MAX) {
      return refused(`notify_parent: the parent's in-flight queue is full (${UPSTREAM_QUEUE_MAX}) — the parent has not consumed the pending messages yet; fold yours into your final report instead`)
    }
    const { position } = pushChildUpstream({ parent, from: label, kind, message })
    return JSON.stringify({ status: "queued", kind, position, note: sync === true ? SYNC_NOTE : ASYNC_NOTE })
  },
}
