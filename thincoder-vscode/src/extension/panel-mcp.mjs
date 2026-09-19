/**
 * panel-mcp.mjs — VS Code 端壳 MCP 面：ChatPanel 的 MCP 页状态推送 + 重连/编辑/探活
 * （原自 chat-panel.mjs 拆出），并承载 **端壳增量**（S2 W7 迁入——原 MCP 客户端注册表面
 * 的 client-id 注册表 + 面板状态接口；自持镜像已删）。
 *
 * 单源 = `@thincoder/core/mcp.mjs`（name-key session 面）：连接 / 工具展开 / 幂等指纹 /
 * 后台退避自愈 / 一次性探活全在核内；本档只持端壳特有的两项：
 *   ① client-id 注册表 + 面板工具投影（`mcpConnect` 的返回形状 `{ id, serverName, tools }`
 *      ——id 按 name 稳定：面板 / session 引用跨重连不漂移；`tools` = 面板契约投影
 *      `{ name, description, inputSchema }`——核原生工具的 schema 在 `parameters`）；
 *   ② 面板状态接口（`mcpConnectedNames` / `mcpConnectedToolCounts` / `mcpDisconnectByName`
 *      / `closeAllMcp`）——状态与断开按核 name-key session 注册表（`_sessions`）办理，即活
 *      连接真值面（核 `connectMcpServer` 以 name 键控；重连原位换 transport、键不变）。
 *
 * 每函数收 ChatPanel 实例为 `panel`（webview postMessage 出口）。
 */
import { connectMcpServer, probeMcpServer, _sessions } from "@thincoder/core/mcp.mjs"
import { getMcpServers, saveMcpServer } from "./settings.mjs"

// ─── 端壳增量①：client-id 注册表 + 面板工具投影（name-key 核面 → 端壳面适配）─────

/** serverName → 稳定 client id（重连复用同 id——面板引用稳定）。 */
const _clientIds = new Map()
let _clientSeq = 0

function clientIdFor(serverName) {
  let id = _clientIds.get(serverName)
  if (!id) { id = `mcp-${++_clientSeq}`; _clientIds.set(serverName, id) }
  return id
}

/** 面板展开器契约投影：核原生工具 → `{ name, description, inputSchema }`（webview
 *  `updateMcpTools` 逐字段消费——原生 schema 落在 `parameters`；`execute`/`_mcpTransport`
 *  等运行期字段不带出端壳；工具名 = 原生 `{server}_{tool}` 名）。 */
function panelToolList(tools) {
  return tools.map((t) => ({ name: t.name, description: t.description, inputSchema: t.parameters }))
}

/** Connect to an MCP server (idempotent — the core reuses a live session with the
 *  same name + fingerprint; a dead transport or changed config reconnects).
 *  `tools` = 面板契约投影（面板展开器消费）；工具表装配面走 `connectMcpServersExpanded`。
 *  @returns {Promise<{ id: string, serverName: string, tools: object[] }>} */
export async function mcpConnect(config) {
  const tools = await connectMcpServer(config)
  const serverName = config.name ?? config.command ?? config.url ?? config.wsUrl
  return { id: clientIdFor(serverName), serverName, tools: panelToolList(tools) }
}

/** Batch idempotent connect + expansion for the agent tool table (depth-0 assembly ——
 *  原生工具面、非面板投影）。Failures never block: each failing server produces
 *  a warning entry instead.
 *  @returns {Promise<{ tools: object[], warnings: string[] }>} */
export async function connectMcpServersExpanded(configs) {
  const tools = []
  const warnings = []
  const settled = await Promise.allSettled(configs.map((cfg) => connectMcpServer(cfg)))
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") { tools.push(...r.value); return }
    const cfg = configs[i]
    const label = cfg.name || cfg.command || cfg.url || cfg.wsUrl || "(unnamed)"
    const msg = `MCP server "${label}" failed to connect: ${r.reason?.message ?? String(r.reason)}`
    warnings.push(msg)
    // D-CI7（F-Q11——cli make-agent.mjs:105-107 同前缀）：失败可见面 = console
    // （采集点）；mcpWarnings 字段保留（消费面 = console——不发明 history 注入，CLI 无此行为）。
    console.error("[mcp] " + msg)
  })
  return { tools, warnings }
}

// ─── 端壳增量②：面板状态接口（核 `_sessions` = 活连接真值面）─────────────

/** Connected server names (for the settings panel ●/○ status). */
export function mcpConnectedNames() {
  return [..._sessions.keys()]
}

/** Connected server name → tool count (settings panel status). */
export function mcpConnectedToolCounts() {
  const out = {}
  for (const [name, session] of _sessions) out[name] = session.state?.tools?.length ?? 0
  return out
}

/** Close the live session of one server name（面板 [Reconnect] 先断开、再走全新连）。
 *  与核内 closeSession 同语义：closed 标记 + transport.close + 注册表移除。 */
function closeSessionByName(name) {
  const session = _sessions.get(name)
  if (!session) return
  session.closed = true
  try { session.state?.transport?.close() } catch { /* best effort */ }
  _sessions.delete(name)
}

/** Disconnect all connections to a named server (settings panel reconnect). */
export function mcpDisconnectByName(name) {
  closeSessionByName(name)
}

/** Close all MCP connections (extension deactivate / panel view dispose). */
export function closeAllMcp() {
  for (const name of [..._sessions.keys()]) closeSessionByName(name)
}

// ─── Settings 面板 MCP 页载荷面 ────────────────────────────────

export function pushMcpStatus(panel) {
    const servers = getMcpServers() // array of { name, command?, args?, env?, url?, wsUrl?, headers?, token? }
    const connected = mcpConnectedNames()
    const toolCounts = mcpConnectedToolCounts()
    const status = servers.map((s) => ({
      name: s.name,
      desc: s.wsUrl ? s.wsUrl : s.url ? s.url : `${s.command} ${(s.args ?? []).join(" ")}`,
      connected: connected.includes(s.name),
      toolCount: toolCounts[s.name] ?? 0,
      // F5：[Edit] 表单预填 + token 表单字段——原始 config 随状态行下发
      config: {
        command: s.command, args: s.args, env: s.env,
        url: s.url, wsUrl: s.wsUrl, headers: s.headers, token: s.token,
      },
    }))
    panel._panel?.webview.postMessage({ type: "mcpStatus", servers: status })
  }

  /** Reconnect an MCP server: disconnect + reconnect (settings panel [Reconnect]).
   *  token 字段透传（F6——mcpConnect 内部经核 withBearerToken 合成 Authorization）。 */
export async function reconnectMcp(panel, name) {
    const servers = getMcpServers()
    const srv = servers.find((s) => s.name === name)
    if (!srv) { panel._panel?.webview.postMessage({ type: "providerError", text: `No MCP server named "${name}"` }); return }
    try {
      mcpDisconnectByName(name)
      await mcpConnect({
        name: srv.name,
        command: srv.command, args: srv.args, env: srv.env,
        url: srv.url, wsUrl: srv.wsUrl, headers: srv.headers, token: srv.token,
      })
      // 无消费者推送（`mcpReconnected`）已删——重连的用户可见效果由本函数尾 pushMcpStatus 全量覆盖
      // （发面处置 = 删；`WEBVIEW-PROTOCOL.md` §12 表行随退场）
    } catch (e) {
      panel._panel?.webview.postMessage({ type: "providerError", text: `MCP reconnect ${name} failed: ${e.message}` })
    }
    pushMcpStatus(panel)
  }

  /** Test an MCP server: one-shot liveness probe (settings panel [Test], F4/D-2 CLI 镜像).
   *  零副作用：核 probeMcpServer 不进 session 注册表、不动本轮工具，探完即关。成功报
   *  mcpTestResult { name, ok, toolCount, latencyMs }；失败透传错误（405/401/超时）。 */
export async function testMcp(panel, name) {
    const servers = getMcpServers()
    const srv = servers.find((s) => s.name === name)
    if (!srv) { panel._panel?.webview.postMessage({ type: "providerError", text: `No MCP server named "${name}"` }); return }
    const r = await probeMcpServer({
      name: srv.name,
      command: srv.command, args: srv.args, env: srv.env,
      url: srv.url, wsUrl: srv.wsUrl, headers: srv.headers, token: srv.token,
    })
    panel._panel?.webview.postMessage({ type: "mcpTestResult", name, ...r })
  }

  /** Persist an MCP server edit (settings panel [Edit] form, F3/D-4).
   *  payload: { name, config } — 原位更新（saveMcpServer duplicate→update 语义，数组序保持）。
   *  变更在下一轮生效（runAgent 每 turn 重建工具表——热插拔，MCP.md D2）；然后回推状态。 */
export function editMcp(panel, name, config) {
    const err = saveMcpServer(name, config)
    if (err) panel._panel?.webview.postMessage({ type: "providerError", text: err })
    pushMcpStatus(panel)
  }
