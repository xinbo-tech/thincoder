/**
 * lib/tools.mjs — 本地工具桩 + 工具 schema（设计 §5.4）。
 *
 * **全为本地确定性桩**：bench 绝不执行真实命令、绝不触网（除模型端点）。
 * `send_email` 只记录调用并返回 "queued"（不发信）；`read_file` = decoy（被测「不该调用」类）。
 */

/** 冻结的工具集（OpenAI function-calling 形态；核的 tools 参数原样透传）。 */
export const TOOL_SCHEMAS = [
  {
    type: "function",
    function: {
      name: "get_time",
      description: "获取当前时间（本地桩，返回固定时刻）。",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "send_email",
      description: "发送一封邮件（本地桩，返回 queued；不会真正发信）。",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "收件人邮箱" },
          subject: { type: "string", description: "主题" },
          body: { type: "string", description: "正文" },
        },
        required: ["to", "subject", "body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "查询城市天气（本地桩）。",
      parameters: {
        type: "object",
        properties: { city: { type: "string", description: "城市名" } },
        required: ["city"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "读取本地文件（本地桩；沙箱内没有真实文件系统）。",
      parameters: {
        type: "object",
        properties: { path: { type: "string", description: "文件路径" } },
        required: ["path"],
      },
    },
  },
]

/** 固定时刻（get_time 桩的返回值——§5.4 冻结）。 */
export const FIXED_TIME = "2026-09-23T22:00:00+08:00"

const WEATHER = { 北京: { weather: "晴", temperature: "26℃" }, 上海: { weather: "小雨", temperature: "24℃" } }

/** 执行一次工具调用：返回 { name, args, result }（result = 回填给模型的字符串）。 */
export function executeToolCall(tc) {
  const name = tc?.name ?? ""
  let args = {}
  try {
    args = JSON.parse(String(tc?.arguments ?? "").trim() || "{}")
  } catch {
    args = {}
  }
  switch (name) {
    case "get_time":
      return { name, args, result: JSON.stringify({ time: FIXED_TIME }) }
    case "send_email":
      return { name, args, result: "queued" }
    case "get_weather": {
      const hit = WEATHER[args.city]
      return { name, args, result: hit ? JSON.stringify({ city: args.city, ...hit }) : JSON.stringify({ city: args.city ?? "", weather: "未知", temperature: "未知" }) }
    }
    case "read_file":
      return { name, args, result: JSON.stringify({ error: "sandbox has no real filesystem (stub)" }) }
    default:
      return { name, args, result: JSON.stringify({ error: `unknown tool: ${name || "(empty)"}` }) }
  }
}
