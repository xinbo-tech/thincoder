/**
 * mount-status.mjs — 状态行接线出档（`docs/desktop/design/UI.md` §1 状态栏行「两处皆**单点重建**（状态行唯一 writer）」·
 * `docs/desktop/design/PROJECT.md` §4.2 `mount-*.mjs` 族随动（状态行））：自 `renderer/app.mjs` 出档
 * （先例 = 批 8 池面 `mount-pool.mjs` / 批 A 会话族 · 输入区 · 卡族 —— 「接线一族一档，app.mjs 只留派发」）。
 * `attachStatus()` ⇒ `{ paintStatus }`：挂载面**纯读**现态（容器缺位 ⇒ `mountStatus` 早返 null——空转不抛）；
 * 订阅切片键面 = `STATUS_KEYS`（D17 / D22 承载 16 段数据源全集 —— 调用面 `renderer/app.mjs` 订阅处单点派发，
 * 与 `paintPool` / `paintCards` / `paintShell` 同形）。
 * 纪律：零 `node:` / 零裸包（渲染面静态闭包判据）；`document` 只经挂载面（测试走注入 `store` + 假 DOM 槽）。
 */
import { store as defaultStore } from "./store.mjs"
import { mountStatus } from "./views/statusline.mjs"

export const STATUS_SLOT = '[data-slot="status"]' // 状态栏容器锚（= 窗口级底行 —— 骨架 `renderer/index.html`）
/** 重挂触发切片（段随切片走：位标 / 模式位 / 计数 / 回合 / 读数 / 计时 / 台账 / 输入提示 / 标题 / 块面 / 词表 ——
 *  D22 承载 16 段数据源全集）。 */
export const STATUS_KEYS = [
  "tabs", "activeTab", "tabBadges", "locale", "usage", "tasks", "turns", "turnStarts",
  "tokens", "timers", "projectInfo", "sessions", "pool", "blocks",
  "sessionFlags", // 模式位四布尔切片（banner 四段源 —— D22；写径 = 页读 / 出站回执两处，同归约点）
]

/** 状态行一族装配（装配期一次）：返回挂载面 `paintStatus`（`store` 注入面 = 测试缝）。 */
export function attachStatus({ store = defaultStore } = {}) {
  const paintStatus = (state = store.get()) => mountStatus(document.querySelector(STATUS_SLOT), state)
  return { paintStatus }
}
