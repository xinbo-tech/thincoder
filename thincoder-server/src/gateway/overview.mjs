/**
 * overview.mjs — 管理总览读数（控制台——仅 admin；gateway/API.md §2.4 ∥ KD-SV-29——`webui/WEBUI.md` §2.3③）：
 * `GET /api/overview` ⇒ `{ today: { requests, totalTokens }, members: { count } }`。
 *
 * `today` = 服务器本地自然日窗（日界 = `localDayStart`——**同源**：与用量报表共用同一日界助手与同一聚合函数 `usageTotals`——§2.4）；
 * `requests` = 行数（含 error/aborted） ∥ `totalTokens` = `SUM(total_tokens)`（NULL 不计）。
 * 成员数 = `countMembers`（单源）；健康/更新两卡不走本端点（前端共享态——`webui/WEBUI.md` §2.3⑤）。
 * 判权 = `requireAdmin`（`user` ⇒ 403 ∥ 无/过期会话 ⇒ 401）。
 */
import { countMembers } from "../accounts/members.mjs"
import { requireAdmin } from "../accounts/session.mjs"
import { localDayStart, usageTotals } from "../metering/usage.mjs"
import { sendJson } from "./errors.mjs"

/** 注册总览端点（§2.4）：`db` = openDatabase 产物 ∥ `now` = 时钟注入面（缺省 `Date.now`——生产行为不变）。 */
export function registerOverviewRoutes(routes, { db, now = Date.now } = {}) {
  if (!db) throw new Error("registerOverviewRoutes：缺少 db（openDatabase 产物）")

  routes.add("GET", "/api/overview", (req, res) => {
    requireAdmin(db, req) // user ⇒ 403 ∥ 无/过期会话 ⇒ 401（同族口径）
    const totals = usageTotals(db, { from: localDayStart(now(), 0) }) // 同源：同一日界助手（§2.4）
    sendJson(res, 200, {
      today: { requests: totals.requests, totalTokens: totals.totalTokens },
      members: { count: countMembers(db) },
    })
  })
}
