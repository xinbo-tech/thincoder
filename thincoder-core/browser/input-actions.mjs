/**
 * browser/input-actions.mjs — 新七动作实现（press / hover / wheel / mouse / drag / touch / insert）
 * + 目标解析（ref → 真点 ∥ x,y）（BROWSER-TOOL.md §2.2 ∥ §2.7 ∥ §6 KD-14 / KD-16 / KD-17）。
 *
 * 会话能力一律经句柄取（`h.call` / `h.evalRaw` / `h.ensureSession` / `h.resolveRef` / `h.focusRef` /
 * `h.once` / `h.pageError`）——本档不 import `session.mjs`（DAG 单向，§5 拆分决定）。
 * 一切 ref 寻址的输入动作经 `pointExpression` 自动滚动到视（F-BT14——视口外目标同样可驱）。
 */
import { clampSteps, dragSequence, mouseSequence, moveSequence, parseTargetSpec, pressSequence, TOUCH_GESTURES, TOUCH_TAP_GAP_MS, touchSequence, wheelSequence } from "./input.mjs"
import { pointExpression } from "./snapshot.mjs"

export const WHEEL_SETTLE_MS = 800 // 卷动稳定读数上限（§2.2 wheel 判据）
export const IME_COMMIT_BREATH_MS = 50 // 组合与提交之间留一拍（中间态可观察——KD-17）
export const DRAG_INTERCEPT_TIMEOUT_MS = 5_000 // html5 拖拽拦截等待（无拦截事件 ⇒ 明示拒——不悬挂）

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function sendAll(h, commands) {
  for (const cmd of commands) await h.call(cmd.method, cmd.params)
}

/** 视口中心（wheel 落点缺省——§2.2）。 */
async function viewportCenter(h) {
  const v = await h.evalRaw("({ x: Math.round(innerWidth / 2), y: Math.round(innerHeight / 2) })")
  const x = Number(v?.x ?? 0)
  const y = Number(v?.y ?? 0)
  return { x, y, ref: null, name: null, label: `${x},${y}` }
}

/** 目标解析（§2.7）：ref ⇒ 表查 + `pointExpression`（滚动到视 + 中心点）；x,y ⇒ 直读；缺省 ⇒ fallback。 */
async function targetOf(args, h, fallback = null) {
  const hasRef = typeof args?.ref === "string" && args.ref !== ""
  const hasXY = args?.x !== undefined && args?.y !== undefined && Number.isFinite(Number(args.x)) && Number.isFinite(Number(args.y))
  if (hasRef) {
    const entry = h.resolveRef(args.ref)
    const p = await h.evalRaw(pointExpression(entry.selector, entry.tag))
    if (!p?.found || p.tag) throw h.pageError(`ref ${args.ref} is stale (was "${entry.name}") — run snapshot again`)
    return { x: Number(p.x), y: Number(p.y), ref: args.ref, name: entry.name, label: `${args.ref} "${entry.name}"` }
  }
  if (hasXY) return { x: Number(args.x), y: Number(args.y), ref: null, name: null, label: `${Number(args.x)},${Number(args.y)}` }
  if (fallback) return fallback(h)
  throw new Error(`${args?.action ?? "action"} requires ref or x,y`)
}

/** `e<N>` ∥ `"x,y"` 形目标（drag / touch swipe 的 from、to——§2.2）。 */
async function specTarget(spec, h, action, param) {
  const parsed = parseTargetSpec(spec)
  if (!parsed) throw new Error(`${action} ${param} must be an element ref (e<N>) or "x,y"`)
  if (parsed.kind === "ref") return targetOf({ ref: parsed.ref }, h)
  return { x: parsed.x, y: parsed.y, ref: null, name: null, label: `${parsed.x},${parsed.y}` }
}

/** press（§2.2）：真按键链 + 携 ref 先聚焦（§2.7）；未知键 ⇒ 未起会话先拒（不执行）。 */
async function actPress(args, ctx, h) {
  const seq = pressSequence({ key: args.key, modifiers: args.modifiers, phase: args.phase, repeat: args.repeat })
  await h.ensureSession(args)
  let target = ""
  if (typeof args.ref === "string" && args.ref !== "") {
    const f = await h.focusRef(args.ref)
    target = ` → ${f.label}`
  }
  await sendAll(h, seq.commands)
  const repeat = seq.repeat > 0 ? ` ×${seq.repeat}` : ""
  const phase = args.phase === "down" || args.phase === "up" ? ` (${args.phase})` : ""
  return `[press] ${seq.combo}${repeat}${phase}${target}`
}

/** hover（§2.2）：指针移动（无激活）。 */
async function actHover(args, ctx, h) {
  await h.ensureSession(args)
  const t = await targetOf(args, h)
  await sendAll(h, moveSequence({ x: t.x, y: t.y }))
  return `[hover] ${t.label}`
}

/** 卷动稳定读数（≤800ms——两次连读相等即定）。 */
async function settleScroll(h, maxMs = WHEEL_SETTLE_MS) {
  const deadline = Date.now() + maxMs
  let last = null
  for (;;) {
    const v = await h.evalRaw("({ x: Math.round(window.scrollX), y: Math.round(window.scrollY) })")
    const reading = { x: Number(v?.x ?? 0), y: Number(v?.y ?? 0) }
    if (last && last.x === reading.x && last.y === reading.y) return reading
    if (Date.now() >= deadline) return reading
    last = reading
    await sleep(100)
  }
}

/** wheel（§2.2）：落点缺省 = 视口中心；回执 = 卷动后 window 读数。 */
async function actWheel(args, ctx, h) {
  await h.ensureSession(args)
  const deltaX = Number(args.deltaX ?? 0) || 0
  const deltaY = Number(args.deltaY ?? 0) || 0
  const t = await targetOf(args, h, viewportCenter)
  await sendAll(h, wheelSequence({ x: t.x, y: t.y, deltaX, deltaY }))
  const win = await settleScroll(h)
  return `[wheel] Δ(${deltaX},${deltaY}) at ${Math.round(t.x)},${Math.round(t.y)} — window (${win.x},${win.y})`
}

/** mouse（§2.2）：真指针（命中测试生效）；形 = click（默认）∥ down ∥ up；double ⇒ clickCount 1、2。 */
async function actMouse(args, ctx, h) {
  await h.ensureSession(args)
  const t = await targetOf(args, h)
  const phase = args.phase === "down" || args.phase === "up" ? args.phase : "click"
  const double = args.double === true
  const button = String(args.button ?? "left")
  await sendAll(h, mouseSequence({ x: t.x, y: t.y, button, phase, double }))
  const shape = phase === "click" ? (double ? "doubleClick" : "click") : phase
  return `[mouse] ${button} ${shape} ${t.label}`
}

/** HTML5 原生拖放（KD-16，实验）：拦截 → `dragIntercepted` 取 DragData → 事件三连 → 投递 → 抬起。 */
async function html5Drag(h, from, to, steps) {
  await h.call("Input.setInterceptDrags", { enabled: true })
  try {
    const intercepted = h.once("Input.dragIntercepted", DRAG_INTERCEPT_TIMEOUT_MS)
    // 占位消费者：下方 sendAll 抛出时该 promise 无人 await——无此挂载即 unhandled 拒绝（宿主进程级 fatal）。
    intercepted.catch(() => {})
    await sendAll(h, dragSequence({ from, to, steps, release: false }))
    let data
    try { data = (await intercepted).data } catch {
      throw new Error("html5 drag was not intercepted — the source may not be a native draggable; retry without html5")
    }
    await h.call("Input.dispatchDragEvent", { type: "dragEnter", x: to.x, y: to.y, data })
    await h.call("Input.dispatchDragEvent", { type: "dragOver", x: to.x, y: to.y, data })
    await h.call("Input.dispatchDragEvent", { type: "drop", x: to.x, y: to.y, data })
    await sendAll(h, mouseSequence({ x: to.x, y: to.y, phase: "up" }))
  } finally {
    try { await h.call("Input.setInterceptDrags", { enabled: false }) } catch { /* 会话已断——拦截位随进程 */ }
  }
}

/** drag（§2.2）：默认鼠标序列（按下 → 移动×steps → 抬起）；`html5:true` = 拦截链（KD-16）。 */
async function actDrag(args, ctx, h) {
  await h.ensureSession(args)
  const from = await specTarget(args.from, h, "drag", "from")
  const to = await specTarget(args.to, h, "drag", "to")
  const steps = clampSteps(args.steps)
  if (args.html5 === true) await html5Drag(h, from, to, steps)
  else await sendAll(h, dragSequence({ from, to, steps }))
  return `[drag] ${from.label} → ${to.label}${args.html5 === true ? " (html5)" : ""}`
}

/** touch（§2.2）：tap / doubleTap / pinch（落点 + scale）∥ swipe（from → to）；KD-14 分工在引擎档。 */
async function actTouch(args, ctx, h) {
  const gesture = String(args.gesture ?? "tap")
  if (!TOUCH_GESTURES.includes(gesture)) throw new Error(`unknown touch gesture "${gesture}" — gestures: ${TOUCH_GESTURES.join(", ")}`)
  await h.ensureSession(args)
  if (gesture === "swipe") {
    const from = await specTarget(args.from, h, "touch", "from")
    const to = await specTarget(args.to, h, "touch", "to")
    await sendAll(h, touchSequence({ gesture, from, to, steps: clampSteps(args.steps) }))
    return `[touch] swipe ${from.label} → ${to.label}`
  }
  const t = await targetOf(args, h)
  if (gesture === "pinch") {
    const scale = Number(args.scale)
    await sendAll(h, touchSequence({ gesture, x: t.x, y: t.y, scale }))
    return `[touch] pinch ×${scale} at ${Math.round(t.x)},${Math.round(t.y)}`
  }
  // tap / doubleTap：显式序列；doubleTap = 两轮 + 双击窗内间隔（KD-14 收正）
  const rounds = gesture === "doubleTap" ? 2 : 1
  for (let i = 0; i < rounds; i++) {
    if (i > 0) await sleep(TOUCH_TAP_GAP_MS)
    await sendAll(h, touchSequence({ gesture, x: t.x, y: t.y }))
  }
  return `[touch] ${gesture} ${t.label}`
}

/** insert（§2.2）：纯文本插入（不按键——长文本 / emoji 路径）；`ime` = 组合候选 → `insertText` 提交（KD-17）。 */
async function actInsert(args, ctx, h) {
  const text = String(args.text)
  const ime = typeof args.ime === "string" && args.ime !== "" ? args.ime : null
  await h.ensureSession(args)
  let target = null
  if (typeof args.ref === "string" && args.ref !== "") target = await h.focusRef(args.ref)
  if (ime) {
    await h.call("Input.imeSetComposition", { text: ime, selectionStart: ime.length, selectionEnd: ime.length })
    await sleep(IME_COMMIT_BREATH_MS)
  }
  await h.call("Input.insertText", { text })
  const chars = `← ${text.length} chars${ime ? " (ime)" : ""}`
  return target ? `[insert] ${target.label} ${chars}` : `[insert] (focused) ${chars}`
}

/** 新七动作分发表（会话档并入总表——§5）。 */
export const INPUT_ACTIONS = {
  press: actPress,
  hover: actHover,
  wheel: actWheel,
  mouse: actMouse,
  drag: actDrag,
  touch: actTouch,
  insert: actInsert,
}
