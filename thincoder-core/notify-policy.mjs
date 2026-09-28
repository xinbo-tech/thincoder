/**
 * notify-policy.mjs — 完成提示面**策略**（失焦门 + 两档 + 载荷成形 + 词键）——「桌面处理流 · VSC 对齐」批 R6 上提产物。
 *
 * 上提源 = 桌面现状超集 `thincoder-desktop/src/main/notify.mjs`（零宿主依赖 —— **纯搬，零语义改**）；
 * 对位锚 = VSC `thincoder-vscode/src/extension/notify.mjs:9-18`（失焦门同判据）+
 * `panel-callbacks.mjs:233`（档① `!autoTurn` 门径）。平台落子（Electron `Notification` vs
 * VSC `showInformationMessage`）= 宿主能力面（真端差登记 ①）⇒ **装配留端**（桌面 =
 * `thincoder-desktop/src/main/main.mjs`）；本档只承策略面。
 *
 * `notify`（平台落子）· `focused`（焦态判据）· `reveal`（点击聚焦）三件注入 ⇒ 平 node 直测。
 * 词键两键自此持本档（`notify.done` = VSC 逐字 `thincoder-vscode/locales/{zh,en}.json:222`；
 * `notify.subagents` = 桌面批新键，zh ∕ en 值形 = `docs/desktop/design/IPC.md` §1 词键注项 3
 * —— 原「主进程自持」句随上提改归属，设计档收正归设计面轮）；locale 取装配实例配置
 * （先例 = 附件面 `agent.config?.locale` —— `normalizeLocale` 归一）。
 * 触发两档（`!autoTurn` ∕ `pending > 0` 判据在调用面 —— 单回合执行面 ∕ 挂起驱动）：
 *   ① 用户回合完成（VSC 逐字同判据 = `panel-callbacks.mjs:233` 的 `!autoTurn` 门）
 *   ② 后台消化轮起跑（要因「子任务完成」；合并轮同判 —— 纯 ask 唤醒轮 `pending = 0` ⇒ 不弹，对齐两端）
 * `title` = 会话标题（`agent.title`——槽装载面在场；空 ∕ 不可得 ⇒ **零携**）；点击 = 聚焦窗口（reveal 语义 —— 不切会话）。
 * 消费面 = 桌面 `thincoder-desktop/src/main/notify.mjs`（端胶水 re-export）；VSC 迁移留后（双写窗口在册）。
 */
import { normalizeLocale } from "./i18n.mjs"

/** 词键值（两语常量对：档① `notify.done` = VSC 逐字 —— `thincoder-vscode/locales/{zh,en}.json:222`；
 *  档② `notify.subagents` = 桌面批新键，zh ∕ en 值形 = `docs/desktop/design/IPC.md` §1 词键注项 3）。 */
export const NOTIFY_TEXTS = Object.freeze({
  zh: Object.freeze({ done: "ThinCoder：本轮完成", subagents: (n) => `子任务完成（${n} 项）` }),
  en: Object.freeze({ done: "ThinCoder: turn complete", subagents: (n) => `${n} subagent(s) finished` }),
})

/** 零动作面（`notify` 注入缺位 = 提示面缺位 ⇒ 零连带 —— 回合链不受累、不抛；沿「禁假造」口径不落假通知）。 */
const SILENT = Object.freeze({ turnDone: () => false, digestStart: () => false })

/** 提示面工厂：`notify(payload)` = 平台落子（载荷 `{ title?, body, reveal? }`）· `focused()` = 窗口聚焦判据
 *  （真 ⇒ 门闭合 · 缺省 = 恒聚焦 ⇒ 零通知）· `reveal()` = 点击聚焦面（VSC reveal 语义）。
 *  返回两触发档（`turnDone` 档① ∕ `digestStart` 档② —— 返回值 = 是否落子，测试读数面）。 */
export function createNotifier({ notify = null, focused = null, reveal = null } = {}) {
  if (typeof notify !== "function") return SILENT
  const isFocused = typeof focused === "function" ? focused : () => true
  const langOf = (agent) => (normalizeLocale(agent?.config?.locale) === "zh" ? "zh" : "en")
  const fire = (tier, { agent = null, n = 0 } = {}) => {
    if (isFocused()) return false // 失焦门：聚焦 = no-op（never noise —— VSC `thincoder-vscode/src/extension/notify.mjs:9-18` 同判据）
    const texts = NOTIFY_TEXTS[langOf(agent)]
    const payload = { body: tier === 2 ? texts.subagents(n) : texts.done }
    const title = typeof agent?.title === "string" && agent.title.trim() !== "" ? agent.title : null
    if (title !== null) payload.title = title // 会话标题在场才携（不可得 ⇒ 零携）
    if (typeof reveal === "function") payload.reveal = reveal
    try { notify(payload) } catch (error) { console.error("[notify] dispatch failed:", error) } // 平台抛 ⇒ 零连带
    return true
  }
  return {
    /** 档①：用户回合完成（`!autoTurn` 判据在调用面 —— 单回合执行面成功径）。 */
    turnDone(vars) { return fire(1, vars) },
    /** 档②：后台消化轮起跑（`n > 0` 门在本档 —— 纯 ask 唤醒轮 `n = 0` ⇒ 不弹；合并轮按档② 弹）。 */
    digestStart(vars) { return (vars?.n ?? 0) > 0 ? fire(2, vars) : false },
  }
}
