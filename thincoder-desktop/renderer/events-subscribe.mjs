/**
 * events-subscribe.mjs — 渲染面事件订阅接线（十通道表 · `attachEvents` · 回合尾标题刷新 + 输入区 flush 窄口）：
 * 自 `renderer/events.mjs` 拆出（300 行拆分层落形 —— 批档 §5 登记）；归约纯函数与值面写者仍在核心档
 * （`reduce` / `applyPage` / `blockOfMessage` / `openSession` / `clearApproval`）——本档单向依赖核心档，无环。
 *
 * 导出面一：`attachEvents({ on, store, invoke, onTurnTail })`（十通道订阅 ⇒ 退订句柄）；回合尾判据 = 核心档导出
 * `isTurnTail` **单源**（三径 —— 批 A 修正轮）；回合尾（判据命中）⇒ 标题刷新 ∧ `onTurnTail` **窄口**（输入区 flush ——
 * 批档 §1.14：flush 逻辑住 `renderer/mount-composer.mjs` · 触发只此一处 ⇒ **零第二订阅点**；缺 / 非函数 ⇒ 零动作）。
 * 档形 = `attachEvents({ on })` —— `store` 缺省 = 单例（`renderer/store.mjs`）· `invoke` 缺省 = 窄桥
 * `globalThis.thincoder.invoke`；四参注入面 = 测试缝（`test/events-reduce.test.mjs`）。调用面 = `renderer/app.mjs`
 * （退订句柄本批无消费点 —— 页面生命周期 = 进程生命周期；`on` 非函数 ⇒ 记错 + 空句柄）。
 * 纪律：本档零 DOM / 零 `node:` / 零裸包；控制台诊断串非面向用户文案（不经 `t()`）。
 */
import { isTurnTail, reduce } from "./events.mjs"
import { store as defaultStore } from "./store.mjs"

/** 十通道（订阅面闭集 —— 单源 = `docs/desktop/design/IPC.md` §1「白名单 = 本表十通道」；十通道在归约面皆有写者）。 */
const CHANNELS = [
  "ev:token", "ev:tool-call", "ev:tool-output", "ev:tool-result",
  "ev:approval", "ev:activity", "ev:error", "ev:question", "ev:task", "ev:usage",
]

/** 窄桥缺省出站面（预载装配的 `globalThis.thincoder.invoke`）；`invoke` 注入面优先（同形：`(name, payload) => Promise`）。 */
function callNarrowBridge(name, payload) {
  return globalThis.thincoder.invoke(name, payload)
}

/** 订阅十通道 ⇒ 退订句柄（十路全退；`off` 非函数 ⇒ 该路不退订，余路照退）。
 *  `store` 缺省 = 单例（档形 `{ on }`）；`on` 非函数 ⇒ 记错 + 空句柄（不静默死订阅）；
 *  回合尾（判据单源 = 核心档 `isTurnTail`）⇒ 标题刷新 ∧ `onTurnTail` 窄口（缺 / 非函数 ⇒ 零动作 —— 未接线调用面合法）。 */
export function attachEvents({ on, store = defaultStore, invoke = null, onTurnTail = null }) {
  const call = typeof invoke === "function" ? invoke : callNarrowBridge
  const tail = typeof onTurnTail === "function" ? onTurnTail : null
  const offs = []
  if (typeof on !== "function") {
    console.error("[events] subscribe face missing: `on` is not a function — event wiring skipped")
    return () => {}
  }
  /** 标题刷新（回合收尾）：读通道复用 —— `sessions:list` ⇒ `sessions[]` 行（标题 / 计数随动）；零新通道。 */
  const refreshTitles = async () => {
    try {
      const list = await call("sessions:list")
      if (!Array.isArray(list?.rows)) {
        console.error("[events] sessions:list payload shape unexpected:", list)
        return
      }
      store.set({ sessions: list.rows })
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
      if (isTurnTail(ev)) {
        void refreshTitles()
        if (tail !== null) tail() // 输入区 flush 窄口（批档 §1.14 —— 与标题刷新同触发点，判据仍单源）
      }
    })
    if (typeof off === "function") offs.push(off)
  }
  return () => {
    for (const off of offs) off()
  }
}
