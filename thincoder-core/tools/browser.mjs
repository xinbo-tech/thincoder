/**
 * tools/browser.mjs — 浏览器工具面：schema ∥ 参数校验 ∥ `isReadonlyAction` ∥ 回执/错误形（§2.1/§2.2/§3.1）。
 *
 * 设计权威 = `docs/core/design/BROWSER-TOOL.md`（工具系统档 §6.7 只留指针）。
 * 分类钩子（KD-2 ∥ KD-11）：过门 = `click` ∥ `evaluate` + `press` ∥ `mouse` ∥ `drag` ∥ `touch` 点按 ∥
 * `clipboard` 全量；免审 = `navigate` ∥ `type` ∥ `snapshot` ∥ `screenshot` ∥ `wait` ∥ `close` +
 * `hover` ∥ `wheel` ∥ `insert` ∥ `touch` 手势（swipe / pinch）——同一钩子按参数分类，机制零新增。
 * 失败回执**返回**（不 throw）——首行 `Error: …` = 模型面失败形（`bash`/`execute` 既例；dispatch 侧按该前缀
 * 判失败——`agent/dispatch-run.mjs:77` ∥ `:129` ∥ `:135`）。
 */
import { CLIPBOARD_OPS } from "../browser/clipboard.mjs"
import { TOUCH_GESTURES, parseTargetSpec } from "../browser/input.mjs"
import { runAction } from "../browser/session.mjs"
import { DESC } from "./shared.mjs"

export const BROWSER_ACTIONS = [
  "navigate", "snapshot", "click", "type", "evaluate", "wait", "screenshot", "close",
  "press", "hover", "wheel", "mouse", "drag", "touch", "insert", "clipboard",
]
const REF_RE = /^e\d+$/
const GATED_ACTIONS = new Set(["click", "evaluate", "press", "mouse", "drag", "clipboard"])
const nonEmpty = (v) => typeof v === "string" && v !== ""
const coord = (v) => v !== undefined && v !== null && String(v) !== "" && Number.isFinite(Number(v))
const hasTarget = (args) => nonEmpty(args.ref) || (coord(args.x) && coord(args.y))
/** 互斥面（§2.2 :101「互斥项冲突 ⇒ `Error`」）：落点 ref 与 x,y 同时给 —— 不静默取一。 */
const targetConflict = (args) => nonEmpty(args.ref) && coord(args.x) && coord(args.y)

/** 目标形检（`from` / `to`——§2.2 :103 句）。 */
function specError(action, param, value) {
  return parseTargetSpec(value) ? null : `Error: ${action} ${param} must be an element ref (e<N>) or "x,y"`
}

/** 参数校验（缺必填 / 互斥项冲突 ⇒ `Error: …`——不执行，§2.2；扩展动作校验句逐字 = §2.2 :102-103）。 */
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
  if (action === "press" && !nonEmpty(args.key)) return "Error: press requires key"
  if (action === "hover" || action === "mouse") {
    if (!hasTarget(args)) return `Error: ${action} requires ref or x,y`
    if (targetConflict(args)) return `Error: ${action} requires exactly one of ref or x,y`
  }
  if (action === "wheel") {
    const deltaX = coord(args.deltaX) ? Number(args.deltaX) : 0
    const deltaY = coord(args.deltaY) ? Number(args.deltaY) : 0
    if (deltaX === 0 && deltaY === 0) return "Error: wheel requires deltaX or deltaY"
    if (targetConflict(args)) return "Error: wheel requires exactly one of ref or x,y"
  }
  if (action === "drag") {
    if (!nonEmpty(args.from) || !nonEmpty(args.to)) return "Error: drag requires from and to"
    return specError("drag", "from", args.from) ?? specError("drag", "to", args.to)
  }
  if (action === "touch") {
    const gesture = String(args.gesture ?? "tap")
    if (!TOUCH_GESTURES.includes(gesture)) return `Error: unknown touch gesture "${gesture}" — gestures: ${TOUCH_GESTURES.join(", ")}`
    if (gesture === "swipe") {
      if (!nonEmpty(args.from) || !nonEmpty(args.to)) return "Error: touch requires from and to"
      return specError("touch", "from", args.from) ?? specError("touch", "to", args.to)
    }
    if (gesture === "pinch") {
      if (!hasTarget(args) || !(coord(args.scale) && Number(args.scale) > 0)) return "Error: touch requires ref or x,y and scale"
      return targetConflict(args) ? "Error: touch requires exactly one of ref or x,y" : null
    }
    if (!hasTarget(args)) return "Error: touch requires ref or x,y"
    if (targetConflict(args)) return "Error: touch requires exactly one of ref or x,y"
  }
  if (action === "insert" && typeof args.text !== "string") return "Error: insert requires text"
  if (action === "clipboard") {
    const op = String(args.op ?? "")
    if (!nonEmpty(args.op)) return "Error: clipboard requires op"
    if (!CLIPBOARD_OPS.includes(op)) return `Error: unknown clipboard op "${op}" — ops: ${CLIPBOARD_OPS.join(", ")}`
    if (op === "write" && typeof args.text !== "string") return "Error: clipboard write requires text"
  }
  return null
}

export const browserTool = {
  name: "browser",
  description: DESC("browser"),
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: BROWSER_ACTIONS, description: "Action to run (one per call): navigate | snapshot | click | type | evaluate | wait | screenshot | close | press | hover | wheel | mouse | drag | touch | insert | clipboard." },
      url: { type: "string", description: "navigate: http/https URL to open — also the `wait` url predicate (substring of location.href)." },
      ref: { type: "string", description: "click / type / press / hover / wheel / mouse / touch / insert: element reference from the last snapshot (`e<N>`)." },
      text: { type: "string", description: "type: text to enter — insert: text to insert; clipboard write: text to write; wait: the awaited visible text." },
      expression: { type: "string", description: "evaluate: JavaScript expression run in the PAGE context (no Node/host access)." },
      selector: { type: "string", description: "snapshot: CSS selector scoping the scan — also the `wait` selector predicate." },
      clear: { type: "boolean", description: "type: replace the field content instead of appending (default false)." },
      max: { type: "number", description: "snapshot: max elements to list (default 100, hard cap 200)." },
      networkIdle: { type: "boolean", description: "wait: true = wait until network activity is quiet for 500ms." },
      timeoutMs: { type: "number", description: "wait: timeout in ms (default 30000, cap 120000)." },
      fullPage: { type: "boolean", description: "screenshot: true = capture the whole page, false = viewport (default)." },
      headless: { type: "boolean", description: "Session-open parameter (any action): default true. A different value on a running session is an error — close it first." },
      key: { type: "string", description: "press: key name (Enter, Escape, Tab, Backspace, Delete, Space, Insert, Home, End, PageUp, PageDown, Arrows, F1-F12, modifiers) or a single character." },
      modifiers: { type: "array", items: { type: "string" }, description: "press: modifier keys held (and observed by the page) — Control | Alt | Shift | Meta, any combination." },
      phase: { type: "string", description: "press: press (default) | down | up. mouse: click (default) | down | up." },
      repeat: { type: "number", description: "press: auto-repeat count while the key is held (0-100, default 0)." },
      x: { type: "number", description: "hover / wheel / mouse / touch: viewport CSS pixel X (pass together with y)." },
      y: { type: "number", description: "hover / wheel / mouse / touch: viewport CSS pixel Y." },
      button: { type: "string", description: "mouse: left (default) | middle | right | back | forward." },
      double: { type: "boolean", description: "mouse: true = double click (default false)." },
      deltaX: { type: "number", description: "wheel: horizontal scroll amount in CSS pixels." },
      deltaY: { type: "number", description: "wheel: vertical scroll amount in CSS pixels (positive = down)." },
      from: { type: "string", description: "drag / touch swipe: start point — an element ref (e<N>) or \"x,y\" (viewport CSS pixels)." },
      to: { type: "string", description: "drag / touch swipe: end point — an element ref (e<N>) or \"x,y\"." },
      steps: { type: "number", description: "drag / touch swipe: intermediate move steps (default 10, clamped 2-50)." },
      html5: { type: "boolean", description: "drag: true = native HTML5 drag-and-drop branch (experimental)." },
      gesture: { type: "string", description: "touch: tap (default) | doubleTap | swipe | pinch." },
      scale: { type: "number", description: "touch pinch: scale factor (>1 zoom in, <1 zoom out)." },
      ime: { type: "string", description: "insert: IME composition text staged before the committed text is inserted." },
      op: { type: "string", description: "clipboard: read | write | copy | paste." },
    },
    required: ["action"],
  },
  // 非工具级只读：动作级分类钩子接管（§3.1 逐动作表——KD-11）；也因此不进只读角色的子代工具表。
  readonly: false,
  isReadonlyAction(args) {
    if (args?.action === "touch") {
      const gesture = String(args.gesture ?? "tap")
      return gesture === "swipe" || gesture === "pinch" // 点按过门；手势免审（§3.1 表）
    }
    return !GATED_ACTIONS.has(args?.action)
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
