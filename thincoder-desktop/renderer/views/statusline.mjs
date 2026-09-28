/**
 * statusline.mjs — 状态行族档（D17 / D22 · `docs/desktop/design/UI.md` §1 状态栏行 / §1「本批注（对齐重定位）」项 1 /
 * §1「本批注（状态栏对齐 · 屏面为准）」· `docs/desktop/design/PROJECT.md` §2 KD-25 · KD-30 / §6.1 D17 · D22）：
 * **承载段构树（闭集序）＋ 段装配 ＋ 结构描述符树 ＋ 薄挂载**（屏面单源 = 本档）。
 * 拆档链：自 `renderer/views/chrome.mjs` 拆出（300 行拆分层预案落形 —— `docs/desktop/design/PROJECT.md` §4.2 状态行族档），
 * `chrome.mjs` 同名再出口（消费面零改）；banner 段组出 `renderer/views/statusline-banner.mjs`（模式四位）；
 * **段构建器族出 `renderer/views/statusline-segments.mjs`**（R4 · 桌面功能对位批「先拆后改」—— 届盘 295 越 300 顾问线，
 * 按在册拆点「`numOf` … `enterSegment`」落形；本档引十二构建器 + `badgeCodes`，无环）。
 *
 * 承载 16 段 = `STATUS_SEGMENTS`（序同 CLI —— 注意力 chip 行首 → banner 四态 → 状态段簇）· 旁置 1 = 滚动位（药丸 / 摘要块承载）·
 * 不适用 1 = 键位组（输入区 / 标签条自述）——**后两段零字段 ⇒ 零节点**（不造空段；逐项裁定单源 = `docs/desktop/design/UI.md` §1 本批注项 1）。
 * 承载段数据源（逐段）居段构建器族档（本档只给装配序与切片取值）；段 3 态机（挂起句 / 零节点 / 状态文本 / 运行中 / 就绪）单源 = 同档。
 * **R4（提示锚 + 状态面）**：段 3 态机增**状态文本支**（五 kind —— `ev:statusText` 切片；归约面写者 = `renderer/events-status.mjs`）。
 * 判据（D17 · KD-25）：**未至 / 非正 / 缺片 ⇒ 该段零节点**（禁假造）；段锚 = `data-seg`（闭集 = `STATUS_SEGMENTS`）·
 * 段内件锚 = `data-part`（令牌三件）；跨会话告警位（**他会话**的待审批 / 运行提示 —— 源 = `sessions` 行投影，
 * 会话模型轮 R13：原标签键表随标签裁撤退场）沿既有面（`data-alert` —— 非 16 段之一）。
 * 形态：纯构树（`statusModel` → 态对象 · `statusTree` → 结构描述符树）+ 薄挂载（`mountStatus` = clear + build + append ——
 * **单点重建 = 状态行唯一 writer**，`docs/desktop/design/UI.md` §1 状态栏行）；文案一律经 `t()`（零硬编码）。
 * 零 DOM（挂载一段除外）/ 零 `node:` / 零裸包（渲染面静态闭包判据）。
 */
import { build, clear } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { deriveTabBadge } from "../store.mjs"
import { BANNER_CODES, bannerSegments } from "./statusline-banner.mjs"
import { BADGE_WORD } from "./chrome.mjs"
// 段构建器族（R4 出档 —— 本批先拆后改）：本档只装配（段序 / 切片取值）与构树；逐段判据 = 该档档头与逐函数注释。
import {
  attentionSegment, badgeCodes, contextSegment, elapsedSegment, enterSegment, ledgerSegment, stateSegment,
  tasksSegment, timerSegment, titleSegment, tokensSegment, toolSegment, turnSegment,
} from "./statusline-segments.mjs"

/** 承载 16 段（闭集 · 序 = CLI 序 —— 单源 = `docs/desktop/design/UI.md` §1 本批注项 1；旁置 1 / 不适用 1 不在本集）。
 *  banner 四码取自 `renderer/views/statusline-banner.mjs` `BANNER_CODES`（段构树与段码同源，不两处罗列）。 */
export const STATUS_SEGMENTS = Object.freeze([
  "attention", ...BANNER_CODES, "state", "tool", "elapsed", "tasks", "turn", "tokens", "context", "ledger", "timer", "title", "enter",
])

/** 告警码集（状态栏取值 = 三码中入告警的子集；`done` / `idle` 不入 —— 完成 / 空闲非跨会话告警面）。 */
const ALERT_CODES = Object.freeze(["approval", "running"])

/** 状态行模型：`segments` = 承载 16 段在场集（序 = CLI 序；缺段不占位）· `alerts` = 跨会话告警位（**他会话**两码，
 *  序 = 会话列表序 —— 会话模型轮 R13：源 = `sessions` 行投影〔原 `tabs` 键表随标签裁撤退场〕）。
 *  入参 = 切片面（缺 / 非载体 ⇒ 该段零节点；段 3 支③源 = `statusText[<会话键>]` 切片 —— R4）；`now` 可注入（耗时段现刻 —— 测试缝）。 */
export function statusModel({
  activeSession = null, badges = {}, usage = {}, sessions = [], pending = {},
  blocks = [], tasks = {}, turns = {}, turnStarts = {}, tokens = {}, timers = {}, projectInfo = null,
  sessionFlags = {}, susp = {}, statusText = {}, now = Date.now(),
} = {}) {
  const rows = Array.isArray(sessions) ? sessions : []
  const active = activeSession == null ? null : String(activeSession)
  const codes = badgeCodes(badges, active)
  const flags = sessionFlags !== null && typeof sessionFlags === "object" ? sessionFlags[active] : undefined
  // 段 3 支①源 = `ev:susp` 计数切片（桌面空闲唤醒批）；支③源 = `ev:statusText` 状态文本切片（R4）
  const suspend = susp !== null && typeof susp === "object" ? susp[active] : undefined
  const statusSlice = statusText !== null && typeof statusText === "object" ? statusText[active] : undefined
  const segments = active === null ? [] : [
    attentionSegment(codes),
    ...bannerSegments(flags),
    stateSegment(codes, suspend, statusSlice),
    toolSegment(blocks),
    elapsedSegment(codes, turnStarts, active, now),
    tasksSegment(tasks, active),
    turnSegment(turns, active),
    tokensSegment(tokens, active),
    contextSegment(usage, active),
    ledgerSegment(projectInfo),
    timerSegment(timers, active),
    titleSegment(sessions, active),
    enterSegment(pending, active, codes),
  ].filter((segment) => segment !== null)
  const alerts = []
  for (const row of rows) {
    const key = row === null || row === undefined || row.slot === null || row.slot === undefined ? null : String(row.slot)
    if (key === null || key === "" || key === active) continue
    const code = deriveTabBadge(badgeCodes(badges, key))
    if (ALERT_CODES.includes(code) && typeof BADGE_WORD[code] === "string") alerts.push({ tab: key, code })
  }
  return { alerts, segments }
}

/** 段节点（锚 = `data-seg` 码；警示 class 两形 —— `status-usage-warn` 沿既有面，`status-seg-warn` 为余段单形）。 */
function segNode(segment) {
  const warnClass = segment.class === "status-usage" ? "status-usage-warn" : "status-seg-warn"
  const props = {
    class: segment.class === undefined ? "status-seg" : segment.class,
    "data-seg": segment.code,
    ...(segment.attrs ?? {}),
  }
  if (segment.warn) props.class = `${props.class} ${warnClass}`
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

/** 结构描述符树（根 `data-alerts` = 告警数；子序 = 承载段序 → 告警序）。 */
export function statusTree(model) {
  return {
    tag: "div",
    props: { class: "status-bar", "data-alerts": model.alerts.length },
    children: [...model.segments.map(segNode), ...model.alerts.map(alertNode)],
  }
}

/** 薄挂载（状态树切片 ⇒ 状态行；单点重建 —— 清容器再建，零残留）；返回模型（读数 / 走查面）。 */
export function mountStatus(root, state) {
  if (!root || typeof root.append !== "function") return null
  const model = statusModel({
    activeSession: state?.activeSession ?? null,
    badges: state?.tabBadges ?? {},
    usage: state?.usage ?? {},
    sessions: state?.sessions ?? [],
    pending: state?.pending ?? {},
    blocks: state?.blocks ?? [],
    tasks: state?.tasks ?? {},
    turns: state?.turns ?? {},
    turnStarts: state?.turnStarts ?? {},
    tokens: state?.tokens ?? {},
    timers: state?.timers ?? {},
    projectInfo: state?.projectInfo ?? null,
    sessionFlags: state?.sessionFlags ?? {},
    susp: state?.susp ?? {},
    statusText: state?.statusText ?? {},
  })
  clear(root)
  root.append(build(statusTree(model)))
  return model
}
