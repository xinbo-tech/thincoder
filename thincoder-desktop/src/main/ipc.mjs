/**
 * ipc.mjs — IPC 通道处理体本体 + 宿主注入面（`docs/desktop/design/IPC.md` §1 / §2）：**四十八项**白名单面（菜单体系批 · D36 落 `theme:state`；消化面留档批 · #719 落 `record:append`；子代理面板批落 `panel:state`）=
 * 本档（配置读取 + 项目面 `project:open` / `project:recent` + 会话面 `sessions:list` / `session:create` /
 * `session:switch` / `session:rename` / `session:delete` / `session:resume` + 审批响应 `approval:respond` +
 * 作答响应 `question:respond` —— `question` 工具真作答面 + 历史页 `history:page` + 回合驱动 `msg:send` /
 * `msg:interrupt`（宿主未注入 ⇒ fail-loud）+ 会话级偏好写面 `session:prefs` + 子 agent 停止出口 `subagent:stop`
 * （R3b 落）+ 文件链接打开 `file:open`（「对齐第三批」相抵② · KD-39 —— 编辑器 CLI 探测 ⇒ spawn
 * (`editor-open.mjs`)；兜底 `shell.openPath`；纯判据面住 `file-links.mjs`）+ R1 输入面板两项 `session:flags` /
 * `at:complete` + 会话维护线两项 `session:gc` / `session:index` + **消化面留档批一**（`record:append` —— 末位 46）+ **菜单体系批一**（`theme:state` —— 勾选态回读，末位 47）+ **子代理面板批一**（`panel:state` —— 渲染面实况回读上报（渲染→主单向；`PANEL-READBACK.md` §2.1），末位 48）—— 白名单末位）+ **转口群二十四项出档
 * `ipc-relays.mjs`**（#685 拆点 —— 331 ⇒ 两档 ⇒ 越 300 回线）：索引数据面两 + 设置族十九（provider 八 /
 * model 两 / agent 参数 / MCP 六 / env / tools）+ 台账相位两 / 配置写——逐项一参数纯转口（本档零算法副本）。
 * 跨档接线：两档同取 `currentCwd`；本档**新导出** `liveAgents`（mcp 四转口随动面取用 —— 单向
 * `ipc-relays.mjs → ipc.mjs`，零环）；注册面（`HANDLERS` 表 ∕ 注册序 ∕ 白名单 ∕ `main.mjs`）零改。
 * 台账行出站接线（「对齐第三批」KD-38）：`pushLedgerLines` 挂 `session:resume` 成功径（出站面经
 * `setLedgerEmit` 注入；扫描 / 出站逻辑住 `project-info.mjs`）——**#686 拒绝面**：调用点挂拒绝处理器
 * （后台面 `void` 语义锁保持 —— 回执不候后台面；出站级失败 ⇒ `console.error`，零未处理拒绝逃逸）。
 * （定序 = 预载白名单同序）。
 * 白名单**单源** = `src/preload/preload.cjs` 的 `CHANNELS`（批档 §2.6 D-3）：主侧经 `createRequire` 读之
 * （**据以注册** = `ipc-registry.mjs` —— 表 ∕ 注册序出档 · #28；注册面纪律见该档档头）。
 * 预载档顶层零装配副作用（守卫调用 / 守卫导出）⇒ 主进程侧读取不触 `electron`（批档 §2.11 收正②）。
 * `channels` 读数口径 = 本次运行**实际分发集合**（顺序去重 —— 批档 §2.11 收正⑦）。
 * **注册表族出档**（#28 拆点 —— 批档 §2.5「通道注册表族出档」）：`HANDLERS` 表 ∕ `registerIpcHandlers` 迁
 * `ipc-registry.mjs`（本档只留处理体本体 + 宿主注入面；跨档引用面 = 表位处 `export { … }` 列）。
 */
import { createRequire } from "node:module"
import { dialog, shell } from "electron"
import { loadConfig } from "@thincoder/core/config.mjs"
import { normalizeLocale, projectDictionary } from "@thincoder/core/i18n.mjs"
import { releaseClaimsAll } from "@thincoder/core/session-slots-manifest.mjs"
import { PRELOAD_PATH, confirmRecycle, refreshMenu, setMenuTheme } from "./window.mjs"
import { currentCwd, openProject, recentDirs } from "./projects.mjs"
import { listSessions } from "./sessions.mjs"
import {
  createSession, deleteSession, renameSession, resumeSession, switchSession,
} from "./session-actions.mjs"
import { pageHistory, scheduleSessionGC } from "./session-slots.mjs"
// 设置族 ∕ 索引面 ∕ 台账相位 ∕ 配置写的处理体转口群随 #685 出档 `ipc-relays.mjs`（本档只取核心面值件）。
import { isConfigured } from "./settings.mjs"
import { pushLedgerLines } from "./project-info.mjs"
import { runSessionGcMaintenance, runSessionIndexMaintenance } from "./session-maintenance.mjs"
// 文件链接纯判据面（「对齐第三批」相抵② · KD-39 —— `file:open` 载荷合格性；出站 = `shell.openPath`）。
import { fileOpenTarget } from "./file-links.mjs"
// 行定位消解面（端差清算轮 #627 —— 外部编辑器 CLI 探测 ∕ argv 构造 / spawn 形；本档零算法副本）。
import { buildEditorArgs, detectEditorCli, spawnEditorCli } from "./editor-open.mjs"
import { panelLive } from "./panel-live.mjs" // 实况回读缓存（子代理面板批 —— `panel:state` 接收半；与装配面同单例）

const require = createRequire(import.meta.url)

/** 白名单（唯一副本在预载——本处只是读取面，不再拷副本）。 */
export const CHANNELS = require(PRELOAD_PATH).CHANNELS

/** 读数（冒烟字段源）：`channels` = 实际分发集合；`configKeys` = 最近一次 `config:read` 的配置键数。 */
export const ipcStats = { channels: [], configKeys: 0 }

/** 宿主装配桥句柄（本批增）：启动序经 `setAgentHost` 注入 —— 处理体经 `requireAgentHost()` 取值。 */
let agentHost = null

/** 注入宿主（`main.mjs` 启动序：通道注册前）—— 本档只此一处赋值。 */
export function setAgentHost(host) {
  agentHost = host
}

/** 台账行出站面（「对齐第三批」KD-38）：`main.mjs` 启动序注入（与 `setAgentHost` 同点）——`ev:ledger` 是
 *  项目级自产事件（非会话回调）⇒ 不经宿主桥；非函数注入 ⇒ 清零（零出站，不假造）。 */
let ledgerEmit = null
export function setLedgerEmit(post) {
  ledgerEmit = typeof post === "function" ? post : null
}

/** 宿主取值：未装配 ⇒ 抛（fail-loud ⇒ `invoke` 拒绝；不吞 / 不落假成功）。 */
function requireAgentHost() {
  if (!agentHost) throw new Error("[ipc] agent host not assembled")
  return agentHost
}

/** 配置载入面（`config:read` 唯一消费点）：默认真核件 `loadConfig`；注入缝 = `_setLoadConfigForTest`（沿核
 *  `_setSessionsDirForTest` 先例 —— 坏配置两态（坏 JSON ⇒ 抛出 ∕ 缺文件 ⇒ 缺省）在平 node 面无 electron 也可直测）；
 *  非函数注入 ⇒ 复位真核件。 */
let loadConfigImpl = loadConfig
export function _setLoadConfigForTest(fn) {
  loadConfigImpl = typeof fn === "function" ? fn : loadConfig
}

/** `config:read`（无入参）⇒ `{ config, locale, dict, configured }`：`locale` = 配置语言字段**经核归一**
 *  （缺 / 未知 ⇒ `"en"`）；`dict` 与 `locale` 同源同归一 ⇒ 供受面与词面一致。`configured` = **配置档存在性**
 *  （`settings.mjs` `isConfigured()` = `existsSync(configPath)`——首启向导闸读数，有意比 CLI `isConfigured`
 *  宽：档在即视为已配；批档 §2.10 项 3）。配置载入失败 ⇒ **抛出**（fail-loud：`invoke` 拒绝、引导位落
 *  `error` —— D-6 fail-soft 只覆盖路径无效面）；载入面经 `loadConfigImpl` 取值（注入缝见上——两态直测面）。 */
function readConfig() {
  const config = loadConfigImpl()
  const locale = normalizeLocale(config?.locale)
  ipcStats.configKeys = Object.keys(config).length
  return { config, locale, dict: projectDictionary(locale), configured: isConfigured() }
}

/** 处理体**跨档引用面**（注册表族出档 `ipc-registry.mjs` —— #28 拆点；转口群出档 `ipc-relays.mjs` —— #685）：
 *  `HANDLERS` 表 ∕ 注册序住注册档，经注册档两源 import 取用（表 ∕ 定序 ∕ 白名单零改；新增通道 = 两列之一 +
 *  表行 + 预载白名单三处同拍）。**本档留用面** = 核心 23 通道 + `liveAgents`（#685 新导出 —— mcp 四转口随动面，
 *  单向供 `ipc-relays.mjs` 取用，零环）。 */
export {
  readConfig, openProjectChannel, recentProjects, sessionList, sessionCreate, sessionSwitch,
  sessionRename, sessionDelete, sessionResume, approvalRespond, historyPage, msgSend, msgInterrupt,
  questionRespond, sessionPrefs, subagentStop, fileOpen, sessionFlags, atComplete, recordAppend, themeState,
  panelState,
  sessionGc, sessionIndex, liveAgents,
}

/** `project:open(payload)` ⇒ `{ cwd, recent }`：载荷 `{ fsPath }` **可选**（A7 收正形 —— VSC `setProject` 同键；
 *  `docs/desktop/design/IPC.md` §2 项目面行）——给定时直接采用（不走对话框）；缺省 ⇒ 主进程**原生目录选择**
 *  （`dialog` 注入 —— D-2；取消 ⇒ `filePaths[0] ?? null`）；路径无效 ⇒ fail-soft（`projects.mjs` 判据：现状不变 + 零写）。 */
async function openProjectChannel(payload) {
  const pick = async () => {
    const { filePaths } = await dialog.showOpenDialog({ properties: ["openDirectory"] })
    return filePaths[0] ?? null
  }
  const before = currentCwd()
  const receipt = await openProject({ path: payload?.fsPath, pick })
  if (receipt?.cwd !== before) { // §2.2 切项目级联（cwd 实变）
    agentHost?.abortSuspensions() // 旧项目全键挂起窗中止
    if (before) releaseClaimsAll(before) // G-2 旧 cwd 认领释放（切出后本进程在该 cwd 零活绑定；无 manifest ∕ 零认领 ⇒ 核内零写早退）
    refreshMenu() // D36 重建点②：最近项目随动（成功径 —— cwd 实变/物化后；窗口缺 ⇒ 零动作 fail-open）
  }
  return receipt
}

/** `project:recent`（无入参）⇒ `{ cwd, recent }`：族最新 mtime 降序前 10 —— 核槽面回读、零新存储（KD-9）。 */
function recentProjects() {
  return { cwd: currentCwd(), recent: recentDirs() }
}

/** `sessions:list`（无入参）⇒ `{ cwd, sessions }`：`cwd` 取主进程当前项目内存态；读面转口 `sessions.mjs`（零算法副本）。
 *  **A8 键名收正 = handler 重映射（源档零改）**：出站键 `rows ⇒ sessions`（VSC 回执键同形 —— `panel-session.mjs:262`）。 */
function sessionList() {
  const { rows, ...receipt } = listSessions(currentCwd())
  return { ...receipt, sessions: rows }
}

/** 会话族五通道处理体（本批增）：入参到动作层即止 —— cwd 取主进程当前项目内存态（动作层收 `cwd` 入参
 *  是为可脱壳直测，KD-a；信封 / reason 分档单源 = `session-actions.mjs`）。无载荷通道（create / resume）
 *  忽略 `payload`；载荷形 = `{slot}`（switch / delete）· `{slot, title}`（rename）。 */
function sessionCreate() { return createSession(currentCwd()) }
function sessionSwitch(payload) { return switchSession(currentCwd(), payload?.slot) }
function sessionRename(payload) {
  const receipt = renameSession(currentCwd(), payload?.slot, payload?.title)
  // #525：成功径 ⇒ 已装配实例 `agent.title` 随动（否则回合尾 `saveSession` 全量覆盖把盘面新标题写回旧值）：
  if (receipt?.ok === true) agentHost?.syncTitle(payload?.slot, payload?.title)
  return receipt
}
function sessionDelete(payload) {
  const receipt = deleteSession(currentCwd(), payload?.slot)
  // R3b（D20 数据链「会话关闭 / 删除 / 宿主退出 ⇒ 该键投影清」）：删除成功 ⇒ 装配实例出表（宿主 `dispose`
  //  ⇒ 存活投影**清点**：已删会话不随 2s 拍重投）；未装配宿主 / 零键 ⇒ 软跳过（零抛 —— 删除面不受累）。
  if (receipt?.ok === true && payload?.slot != null) agentHost?.dispose(String(payload.slot))
  return receipt
}
async function sessionResume() {
  const receipt = await resumeSession(currentCwd())
  // 残留 GC 显式点火（R1 · #406 · KD-T4② —— 桌面恢复径走核裸版，无包装调度；核内每进程每前缀去重）：
  if (receipt?.ok === true && typeof receipt.cwd === "string" && receipt.cwd !== "") scheduleSessionGC(receipt.cwd)
  // 台账行出站点（「对齐第三批」KD-38 —— 落点 = 成功径：会话键天然在手）：后台面（`void`）—— 不经回执等待。
  // #686 拒绝面：调用点挂拒绝处理器（`void` 语义锁保持 —— 回执不候后台面；出站级失败 ⇒ `console.error`，零未处理拒绝逃逸）。
  if (ledgerEmit && receipt?.ok === true && receipt.slot != null) {
    void pushLedgerLines({ cwd: receipt.cwd, key: String(receipt.slot), post: ledgerEmit })
      .catch((error) => { console.error("[ipc] ledger emit failed:", error) })
  }
  return receipt
}

/** `history:page(payload)` ⇒ `{ ok, messages, hasOlder, next, meta, flags, queue, providerState?, seed? }` ∥ `{ ok:false, reason }`：读面
 *  转口 `session-slots.mjs`（零算法副本；cwd 取主进程当前项目内存态 —— 同会话族）。载荷 `{ key, before }`。
 *  **provider 态投影（#841 · `docs/desktop/design/IPC.md` §2「provider 态投影注」）**：`providerState` =
 *  核三态投影（供面 ∥ 载荷单源 = `session-slots.mjs` `providerStateOf` —— 三回执族之一）；本出口**随动透传**
 *  （零叠加；失败径无该键。三回执族 = `history:page` ∥ `msg:send` 成功 ∥ 设置写回执 `settings:agent` ∥ `provider:save`）。
 *  **排队快照叠加（「回合中插入」批 · KD-40 ④）**：`queue` = 本键队列快照（`string[]` —— A9 串数组恰形；冷启 ∕ 重载镜面
 *  重建面；队列单源 = 宿主 —— 供面 `agentHost.queueSnapshot`）；**键恒在场**（空队 ⇒ `[]`；宿主未装配径同出空键 ——
 *  无宿主 ⇒ 队必空，形不缺 ∕ 零假造）。
 *  **模式位投影叠加（状态栏对齐批 · `docs/desktop/design/IPC.md` §2「模式位投影注」· 合并口径）**：agent 在场
 *  ⇒ 以**活值**四布尔（宿主 `flagsOf`）置顶（转口读面已携槽投影兜底值 —— `session-slots.mjs` `slotFlags`）；
 *  agent 不在场 ⇒ 槽投影照旧（键仍在场）；槽读不出（失败回执）⇒ 无 `flags` 键（零写 —— 禁假造）。 */
function historyPage(payload) {
  const receipt = pageHistory(currentCwd(), payload)
  const live = receipt?.ok === true && agentHost ? agentHost.flagsOf(payload?.key) : null
  const merged = receipt?.ok === true ? { ...receipt, queue: agentHost ? agentHost.queueSnapshot(payload?.key) : [] } : receipt
  return live === null ? merged : { ...merged, flags: live }
}

/** `session:prefs(payload)` ⇒ 族信封 + `meta`（成功携 · 失败缺键）：载荷 `{ key, patch }`（键闭集
 *  `provider` / `model` / `effort`）—— 转口宿主写面（KD-19 单点：写盘 → 重施；`reason` 五档在动作侧）。 */
function sessionPrefs(payload) { return requireAgentHost().setPrefs(payload?.key, payload?.patch) }

/** `msg:send(payload)` ⇒ `{ ok:true }`（**立即回** —— 过程走 `ev:*` 出站；**例外 = 非视觉带图径**：降级窗内读图毕
 *  再回 —— `IPC.md` §2「附件注」项 4）∥ `{ ok:true, degraded }`（附件弃项两态 —— `IPC.md` §2「附件注」项 5）
 *  ∥ `{ ok:true, queued:true }`（**忙态入队** —— 「回合中插入」批 · KD-40 ②）∥ `{ ok:false, reason }`（`bad-key` /
 *  `busy`〔挂起窗附件面〕/ `queue-full`；**受理后失败径同形外加 `started:false`**〔宿主未受理 ⇒ 渲染面回收受理即置忙位〕：
 *  `provider-invalid`（**另携真因分类 `providerKind`** —— 闭集 `defaultModel` ∥ `provider`，结构判定；`reason`
 *  裸码零改 —— 首跑渠道提示修复批 · #840）/ `aborted`〔跨中止径 ∕ 降级窗后查位 ∕ 装配窗中止〕/ 装配抛〔err 文案原样〕· #597）：
 *  载荷 `{ key, text, images }`（`images` = dataURL 串列 —— A1），转口宿主回合驱动。
 *  **#841（「provider 态投影注」）**：成功回执另携 `providerState`（发送时点刷新 —— 第二刷新点；供面 =
 *  `turn-input.mjs`）；失败径零叠加；第三刷新点 = 设置写回执（`settings:agent` ∥ `provider:save` ——
 *  处理体住 `settings.mjs` ∥ `providers.mjs`，同携 `providerState`）。 */
function msgSend(payload) { return requireAgentHost().send(payload?.key, payload?.text, payload?.images) }

/** `msg:interrupt(payload)` ⇒ `{ ok:true }` ∥ `{ ok:false, reason }`（`idle` / `bad-key` / `queue-full`〔#656 · KD-52 ②：
 *  cap 询问待答 ∧ 携文 ∧ 忙态队满——**零中止 ∕ 零入队**（询问在场 ∕ 回合照旧）；文本由端侧回注输入框〕）：
 *  载荷 `{ key, message? }` —— `message` 非空串 ⇒ Ctrl+I 同上下文续跑（宿主下传核 abort 面 `{ interrupt: true, message }`）；缺 ∕ 空 ⇒ 停回合。 */
function msgInterrupt(payload) { return requireAgentHost().interrupt(payload?.key, payload?.message) }

/** `approval:respond(payload)` ⇒ 审批出口：载荷 `{ promptId, verdict }`（形已在册，本批接线**语义**面）。
 *  转口宿主待决表（`agent-host.mjs`）：未知 id / 跨形 verdict / 表外 verdict 皆有 `{ok:false}` 档，且
 *  非法 verdict **不 resolve**（挂起保留）——**通道名与载荷形不动**；宿主未注入 ⇒ fail-loud 直抛
 *  （不吞 / 不落假成功 / 本档零假成功字面 —— 沿 `docs/desktop/design/IPC.md` §2 会话族注项 5 与「禁假数据」）。 */
function approvalRespond(payload) {
  if (!agentHost) throw new Error("[ipc] approval:respond: approval source not assembled")
  return agentHost.respond(payload)
}

/** `question:respond(payload)` ⇒ 作答出口（`question` 工具真作答面）：载荷 `{ promptId, answer }`
 *  （`answer` = 串（给答项原样 ∥ 自由作答）∥ `null`（取消 ⇒ 取消串））。转口宿主待决表（同
 *  `approval:respond`）：表外 id / 跨 kind 载荷 / 假「作答」形皆有 `{ok:false}` 档且**不 resolve**
 *  （挂起保留）；宿主未注入 ⇒ fail-loud 直抛（不吞 / 不落假成功）。 */
function questionRespond(payload) {
  if (!agentHost) throw new Error("[ipc] question:respond: question source not assembled")
  return agentHost.respond(payload)
}

/** `subagent:stop(payload)` ⇒ `{ ok, reason }`（reason 闭集 = `unknown-sub` / `bad-key`）：载荷 `{ key, id, role? }`
 *  （`id` = 实例号——与 `ev:subagent` 同源同值）—— 转口宿主子 agent 面（核既有取消出口 —— 零算法副本；
 *  `thincoder-desktop/src/main/subagent-face.mjs`）；宿主未注入 ⇒ fail-loud 直抛（沿 `approval:respond` 先例）。 */
function subagentStop(payload) { return requireAgentHost().stopSubagent(payload?.key, payload?.id, payload?.role) }

/** `file:open(payload)` ⇒ `{ ok, reason }`（「对齐第三批」相抵② · KD-39；行定位消解 = 端差清算轮 #627）：
 *  载荷 `{ path, line? }` —— `path` = 盘上绝对路径（宿主 `extractFileLinks` 产物 = **验存件**）；`line` = 正整数
 *  （`file-link` 锚 `data-line`——缺 ∕ 非法 ⇒ 纯路径开）。**单一路径链**（零静默）：命中编辑器 CLI ⇒ spawn
 *  （**参数含行**—— `--goto path:line`；`subl` = `path:line`）；未命中 ⇒ `shell.openPath` 兜底**恰一次**
 *  （现状零回归）；spawn 失败 ⇒ 兜底恰一次；全链失败（兜底亦败）⇒ `{ ok:false, reason }` **直传**。
 *  探测 ∕ 命令行构造 ∕ spawn 形单源 = `editor-open.mjs`（本档零算法副本）。
 *  非串 / 空串载荷 ⇒ `bad-path`（零抛 —— 渲染面按 `console.error` 处置，零静默）。 */
async function fileOpen(payload) {
  const path = fileOpenTarget(payload)
  if (path === null) return { ok: false, reason: "bad-path" }
  const cli = await detectEditorCli()
  if (cli !== null && (await spawnEditorCli(cli, buildEditorArgs(cli, path, payload?.line)))) {
    return { ok: true, reason: null }
  }
  const failed = await shell.openPath(path)
  return failed ? { ok: false, reason: failed } : { ok: true, reason: null }
}

/** 在装配 agent 列表（MCP 随动面用）：宿主未注入 ⇒ `null`（无宿主面 ⇒ 随动空操作，非报错——
 *  配置已落盘，下次装配生效）。 */
function liveAgents() {
  if (!agentHost) return null
  return [...agentHost.agents.values()]
}

/** `session:flags(payload)` ⇒ `{ ok:true, flags? }` ∥ `{ ok:false, reason }`（R1 输入面板移植）：载荷
 *  `{ key, patch }`（`patch` 四键闭集 `planMode` ∕ `autoApprove` ∕ `advisorGuard` ∕ `engineering`，逐项布尔）
 *  —— 转口宿主模式位写面（处理体出档 `session-flags.mjs`：核 `setSlot*` 四写 + 活代理重施 + ENG×PLAN 互斥；
 *  成功径 `flags` = `flagsOf` 活值，agent 不在场 ⇒ 键缺席）。宿主未注入 ⇒ fail-loud 直抛
 *  （沿 `session:prefs` ∕ `approval:respond` 先例）。 */
function sessionFlags(payload) { return requireAgentHost().setFlags(payload?.key, payload?.patch) }

/** `at:complete(payload)` ⇒ `{ ok, matches, seq }`（R1 输入面板移植）：载荷 `{ query, seq }` —— 转口宿主
 *  @ 补全面（处理体出档 `at-complete.mjs`：项目树枚举过滤，排除面 ∕ 封顶照 VSC；**`seq` 原样回携** ——
 *  迟到丢弃 = 消费面判据）。宿主未注入 ⇒ fail-loud 直抛。 */
function atComplete(payload) { return requireAgentHost().atComplete(payload?.query, payload?.seq) }

/** `record:append(payload)` ⇒ `{ ok, reason }`（**留档记录追加** —— 消化面留档批 · #719）：载荷 `{ key, record }`
 *  —— 转口宿主记录面（处理体住 `agent-host.mjs`：装配表命中门 + `appendRecord`；reason 闭集 = `bad-key` ∥
 *  `unknown-key`）。宿主未注入 ⇒ fail-loud 直抛（沿 `subagent:stop` 先例）。 */
function recordAppend(payload) { return requireAgentHost().recordAppend(payload?.key, payload?.record) }

/** `theme:state(payload)` ⇒ `{ ok:true }` ∥ `{ ok:false, reason:"invalid-theme" }`（**勾选态回读** —— 菜单体系批 · D36：
 *  渲染→主单向；载荷 `{ theme }` 三值闭集）。缓存与菜单重建住 `window.mjs` `setMenuTheme` —— 本档只做转口
 *  （表外值 ⇒ 零变更 + 记错，零静默）。 */
function themeState(payload) { return setMenuTheme(payload?.theme) }

/** `panel:state(payload)` ⇒ `{ ok:true }` ∥ `{ ok:false, reason }`（**渲染面实况回读上报** —— 子代理面板批 · 白名单末位 48；形判两档 `invalid-key` ∥ `invalid-blocks` —— 防御档，表外零变更 + 记错）：
 *  载荷 `{ key, blocks }`（块形 = 判别六键 + `role`/`id` 随行；单源 = `PANEL-READBACK.md` §2.1）——渲染 → 主单向 ⇒ 读数缓存（`panel-live.mjs`，后报覆前报）⇒ 核 `panel` 工具 view ∥ freeze 读源；**限度 = 报告缓存**（报告未达 ⇒ 工具侧回落降级链）。 */
function panelState(payload) {
  const { key, blocks } = payload ?? {}
  const shaped = Array.isArray(blocks) && blocks.every((b) => b !== null && typeof b === "object" && typeof b.key === "string" && b.key !== "")
  if (typeof key !== "string" || key === "" || !shaped) {
    const reason = typeof key !== "string" || key === "" ? "invalid-key" : "invalid-blocks"
    console.error(`[ipc] panel:state refused malformed payload (reason=${reason})`)
    return { ok: false, reason }
  }
  panelLive.report(key, blocks)
  return { ok: true }
}

/** R1 · 会话维护线两处理体转口（出档 `session-maintenance.mjs`）：`session:gc` ⇒ `{ ok, candidates, confirmed,
 *  deleted, files, skipped, skippedFiles }`；`session:index` ⇒ `{ ok, sessions, changed, messages, toolCalls,
 *  bytes }` ∥ `{ ok:false, …, error }`（驳回 ⇒ 零删除；索引不可得 ∕ 失败落回执——不抛）。 */
function sessionGc() { return runSessionGcMaintenance({ confirm: confirmRecycle }) }
function sessionIndex() { return runSessionIndexMaintenance() }

/* ─── 转口群二十四项（设置族 ∕ 索引数据面 / 台账相位 / 配置写）出档 `ipc-relays.mjs`（#685 拆点 —— 本档零副本；
 *     注册面（`ipc-registry.mjs`）import 拆两源取用 —— `HANDLERS` 表 ∕ 注册序 ∕ 白名单零改）。 ─── */
