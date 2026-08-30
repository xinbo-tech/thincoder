/**
 * mcp.mjs — MCP (Model Context Protocol) client
 * config: { command, args?, name } or { url, name, headers? } or { wsUrl, name, headers? }
 */
import { INIT_TIMEOUT_MS, withTimeout, sanitizeToolName } from "./mcp/helpers.mjs"
import { stdioTransport } from "./mcp/transport-stdio.mjs"
import { httpTransport } from "./mcp/transport-http.mjs"
import { wsTransport } from "./mcp/transport-ws.mjs"


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

function buildTools(mcpTools, transport, config) {
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
        const send = transport.send("tools/call", { name: t.name, arguments: args }, ctx?.signal)
        const resp = await sendWithSignal(send, ctx?.signal)
        if (resp.error) throw new Error(`MCP tool "${t.name}": ${resp.error.message}`)
        if (resp.result?.isError) throw new Error(`MCP tool "${t.name}": ${extractMcpText(resp.result.content) || "(server reported an error)"}`)
        return truncateMcpOutput(extractMcpText(resp.result?.content ?? [])) || "(no output)"
      },
      _mcpTransport: transport,
      _mcpName: config.name,
    })
  }
  return out
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

async function doInitialize(transport, name) {
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
  const tools = []
  let cursor
  for (let page = 0; page < 20; page++) {
    const toolsResp = await transport.send("tools/list", cursor ? { cursor } : {})
    if (toolsResp.error) throw new Error(`tools/list failed: ${toolsResp.error.message}`)
    tools.push(...(toolsResp.result?.tools ?? []))
    cursor = toolsResp.result?.nextCursor
    if (!cursor) break
  }
  return tools
}

/** Connect to an MCP server (stdio/http/ws), initialize, and return built tool wrappers */
export async function connectMcpServer(config) {
  if (config.wsUrl) {
    const transport = wsTransport(config.wsUrl, config.headers ?? {})
    try {
      await transport.connect()
      const mcpTools = await doInitialize(transport, config.name ?? config.wsUrl)
      return buildTools(mcpTools, transport, config)
    } catch (error) {
      transport.close()
      throw error
    }
  }

  if (config.url) {
    const transport = httpTransport(config.url, config.headers ?? {})
    try {
      await transport.openSSE()
    } catch {
      // Server doesn't support GET (pure Streamable HTTP POST): degrade to no-SSE mode
    }
    try {
      const mcpTools = await doInitialize(transport, config.name ?? config.url)
      return buildTools(mcpTools, transport, config)
    } catch (error) {
      transport.close()
      throw error
    }
  }

  if (config.command) {
    const transport = stdioTransport(config.command, config.args ?? [], config.env)
    try {
      const mcpTools = await doInitialize(transport, config.name ?? config.command)
      return buildTools(mcpTools, transport, config)
    } catch (error) {
      transport.close()
      throw error
    }
  }

  throw new Error(`MCP server "${config.name}": needs either 'wsUrl' (websocket), 'command' (stdio), or 'url' (http)`)
}

/** Close all MCP transport connections on an agent's tools */
export function closeAllMcp(agent) {
  for (const t of agent.tools) {
    if (t._mcpTransport) t._mcpTransport.close()
  }
}

/** Remove MCP tools belonging to a specific server from the agent's tool list */
export function removeMcpTools(agent, serverName) {
  const keep = []
  for (const t of agent.tools) {
    if (t._mcpName === serverName) {
      if (t._mcpTransport) t._mcpTransport.close()
    } else {
      keep.push(t)
    }
  }
  agent.tools = keep
}
