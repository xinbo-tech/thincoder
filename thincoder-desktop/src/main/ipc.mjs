/**
 * ipc.mjs — IPC 通道注册与分发（`docs/desktop/design/IPC.md` §1 / §2）：**三十八项** = 配置读取 + 项目面
 * `project:open` / `project:recent` + 会话面 `sessions:list` / `session:create` / `session:switch` /
 * `session:rename` / `session:delete` / `session:resume` + 审批响应 `approval:respond` + 作答响应
 * `question:respond` —— `question` 工具真作答面 + 历史页 `history:page`
 * + 回合驱动 `msg:send` / `msg:interrupt`（宿主未注入 ⇒ fail-loud）+ **设置族十二项**
 * （provider 四 / model / agent 参数 / MCP 三 / 配置写 / 语言）+ **项目级信息两项**（台账 / 相位）+ 会话级偏好写面 `session:prefs`
 * + **子 agent 停止出口 `subagent:stop`（R3b 落）** + **文件链接打开 `file:open`（「对齐第三批」
 * 相抵② · KD-39 —— `shell.openPath` 出口；纯判据面住 `file-links.mjs`）**
 * + **R1 输入面板移植两项（白名单末位）**：`session:flags`（模式位四写面 —— 处理体出档 `session-flags.mjs`；
 * `file-links.mjs` 零改）· `at:complete`（@ 补全文件枚举过滤 —— 处理体出档 `at-complete.mjs`）
 * + **会话维护线两项（R1 · 桌面功能对位批 —— 白名单末位）**：`session:gc`（会话数据回收）· `session:index`
 * （派生索引重建）—— 处理体出档 `session-maintenance.mjs`（确认面 = 原生模态 `window.mjs` `confirmRecycle`）。
 * + **索引数据面两项（R2 · 桌面功能对位批 —— 白名单末位）**：`index:build`（语义索引构建入口）·
 * `index:status`（索引状态读数）—— 处理体出档 `index-status.mjs`（构建）与 `settings.mjs`（读数装配）。
 * + **R7 设置补充三项（桌面功能对位批 —— 白名单末位）**：`settings:env`（env 读写：proxy ∕ shell +
 * TestProxy 转口 —— 处理体出档 `settings-env.mjs`，TestProxy 出口 = `providers.mjs`）· `settings:tools`
 * （embedding ∕ websearch key 读写 —— 出档 `settings-tools.mjs`）· `mcp:tools`（MCP 连接列举 ∕ Test 探活
 * —— 出档 `mcp-servers.mjs`）。
 * + **台账行出站接线（「对齐第三批」KD-38）**：`pushLedgerLines` 挂 `session:resume` 成功径（出站面经
 * `setLedgerEmit` 注入；扫描 / 出站逻辑住 `project-info.mjs`）
 * （定序 = 预载白名单同序）。
 * 白名单**单源** = `src/preload/preload.cjs` 的 `CHANNELS`（批档 §2.6 D-3）：主侧经 `createRequire` 读之并**据以注册**
 * （一条白名单项 = 一个 `ipcMain.handle` 面 ⇒ 无通道名第二副本）；白名单项无处理体 ⇒ 注册期抛（fail-closed）。
 * 预载档顶层零装配副作用（守卫调用 / 守卫导出）⇒ 主进程侧读取不触 `electron`（批档 §2.11 收正②）。
 * `channels` 读数口径 = 本次运行**实际分发集合**（顺序去重 —— 批档 §2.11 收正⑦）。
 */
import { createRequire } from "node:module"
import { dialog, ipcMain, shell } from "electron"
import { loadConfig } from "@thincoder/core/config.mjs"
import { normalizeLocale, projectDictionary } from "@thincoder/core/i18n.mjs"
import { PRELOAD_PATH, confirmRecycle } from "./window.mjs"
import { currentCwd, openProject, recentDirs } from "./projects.mjs"
import { listSessions } from "./sessions.mjs"
import {
  createSession, deleteSession, renameSession, resumeSession, switchSession,
} from "./session-actions.mjs"
import { pageHistory, scheduleSessionGC } from "./session-slots.mjs"
import { configWrite, indexStatus, isConfigured, modelList, settingsAgent } from "./settings.mjs"
import { settingsEnv } from "./settings-env.mjs"
import { settingsTools } from "./settings-tools.mjs"
import { providerList, providerRemove, providerSave, providerVerify } from "./providers.mjs"
import { mcpList, mcpRemove, mcpSave, mcpTools } from "./mcp-servers.mjs"
import { batchStatus, ledgerRead, pushLedgerLines } from "./project-info.mjs"
import { runSessionGcMaintenance, runSessionIndexMaintenance } from "./session-maintenance.mjs"
import { runIndexBuild } from "./index-status.mjs"
// 文件链接纯判据面（「对齐第三批」相抵② · KD-39 —— `file:open` 载荷合格性；出站 = `shell.openPath`）。
import { fileOpenTarget } from "./file-links.mjs"

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

/** `config:read`（无入参）⇒ `{ config, locale, dict, configured }`：`locale` = 配置语言字段**经核归一**
 *  （缺 / 未知 ⇒ `"en"`）；`dict` 与 `locale` 同源同归一 ⇒ 供受面与词面一致。`configured` = **配置档存在性**
 *  （`settings.mjs` `isConfigured()` = `existsSync(configPath)`——首启向导闸读数，有意比 CLI `isConfigured`
 *  宽：档在即视为已配；批档 §2.10 项 3）。配置载入失败 ⇒ **抛出**（fail-loud：`invoke` 拒绝、引导位落
 *  `error` —— D-6 fail-soft 只覆盖路径无效面）。 */
function readConfig() {
  const config = loadConfig()
  const locale = normalizeLocale(config?.locale)
  ipcStats.configKeys = Object.keys(config).length
  return { config, locale, dict: projectDictionary(locale), configured: isConfigured() }
}

/** 通道 → 处理体（新增行即新增白名单项，两处同时动）。 */
const HANDLERS = Object.freeze({
  "config:read": readConfig,
  "project:open": openProjectChannel,
  "project:recent": recentProjects,
  "sessions:list": sessionList,
  "session:create": sessionCreate,
  "session:switch": sessionSwitch,
  "session:rename": sessionRename,
  "session:delete": sessionDelete,
  "session:resume": sessionResume,
  "approval:respond": approvalRespond,
  "history:page": historyPage,
  "msg:send": msgSend,
  "msg:interrupt": msgInterrupt,
  "provider:list": providerListChannel,
  "provider:save": providerSaveChannel,
  "provider:remove": providerRemoveChannel,
  "provider:verify": providerVerifyChannel,
  "model:list": modelListChannel,
  "settings:agent": settingsAgentChannel,
  "mcp:list": mcpListChannel,
  "mcp:save": mcpSaveChannel,
  "mcp:remove": mcpRemoveChannel,
  "config:write": configWriteChannel,
  "ledger:read": ledgerReadChannel,
  "batch:status": batchStatusChannel,
  "question:respond": questionRespond,
  "session:prefs": sessionPrefs,
  "subagent:stop": subagentStop,
  "file:open": fileOpen,
  "session:flags": sessionFlags,
  "at:complete": atComplete,
  "session:gc": sessionGc,
  "session:index": sessionIndex,
  "index:build": indexBuild,
  "index:status": indexStatusChannel,
  "settings:env": settingsEnvChannel,
  "settings:tools": settingsToolsChannel,
  "mcp:tools": mcpToolsChannel,
})

/** `project:open(payload)` ⇒ `{ cwd, recent }`：载荷 `{ path }` **可选**（`docs/desktop/design/IPC.md:42`）——
 *  给定时直接采用（不走对话框）；缺省 ⇒ 主进程**原生目录选择**（`dialog` 注入 —— D-2；
 *  取消 ⇒ `filePaths[0] ?? null`）；路径无效 ⇒ fail-soft（`projects.mjs` 判据：现状不变 + 零写）。 */
async function openProjectChannel(payload) {
  const pick = async () => {
    const { filePaths } = await dialog.showOpenDialog({ properties: ["openDirectory"] })
    return filePaths[0] ?? null
  }
  const before = currentCwd()
  const receipt = await openProject({ path: payload?.path, pick })
  if (receipt?.cwd !== before) agentHost?.abortSuspensions() // §2.2 切项目级联：旧项目全键挂起窗中止
  return receipt
}

/** `project:recent`（无入参）⇒ `{ cwd, recent }`：族最新 mtime 降序前 10 —— 核槽面回读、零新存储（KD-9）。 */
function recentProjects() {
  return { cwd: currentCwd(), recent: recentDirs() }
}

/** `sessions:list`（无入参）⇒ `{ cwd, rows }`：`cwd` 取主进程当前项目内存态；读面转口 `sessions.mjs`（零算法副本）。 */
function sessionList() { return listSessions(currentCwd()) }

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
function sessionResume() {
  const receipt = resumeSession(currentCwd())
  // 残留 GC 显式点火（R1 · #406 · KD-T4② —— 桌面恢复径走核裸版，无包装调度；核内每进程每前缀去重）：
  if (receipt?.ok === true && typeof receipt.cwd === "string" && receipt.cwd !== "") scheduleSessionGC(receipt.cwd)
  // 台账行出站点（「对齐第三批」KD-38 —— 落点 = 成功径：会话键天然在手）：后台面（`void`）—— 不经回执等待。
  if (ledgerEmit && receipt?.ok === true && receipt.slot != null) {
    void pushLedgerLines({ cwd: receipt.cwd, key: String(receipt.slot), post: ledgerEmit })
  }
  return receipt
}

/** `history:page(payload)` ⇒ `{ ok, messages, hasOlder, next, meta, flags, queue, seed? }` ∥ `{ ok:false, reason }`：读面
 *  转口 `session-slots.mjs`（零算法副本；cwd 取主进程当前项目内存态 —— 同会话族）。载荷 `{ key, before }`。
 *  **排队快照叠加（「回合中插入」批 · KD-40 ④）**：`queue` = 本键队列快照（`[{ text, ts }]` —— 冷启 ∕ 重载镜面
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

/** `msg:send(payload)` ⇒ `{ ok:true }`（**立即回** —— 过程走 `ev:*` 出站）∥ `{ ok:true, degraded }`（附件弃项两态
 *  —— `IPC.md` §2「附件注」项 5）∥ `{ ok:true, queued:true }`（**忙态入队** —— 「回合中插入」批 · KD-40 ②）
 *  ∥ `{ ok:false, reason }`（`bad-key` / `busy`〔挂起窗附件面〕/ `queue-full` / `provider-invalid`）：
 *  载荷 `{ key, text, images }`（`images` 逐项 `{ name, mime, dataURL }`），转口宿主回合驱动。 */
function msgSend(payload) { return requireAgentHost().send(payload?.key, payload?.text, payload?.images) }

/** `msg:interrupt(payload)` ⇒ `{ ok:true }` ∥ `{ ok:false, reason }`（`idle` / `bad-key`）：载荷 `{ key, message? }`
 *  —— `message` 非空串 ⇒ Ctrl+I 同上下文续跑（宿主下传核 abort 面 `{ interrupt: true, message }`）；缺 ∕ 空 ⇒ 停回合。 */
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

/** `file:open(payload)` ⇒ `{ ok, reason }`（「对齐第三批」相抵② · KD-39）：载荷 `{ path, line? }` ——
 *  `path` = 盘上绝对路径（宿主 `extractFileLinks` 产物 = **验存件**）；`line` 本批不施加（`shell.openPath`
 *  无行参 —— 载荷备用；端差登记 = `docs/desktop/design/UI.md` §1「本批注（对齐第三批 · 小修族）」相抵②）。
 *  出口 = 系统默认程序（`shell.openPath`：成功 ⇒ 空串；失败 ⇒ 错误串**直传出栈**）；
 *  非串 / 空串载荷 ⇒ `bad-path`（零抛 —— 渲染面按 `console.error` 处置，零静默）。 */
async function fileOpen(payload) {
  const path = fileOpenTarget(payload)
  if (path === null) return { ok: false, reason: "bad-path" }
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

/** R1 · 会话维护线两处理体转口（出档 `session-maintenance.mjs`）：`session:gc` ⇒ `{ ok, candidates, confirmed,
 *  deleted, files, skipped, skippedFiles }`；`session:index` ⇒ `{ ok, sessions, changed, messages, toolCalls,
 *  bytes }` ∥ `{ ok:false, …, error }`（驳回 ⇒ 零删除；索引不可得 ∕ 失败落回执——不抛）。 */
function sessionGc() { return runSessionGcMaintenance({ confirm: confirmRecycle }) }
function sessionIndex() { return runSessionIndexMaintenance() }

/** R2 · 索引数据面两通道（构建处理体出档 `index-status.mjs` ∕ 读数装配出档 `settings.mjs`）：两通道
 *  **无载荷**——`dir` = 主进程当前项目内存态（`currentCwd()`）；未开项目 ⇒ 读数零计数（零假造）·
 *  构建落 `{ ok:false, reason:"no-project" }`（可见失败面，零静默）。 */
function indexBuild() { return runIndexBuild({ dir: currentCwd() }) }
function indexStatusChannel() { return indexStatus({ dir: currentCwd() }) }

/** R7 · 设置补充三项（处理体出档 `settings-env.mjs` ∕ `settings-tools.mjs` ∕ `mcp-servers.mjs`）：
 *  `settings:env` 三支 = 读 `{}` ∕ 写 `{ patch: { proxy?, shell? } }` ∕ TestProxy `{ testProxy: { uri } }`
 *  （写经核 `writeConfigAtomic`——端侧零自写盘）；`settings:tools` 两支 = 读 `{}` ∕ 写
 *  `{ patch: { embedding?: { apiKey }, websearch?: { apiKey } } }`；`mcp:tools` 两支 = `{ name }`
 *  （连接列举）∥ `{ name, test: true }`（Test 探活一次）。载荷 / 回执形 = `docs/desktop/design/IPC.md` §2。 */
function settingsEnvChannel(payload) { return settingsEnv(payload) }
function settingsToolsChannel(payload) { return settingsTools(payload) }
function mcpToolsChannel(payload) { return mcpTools(payload) }

/* ─── 设置族十二项处理体（本批增）：转口三档模块，本档零算法副本（§2.5 行表） ─── */
/** `provider:list`（无入参）⇒ `{ ok, providers, active }`（密钥只回遮罩值）。 */
function providerListChannel() { return providerList() }
/** `provider:save(payload)` ⇒ `{ ok, reason }`：载荷 `{ name, shape, preset?, baseURL?, model?, key?, format?, active? }`。 */
function providerSaveChannel(payload) { return providerSave(payload) }
/** `provider:remove(payload)` ⇒ `{ ok, reason }`：载荷 `{ name }`（激活渠道保护 = 核错误串直传）。 */
function providerRemoveChannel(payload) { return providerRemove(payload) }
/** `provider:verify(payload)` ⇒ `{ ok, models }` ∥ `{ ok:false, reason }`（`timeout`/`malformed`/`unavailable`；
 *  探不通**仍可保存**——本通道只回报，不拦写）。 */
function providerVerifyChannel(payload) { return providerVerify(payload) }
/** `model:list(payload)` ⇒ `{ ok, models }` ∥ `{ ok:false, reason }`：载荷 `{ provider }`（provider 名）。 */
function modelListChannel(payload) { return modelList(payload) }
/** `settings:agent(payload)`：读 `{}` ⇒ `{ ok, fields }`；写 `{ patch }` ⇒ `{ ok, reason, fields }`（写后回读）。 */
function settingsAgentChannel(payload) { return settingsAgent(payload) }
/** `mcp:list`（无入参）⇒ `{ ok, servers }`（只列已配；不连接）。 */
function mcpListChannel() { return mcpList() }
/** `mcp:save(payload)` ⇒ `{ ok, tools }` ∥ `{ ok:false, reason, detail? }`（探活不通 ⇒ 零写盘）。 */
function mcpSaveChannel(payload) { return mcpSave(payload, { listAgents: liveAgents }) }
/** `mcp:remove(payload)` ⇒ `{ ok }` ∥ `{ ok:false, reason }`：载荷 `{ name }`。 */
function mcpRemoveChannel(payload) { return mcpRemove(payload, { listAgents: liveAgents }) }
  /** `config:write(payload)` ⇒ `{ ok, reason, locale, dict, configured }` ∥ `{ ok:false, reason }`：载荷 `{ patch }`（仅 `locale`）。 */
function configWriteChannel(payload) { return configWrite(payload) }
/** `ledger:read(payload)` ⇒ `{ ok, counts, thresholdReached }` ∥ `{ ok:false, reason }`：载荷 `{ cwd? }`。 */
function ledgerReadChannel(payload) { return ledgerRead(payload) }
/** `batch:status(payload)` ⇒ `{ ok, phase }` ∥ `{ ok:false, reason }`：载荷 `{ cwd? }`（`missing`/`invalid`）。 */
function batchStatusChannel(payload) { return batchStatus(payload) }

/** 按白名单逐项注册（白名单项无处理体 ⇒ 抛——装配期即知，不静默）。 */
export function registerIpcHandlers() {
  for (const channel of CHANNELS) {
    const handler = HANDLERS[channel]
    if (typeof handler !== "function") throw new Error(`[ipc] whitelisted channel without handler: ${channel}`)
    ipcMain.handle(channel, (_event, payload) => {
      if (!ipcStats.channels.includes(channel)) ipcStats.channels.push(channel)
      return handler(payload)
    })
  }
}
