/**
 * activity-new.mjs — 池面**出生计数贴**（R10 E6 ∕ U-2 补装；VSC `thincoder-vscode/webview/activity-new.js:21-54`
 * 照搬 —— 同名函数 ∕ 同清账三路；样式值源 = VSC `webview/base.css:113-117`，落 `renderer/pool.css`）：
 *   ① 出生点判据二向（VSC `activity.js:60-63` 两径内聚 —— 调用点 = 池面块出生 `renderer/views/activity.mjs`
 *      `createSubBlock`）：跟底 ⇒ 区钉底照旧（写 `scrollTop`）；**未跟底 ⇒ 不改位**（不夺用户阅读位）
 *      + 本档计数 +1 —— 钮在场 ⟺ `未跟底 ∧ 新生 > 0`；**帧尾径**（#518 补齐 · VSC `streaming.js:32`
 *      `frameEnd` 对位）：`maybePinPool(root)` —— `mountPool` 尾调用；出生径复用同一写；
 *   ② 钮（`.activity-new-btn` —— 类名与词键逐字同 VSC）：字面 = `t("sub.newBlocks", { n })`
 *      （`↓ ${n} …`，两语值逐字同 VSC `locales/{en,zh}.json:170`）；**桌面 chassis 适配**：钮居池头带
 *      `[data-pool-head]` 首子（VSC 单元素 `position: sticky` 的等效形 —— 粘性由池头带承载，见 `pool.css`
 *      该条注；池头带 = 池区唯一粘性带 ⇒ 钮恒在区首可见位）；
 *   ③ 清账三路（VSC 同）：钮点击（回底 + 重 pin + 清账）· 近底判定成立（watch 回调 —— 判据源 = 核工厂）·
 *      池面换代 ∕ 复位（会话切换 ∕ 空态退场 —— VSC `resetActivity` 同点）；
 *   ④ 策略族四件（判据 ∕ 写门 ∕ 旗标维护 ∕ 计数簿记）= **核抽核件 `/rc/scroll.mjs` 工厂消费**（2026-09-29
 *      留端清算 ∕ 批 `docs/batches/2026-09-29-desktop-rebuild-fidelity.md` §2.5）：写口 = `applyPin`；旗标
 *      维护 = `createPinWatch`（**旗标宿主 = 池宿主 `root`** · `gestureGateMs = 0` ⇒ 滚动事件按近底直写——
 *      现行语义零行为变更 · `_poolPin` 键面保持）；计数簿记 = `createUnreadCounter`（`_poolNew`）；`N = 0`
 *      ⇒ 钮不存在（空区零高 —— VSC D-W1 不回归）。
 * 记账随池宿主（`_poolNew` ∕ `_poolPin` ∕ `_poolNewWired` —— 沿 `mountPool` `_poolSub` 先例：无模块级态 ⇒
 * 池热重挂零串账；帧面重挂（`mountPool` `clear` + 重建）后由 `syncActivityNew` 复原，幂等）。
 * 依赖单向：本档 → `renderer/i18n.mjs`（词）+ 核工厂（`/rc/scroll.mjs`）；零 `node:` / 零裸包。
 */
import { el } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { applyPin, createPinWatch, createUnreadCounter } from "/rc/scroll.mjs"

const NEW_BTN = ".activity-new-btn"
const PIN_FLAG = "_poolPin" // 旗标键面（跨档共读 —— 保持）
const NEW_COUNT = "_poolNew" // 计数键面（随池宿主 —— 保持）

/** 计数簿记取件（核工厂 —— 宿元素 `_poolNew`，无模块级态）。 */
const counterOf = (root) => createUnreadCounter(root, { countKey: NEW_COUNT })

/** 池区钉底（帧尾径 —— #518 补齐；VSC `streaming.js:32` `frameEnd` 对位）：跟底（`_poolPin !== false`
 *  ——缺省 = 跟底）⇒ 核写口 `applyPin` 写 `scrollTop` 超值（不读 `scrollHeight`）；未跟底（用户上滚）
 *  ⇒ **零写**——不夺阅读位。出生径（`notePoolBirth`）复用本写。 */
export function maybePinPool(root) {
  if (!root) return
  applyPin(root, root[PIN_FLAG])
}

/** 出生点**判据总口**（VSC `activity.js:60-63` 两径）：跟底 ⇒ 写 `scrollTop`（区钉底）；未跟底 ⇒ 计数 +1。
 *  回值 = 本次是否计入新生（诊断面）。 */
export function notePoolBirth(root) {
  if (!root) return false
  if (root[PIN_FLAG] === false) {
    noteActivityBirth(root)
    return true
  }
  maybePinPool(root)
  return false
}

/** 出生计数 +1 + 建 / 更钮（VSC `noteActivityBirth` 逐件）。 */
export function noteActivityBirth(root) {
  if (!root) return
  counterOf(root).bump()
  syncActivityNew(root)
}

/** 计数读数（诊断面 —— VSC `activityNewCount` 同件）。 */
export function activityNewCount(root) {
  return counterOf(root).read()
}

/** 清账（`N → 0` + 摘钮 —— VSC `clearActivityNew` 逐件；幂等）。 */
export function clearActivityNew(root) {
  if (!root) return
  counterOf(root).clear()
  root.querySelector(NEW_BTN)?.remove()
}

/** 钮同步（幂等 —— 出生点与**帧面重挂后补装**同用）：`N > 0` ⇒ 建 / 更（池头带首子 —— 区首；头带缺位 ⇒
 *  零动作，下帧再补）；`N = 0` ⇒ 摘。 */
export function syncActivityNew(root) {
  if (!root || typeof root.querySelector !== "function") return
  const count = counterOf(root).read()
  const btn = root.querySelector(NEW_BTN)
  if (count <= 0) {
    if (btn) btn.remove()
    return
  }
  const label = t("sub.newBlocks", { n: count })
  if (btn) {
    if (btn.textContent !== label) btn.textContent = label
    return
  }
  const head = root.querySelector("[data-pool-head]")
  if (!head || typeof head.insertBefore !== "function") return
  head.insertBefore(el("button", { type: "button", class: "activity-new-btn" }, [label]), head.firstChild)
}

/** 监听一次性接线（VSC `wire()` 同件 —— 幂等，回值 = 本次是否完成注册）：① 点击 ⇒ 回底（核写口 `applyPin`）
 *  + 重 pin + 清账；② 旗标维护 = 核工厂 `createPinWatch`（直写模式——近底 ⇒ 翻真 + 清账回调；远离底 ⇒ 翻假；
 *  只读本档维护的旗标，不另算几何）。 */
export function attachActivityNew(root) {
  if (!root || typeof root.addEventListener !== "function" || root._poolNewWired === true) return false
  root._poolNewWired = true
  const watch = createPinWatch(root, {
    flagKey: PIN_FLAG,
    gestureGateMs: 0,
    onNearBottom: () => clearActivityNew(root),
  })
  watch.attach()
  root.addEventListener("click", (event) => {
    if (event?.target?.closest?.(NEW_BTN) == null) return
    applyPin(root, true)
    watch.set(true)
    clearActivityNew(root)
  })
  return true
}
