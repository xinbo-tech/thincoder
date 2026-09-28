/**
 * ipc-registry.mjs — 通道注册表族（`docs/desktop/design/IPC.md` §2「唯一入册面」）：**三十八项** =
 * 白名单逐项 → 处理体映射（`HANDLERS` 表）+ 注册序（`registerIpcHandlers`）——**#28 拆点出档**
 * （批档 §2.5「通道注册表族出档」；纯搬零语义改 —— 表 ∕ 注册 ∕ 定序逐行沿出档前 `ipc.mjs`）。
 *
 * 单源与纪律（沿出档前同判）：
 * - 白名单**单源** = `src/preload/preload.cjs` 的 `CHANNELS`（批档 §2.6 D-3）：本档经 `ipc.mjs` 转口
 *   读取**并据以注册**（一条白名单项 = 一个 `ipcMain.handle` 面 ⇒ 无通道名第二副本）；白名单项无处理体
 *   ⇒ 注册期抛（fail-closed）。
 * - 处理体本体住 `ipc.mjs`（本档只持映射 ∕ 注册序）；跨档引用面 = 该档表位处 `export { … }` 列。
 * - `channels` 读数口径 = 本次运行**实际分发集合**（顺序去重 —— 批档 §2.11 收正⑦）。
 */
import { ipcMain } from "electron"
import {
  CHANNELS, ipcStats,
  readConfig, openProjectChannel, recentProjects, sessionList, sessionCreate, sessionSwitch,
  sessionRename, sessionDelete, sessionResume, approvalRespond, historyPage, msgSend, msgInterrupt,
  providerListChannel, providerSaveChannel, providerRemoveChannel, providerVerifyChannel, modelListChannel,
  settingsAgentChannel, mcpListChannel, mcpSaveChannel, mcpRemoveChannel, configWriteChannel,
  ledgerReadChannel, batchStatusChannel, questionRespond, sessionPrefs, subagentStop, fileOpen,
  sessionFlags, atComplete, sessionGc, sessionIndex, indexBuild, indexStatusChannel,
  settingsEnvChannel, settingsToolsChannel, mcpToolsChannel,
} from "./ipc.mjs"

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
