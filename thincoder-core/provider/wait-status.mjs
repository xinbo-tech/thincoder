/**
 * wait-status.mjs — `onWait` 相位 → 状态文案（核内单源映射 · 批 1 CORE-DEFECT-FIXES B3）。
 *
 * 背景（`docs/core/design/PROVIDER.md` §6.20）：`onWait` 载荷的相位值域只在**发射侧**
 * 收敛（五相：`gate` / `retry` / `overloaded` 带 `seconds` · `warn` / `quota` 带
 * `message`），三个消费点（CLI TUI 状态行 / headless stderr / ACP 日志）各自枚举相位 ⇒
 * 未列相位落 `else` 兜底，读 `seconds` 渲染出字面 `undefined`
 * （`Rate-limited 429, retry in undefineds`），`warn` / `quota` 还被误标 429。
 *
 * 本档 = 相位值域 + 文案的**单源**：消费面只调 `waitStatusText(ev)`，禁各自相位枚举 /
 * 兜底分支（结构机检 = `thincoder-cli/test/wait-status-callsites.test.mjs`）。
 *
 * 判据（PROVIDER.md §6.20 映射表·逐相）：
 *   gate       带 seconds → `status.rateWait`    显示
 *   retry      带 seconds → `status.rateLimited` 显示
 *   overloaded 带 seconds → `status.overloaded`  显示（不得落 429 文案）
 *   quota      带 message → `status.quota`       显示（剥发射回显前缀——防双前缀）
 *   warn       前置告警   → `null`（不显示——与 VSC 面 `statusTextPayload` 同判据）
 *   未知相位 / 秒缺失 / 无可渲染载荷 → `null`（不虚构数值、不落兜底误标）
 */
import { t } from "../i18n.mjs"

/** 发射面回显前缀（`provider/retry.mjs:60` 的 `quota exhausted: `）——由 i18n 模板去占位符
 *  派生（核内零第二套文案字面）；发射侧恒为 en 字面，故剥前缀不随 locale 变。 */
const QUOTA_ECHO_PREFIX = t("status.quota", { msg: "" })

/** 秒值有效性：有限数才可渲染（缺字段 / null / 非数 ⇒ 不虚构数值）。 */
function hasSeconds(ev) {
  return typeof ev?.seconds === "number" && Number.isFinite(ev.seconds)
}

/**
 * 相位 → `{ kind, seconds | message }`（纯映射）；`null` = 不显示。
 * `kind` 词表与 VSC 面 `statusTextPayload` 的 kind 同名（两端同一词表）。
 */
export function waitStatusOf(ev) {
  const phase = ev?.phase
  if (phase === "quota") {
    const raw = typeof ev?.message === "string" ? ev.message : ""
    if (!raw.trim()) return null // 无可渲染载荷 ⇒ 不显示（不渲染空/undefined）
    const stripped = raw.startsWith(QUOTA_ECHO_PREFIX) ? raw.slice(QUOTA_ECHO_PREFIX.length) : raw
    return { kind: "quota", message: stripped }
  }
  if (phase === "gate" || phase === "retry" || phase === "overloaded") {
    if (!hasSeconds(ev)) return null
    const kind = phase === "gate" ? "rateWait" : phase === "retry" ? "rateLimited" : "overloaded"
    return { kind, seconds: ev.seconds }
  }
  return null // warn（前置告警）/ 未知相位 ⇒ 不显示
}

/** 相位 → 文案（文案取自核 i18n `status.*` 单源）；`null` = 消费点不显示、不打印。 */
export function waitStatusText(ev, locale = "en") {
  const m = waitStatusOf(ev)
  if (!m) return null
  return m.kind === "quota"
    ? t("status.quota", { msg: m.message }, locale)
    : t("status." + m.kind, { s: m.seconds }, locale)
}
