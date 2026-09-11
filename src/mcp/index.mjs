/**
 * mcp/index.mjs — MCP client lifecycle (connect, list, call, disconnect)
 *
 * Connects to MCP servers via stdio, HTTP or WS transports, manages a server
 * registry, and expands each server's tools into native agent tools
 * (CLI parity — see thincoder docs/design/MCP.md).
 *
 * Exports:
 *   mcpConnect(serverConfig)        → client { id, serverName, tools } (idempotent per server name)
 *   connectMcpServersExpanded(cfgs) → { tools, warnings } — batch idempotent connect + expansion
 *   buildMcpTools(serverEntry)      → expanded native tools (CLI buildTools parity)
 *   probeMcpServer(config)          → { ok, toolCount, latencyMs } / { ok:false, error } (F4/D-2,
 *                                     CLI 镜像——零副作用一次性探活，panel testMcp 使用)
 *   mcpListTools(client) / mcpCallTool(client, name, args) / mcpDisconnect(client)
 *   closeAllMcp() / mcpConnectedNames() / mcpConnectedToolCounts() / mcpDisconnectByName(name)
 */

/** Race a pending MCP request against an abort signal — a hung MCP server must not
 *  hold the turn hostage. signal absent → passthrough (panel paths have no signal). */
async function sendWithSignal(promise, signal) {
  if (!signal) return promise
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      const e = new DOMException("The operation was aborted", "AbortError")
      e.reason = signal.reason
      reject(e)
    }
    if (signal.aborted) return onAbort()
    signal.addEventListener("abort", onAbort, { once: true })
    promise.then(
      (v) => { signal.removeEventListener("abort", onAbort); resolve(v) },
      (e) => { signal.removeEventListener("abort", onAbort); reject(e) },
    )
  })
}


import { withTimeout, INIT_TIMEOUT_MS, sanitizeToolName } from "./utils.mjs"
import { stdioTransport } from "./stdio.mjs"
import { httpTransport } from "./http.mjs"
import { wsTransport } from "./ws.mjs"

/** F6/D-5（CLI parity）：config.token → `Authorization: Bearer <token>` 合成（仅当
 *  headers 未显式给 Authorization——显式优先，向后兼容）。合成发生在传给 transport
 *  前，不写回 config。 */
export function withBearerToken(config) {
  if (!config?.token || config.headers?.Authorization) return config
  return { ...config, headers: { ...config.headers, Authorization: `Bearer ${config.token}` } }
}

// ─── MCP handshake ───────────────────────────────────────────────

/** Initialize the MCP handshake and return the server's tool list */
async function doInitialize(transport, _name) {
  const initResp = await withTimeout(
    transport.send("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "thincoder-vscode", version: "1.0.0" },
    }),
    INIT_TIMEOUT_MS,
  )
  if (initResp.error) throw new Error(`initialize error: ${initResp.error.message}`)
  transport.notify?.("notifications/initialized", {})

  // 2026-08-31 MCP 会诊 P6：tools/list 分页被忽略（nextCursor 多页工具静默丢失）——
  // 循环跟随 cursor 直到 server 不再返回（上限 20 页防死循环）。
  // MCP.md §4 评审 #8（CLI parity）：每页同受 INIT_TIMEOUT_MS 约束。
  const tools = []
  let cursor
  for (let page = 0; page < 20; page++) {
    const toolsResp = await withTimeout(
      transport.send("tools/list", cursor ? { cursor } : {}),
      INIT_TIMEOUT_MS,
    )
    if (toolsResp.error) throw new Error(`tools/list failed: ${toolsResp.error.message}`)
    tools.push(...(toolsResp.result?.tools ?? []))
    cursor = toolsResp.result?.nextCursor
    if (!cursor) break
  }
  return tools
}

// ─── Server registry ────────────────────────────────────────────

/** Map of serverId → { transport, tools, config, serverName } */
const _servers = new Map()
let _serverSeq = 0

/** 2026-08-31 MCP 会诊 P5：重连退避表在 _mcpHooks（测试可注入）；进行中重连（serverName → promise）。
 *  transport 意外死亡（透明自愈不在下次 turn）时后台退避重建，成功后 registry
 *  entry 原位替换（client id 不变→panel 引用稳定）；失败静默（下次 mcpConnect 全新连）。 */
const _reconnecting = new Map()

/** 2026-08-31 MCP 会诊 P5：测试钩子（退避延迟可替换，惯例同 rate.mjs _rateHooks）。
 *  scheduleReconnect 读这里的 delay/reconnectDelays——测试可注入微秒级延迟。 */
export const _mcpHooks = {
  delay: (ms) => new Promise((r) => setTimeout(r, ms)),
  reconnectDelays: [1000, 2000, 4000, 8000],
}

/** 按 config 创建并完成握手的 transport（与 mcpConnect 的建连逻辑共享）。 */
async function createConnectedTransport(rawConfig, serverName) {
  const config = withBearerToken(rawConfig) // F6/D-5：token 合成（不写回原 config）
  let transport
  if (config.wsUrl) {
    transport = wsTransport(config.wsUrl, config.headers ?? {})
    await transport.connect()
  } else if (config.url) {
    transport = httpTransport(config.url, config.headers ?? {})
    try {
      await transport.openSSE()
    } catch {
      // Server doesn't support GET SSE — degrade to pure Streamable HTTP POST mode.
      // MCP.md §4 D-1（CLI parity）：显式标记 postOnly——isAlive 不得因
      // eventSource == null 误判死。
      transport.markPostOnly()
    }
  } else {
    transport = stdioTransport(config.command, config.args ?? [], config.env)
  }
  const mcpTools = await doInitialize(transport, serverName)
  return { transport, mcpTools }
}

/** F5/D-2（CLI probeMcpServer 镜像，评审 #5 定位）：一次性探活——initialize + tools/list
 *  + 计时 → { ok, toolCount, latencyMs } / { ok:false, error }。零副作用：不进 _servers
 *  注册表、无 onDead 挂钩；finally close。panel-mcp 的 testMcp 调用之。 */
export async function probeMcpServer(config) {
  const start = Date.now()
  let transport
  let mcpTools
  try {
    ;({ transport, mcpTools } = await createConnectedTransport(config, config.name ?? config.command ?? config.url ?? config.wsUrl))
    return { ok: true, toolCount: mcpTools.length, latencyMs: Date.now() - start }
  } catch (error) {
    return { ok: false, error: error?.message ?? String(error) }
  } finally {
    try { transport?.close() } catch { /* ignore */ }
  }
}

/** 后台退避重连（onDead 触发 & execute 前置检查共用）。 */
function scheduleReconnect(id, serverName, config, configFingerprint) {
  if (_reconnecting.has(serverName)) return _reconnecting.get(serverName)
  const p = (async () => {
    let lastErr
    for (const delayMs of _mcpHooks.reconnectDelays) {
      await _mcpHooks.delay(delayMs)
      try {
        const { transport, mcpTools } = await createConnectedTransport(config, serverName)
        // 原位替换：client id 不变，panel/session 引用稳定
        const entry = { transport, tools: mcpTools, config, configFingerprint, serverName }
        entry.onDead = () => {
          if (entry.transport !== transport) return // 已再次替换，旧 onDead 作废
          if (_servers.get(id) === entry) _servers.delete(id)
          scheduleReconnect(id, serverName, config, configFingerprint)
        }
        transport.onDead?.(entry.onDead)
        _servers.set(id, entry)
        return true
      } catch (error) {
        lastErr = error
      }
    }
    console.error(`[mcp] ${serverName} reconnect failed after ${_mcpHooks.reconnectDelays.length} attempts: ${lastErr?.message ?? lastErr}`)
    return false
  })().finally(() => _reconnecting.delete(serverName))
  _reconnecting.set(serverName, p)
  return p
}

/**
 * Connect to an MCP server. Supports stdio, HTTP and WS transports.
 * IDEMPOTENT per server name: an already-connected server with the same name
 * is reused (runAgent re-assembles the tool table every turn — repeated calls
 * must not leak transports).
 * @param {{ command?: string, args?: string[], url?: string, wsUrl?: string, name?: string, headers?: Record<string,string> }} config
 * @returns {Promise<{ id: string, serverName: string, tools: Array<{name:string, description:string, inputSchema:object}> }>}
 */
export async function mcpConnect(config) {
  if (!config || (!config.command && !config.url && !config.wsUrl))
    throw new Error("MCP server config needs 'command' (stdio), 'url' (http), or 'wsUrl' (ws)")

  const serverName = config.name || (config.command ? config.command : (config.wsUrl || config.url))

  // Idempotent: reuse an existing LIVE connection with the same server name.
  // 2026-08-31 MCP 会诊 P3：原实现同名即复用——server 进程崩溃或 config 变更
  // （url/command/args/env）后每 turn 展开的工具全部 "MCP connection closed" 且无法自愈。
  // 现在复用前做 transport liveness 检查 + config 指纹比对（不一致即断开重连）。
  // MCP.md §4 D-5（CLI parity）：fingerprint 计入 token 字段——面板 edit 改 token →
  // 指纹变更 → 旧连接断开重连。
  const configFingerprint = JSON.stringify([config.command ?? null, config.args ?? null, config.url ?? null, config.wsUrl ?? null, config.env ?? null, config.headers ?? null, config.token ?? null])
  for (const [id, s] of _servers) {
    if (s.serverName === serverName) {
      const sameConfig = s.configFingerprint === configFingerprint
      if (s.transport.isAlive?.() && sameConfig) {
        return {
          id,
          serverName,
          tools: s.tools.map((t) => ({
            name: t.name,
            description: t.description ?? `MCP tool: ${t.name}`,
            inputSchema: t.inputSchema ?? { type: "object", properties: {} },
          })),
        }
      }
      // 2026-08-31 MCP 会诊 P5：重连进行中（onDead 已触发）→ 等它完成，避免双重建连
      if (_reconnecting.has(serverName)) {
        const ok = await _reconnecting.get(serverName)
        if (ok) {
          const re = _servers.get(id)
          return {
            id,
            serverName,
            tools: re.tools.map((t) => ({
              name: t.name,
              description: t.description ?? `MCP tool: ${t.name}`,
              inputSchema: t.inputSchema ?? { type: "object", properties: {} },
            })),
          }
        }
        // 重连失败 → 落入下方全新连接（旧 entry 已死）
      }
      // 死连接或配置变更：断开旧连接，走全新连（下方新建 transport）
      try { s.transport.close() } catch { /* ignore */ }
      _servers.delete(id)
    }
  }

  let transport
  let mcpTools
  try {
    ({ transport, mcpTools } = await createConnectedTransport(config, serverName))
    const id = `mcp-${++_serverSeq}`
    const entry = { transport, tools: mcpTools, config, configFingerprint, serverName }
    // 2026-08-31 MCP 会诊 P5：注册 onDead → 退避重连自愈（server 崩溃后不等到下个 turn）
    entry.onDead = () => {
      if (entry.transport !== transport) return // 已重连替换，旧 onDead 作废
      if (_servers.get(id) === entry) _servers.delete(id)
      scheduleReconnect(id, serverName, config, configFingerprint)
    }
    transport.onDead?.(entry.onDead)
    _servers.set(id, entry)
    return {
      id,
      serverName,
      tools: mcpTools.map((t) => ({
        name: t.name,
        description: t.description ?? `MCP tool: ${t.name}`,
        inputSchema: t.inputSchema ?? { type: "object", properties: {} },
      })),
    }
  } catch (error) {
    transport?.close()
    throw error
  }
}

/**
 * Expand a registry server entry into NATIVE agent tools (CLI buildTools parity).
 * Each MCP tool becomes an independent tool with `{server}_{tool}` prefix and its
 * full input schema — the model calls it directly, no gateway routing (MCP.md D1).
 */
export function buildMcpTools(server) {
  const prefix = server.config?.name ? `${server.config.name}_` : "mcp_"
  // 2026-08-31 MCP 会诊 P6：sanitize 后碰撞/空名无防御（原同名静默覆盖、全特殊字符产出空名）
  // ——去重（追加 _2/_3）+ 空名跳过；schema/description 类型守卫（畸形直接回退默认）。
  const seen = new Set()
  const out = []
  for (const t of server.tools) {
    const rawName = sanitizeToolName(prefix + t.name)
    if (!rawName || rawName === "mcp_") continue // 空名/纯前缀跳过
    let name = rawName
    for (let n = 2; seen.has(name); n++) name = `${rawName}_${n}`
    seen.add(name)
    out.push({
      name,
      description: typeof t.description === "string" ? t.description : `MCP tool: ${t.name}`,
      parameters: (t.inputSchema && typeof t.inputSchema === "object") ? t.inputSchema : { type: "object", properties: {} },
      readonly: false,
      async execute(args, ctx) {
        // 2026-08-31 会诊 #11：MCP tools/call 响应上层 signal（send 第 3 参做底层取消：
        // pending 即刻作废 + cancelled 通知，原实现等满 CALL_TIMEOUT_MS）
        const send = server.transport.send("tools/call", { name: t.name, arguments: args }, ctx?.signal)
        const resp = await sendWithSignal(send, ctx?.signal)
        if (resp.error) throw new Error(`MCP tool "${t.name}": ${resp.error.message}`)
        // P6/P9 防御：isError 必须 throw（错误文本不等于成功输出）；content 非数组/元素非对象防御；
        // 输出截断（MCP server 回 10MB 会撑爆上下文）
        if (resp.result?.isError) throw new Error(`MCP tool "${t.name}": ${extractMcpText(resp.result.content) || "(server reported an error)"}`)
        return truncateMcpOutput(extractMcpText(resp.result?.content ?? [])) || "(no output)"
      },
      _mcpTransport: server.transport,
      _mcpName: server.config?.name,
    })
  }
  return out
}

/** MCP content 数组 → 文本（P9：非数组/元素非对象防御）。 */
function extractMcpText(content) {
  if (!Array.isArray(content)) return typeof content === "string" ? content : JSON.stringify(content)
  return content
    .filter((c) => c && typeof c === "object")
    .map((c) => (c.type === "text" ? c.text : c.type === "resource" ? `[resource: ${c.resource?.uri}]` : JSON.stringify(c)))
    .join("\n")
}

/** 输出截断（P6：32KB 上限，防 server 回 10MB 撑爆上下文）。 */
function truncateMcpOutput(text) {
  if (text.length <= 32_000) return text
  return text.slice(0, 32_000) + "\n[… truncated: " + (text.length - 32_000) + " chars omitted]"
}

/**
 * Batch idempotent connect + expansion for the agent tool table (MCP.md D2).
 * Failures never block: each failing server produces a warning entry instead.
 * @returns {Promise<{ tools: object[], warnings: string[] }>}
 */
export async function connectMcpServersExpanded(configs) {
  const tools = []
  const warnings = []
  // 2026-08-31 MCP 会诊 P4（vscode-only）：原串行 for-await——N 个慢 server 顺延
  // N×INIT_TIMEOUT_MS；改并行（保持逐 server 失败隔离，与 CLI ensureMcpServers 一致）。
  const settled = await Promise.allSettled(configs.map(async (cfg) => {
    const client = await mcpConnect(cfg)
    const server = _servers.get(client.id)
    return server ? buildMcpTools(server) : []
  }))
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") tools.push(...r.value)
    else {
      const cfg = configs[i]
      const label = cfg.name || cfg.command || cfg.url || cfg.wsUrl || "(unnamed)"
      const msg = `MCP server "${label}" failed to connect: ${r.reason?.message ?? String(r.reason)}`
      warnings.push(msg)
      // D-CI7（F-Q11——cli cli/make-agent.mjs:105-107 同前缀）：失败可见面 = console
      // （采集点）；mcpWarnings 字段保留（消费面 = console——不发明 history 注入，CLI 无此行为）。
      console.error("[mcp] " + msg)
    }
  })
  return { tools, warnings }
}

/**
 * List tools from a connected MCP server.
 * @param {{ id: string }} client — the client object returned by mcpConnect
 * @returns {Array<{name:string, description:string, inputSchema:object}>}
 */
export function mcpListTools(client) {
  const server = _servers.get(client.id)
  if (!server) throw new Error(`MCP server "${client.id}" not connected`)
  return server.tools.map((t) => ({
    name: t.name,
    description: t.description ?? `MCP tool: ${t.name}`,
    inputSchema: t.inputSchema ?? { type: "object", properties: {} },
  }))
}

/**
 * Call a tool on a connected MCP server.
 * @param {{ id: string }} client
 * @param {string} toolName
 * @param {object} args
 * @returns {Promise<string>} — the tool result as a string
 */
export async function mcpCallTool(client, toolName, args) {
  const server = _servers.get(client.id)
  if (!server) throw new Error(`MCP server "${client.id}" not connected`)
  const tool = server.tools.find((t) => t.name === toolName)
  if (!tool) throw new Error(`Tool "${toolName}" not found on server "${server.serverName}"`)

  const resp = await server.transport.send("tools/call", { name: toolName, arguments: args ?? {} })
  if (resp.error) throw new Error(`MCP tool "${toolName}": ${resp.error.message}`)
  if (resp.result?.isError) throw new Error(`MCP tool "${toolName}": ${extractMcpText(resp.result.content) || "(server reported an error)"}`)
  return extractMcpText(resp.result?.content ?? []) || "(no output)"
}

/**
 * Disconnect from an MCP server.
 * @param {{ id: string }} client
 */
export function mcpDisconnect(client) {
  const server = _servers.get(client.id)
  if (server) {
    server.transport.close()
    _servers.delete(client.id)
  }
}

/** Close all MCP connections */
export function closeAllMcp() {
  for (const [id, server] of _servers) {
    try { server.transport.close() } catch { /* */ }
    _servers.delete(id)
  }
}

/** Connected server names (for the settings panel ●/○ status). */
export function mcpConnectedNames() {
  return [..._servers.values()].map((s) => s.serverName)
}

/** Connected server name → tool count (settings panel status). */
export function mcpConnectedToolCounts() {
  const out = {}
  for (const s of _servers.values()) out[s.serverName] = s.tools?.length ?? 0
  return out
}

/** Disconnect all connections to a named server (settings panel reconnect). */
export function mcpDisconnectByName(name) {
  for (const [id, server] of _servers) {
    if (server.serverName === name) {
      try { server.transport.close() } catch { /* */ }
      _servers.delete(id)
    }
  }
}

