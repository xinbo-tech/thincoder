/**
 * subagent-check.mjs — async subagent 结果消费侧（AGENT-LOOP.md §15 D-A2）。
 *
 * 与 subagent.mjs 的生成侧（async 分支 + 槽位队列）分离，保持 subagent.mjs
 * 在 500 行硬限内；本模块只承载 subagent_check 工具 + 其等待机制。
 *
 * 语义（D-A2）：
 * - id 缺省 → 按 ARRIVAL ORDER 返回下一个已完成的子代理（先完成先返回）
 * - id 给定 → 阻塞到该 id 完成（queued 项先等启动再等完成）
 * - n（必填）→ 1-based 递增读数，per-run 计数器（runAgent 非 resume 重置、
 *   turn-end 清空）；乱序/重复 n 拒绝且不消费结果；超 MAX_ASYNC_CHECKS 上限
 *   报错引导走回合收尾自动等待
 * - 消费后从 map 删除——已消费 id 再查 = 与未知 id 同款错误（T12）
 */
import { MAX_ASYNC_CHECKS } from "./subagent.mjs"

/** Wait for an async entry to settle (or the parent signal to abort), parked on
 *  the agent's waiter list — the entry settle finally wakes every waiter (same
 *  pattern as consult_check's session waiters). Returns "aborted" on signal. */
function wakeOnAsyncSettle(agent, ctx) {
  return new Promise((resolve) => {
    const cleanup = () => {
      const i = (agent._asyncWaiters ?? []).indexOf(w)
      if (i >= 0) agent._asyncWaiters.splice(i, 1)
      ctx.signal?.removeEventListener("abort", onAbort)
    }
    const w = () => { cleanup(); resolve("settled") }
    const onAbort = () => { cleanup(); resolve("aborted") }
    ;(agent._asyncWaiters ??= []).push(w)
    if (ctx.signal) {
      if (ctx.signal.aborted) { onAbort(); return }
      ctx.signal.addEventListener("abort", onAbort, { once: true })
    }
  })
}

/**
 * subagent_check (AGENT-LOOP.md §15 D-A2) — fetch async subagent results.
 * - id omitted → the next completed child in ARRIVAL order (first finished first)
 * - id given → block until THAT child finishes (queued items wait for their start)
 * - n (required) → 1-based read counter, strictly incrementing per run (loop
 *   guard); capped at MAX_ASYNC_CHECKS per turn — beyond that, use the turn-end
 *   auto-wait. Errors never consume results.
 * Consumed entries are deleted from the map — a re-check of the same id is the
 * same "unknown async subagent id" error (T12).
 */
export const subagentCheckTool = {
  name: "subagent_check",
  readonly: true,
  description:
    "Fetch the result of an async subagent (subagent with async:true). Spawn async children to keep working in your own turn while they run in the background, then collect their reports here. Multiple async children return in completion (arrival) order — the first finished is returned first, so fast results are handled immediately instead of waiting for the slowest. Blocks until the target finishes.\n" +
    "When done is true, no more results are coming (all finished and consumed) — anything left arrives automatically at turn end.\n" +
    "Parameters:\n" +
    "- id (optional): the subagent id from the async spawn return. Omit to fetch the next completed child (arrival order).\n" +
    "- n (required): 1-based read counter — pass 1 on the first check, 2 on the next, and so on. Consecutive checks must be distinct tool calls (loop detector); at most 3 checks per turn — use the turn-end auto-wait for the rest.",
  parameters: {
    type: "object",
    properties: {
      id: { type: "string", description: "Optional subagent id (from the async spawn return). Omit = next completed child (arrival order)." },
      n: { type: "number", description: "1-based read counter: 1 for the first check of the turn, incrementing with each subsequent check (loop detector — consecutive checks must be distinct tool calls)." },
    },
    required: ["n"],
  },
  async execute({ id, n }, ctx) {
    const agent = ctx.agent
    const map = agent._asyncSubagents ?? new Map()
    // Strict 1-based incrementing read counter (D-A2, review #1): out-of-order /
    // repeated n is rejected WITHOUT consuming a result (T14).
    const lastN = agent._asyncCheckLastN ?? 0
    if (!Number.isInteger(n) || n !== lastN + 1) {
      return JSON.stringify({ status: "error", error: "invalid read counter — pass n = lastN+1" })
    }
    if (n > MAX_ASYNC_CHECKS) {
      return JSON.stringify({ status: "error", error: "check limit exceeded — use turn-end auto-wait for the rest" })
    }
    agent._asyncCheckLastN = n

    let target = null
    if (id !== undefined && id !== null && String(id) !== "") {
      target = map.get(String(id))
      // Unknown OR already-consumed ids (consumed entries are deleted) — same error (T12).
      if (!target) return JSON.stringify({ id: String(id), status: "error", error: `unknown async subagent id: ${id}` })
    }

    // Block until the target settles (specific id / next completed in arrival order).
    for (;;) {
      if (target) {
        if (target.done) break
        const woke = await wakeOnAsyncSettle(agent, ctx)
        if (woke === "aborted") return JSON.stringify({ done: true, stopped: true })
        continue
      }
      const completed = [...map.values()].filter((e) => e.done)
      if (completed.length > 0) {
        target = completed.sort((a, b) => (a._settleSeq ?? 0) - (b._settleSeq ?? 0))[0]
        break
      }
      if (map.size === 0) return JSON.stringify({ done: true })
      const woke = await wakeOnAsyncSettle(agent, ctx)
      if (woke === "aborted") return JSON.stringify({ done: true, stopped: true })
    }

    map.delete(String(target.id))
    if (target.error) return JSON.stringify({ id: String(target.id), status: "error", error: target.error })
    return JSON.stringify({ id: String(target.id), role: target.role, status: "done", report: target.report ?? "" })
  },
}
