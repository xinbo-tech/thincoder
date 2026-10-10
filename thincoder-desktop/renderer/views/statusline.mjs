/**
 * statusline.mjs — 状态行族档（D17 / D22 · `docs/desktop/design/UI.md` §1 状态栏行 / §1「本批注（对齐重定位）」项 1 /
 * §1「本批注（状态栏对齐 · 屏面为准）」· `docs/desktop/design/PROJECT.md` §2 KD-25 · KD-30 / §6.1 D17 · D22）：
 * **承载段构树（闭集序）＋ 段装配 ＋ 结构描述符树 ＋ 薄挂载**（屏面单源 = 本档）。
 * 拆档链：自 `renderer/views/chrome.mjs` 拆出（300 行拆分层预案落形 —— `docs/desktop/design/PROJECT.md` §4.2 状态行族档），
 * `chrome.mjs` 同名再出口（消费面零改）；banner 段组出 `renderer/views/statusline-banner.mjs`（模式四位）；
 * **段构建器族出 `renderer/views/statusline-segments.mjs`**（R4 · 桌面功能对位批「先拆后改」—— 届盘 295 越 300 顾问线，
 * 按在册拆点「`numOf` … `enterSegment`」落形；本档引十三构建器 + `badgeCodes`，无环）。
 *
 * **停滞轻显形批（2026-09-29 · stall-indicator）**：+静默段 `quiet`（承载 16 ⇒ 17，序 = `elapsed` 之后）——
 * 判据 = `quietSegment`（切片 `lastOutputAt`，显示走拍）；语义单源 = `docs/cli/design/TUI.md` §7.7。
 *
 * **登录面补全批（2026-10-10 · 台账 #1231）**：+团队登录态段 `team`（承载 17 ⇒ **18**，序 = `title` 后 ∥ `enter` 前 ——
 * 单源 = `docs/desktop/design/UI.md` §1 表行 16 ∥ 本批注（团队登录态段）；源 = `settings.team` 切片；判据 = 段构建器族
 * `teamSegment`）+ **状态段就地面板**（`div.team-pop` —— 开合态 = 本档模块级单值 `teamPanelOpen`，沿 🎯 目标面板先例；
 * 面板宿主 ∥ 施用面 = `renderer/mount-team.mjs`）：段 = `role="button"` + tabindex + 点 / 键盘 ⇒ `toggleTeamPanel()`；
 * **`team` 段不入「零会话 ⇒ 零段」通则**（无活动会话亦在场——四端同一常显面）。
 *
 * 承载 18 段 = `STATUS_SEGMENTS`（序同 CLI —— 注意力 chip 行首 → banner 四态 → 状态段簇；**18 = 17 + 团队登录态段**（`team`））· 旁置 1 = 滚动位（药丸 / 摘要块承载）·
 * 不适用 1 = 键位组（输入区 / 标签条自述）——**后两段零字段 ⇒ 零节点**（不造空段；逐项裁定单源 = `docs/desktop/design/UI.md` §1 本批注项 1）。
 * **R5 增非段位元素 1** = 🎯 目标徽标（锚 `data-goal` —— **不入 `STATUS_SEGMENTS` 闭集**，沿 `data-alert`「非段位元素」
 * 先例；在场判据随核件 = `renderer/views/goal.mjs` `goalBadgeVisible` —— 非 `active` 态 ⇒ 零节点）。
 * 承载段数据源（逐段）居段构建器族档（本档只给装配序与切片取值）；段 3 态机（挂起句 / 零节点 / 状态文本 / 运行中 / 就绪）单源 = 同档。
 * **R4（提示锚 + 状态面）**：段 3 态机增**状态文本支**（五 kind —— `ev:statusText` 切片；归约面写者 = `renderer/events-status.mjs`）。
 * **R8（台账周期刷新 + L2 明细）**：段 11 台账标记增 **L2 明细行载波**（段 `title` —— 顶层切片 `ledgerDetail`
 * 直传段构建器；判据 / 空集零 title 归 `statusline-segments.mjs` `ledgerSegment`）。
 * **状态行 ⇒ CLI 补漏批（2026-09-29 · 台账 #600）**：段 9 上下文读数改 CLI 形（令牌源 = 切片 `usageTokens` ——
 * `ev:usage` `ctxTokens` 投影；两语词面 = `status.usage`）；段 11 在场判据改**常驻**（源 = 切片 `ledgerMarker` ——
 * `ev:ledger` `marker` 键转发 ∕ 核 `formatMarker` 逐字）；逐段判据 = 段构建器族档。
 * 判据（D17 · KD-25）：**未至 / 非正 / 缺片 ⇒ 该段零节点**（禁假造）；段锚 = `data-seg`（闭集 = `STATUS_SEGMENTS`）·
 * 段内件锚 = `data-part`（令牌三件）；跨会话告警位（**他会话**的待审批 / 运行提示 —— 源 = `sessions` 行投影，
 * 会话模型轮 R13：原标签键表随标签裁撤退场）沿既有面（`data-alert` —— 非段位元素）。
 * 形态：纯构树（`statusModel` → 态对象 · `statusTree` → 结构描述符树）+ 薄挂载（`mountStatus` = clear + build + append ——
 * **单点重建 = 状态行唯一 writer**，`docs/desktop/design/UI.md` §1 状态栏行）；文案一律经 `t()`（零硬编码）。
 * 零 DOM（挂载一段除外）/ 零 `node:` / 零裸包（渲染面静态闭包判据）。
 */
import { build, clear } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { deriveTabBadge } from "../store.mjs"
import { BANNER_CODES, bannerSegments } from "./statusline-banner.mjs"
import { BADGE_WORD } from "./chrome.mjs"
// 目标徽标在场判据 + 开合出口（R5 ∕ #554② —— 判据 = 核件直取：`goalPanelVisible` + `active` 态门；
// 开合 = 本地态与就地施用，住 `renderer/views/goal.mjs`）。
import { goalBadgeVisible, toggleGoalPanel } from "./goal.mjs"
// 段构建器族（R4 出档 —— 本批先拆后改）：本档只装配（段序 / 切片取值）与构树；逐段判据 = 该档档头与逐函数注释。
import {
  attentionSegment, badgeCodes, contextSegment, elapsedSegment, enterSegment, ledgerSegment, quietSegment, stateSegment,
  tasksSegment, teamSegment, timerSegment, titleSegment, tokensSegment, toolSegment, turnSegment,
} from "./statusline-segments.mjs"

/** 团队就地面板开合态（登录面补全批 —— **本地模块级单值**，沿 🎯 目标面板先例；非 store 切片：开合 = 瞬时 UI 态，
 *  零跨窗 ∥ 零持久面）。段（`segment.code === "team"`）点 / 键盘 ⇒ `toggleTeamPanel()`；面板宿主（`div.team-pop`）
 *  = `renderer/mount-team.mjs`，施用面经 `setTeamPanelApplier` 装配期注册（本档零 DOM、零面板树）；
 *  applier 缺（未装配 ∥ 测试面）⇒ 翻态零动作（下次装配按新态出件 —— 沿 🎯「无卡 ⇒ 零动作」同判）。 */
let teamPanelOpen = false
let applyTeamPanel = null

/** 面板现态读数（宿主 ∥ 判据面取用）。 */
export function teamPanelVisible() {
  return teamPanelOpen
}

/** 面板态唯一写点（翻转 ∥ 关两出口共用；同值 ⇒ 零发）。 */
function setTeamPanelState(next) {
  if (next === teamPanelOpen) return teamPanelOpen
  teamPanelOpen = next
  if (applyTeamPanel !== null) applyTeamPanel(teamPanelOpen)
  return teamPanelOpen
}

/** 段出口：翻转（段再点 = 开合两用；Esc ∥ 面板外点击 ⇒ `closeTeamPanel`）。 */
export function toggleTeamPanel() {
  return setTeamPanelState(!teamPanelOpen)
}

/** 面板关出口（Esc ∥ 面板外点击 —— 幂等：已合 ⇒ 零发）。 */
export function closeTeamPanel() {
  return setTeamPanelState(false)
}

/** 施用面注册（装配期一次 —— `mount-team.mjs` 注入面板宿主施用函数；非函数 ⇒ 注销）。 */
export function setTeamPanelApplier(fn) {
  applyTeamPanel = typeof fn === "function" ? fn : null
}

/** 承载 18 段（闭集 · 序 = CLI 序 —— 单源 = `docs/desktop/design/UI.md` §1 本批注项 1 + 「本批注（停滞轻显形 · 2026-09-29）」
 *  + 「本批注（团队登录态段 · 2026-10-10）」表行 16；旁置 1 / 不适用 1 不在本集）。
 *  banner 四码取自 `renderer/views/statusline-banner.mjs` `BANNER_CODES`（段构树与段码同源，不两处罗列）。 */
export const STATUS_SEGMENTS = Object.freeze([
  "attention", ...BANNER_CODES, "state", "tool", "elapsed", "quiet", "tasks", "turn", "tokens", "context", "ledger", "timer", "title", "team", "enter",
])

/** 告警码集（状态栏取值 = 三码中入告警的子集；`done` / `idle` 不入 —— 完成 / 空闲非跨会话告警面）。 */
const ALERT_CODES = Object.freeze(["approval", "running"])

/** 状态行模型：`segments` = 承载 18 段在场集（序 = CLI 序；缺段不占位）· `alerts` = 跨会话告警位（**他会话**两码，
 *  序 = 会话列表序 —— 会话模型轮 R13：源 = `sessions` 行投影〔原 `tabs` 键表随标签裁撤退场〕）。
 *  入参 = 切片面（缺 / 非载体 ⇒ 该段零节点；段 3 支③源 = `statusText[<会话键>]` 切片 —— R4）；`now` 可注入（耗时段 ∕ 静默段现刻 —— 测试缝）。
 *  **登录面补全批**：`team` = `settings.team` 切片（段 16 —— 三态判序归 `teamSegment`）；**不入「零会话 ⇒ 零段」通则**
 *  （无活动会话时仅团队段在场——常显面）。 */
export function statusModel({
  activeSession = null, badges = {}, usage = {}, usageTokens = {}, sessions = [], pending = {},
  blocks = [], tasks = {}, turns = {}, turnStarts = {}, lastOutputAt = {}, tokens = {}, timers = {},
  sessionFlags = {}, susp = {}, statusText = {}, goal = {}, ledgerDetail = [], ledgerMarker = null, team = {}, now = Date.now(),
} = {}) {
  const rows = Array.isArray(sessions) ? sessions : []
  const active = activeSession == null ? null : String(activeSession)
  const codes = badgeCodes(badges, active)
  const flags = sessionFlags !== null && typeof sessionFlags === "object" ? sessionFlags[active] : undefined
  // 段 3 支①源 = `ev:susp` 计数切片（桌面空闲唤醒批）；支③源 = `ev:statusText` 状态文本切片（R4）；
  // 段 14 窗在场判据同源（重建保真 ∕ 留端清算族批 · #581 —— 窗内 Enter = 入队）
  const suspend = susp !== null && typeof susp === "object" ? susp[active] : undefined
  const statusSlice = statusText !== null && typeof statusText === "object" ? statusText[active] : undefined
  // 非段位元素源 = `ev:goal` 切片（R5）；在场判据随核件（闸内 = 非段位元素 —— 不入段集）
  const goalSlice = goal !== null && typeof goal === "object" ? goal[active] : undefined
  // 段 16 团队登录态（登录面补全批）：**不入「零会话 ⇒ 零段」通则**（无会话亦在场——唯一例外；单源 = `UI.md` §1 本批注）
  const teamSeg = teamSegment(team)
  const segments = active === null ? [teamSeg].filter((segment) => segment !== null) : [
    attentionSegment(codes),
    ...bannerSegments(flags),
    stateSegment(codes, suspend, statusSlice),
    toolSegment(blocks),
    elapsedSegment(codes, turnStarts, active, now),
    quietSegment(codes, lastOutputAt, active, now),
    tasksSegment(tasks, active),
    turnSegment(turns, active),
    tokensSegment(tokens, active),
    contextSegment(usage, usageTokens, active),
    ledgerSegment(ledgerMarker, ledgerDetail),
    timerSegment(timers, active),
    titleSegment(sessions, active),
    teamSeg,
    enterSegment(pending, active, codes, suspend),
  ].filter((segment) => segment !== null)
  const alerts = []
  for (const row of rows) {
    const key = row === null || row === undefined || row.slot === null || row.slot === undefined ? null : String(row.slot)
    if (key === null || key === "" || key === active) continue
    const code = deriveTabBadge(badgeCodes(badges, key))
    if (ALERT_CODES.includes(code) && typeof BADGE_WORD[code] === "string") alerts.push({ tab: key, code })
  }
  return { alerts, segments, goal: goalBadgeVisible(goalSlice) }
}

/** 段节点（锚 = `data-seg` 码；警示 class 两形 —— `status-usage-warn` 沿既有面，`status-seg-warn` 为余段单形）。
 *  **团队段（`code === "team"`）= 可点件**（登录面补全批）：`role="button"` + tabindex（键盘可达）+ 点 / Enter ∥ Space
 *  ⇒ `toggleTeamPanel()`（键面沿 🎯 目标徽标先例 —— 点按 + 两键）。 */
function segNode(segment) {
  const warnClass = segment.class === "status-usage" ? "status-usage-warn" : "status-seg-warn"
  const props = {
    class: segment.class === undefined ? "status-seg" : segment.class,
    "data-seg": segment.code,
    ...(segment.attrs ?? {}),
  }
  if (segment.warn) props.class = `${props.class} ${warnClass}`
  if (segment.code === "team") {
    props.role = "button"
    props.tabindex = "0"
    props.onClick = () => { toggleTeamPanel() }
    props.onKeydown = (event) => {
      if (event?.key !== "Enter" && event?.key !== " ") return
      event?.preventDefault?.()
      toggleTeamPanel()
    }
  }
  return {
    tag: "span",
    props,
    children: segment.parts.map((part) => (part.anchor === undefined
      ? part.text
      : { tag: "span", props: { class: "status-part", "data-part": part.anchor }, children: [part.text] })),
  }
}

/** 跨会话告警节点（既有面 —— 词面 = 位标码词键，与标签位同源同词）。 */
function alertNode(alert) {
  return {
    tag: "span",
    props: { class: "status-alert", "data-alert": alert.code, "data-tab": alert.tab },
    children: [t(BADGE_WORD[alert.code])],
  }
}

/** 目标徽标节点（**非段位元素** —— 修正 1 定形①：不入 `STATUS_SEGMENTS` 闭集；沿 `data-alert` 先例）：字形 = `🎯`
 *  （VSC `status-bar.js:24` 逐字；字形非词表项）；可及名经词表（`status.goal`）；**点击面 = 本地开合**（#554② ——
 *  VSC `status-bar.js:74-83` 切 `#goal-panel` 的桌面对位：零新通道，开合态住 `views/goal.mjs`；键面沿桌面可点
 *  节点通则 —— 点按 + Enter ∕ Space）。 */
function goalNode() {
  return {
    tag: "span",
    props: {
      class: "status-goal", "data-goal": "", "aria-label": t("status.goal"),
      role: "button", tabindex: "0",
      onClick: () => { toggleGoalPanel() },
      onKeydown: (event) => {
        if (event?.key !== "Enter" && event?.key !== " ") return
        event?.preventDefault?.()
        toggleGoalPanel()
      },
    },
    children: ["🎯"],
  }
}

/** 结构描述符树（根 `data-alerts` = 告警数；子序 = 承载段序 → **目标徽标（R5）** → 告警序）。 */
export function statusTree(model) {
  return {
    tag: "div",
    props: { class: "status-bar", "data-alerts": model.alerts.length },
    children: [...model.segments.map(segNode), ...(model.goal === true ? [goalNode()] : []), ...model.alerts.map(alertNode)],
  }
}

/** 段等价判据（面内差分门同件 —— 段码 / class / warn / attrs / 逐段文本全等）。 */
function sameSegment(a, b) {
  if (a.code !== b.code || a.class !== b.class || a.warn !== b.warn) return false
  const ka = Object.keys(a.attrs ?? {})
  const kb = Object.keys(b.attrs ?? {})
  if (ka.length !== kb.length || !ka.every((key) => a.attrs[key] === b.attrs?.[key])) return false
  return a.parts.length === b.parts.length && a.parts.every((part, idx) => part.text === b.parts[idx].text && part.anchor === b.parts[idx].anchor)
}

/** 模型等价判据（**面内差分门** —— 更新纪律收核批：等价 ⇒ 零写；覆盖树面全部消费字段：段序 / 告警序 / 目标徽标）。 */
export function sameStatusModel(a, b) {
  if (a === b) return true
  if (!a || !b) return false
  if (a.goal !== b.goal) return false
  if (a.alerts.length !== b.alerts.length || !a.alerts.every((row, idx) => row.tab === b.alerts[idx].tab && row.code === b.alerts[idx].code)) return false
  return a.segments.length === b.segments.length && a.segments.every((seg, idx) => sameSegment(seg, b.segments[idx]))
}

/** 薄挂载（状态树切片 ⇒ 状态行；单点重建 —— 清容器再建，零残留）；返回模型（读数 / 走查面）。
 *  **面内差分门（更新纪律收核批 · KD-48 ④）**：新模型与上帧模型等价 ⇒ **零写**（子节点身份不变 —— 帧界
 *  高频繁调下免整面重建；`blocks` 保持入键：工具段更新点随块面）；判据面 = `sameStatusModel`。 */
export function mountStatus(root, state) {
  if (!root || typeof root.append !== "function") return null
  const model = statusModel({
    activeSession: state?.activeSession ?? null,
    badges: state?.tabBadges ?? {},
    usage: state?.usage ?? {},
    usageTokens: state?.usageTokens ?? {},
    sessions: state?.sessions ?? [],
    pending: state?.pending ?? {},
    blocks: state?.blocks ?? [],
    tasks: state?.tasks ?? {},
    turns: state?.turns ?? {},
    turnStarts: state?.turnStarts ?? {},
    lastOutputAt: state?.lastOutputAt ?? {},
    tokens: state?.tokens ?? {},
    timers: state?.timers ?? {},
    ledgerDetail: state?.ledgerDetail ?? [],
    ledgerMarker: state?.ledgerMarker ?? null,
    sessionFlags: state?.sessionFlags ?? {},
    susp: state?.susp ?? {},
    statusText: state?.statusText ?? {},
    goal: state?.goal ?? {},
    team: state?.settings?.team ?? {}, // 段 16 团队登录态（登录面补全批——切片 = `settings.team`；`STATUS_KEYS` 含 `settings`）
  })
  if (sameStatusModel(root._statusModel, model)) return model // 面内差分门：模型等价 ⇒ 零写
  clear(root)
  root.append(build(statusTree(model)))
  root._statusModel = model
  return model
}
