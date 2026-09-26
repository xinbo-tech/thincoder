/**
 * suspensions.mjs — 待决门出档（批 8 §1.14 ③：宿主档触行数拉线拆分；档名实施舱定）。
 * 单源（原 `agent-host.mjs` 同名面逐字搬运）：① 两门 verdict 闭集 `ITEM_VERDICTS`（逐项 = `once` /
 * `always` 放行 · `reject` 拒绝）与 `BATCH_VERDICTS`（批门三值逐字 —— 核 `dispatch.mjs:281-289`）；
 * ② 待决表（挂起表 · 唯一持有点）与其四操作 `askSingle` / `askBatch` / `denyGates` / `respond`
 * （`createGates`）——表项形状 `promptId → { kind, key, resolve }`，出站 respond ∨ 门 resolve 皆清表。
 * 依赖面 = 注入：`post`（出站）· `agents`（装配表 —— `always` 放行需置会话位 `agent.autoApprove`；
 * 本档只读该表、不改表）。`summarizeArgs` 取 `agent-bridge.mjs`（同口径，不复制）。
 */
import { randomUUID } from "node:crypto"
import { summarizeArgs } from "./agent-bridge.mjs"

/** 两门 verdict 闭集：逐项 = `once` / `always` 放行 · `reject` 拒绝；批门 = 三值逐字（核 `dispatch.mjs:281-289`）。 */
export const ITEM_VERDICTS = Object.freeze(["once", "always", "reject"])
export const BATCH_VERDICTS = Object.freeze(["approveAll", "deny", "oneByOne"])

/** 造待决门：返回 `{ table, askSingle, askBatch, denyGates, respond }`。 */
export function createGates({ post, agents }) {
  /** 待决表（挂起表 · 唯一持有点）：promptId → `{ kind, key, resolve }`；清表 = 出站 respond ∨ 门 resolve。 */
  const table = new Map()

  /** 门挂起：入表 → 出站 ⇒ 等 `respond`（resolve 值 = 本门形状的合法 verdict）。 */
  function suspend(key, kind, payload, promptId) {
    return new Promise((resolve) => {
      table.set(promptId, { kind, key, resolve })
      post("ev:approval", payload)
    })
  }

  /** 逐项门：工具名 + 参数摘要；verdict 三值 —— 放行/拒绝的布尔映射在 `respond`（单一映射点），此处不再复算。 */
  function askSingle(key, tool, args) {
    const promptId = randomUUID()
    const payload = { key, promptId, shape: "single", tool, argsSummary: summarizeArgs(tool, args) }
    return suspend(key, "single", payload, promptId)
  }

  /** 批门：一次合并问（核 `onBatchPermissionRequest` 形状 ⇒ `{count,tools}`，`tools` = 工具名串数组）。 */
  function askBatch(key, req) {
    const promptId = randomUUID()
    const tools = (req?.tools ?? []).map((t) => t?.name ?? "")
    const count = Number.isInteger(req?.count) ? req.count : tools.length
    const payload = { key, promptId, shape: "batch", batch: { count, tools } }
    return suspend(key, "batch", payload, promptId)
  }

  /** 本键待决门按「拒」结算（打断路径 —— 门挂起时 abort 不解除 await）。 */
  function denyGates(key) {
    for (const [promptId, entry] of table) {
      if (entry.key !== key) continue
      table.delete(promptId)
      entry.resolve(entry.kind === "batch" ? "deny" : false)
    }
  }

  /** 审批出口：未知 id ⇒ `unknown-prompt`；跨形 / 表外 verdict ⇒ `bad-verdict` **且不 resolve**（挂起保留）；
   *  命中 ⇒ 删表项 + resolve（逐项 ⇒ bool；`always` 另置会话放行；批门 ⇒ 三值逐字）。 */
  function respond({ promptId, verdict } = {}) {
    const entry = table.get(promptId)
    if (!entry) return { ok: false, reason: "unknown-prompt" }
    const legal = entry.kind === "single" ? ITEM_VERDICTS.includes(verdict) : BATCH_VERDICTS.includes(verdict)
    if (!legal) return { ok: false, reason: "bad-verdict" }
    table.delete(promptId)
    if (entry.kind === "single") {
      if (verdict === "always") {
        const agent = agents.get(entry.key)
        if (agent) agent.autoApprove = true
      }
      entry.resolve(verdict === "once" || verdict === "always")
    } else {
      entry.resolve(verdict)
    }
    return { ok: true }
  }

  return { table, askSingle, askBatch, denyGates, respond }
}
