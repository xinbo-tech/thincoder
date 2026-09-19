/**
 * panel-messages-settings.mjs — 设置类消息 handler（自 `panel-messages.mjs` 拆出——VSC 四档
 * 结构拆分批 2026-09-18 · 设计 `docs/vsc/design/VSC-DEBT.md` §12.2.2）。
 *
 * 迁出段（28 case · 逐字搬迁——既有注释一并随迁）：渠道 / 密钥 / MCP / Shell / 代理 / guard /
 * 计划模式族——`saveProviderKey` … `testProxy`。
 * 手法 = `panel-messages-session.mjs` 既定先例：case 体逐字搬出为 `handleXxx(panel, msg)`
 * 导出；case 包裹大括号去除 · 中途 `break` → `return` · 尾 `break` 去除（分发续行由
 * `panel-messages.mjs` 分发表各 case 的 `break` 保持）。
 *
 * 缝保持：`panel-messages.mjs` 分发表仍按**同名 case 标签**分发（转发行）——case 标签集合零变化
 * （`protocol-coverage-reverse.test.mjs` 的 `HOST_DISPATCH` 扫 `panel-messages*.mjs`；本档零顶级
 * case 标签）。
 *
 * 一处**具名适配（零语义）**：`settings.mjs` 三件与会话外写入面的 `handle*` 名与本档 handler 名
 * 同形冲突（`handleAddProvider` / `handleRemoveProvider` / `handleSetProviderProxy`）⇒ 该三件
 * 以 `persist` 前缀别名引入（调用点逐字等价——仅符号名相异；其余 25 case 零适配）。
 *
 * 环 import（同 `panel-messages ↔ panel-messages-session` 先例）：本档反向 import 主档 `_cwd`
 * ——仅在本档 handler 体内解引用（延迟解引用）⇒ 两模块顶层零跨环读取——环安全。
 */
import { loadRaw } from "@thincoder/core/config-io.mjs"
import { loadMcpServers } from "../config-mcp.mjs"
import { addProviderFlow, removeProviderFlow, setKeyFlow, probeProviderAdmission } from "./provider-flows.mjs"
import { handleAddProvider as persistAddProvider, handleRemoveProvider as persistRemoveProvider, handleSetProviderProxy as persistSetProviderProxy, saveAgentSettingsFromPanel, saveProxySettingsFromPanel, testProxyConnection, shellCandidates, saveShellSettingsFromPanel, saveWebsearchKeyFromPanel, deleteWebsearchKeyFromPanel, testProviderConnection } from "./settings.mjs"
import { setSlotAdvisorGuard, setSlotEngineering } from "./session-io.mjs"
import { _cwd } from "./panel-messages.mjs"

/** 迁出自 `panel-messages.mjs` 的 case "saveProviderKey"。 */
export async function handleSaveProviderKey(panel, msg) { await panel._saveProviderKey(msg.name, msg.key) }

/** 迁出自 `panel-messages.mjs` 的 case "deleteProviderKey"。 */
export async function handleDeleteProviderKey(panel, msg) { await panel._deleteProviderKey(msg.name) }

/** 迁出自 `panel-messages.mjs` 的 case "saveMcpServer"。 */
export async function handleSaveMcpServer(panel, msg) { await panel._saveMcpServer(msg.name, msg.config); panel._pushMcpStatus() }

/** 迁出自 `panel-messages.mjs` 的 case "deleteMcpServer"。 */
export async function handleDeleteMcpServer(panel, msg) { await panel._deleteMcpServer(msg.name); panel._pushMcpStatus() }

// MCP.md §4 F5/D-4：reconnectMcp（既有死按钮修复——webview 已在发此消息，路由拆分时
// 丢失）+ edit/test（CLI /mcp edit/test parity，交互随面板惯例）。

/** 迁出自 `panel-messages.mjs` 的 case "reconnectMcp"。 */
export async function handleReconnectMcp(panel, msg) { await panel._reconnectMcp(msg.name) }

/** 迁出自 `panel-messages.mjs` 的 case "editMcp"。 */
export function handleEditMcp(panel, msg) { panel._editMcp(msg.name, msg.config ?? {}) }

/** 迁出自 `panel-messages.mjs` 的 case "testMcp"。 */
export async function handleTestMcp(panel, msg) { await panel._testMcp(msg.name) }

/** 迁出自 `panel-messages.mjs` 的 case "addProvider"。 */
export async function handleAddProvider(panel, msg) {
  // Payload form (settings panel [+ Add] form): persist directly.
  // No payload (model dropdown shortcut): interactive QuickPick flow.
  if (msg.preset || msg.custom) {
    const err = persistAddProvider({ preset: msg.preset, custom: msg.custom, key: msg.key })
    if (err) {
      panel._panel?.webview.postMessage({ type: "providerError", text: err })
      panel._pushSettings()
      return
    }
    panel._pushSettings()
    // M9 渠道准入（配置写入面）：加渠道后探一次 GET /models——探通则候选可用；探不通
    // 界面明示失败消息（消息本体逐字长句）+ 行内标「不可用」（**不阻断保存**——条目已
    // 落盘；探针失败不缓存，下次配置动作重探）。
    const name = msg.custom?.name || msg.preset
    if (name) {
      const probe = await probeProviderAdmission(name)
      if (!probe.ok) {
        panel._panel?.webview.postMessage({ type: "providerError", text: probe.error })
        panel._pushStatus() // 准入展示态刚更新——状态行重推（行内标 `不可用`）
      }
    }
  } else {
    await addProviderFlow(() => panel._pushSettings())
  }
}

/** 迁出自 `panel-messages.mjs` 的 case "removeProvider"。 */
export async function handleRemoveProvider(panel, msg) {
  if (msg.name) {
    const err = persistRemoveProvider(msg.name)
    if (err) panel._panel?.webview.postMessage({ type: "providerError", text: err })
    panel._pushSettings()
  } else {
    await removeProviderFlow(() => panel._pushSettings())
  }
}

/** 迁出自 `panel-messages.mjs` 的 case "setProviderProxy"。 */
export function handleSetProviderProxy(panel, msg) {
  persistSetProviderProxy(msg.name, msg.proxy === true)
  panel._pushSettingsLight()
}

/** 迁出自 `panel-messages.mjs` 的 case "setKey"。 */
export async function handleSetKey(panel) { await setKeyFlow(() => panel._pushSettings()) }

/** 迁出自 `panel-messages.mjs` 的 case "saveEmbedKey"。 */
export async function handleSaveEmbedKey(panel, msg) { await panel._saveEmbeddingConfig({ apiKey: msg.key }) }

/** 迁出自 `panel-messages.mjs` 的 case "deleteEmbedKey"。 */
export async function handleDeleteEmbedKey(panel) { await panel._saveEmbeddingConfig({ apiKey: "" }) }

/** 迁出自 `panel-messages.mjs` 的 case "saveWebsearchKey"。 */
export function handleSaveWebsearchKey(panel, msg) { saveWebsearchKeyFromPanel(msg.key); panel._pushSettingsLight() }

/** 迁出自 `panel-messages.mjs` 的 case "deleteWebsearchKey"。 */
export function handleDeleteWebsearchKey(panel) { deleteWebsearchKeyFromPanel(); panel._pushSettingsLight() }

/** 迁出自 `panel-messages.mjs` 的 case "testProvider"。 */
export async function handleTestProvider(panel, msg) {
  // M1 三 format 分派：format 随表单透传（anthropic/google 与 openai 端点/头不同）
  const r = await testProviderConnection({ baseURL: msg.baseURL, apiKey: msg.apiKey, format: msg.format })
  panel._panel?.webview.postMessage({ type: "testProviderResult", ...r })
}

/** 迁出自 `panel-messages.mjs` 的 case "buildIndex"。 */
export async function handleBuildIndex(panel) { await panel._buildIndex() }

/** 迁出自 `panel-messages.mjs` 的 case "getMcpStatus"。 */
export function handleGetMcpStatus(panel) { panel._pushMcpStatus() }

/** 迁出自 `panel-messages.mjs` 的 case "mcpTools"。 */
export async function handleMcpTools(panel, msg) {
  // Probe/expand: connect (idempotent — reuses the live connection) and return the
  // tool list for the settings panel's per-server expander.
  try {
    const { mcpConnect } = await import("./panel-mcp.mjs")
    const servers = loadMcpServers()
    const cfg = servers.find((x) => x.name === msg.name)
    if (!cfg) throw new Error(`no MCP server named "${msg.name}"`)
    const r = await mcpConnect(cfg)
    panel._panel?.webview.postMessage({ type: "mcpTools", name: msg.name, tools: r.tools })
  } catch (e) {
    panel._panel?.webview.postMessage({ type: "mcpTools", name: msg.name, error: e?.message ?? String(e) })
  }
}

/** 迁出自 `panel-messages.mjs` 的 case "saveAgentSettings"。 */
export function handleSaveAgentSettings(panel, msg) {
  saveAgentSettingsFromPanel(msg.settings ?? {})
  panel._pushSettingsLight()
}

// F-W8（`SETTINGS.md` §2.8）：打开拍回批——既有 `getAgentSettings` 拉取的回批固定序
// `indexStatus → providerStatus · proxySettings · websearchSettings · shellCandidates →
// agentSettings（末位）`：三条快照（索引 / 代理 / 检索）随打开拍必达（不依赖后台巧合），
// 末位 agentSettings = webview 打开等待器的唯一触发拍 ⇒ 建面时快照已在位。零新增协议 type。

/** 迁出自 `panel-messages.mjs` 的 case "getAgentSettings"。
 *  F-W18（§2.11）：await 序——`indexStatus` 先落，其后快照族（含异步 shell 候选面）；
 *  两拍均 await ⇒ 回批序 = 契约序（W8-1 机检面）。 */
export async function handleGetAgentSettings(panel) {
  await panel._pushIndexStatus()
  await panel._pushSettingsLight()
}

/** 迁出自 `panel-messages.mjs` 的 case "setAdvisorGuard"。 */
export function handleSetAdvisorGuard(panel, msg) {
  // Slot first (session-level authority, 2026-08-29), then the config.json mirror
  // (CLI compat). A slot write failure must not block the config write.
  try { setSlotAdvisorGuard(_cwd(), panel._ensureSlot(), !!msg.value) } catch {}
  saveAgentSettingsFromPanel({ advisor: { guard: !!msg.value } })
  panel._pushSettingsLight()
}

/** 迁出自 `panel-messages.mjs` 的 case "setEngineeringEnabled"。 */
export function handleSetEngineeringEnabled(panel, msg) {
  // Same dual-write contract as setAdvisorGuard above: slot authority + config mirror.
  try { setSlotEngineering(_cwd(), panel._ensureSlot(), !!msg.value) } catch {}
  saveAgentSettingsFromPanel({ engineering: !!msg.value })
  panel._pushSettingsLight()
}

/** 迁出自 `panel-messages.mjs` 的 case "setPlanMode"。 */
export async function handleSetPlanMode(panel, msg) {
  await panel._setPlanMode(!!msg.value)
}

/** 迁出自 `panel-messages.mjs` 的 case "getShellCandidates"（F-W18：异步探测——await 回批）。 */
export async function handleGetShellCandidates(panel) { panel._panel?.webview.postMessage({ type: "shellCandidates", candidates: await shellCandidates(), current: loadRaw().shell ?? null }) }

/** 迁出自 `panel-messages.mjs` 的 case "saveShellSettings"。 */
export function handleSaveShellSettings(panel, msg) {
  saveShellSettingsFromPanel(msg.value)
  panel._pushSettingsLight()
}

/** 迁出自 `panel-messages.mjs` 的 case "saveProxySettings"。 */
export function handleSaveProxySettings(panel, msg) {
  saveProxySettingsFromPanel(msg.settings ?? {})
  panel._pushSettingsLight()
}

/** 迁出自 `panel-messages.mjs` 的 case "testProxy"。 */
export async function handleTestProxy(panel, msg) {
  const result = await testProxyConnection(msg.uri)
  panel._panel?.webview.postMessage({ type: "proxyTestResult", result })
}
