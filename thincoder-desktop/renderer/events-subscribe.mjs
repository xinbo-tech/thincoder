/**
 * events-subscribe.mjs — 渲染面事件订阅接线（二十四通道表 · `attachEvents` · 回合尾标题刷新 + `onTurnTail` ∕ `onConfig` ∕ `onMenu` 三窄口）：
 * 自 `renderer/events.mjs` 拆出（300 行拆分层落形 —— 批档 §5 登记）；归约纯函数与值面写者仍在核心档
 * （`reduce` / `openSession` / `clearApproval`；模式位归约径（`applyFlags` / `sameRecord`）另档 =
 * `renderer/events-flags.mjs` · 页读径另档 = `renderer/page-read.mjs`）——本档单向依赖核心档，无环。
 *
 * 导出面一：`attachEvents({ on, store, invoke, onTurnTail, onConfig, onMenu })`（二十四通道订阅 ⇒ 退订句柄）；回合尾判据 = 核心档导出
 * `isTurnTail` **单源**（三径 —— 批 A 修正轮）；回合尾（判据命中）⇒ 标题刷新 ∧ `onTurnTail(key)` **窄口**
 * （**输入区 flush 携行随「回合中插入」批退场** —— 窄口**存续**：调用面可接（缺 / 非函数 ⇒ 零动作），
 * 队列消费改宿主驱动（步边界注入 ∕ 回合尾续发）；携回合尾事件键 —— 接线面自持纪律）。
 * **R8 增 `ev:config` 窄口**（`onConfig` —— config 写盘感知纯信号：归约面零写者，订阅面直送调用面
 * ⇒ 设置面复读；缺 / 非函数 ⇒ 零动作）。
 * **D36 增 `ev:menu` 窄口**（`onMenu` —— 菜单动作纯信号（主→渲染单向；六动作闭集——#817 收正）：归约面零写者，
 * 订阅面直送调用面 ⇒ `renderer/menu-actions.mjs` 分派；缺 / 非函数 ⇒ 零动作）。
 * 档形 = `attachEvents({ on })` —— `store` 缺省 = 单例（`renderer/store.mjs`）· `invoke` 缺省 = 窄桥
 * `globalThis.thincoder.invoke`；五参注入面 = 测试缝（`test/events-reduce.test.mjs`）。调用面 = `renderer/app.mjs`
 * （退订句柄本批无消费点 —— 页面生命周期 = 进程生命周期；`on` 非函数 ⇒ 记错 + 空句柄）。
 * 纪律：本档零 DOM / 零 `node:` / 零裸包；控制台诊断串非面向用户文案（不经 `t()`）。
 */
import { isTurnTail, reduce } from "./events.mjs"
import { store as defaultStore } from "./store.mjs"

/** 二十四通道（订阅面闭集 —— 单源 = `docs/desktop/design/IPC.md` §1「白名单 = 本表」；除 `ev:config` ∥ `ev:menu`（纯信号·归约面零写者）外皆有归约面写者）。
 *  R3b 增 `ev:subagent`（子 agent 块面）；R3c 增 `ev:reasoning`（推理块增量 —— D19）；「对齐第二批」增 `ev:subchunk`
 *  （子 agent 内容增量 —— 项 3）；**桌面空闲唤醒批增 `ev:susp` ∕ `ev:digest`**（挂起计数面 ∕ 消化轮边界面 —— 宿主自产）；
 *  **「对齐第三批」增 `ev:ledger`**（台账行集 —— 归约面写者 `renderer/events.mjs` `onLedger`）；
 *  **timer-wake 阶段 2 增 `ev:timer`**（到期触发面 —— 归约面写者 `renderer/events.mjs` `onTimer`）；
 *  **「回合中插入」批增 `ev:queue`**（排队面两形 —— 归约面写者 `renderer/events.mjs` `onQueue`）；
 *  **输入面板上提批增 `ev:flags`**（模式位推送 —— 归约面写者 `renderer/events-flags.mjs` `onFlags`；
 *  切 `sessionFlags` 切片 ⇒ 状态行 banner + 输入面板控件行两读面随动）；
 *  **R4（提示锚 + 状态面）增 `ev:statusText` ∕ `ev:compress`**（状态文本五 kind ∕ 压缩状态行四态 —— 归约面写者
 *  `renderer/events-status.mjs` `onStatusText` ∕ `onCompress`；活动恢复即清 = 同档 `expireStatusText`）；
 *  **R5（子代理面）增 `ev:goal`**（目标面切片 —— 宿主桥 goal 工具结果时点采样；归约面写者 `renderer/events.mjs` `onGoal`；
 *  消费 = 目标卡 + 状态行 🎯）；
 *  **R8（台账周期刷新 + L2 明细 + config 热更）增 `ev:config`**（config 写盘感知 —— 宿主 `config-watch` onChange 出站；
 *  **纯信号 ∕ 归约面零写者**（默认支原引用）——消费 = 订阅面窄口 `onConfig` ⇒ 设置面复读）；
 *  **D36（菜单体系批）增 `ev:menu`**（菜单动作 —— 主→渲染单向纯信号（六动作闭集——#817 收正）；**归约面零写者**——消费 =
 *  订阅面窄口 `onMenu` ⇒ `renderer/menu-actions.mjs` 分派）；
 *  序同桥面表 —— `thincoder-desktop/src/preload/preload.cjs` `EVENT_CHANNELS` —— 13 ⇒ 19 ⇒ 21 ⇒ 22 ⇒ 23 ⇒ 24（D36 增 `ev:menu`）。 */
const CHANNELS = [
  "ev:token", "ev:reasoning", "ev:activity", "ev:subagent", "ev:subchunk", "ev:tool-call", "ev:tool-output", "ev:tool-result",
  "ev:approval", "ev:question", "ev:task", "ev:susp", "ev:digest", "ev:usage", "ev:error", "ev:ledger", "ev:timer",
  "ev:queue", "ev:flags",
  "ev:statusText", "ev:compress",
  "ev:goal",
  "ev:config",
  "ev:menu",
]

/** 窄桥缺省出站面（预载装配的 `globalThis.thincoder.invoke`）；`invoke` 注入面优先（同形：`(name, payload) => Promise`）。 */
function callNarrowBridge(name, payload) {
  return globalThis.thincoder.invoke(name, payload)
}

/** 订阅二十四通道 ⇒ 退订句柄（二十四路全退；`off` 非函数 ⇒ 该路不退订，余路照退）。
 *  `store` 缺省 = 单例（档形 `{ on }`）；`on` 非函数 ⇒ 记错 + 空句柄（不静默死订阅）；
 *  回合尾（判据单源 = 核心档 `isTurnTail`）⇒ 标题刷新 ∧ `onTurnTail(key)` 窄口（缺 / 非函数 ⇒ 零动作 —— 未接线调用面合法）；
 *  `ev:config`（纯信号）⇒ `onConfig(ev)` 窄口（缺 / 非函数 ⇒ 零动作 —— 设置面复读归调用面装配）；
 *  `ev:menu`（纯信号 · D36）⇒ `onMenu(ev)` 窄口（缺 / 非函数 ⇒ 零动作 —— 菜单分派归调用面装配）。 */
export function attachEvents({ on, store = defaultStore, invoke = null, onTurnTail = null, onConfig = null, onMenu = null }) {
  const call = typeof invoke === "function" ? invoke : callNarrowBridge
  const tail = typeof onTurnTail === "function" ? onTurnTail : null
  const config = typeof onConfig === "function" ? onConfig : null
  const menu = typeof onMenu === "function" ? onMenu : null
  const offs = []
  if (typeof on !== "function") {
    console.error("[events] subscribe face missing: `on` is not a function — event wiring skipped")
    return () => {}
  }
  /** 标题刷新（回合收尾）：读通道复用 —— `sessions:list` ⇒ `sessions[]` 行（标题 / 计数随动）；零新通道。 */
  const refreshTitles = async () => {
    try {
      const list = await call("sessions:list")
      if (!Array.isArray(list?.sessions)) {
        console.error("[events] sessions:list payload shape unexpected:", list)
        return
      }
      store.set({ sessions: list.sessions })
    } catch (error) {
      console.error("[events] sessions:list refresh failed:", error)
    }
  }
  for (const channel of CHANNELS) {
    const off = on(channel, (payload) => {
      const ev = { ...(payload ?? {}), channel }
      const before = store.get()
      const next = reduce(before, ev)
      if (next !== before) store.set(next)
      if (channel === "ev:config" && config !== null) config(ev) // 纯信号窄口（R8）——零切片写
      if (channel === "ev:menu" && menu !== null) menu(ev) // 纯信号窄口（D36）——零切片写；消费 = 菜单动作分派
      if (isTurnTail(ev)) {
        void refreshTitles()
        if (tail !== null) tail(ev.key) // 回合尾窄口（存续：输入区 flush 携行随「回合中插入」批退场 —— 调用面可接；携键）
      }
    })
    if (typeof off === "function") offs.push(off)
  }
  return () => {
    for (const off of offs) off()
  }
}
