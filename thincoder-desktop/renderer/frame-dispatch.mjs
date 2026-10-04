/**
 * frame-dispatch.mjs — **帧分派**（更新纪律收核批 · `docs/batches/2026-09-29-render-perf.md` §2 · 台账 #609；
 * 机制 ∕ 判据单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-9 ∥ `docs/desktop/design/RENDERER.md` §1.2）：
 * 脏键集 → **五面**映射（会话控制条 ∕ 状态行 ∕ 对话流 ∕ 池区 ∕ 卡面——**每面每帧至多一次**；未知键零面）。
 * 面回调注入（`faces = { 面名: paint(state, dirtyKeys) }`）⇒ 纯件平 node 直测（装配单点 = `renderer/app.mjs`；
 * 「分派体出档」——本档零 DOM ∕ 零 store 引用）。
 * 面键集**单源** = 各面自持处（本档只聚合）：`SESSION_KEYS` ∕ `CHAT_KEYS` 两表自 `renderer/app.mjs`
 * 迁入（键面 = 分派语义）；`STATUS_KEYS` ∕ `POOL_KEYS` ∕ `CARDS_KEYS` 自各挂载档导入（原单源不动）。
 * 纪律：零 `node:` / 零裸包（渲染面静态闭包判据）。
 */
import { CARDS_KEYS } from "./mount-cards.mjs"
import { POOL_KEYS } from "./mount-pool.mjs"
import { STATUS_KEYS } from "./mount-status.mjs"

// 会话控制条重挂触发切片（`locale` 在内：文案随词表 ⇒ 树须重绘；`ledger` = 账本警示切片 —— 下拉首行注记；
// `project` = 项目钮读数；`sessions` ∕ `activeSession` ∕ `tabBadges` = 下拉列表 ∕ 活动态 ∕ 位标）——自 `app.mjs` 迁入。
export const SESSION_KEYS = ["project", "sessions", "activeSession", "tabBadges", "locale", "ledger"]
/** 对话流帧触发切片（`locale` 在内：文案随词表 · `pool`：审批卡宿对话流 · `project`：引导码随 cwd——批 B 追加轮 ·
 *  `pending`：输入区上方待发送带——「对齐第二批」项 2 · `digest`：流内消化行组——桌面空闲唤醒批 · `compress`：流内压缩
 *  状态行——R4 · `timerNotice`：流内到期触发行组——timer-wake 阶段 2 · `stopMark` / `helpLines`：两尾组
 *  （停止痕 ∥ `/help` 行族）的单变触发——「对齐第三批」项 6 ∥ `/help` 增量；**`segView`：巨块段窗滚动拍（E4-JS 支 —— 哨兵键，非切片：无对应 store 切片，
 *  仅作对话流面帧触发**）；`settings` 不入表 —— 欢迎条文案二值随重挂径，且帧尾态刷判据 = 码面（见 `views/chat-guide.mjs`））
 *  ——自 `app.mjs` 迁入。 */
export const CHAT_KEYS = ["activeSession", "blocks", "history", "following", "pendingNew", "locale", "pool", "project", "pending", "digest", "compress", "timerNotice", "stopMark", "helpLines", "segView"]

/** 五面表（**面序 = 派发序** —— 会话控制条 → 状态行 → 对话流 → 池区 → 卡面；键集 = 各行自持处单源）。 */
export const FRAME_FACES = Object.freeze([
  ["sessionBar", SESSION_KEYS],
  ["status", STATUS_KEYS],
  ["chat", CHAT_KEYS],
  ["pool", POOL_KEYS],
  ["cards", CARDS_KEYS],
])

/** 单面命中判据（脏集 ∩ 面键集 非空；任一侧形不合 ⇒ 恒假 —— 禁假造）。 */
export function faceHit(dirtyKeys, keys) {
  if (!Array.isArray(dirtyKeys) || !Array.isArray(keys)) return false
  for (const key of dirtyKeys) if (keys.includes(key)) return true
  return false
}

/** 帧分派（纯件）：`faces` = 面名 → 回调（注入面 —— 回调缺 ⇒ 该面零动作）；命中面**每帧至多调一次**（面序 = 表序）。
 *  返回本次实际绘制面名表（读数 ∕ 机检面；未知键 ⇒ 空表 —— 零面）。 */
export function dispatchFrame({ dirtyKeys, state, faces } = {}) {
  const painted = []
  for (const [name, keys] of FRAME_FACES) {
    const paint = faces?.[name]
    if (typeof paint !== "function" || !faceHit(dirtyKeys, keys)) continue
    paint(state, dirtyKeys)
    painted.push(name)
  }
  return painted
}
