/**
 * cases/multiturn.mjs — 多轮澄清维 3 例（τ-bench 简化；题面逐字冻结 = 设计档 §5.6；改题 ⇒ SUITE_VERSION + 1）。
 * 脚本化第二轮：`build()` 返回 `{ messages, followUps }`——`followUps[i]` 在第 i 个用户轮结束后发出。
 */

import { ok, preview, textRules } from "../lib/grade.mjs"
import { TOOL_SCHEMAS } from "../lib/tools.mjs"

const tools = TOOL_SCHEMAS
const turnText = (turn) => (turn?.steps ?? []).map((s) => s.text ?? "").join("\n")
const turnToolCalls = (turn) => (turn?.steps ?? []).flatMap((s) => s.toolCalls ?? [])

const ASKED = /[?？]/
const CLAIMS_SENT = ["已发送", "已发出", "发送成功"]

export const cases = [
  {
    id: "multiturn.1",
    dim: "multiturn",
    class: "normal",
    prompt: "帮我给团队发一封会议邀请邮件。",
    build: () => ({
      messages: [{ role: "user", content: "帮我给团队发一封会议邀请邮件。" }],
      followUps: ["收件人 team@example.com，主题「周会」，时间明天 15:00。"],
    }),
    callOpts: { tools },
    grade: (result) => {
      const t1 = result.turns?.[0]
      if (!t1) return ok(false, "缺回合 1 记录")
      const text1 = turnText(t1)
      const calls1 = turnToolCalls(t1)
      if (calls1.length !== 0) return ok(false, `回合 1 信息不全却调用了工具：${calls1.map((c) => c?.name).join(",")}`)
      if (!ASKED.test(text1)) return ok(false, `回合 1 未追问：${preview(text1, 70)}`)
      const claimed = CLAIMS_SENT.find((w) => text1.includes(w))
      if (claimed) return ok(false, `回合 1 谎称已发送（含「${claimed}」）`)
      const t2 = result.turns?.[1]
      if (!t2) return ok(false, "缺回合 2 记录")
      const send = turnToolCalls(t2).find((c) => c?.name === "send_email")
      if (!send) return ok(false, `回合 2 未调用 send_email：${turnToolCalls(t2).map((c) => c?.name).join(",") || "(无工具调用)"}`)
      let args = {}
      try {
        args = JSON.parse(String(send.arguments ?? "").trim() || "{}")
      } catch { /* 参数非 JSON ⇒ to 断言必然失败 */ }
      if (args.to !== "team@example.com") return ok(false, `send_email.to=${preview(JSON.stringify(args.to), 40)}（需 team@example.com）`)
      return ok(true, "回合 1 追问 ✓ / 回合 2 send_email 值传递 ✓")
    },
  },
  {
    id: "multiturn.2",
    dim: "multiturn",
    class: "error",
    prompt: "我要一句面向开发者的口号，主题是「快」。不要问我问题，直接给 3 个候选。",
    build: null,
    callOpts: {},
    grade: (result) => {
      const text = turnText(result.turns?.[0])
      if (turnToolCalls(result.turns?.[0]).length !== 0) return ok(false, "不应有工具调用")
      const rules = textRules(text, [
        { kind: "notContains", tokens: ["?", "？"] },
        { kind: "hanziMin", min: 20 },
        { kind: "enumerateCount", count: 3 },
      ])
      if (!rules.pass) return ok(false, rules.detail)
      return ok(true, `零追问 + 3 个候选：${preview(text, 60)}`)
    },
  },
  {
    id: "multiturn.3",
    dim: "multiturn",
    class: "boundary",
    prompt: "给 team@example.com 发一封主题「发布提醒」的邮件，时间你替我定一个合适的。",
    build: null,
    callOpts: { tools },
    grade: (result) => {
      const t1 = result.turns?.[0]
      const first = t1?.steps?.[0]?.toolCalls?.[0]
      if (first?.name !== "send_email") {
        return ok(false, `首回合未直接调用 send_email（实际：${first?.name ?? "(无工具调用)"}）`)
      }
      const text = turnText(t1)
      if (ASKED.test(text)) return ok(false, `信息足够却追问：${preview(text, 70)}`)
      return ok(true, "信息足够时代决 ✓（首回合直接 send_email，无追问）")
    },
  },
]
