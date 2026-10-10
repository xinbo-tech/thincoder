/**
 * onboarding.js — first-run onboarding: shown when no provider is configured.
 *
 * 登录面补全批（2026-10-10 · 台账 #1230 ∥ #1231）：首启板两路（`docs/vsc/design/WEBVIEW.md` §4.11）
 * ——路由屏 = 两卡并排（团队 ∥ 本地；都不预选）⇒ 同屏换取（不叠层）：团队卡 ⇒ 团队表单（server ∥
 * username ∥ password + 登录钮 + 失败行 + 「← 换一种方式」）；本地卡 ⇒ 既有表单原样（preset select +
 * key + 保存——零重构）。回退 ⇒ 路由屏（已填 server ∥ username 保留；密码恒清——沿 B1 口径）。
 * 提交链复用既有消息面（`teamLogin` 上行 ∥ `teamLoginResult` 回执——零新协议）；登录成 ⇒ 宿主
 * `providerStatus` 闸放行 ⇒ 板退场（`maybeShowWelcome`——keyOk 真 ⇒ `hideWelcomePanel()`）。
 * 跳过/「以后再说」⇒ 既有 `_welcomeDismissed`（webview 生存期——板不再显）；登录路仍可达 =
 * 状态栏团队 item + 命令 `thincoder.team`；零第二引导面。
 *
 * initOnboarding({ openSettings }) is called once from chat.js after the
 * settings panel is initialized — the "custom provider" / "full settings"
 * paths hand off to it.
 */
import { ctx, vscode, S } from "./state.js"
import { t } from "./i18n.js"
import { escHtml } from "./ui.js"
// 词表复用（单一 owner = settings-team.js——零第二副本）：失败四句 ∥ 同名冲突一次性提示
import { teamFailWord, teamNoticeWord } from "./settings-team.js"

let _openSettings = null

/** 当前屏（闭集三值：`"route"` ∥ `"team"` ∥ `"local"`；表外值不落——零预选 = 起手恒路由屏）。 */
let _route = "route"
/** 最近一次 providerStatus（板面自用面 = `presets`——预设选项表；团队态快照不在此载荷内）。 */
let _lastStatus = {}

export function initOnboarding({ openSettings }) {
  _openSettings = openSettings
}

/** 词面刷写（新件可缺位——旧夹具不含 ⇒ 跳过；生产面恒在场）。 */
function setText(el, text) {
  if (el) el.textContent = text
}

/** 路由屏 ⇄ 换取区施用（`_route` 三值闭集）；缺件面 ⇒ 空转（夹具面零抛）。 */
function applyRoute() {
  const routes = ctx.welcomeRoutes
  const swap = ctx.welcomeSwap
  if (!routes || !swap) return
  routes.style.display = _route === "route" ? "flex" : "none"
  swap.style.display = _route === "route" ? "none" : "flex"
  if (ctx.welcomeTeamForm) ctx.welcomeTeamForm.style.display = _route === "team" ? "flex" : "none"
  if (ctx.welcomeLocalForm) ctx.welcomeLocalForm.style.display = _route === "local" ? "flex" : "none"
}

/** 团队失败/提示行（一次性面——空 ⇒ 隐藏）。 */
function setTeamFail(text) {
  const el = ctx.welcomeTeamFail
  if (!el) return
  if (text === null || text === undefined || text === "") {
    el.textContent = ""
    el.style.display = "none"
    return
  }
  el.textContent = String(text)
  el.style.display = "block"
}

/** 路由卡选取（同屏换取——不叠弹层）：团队路 = 三字段（零预填——留存值预填 = 登/退流径：
 *  item 面 `teamStatus`；板面 = 首启面，无留存值）；密码恒清（不保真）。 */
function chooseRoute(route) {
  if (route !== "team" && route !== "local") return
  if (route === "team" && ctx.welcomeTeamPassword) {
    ctx.welcomeTeamPassword.value = "" // 回退/重入场两拍同清（B1 口径）
  }
  setTeamFail(null)
  _route = route
  applyRoute()
}

/** 「← 换一种方式」⇒ 回路由屏（已填 server ∥ username 保留；密码清）。 */
function backToRoute() {
  setTeamFail(null)
  if (ctx.welcomeTeamPassword) ctx.welcomeTeamPassword.value = ""
  _route = "route"
  applyRoute()
}

/** `teamLoginResult` 回执消费（板面钩——chat-messages 分发）：成 + `notice` ⇒ 同名冲突句（登成当刻
 *  就地提示；无 notice ⇒ 清行）；败 ⇒ 失败四句逐字就地（停留可重试——板退场交 `providerStatus` 闸）。 */
export function onWelcomeTeamLoginResult(result) {
  if (result?.ok === true) {
    setTeamFail(teamNoticeWord(result.notice))
    return
  }
  setTeamFail(teamFailWord(result?.reason))
}

/** Show the onboarding panel, pre-filled with the unadded provider presets. */
export function showWelcomePanel(status) {
  if (S._welcomeDismissed) return
  _lastStatus = status ?? _lastStatus ?? {}
  // 选项 label = 描述 ∥ 名（2026-10-09 清除批：渠道条目不携模型——模型尾缀退场）
  const presets = (_lastStatus.presets || []).map((p) => ({ name: p.name, label: p.desc || p.name }))
  const sel = ctx.welcomeProvider
  sel.innerHTML = presets
    .map((p) => `<option value="${escHtml(p.name)}">${escHtml(p.label)}</option>`)
    .join("") + `<option value="custom">${escHtml(t("settings.customChoice"))}</option>`
  ctx.welcomeHeading.textContent = t("welcome.heading")
  ctx.welcomeText.textContent = t("welcome.text")
  // 路由屏两卡（标题 ∥ 说明 ∥ 行动钮——词面零再造；团队卡行动 = `settings.team.login`）
  setText(ctx.welcomeRouteTeamTitle, t("welcome.route.teamTitle"))
  setText(ctx.welcomeRouteTeamDesc, t("welcome.route.teamDesc"))
  setText(ctx.welcomeRouteTeamBtn, t("settings.team.login"))
  setText(ctx.welcomeRouteLocalTitle, t("welcome.route.localTitle"))
  setText(ctx.welcomeRouteLocalDesc, t("welcome.route.localDesc"))
  setText(ctx.welcomeRouteLocalBtn, t("welcome.route.localAction"))
  // 团队表单（三字段 ∥ 登录 ∥ 回退）
  setText(ctx.welcomeTeamServerLabel, t("settings.team.server"))
  setText(ctx.welcomeTeamUsernameLabel, t("settings.team.username"))
  setText(ctx.welcomeTeamPasswordLabel, t("settings.team.password"))
  setText(ctx.welcomeTeamLoginBtn, t("settings.team.login"))
  setText(ctx.welcomeTeamBack, t("welcome.backToRoute"))
  ctx.welcomeProviderLabel.textContent = t("settings.providersSection")
  ctx.welcomeKeyLabel.textContent = t("settings.providerKey")
  ctx.welcomeSaveBtn.textContent = t("welcome.save")
  ctx.welcomeSkipBtn.textContent = t("welcome.skip") // 值改：「以后再说」/「Later」（登录面补全批）
  ctx.welcomeSettingsBtn.textContent = t("welcome.fullSettings")
  ctx.welcomeKey.value = ""
  const wasHidden = ctx.welcomePanel.style.display !== "flex"
  ctx.welcomePanel.style.display = "flex"
  ctx.welcomePanel.setAttribute("aria-hidden", "false")
  if (wasHidden) _route = "route" // 首屏 = 路由屏（重出场复位；在场推送不平移用户操作）
  applyRoute()
}

function hideWelcomePanel() {
  ctx.welcomePanel.style.display = "none"
  ctx.welcomePanel.setAttribute("aria-hidden", "true")
  if (ctx.welcomeTeamPassword) ctx.welcomeTeamPassword.value = "" // 密码不随生命周期存续
  _route = "route"
}

/** providerStatus-driven: show onboarding when NOTHING is configured; close it once a key lands. */
export function maybeShowWelcome(status, keyOk) {
  if (keyOk) {
    hideWelcomePanel()
    return
  }
  showWelcomePanel(status)
}

ctx.welcomeSaveBtn.addEventListener("click", () => {
  const name = ctx.welcomeProvider.value
  const key = ctx.welcomeKey.value.trim()
  if (name === "custom") {
    // Custom providers need more fields — hand off to the settings panel's add-provider dialog.
    // 键随交棒入框（#1041）：板面不再强制键（框内可补）⇒ 分支前移至键校验之前；预填 = trim 后原串。
    hideWelcomePanel()
    _openSettings?.()
    window._openAddProviderDialog?.({ key })
    return
  }
  if (!key) { ctx.welcomeKey.focus(); return }
  vscode.postMessage({ type: "addProvider", preset: name, key })
  // The panel closes itself when the refreshed providerStatus reports keyOk=true.
})

ctx.welcomeSkipBtn.addEventListener("click", () => {
  S._welcomeDismissed = true
  hideWelcomePanel()
})

ctx.welcomeSettingsBtn.addEventListener("click", () => {
  hideWelcomePanel()
  _openSettings?.()
})

ctx.welcomeKey.addEventListener("keydown", (e) => {
  if (e.key === "Enter") ctx.welcomeSaveBtn.click()
})

// 路由两卡 ∥ 团队回退 ∥ 团队提交（新件可缺位——旧夹具面零抛；生产面恒在场）
ctx.welcomeRouteTeamBtn?.addEventListener("click", () => chooseRoute("team"))
ctx.welcomeRouteLocalBtn?.addEventListener("click", () => chooseRoute("local"))
ctx.welcomeTeamBack?.addEventListener("click", backToRoute)
ctx.welcomeTeamLoginBtn?.addEventListener("click", () => {
  const server = ctx.welcomeTeamServer?.value?.trim() || ""
  const username = ctx.welcomeTeamUsername?.value?.trim() || ""
  const password = ctx.welcomeTeamPassword?.value ?? "" // 凭据零加工（trim 会改凭据）
  setTeamFail(null) // 新尝试清旧提示（提示 = 一次性面）
  vscode.postMessage({ type: "teamLogin", server, username, password })
})
