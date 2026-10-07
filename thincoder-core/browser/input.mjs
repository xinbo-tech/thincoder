/**
 * browser/input.mjs — 输入引擎（纯函数）：键表 ∥ 修饰 / 移位解析 ∥ 序列构造器（键 ∥ 鼠标 ∥ 滚轮 ∥ 拖拽 ∥ 触屏）。
 * 设计权威 = `docs/core/design/BROWSER-TOOL.md` §2.8（键面）∥ §2.7（坐标语义）∥ §6 KD-14 / KD-16；
 * 本档零会话依赖（DAG 叶面——动作模块 import 本档，本档不 import 动作 / 会话 / 传输）。
 *
 * 序列形沿 CDP `Input` 域实证口径（对照 Puppeteer `cdp/Input.ts`）：
 *  - 有文本产出的键 ⇒ `keyDown` + `text`；无 ⇒ `rawKeyDown`（协议注记：Control + A 一类不发文本）；
 *  - 任一非 Shift 修饰在位 ⇒ 不发文本（`modifiers & ~8` 口径）；
 *  - 修饰键按下 / 抬起逐事件演进 `modifiers` 位（按下先置位、抬起先清位——修饰态可被页面观察）。
 * 坐标一律视口 CSS 像素（§2.7）。
 */

/** 修饰位（CDP `modifiers` 位域）。 */
export const MODIFIER_BITS = { Alt: 1, Control: 2, Meta: 4, Shift: 8 }
export const MODIFIER_ORDER = ["Alt", "Control", "Meta", "Shift"]

/** 修饰键本体（按下 / 抬起事件面）。 */
const MODIFIER_SLOTS = {
  Alt: { key: "Alt", code: "AltLeft", vk: 18, loc: 1 },
  Control: { key: "Control", code: "ControlLeft", vk: 17, loc: 1 },
  Meta: { key: "Meta", code: "MetaLeft", vk: 91, loc: 1 },
  Shift: { key: "Shift", code: "ShiftLeft", vk: 16, loc: 1 },
}

const FN_KEYS = {}
for (let i = 1; i <= 12; i++) FN_KEYS[`F${i}`] = { key: `F${i}`, code: `F${i}`, vk: 111 + i }

/** 命名键表（§2.8）：`{ key, code, vk, text?, loc? }`——值 = US 布局传统键码。 */
export const NAMED_KEYS = {
  Enter: { key: "Enter", code: "Enter", vk: 13, text: "\r" },
  Escape: { key: "Escape", code: "Escape", vk: 27 },
  Tab: { key: "Tab", code: "Tab", vk: 9, text: "\t" },
  Backspace: { key: "Backspace", code: "Backspace", vk: 8 },
  Delete: { key: "Delete", code: "Delete", vk: 46 },
  Space: { key: " ", code: "Space", vk: 32, text: " " },
  Insert: { key: "Insert", code: "Insert", vk: 45 },
  Home: { key: "Home", code: "Home", vk: 36 },
  End: { key: "End", code: "End", vk: 35 },
  PageUp: { key: "PageUp", code: "PageUp", vk: 33 },
  PageDown: { key: "PageDown", code: "PageDown", vk: 34 },
  ArrowUp: { key: "ArrowUp", code: "ArrowUp", vk: 38 },
  ArrowDown: { key: "ArrowDown", code: "ArrowDown", vk: 40 },
  ArrowLeft: { key: "ArrowLeft", code: "ArrowLeft", vk: 37 },
  ArrowRight: { key: "ArrowRight", code: "ArrowRight", vk: 39 },
  ...FN_KEYS,
  ...Object.fromEntries(Object.entries(MODIFIER_SLOTS).map(([name, slot]) => [name, { key: slot.key, code: slot.code, vk: slot.vk, loc: slot.loc }])),
}

/** 单字符行表（US 布局）：`[基键, 移位键, code, vk]`（`1`→`!`、`-`→`_`……）。 */
const CHAR_ROWS = [
  ["1", "!", "Digit1", 49], ["2", "@", "Digit2", 50], ["3", "#", "Digit3", 51], ["4", "$", "Digit4", 52],
  ["5", "%", "Digit5", 53], ["6", "^", "Digit6", 54], ["7", "&", "Digit7", 55], ["8", "*", "Digit8", 56],
  ["9", "(", "Digit9", 57], ["0", ")", "Digit0", 48],
  ["-", "_", "Minus", 189], ["=", "+", "Equal", 187],
  ["[", "{", "BracketLeft", 219], ["]", "}", "BracketRight", 221], ["\\", "|", "Backslash", 220],
  [";", ":", "Semicolon", 186], ["'", "\"", "Quote", 222], ["`", "~", "Backquote", 192],
  [",", "<", "Comma", 188], [".", ">", "Period", 190], ["/", "?", "Slash", 191],
]

/** 单字符 → 键面描述（`shift` = 该字符本身需 Shift；`alt` = 显式 Shift 时的产出形）。 */
function charSpec(ch) {
  if (ch === " ") return { key: " ", text: " ", code: "Space", vk: 32, shift: false, alt: null }
  if (/^[a-z]$/.test(ch)) {
    const up = ch.toUpperCase()
    return { key: ch, text: ch, code: `Key${up}`, vk: up.charCodeAt(0), shift: false, alt: { key: up, text: up } }
  }
  if (/^[A-Z]$/.test(ch)) return { key: ch, text: ch, code: `Key${ch}`, vk: ch.charCodeAt(0), shift: true, alt: null }
  for (const [base, shifted, code, vk] of CHAR_ROWS) {
    if (ch === base) return { key: ch, text: ch, code, vk, shift: false, alt: { key: shifted, text: shifted } }
    if (ch === shifted) return { key: ch, text: ch, code, vk, shift: true, alt: null }
  }
  return null
}

/** 键解析（§2.8）：命名键 ∥ 单字符（US 布局）；未列 ⇒ 抛 `unknown key "<k>" — keys: …`（不执行）。 */
export function resolveKey(key) {
  const raw = String(key ?? "")
  const named = NAMED_KEYS[raw]
  if (named) return { ...named, shift: false, alt: null }
  if (raw.length === 1) {
    const spec = charSpec(raw)
    if (spec) return spec
  }
  throw new Error(`unknown key "${raw}" — keys: ${Object.keys(NAMED_KEYS).join(", ")} — or a single US-layout character (a-z, 0-9, punctuation)`)
}

/** 修饰数组归一（大小写不敏感 → 固定序 Alt/Control/Meta/Shift）；未列名 ⇒ 拒（不静默发裸键）。 */
export function normalizeModifiers(list) {
  const given = Array.isArray(list) ? list : []
  const out = []
  for (const raw of given) {
    const name = MODIFIER_ORDER.find((m) => m.toLowerCase() === String(raw).toLowerCase())
    if (!name) throw new Error(`unknown modifier "${raw}" — modifiers: ${MODIFIER_ORDER.join(", ")}`)
    if (!out.includes(name)) out.push(name)
  }
  return MODIFIER_ORDER.filter((m) => out.includes(m))
}

function keyDownParams(slot, bits, { text = null, autoRepeat = false } = {}) {
  const params = { type: text ? "keyDown" : "rawKeyDown", modifiers: bits, windowsVirtualKeyCode: slot.vk, code: slot.code, key: slot.key }
  if (slot.loc) params.location = slot.loc
  if (text) { params.text = text; params.unmodifiedText = text }
  if (autoRepeat) params.autoRepeat = true
  return { method: "Input.dispatchKeyEvent", params }
}

function keyUpParams(slot, bits) {
  const params = { type: "keyUp", modifiers: bits, windowsVirtualKeyCode: slot.vk, code: slot.code, key: slot.key }
  if (slot.loc) params.location = slot.loc
  return { method: "Input.dispatchKeyEvent", params }
}

/**
 * 按键序列（§2.8）：修饰键按下 → 主键（+`autoRepeat`×repeat）→ 主键抬起 → 修饰键抬起。
 * `phase` = down（只按）∥ up（只抬）∥ press（默认 = 按 + 抬）；`repeat` 0–100（越界夹取）。
 * @returns {{combo: string, commands: Array<{method: string, params: object}>}}
 */
export function pressSequence({ key, modifiers = [], phase = "press", repeat = 0 } = {}) {
  const spec = resolveKey(key)
  const mods = normalizeModifiers(modifiers)
  const wanted = Number(repeat)
  const repeatCount = Math.max(0, Math.min(Number.isFinite(wanted) ? Math.floor(wanted) : 0, 100))
  const autoShift = spec.shift && !mods.includes("Shift") // 大写字母 / 移位符号 ⇒ 自动置 Shift 位（§2.8）
  const shift = spec.shift || mods.includes("Shift")
  const main = (shift && spec.alt ? spec.alt : { key: spec.key, text: spec.text })
  const mainSlot = { key: main.key, code: spec.code, vk: spec.vk, loc: spec.loc }
  const text = mods.some((m) => m !== "Shift") ? null : (main.text ?? null) // 非 Shift 修饰 ⇒ 不发文本
  const bitsAll = mods.reduce((acc, m) => acc | MODIFIER_BITS[m], 0) | (autoShift ? MODIFIER_BITS.Shift : 0)
  const commands = []
  if (phase !== "up") {
    let bits = 0
    for (const name of mods) {
      bits |= MODIFIER_BITS[name]
      commands.push(keyDownParams(MODIFIER_SLOTS[name], bits))
    }
    for (let i = 0; i <= repeatCount; i++) commands.push(keyDownParams(mainSlot, bitsAll, { text, autoRepeat: i > 0 }))
  }
  if (phase !== "down") {
    commands.push(keyUpParams(mainSlot, bitsAll))
    let bits = bitsAll
    for (const name of [...mods].reverse()) {
      bits &= ~MODIFIER_BITS[name]
      commands.push(keyUpParams(MODIFIER_SLOTS[name], bits))
    }
  }
  return { combo: [...mods, spec.key].join("+"), repeat: repeatCount, commands }
}

/** 鼠标按钮位（CDP `buttons` 位域）——键序 = 报错枚举序。 */
export const MOUSE_BUTTONS = { left: 1, middle: 4, right: 2, back: 8, forward: 16 }

function mouseEvent(type, x, y, extra = {}) {
  return { method: "Input.dispatchMouseEvent", params: { type, x, y, ...extra } }
}

/** 指针移动序列（hover——仅 `mouseMoved`）。 */
export function moveSequence({ x, y } = {}) {
  return [mouseEvent("mouseMoved", x, y, { button: "none", buttons: 0 })]
}

/** 鼠标序列（§2.2 mouse）：click = 移动 → 按下 → 抬起（double ⇒ clickCount 1、2）；down / up = 单边。 */
export function mouseSequence({ x, y, button = "left", phase = "click", double = false } = {}) {
  const flag = MOUSE_BUTTONS[button]
  if (!flag) throw new Error(`unknown mouse button "${button}" — buttons: ${Object.keys(MOUSE_BUTTONS).join(", ")}`)
  const shape = phase === "down" || phase === "up" ? phase : "click"
  const commands = []
  if (shape !== "up") commands.push(mouseEvent("mouseMoved", x, y, { button: "none", buttons: 0 }))
  if (shape === "down") {
    commands.push(mouseEvent("mousePressed", x, y, { button, buttons: flag, clickCount: 1 }))
  } else if (shape === "up") {
    commands.push(mouseEvent("mouseReleased", x, y, { button, buttons: 0, clickCount: 1 }))
  } else {
    const times = double ? 2 : 1
    for (let i = 1; i <= times; i++) {
      commands.push(mouseEvent("mousePressed", x, y, { button, buttons: flag, clickCount: i }))
      commands.push(mouseEvent("mouseReleased", x, y, { button, buttons: 0, clickCount: i }))
    }
  }
  return commands
}

/** 滚轮序列（§2.2 wheel）：落点处一发 `mouseWheel`（`deltaX` / `deltaY` 至少一非零——校验在工具面）。 */
export function wheelSequence({ x, y, deltaX = 0, deltaY = 0 } = {}) {
  return [mouseEvent("mouseWheel", x, y, { button: "none", buttons: 0, pointerType: "mouse", deltaX, deltaY })]
}

/** 中间步数夹取（§2.2：默认 10 · 2–50）。 */
export function clampSteps(value, fallback = 10) {
  const n = Number(value)
  const base = Number.isFinite(n) ? Math.floor(n) : fallback
  return Math.max(2, Math.min(base, 50))
}

/** 拖拽序列（KD-16 默认形——鼠标序列）：按下 → 移动×steps（末步落于 `to`）→ 抬起（`release:false` ⇒ 只按不放——html5 拦截链用）。 */
export function dragSequence({ from, to, steps = 10, release = true } = {}) {
  const n = clampSteps(steps)
  const commands = [mouseEvent("mouseMoved", from.x, from.y, { button: "none", buttons: 0 })]
  commands.push(mouseEvent("mousePressed", from.x, from.y, { button: "left", buttons: MOUSE_BUTTONS.left, clickCount: 1 }))
  for (let i = 1; i <= n; i++) {
    const x = from.x + (to.x - from.x) * (i / n)
    const y = from.y + (to.y - from.y) * (i / n)
    commands.push(mouseEvent("mouseMoved", x, y, { button: "left", buttons: MOUSE_BUTTONS.left }))
  }
  if (release) commands.push(mouseEvent("mouseReleased", to.x, to.y, { button: "left", buttons: 0, clickCount: 1 }))
  return commands
}

/** 触屏手势面（§2.2 touch gesture——工具面同表校验）。 */
export const TOUCH_GESTURES = ["tap", "doubleTap", "swipe", "pinch"]
/** doubleTap 两次序列之间的间隔（同一双击窗内——双击计数仍由浏览器手势引擎管）。 */
export const TOUCH_TAP_GAP_MS = 60

/** 触屏点形（CDP TouchPoint——坐标取整）。 */
function touchPoint(px, py) {
  return { x: Math.round(px), y: Math.round(py), radiusX: 0.5, radiusY: 0.5, force: 0.5, id: 1 }
}

/** 单次打字序列（tap）：touchStart → touchEnd（同点同 id）——全链 click 实证（KD-14 收正）。 */
function touchTapCommands(x, y) {
  return [
    { method: "Input.dispatchTouchEvent", params: { type: "touchStart", touchPoints: [touchPoint(x, y)] } },
    { method: "Input.dispatchTouchEvent", params: { type: "touchEnd", touchPoints: [touchPoint(x, y)] } },
  ]
}

/**
 * 触屏序列（KD-14 实证收正）：tap / doubleTap 走 `dispatchTouchEvent` 显式序列（全链 mousedown/mouseup/click
 * 实证；synthesizeTapGesture 实测不产 click）；pinch 走 `synthesizePinchGesture`（实测有效）；
 * swipe 走显式路径（手指路径语义——from → to 插值 ×steps）。
 * doubleTap = 同序列×2 + `TOUCH_TAP_GAP_MS` 间隔（时序在动作层控——双击计数由浏览器管）。
 */
export function touchSequence({ gesture = "tap", x, y, from, to, steps = 10, scale } = {}) {
  if (gesture === "tap" || gesture === "doubleTap") return touchTapCommands(x, y)
  if (gesture === "pinch") {
    return [{ method: "Input.synthesizePinchGesture", params: { x, y, scaleFactor: scale } }]
  }
  if (!TOUCH_GESTURES.includes(gesture)) throw new Error(`unknown touch gesture "${gesture}" — gestures: ${TOUCH_GESTURES.join(", ")}`)
  const n = clampSteps(steps)
  const commands = [{ method: "Input.dispatchTouchEvent", params: { type: "touchStart", touchPoints: [touchPoint(from.x, from.y)] } }]
  for (let i = 1; i <= n; i++) {
    const px = from.x + (to.x - from.x) * (i / n)
    const py = from.y + (to.y - from.y) * (i / n)
    commands.push({ method: "Input.dispatchTouchEvent", params: { type: "touchMove", touchPoints: [touchPoint(px, py)] } })
  }
  commands.push({ method: "Input.dispatchTouchEvent", params: { type: "touchEnd", touchPoints: [touchPoint(to.x, to.y)] } })
  return commands
}

/** 目标形解析（§2.2：`e<N>` ∥ `"x,y"`）；不符 ⇒ null（调用面拒——`must be an element ref (e<N>) or "x,y"`）。 */
export function parseTargetSpec(spec) {
  const raw = String(spec ?? "").trim()
  if (/^e\d+$/.test(raw)) return { kind: "ref", ref: raw }
  const m = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/.exec(raw)
  if (m) return { kind: "point", x: Number(m[1]), y: Number(m[2]) }
  return null
}
