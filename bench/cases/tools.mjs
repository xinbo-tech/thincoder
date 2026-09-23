/**
 * cases/tools.mjs — 工具调用维 4 例（题面逐字冻结 = 设计档 §5.4；改题 ⇒ SUITE_VERSION + 1）。
 * 工具 schema 与桩 = `lib/tools.mjs`（全本地确定性，绝不触网）；题面修正 = §5.12 行 3（`tools.4` 补词）。
 * 判分（§2.10.2 分层）：结构断言（name / arguments / 轮次）为机械面；`.2` 的**正文时刻等价**、
 * `.4` 的**天气值传递**为判官面（rubric = §5.11 正本逐字）——不再用时刻等价接受集 / 「晴」「小雨」字面命中。
 * 混合面短路顺序（§2.6）：机械面已 FAIL ⇒ 不调判官。
 */

import { judgeAfterMech, numEquals, ok, parseToolArgs, preview, toolShape } from "../lib/grade.mjs"
import { TOOL_SCHEMAS } from "../lib/tools.mjs"

const tools = TOOL_SCHEMAS
const step = (result, i) => result.turns?.[0]?.steps?.[i] ?? { toolCalls: [], text: "" }
const names = (calls) => (calls ?? []).map((c) => c?.name)

export const cases = [
  {
    id: "tools.1",
    dim: "tools",
    class: "normal",
    prompt: "用可用工具查一下当前时间，然后用一句话告诉我。",
    build: null,
    callOpts: { tools },
    mechRubric: "回合 1 首个工具调用 = `get_time`；工具回填后最终回答非空。",
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
    judge: {
      turn: 0,
      rubric: "正文中的时间须与工具返回值 `2026-09-23T22:00:00+08:00` **同一时刻**（`22:00` / `晚上十点` / `22 时` / `今晚 10 点` 等等价表述均可）。其他时刻（如 23:00、明天）或未写时刻 = FAIL。",
    },
    mechRubric: "回合 1 首个调用 = `get_time`；回合 2 调用 `send_email` 且 `to = alice@example.com`、`subject = 时间同步`、正文载明工具返回的时刻。",
    grade: async (result, ctx) => {
      const r1 = step(result, 0).toolCalls[0]
      const mech = (() => {
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
        return ok(true, "时间链两轮齐（to / subject 值传递 ✓）")
      })()
      return judgeAfterMech(mech, ctx)
    },
  },
  {
    id: "tools.3",
    dim: "tools",
    class: "error",
    prompt: "请回答：一年有几个月？",
    build: null,
    callOpts: { tools }, // 工具集含 read_file decoy —— 本题不该调用任何工具（工具使用纪律 = 测试点，§5.12 行 5）
    mechRubric: "不得调用任何工具（工具集含 decoy）；回答须含 12（数字独立成词）。",
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
    prompt: "请在同一轮里并行调用两个工具，分别查北京和上海的天气。",
    build: null,
    callOpts: { tools, parallelToolCalls: true },
    judge: {
      turn: 0,
      rubric: "PASS = 回答同时传达「北京为晴」「上海为小雨」（等价表述可，如「阳光充足」「飘着小雨」）。缺一边、或两城市天气张冠李戴 = FAIL。",
    },
    mechRubric: "回合 1 恰 2 条 `get_weather`（同轮并行），`city` 集合 = {北京, 上海}；回答传达两城市天气（北京晴 / 上海小雨）。",
    grade: async (result, ctx) => {
      const shape = toolShape(step(result, 0).toolCalls, { count: 2, everyName: "get_weather", argsParse: true })
      const mech = (() => {
        if (!shape.pass) return ok(false, `回合 1 ${shape.detail}`)
        const cities = step(result, 0).toolCalls.map((c) => parseToolArgs(c).value?.city).sort()
        if (JSON.stringify(cities) !== JSON.stringify(["上海", "北京"])) {
          return ok(false, `city 集合 ${JSON.stringify(cities)} ≠ [北京, 上海]`)
        }
        return ok(true, "同轮并行双工具齐（city 集合 = {北京, 上海}）")
      })()
      return judgeAfterMech(mech, ctx)
    },
  },
]
