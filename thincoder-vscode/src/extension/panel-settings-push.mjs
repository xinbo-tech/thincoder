/**
 * panel-settings-push.mjs — VS Code 端壳 Settings 面：ChatPanel 的设置委派族 + 推送链 +
 * 会话访问器（原自 chat-panel.mjs `Settings` 段整段外提——2026-09-25 file-tier-sweep 批 S1，
 * 触发 = 该档余量 ≤5；设计 = `docs/vsc/design/VSC-DEBT.md` §13.2）。
 *
 * 对外缝 = 类内同名薄委托（chat-panel.mjs 每方法一行 `return x(this, …)`）——外部调用点
 * （panel-messages-settings / panel-callbacks / panel-index / panel-messages / image-handler）
 * 逐字零改。每函数收 ChatPanel 实例为 `panel`（webview postMessage 出口 + 原型方法直呼面；
 * 同 `panel-mcp.mjs` 惯例；纯转口项亦保同形入参）。逐字搬迁——零改名 / 零新分支 / 零顺手优化。
 */
import { setSlotAutoApprove, setSlotPlanMode } from "./session-io.mjs"
import {
  providerStatus as settingsProviderStatus, saveProviderKey as settingsSaveProviderKey,
  deleteProviderKey as settingsDeleteProviderKey, saveMcpServer as settingsSaveMcpServer,
  deleteMcpServer as settingsDeleteMcpServer, pushStatus as settingsPushStatus, fullStatus,
  agentSettings, proxySettings, shellCandidates, websearchSettings,
} from "./settings.mjs"
import { _cwd } from "./panel-messages.mjs"
import { loadRaw } from "@thincoder/core/config-io.mjs"

export function providerStatus(panel) {
  return settingsProviderStatus()
}

export async function saveProviderKey(panel, name, key) {
  await settingsSaveProviderKey(name, key)
  panel._pushStatus()
}

export async function deleteProviderKey(panel, name) {
  await settingsDeleteProviderKey(name)
  panel._pushStatus()
}

export function saveMcpServer(panel, name, config) {
  return settingsSaveMcpServer(name, config)
}

export function deleteMcpServer(panel, name) {
  return settingsDeleteMcpServer(name)
}

export async function setAutoApprove(panel, value) {
  panel._autoApprove = value  // mid-turn source of truth for the permission gate
  // Session-level persistence (CLI parity): autoApprove lives in the slot file shared
  // with the CLI — NOT in VS Code settings.json. Workspace-scope overrides of the old
  // `thincoder.autoApprove` setting are gone with it (the setting is removed).
  try {
    setSlotAutoApprove(_cwd(), panel._ensureSlot(), value)
  } catch { /* slot unwritable — the live flag still governs this turn */ }
}

/** Toggle plan mode (session-level, like autoApprove). Persists to the slot so the
 *  toolbar button and the model's own plan tool stay in sync across turns.
 *  ENG-PLAN-EXCLUSION（FR31 ② / AC13/T11）：工程模式 ⇒ **开方向拒绝**——不写槽 + 回弹
 *  `{type:"planMode", active:false}`（真值 = 槽权威面 `agentSettings(_agentSettingsSession())`
 *  ——`_agentSettingsSession` 先例同档 `:359-364`；不读 `_agent`，恢复后的工程会话首回合前也不
 *  fail-open）。关方向（value:false）是归零语义（`handleSetEngineeringEnabled` ON 时就地调它），
 *  照常走既有契约（槽写 + 回推）——工程态下它只会把残留半状态清干净。 */
export async function setPlanMode(panel, value) {
  if (value === true && panel._engineeringOn()) {
    panel._panel?.webview.postMessage({ type: "planMode", active: false })
    return
  }
  try {
    setSlotPlanMode(_cwd(), panel._ensureSlot(), value)
  } catch { /* slot unwritable — the flag still governs this turn */ }
  panel._panel?.webview.postMessage({ type: "planMode", active: value })
}

/** 工程模式真值（槽权威面——`agentSettings` 槽优先/ config 回退；读失败 ⇒ 非工程——不制造假拒）。 */
export function engineeringOn(panel) {
  try { return agentSettings(panel._agentSettingsSession()).engineering === true } catch { return false }
}

export function pushStatus(panel) {
  settingsPushStatus(panel._panel)
}

/** Settings snapshot push WITHOUT the provider-model network probe (fullStatus).
 *  Used for save acknowledgements — the panel already shows what the user typed;
 *  a full re-probe would rebuild the settings panel and drop in-progress edits.
 *  **序 = 契约**（`SETTINGS.md` §2.8）：`agentSettings` 居末位——它是打开等待器的唯一
 *  触发拍（`webview/settings.js` 的 `requestAgentSettingsThen`），末位才能保证建面时
 *  其余快照已在位。 */
export async function pushSettingsLight(panel) {
  // Snapshot-only (no network probe) — but the snapshot must be COMPLETE: providerStatus
  // (per-provider proxy checkboxes revert without it) and shellCandidates WITH current
  // (the webview nulls the shell value when current is missing).
  // F-W18（`SETTINGS.md` §2.11）：shell 候选面探测 = 异步（`await`，不阻塞宿主事件循环）——
  // **相对序零改**：agentSettings 仍居末位（打开等待器唯一触发拍——W8-1 序契约）。
  settingsPushStatus(panel._panel)
  panel._panel?.webview.postMessage({ type: "proxySettings", settings: proxySettings() })
  panel._panel?.webview.postMessage({ type: "websearchSettings", settings: websearchSettings() })
  panel._panel?.webview.postMessage({ type: "shellCandidates", candidates: await shellCandidates(), current: loadRaw().shell ?? null })
  panel._panel?.webview.postMessage({ type: "agentSettings", settings: agentSettings(panel._agentSettingsSession()) })
}

export async function pushSettings(panel) {
  fullStatus(panel._panel)
  // F-W18（§2.11）：候选面就绪后再发快照族（异步探测——不阻塞事件循环；相对序零改）。
  const candidates = await shellCandidates()
  panel._panel?.webview.postMessage({ type: "agentSettings", settings: agentSettings(panel._agentSettingsSession()) })
  panel._panel?.webview.postMessage({ type: "proxySettings", settings: proxySettings() })
  panel._panel?.webview.postMessage({ type: "websearchSettings", settings: websearchSettings() })
  panel._panel?.webview.postMessage({ type: "shellCandidates", candidates, current: loadRaw().shell ?? null })
  panel._pushMcpStatus()
  panel._pushIndexStatus()
}

/** Session reference for the agentSettings snapshot: engineering/advisor.guard are
 *  session-level (slot authority) — the ENG/GUARD buttons must reflect the session,
 *  not global config. Unbound panel (no slot yet) → null → config fallback. */
export function agentSettingsSession(panel) {
  try {
    const slot = panel._slot ?? panel._ensureSlot()
    return slot != null ? { cwd: _cwd(), slot } : null
  } catch { return null }
}
