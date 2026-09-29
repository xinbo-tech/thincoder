/**
 * notify-policy.mjs — 完成提示面**策略**（失焦门 + 单档 + 载荷成形 + 词键）——「桌面处理流 · VSC 对齐」批 R6 上提产物。
 *
 * 上提源 = 桌面现状超集 `thincoder-desktop/src/main/notify.mjs`（零宿主依赖 —— **纯搬，零语义改**）；
 * 对位锚（迁移前坐标）= VSC `thincoder-vscode/src/extension/notify.mjs:9-18`（失焦门同判据）+
 * `panel-callbacks.mjs:236`（`!autoTurn` 门径）。平台落子（Electron `Notification` vs
 * VSC `showInformationMessage`）= 宿主能力面（真端差登记 ①）⇒ **装配留端**（桌面 =
 * `thincoder-desktop/src/main/main.mjs`；VSC = `notify.mjs` 宿主包装——已随 parity-b4 迁移落形）；本档只承策略面。
 *
 * `notify`（平台落子）· `focused`（焦态判据）· `reveal`（点击面）· `localeOf`（语言取值缝——VSC
 * wrapper 携 `vscode.env.language`，`normalizeLocale` 归一 `zh-CN → zh`；缺省 = `agent.config?.locale`，
 * 桌面径零改）四件注入 ⇒ 平 node 直测。词键一键自此持本档（值 = 原 VSC 逐字 `notify.done`——该键已随
 * parity-b4 迁移自 `thincoder-vscode/locales/{zh,en}.json:222` 删）。触发单档（`!autoTurn` 判据在调用面 —— 单回合
 * 执行面；VSC 同判据）：
 *   用户回合完成（VSC 逐字同判据 = `panel-callbacks.mjs:236` 的 `!autoTurn` 门）
 * `title` = 会话标题（`agent.title`——槽装载面在场；空 ∕ 不可得 ⇒ **零携**）；点击 = 聚焦窗口 ∕
 * 打开 thincoder 视图（reveal 语义 —— 宿主面；不切会话）。
 * 消费面 = 桌面 `thincoder-desktop/src/main/notify.mjs`（端胶水 re-export）；VSC `notify.mjs`（宿主包装——已随 parity-b4 迁移落形）。
 */
import { normalizeLocale } from "./i18n.mjs"

/** 词键值（zh ∕ en 常量对：`notify.done` = 原 VSC `locales/{zh,en}.json:222` 逐字——该键已随 parity-b4 迁移自 locales 删）。 */
export const NOTIFY_TEXTS = Object.freeze({
  zh: "ThinCoder：本轮完成",
  en: "ThinCoder: turn complete",
})

/** 零动作面（`notify` 注入缺位 = 提示面缺位 ⇒ 零连带 —— 回合链不受累、不抛；沿「禁假造」口径不落假通知）。 */
const SILENT = Object.freeze({ turnDone: () => false })

/** 提示面工厂：`notify(payload)` = 平台落子（载荷 `{ title?, body, reveal? }`）· `focused()` = 窗口聚焦判据
 *  （真 ⇒ 门闭合 · 缺省 = 恒聚焦 ⇒ 零通知）· `reveal()` = 点击面（宿主语义）· `localeOf(agent)` =
 *  语言取值缝（缺省 = `agent?.config?.locale`）。返回单档 `turnDone`（返回值 = 是否落子，测试读数面）。 */
export function createNotifier({ notify = null, focused = null, reveal = null, localeOf = null } = {}) {
  if (typeof notify !== "function") return SILENT
  const isFocused = typeof focused === "function" ? focused : () => true
  const langOf = (agent) => (normalizeLocale(typeof localeOf === "function" ? localeOf(agent) : agent?.config?.locale) === "zh" ? "zh" : "en")
  const fire = ({ agent = null } = {}) => {
    if (isFocused()) return false // 失焦门：聚焦 = no-op（never noise —— VSC `thincoder-vscode/src/extension/notify.mjs:9-18` 同判据）
    const payload = { body: NOTIFY_TEXTS[langOf(agent)] }
    const title = typeof agent?.title === "string" && agent.title.trim() !== "" ? agent.title : null
    if (title !== null) payload.title = title // 会话标题在场才携（不可得 ⇒ 零携）
    if (typeof reveal === "function") payload.reveal = reveal
    try { notify(payload) } catch (error) { console.error("[notify] dispatch failed:", error) } // 平台抛 ⇒ 零连带
    return true
  }
  return {
    /** 用户回合完成（`!autoTurn` 判据在调用面 —— 单回合执行面成功径）。 */
    turnDone(vars) { return fire(vars) },
  }
}
