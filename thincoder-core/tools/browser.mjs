/**
 * tools/browser.mjs — 浏览器工具面：schema ∥ 参数校验 ∥ `isReadonlyAction` ∥ 回执/错误形（§2.1/§2.2/§3.1）。
 *
 * 设计权威 = `docs/core/design/BROWSER-TOOL.md`（工具系统档 §6.7 只留指针）。
 * 分类钩子（KD-2）：`click` ∥ `evaluate` ⇒ 非只读（进 dispatch 许可阶段——§3.1）；其余动作免审。
 * 失败回执**返回**（不 throw）——首行 `Error: …` = 模型面失败形（`bash`/`execute` 既例；dispatch 侧按该前缀判失败——`agent/dispatch-run.mjs:77` ∥ `:129` ∥ `:135`）。
 */
import { DESC } from "./shared.mjs"
import { runAction } from "../browser/session.mjs"

export const BROWSER_ACTIONS = ["navigate", "snapshot", "click", "type", "evaluate", "wait", "screenshot", "close"]
const REF_RE = /^e\d+$/
const nonEmpty = (v) => typeof v === "string" && v !== ""

/** 参数校验（缺必填 / 互斥项冲突 ⇒ `Error: …`——不执行，§2.2）。 */
export function validateArgs(args) {
  const action = args?.action
  if (!BROWSER_ACTIONS.includes(action)) {
    return `Error: unknown browser action "${action ?? ""}" — actions: ${BROWSER_ACTIONS.join(", ")}`
  }
  if (action === "navigate" && !nonEmpty(args.url)) return "Error: navigate requires url"
  if (action === "click" || action === "type") {
    if (!nonEmpty(args.ref)) return `Error: ${action} requires ref`
    if (!REF_RE.test(args.ref)) return `Error: ${action} requires ref (form "e<N>")`
  }
  if (action === "type" && typeof args.text !== "string") return "Error: type requires text"
  if (action === "evaluate" && !nonEmpty(args.expression)) return "Error: evaluate requires expression"
  if (action === "wait") {
    const given = ["selector", "text", "url"].filter((key) => nonEmpty(args[key])).length + (args.networkIdle === true ? 1 : 0)
    if (given !== 1) return "Error: wait requires exactly one of selector|text|url|networkIdle"
  }
  return null
}

export const browserTool = {
  name: "browser",
  description: DESC("browser"),
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: BROWSER_ACTIONS, description: "Action to run (one per call): navigate | snapshot | click | type | evaluate | wait | screenshot | close." },
      url: { type: "string", description: "navigate: http/https URL to open — also the `wait` url predicate (substring of location.href)." },
      ref: { type: "string", description: "click / type: element reference from the last snapshot (`e<N>`)." },
      text: { type: "string", description: "type: text to enter — also the `wait` text predicate (visible body text contains it)." },
      expression: { type: "string", description: "evaluate: JavaScript expression run in the PAGE context (no Node/host access)." },
      selector: { type: "string", description: "snapshot: CSS selector scoping the scan — also the `wait` selector predicate." },
      clear: { type: "boolean", description: "type: replace the field content instead of appending (default false)." },
      max: { type: "number", description: "snapshot: max elements to list (default 100, hard cap 200)." },
      networkIdle: { type: "boolean", description: "wait: true = wait until network activity is quiet for 500ms." },
      timeoutMs: { type: "number", description: "wait: timeout in ms (default 30000, cap 120000)." },
      fullPage: { type: "boolean", description: "screenshot: true = capture the whole page, false = viewport (default)." },
      headless: { type: "boolean", description: "Session-open parameter (any action): default true. A different value on a running session is an error — close it first." },
    },
    required: ["action"],
  },
  // 非工具级只读：动作级分类钩子接管（click/evaluate 过审批门——§3.1/KD-2）；也因此不进只读角色的子代工具表。
  readonly: false,
  isReadonlyAction(args) {
    return !(args?.action === "click" || args?.action === "evaluate")
  },
  async execute(args, ctx) {
    const invalid = validateArgs(args)
    if (invalid) return invalid
    try {
      return await runAction(args.action, args, ctx)
    } catch (e) {
      return `Error: ${e?.message ?? String(e)}`
    }
  },
}
