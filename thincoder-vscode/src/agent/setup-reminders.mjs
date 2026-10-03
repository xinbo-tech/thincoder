/**
 * setup-reminders.mjs — 端侧提醒面残件（2026-09-29 parity-b1 · 批档 §2.2 行 8 ∕ §2.3 件 1
 * 「输入段三项落点」）：
 *   - 核单源转口：回合域文本基座四名（消费 = `./turn-domains.mjs` 组合单点）· 贴图指引
 *     `appendImagePointer`（消费 = 端装配段「调用前对 input 串施用」adapter）。
 *   - 端独有保留：R5 重启检测闸（**extension-host 重载语义**——模块级 `restartDetectionDone`
 *     一次性闸；装配段判真时置 `agent._processRestartPending = true`，核 `prepareRun` 消费发句
 *     ——句文本与序位（git → OS → restarted → outline）随核零变）。
 * 退役面（随主循环归核——§2.3 件 1 三项落点 + §2.2 行 8 处置）：env 身份行 `envStateLine` ∕
 * `pushEnvStateReminder`（核单源 + 端名缝 `sessionEnd()`——端名声明 = `extension/session-slots.mjs`
 * `setSessionEnd(END)`；resumed 载体改指 `agent._envResumed`）· `pushTimeReminder`（核尾位推送）·
 * `pushPeerReminder`（核 `prepareRun` 序位）· `pushGitContext` ∕ `composeGitContext` ∕ `collectGitContext`
 * 转口（核注入组）· AUTO ∕ ENG 提醒与 manifest 情境行（核 `ensureAutoReminder` ∕
 * `injectTurnReminders` ∕ `pushManifestStateReminder`）。
 */
export {
  AUTO_TURN_DIGEST_DOMAIN,
  AUTO_TURN_DIGEST_DOMAIN_ENG,
  UPSTREAM_TURN_DOMAIN,
  TIMER_TURN_DOMAIN,
} from "@thincoder/core/agent/helpers.mjs"
export { appendImagePointer } from "@thincoder/core/agent/setup-reminders.mjs"
// 贴图指引施用（§2.3 件 1「贴图指针」行——adapter；消费面 = 端装配段，核 `runAgent` 调用前）：
//   const m = { role: "user", content: input }; appendImagePointer(m, opts.images, provider.model, { depth });
//   → 最终 input = m.content（`setup.mjs` `hydrateRun` 已就地施用并随返回面出）。

// ─── R5 重启检测：process restarted 句的进程级一次性闸（SESSION.md §6.11 评审 #7——N6 双信号
//     分离：本闸保留为「真进程重启」句专用——extension host 重启后模块级重置；进程内切槽/换槽
//     不重置 ⇒ 切槽不误报进程重启）。resumed:yes 归核载体 `agent._envResumed`（装配段武装）。
let restartDetectionDone = false

/** Test seam — restores first-turn restart detection (production never calls this). */
export function _resetRestartDetectionForTests() { restartDetectionDone = false }

/** Returns true exactly once: the first top-level user turn whose session was restored from
 *  disk (fullHistory arrives non-empty). All other turns return false. */
export function detectRestoredSession({ depth, resume, autoTurn, fullHistory }) {
  if (restartDetectionDone || depth !== 0 || resume || autoTurn) return false
  restartDetectionDone = true
  return (fullHistory?.length ?? 0) > 0
}

// ─── MCP 失败提醒（#823 · 2026-10-04 issue 修复批·三——三端同形消费；机制单源 = `MCP.md` §6.4）───
// 装配尾调用（晚于每轮 `resetRunState` 清队 ∥ 槽回填）：失败集非空 ⇒ 提醒入 `_pendingReminders`
// （下一条 user 消息注入——核 `agent/setup.mjs:172-176`）；首两段逐字同 CLI
// （`thincoder-cli/src/command-interactive.mjs:163-166`——同桌面 `agent-assemble.mjs` `mcpWarningReminder`），
// 末行 = 本端可达出口（设置面 MCP 段 Reconnect——CLI `/mcp connect <name>` 本端不存在）。
// 指纹去重（`warnings.join("\n")`——同失败集不重推）；零警告 ⇒ 零写（队不写）+ 指纹清（复失败可再推）。

/** MCP 连接失败 ⇒ 携带三端同形载体 `agent._mcpWarnings`（CLI ∥ 桌面同名面）+ 提醒
 *  入队（装配尾每轮调——指纹去重）。`warnings` 缺 / 非数组 ⇒ 零写。 */
export function applyMcpWarnings(agent, warnings) {
  const list = Array.isArray(warnings) ? warnings : []
  if (list.length === 0) { agent._mcpWarnedKey = null; return } // 零警告：零写 + 指纹清（恢复后复失败可再推）
  agent._mcpWarnings = list // 三端同形载体（CLI/桌面同名——`SETTINGS.md` §2.4）
  const key = list.join("\n")
  if (agent._mcpWarnedKey === key) return // 同失败集（同指纹）⇒ 不重推
  agent._mcpWarnedKey = key
  agent._pendingReminders = agent._pendingReminders ?? []
  agent._pendingReminders.push(
    `[System reminder: ${list.length} MCP server(s) failed to connect at startup:\n` +
    list.map((w) => `  - ${w}`).join("\n") +
    "\nYou can try reconnecting from the Settings panel (MCP section → Reconnect).]"
  )
}
