/**
 * team.mjs — VSC 端壳团队面（B1 批 · 台账 #1212）：核 `team.mjs` 转口——登录态投影 ∥ 登录 ∥ 退出。
 *
 * 端面契约 = `docs/vsc/design/SETTINGS.md` §2.20（面板 ↔ config 契约端差面）；机制单源 =
 * `docs/core/design/TEAM.md` §2（本档不复制——D2）。**写面全在核**（`writeConfigAtomic` 单写者
 * ——端侧零自写盘）；本档零状态、零副作用（纯转口——推送到装配点 = `settings.mjs` / 消息处理器）。
 *
 * 返回形（核面实装——端侧原样透传）：
 *   `teamLogin`  ⇒ `{ ok:true, notice?:"manual-name-conflict" }` ∥ `{ ok:false, reason }`
 *   `teamLogout` ⇒ `{ ok:true, revokeDelivered:boolean }` ∥ `{ ok:false, reason }`
 *   `reason` 四值闭集 = `network` ∥ `credentials` ∥ `rate_limited` ∥ `write_failed`（出词四句
 *   单源 = `docs/core/design/TEAM.md` §2.5——**码不携文**，文本归端侧 i18n）。
 */
import {
  teamStatus as coreTeamStatus,
  teamLogin as coreTeamLogin,
  teamLogout as coreTeamLogout,
} from "@thincoder/core/team.mjs"

/** 登录态读面投影：`{ loggedIn, server, member, label }`（渲染面只读——单一状态源 = config.json；
 *  `loggedIn` ⇔ 核 `team.token` 在场）。 */
export function teamStatus() {
  return coreTeamStatus()
}

/** 登录（TEAM.md §2.2）：收集三字段 ⇒ 核请求 + 一次写盘（`team` 段 + 派生条目 upsert——端侧零自写盘）。 */
export function teamLogin({ server, username, password } = {}) {
  return coreTeamLogin({ server, username, password })
}

/** 退出（TEAM.md §2.3）：核吊销 best-effort + 本地清 token / 摘派生条目 apiKey。 */
export function teamLogout() {
  return coreTeamLogout()
}
