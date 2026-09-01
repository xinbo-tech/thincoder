/**
 * mcp.mjs — MCP (Model Context Protocol) client
 * config: { command, args?, name } or { url, name, headers? } or { wsUrl, name, headers? }
 */
import { INIT_TIMEOUT_MS, withTimeout, sanitizeToolName } from "./mcp/helpers.mjs"
import { stdioTransport } from "./mcp/transport-stdio.mjs"
import { httpTransport } from "./mcp/transport-http.mjs"
import { wsTransport } from "./mcp/transport-ws.mjs"

/** F6/D-5：config.token → `Authorization: Bearer <token>` 合成（仅当 headers 未显式给
 *  Authorization——显式优先，向后兼容）。合成发生在传给 transport 前，不写回 config。 */
export function withBearerToken(config) {
  if (!config?.token || config.headers?.Authorization) return config
  return { ...config, headers: { ...config.headers, Authorization: `Bearer ${config.token}` } }
}

/** Race a pending MCP request against an abort signal — a hung MCP server must not
 *  hold the turn hostage. signal absent → passthrough. */
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

// ---- MCP lifecycle ----

/** 2026-08-31 MCP 会诊 P5：CLI session 注册表（serverName → session）。
 *  session.state.transport 可变（重连替换）；buildTools 的 execute 动态取
 *  session.state.transport——server 崩溃后无需重建 agent.tools 即自愈。
 *  2026-09-01 MCP.md §4：导出给 /mcp test 的零副作用断言用（probe 后 _sessions 不增）。 */
export const _sessions = new Map()
/** 退避重连进行中（serverName → promise）——与 vscode 语义对齐；延迟表见 _mcpHooks。 */
const _reconnecting = new Map()

/** 2026-08-31 MCP 会诊 P5：测试钩子（退避延迟可替换，惯例同 rate.mjs _rateHooks）。
 *  scheduleReconnect 与 ensureAlive 读这里的 delay/reconnectDelays——测试可注入微秒级延迟。 */
export const _mcpHooks = {
  delay: (ms) => new Promise((r) => setTimeout(r, ms)),
  reconnectDelays: [1000, 2000, 4000, 8000],
}

/** 按 config 创建并完成握手的 transport（findTransportConfig 与 vscode 对齐）。 */
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
      // MCP.md §4 D-1：显式标记 postOnly——POST-only server（glm-websearch 类）isAlive
      // 不得因 eventSource == null 误判死（否则 ensureAlive 触发无意义重连循环）。
      transport.markPostOnly()
    }
  } else {
    transport = stdioTransport(config.command, config.args ?? [], config.env)
  }
  const mcpTools = await doInitialize(transport, serverName)
  return { transport, mcpTools }
}

/** F4/D-2：一次性探活——createConnectedTransport（initialize + tools/list）+ 计时。
 *  零副作用：不进 _sessions、不动 agent.tools、无 onDead 挂钩；finally close
 *  （closed=true 使 onDead 重连不会触发）。initialize 与 tools/list 同受
 *  INIT_TIMEOUT_MS 约束（见 doInitialize）。不复用 connectMcpServer（避免污染
 *  session 幂等表）。 */
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

/** onDead → 后台退避重连；成功替换 session.state.transport（tools 闭包动态引用，
 *  agent.tools 无需重建）；失败静默（下次 execute 前置检查再试）。 */
function scheduleReconnect(name, config) {
  if (_reconnecting.has(name)) return _reconnecting.get(name)
  const p = (async () => {
    let lastErr
    for (const delayMs of _mcpHooks.reconnectDelays) {
      await _mcpHooks.delay(delayMs)
      try {
        const { transport } = await createConnectedTransport(config, name)
        const session = _sessions.get(name)
        if (!session || session.closed) { transport.close(); return false }
        attachSession(session, transport)
        return true
      } catch (error) {
        lastErr = error
      }
    }
    console.error(`[mcp] ${name} reconnect failed after ${_mcpHooks.reconnectDelays.length} attempts: ${lastErr?.message ?? lastErr}`)
    return false
  })().finally(() => _reconnecting.delete(name))
  _reconnecting.set(name, p)
  return p
}

/** 给 session 绑定一个新 transport（建连 onDead 钩子 → 自愈链）。 */
function attachSession(session, transport) {
  session.state.transport = transport
  transport.onDead?.(() => {
    if (session.state.transport !== transport) return // 已再替换，旧钩子作废
    scheduleReconnect(session.config.name ?? session.config.command ?? session.config.url ?? session.config.wsUrl, session.config)
  })
}

function buildTools(mcpTools, session, config) {
  const prefix = config.name ? `${config.name}_` : "mcp_"
  // 2026-08-31 MCP 会诊 P6：sanitize 碰撞/空名防御 + schema/description 类型守卫 + 输出防御
  const seen = new Set()
  const out = []
  for (const t of mcpTools) {
    const rawName = sanitizeToolName(prefix + t.name)
    if (!rawName || rawName === "mcp_") continue
    let name = rawName
    for (let n = 2; seen.has(name); n++) name = `${rawName}_${n}`
    seen.add(name)
    out.push({
      name,
      description: typeof t.description === "string" ? t.description : `MCP tool: ${t.name}`,
      parameters: (t.inputSchema && typeof t.inputSchema === "object") ? t.inputSchema : { type: "object", properties: {} },
      readonly: false,
      async execute(args, ctx) {
        // 2026-08-31 会诊 #11：上层 signal 中断 + send 第 3 参底层取消（pending 即刻作废）
        // P5：执行前动态取 session.transport——死亡时等重连 promise/触发一次重连再试
        const transport = await ensureAlive(session)
        const send = transport.send("tools/call", { name: t.name, arguments: args }, ctx?.signal)
        const resp = await sendWithSignal(send, ctx?.signal)
        if (resp.error) throw new Error(`MCP tool "${t.name}": ${resp.error.message}`)
        if (resp.result?.isError) throw new Error(`MCP tool "${t.name}": ${extractMcpText(resp.result.content) || "(server reported an error)"}`)
        return truncateMcpOutput(extractMcpText(resp.result?.content ?? [])) || "(no output)"
      },
      _mcpTransport: session.state.transport,
      _mcpName: config.name,
    })
  }
  return out
}

/** P5：拿到活的 transport——死连接等待/触发重连；耗尽后抛错（工具错误透给模型）。 */
async function ensureAlive(session) {
  const t = session.state.transport
  if (t?.isAlive?.()) return t
  const name = session.config.name ?? session.config.command ?? session.config.url ?? session.config.wsUrl
  let reconnect = _reconnecting.get(name)
  if (!reconnect) reconnect = scheduleReconnect(name, session.config)
  const ok = await reconnect
  if (!ok || !session.state.transport?.isAlive?.()) {
    throw new Error(`MCP server "${name}" is unavailable (reconnect failed)`)
  }
  return session.state.transport
}

/** MCP content 数组 → 文本（非数组/元素非对象防御）。 */
function extractMcpText(content) {
  if (!Array.isArray(content)) return typeof content === "string" ? content : JSON.stringify(content)
  return content
    .filter((c) => c && typeof c === "object")
    .map((c) => (c.type === "text" ? c.text : c.type === "resource" ? `[resource: ${c.resource?.uri}]` : JSON.stringify(c)))
    .join("\n")
}

/** 输出截断（32KB 上限，防 server 回 10MB 撑爆上下文）。 */
function truncateMcpOutput(text) {
  if (text.length <= 32_000) return text
  return text.slice(0, 32_000) + "\n[… truncated: " + (text.length - 32_000) + " chars omitted]"
}

async function doInitialize(transport, _name) {
  const initResp = await withTimeout(
    transport.send("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "thincoder", version: "1.0.0" },
    }),
    INIT_TIMEOUT_MS,
  )
  if (initResp.error) throw new Error(`initialize error: ${initResp.error.message}`)
  transport.notify?.("notifications/initialized", {})

  // 2026-08-31 MCP 会诊 P6：tools/list 分页被忽略（nextCursor 多页工具静默丢失）——
  // 循环跟随 cursor 直到 server 不再返回（上限 20 页防死循环）。
  // MCP.md §4 评审 #8：每页同受 INIT_TIMEOUT_MS 约束（否则 probe 的延迟统计无界）。
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

/** Connect to an MCP server (stdio/http/ws), initialize, and return built tool wrappers.
 *  2026-08-31 MCP 会诊 P5：session 幂等——同 name 活连接复用（make-agent 每进程一次，
 *  cmd-mcp 重复 add 同一 server 不会双实例），崩溃后下次调用/execute 自愈。 */
export async function connectMcpServer(config) {
  if (!config || (!config.command && !config.url && !config.wsUrl))
    throw new Error(`MCP server "${config?.name ?? ""}": needs either 'wsUrl' (websocket), 'command' (stdio), or 'url' (http)`)
  const name = config.name ?? config.command ?? config.url ?? config.wsUrl
  // MCP.md §4 D-5：fingerprint 计入 token 字段——/mcp edit 改 token → 指纹变更 →
  // 旧连接主动关闭重建（T13）。
  const configFingerprint = JSON.stringify([config.command ?? null, config.args ?? null, config.url ?? null, config.wsUrl ?? null, config.env ?? null, config.headers ?? null, config.token ?? null])

  const existing = _sessions.get(name)
  if (existing && !existing.closed) {
    const sameConfig = existing.configFingerprint === configFingerprint
    if (sameConfig && existing.state.transport?.isAlive?.()) {
      return existing.state.tools
    }
    if (!sameConfig) {
      // config 变更：主动关闭旧连接（不触发 onDead 重连）并丢弃 session
      existing.closed = true
      try { existing.state.transport?.close() } catch { /* ignore */ }
      _sessions.delete(name)
    }
  }

  let transport
  let mcpTools
  try {
    ;({ transport, mcpTools } = await createConnectedTransport(config, name))
  } catch (error) {
    // MCP.md §4 评审 #7：握手失败不泄漏 transport（GET SSE 降级成功但 POST initialize
    // 失败时，openSSE 若开了流会留一个悬挂的 reader/请求）。
    try { transport?.close() } catch { /* ignore */ }
    throw error
  }
  const session = {
    config, configFingerprint,
    state: { transport, tools: null },
    closed: false,
  }
  session.state.tools = buildTools(mcpTools, session, config)
  attachSession(session, transport)
  _sessions.set(name, session)
  return session.state.tools
}

/** Close all MCP transport connections on an agent's tools */
export function closeAllMcp(agent) {
  for (const t of agent.tools) {
    if (t._mcpTransport) closeSession(t._mcpName)
  }
}

/** 主动关闭 session（不触发 onDead 重连）：transport close + 登记关闭标记 + 清注册表。 */
function closeSession(name) {
  const session = _sessions.get(name)
  if (!session) return
  session.closed = true
  try { session.state.transport?.close() } catch { /* ignore */ }
  _sessions.delete(name)
}

/** Remove MCP tools belonging to a specific server from the agent's tool list */
export function removeMcpTools(agent, serverName) {
  const keep = []
  for (const t of agent.tools) {
    if (t._mcpName === serverName) {
      closeSession(serverName)
    } else {
      keep.push(t)
    }
  }
  agent.tools = keep
}
