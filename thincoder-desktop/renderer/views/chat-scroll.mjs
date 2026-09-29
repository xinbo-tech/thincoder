/**
 * chat-scroll.mjs — 对话流滚动面（`docs/desktop/design/RENDERER.md` §1.1 第二形 / §3 · `docs/desktop/design/UI.md` §2）：
 * 常量单源 + 四条纯判据 + `attachScroll` 接线面。滚动容器 = `[data-slot="flow"]` 宿主自身（KD-1：零额外层级）。
 *   ① 常量单源（`FOLLOW_PX` / `BACKFILL_PX` / `SMOOTH_MS` / `MAX_RENDER_BLOCKS`）——别处只引用不复写；
 *   ② `scrollAction(metrics, guards)`：序 backfill → follow → unfollow（触顶回填优先于贴底判）；
 *   ③ `compensateTop`（帧尾视口补偿算式）/ `nextWindow`（限增宽窗 = 现限 + 本页**实并入块数**）/ `smoothWindowOpen`（平滑窗判据）；
 *   ④ `tailAction`（帧尾三写判据）+ `stickToBottom`（贴底出口：**写超值不读 `scrollHeight`**，幂等）+ `plannedMoves`
 *      （帧尾**读数裁剪**预判 —— 头动作数先于读数确定）；
 *   ⑤ `attachScroll(root, deps)`：`scroll` 订阅（`passive`）⇒ 三读数 ⇒ `scrollAction` ⇒ 对应出口。
 * 程序化滚动（药丸回底）经返回 handle 出 —— 不占 `deps` 键；`SMOOTH_MS` 窗内不派发 = 抑制程序化回波
 * （自写非用户滚动）；窗只由 handle 记（帧尾贴底 / 补偿不记 —— KD-9）。
 * 本档零 `node:` / 零裸包；纯函数零 DOM 依赖（`root` 只取三读数 + `addEventListener` / `scrollTo`）⇒ 假 root 可注入。
 */

export const FOLLOW_PX = 24
/* 回填触发阈 —— VSC `webview/history.js:82`（`scrollTop > 40` 即不取 ⇒ 触顶 ≤ 40px 取页）逐值。 */
export const BACKFILL_PX = 40
export const SMOOTH_MS = 420
export const MAX_RENDER_BLOCKS = 200

/** 三读数归一（缺 / 非数 ⇒ 0）：零读数 ⇒ 高度差 0 ⇒ 判 follow（不误判停跟）。 */
function metricsOf(source) {
  const metrics = source !== null && typeof source === "object" ? source : {}
  const read = (value) => (Number.isFinite(value) ? value : 0)
  return { scrollTop: read(metrics.scrollTop), scrollHeight: read(metrics.scrollHeight), clientHeight: read(metrics.clientHeight) }
}

/** 滚动出口判据（三出口互斥）：触顶 ≤ `BACKFILL_PX`（边界命中）∧ 有更早 ∧ 非回填中 ⇒ `backfill`；
 *  距底 `< FOLLOW_PX` ⇒ `follow`（VSC `ui.js:215` 严格小于 —— 恰 24px 不判近底）；其余 ⇒ `unfollow`。
 *  `guards` = 只读取数口（缺 ⇒ 恒假 —— 不造事实）。 */
export function scrollAction(metrics, guards = {}) {
  const { scrollTop, scrollHeight, clientHeight } = metricsOf(metrics)
  if (scrollTop <= BACKFILL_PX && guards?.hasOlder === true && guards?.inFlight !== true) return "backfill"
  if (scrollHeight - scrollTop - clientHeight < FOLLOW_PX) return "follow"
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

/** 贴底超值（帧尾跟滚写 —— **写超值不读 `scrollHeight`**：引擎自鉗底；单源 = 核档 §2 KD-RC-9 ② 读数裁剪条）。 */
export const STICK_TOP = Number.MAX_SAFE_INTEGER

/** 贴底出口（帧尾跟滚写 · 幂等 · **零读**）：写 `scrollTop = STICK_TOP`（引擎鉗底 —— 不读 `scrollHeight`）；
 *  返回写入值（读数面）。 */
export function stickToBottom(root) {
  if (!root) return null
  root.scrollTop = STICK_TOP
  return STICK_TOP
}

/** 头动作预判（帧尾**读数裁剪**判据 —— 动作数先于读数确定）：`evict` ∕ `prepend` 各受在位块数 ∕ 目标块数夹取；
 *  `renderer/views/chat.mjs` `headMoves` 按同式取数（两处同源 ⇒ 预判 = 实动数）。 */
export function plannedMoves({ evict = 0, prepend = 0 } = {}, mountedCount = 0, blockCount = 0) {
  return Math.max(0, Math.min(evict, mountedCount)) + Math.max(0, Math.min(prepend, blockCount))
}

/**
 * 滚动接线（唯一 `scroll` 订阅点）：`passive` 监听 ⇒ 三读数 ⇒ `scrollAction` ⇒ 出口。
 * `deps` 四键收窄：`onBackfill?`（缺 ⇒ 该档不接 —— 诚实非死控）/ `onFollow` / `onUnfollow` / `guards?`（只读取数口，
 * 缺 ⇒ 恒假）。程序化回底经返回 handle 出（`returnToBottom` 记窗，`lastAt` / `readMetrics` = 读数面）；根缺 ⇒ `null`。
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
    const action = scrollAction(metricsOf(root), guards())
    const outlet = action === "backfill" ? deps.onBackfill : action === "follow" ? deps.onFollow : deps.onUnfollow
    if (typeof outlet === "function") outlet()
  }, { passive: true })
  return handle
}
