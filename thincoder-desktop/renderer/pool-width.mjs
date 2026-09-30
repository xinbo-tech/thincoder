/**
 * pool-width.mjs — 右栏宽度拖动（D30 · 2026-09-30 · 台账 #742）：**chrome 级直写面**（不落 store 切片 ∥ 不进帧分派面表 ∥ 零 IPC；
 * 单源 = `docs/desktop/design/RENDERER.md` §1.3 ∥ `docs/desktop/design/UI.md` §1 本批注 ∥ `docs/desktop/design/PROJECT.md` §2 KD-58）。
 * 单一权威链（用户值）：未拖过（无存储值）⇒ **零内联写**（`--pool-w` 恒等默认值——声明单源 = `theme.css`，任何池 ∥ 会话状态变化都不写宽度）；拖过（存储值在）⇒
 * 一切时刻（启动 ∥ 窗 resize ∥ 池空 ∕ 有池 ∥ 会话切换）以用户值为唯一决策者。
 * 交互三段（pointer 事件族）：按下（记起始宽 + 起始 x · `setPointerCapture` · `preventDefault` · `body.pool-resizing`）⇒
 * 拖动预览（相对算式 `next = 起始宽 + (起始x − 当前x)` ⇒ CSSOM 变量写（`documentElement.style.setProperty("--pool-w", …)`——唯一写径；
 * rAF 合帧 = 每帧至多一写））⇒ 松手落定（**落定前置（刷一拍）**：rAF 待写在场 ⇒ 撤帧 + 同步落待值（末次 move 位——不丢末位）⇒ 读回实宽
 * （取整——所见即所存）⇒ 归一写回 + 落存储 + 撤类——落定后零迟到写）；`pointerup` ∥ `pointercancel` 同径；表外键 ∥ 双击 ∥ 键盘 ⇒ 零动作。
 * 界 = CSS 单落点（`chrome.css` 栅格行 `clamp` 消费 `--pool-w` —— 模块侧零界常量；窗 resize 零 JS ∥ 存储值零改）。
 * 持久化 = 渲染面 `localStorage`（键 `thincoder.desktop.poolWidth` · 整数 px）——读 ∥ 写皆捕获 + `console.error`（零静默）；
 * 读失败 ∥ 值非法（非正有限数）⇒ 视同未拖过（降级默认）；写失败 ⇒ 本次会话内照常生效（fail-soft）。
 * 注入缝 `{ doc, win, storage, root }`（缺省 = `document` / `window` / `localStorage` ∕ 锚查询）⇒ 平 node 直测。
 * 零 `store` ∥ 零 `events` 依赖（宽度零自动源——仲裁负控腿）；零 `node:` / 零裸包（渲染面静态闭包判据）。
 */
import { t } from "./i18n.mjs"

const KEY = "thincoder.desktop.poolWidth" // 存储键（KD-58 ④ · 整数 px 串）
const ANCHOR = "[data-pool-resizer]" // 拖柄锚（骨架单源 = `renderer/index.html`）
const ACTIVE_CLASS = "pool-resizing" // 拖动期 body 类（`chrome.css`：全局 col-resize + 禁选）

/** 值解析（纯函数 —— 单一权威判句的入口闸）：串且正有限数 ⇒ 数值；其余（缺 ∥ 非串 ∥ 非正 ∥ 非有限）⇒ `null`（视同未拖过）。 */
function parseWidth(raw) {
  if (typeof raw !== "string") return null
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : null
}

/** 读存储（捕获 + 零静默）：缺 storage ∥ 读抛 ⇒ `null`（视同未拖过）。 */
function readStored(storage) {
  if (!storage || typeof storage.getItem !== "function") return null
  try {
    return parseWidth(storage.getItem(KEY))
  } catch (error) {
    console.error("[pool-width] poolWidth read failed:", error)
    return null
  }
}

/** 写存储（捕获 + 零静默 —— fail-soft：写失败仅记错，本次会话内照常生效）。 */
function writeStored(storage, value) {
  if (!storage || typeof storage.setItem !== "function") return
  try {
    storage.setItem(KEY, String(value))
  } catch (error) {
    console.error("[pool-width] poolWidth write failed:", error)
  }
}

/** 装配入口（`renderer/app.mjs` 装配期一次）：读存储 ⇒ 内联 `--pool-w`（**拖过才写**；未拖过 ⇒ 零内联写）⇒ 拖柄接线。
 *  读回时机 = 装配期（先于首绘可及面 —— 引导层在场期完成 ⇒ 零可见跳变）；骨架缺位 ⇒ 空转（存储面零动）。 */
export function initPoolWidth({ doc = document, win = window, storage = win?.localStorage ?? null, root = doc?.querySelector?.(ANCHOR) } = {}) {
  const docEl = doc.documentElement
  const apply = (value) => docEl.style.setProperty("--pool-w", `${value}px`) // 写径 = CSSOM（唯一写径；`style` 属性写径列禁径）
  const stored = readStored(storage)
  if (stored !== null) apply(stored)
  if (!root || typeof root.addEventListener !== "function") return
  const box = root.parentElement ?? root
  let dragging = false
  let startX = 0
  let startWidth = 0
  let pending = null
  let rafId = null

  /** 帧刷（rAF 合帧体）：写待值（中间移动已被合并丢弃）；无待值 ⇒ 零写。 */
  function flush() {
    rafId = null
    if (pending === null) return
    apply(pending)
    pending = null
  }

  /** 松手 / `pointercancel` 同径落定：**落定前置（刷一拍）** ⇒ 读回实宽（取整）⇒ 归一写回 + 落存储 + 撤类。 */
  function settle() {
    if (!dragging) return
    dragging = false
    if (rafId !== null) {
      win.cancelAnimationFrame(rafId) // 落定前置：rAF 待写在场 ⇒ 撤帧
      rafId = null
      if (pending !== null) {
        apply(pending) // 同步落待值（末次 move 位——不丢末位；判据真源 = 读回强制布局前的最后写入）
        pending = null
      }
    }
    const width = Math.round(box.getBoundingClientRect().width) // 读回实宽（取整 —— 所见即所存）
    apply(width) // 归一写回
    writeStored(storage, width) // 落存储（写时机 = 仅落定一刻）
    doc.body?.classList?.remove(ACTIVE_CLASS) // 撤类（落定后零迟到写）
  }

  /** 按下：记起点（起始宽 = 读回 ∥ 起始 x）· 指针捕获 · 防默认 · 拖动期类。 */
  function onPointerDown(event) {
    dragging = true
    startX = event.clientX
    startWidth = box.getBoundingClientRect().width
    try {
      root.setPointerCapture?.(event.pointerId)
    } catch (error) {
      console.error("[pool-width] pointer capture failed:", error)
    }
    event.preventDefault()
    doc.body?.classList?.add(ACTIVE_CLASS)
  }

  /** 拖动预览：相对算式（px 取整）⇒ 待写；rAF 合帧（每帧至多一写 —— 中间移动丢弃）。 */
  function onPointerMove(event) {
    if (!dragging) return
    pending = Math.round(startWidth + (startX - event.clientX))
    if (rafId === null) rafId = win.requestAnimationFrame(flush)
  }

  root.addEventListener("pointerdown", onPointerDown)
  root.addEventListener("pointermove", onPointerMove)
  root.addEventListener("pointerup", settle)
  root.addEventListener("pointercancel", settle)
}

/** 拖柄可及名注入（`t("pool.resize")` ⇒ `aria-label` —— 静态骨架零面向用户字符串）：
 *  调用两处 = boot 词表置位点（`renderer/app.mjs` —— 含 en 首启等值零通知窗）∥ 帧分派 `locale` 支（语言切换随动）。 */
export function refreshResizerLabel({ doc = document, root = doc?.querySelector?.(ANCHOR) } = {}) {
  if (!root || typeof root.setAttribute !== "function") return
  root.setAttribute("aria-label", t("pool.resize"))
}
