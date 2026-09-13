/**
 * panel-mcp.mjs — ChatPanel MCP status push + reconnect/edit/test (split out of chat-panel.mjs).
 * Every function takes the ChatPanel instance as `panel`.
 */
import { mcpConnectedToolCounts, mcpConnect, mcpDisconnectByName, probeMcpServer } from "../mcp.mjs"
import { getMcpServers, connectedMcpServers, saveMcpServer } from "./settings.mjs"

export function pushMcpStatus(panel) {
    const servers = getMcpServers() // array of { name, command?, args?, env?, url?, wsUrl?, headers?, token? }
    const connected = connectedMcpServers()
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
   *  token 字段透传（F6——mcpConnect 内部经 withBearerToken 合成 Authorization）。 */
export async function reconnectMcp(panel, name) {
    const servers = getMcpServers()
    const srv = servers.find((s) => s.name === name)
    if (!srv) { panel._panel?.webview.postMessage({ type: "providerError", text: `No MCP server named "${name}"` }); return }
    try {
      mcpDisconnectByName(name)
      const client = await mcpConnect({
        name: srv.name,
        command: srv.command, args: srv.args, env: srv.env,
        url: srv.url, wsUrl: srv.wsUrl, headers: srv.headers, token: srv.token,
      })
      panel._panel?.webview.postMessage({ type: "mcpReconnected", name, tools: client.tools.length })
    } catch (e) {
      panel._panel?.webview.postMessage({ type: "providerError", text: `MCP reconnect ${name} failed: ${e.message}` })
    }
    pushMcpStatus(panel)
  }

  /** Test an MCP server: one-shot liveness probe (settings panel [Test], F4/D-2 CLI 镜像).
   *  零副作用：probeMcpServer 不进注册表、不动本轮工具，探完即关。成功报
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
