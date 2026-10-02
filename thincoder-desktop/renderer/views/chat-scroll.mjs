/**
 * chat-scroll.mjs — 对话流滚动面（`docs/desktop/design/RENDERER.md` §1.1 第二形 / §3 · `docs/desktop/design/UI.md` §2）：
 * 常量单源 + 四条纯判据 + `attachScroll` 接线面。滚动容器 = `[data-slot="flow"]` 宿主自身（KD-1：零额外层级）。
 *   ① 常量单源（`FOLLOW_PX`（= 核工厂 `NEAR_BOTTOM_PX` 再出口保名）/ `BACKFILL_PX` / `SMOOTH_MS` /
 *      `MAX_RENDER_BLOCKS`）——别处只引用不复写；近底判据 ∕ 写门 = **核抽核件 `/rc/scroll.mjs` 工厂消费**
 *      （2026-09-29 留端清算 ∕ 批 `docs/batches/2026-09-29-desktop-rebuild-fidelity.md` §2.5——`nearBottom` ∕ `applyPin`）；
 *   ② `scrollAction(metrics, guards)`：序 backfill → follow → unfollow（触顶回填优先于贴底判）；
 *   ③ `compensateTop`（帧尾视口补偿算式）/ `nextWindow`（限增宽窗 = 现限 + 本页**实并入块数**）/ `smoothWindowOpen`（平滑窗判据）；
 *   ④ `tailAction`（帧尾三写判据）+ `stickToBottom`（贴底出口：**写超值不读 `scrollHeight`**，幂等）；
 *   ⑤ `attachScroll(root, deps)`：`scroll` 订阅（`passive`）⇒ 平滑窗门 ⇒ `onScrollTick?`（巨块段窗滚动拍）⇒ 三读数 ⇒
 *      `scrollAction` ⇒ 对应出口。
 * 程序化滚动（药丸回底）经返回 handle 出 —— 不占 `deps` 键；`SMOOTH_MS` 窗内不派发 = 抑制程序化回波
 * （自写非用户滚动）；窗只由 handle 记（帧尾贴底 / 补偿不记 —— KD-9）。
 * 本档零 `node:` / 零裸包；取件经 `/rc/`（app 第二根 —— 平 node 面 = rc-resolve 钩子）；纯函数零 DOM 依赖
 * （`root` 只取三读数 + `addEventListener` / `scrollTo`）⇒ 假 root 可注入。
 */
import { applyPin, nearBottom } from "/rc/scroll.mjs"

/** 近底阈再出口保名（**唯一数值源** = 核工厂 `NEAR_BOTTOM_PX`——消费面零改；判据漂移 = 缺陷）。 */
export { NEAR_BOTTOM_PX as FOLLOW_PX } from "/rc/scroll.mjs"

/* 回填触发阈 —— VSC `webview/history.js:82`（`scrollTop > 40` 即不取 ⇒ 触顶 ≤ 40px 取页）逐值。 */
export const BACKFILL_PX = 40
export const SMOOTH_MS = 420
/* 首屏渲染窗 —— 对齐 VSC `MAX_MESSAGE_BLOCKS`（`webview/ui.js:204` = 150）逐值（2026-09-29 · 批
   `docs/batches/2026-09-29-hatch-clearance-2.md` · #673 · E10 端差消：VSC 150 = 防卡顿硬约束，
   桌面 200 为初始窗、改值零语义损失；回填链已在 ⇒ 更早块经摘要块按页回填、窗限随并入增）。 */
export const MAX_RENDER_BLOCKS = 150

/** 三读数归一（缺 / 非数 ⇒ 0）：零读数 ⇒ 高度差 0 ⇒ 判 follow（不误判停跟）。 */
function metricsOf(source) {
  const metrics = source !== null && typeof source === "object" ? source : {}
  const read = (value) => (Number.isFinite(value) ? value : 0)
  return { scrollTop: read(metrics.scrollTop), scrollHeight: read(metrics.scrollHeight), clientHeight: read(metrics.clientHeight) }
}

/** 滚动出口判据（三出口互斥）：触顶 ≤ `BACKFILL_PX`（边界命中）∧ 有更早 ∧ 非回填中 ⇒ `backfill`；
 *  近底（判据 = 核工厂 `nearBottom`——三读数归一 + 严格小于：恰阈不判近底）⇒ `follow`；其余 ⇒ `unfollow`。
 *  `guards` = 只读取数口（缺 ⇒ 恒假 —— 不造事实）。 */
export function scrollAction(metrics, guards = {}) {
  const { scrollTop } = metricsOf(metrics)
  if (scrollTop <= BACKFILL_PX && guards?.hasOlder === true && guards?.inFlight !== true) return "backfill"
  if (nearBottom(metrics)) return "follow"
  return "unfollow"
}

/** 帧尾视口补偿算式：读区起点保持（`prevTop` + 高度增量）——摘 / 插头部件后原地看住的锚点不动。 */
export function compensateTop({ prevTop = 0, prevHeight = 0, nextHeight = 0 } = {}) {
  return prevTop + (nextHeight - prevHeight)
}

/** 限增宽窗：在飞落非在飞（原批次结束）⇒ 现限 + `added`（本页归约后**实并入块数** —— 条 ≠ 块 ⇒ 禁页量换算）；
 *  其余 ⇒ 现限不变。`added` = 并入行数（非正 / 非数 ⇒ 零增 —— 整置清窗不计增 ⇒ 窗限只增）。 */
export function nextWindow({ limit = MAX_RENDER_BLOCKS, inFlight = false } = {}, nextInFlight, added = 0) {
  if (inFlight !== true || nextInFlight === true) return limit
  return limit + (Number.isFinite(added) && added > 0 ? Math.floor(added) : 0)
}

/** 平滑窗判据：`lastAt` 后 `SMOOTH_MS` 内为窗（窗内 ⇒ 不派发）；时刻 `now` 由调用方给（纯函数，可假钟）。 */
export function smoothWindowOpen(now, lastAt) {
  return now - lastAt >= SMOOTH_MS
}

/** 帧尾三写判据：跟滚 ⇒ `stick`；非跟滚 ∧ 头动作（摘 + 前插）> 0 ⇒ `compensate`；其余 ⇒ `none`（零写）。 */
export function tailAction({ following = false, headMoves = 0 } = {}) {
  if (following === true) return "stick"
  return headMoves > 0 ? "compensate" : "none"
}

/** 贴底超值（帧尾跟滚写 —— **写超值不读 `scrollHeight`**：引擎自鉗底；写口 = 核工厂 `applyPin`）。 */
export const STICK_TOP = Number.MAX_SAFE_INTEGER

/** 贴底出口（帧尾跟滚写 · 幂等 · **零读**）：经核工厂写口 `applyPin` 写 `scrollTop = STICK_TOP`（引擎鉗底 ——
 *  不读 `scrollHeight`）；返回写入值（读数面）。 */
export function stickToBottom(root) {
  if (!root) return null
  applyPin(root, true)
  return STICK_TOP
}

/**
 * 滚动接线（唯一 `scroll` 订阅点）：`passive` 监听 ⇒ 三读数 ⇒ `scrollAction` ⇒ 出口。
 * `deps` 五键收窄：`onBackfill?`（缺 ⇒ 该档不接 —— 诚实非死控）/ `onFollow` / `onUnfollow` / `guards?`（只读取数口，
 * 缺 ⇒ 恒假）/ **`onScrollTick?`**（平滑窗门后每 scroll 事件回调 —— 巨块段窗 `segView` 拍；E4-JS 支）。
 * 程序化回底经返回 handle 出（`returnToBottom` 记窗，`lastAt` / `readMetrics` = 读数面）；根缺 ⇒ `null`。
 */
export function attachScroll(root, deps = {}) {
  if (!root || typeof root.addEventListener !== "function") return null
  const handle = {
    lastAt: 0,
    readMetrics: () => metricsOf(root),
    returnToBottom() {
      handle.lastAt = Date.now()
      if (typeof root.scrollTo === "function") root.scrollTo({ top: metricsOf(root).scrollHeight, behavior: "smooth" })
      else stickToBottom(root)
      return handle.lastAt
    },
  }
  const guards = () => (typeof deps.guards === "function" ? deps.guards() : {})
  root.addEventListener("scroll", () => {
    if (!smoothWindowOpen(Date.now(), handle.lastAt)) return
    if (typeof deps.onScrollTick === "function") deps.onScrollTick() // 滚动拍（巨块段窗信号 —— 帧合并节流）
    const action = scrollAction(metricsOf(root), guards())
    const outlet = action === "backfill" ? deps.onBackfill : action === "follow" ? deps.onFollow : deps.onUnfollow
    if (typeof outlet === "function") outlet()
  }, { passive: true })
  return handle
}
