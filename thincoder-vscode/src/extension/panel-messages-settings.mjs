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
 * （本档零顶级 case 标签）。
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
import { removeProviderFlow, setKeyFlow, probeProviderAdmission, ui } from "./provider-flows.mjs"
import { handleAddProvider as persistAddProvider, handleRemoveProvider as persistRemoveProvider, handleSetProviderProxy as persistSetProviderProxy, saveAgentSettingsFromPanel, saveProxySettingsFromPanel, testProxyConnection, shellCandidates, saveShellSettingsFromPanel, saveWebsearchKeyFromPanel, deleteWebsearchKeyFromPanel, testProviderConnection, postProviderError, pushTeamStatus } from "./settings.mjs"
import { setSlotAdvisorGuard, setSlotEngineering } from "./session-io.mjs"
import { teamLogin, teamLogout } from "./team.mjs"
// F-W21（登录面补全批）：状态栏团队 item 随动（webview 登/退成拍——命令流外的第二条写径）
import { refreshTeamSurface } from "./team-surface.mjs"
import { _cwd } from "./panel-messages.mjs"

/** 迁出自 `panel-messages.mjs` 的 case "saveProviderKey"（#695：写结果捕获——冲突 ⇒ `providers` 段失败面）。
 *  #1053：成功径发受理回执 `providerKeySaved { name }`（webview 闪徽标 / 恢复密钥行的唯一触发）；
 *  拒径 = `providerError` + `return`——零回执 ⇒ 徽标零闪 ∥ 行不关（语义单源 = `docs/vsc/design/SETTINGS.md` §2.18）。
 *  #1073：回执 ⟺ **真写**——写面三态（`ok` ⇒ 回执；`no-write`（空钥守卫）⇒ 零回执 + warn 一条（零静默）；
 *  `conflict` ⇒ `providerError` 映射照旧）。 */
export async function handleSaveProviderKey(panel, msg) {
  const result = await panel._saveProviderKey(msg.name, msg.key)
  if (result?.status === "no-write") {
    console.warn(`[vsc] saveProviderKey "${msg.name}": empty key — no write, no receipt`)
    return
  }
  if (result?.status === "conflict") {
    postProviderError(panel, "providers", result.hint)
    return
  }
  if (result?.status !== "ok") return // #1073：回执 ⟺ 真写（未知态零回执——零假成功）
  panel._panel?.webview.postMessage({ type: "providerKeySaved", name: msg.name })
}

/** 迁出自 `panel-messages.mjs` 的 case "deleteProviderKey"（#695：同式）。 */
export async function handleDeleteProviderKey(panel, msg) {
  const err = await panel._deleteProviderKey(msg.name)
  if (err) postProviderError(panel, "providers", err)
}

/** 迁出自 `panel-messages.mjs` 的 case "saveMcpServer"（#695：写结果捕获——冲突 ⇒ `mcp` 段失败面）。 */
export async function handleSaveMcpServer(panel, msg) {
  const err = await panel._saveMcpServer(msg.name, msg.config)
  if (err) postProviderError(panel, "mcp", err)
  panel._pushMcpStatus()
}

/** 迁出自 `panel-messages.mjs` 的 case "deleteMcpServer"（#695：同式）。 */
export async function handleDeleteMcpServer(panel, msg) {
  const err = await panel._deleteMcpServer(msg.name)
  if (err) postProviderError(panel, "mcp", err)
  panel._pushMcpStatus()
}

// MCP.md §4 F5/D-4：reconnectMcp（既有死按钮修复——webview 已在发此消息，路由拆分时
// 丢失）+ edit/test（CLI /mcp edit/test parity，交互随面板惯例）。

/** 迁出自 `panel-messages.mjs` 的 case "reconnectMcp"。 */
export async function handleReconnectMcp(panel, msg) { await panel._reconnectMcp(msg.name) }

/** 迁出自 `panel-messages.mjs` 的 case "editMcp"。 */
export function handleEditMcp(panel, msg) { panel._editMcp(msg.name, msg.config ?? {}) }

/** 迁出自 `panel-messages.mjs` 的 case "testMcp"。 */
export async function handleTestMcp(panel, msg) { await panel._testMcp(msg.name) }

/** 迁出自 `panel-messages.mjs` 的 case "addProvider"。#1027：载荷 +`proxy` 透传核 `addProviderEntry`（`=== true` ⇒ 同批落旗）。
 *  #1054（添加入口弹窗统一批）：无载荷支（QuickPick 增流程）退场——页脚「+ Add provider…」= webview
 *  本地面动作（零出站）⇒ 残留分支 = 畸形载荷 ⇒ `console.error` 零动作（fail-loud）。 */
export async function handleAddProvider(panel, msg) {
  // Payload form (settings panel add dialog): persist directly.
  if (msg.preset || msg.custom) {
    const err = persistAddProvider({ preset: msg.preset, custom: msg.custom, key: msg.key, proxy: msg.proxy })
    if (err) {
      postProviderError(panel, "providers", err)
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
        postProviderError(panel, "providers", probe.error)
        panel._pushStatus() // 准入展示态刚更新——状态行重推（行内标 `不可用`）
      }
    }
  } else {
    // 无载荷支（QuickPick 增流程）随 #1054 退场（唯一调用点即此支）；畸形载荷 ⇒ fail-loud 零动作。
    console.error("[addProvider] malformed payload (no preset/custom) — the no-payload QuickPick flow retired with #1054")
  }
}

/** 迁出自 `panel-messages.mjs` 的 case "removeProvider"。 */
export async function handleRemoveProvider(panel, msg) {
  if (msg.name) {
    const err = persistRemoveProvider(msg.name)
    if (err) postProviderError(panel, "providers", err)
    panel._pushSettings()
  } else {
    await removeProviderFlow(ui, () => panel._pushSettings())
  }
}

/** 迁出自 `panel-messages.mjs` 的 case "setProviderProxy"（#695：写结果捕获——冲突 ⇒ `providers` 段失败面）。 */
export function handleSetProviderProxy(panel, msg) {
  const err = persistSetProviderProxy(msg.name, msg.proxy === true)
  if (err) postProviderError(panel, "providers", err)
  panel._pushSettingsLight()
}

/** 迁出自 `panel-messages.mjs` 的 case "setKey"。 */
export async function handleSetKey(panel) { await setKeyFlow(ui, () => panel._pushSettings()) }

/** 迁出自 `panel-messages.mjs` 的 case "saveEmbedKey"（#695：写结果捕获——冲突 ⇒ `tools` 段失败面）。 */
export async function handleSaveEmbedKey(panel, msg) {
  const err = await panel._saveEmbeddingConfig({ apiKey: msg.key })
  if (err) postProviderError(panel, "tools", err)
}

/** 迁出自 `panel-messages.mjs` 的 case "deleteEmbedKey"（#695：同式）。 */
export async function handleDeleteEmbedKey(panel) {
  const err = await panel._saveEmbeddingConfig({ apiKey: "" })
  if (err) postProviderError(panel, "tools", err)
}

/** 迁出自 `panel-messages.mjs` 的 case "saveWebsearchKey"（#695：写结果捕获——冲突 ⇒ `tools` 段失败面）。 */
export function handleSaveWebsearchKey(panel, msg) {
  const err = saveWebsearchKeyFromPanel(msg.key)
  if (err) postProviderError(panel, "tools", err)
  panel._pushSettingsLight()
}

/** 迁出自 `panel-messages.mjs` 的 case "deleteWebsearchKey"（#695：同式）。 */
export function handleDeleteWebsearchKey(panel) {
  const err = deleteWebsearchKeyFromPanel()
  if (err) postProviderError(panel, "tools", err)
  panel._pushSettingsLight()
}

/** 迁出自 `panel-messages.mjs` 的 case "testProvider"。③′：载荷 +`proxy` 透传（未勾 ∥ 缺省 ⇒ 直连）。
 *  #1051（2026-10-10 vsc-consistency 批）：请求归属判据面——**结果原样回显 `id`**（webview 落框前
 *  按 id 判归属：旧框在飞果 ∥ 重放果弃）；载荷缺 `id`（无请求 id 的发送方）⇒ 结果不携。 */
export async function handleTestProvider(panel, msg) {
  // M1 三 format 分派：format 随表单透传（anthropic/google 与 openai 端点/头不同）
  const r = await testProviderConnection({ baseURL: msg.baseURL, apiKey: msg.apiKey, format: msg.format, proxy: msg.proxy })
  panel._panel?.webview.postMessage({ type: "testProviderResult", ...r, ...(msg.id !== undefined ? { id: msg.id } : {}) })
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
  const err = saveAgentSettingsFromPanel(msg.settings ?? {})
  if (err) postProviderError(panel, "agent", err)
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
  // Slot only (session-level authority, 2026-08-29) — no config.json mirror: the slot is the
  // single writer of `advisor.guard` on the panel face (a slot write failure blocks nothing else).
  try { setSlotAdvisorGuard(_cwd(), panel._ensureSlot(), !!msg.value) } catch {}
  panel._pushSettingsLight()
}

/** 迁出自 `panel-messages.mjs` 的 case "setEngineeringEnabled"。 */
export function handleSetEngineeringEnabled(panel, msg) {
  const on = !!msg.value
  // ENG-PLAN-EXCLUSION（FR31 ③ / T12——翻转点③·VSC）：ON 先清 plan 残留（槽 planMode=false
  // + 回推面板）——清在工程位写槽之**前**（此刻 panel 读到的仍是旧模式位——走 `_setPlanMode`
  // 既有槽写契约；工程位写后 plan 面才是拒绝态）。否则槽 `{engineering:true, planMode:true}`
  // 半状态每次装载复活（FR31 ③ 要消灭的形态）。
  if (on) void panel._setPlanMode(false)
  try { setSlotEngineering(_cwd(), panel._ensureSlot(), on) } catch {}
  panel._pushSettingsLight()
}

/** 迁出自 `panel-messages.mjs` 的 case "setPlanMode"。 */
export async function handleSetPlanMode(panel, msg) {
  await panel._setPlanMode(!!msg.value)
}

/** 迁出自 `panel-messages.mjs` 的 case "getShellCandidates"（F-W18：异步探测——await 回批）。 */
export async function handleGetShellCandidates(panel) { panel._panel?.webview.postMessage({ type: "shellCandidates", candidates: await shellCandidates(), current: loadRaw().shell ?? null }) }

/** 迁出自 `panel-messages.mjs` 的 case "saveShellSettings"（#695：返回契约已到位、接线补全——冲突 ⇒ `env` 段失败面）。 */
export function handleSaveShellSettings(panel, msg) {
  const err = saveShellSettingsFromPanel(msg.value)
  if (err) postProviderError(panel, "env", err)
  panel._pushSettingsLight()
}

/** 迁出自 `panel-messages.mjs` 的 case "saveProxySettings"。P2-5（#677）：校验拒 ⇒ 零写盘 + 失败面（`env` 段）。 */
export function handleSaveProxySettings(panel, msg) {
  const err = saveProxySettingsFromPanel(msg.settings ?? {})
  if (err) postProviderError(panel, "env", err)
  panel._pushSettingsLight()
}

/** 迁出自 `panel-messages.mjs` 的 case "testProxy"。 */
export async function handleTestProxy(panel, msg) {
  const result = await testProxyConnection(msg.uri)
  panel._panel?.webview.postMessage({ type: "proxyTestResult", result })
}

// ─── B1（团队族——登录 ∥ 退出；机制单源 = `docs/core/design/TEAM.md` §2 ∥ 端面 = `SETTINGS.md` §2.20）───

/** case "teamLogin"（webview → host）：三字段 ⇒ 核 `teamLogin`（端侧零自写盘）⇒ 成 ⇒ 推 `teamStatus`
 *  + `providerStatus`（派生条目入列表——Providers 卡随动）⇒ 回执 `teamLoginResult` `{ ok, notice? }` ∥
 *  `{ ok:false, reason }`（码不携文——出词归 webview i18n——§2.20 回执形）。回执殿后：推送先落（卡面
 *  转新态）⇒ 一次性提示（同名手工条目冲突）就地显于新态卡面（`teamStatus` 零提示字段）。 */
export async function handleTeamLogin(panel, msg) {
  const r = await teamLogin({ server: msg.server, username: msg.username, password: msg.password })
  if (r.ok) {
    pushTeamStatus(panel._panel)
    panel._pushStatus()
    refreshTeamSurface() // F-W21：团队 item 随动（设置面板 ∥ 面板外常显面同拍）
  }
  panel._panel?.webview.postMessage({ type: "teamLoginResult", ...r })
}

/** case "teamLogout"（webview → host）：核 `teamLogout`（吊销 best-effort——网络失败照清本地）⇒ 成 ⇒
 *  推 `teamStatus` + `providerStatus`（派生条目退场——无 key ⇒ 列表隐藏——`TEAM.md` §2.4）⇒ 回执
 *  `teamLogoutResult` `{ ok, revokeDelivered? }`（缺席 = true；false ⇒ webview 卡内就地提示）。 */
export async function handleTeamLogout(panel) {
  const r = await teamLogout()
  if (r.ok) {
    pushTeamStatus(panel._panel)
    panel._pushStatus()
    refreshTeamSurface() // F-W21：团队 item 随动（退出 ⇒ 入口态／已失效清位）
  }
  panel._panel?.webview.postMessage({ type: "teamLogoutResult", ...r })
}
