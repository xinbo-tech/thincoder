/**
 * cmd-team.mjs — `/team` 命令族 + 会话内团队问句面（登录面补全批 · 2026-10-10 · 台账 #1229）。
 * 设计单源 = `docs/cli/design/TUI-COMMANDS.md` §5.5（三子命令 ∥ 问句面）∥ §1（模块地图）；
 * 机制单源 = `docs/core/design/TEAM.md` §2.2（登录）∥ §2.3（退出）∥ §2.6（活校验 ∥ verify 清位）。
 * 词面 = argv 面逐字同源（`src/cli/team-command.mjs` 导出面——判据「CLI = 单语直出同句」；
 * 本档零第二份字面）。两消费方：① 本档 `handleTeamCommand`（注册 = `slash-commands.mjs` 两表）；
 * ② `wizard.mjs` 团队路（`completeTeamLogin` ∥ `syncProvidersFromDisk` ∥ `refreshTeamState` 三件共用）。
 *
 * 问句面（模态族第三支）：`state.teamAsk` = { step, fields, error, busy, scroll, lines }——
 * 键面 = `key-handler.mjs` 序 2 守卫 + `key-handler-modals.mjs` `handleTeamAskKeys`（Esc 取消 ∥
 * Enter 提交；可打印键回落编辑族）；render 面 = `layout.mjs` overlay 第三支（掩码步经 `ask-steps.mjs`
 * `askMaskActive`）；模态判据 = `timer-watch.mjs` `modalOpen`（#448① 模态期抑制 ∥ 关闭后补评估同谓词）。
 *
 * ctx（两调用面同源字段）：{ agent, state, pushLine, render, openModelPicker, onModalClose }
 */
import { t } from "@thincoder/core/i18n.mjs"
import { teamLogin, teamLogout, teamStatus, teamVerify, NOTICE_MANUAL_NAME_CONFLICT } from "@thincoder/core/team.mjs"

import { C } from "./ansi.mjs"
import { teamAskLines, teamAskStepAt, nextTeamAskStep } from "./ask-steps.mjs"
import {
  FAILURE_TEXT, NOT_LOGGED_IN, TEXT_MANUAL_CONFLICT, TEXT_REVOKE_UNDELIVERED,
  TEXT_LOGGED_IN, TEXT_LOGGED_OUT, renderState,
} from "../cli/team-command.mjs"

/** 用法行（表外子命令 ∥ 多余参数 ⇒ 零动作 + 用法——沿 argv 面 fail-closed 同口径；词面改指 TUI 入口）。 */
export const TEAM_USAGE = "Usage: /team login | /team logout | /team status"

/** 模型选定引导行（本地路尾同句——`wizard.mjs` finishWizard 与本档两处消费，单源）。 */
export const MODEL_SELECT_HINT = "Select a model (选定即成为默认模型；Esc 跳过——之后可用 /model 选定)"

// ─── 命令族（TUI-COMMANDS.md §5.5）────────────────────────────────────────────────────────────

/** `/team` 入口（注册 = `SLASH_COMMANDS` + `HANDLERS`）：
 *  `/team` ∥ `/team status` = 状态面（活校验）；`/team login` = 三问面；`/team logout` = 退出；
 *  表外子命令 ∥ 多余参数 ⇒ usage（fail-closed——零动作）。 */
export async function handleTeamCommand(ctx, args = []) {
  const [sub] = args
  const known = sub === undefined || sub === "status" || sub === "login" || sub === "logout"
  if (!known || args.length > 1) {
    ctx.pushLine(TEAM_USAGE, C.warn)
    ctx.render()
    return
  }
  if (sub === undefined || sub === "status") return runTeamStatus(ctx)
  if (sub === "login") return startTeamAsk(ctx)
  return runTeamLogout(ctx)
}

/** `/team` ∥ `/team status`：未登录 ⇒ 未登录句逐字；已登录 ⇒ argv `team status` 同形三行 +
 *  活校验（`invalid` ⇒ 追词句；`unreachable` ⇒ 照本地零行——离线容忍）。活校验结果回填 =
 *  `state.team.verify`（写者③会话内点）。 */
async function runTeamStatus(ctx) {
  const { state, pushLine, render } = ctx
  const st = teamStatus()
  if (st.loggedIn !== true) {
    pushLine(NOT_LOGGED_IN, C.dim)
    refreshTeamState(state) // token 缺席 ⇒ verify 清（TEAM.md §2.6 清位）
    return
  }
  for (const line of renderState(st)) pushLine(line, C.dim)
  const v = await teamVerify()
  refreshTeamState(state)
  state.team.verify = v?.state ?? null
  if (v?.state === "invalid") pushLine(t("status.team.invalid"), C.warn) // 词面单源 = 核字典键
  render()
}

/** `/team login`：开三问面（地址 → 账号 → 密码）。字段预填 = 核留存快照（TEAM.md §2.1
 *  member 行「表单预填」——桌面表单同款）；密码零预填 ∥ 零留存（§3.1 保真判据）。 */
function startTeamAsk(ctx) {
  const { state } = ctx
  if (state.teamAsk != null) return // 面在场（重入零动作——键面已归该面）
  const st = teamStatus()
  state.teamAsk = {
    step: "server",
    fields: { server: st.server ?? "", username: st.member?.username ?? "" },
    error: null,
    busy: false, // 提交在途重入闸（teamLogin await 期 Enter 零动作）
    scroll: 0, // overlay 契约位（layout/renderPicker 读）
    lines: [],
  }
  enterTeamAskStep(ctx, "server")
}

/** 步入场：步名 ⇒ 问句屏行 + 输入框预填（地址 ∥ 账号；掩码步恒空）∥ 错误清。 */
function enterTeamAskStep(ctx, step) {
  const { state } = ctx
  const face = state.teamAsk
  const def = teamAskStepAt(step)
  face.step = step
  face.error = null
  face.lines = teamAskFaceLines(face)
  const value = def.mask ? "" : (face.fields[def.field] ?? "")
  state.input = [...value]
  state.cursor = state.input.length
  ctx.render()
}

/** 面体行构造（问句屏 + 就地失败行——「败 ⇒ 四句逐字就地出 + 停留可重试」：面在场、步不动）。 */
function teamAskFaceLines(face) {
  const lines = teamAskLines(face.step, face.fields)
  if (face.error) lines.push({ text: ` ${face.error}`, color: C.error })
  return lines
}

/** 问句面提交（Enter——键面转口）：步内推进；末步 ⇒ 核 `teamLogin`。
 *  成 ⇒ 面退场 + `completeTeamLogin`；败 ⇒ 四句逐字就地 + 停留（步不动、输入框清空——密码零留存）。 */
export async function teamAskSubmit(ctx) {
  const { state, render } = ctx
  const face = state.teamAsk
  if (face == null || face.busy === true) return
  const def = teamAskStepAt(face.step)
  if (def === null) return
  const raw = state.input.join("")
  const value = def.trim ? raw.trim() : raw
  if (!def.mask) face.fields[def.field] = value // 掩码步（密码）零留存——不入面体态
  const next = nextTeamAskStep(def.step)
  if (next !== null) { enterTeamAskStep(ctx, next); return }
  face.busy = true
  try {
    const result = await teamLogin({ server: face.fields.server, username: face.fields.username, password: value })
    if (state.teamAsk !== face) return // 在途退场（Esc）⇒ 零动作
    if (result.ok !== true) {
      face.error = FAILURE_TEXT[result.reason] ?? FAILURE_TEXT.network
      face.lines = teamAskFaceLines(face)
      state.input = []
      state.cursor = 0
      render()
      return
    }
    state.teamAsk = null
    state.input = []
    state.cursor = 0
    await completeTeamLogin(ctx, result)
  } finally {
    face.busy = false
  }
}

/** 问句面取消（Esc——键面转口）：面退场（输入框归还——清空 + 光标归零）；零行（零新文案）。
 *  #448①：用户自发模态退场 ⇒ 闩重武装（同 picker ∥ wizard 关闭点）。 */
export function teamAskCancel(ctx) {
  const { state, render } = ctx
  if (state.teamAsk == null) return
  state.teamAsk = null
  state.input = []
  state.cursor = 0
  render()
  ctx.onModalClose?.()
}

/** `/team logout`：未登录 ⇒ 未登录句（幂等——零动作）；已登录 ⇒ 核 `teamLogout` ⇒ 结果行 +
 *  吊销未达一次性提示（逐字）+ 两复读（token 摘除 ⇒ verify 清 ∥ 派生条目失 key ⇒ 候选面隐藏）。 */
async function runTeamLogout(ctx) {
  const { agent, state, pushLine, render } = ctx
  if (teamStatus().loggedIn !== true) {
    pushLine(NOT_LOGGED_IN, C.dim)
    return
  }
  const result = await teamLogout()
  if (result.ok !== true) {
    pushLine(FAILURE_TEXT[result.reason] ?? FAILURE_TEXT.network, C.error)
    render()
    return
  }
  pushLine(TEXT_LOGGED_OUT, C.tool)
  if (result.revokeDelivered === false) pushLine(TEXT_REVOKE_UNDELIVERED, C.warn)
  refreshTeamState(state)
  await syncProvidersFromDisk(agent)
  render()
}

// ─── 两消费方共用的登录成后收尾 ∥ 复读件 ───────────────────────────────────────────────────────

/** 登录成后公共收尾（向导团队路 ∥ `/team login` 同源）：
 *  ① 结果行（argv 同形：`Logged in.` + server/member/label 三行）；② 同名冲突一次性提示（逐字）；
 *  ③ 两复读——渠道列表（`agent.providers` ← 磁盘：模型 picker 候选随含 `team` 派生条目）∥
 *  `state.team`（`clearVerify`——重登成 ⇒ verify 清、新 token 新判：TEAM.md §2.6）；
 *  ④ `defaultModel` 未设 ⇒ 追开模型 picker（「登录成即用」；已设 ⇒ 零打断——同本地路尾）。
 *  调用方须已退场其模态面（向导 ∥ 问句面）——本函数只做收尾与闩重武装。 */
export async function completeTeamLogin(ctx, result) {
  const { agent, state, pushLine } = ctx
  pushLine(TEXT_LOGGED_IN, C.tool)
  for (const line of renderState(teamStatus())) pushLine(line, C.dim)
  if (result?.notice === NOTICE_MANUAL_NAME_CONFLICT) pushLine(TEXT_MANUAL_CONFLICT, C.warn)
  const cfg = await syncProvidersFromDisk(agent)
  refreshTeamState(state, { clearVerify: true })
  ctx.render()
  if (typeof cfg?.defaultModel === "string" && cfg.defaultModel !== "") {
    ctx.onModalClose?.() // 模态面已退且零弹面 ⇒ 闩重武装
    return
  }
  pushLine(MODEL_SELECT_HINT, C.dim)
  ctx.openModelPicker()
    .catch((e) => pushLine(`[error] ${e?.message ?? e}`, C.error))
    .then(() => { if (state.picker == null && state.wizard == null && state.teamAsk == null) ctx.onModalClose?.() })
}

/** 渠道列表复读（磁盘 → 会话内存）：核 `loadConfig` 全量读 + proxy 归一（与 `/config` reloadConfig
 *  同链）⇒ 替换 `agent.providers`（模型 picker 候选活读面）；会话槽值零触碰（已设 `defaultModel`
 *  零打断——模型选定仍由用户显式走 picker）。返回读到的 cfg（`defaultModel` 门判据）。 */
export async function syncProvidersFromDisk(agent) {
  const { loadConfig } = await import("@thincoder/core/config.mjs")
  const { injectProxy } = await import("@thincoder/core/proxy.mjs")
  const cfg = loadConfig()
  injectProxy(cfg.providersList, cfg)
  agent.providers = cfg.providersList
  return cfg
}

/** `state.team` 复读（TUI.md §7.8 写者②）：核 `teamStatus()` 投影 ⇒ 切片五键。
 *  清位（TEAM.md §2.6）：token 缺席 ⇒ `verify` 不存续；`clearVerify`（重登成 ∥ 启动读）同清。 */
export function refreshTeamState(state, { clearVerify = false } = {}) {
  const st = teamStatus()
  const loggedIn = st.loggedIn === true
  state.team = {
    loggedIn,
    member: st.member ?? null,
    server: st.server ?? null,
    label: st.label ?? null,
    verify: loggedIn && !clearVerify ? (state.team?.verify ?? null) : null,
  }
  return state.team
}

/** 启动装配（写者①+③）：同步读 `teamStatus()`（随装，零阻塞）+ token 在场 ⇒ `teamVerify()`
 *  异步回填（回填当拍 render；核件不抛、失败零行——`unreachable` 已是核内常态，离线容忍）。 */
export function initTeamState({ state, render }) {
  refreshTeamState(state, { clearVerify: true })
  if (state.team.loggedIn !== true) return
  teamVerify()
    .then((v) => { state.team.verify = v?.state ?? null; render() })
    .catch(() => { /* 校验失败零行（离线容忍——不假报失效） */ })
}
