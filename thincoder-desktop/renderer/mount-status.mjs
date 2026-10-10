/**
 * mount-status.mjs — 状态行接线出档（`docs/desktop/design/UI.md` §1 状态栏行「两处皆**单点重建**（状态行唯一 writer）」·
 * `docs/desktop/design/PROJECT.md` §4.2 `mount-*.mjs` 族随动（状态行））：自 `renderer/app.mjs` 出档
 * （先例 = 批 8 池面 `mount-pool.mjs` / 批 A 会话族 · 输入区 · 卡族 —— 「接线一族一档，app.mjs 只留派发」）。
 * `attachStatus()` ⇒ `{ paintStatus }`：挂载面**纯读**现态（容器缺位 ⇒ `mountStatus` 早返 null——空转不抛）；
 * 订阅切片键面 = `STATUS_KEYS`（D17 / D22 承载 18 段数据源全集 —— 调用面 `renderer/app.mjs` 订阅处单点派发，
 * 与 `paintPool` / `paintCards` / `paintSessionBar` 同形）。
 * 纪律：零 `node:` / 零裸包（渲染面静态闭包判据）；`document` 只经挂载面（测试走注入 `store` + 假 DOM 槽）。
 */
import { store as defaultStore } from "./store.mjs"
import { mountStatus } from "./views/statusline.mjs"
// 快照族（波 1 产物 —— #606④ 包络：状态行宿主滚位 ∕ 域内焦点复填）
import { captureView, restoreView } from "./view-state.mjs"

export const STATUS_SLOT = '[data-slot="status"]' // 状态栏容器锚（= 窗口级底行 —— 骨架 `renderer/index.html`）
/** 重挂触发切片（段随切片走：活动键 / 位标 / 模式位 / 计数 / 回合 / 读数 / 计时 / 台账 / 句子 / 标题 / 块面 / 词表 / 挂起 ——
 *  D22 承载 18 段数据源全集；段 14 源 = **本会话队** `pending`（「对齐第二批」项 2 —— 右列队列族不再承载）；
 *  段 3 支①源 = `susp`（挂起计数切片 —— 桌面空闲唤醒批）；会话模型轮 R13：活动键单源 = `activeSession`
 *  〔原 `tabs` ∕ `activeTab` 两键随标签裁撤退场——跨会话告警位源改 `sessions` 行投影〕）。 */
export const STATUS_KEYS = [
  "activeSession", "tabBadges", "locale", "usage", "tasks", "turns", "turnStarts",
  "tokens", "timers", "sessions", "pending", "blocks",
  "sessionFlags", // 模式位四布尔切片（banner 四段源 —— D22；写径 = 页读 / 出站回执两处，同归约点）
  "susp", // 挂起计数切片（段 3 支①挂起句源 —— 桌面空闲唤醒批；写径 = 归约面 `ev:susp`）
  "statusText", // 状态文本切片（段 3 支③五 kind 源 —— R4；写径 = 归约面 `ev:statusText`）
  "goal", // 目标面切片（🎯 非段位元素源 —— R5；写径 = 归约面 `ev:goal`）
  "ledgerDetail", // L2 明细行切片（段 11 tooltip 载波 —— R8；写径 = 归约面 `ev:ledger` 的 `detailLines` 键）
  "usageTokens", // 上下文令牌切片（段 9 令牌尾串源 —— 状态行 ⇒ CLI 补漏批；写径 = 归约面 `ev:usage` 的 `ctxTokens` 键）
  "ledgerMarker", // 台账状态位切片（段 11 常驻标记源 —— 状态行 ⇒ CLI 补漏批；写径 = 归约面 `ev:ledger` 的 `marker` 键）
  "settings", // 设置族切片（段 16「团队」源 = `settings.team`（登录态 ∥ `verify` 三值）—— 登录面补全批 2026-10-10；
  // 本键切片细于团队面 ⇒ 其余设置子片写也触发状态行一帧（面内差分门 `sameStatusModel` 等价 ⇒ 零写，零代价）
]

/** 状态行一族装配（装配期一次）：返回挂载面 `paintStatus`（`store` 注入面 = 测试缝）。
 *  **#606④ 包络**：帧前捕快照（滚位 ∕ 域内焦点）⇒ 重建 ⇒ 帧后复填（容器缺位 ⇒ 捕获 `null`，零动作）。 */
export function attachStatus({ store = defaultStore } = {}) {
  const paintStatus = (state = store.get()) => {
    const root = document.querySelector(STATUS_SLOT)
    const snap = captureView(root)
    const model = mountStatus(root, state)
    restoreView(root, snap)
    return model
  }
  return { paintStatus }
}
