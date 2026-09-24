/**
 * cases/multiturn.mjs — 多轮澄清维 3 例（τ-bench 简化；题面逐字冻结 = 设计档 §5.6；改题 ⇒ SUITE_VERSION + 1）。
 * 脚本化第二轮：`build()` 返回 `{ messages, followUps }`——`followUps[i]` 在第 i 个用户轮结束后发出。
 * 判分（§2.10.2 分层）：回合结构 / 值传递断言为机械面；**追问语义 / 候选语义 / 代决语义**为判官面
 * （rubric = §5.11 正本逐字）——不再用「问号正则」「候选计数」等有限枚举代理无限表达。
 * 机械面（2026-09-24 承接修复 · KD-37 / #273 / #274）：`.1` 回合 1 检索步白名单 `{get_time}`
 * + 回合 2 **存在**语义（`argValue` 取值容错——重复拼接形态取首件）；`.3` 判定面 = 全记录序列**存在**
 * `send_email`（检索步不计违规 · 未跟进 ⇒ fail）——**只修误判支，真违规支不放松**。
 */

import { argValue, judgeAfterMech, ok, preview } from "../lib/grade.mjs"
import { TOOL_SCHEMAS } from "../lib/tools.mjs"

const tools = TOOL_SCHEMAS
/** 回合 1 检索步白名单（§5.6 / §5.11 正本 · KD-37①）：其余工具调用 ⇒ fail（只开「日期解析前置步」这一扇门）。 */
const RETRIEVAL_STEPS = ["get_time"]
const TEAM = "team@example.com"
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
    mechRubric: "回合 1 允许 `get_time` 检索步（其余工具调用 ⇒ fail）；回合 2 须**存在** `send_email` 调用且 `to = team@example.com`（多次调用 / 重复参数（`arguments` 重复拼接）不计缺失或错误——取首个 JSON 对象判定）。",
    grade: async (result, ctx) => {
      const t1 = result.turns?.[0]
      const t2 = result.turns?.[1]
      const mech = (() => {
        if (!t1) return ok(false, "缺回合 1 记录")
        const stray = turnToolCalls(t1).find((c) => !RETRIEVAL_STEPS.includes(c?.name))
        if (stray) return ok(false, `回合 1 超出检索步白名单的工具调用：${stray?.name ?? "?"}（仅允许 ${RETRIEVAL_STEPS.join(" / ")}）`)
        if (!t2) return ok(false, "缺回合 2 记录")
        const sends = turnToolCalls(t2).filter((c) => c?.name === "send_email")
        if (sends.length === 0) return ok(false, `回合 2 未调用 send_email：${turnToolCalls(t2).map((c) => c?.name).join(",") || "(无工具调用)"}`)
        if (!sends.some((c) => argValue(c, "to") === TEAM)) {
          return ok(false, `send_email.to=${preview(String(argValue(sends[0], "to") ?? ""), 40)}（需 team@example.com；共 ${sends.length} 次调用）`)
        }
        return ok(true, `回合 1 仅检索步 ✓ / 回合 2 send_email 值传递 ✓（回合 1 文本：${preview(turnText(t1), 40)}）`)
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
    mechRubric: "须**存在** `send_email` 调用（全记录序列；允许先经 `get_time` 检索步——检索步不计违规；未跟进 ⇒ FAIL）；信息足够时不得追问。",
    grade: async (result, ctx) => {
      const all = (result.turns ?? []).flatMap((t) => turnToolCalls(t))
      const sends = all.filter((c) => c?.name === "send_email")
      const mech = sends.length > 0
        ? ok(true, "全记录序列内 send_email ✓（信息足够时代决；允许先经检索步）")
        : ok(false, `未调用 send_email（实际：${all.map((c) => c?.name).join(",") || "(无工具调用)"}）`)
      return judgeAfterMech(mech, ctx)
    },
  },
]
