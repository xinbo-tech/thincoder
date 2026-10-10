/**
 * team-surface.mjs — VSC 团队常显与直达（F-W21 · 登录面补全批 · 2026-10-10 · 台账 #1231）。
 *
 * 面（`docs/vsc/design/WEBVIEW.md` §4.12；语义单源 = `docs/core/design/TEAM.md` §2.5 ∥ §2.6）：
 *   ① 状态栏 item（Right ∥ 优先级 98——台账 item 99 邻位）：三态闭集 = 未登录入口 ∥ 已登录成员名
 *      （正文；tooltip = 服务器 host + 端标签——不搬 URL 全串）∥ 已失效（`verify === invalid` ⇒
 *      文本「已失效——重新登录」+ 警示底色）；命令 = `thincoder.team`（点击即登/退流）。
 *   ② 命令 `thincoder.team`（命令面板 ∥ item 点击同入口）：起手 = 活校验（`teamVerify`——触发点制；
 *      零周期轮询）⇒ 未登录 ∥ 已失效 ⇒ 登录三问（server 预填留存值 → username → password 掩码）
 *      ⇒ 核 `teamLogin`；已登录 ⇒ QuickPick「退出登录」⇒ 核 `teamLogout`。
 *      成 ⇒ 复读 + 刷新 item + 推 `teamStatus`/`providerStatus`（设置面板随动——既有推送链）；
 *      两一次性提示逐字（同名冲突 ∥ 吊销未达）；败 ⇒ 四句逐字（`showErrorMessage`——词表复用）。
 *
 * 纪律：写面全在核（本档零自写盘）；经转口档 `./team.mjs` 取核（转口四件——与桌面
 * `thincoder-desktop/src/main/team.mjs` 同拍）；`unreachable` 不判失效（离线容忍——401 单判）；
 * `verify` 清位 = token 缺席 ⇒ 即清 ∥ 重登成 ⇒ 清（TEAM.md §2.6 不变式）；零周期轮询
 * （触发点 = 启动 ∥ 命令起手）。
 */
import * as vscode from "vscode"
import { t } from "../i18n.mjs"
import { teamStatus, teamVerify, teamLogin, teamLogout } from "./team.mjs"
import { pushTeamStatus } from "./settings.mjs"

/** item 名（状态栏右键菜单面）。 */
const ITEM_NAME = "ThinCoder Team"

/** 失败理由域（码 → 词键——四值闭集单源 = `TEAM.md` §2.5；文本归端侧 i18n，词键与 webview 面同源）。 */
const FAIL_WORD = Object.freeze({
  network: "settings.team.fail.network",
  credentials: "settings.team.fail.credentials",
  rate_limited: "settings.team.fail.rateLimited",
  write_failed: "settings.team.fail.writeFailed",
})

/** 一次性提示码表（`notice` = 码不携文——同名冲突；吊销未达 = 回执 `revokeDelivered === false`）。 */
const NOTICE_WORD = Object.freeze({
  "manual-name-conflict": "settings.team.notice.manualNameConflict",
})

let _item = null
let _chatPanel = null
/** 最近一次活校验值：`null` 未验 ∥ `"valid"` ∥ `"invalid"` ∥ `"unreachable"`（TEAM.md §2.6 态模型）。 */
let _verify = null

/** 码 → 词：表内出词；表外原样直传；缺 ∥ 空 ⇒ `null`（零节点——沿 webview 面同式）。 */
function wordOf(table, code) {
  if (code === null || code === undefined || code === "") return null
  return Object.hasOwn(table, code) ? t(table[code]) : String(code)
}

/** 失败串归一：回执 `reason` 非空串 ⇒ 直传（表外原样——零吞）；缺 ⇒ 形判码（零静默——与桌面同式）。 */
function reasonOf(receipt) {
  return typeof receipt?.reason === "string" && receipt.reason !== "" ? receipt.reason : "invalid-shape"
}

/** 成员显示名（`member.name ?? member.username`——设计字面同序；两缺 ⇒ 「—」）。 */
function memberText(member) {
  if (!member || typeof member !== "object") return "—"
  return member.name ?? member.username ?? "—"
}

/** 服务器 host（tooltip 面——不搬 URL 全串；不可解析 ⇒ 原串）。 */
function hostOf(server) {
  const text = typeof server === "string" ? server : ""
  try { return new URL(text).host || text } catch { return text }
}

/** tooltip = 服务器 host + 端标签（两缺 ⇒ `undefined`——零工具提示）。 */
function teamTooltip(st) {
  const parts = [hostOf(st.server), typeof st.label === "string" ? st.label : ""].filter(Boolean)
  return parts.length > 0 ? parts.join(" · ") : undefined
}

/** item 三态渲染（纯读入参——零网络）：① 未登录 ⇒ 入口 ② 已失效 ⇒ 警示句 + warning 底 ③ 否则成员名。 */
function renderItem(st, verify) {
  if (!_item) return
  if (st.loggedIn !== true) {
    _item.text = t("status.team.entry")
    _item.tooltip = undefined
    _item.backgroundColor = undefined
  } else if (verify === "invalid") {
    _item.text = t("status.team.invalid")
    _item.tooltip = teamTooltip(st)
    _item.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground")
  } else {
    _item.text = memberText(st.member)
    _item.tooltip = teamTooltip(st)
    _item.backgroundColor = undefined
  }
  _item.show()
}

/** 复读 + 渲染（零网络）。`verify` 清位：token 缺席 ⇒ 即清（不变式 = token 缺席 ⇒ verify 不存续）。 */
function refreshItem() {
  const st = teamStatus()
  if (st.loggedIn !== true) _verify = null
  renderItem(st, _verify)
}

/** 触发点制：活校验（只读三值；`unreachable` 不判失效——离线容忍）⇒ 落 `_verify` + 刷新 item。 */
async function liveCheck() {
  const st = teamStatus()
  if (st.loggedIn !== true) {
    _verify = null
    renderItem(st, _verify)
    return null
  }
  const r = await teamVerify()
  _verify = r?.state ?? "unreachable"
  renderItem(st, _verify)
  return _verify
}

/** 成拍三件：复读 + 刷新 item + 推送（`teamStatus` ∥ `providerStatus`——既有推送链，设置面板随动）。 */
function afterChange() {
  refreshItem()
  pushTeamStatus(_chatPanel?._panel)
  _chatPanel?._pushStatus?.()
}

/** 登录流（未登录 ∥ 已失效两态共用）：三问（server 预填留存值 → username → password 掩码）。 */
async function loginFlow() {
  const st = teamStatus()
  const server = await vscode.window.showInputBox({ prompt: t("settings.team.server"), value: st.server ?? "" })
  if (server === undefined) return
  const username = await vscode.window.showInputBox({ prompt: t("settings.team.username"), value: st.member?.username ?? "" })
  if (username === undefined) return
  const password = await vscode.window.showInputBox({ prompt: t("settings.team.password"), password: true })
  if (password === undefined) return
  const r = await teamLogin({ server, username, password })
  if (r?.ok === true) {
    _verify = null // 重登成 ⇒ verify 清（新 token 新判——TEAM.md §2.6）
    afterChange()
    const notice = wordOf(NOTICE_WORD, r.notice)
    if (notice !== null) vscode.window.showWarningMessage(notice)
  } else {
    vscode.window.showErrorMessage(wordOf(FAIL_WORD, reasonOf(r)))
  }
}

/** 退出流（已登录态）：QuickPick 单选项 ⇒ 核 `teamLogout`（吊销 best-effort——网络失败照清本地）。 */
async function logoutFlow() {
  const pick = await vscode.window.showQuickPick([t("settings.team.logout")])
  if (pick === undefined) return
  const r = await teamLogout()
  if (r?.ok === true) {
    afterChange()
    if (r.revokeDelivered === false) vscode.window.showWarningMessage(t("settings.team.notice.revokeUndelivered"))
  } else {
    vscode.window.showErrorMessage(wordOf(FAIL_WORD, reasonOf(r)))
  }
}

/** 命令 `thincoder.team` 处理体（`extension.mjs` 注册；item 点击与之同入口）。 */
export async function runTeamCommand() {
  const st = teamStatus()
  const verify = st.loggedIn === true ? await liveCheck() : null
  if (st.loggedIn !== true || verify === "invalid") return loginFlow()
  return logoutFlow()
}

/** item 建立 + 启动触发点①（token 在场 ⇒ 启动一次活校验）——`extension.mjs` activate 调用；幂等。 */
export async function initTeamSurface(chatPanel = null) {
  _chatPanel = chatPanel
  if (!_item) {
    _item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 98)
    _item.name = ITEM_NAME
    _item.command = "thincoder.team"
  }
  refreshItem()
  if (teamStatus().loggedIn !== true) return
  try { await liveCheck() } catch (e) { console.error("[thincoder] team verify failed:", e) }
}

/** 刷新面（webview 侧登/退成拍随动——`panel-messages-settings.mjs` 成功径调用；item 缺失 ⇒ 空转）。
 *  `verify` 清位（TEAM.md §2.6 不变式——新 token 新判）：该出口仅成拍调用，重登成 ⇒ 清；
 *  登出拍 token 缺席 ⇒ 复读即清（`refreshItem` 内同判）。 */
export function refreshTeamSurface() {
  _verify = null
  refreshItem()
}

/** item 销毁（`extension.mjs` deactivate 调用；幂等）。 */
export function disposeTeamSurface() {
  _item?.dispose?.()
  _item = null
  _chatPanel = null
}
