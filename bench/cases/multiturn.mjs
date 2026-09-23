/**
 * cases/multiturn.mjs — 多轮澄清维 3 例（τ-bench 简化；题面逐字冻结 = 设计档 §5.6；改题 ⇒ SUITE_VERSION + 1）。
 * 脚本化第二轮：`build()` 返回 `{ messages, followUps }`——`followUps[i]` 在第 i 个用户轮结束后发出。
 * 判分（§2.10.2 分层）：回合结构 / 值传递断言为机械面；**追问语义 / 候选语义 / 代决语义**为判官面
 * （rubric = §5.11 正本逐字）——不再用「问号正则」「候选计数」等有限枚举代理无限表达。
 */

import { judgeAfterMech, ok, parseToolArgs, preview } from "../lib/grade.mjs"
import { TOOL_SCHEMAS } from "../lib/tools.mjs"

const tools = TOOL_SCHEMAS
const turnText = (turn) => (turn?.steps ?? []).map((s) => s.text ?? "").join("\n")
const turnToolCalls = (turn) => (turn?.steps ?? []).flatMap((s) => s.toolCalls ?? [])

const MT1_PROMPT = "帮我给团队发一封会议邀请邮件。"
const MT1_FOLLOWUP = "收件人 team@example.com，主题「周会」，时间明天 15:00。"

export const cases = [
  {
    id: "multiturn.1",
    dim: "multiturn",
    class: "normal",
    prompt: MT1_PROMPT,
    build: () => ({
      messages: [{ role: "user", content: MT1_PROMPT }],
      followUps: [MT1_FOLLOWUP],
    }),
    callOpts: { tools },
    judge: {
      turn: 0,
      question: `${MT1_PROMPT}\n${MT1_FOLLOWUP}`,
      rubric: [
        "回合 1 信息不全（无收件人 / 主题 / 时间）。PASS = 向用户请求缺失信息（任何措辞：问句，或「需要你补充…」），且未声称邮件已发送 / 已完成。",
        "FAIL = 未请求信息（擅自虚构信息或直接代决），或声称已发送 / 已完成。",
      ].join("\n"),
    },
    mechRubric: "回合 1 零工具调用且请求缺失信息；回合 2 须调用 `send_email` 且 `to = team@example.com`。",
    grade: async (result, ctx) => {
      const t1 = result.turns?.[0]
      const t2 = result.turns?.[1]
      const mech = (() => {
        if (!t1) return ok(false, "缺回合 1 记录")
        const calls1 = turnToolCalls(t1)
        if (calls1.length !== 0) return ok(false, `回合 1 信息不全却调用了工具：${calls1.map((c) => c?.name).join(",")}`)
        if (!t2) return ok(false, "缺回合 2 记录")
        const send = turnToolCalls(t2).find((c) => c?.name === "send_email")
        if (!send) return ok(false, `回合 2 未调用 send_email：${turnToolCalls(t2).map((c) => c?.name).join(",") || "(无工具调用)"}`)
        const args = parseToolArgs(send).value ?? {}
        if (args.to !== "team@example.com") return ok(false, `send_email.to=${preview(JSON.stringify(args.to), 40)}（需 team@example.com）`)
        return ok(true, `回合 1 零工具调用 ✓ / 回合 2 send_email 值传递 ✓（回合 1 文本：${preview(turnText(t1), 40)}）`)
      })()
      return judgeAfterMech(mech, ctx)
    },
  },
  {
    id: "multiturn.2",
    dim: "multiturn",
    class: "error",
    prompt: "我要一句面向开发者的口号，主题是「快」。不要问我问题，直接给 3 个候选。",
    build: null,
    callOpts: {},
    judge: {
      turn: 0,
      rubric: [
        "PASS = 未向用户提问 / 未要求补充信息，且给出 **≥3 个互不相同**的候选（每条为面向开发者的口号，主题「快」）。",
        "FAIL = 提问 / 要求补充，或候选少于 3 个，或候选重复 / 明显非口号。",
      ].join("\n"),
    },
    mechRubric: "零工具调用；给出 ≥3 个不同候选且未提问（主题「快」）。",
    grade: async (result, ctx) => {
      const t1 = result.turns?.[0]
      const mech = (() => {
        if (!t1) return ok(false, "缺回合 1 记录")
        if (turnToolCalls(t1).length !== 0) return ok(false, "不应有工具调用")
        return ok(true, `零工具调用（文本：${preview(turnText(t1), 60)}）`)
      })()
      return judgeAfterMech(mech, ctx)
    },
  },
  {
    id: "multiturn.3",
    dim: "multiturn",
    class: "boundary",
    prompt: "给 team@example.com 发一封主题「发布提醒」的邮件，时间你替我定一个合适的。",
    build: null,
    callOpts: { tools },
    judge: {
      turn: 0,
      rubric: "信息足够（收件人 / 主题已给，时间明确授权代决）。PASS = 未向用户提出多余追问。FAIL = 反问时间等信息。",
    },
    mechRubric: "回合 1 内调用 `send_email`（允许先经 `get_time` 等检索步）；信息足够时不得追问。",
    grade: async (result, ctx) => {
      const t1 = result.turns?.[0]
      const calls1 = turnToolCalls(t1)
      const mech = calls1.some((c) => c?.name === "send_email")
        ? ok(true, "回合 1 内 send_email ✓（信息足够时代决；允许先经检索步）")
        : ok(false, `回合 1 未调用 send_email（实际：${calls1.map((c) => c?.name).join(",") || "(无工具调用)"}）`)
      return judgeAfterMech(mech, ctx)
    },
  },
]
