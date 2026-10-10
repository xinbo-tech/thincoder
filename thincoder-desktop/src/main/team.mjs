/**
 * team.mjs — 团队族三通道处理体（B1 批 · 2026-10-10 · 台账 #1212）：`team:status` ∥ `team:login` ∥ `team:logout`
 * ——核 `thincoder-core/team.mjs` **转口**（**唯一写者 = 核**：本档零自写盘、零第二实现；主进程只是转发）。
 *
 * 回执形（单源 = `docs/desktop/design/IPC.md` §2 团队族行）：
 *   ① `team:status`（无载荷）⇒ `{ ok, loggedIn, server, member, label }`（核 `teamStatus()` 投影——登录态 = `token` 在场）；
 *   ② `team:login`（载荷 `{ server, username, password }`）⇒ `{ ok, reason?, notice? }`——`reason` 四值 =
 *      `network` / `credentials` / `rate_limited` / `write_failed`；`notice` = `"manual-name-conflict"` 仅同名手工
 *      条目冲突时在场（**码不携文**——文本归渲染面 i18n）；
 *   ③ `team:logout`（无载荷）⇒ `{ ok, revokeDelivered? }`（缺席 = true（服务端吊销已送达）；`false` ⇒ 渲染面就地提示）。
 * 机制单源 = `docs/core/design/TEAM.md` §2（配置形 ∥ 登录流程 ∥ 派生 provider 条目 ∥ 提示条）。
 * 纪律：零自写盘（写面 = 核 `writeConfigAtomic` 一次 mutate）· 畸形档不吞（核 `loadConfig` 抛 ⇒ invoke 拒绝直传——
 * 沿 provider 族同口径）· 端侧零 catch 吞。
 */
import { teamLogin, teamLogout, teamStatus } from "@thincoder/core/team.mjs"

/** `team:status`（无载荷）⇒ `{ ok, loggedIn, server, member, label }`——`loggedIn` ⇔ 核 `team.token` 在场（权威源 = 核）。 */
export function teamStatusChannel() {
  return { ok: true, ...teamStatus() }
}

/** `team:login(payload)` ⇒ `{ ok, reason?, notice? }`：载荷三键转核（形门兜底面归核——无地址 ⇒ `network` ∥ 凭据不全 ⇒ `credentials`）。
 *  返回 Promise（核面 fetch 在飞）；核面分类零改（`reason` 四值单源 = 核 `team.mjs`）。 */
export function teamLoginChannel(payload) {
  return teamLogin({
    server: typeof payload?.server === "string" ? payload.server : null,
    username: typeof payload?.username === "string" ? payload.username : null,
    password: typeof payload?.password === "string" ? payload.password : null,
  })
}

/** `team:logout()` ⇒ `{ ok, revokeDelivered? }`：核面吊销 best-effort + 本地清 token（网络失败照清——核单源）。 */
export function teamLogoutChannel() {
  return teamLogout()
}
