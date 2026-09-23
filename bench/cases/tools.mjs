/**
 * cases/tools.mjs — 工具调用维 4 例（题面逐字冻结 = 设计档 §5.4；改题 ⇒ SUITE_VERSION + 1）。
 * 工具 schema 与桩 = `lib/tools.mjs`（全本地确定性，绝不触网）；判分 = 结构断言（name / arguments / 轮次）。
 */

import { numEquals, ok, parseToolArgs, preview, toolShape } from "../lib/grade.mjs"
import { TOOL_SCHEMAS } from "../lib/tools.mjs"

const tools = TOOL_SCHEMAS
const step = (result, i) => result.turns?.[0]?.steps?.[i] ?? { toolCalls: [], text: "" }
const names = (calls) => (calls ?? []).map((c) => c?.name)

/** tools.2 正文的「时刻等价接受集」（§5.4 判据收正：不要求字面 22:00）。 */
const TIME_WORDS = ["22点", "22 点", "22时", "晚上十点", "晚上10点", "十点整"]
const TIME_RE = /22\s*[:：]\s*00(:\d\d)?/
const timeEquivalent = (s) => TIME_RE.test(String(s ?? "")) || TIME_WORDS.some((w) => String(s ?? "").includes(w))

export const cases = [
  {
    id: "tools.1",
    dim: "tools",
    class: "normal",
    prompt: "用可用工具查一下当前时间，然后用一句话告诉我。",
    build: null,
    callOpts: { tools },
    grade: (result) => {
      const first = step(result, 0).toolCalls[0]
      if (first?.name !== "get_time") return ok(false, `回合 1 首个工具调用 = ${first?.name ?? "(无工具调用)"}（需 get_time）`)
      const parsed = parseToolArgs(first)
      if (!parsed.ok) return ok(false, `回合 1 arguments 非 JSON：${parsed.error}`)
      if (!String(result.text ?? "").trim()) return ok(false, "工具结果回填后最终 content 为空")
      return ok(true, `回合 1 调 get_time，最终回答：${preview(result.text, 60)}`)
    },
  },
  {
    id: "tools.2",
    dim: "tools",
    class: "normal",
    prompt: "先用工具查当前时间，再把该时间作为正文，给 alice@example.com 发一封主题为「时间同步」的邮件。",
    build: null,
    callOpts: { tools },
    grade: (result) => {
      const r1 = step(result, 0).toolCalls[0]
      if (r1?.name !== "get_time") return ok(false, `回合 1 首个工具调用 = ${r1?.name ?? "(无工具调用)"}（需 get_time）`)
      const p1 = parseToolArgs(r1)
      if (!p1.ok) return ok(false, `回合 1 arguments 非 JSON：${p1.error}`)
      const send = step(result, 1).toolCalls.find((c) => c?.name === "send_email")
      if (!send) return ok(false, `回合 2 未调用 send_email（实际：${names(step(result, 1).toolCalls).join(",") || "(无工具调用)"}）`)
      const p2 = parseToolArgs(send)
      if (!p2.ok) return ok(false, `回合 2 send_email 的 arguments 非 JSON：${p2.error}`)
      const args = p2.value ?? {}
      if (args.to !== "alice@example.com") return ok(false, `to=${preview(JSON.stringify(args.to), 40)}（需 alice@example.com）`)
      if (args.subject !== "时间同步") return ok(false, `subject=${preview(JSON.stringify(args.subject), 40)}（需「时间同步」）`)
      if (!timeEquivalent(args.body)) return ok(false, `body 未命中时刻等价接受集：${preview(args.body, 60)}`)
      return ok(true, `时间链两轮齐（to/subject/body 值传递 ✓）：${preview(args.body, 40)}`)
    },
  },
  {
    id: "tools.3",
    dim: "tools",
    class: "error",
    prompt: "请回答：一年有几个月？",
    build: null,
    callOpts: { tools }, // 工具集含 read_file decoy —— 本题不该调用任何工具
    grade: (result) => {
      const calls = result.turns?.[0]?.steps?.flatMap((s) => s.toolCalls ?? []) ?? []
      if (calls.length !== 0) return ok(false, `不该调用工具，实际调用：${names(calls).join(",")}`)
      const hit = numEquals(result.text, 12)
      return ok(hit, hit ? `零工具调用 + 命中 12：${preview(result.text, 50)}` : `零工具调用但未命中 12：${preview(result.text, 60)}`)
    },
  },
  {
    id: "tools.4",
    dim: "tools",
    class: "boundary",
    prompt: "分别查一下北京和上海的天气，可以用并行调用。",
    build: null,
    callOpts: { tools, parallelToolCalls: true },
    grade: (result) => {
      const shape = toolShape(step(result, 0).toolCalls, { count: 2, everyName: "get_weather", argsParse: true })
      if (!shape.pass) return ok(false, `回合 1 ${shape.detail}`)
      const cities = step(result, 0).toolCalls.map((c) => parseToolArgs(c).value?.city).sort()
      if (JSON.stringify(cities) !== JSON.stringify(["上海", "北京"])) {
        return ok(false, `city 集合 ${JSON.stringify(cities)} ≠ [北京, 上海]`)
      }
      const text = String(result.text ?? "")
      if (!text.includes("晴") || !text.includes("小雨")) {
        return ok(false, `最终 content 未同时含「晴」「小雨」：${preview(text, 60)}`)
      }
      return ok(true, `并行双工具齐 + 两城市天气回填：${preview(text, 50)}`)
    },
  },
]
