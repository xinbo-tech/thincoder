/**
 * settings-team.js — 团队卡（第 6 卡——B1 批 · 台账 #1212）：登录表单 ∥ 已登录态 ∥ 一次性提示。
 *
 * 端面契约 = `docs/vsc/design/SETTINGS.md` §2.20（读面 / 写面 / 回执形 / 密码面 / 失败出词）；
 * 机制单源 = `docs/core/design/TEAM.md` §2（本档不复制——D2）。端侧零自写盘（写面全走宿主
 * → 核 `team.mjs`）；状态缓存 = 模块内单一变量（快照经 `teamStatus` 推送落——单一状态源 =
 * config.json，面板整体重建制不变）。
 * 口令面（§2.20）：密码只读自输入框、随 `teamLogin` 上行即弃——零落盘 ∥ 零快照 ∥ 零回显；
 * 重绘/重建即清空密码格（重绘恒重建 DOM）。
 */
import { escHtml } from "./ui.js"
import { t } from "./i18n.js"

/** 最近一次团队态快照（`teamStatus` 推送载荷——`{ loggedIn, server, member, label }`）。 */
let _teamStatus = null

/** 失败理由域（码 → 词键——四值闭集单源 = `TEAM.md` §2.5「失败理由域」；码不携文）。 */
const FAIL_WORD = Object.freeze({
  network: "settings.team.fail.network",
  credentials: "settings.team.fail.credentials",
  rate_limited: "settings.team.fail.rateLimited",
  write_failed: "settings.team.fail.writeFailed",
})

/** 一次性提示码 → 词键（`notice = "manual-name-conflict"`——登录当刻就地提示）。 */
const NOTICE_WORD = Object.freeze({
  "manual-name-conflict": "settings.team.notice.manualNameConflict",
})

/** 词化：表内出词；表外原样直传（含原始码串）；缺 ∥ 空 ⇒ null（零节点）。 */
function wordOf(table, code) {
  if (code === null || code === undefined || code === "") return null
  const key = Object.hasOwn(table, code) ? table[code] : null
  return key === null ? String(code) : t(key)
}

/** 成员显示名（核回执 name ∥ username 兜底——与核面同序；缺失 ⇒ 「—」）。 */
function memberText(member) {
  if (!member || typeof member !== "object") return "—"
  return member.name || member.username || "—"
}

/** 团队卡 HTML（两态闭集：未登录 = 三字段 + 登录钮 + 提示行「未登录——登录后可用」；
 *  已登录 = 状态行（server ∥ 成员 ∥ 端标签）+ 退出钮；提示/失败行两态共有）。 */
export function teamCardHtml() {
  const st = _teamStatus || {}
  const loggedIn = st.loggedIn === true
  let html = `<section id="team-card" class="settings-card"><h4 class="settings-card-title">${t("settings.teamSection")}</h4><div class="settings-card-body">`
  if (loggedIn) {
    html += `<div id="team-status-line" style="font-size:12px;padding:2px 0">${escHtml(t("settings.team.status", { server: st.server ?? "—", member: memberText(st.member), label: st.label ?? "—" }))}</div>`
    html += `<div><button id="team-logout-btn" class="key-btn">${t("settings.team.logout")}</button></div>`
  } else {
    // 表单预填（§2.1：server ∥ member = 上次登录快照——显示面 ∥ 表单预填）；密码格恒空（不保真）
    html += `<div class="key-field"><label>${t("settings.team.server")}</label><input id="team-server" placeholder="http://host:port" value="${escHtml(st.server || "")}"></div>`
    html += `<div class="key-field"><label>${t("settings.team.username")}</label><input id="team-username" autocomplete="off" value="${escHtml(st.member?.username || "")}"></div>`
    html += `<div class="key-field"><label>${t("settings.team.password")}</label><input id="team-password" type="password" autocomplete="off" value=""></div>`
    html += `<div><button id="team-login-btn" class="key-btn">${t("settings.team.login")}</button></div>`
    html += `<div id="team-hint" style="font-size:12px;opacity:0.7;padding:2px 0">${t("settings.team.notLoggedIn")}</div>`
  }
  html += `<div id="team-notice" style="font-size:12px;opacity:0.85;padding:2px 0;display:none"></div>`
  html += `</div></section>`
  return html
}

/** 卡内控件绑定（建面 ∥ 就地重绘两路同点）；按钮动作 = 两条上行（`teamLogin` 三字段 ∥ `teamLogout`）。
 *  密码零加工上行（trim 会改凭据）；server ∥ username trim 后上行（空值兜底在核面分类出词）。 */
export function bindTeamControls() {
  document.getElementById("team-login-btn")?.addEventListener("click", () => {
    const server = document.getElementById("team-server")?.value?.trim() || ""
    const username = document.getElementById("team-username")?.value?.trim() || ""
    const password = document.getElementById("team-password")?.value ?? ""
    setTeamNotice(null) // 新尝试清旧提示（提示 = 一次性面）
    window._vscode.postMessage({ type: "teamLogin", server, username, password })
  })
  document.getElementById("team-logout-btn")?.addEventListener("click", () => {
    setTeamNotice(null)
    window._vscode.postMessage({ type: "teamLogout" })
  })
}

/** 卡内提示行（一次性提示 ∥ 失败出词——两态共有；空 ⇒ 隐藏）。 */
function setTeamNotice(text) {
  const el = document.getElementById("team-notice")
  if (!el) return
  if (text === null || text === undefined || text === "") {
    el.textContent = ""
    el.style.display = "none"
    return
  }
  el.textContent = String(text)
  el.style.display = "block"
}

/** `teamStatus` 推送消费（§2.20 读面）：存快照 + 变更拍且面板开而在位 ⇒ 就地重绘（两态切换 ∥
 *  状态行刷新）；同值快照（打开/保存拍快照族重发）⇒ 零重绘（沿 `updateProviderStatus` 变更门同判
 *  ——免无谓 DOM 重建 ∥ 免碰未聚焦在编值）。 */
export function updateTeamStatus(payload) {
  const next = {
    loggedIn: payload?.loggedIn === true,
    server: payload?.server ?? null,
    member: payload?.member ?? null,
    label: payload?.label ?? null,
  }
  const changed = JSON.stringify(_teamStatus) !== JSON.stringify(next)
  _teamStatus = next
  if (!changed) return
  rerenderTeamCard()
}

/** 就地重绘（清密码格 = 重绘的自然结果——§2.20）。输入聚焦中 ⇒ 本拍只存快照不重绘
 *  （用户输入优先于推送——沿 U-S10 ∥ §2.18 在编守卫同判）。面板未开 ⇒ 零动作（下次建面渲染）。 */
function rerenderTeamCard() {
  const card = document.getElementById("team-card")
  if (!card) return
  const panel = document.getElementById("settings-panel")
  if (!panel || panel.style.display !== "flex") return
  const active = document.activeElement
  if (active && active.tagName === "INPUT" && card.contains(active)) return
  card.outerHTML = teamCardHtml()
  bindTeamControls()
}

/** `teamLoginResult` 回执消费（§2.20 回执形）：成 + `notice` ⇒ 同名冲突句（登录当刻就地提示）；
 *  败 ⇒ 失败出词（四句——`reason` 码表内出词）。 */
export function onTeamLoginResult(result) {
  if (result?.ok === true) {
    setTeamNotice(result.notice ? wordOf(NOTICE_WORD, result.notice) : null)
    return
  }
  setTeamNotice(wordOf(FAIL_WORD, result?.reason))
}

/** `teamLogoutResult` 回执消费：`revokeDelivered === false` ⇒「服务端吊销未达」（退出当刻就地提示）；
 *  败 ⇒ 失败出词。 */
export function onTeamLogoutResult(result) {
  if (result?.ok === true) {
    setTeamNotice(result.revokeDelivered === false ? t("settings.team.notice.revokeUndelivered") : null)
    return
  }
  setTeamNotice(wordOf(FAIL_WORD, result?.reason))
}
