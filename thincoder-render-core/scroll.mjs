/**
 * scroll.mjs — 滚动策略族（**核抽核件** · 一处实现四件；单源 = `docs/render-core/design/RENDER-CORE.md`
 * §2 KD-RC-8 ④ ∕ §5「滚动策略族」——2026-09-29 留端清算 ∕ 批 `docs/batches/2026-09-29-desktop-rebuild-fidelity.md`）：
 *   ① **判据**：`NEAR_BOTTOM_PX`（**唯一数值源**）· `nearBottom(el)`（三读数归一 + 严格小于）；
 *   ② **写门**：`applyPin(el, gate)`（旗标门 `!== false` ⇒ 写 `scrollTop = MAX`——超值不读 `scrollHeight`；写口单源）；
 *   ③ **旗标维护**：`createPinWatch(el, opts)`（旗标宿主 = `holder`（缺省 = `el`）——近底无条件翻真（自愈）＋
 *      近底回调；远离底 ⇒ 手势门（`gestureGateMs`）内手势翻假（块 = 600 沿 KD-RC-8 让位三律）∥ `gestureGateMs = 0`
 *      ⇒ 滚动事件按近底直写（活动区 ∕ 池列 ∕ 对话流现行语义——零行为变更）；非手势位移不改旗标）；
 *   ④ **计数簿记**：`createUnreadCounter(el, { countKey })`（`bump` ∕ `clear` ∕ `read`——清账三路：钮点击 ∕
 *      近底（watch 回调）∕ 换代（随元素灭 + 挂载点复位））。
 * 端只留帧调用点 ∕ 计数呈现 ∕ 钮形（逐端置换零行为变更）——载体 = 核 `subblocks/block.mjs`（薄包）·
 * VSC `webview/ui.js`（四函数 · 旗标宿主 `ctx`）· 桌面 `views/activity-new.mjs` ∕ `views/chat-scroll.mjs`。
 * 本档零 `node:` ∕ 零裸包 ∕ 纯 DOM 面（`el` 只取三读数与 `addEventListener` / `removeEventListener` ⇒ 假件可注入）。
 */

/** 近底阈（**唯一数值源**——核 `subblocks/block.mjs` ∕ 桌面 `views/chat-scroll.mjs`（`FOLLOW_PX`）皆再出口保名）。
 *  判据逐字同式 = `scrollHeight − scrollTop − clientHeight < 24`（**严格小于**——恰阈不判近底）。 */
export const NEAR_BOTTOM_PX = 24

/** 三读数归一（缺 ∕ 非数 ⇒ 0——零读数 ⇒ 高度差 0 ⇒ 判近底，不误判停跟）。 */
function metricsOf(source) {
  const metrics = source !== null && typeof source === "object" ? source : {}
  const read = (value) => (Number.isFinite(value) ? value : 0)
  return { scrollTop: read(metrics.scrollTop), scrollHeight: read(metrics.scrollHeight), clientHeight: read(metrics.clientHeight) }
}

/** 近底判据（四载体同式）：三读数归一 + 严格小于。`el` 缺 ∕ 非对象 ⇒ 归一零读数（判近底——不误判停跟）。 */
export function nearBottom(el) {
  const { scrollTop, scrollHeight, clientHeight } = metricsOf(el)
  return scrollHeight - scrollTop - clientHeight < NEAR_BOTTOM_PX
}

/** 旗标门写口（写口单源）：门 `!== false` ⇒ 写 `scrollTop = MAX`（超值不读 `scrollHeight`——引擎自鉗底）；
 *  门假 ∕ 元素缺 ⇒ 零写（不夺阅读位）。回值 = 写入值 ∕ `null`（读数面）。 */
export function applyPin(el, gate) {
  if (el === null || typeof el !== "object" || gate === false) return null
  el.scrollTop = Number.MAX_SAFE_INTEGER
  return Number.MAX_SAFE_INTEGER
}

/** 计数读数归一（缺 ∕ 非整数 ⇒ 0——禁假造）。 */
function countOf(el, countKey) {
  return Number.isInteger(el?.[countKey]) ? el[countKey] : 0
}

/** 未读计数簿记（核四件之四）：计数宿元素（`el[countKey]`——无模块级态 ⇒ 宿主重挂零串账）。
 *  `bump()`（+1）· `clear()`（归零）· `read()`（读数归一）；缺件 ⇒ 读写零动作不抛。
 *  钮形 ∕ 计数呈现 = 端（清账三路 = 上档注）。 */
export function createUnreadCounter(el, { countKey } = {}) {
  const present = el !== null && el !== undefined
  return {
    read: () => countOf(el, countKey),
    bump: () => {
      if (!present) return 0
      const next = countOf(el, countKey) + 1
      el[countKey] = next
      return next
    },
    clear: () => {
      if (!present) return 0
      el[countKey] = 0
      return 0
    },
  }
}

/** 旗标维护（核四件之三 · **单源**——旗标宿主 `holder[flagKey]`；VSC 面 = `ctx`）。更新点语义：
 *   ① 近底 ⇒ **无条件翻真**（自愈——复位 ∕ 程序写 ∕ 布局回波同收）＋ `onNearBottom()`（近底清账路）；
 *   ② 远离底 ∧ `gestureGateMs > 0` ⇒ **手势门内**（`wheel` ∕ `touchmove` ∕ `pointerdown` 起算）翻假
 *      ＋ `onGesture()`（让位回调——块用 = 出口钮同步）；
 *   ③ 远离底 ∧ `gestureGateMs = 0` ⇒ 滚动事件按近底**直写**（活动区 ∕ 池列 ∕ 对话流现行语义）；
 *   ④ 非手势位移（门外）**不改旗标**（复位回波 ∕ 程序写 ∕ 布局）。
 *  事件集：门控模式 = `wheel` ∕ `touchmove` ∕ `pointerdown`（手势标记）+ `scroll`（更新点——VSC 既证「唯一
 *  滚动已生效后触发者」）；直写模式 = `wheel` ∕ `touchmove` ∕ `scroll`（三事件同径——VSC `ui.js` 现行集）。
 *  全 `{ passive: true }`。回 handle：`read()` ∕ `set(value)`（旗标读写——显式动作经此）· `attach()` ∕
 *  `detach()`（幂等；`el` 缺 ∕ 无 `addEventListener` ⇒ `attach` 零动作 `false`——夹具缺区零抛错；`holder` 缺 ⇒
 *  读写零动作不抛）。 */
export function createPinWatch(el, { holder = el, flagKey, gestureGateMs = 0, onNearBottom, onGesture } = {}) {
  const gate = Number.isFinite(gestureGateMs) ? gestureGateMs : 0
  let gestureAt = 0
  let wired = false
  const notify = (callback) => { if (typeof callback === "function") callback() }
  const read = () => holder?.[flagKey]
  const set = (value) => { if (holder !== null && holder !== undefined) holder[flagKey] = value; return value }

  /** 一步判定：近底 ⇒ 翻真 + 近底回调；门控离底 ⇒ 门内翻假 + 让位回调；直写离底 ⇒ 翻假（门外非手势 ⇒ 不改）。 */
  const decide = () => {
    if (nearBottom(el)) {
      set(true)
      notify(onNearBottom)
      return true
    }
    if (gate > 0) {
      if (Date.now() - gestureAt < gate) {
        set(false)
        notify(onGesture)
        return true
      }
      return false // 非手势位移不改旗标
    }
    set(false)
    return true
  }

  const markGesture = () => { gestureAt = Date.now() }
  const listeners = gate > 0
    ? [["wheel", markGesture], ["touchmove", markGesture], ["pointerdown", markGesture], ["scroll", decide]]
    : [["wheel", decide], ["touchmove", decide], ["scroll", decide]]

  return {
    read,
    set,
    attach() {
      if (wired || el === null || el === undefined || typeof el.addEventListener !== "function") return false
      for (const [type, fn] of listeners) el.addEventListener(type, fn, { passive: true })
      wired = true
      return true
    },
    detach() {
      if (!wired || typeof el?.removeEventListener !== "function") return false
      for (const [type, fn] of listeners) el.removeEventListener(type, fn, { passive: true })
      wired = false
      return true
    },
  }
}
