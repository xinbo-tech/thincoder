/**
 * suspensions.mjs — 待决门出档（批 8 §1.14 ③：宿主档触行数拉线拆分；档名实施舱定）。
 * 单源（原 `agent-host.mjs` 同名面逐字搬运）：① 两门 verdict 闭集 `ITEM_VERDICTS`（逐项 = `once` /
 * `always` 放行 · `reject` 拒绝）与 `BATCH_VERDICTS`（批门三值逐字 —— 核 `dispatch.mjs:281-289`）；
 * ② 待决表（挂起表 · 唯一持有点）与其**五操作** `askSingle` / `askBatch` / `askQuestion` / `denyGates` /
 * `respond`（`createGates`）——表项形状 `promptId → { kind, shape?, key, resolve }`：`kind` 两值
 * （`approval` / `question`）判出站通道与载荷族，`shape` 两值（`single` / `batch`）判审批门 verdict
 * 闭集（提问门无 verdict ⇒ 无 `shape` 键）。出站 respond ∨ 门 resolve 皆清表。
 * 依赖面 = 注入：`post`（出站）· `agents`（装配表 —— `always` 放行需置会话位 `agent.autoApprove`；
 * 本档只读该表、不改表）。`summarizeArgs` 取 `agent-bridge.mjs`（同口径，不复制）。
 */
import { randomUUID } from "node:crypto"
import { summarizeArgs } from "./agent-bridge.mjs"

/** 两门 verdict 闭集：逐项 = `once` / `always` 放行 · `reject` 拒绝；批门 = 三值逐字（核 `dispatch.mjs:281-289`）。 */
export const ITEM_VERDICTS = Object.freeze(["once", "always", "reject"])
export const BATCH_VERDICTS = Object.freeze(["approveAll", "deny", "oneByOne"])

/** 作答门取消结算串（`answer: null` = 取消 ⇒ 按本串结算；打断 / 会话关闭的门结算同判 —— 单源 = 本档）。
 *  面向用户的「已取消」文案走渲染面词表（两域分离 —— `docs/desktop/design/IPC.md`:59）。 */
export const QUESTION_CANCELLED = "(user cancelled)"

/** 门 `kind` → 出站通道（两值闭集 · 单一映射点 —— 核 `docs/desktop/design/IPC.md` §1 出站表）。 */
const GATE_CHANNELS = Object.freeze({ approval: "ev:approval", question: "ev:question" })

/** 造待决门：返回 `{ table, askSingle, askBatch, askQuestion, denyGates, respond }`。 */
export function createGates({ post, agents }) {
  /** 待决表（挂起表 · 唯一持有点）：promptId → `{ kind, shape?, key, resolve }`；清表 = 出站 respond ∨ 门 resolve。 */
  const table = new Map()

  /** 门挂起：入表 → 按 `kind` 出站 ⇒ 等 `respond`（resolve 值 = 审批 verdict ∥ 作答串）。
   *  `shape` 缺省 = 无 verdict 闭集的门（提问门）。 */
  function suspend(key, kind, payload, promptId, shape) {
    return new Promise((resolve) => {
      table.set(promptId, shape ? { kind, shape, key, resolve } : { kind, key, resolve })
      post(GATE_CHANNELS[kind], payload)
    })
  }

  /** 逐项门：工具名 + 参数摘要；verdict 三值 —— 放行/拒绝的布尔映射在 `respond`（单一映射点），此处不再复算。 */
  function askSingle(key, tool, args) {
    const promptId = randomUUID()
    const payload = { key, promptId, shape: "single", tool, argsSummary: summarizeArgs(tool, args) }
    return suspend(key, "approval", payload, promptId, "single")
  }

  /** 批门：一次合并问（核 `onBatchPermissionRequest` 形状 ⇒ `{count,tools}`，`tools` = 工具名串数组）。 */
  function askBatch(key, req) {
    const promptId = randomUUID()
    const tools = (req?.tools ?? []).map((t) => t?.name ?? "")
    const count = Number.isInteger(req?.count) ? req.count : tools.length
    const payload = { key, promptId, shape: "batch", batch: { count, tools } }
    return suspend(key, "approval", payload, promptId, "batch")
  }

  /** 提问门（`question` 工具真作答面）：题干 + 给答项（核缺省 ⇒ 空数组 —— 载荷键集恒四项）⇒ 登记后自 post
   *  `ev:question`（`docs/desktop/design/IPC.md` §1）。解除 = `question:respond`（`answer` = 串原样 ∥
   *  `null` ⇒ 取消串）。 */
  function askQuestion(key, question, options) {
    const promptId = randomUUID()
    const payload = { key, promptId, question, options: options ?? [] }
    return suspend(key, "question", payload, promptId)
  }

  /** 本键待决门结算（打断 / 会话关闭路径 —— 门挂起时 abort 不解除 await）：审批门按「拒」（逐项 ⇒ `false` ∥
   *  批门 ⇒ `deny`）；提问门 ⇒ 取消串（与 `answer: null` 同判）。 */
  function denyGates(key) {
    for (const [promptId, entry] of table) {
      if (entry.key !== key) continue
      table.delete(promptId)
      entry.resolve(entry.kind === "question" ? QUESTION_CANCELLED : entry.shape === "batch" ? "deny" : false)
    }
  }

  /** 作答出口（提问门）：`answer` = 串（给答项原样 ∥ 自由作答）∥ `null`（取消 ⇒ 取消串）；假「作答」形
   *  （非串且非 `null`）⇒ `bad-answer` —— **不 resolve**（挂起保留，可续答）。 */
  function answerQuestion(entry, promptId, payload) {
    const value = payload.answer
    if (value !== null && typeof value !== "string") return { ok: false, reason: "bad-answer" }
    table.delete(promptId)
    entry.resolve(value === null ? QUESTION_CANCELLED : value)
    return { ok: true }
  }

  /** 出口（按命中门 `kind` 分派）：表外 id ⇒ `unknown-prompt`；跨 `kind` 载荷 ⇒ `bad-kind`（审批载荷打
   *  提问门 ∥ 作答载荷打审批门 —— 两向）；跨形 / 表外 verdict ⇒ `bad-verdict`；非串且非 `null` 作答 ⇒
   *  `bad-answer`。**四档皆不 resolve**（挂起保留）。命中 ⇒ 删表项 + resolve（逐项 ⇒ bool；`always` 另置
   *  会话放行；批门 ⇒ 三值逐字；提问门 ⇒ 作答串 ∥ 取消串）。`"answer" in payload` = 作答意向判据。 */
  function respond(payload = {}) {
    const entry = table.get(payload.promptId)
    if (!entry) return { ok: false, reason: "unknown-prompt" }
    if (entry.kind === "question") {
      return "answer" in payload ? answerQuestion(entry, payload.promptId, payload) : { ok: false, reason: "bad-kind" }
    }
    if ("answer" in payload) return { ok: false, reason: "bad-kind" }
    const { verdict } = payload
    const legal = entry.shape === "single" ? ITEM_VERDICTS.includes(verdict) : BATCH_VERDICTS.includes(verdict)
    if (!legal) return { ok: false, reason: "bad-verdict" }
    table.delete(payload.promptId)
    if (entry.shape === "single") {
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

  return { table, askSingle, askBatch, askQuestion, denyGates, respond }
}
