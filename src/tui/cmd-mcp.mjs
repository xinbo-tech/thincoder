import { ansi, C } from "./ansi.mjs"
import { cloneEntry, fieldPicker, maskToken } from "./cmd-mcp-form.mjs"

/** /mcp command handler: view/add/edit/remove/test/reconnect MCP server.
 *  ctx: { agent, pushLine, pushLabel, showPicker, askQuestion, persistRaw, ansi, C }
 *  MCP.md §5（2026-09-02，v2）：列表即菜单（F7/D-2）、edit/add 统一字段 picker 表单
 *  （F3/F3b/D-1——表单机制在 cmd-mcp-form.mjs，本文件只调 fieldPicker）、保存前预览
 *  +探活（F2：探活失败回同一 fieldPicker——AC2）、AI 降 transport picker 末位（F4）、
 *  菜单打开边界磁盘重读 config.json（F5①/D-3，reloadMcpFromDisk in config.mjs）。 */

/** F7/D-2：主菜单行与子菜单 picker 行共用——●/○ 连接态 + (端点) + N tools。 */
function serverLine(srv, connected, toolCount) {
  const desc = srv.wsUrl ? srv.wsUrl : srv.url ? srv.url : `${srv.command} ${(srv.args ?? []).join(" ")}`
  return `${connected ? "●" : "○"} ${srv.name} (${desc})${connected ? ` — ${toolCount} tools` : ""}`
}

/** persistRaw/edit 落盘的磁盘 entry 形态（name + 按 transport 的可选字段）——add 与
 *  edit 共用，两处序列化不再漂移。 */
function configEntry(srv) {
  const entry = { name: srv.name }
  if (srv.url) { entry.url = srv.url; if (srv.token) entry.token = srv.token; if (srv.headers) entry.headers = srv.headers }
  else if (srv.wsUrl) { entry.wsUrl = srv.wsUrl; if (srv.token) entry.token = srv.token; if (srv.headers) entry.headers = srv.headers }
  else { entry.command = srv.command; if (srv.args) entry.args = srv.args; if (srv.env) entry.env = srv.env }
  return entry
}

/** /mcp shared helper: save config + connect (persistRaw obtained from ctx) */
async function addAndConnect(ctx, srv) {
  const { agent, pushLine, pushLabel, persistRaw } = ctx
  await persistRaw((raw) => {
    raw.mcp ??= { servers: [] }
    raw.mcp.servers.push(configEntry(srv))
  })
  agent.config ??= {}
  agent.config.mcp ??= { servers: [] }
  agent.config.mcp.servers.push(srv)
  try {
    pushLine(`[mcp] Connecting ${srv.name}...`, C.dim)
    const { connectMcpServer } = await import("../mcp.mjs")
    const tools = await connectMcpServer(srv)
    agent.tools.push(...tools)
    pushLabel(`❯ MCP`, ansi.bold + C.tool)
    const desc = srv.wsUrl ? srv.wsUrl : srv.url ? srv.url : `${srv.command} ${(srv.args ?? []).join(" ")}`
    pushLine(`${srv.name} (${desc}) connected, ${tools.length} tools:`, C.tool)
    for (const t of tools) pushLine(`  ${t.name}: ${t.description.slice(0, 100)}`, C.dim)
  } catch (error) {
    pushLine(`[mcp] ${srv.name}: ${error.message} (config saved, retry after restart)`, C.error)
  }
}

export async function handleMcpCommand(ctx, args = []) {
  const { agent, pushLine, pushLabel, showPicker, askQuestion, persistRaw } = ctx
  // 每轮重读：原本无 mcp 配置时 `?? []` 会拿到游离数组，Add server 后快照过期
  const getServers = () => agent.config?.mcp?.servers ?? []
  // D-3/T24：本菜单会话内最新一次磁盘重读是否失败（畸形 config.json → 内存态兜底）
  let diskUnreadable = false
  /** F5①/D-3：菜单打开边界统一走这里——磁盘→内存仅替换 mcp 段（config.mjs 的
   *  reloadMcpFromDisk）。畸形磁盘配置回退内存态 + 提示行（T24）；persistRaw 落盘后
   *  重读幂等（fingerprint 一致 → 无 ⚠ disk changed 标记，D-3 防环）。ctx.configPath
   *  测试注入 tmp config 路径用（生产 undefined → 默认 ~/.thincoder）。 */
  let changedNames = [] // 最近一次成功重读的对账结果（T23 ⚠ 标记）
  async function reloadFromDisk() {
    const { reloadMcpFromDisk } = await import("../config.mjs")
    const r = reloadMcpFromDisk(agent, ctx.configPath)
    diskUnreadable = !r.ok
    if (r.ok) changedNames = r.changedNames
    return r
  }

  function listServers() {
    const servers = getServers()
    pushLabel(`❯ MCP Servers`, ansi.bold + C.tool)
    if (servers.length === 0) {
      pushLine(" (no MCP server configured)", C.dim)
    }
    for (const srv of servers) {
      const connected = agent.tools.some((t) => t._mcpName === srv.name)
      const toolCount = agent.tools.filter((t) => t._mcpName === srv.name).length
      pushLine(`  ${serverLine(srv, connected, toolCount)}`, connected ? C.tool : C.dim)
    }
  }

  async function removeServer(name) {
    agent.config.mcp.servers = getServers().filter((s) => s.name !== name)
    await persistRaw((raw) => { raw.mcp.servers = agent.config.mcp.servers })
    // Remove from tool list
    const { removeMcpTools } = await import("../mcp.mjs")
    removeMcpTools(agent, name)
    pushLine(`[mcp] ${name} removed`, C.tool)
  }

  async function connectServer(name) {
    const srv = getServers().find((s) => s.name === name)
    const { removeMcpTools, connectMcpServer } = await import("../mcp.mjs")
    removeMcpTools(agent, name)
    try {
      pushLine(`[mcp] Reconnecting ${name}...`, C.dim)
      const tools = await connectMcpServer(srv)
      agent.tools.push(...tools)
      pushLabel(`❯ MCP`, ansi.bold + C.tool)
      pushLine(`${name} reconnected, ${tools.length} tools available.`, C.tool)
    } catch (error) {
      pushLine(`[mcp] ${name}: ${error.message}`, C.error)
    }
  }

  /** F2（D-1）：预览表——name/transport/端点/token 遮蔽 + headers/env 键列表；
   *  probeLine 非空时拼在尾部（✓ C.tool 色 / ✗ C.error 色）——预览与探活报告同屏。 */
  function showPreview(entry, probeLine) {
    const endpoint = entry.wsUrl ?? entry.url ?? `${entry.command} ${(entry.args ?? []).join(" ")}`.trim()
    const transport = entry.wsUrl ? "WebSocket" : entry.url ? "HTTP" : "stdio"
    pushLine(`  name:      ${entry.name}`, C.tool)
    pushLine(`  transport: ${transport}`, C.tool)
    pushLine(`  endpoint:  ${endpoint}`, C.tool)
    if (entry.token) pushLine(`  token:     ${maskToken(entry.token)}`, C.tool)
    if (entry.headers) pushLine(`  headers:   ${Object.keys(entry.headers).join(", ")}`, C.tool)
    if (entry.env) pushLine(`  env:       ${Object.keys(entry.env).join(", ")}`, C.tool)
    if (probeLine) pushLine(`  ${probeLine}`, probeLine.startsWith("✓") ? C.tool : C.error)
  }

  /** F2：保存前探活——probeMcpServer（§4 资产，零副作用：不进 _sessions、不动
   *  agent.tools、探完即关）。未保存的临时 entry 直接传 probe（§5 D-1）。 */
  async function probeLineFor(entry) {
    pushLine(`[mcp] Probing ${entry.name}...`, C.dim)
    const { probeMcpServer } = await import("../mcp.mjs")
    const r = await probeMcpServer(entry)
    return r.ok ? `✓ ${r.toolCount} tools, ${r.latencyMs}ms` : `✗ ${r.error}`
  }

  /** F2 确认循环（D-1 v2）：预览+探活 → Save? (Y/n)；失败 → Save anyway? (y/N)
   *  （显式 y——探活失败的坏配置不能被回车顺手存进去）→ 回 fieldPicker 重输
   *  （AC2：retryEntry 回调复用同一表单、已改值保留）→ 复 probe。返回 entry / null。 */
  async function confirmLoop(entry, retryEntry) {
    for (;;) {
      pushLabel(`❯ MCP Preview`, ansi.bold + C.tool)
      const probe = await probeLineFor(entry)
      showPreview(entry, probe)
      if (probe.startsWith("✓")) {
        pushLine("[mcp] Probe OK. Review the preview above.", C.dim)
        const ok = ((await askQuestion("Save? (Y/n):")) || "").trim().toLowerCase()
        if (ok === "" || ok === "y" || ok === "yes") return entry
        return null
      }
      pushLine("[mcp] Probe failed — fix it in the form, or save anyway and fix after restart.", C.dim)
      const ok = ((await askQuestion("Save anyway? (y/N):")) || "").trim().toLowerCase()
      if (ok === "y" || ok === "yes") return entry
      // 探活失败 = 回 fieldPicker 选中失败字段重输（机制天然合一——不再有独立 retry 路径）
      const retried = await retryEntry(entry)
      if (!retried) return null
      entry = retried
    }
  }

  /** F4：AI 生成配置（transport picker 末位——文案不再首推）。生成的 entry 同走
   *  预览+探活+确认环（F2 语义一致；仍显式 y 确认）。 */
  async function addWithAI() {
    const description = await askQuestion("Describe the MCP server you want to add (e.g. 'a filesystem server that gives access to /tmp'):")
    if (!description) return
    pushLine("[mcp] Generating config from description...", C.dim)
    try {
      const { chat } = await import("../provider/index.mjs")
      const res = await chat(agent.provider, {
        messages: [{
          role: "user",
          content: `Generate an MCP server configuration JSON from this description. Return ONLY the JSON object, no explanation.

Description: "${description}"

The JSON should have these fields:
- name: a short identifier
- One of: url (HTTP), wsUrl (WebSocket), or command + args (stdio)
- headers: optional key-value object

Example HTTP: {"name":"filesystem","url":"https://example.com/mcp","headers":{"Authorization":"Bearer xxx"}}
Example stdio: {"name":"filesystem","command":"npx","args":["-y","@modelcontextprotocol/server-filesystem","/tmp"]}

Return ONLY the JSON object:`,
        }],
        tools: [],
        signal: AbortSignal.timeout(15_000),
      })
      const jsonMatch = (res.content ?? "").match(/\{[\s\S]*\}/)
      if (!jsonMatch) { pushLine("[mcp] AI response not valid JSON", C.error); return }
      const srv = JSON.parse(jsonMatch[0])
      if (!srv.name) { pushLine("[mcp] AI response missing 'name' field", C.error); return }
      // F2：同一预览+探活+确认环；探活失败回 fieldPicker 重输（AC2——AI 生成的 entry
      // 字段不完整时可在表单里补齐/修正，mode add = name 可改）
      const saved = await confirmLoop(srv, async (cur) => {
        const r = await fieldPicker(ctx, {
          title: `Fix MCP: ${cur.name ?? "ai"}`,
          mode: "add",
          entry: cur,
          existingNames: getServers().map((s) => s.name),
        })
        return r.action === "save" ? r.entry : null
      })
      if (saved) await addAndConnect(ctx, saved)
      else pushLine("[mcp] Cancelled", C.dim)
    } catch (err) {
      pushLine(`[mcp] AI generation failed: ${err.message}`, C.error)
    }
  }

  /** F1/F3b（D-1 v2）：add 流程——fieldPicker 空 entry 起（必填 (required) 标注、
   *  只填所选字段、headers/env 不选即跳过）→ 预览+探活+确认环 → addAndConnect。 */
  async function addWithTransport(transport) {
    if (transport === "ai") { await addWithAI(); return }
    const entry = {}
    const existingNames = getServers().map((s) => s.name)
    const formOpts = {
      title: `Add MCP: ${transport === "ws" ? "WebSocket" : transport === "http" ? "HTTP" : "stdio"}`,
      mode: "add",
      transport,
      existingNames,
    }
    const first = await fieldPicker(ctx, { ...formOpts, entry })
    if (first.action === "cancel") return
    const saved = await confirmLoop(first.entry, async (cur) => {
      const r = await fieldPicker(ctx, { ...formOpts, entry: cur })
      return r.action === "save" ? r.entry : null
    })
    if (saved) await addAndConnect(ctx, saved)
    else pushLine("[mcp] Cancelled", C.dim)
  }

  /** F4：transport picker——HTTP / WebSocket / stdio / AI（末位，文案不再首推）。 */
  async function addFlow() {
    const te = await showPicker("MCP Transport", [
      { type: "header", text: "Select transport" },
      { type: "item", text: "HTTP (https://…)", action: "http" },
      { type: "item", text: "WebSocket (ws://…)", action: "ws" },
      { type: "item", text: "stdio (local command)", action: "stdio" },
      { type: "item", text: "AI — describe in natural language", action: "ai" },
    ])
    if (te) await addWithTransport(te.action)
  }

  /** 服务器选择共用：带 name 直达（校验存在性）；无 name → picker。返回 srv / null。
   *  NF1：带 name 的直达路径语义与旧实现逐字一致（空列表也报 no server named）。 */
  async function resolveServer(nameArg, { title, headerText }) {
    const servers = getServers()
    if (nameArg) {
      const srv = servers.find((s) => s.name === nameArg) // NF1：与旧直达路径逐字一致（精确匹配）
      if (!srv) {
        pushLine(`[mcp] no server named "${nameArg}" (${servers.map((s) => s.name).join(", ") || "none configured"})`, C.error)
        return null
      }
      return srv
    }
    if (servers.length === 0) {
      pushLine("[mcp] no MCP server configured", C.error)
      return null
    }
    const se = await showPicker(title, [
      { type: "header", text: headerText },
      ...servers.map((s) => ({ type: "item", text: `${s.name} (${s.wsUrl ?? s.url ?? s.command})`, name: s.name })),
    ])
    if (!se) return null // Esc 取消
    return servers.find((s) => s.name === se.name) ?? null
  }

  /** F4（§4 资产）：`/mcp test [name]`——probeMcpServer 一次性探活（零副作用）。 */
  async function testServer(nameArg) {
    const srv = await resolveServer(nameArg, { title: "Test MCP Server", headerText: "Select server to test" })
    if (!srv) return
    pushLine(`[mcp] Testing ${srv.name}...`, C.dim)
    const r = await probeLineFor(srv)
    pushLine(`[mcp] ${srv.name}: ${r}`, r.startsWith("✓") ? C.tool : C.error)
  }

  /** F3（D-1 v2）：edit = 字段 picker 表单——fieldPicker 列可编辑字段行（URL/Token/
   *  Headers 或 Command/Args/Env；name 不可改——无 name 行）+ `✓ Save & test`；
   *  收集完成走 confirmLoop（预览+探活+确认；探活失败回同一 fieldPicker——AC2/AC5）
   *  → persistRaw 原位替换保数组序 → connectServer 自动重连。取消 → 零保存。 */
  async function editServerWithConfirm(srv) {
    const name = srv.name
    const entry = cloneEntry(srv) // 工作副本——取消不污染原配置
    const formOpts = { title: `Edit MCP: ${name}`, mode: "edit" }
    const first = await fieldPicker(ctx, { ...formOpts, entry })
    if (first.action === "cancel") { pushLine("[mcp] Edit cancelled — nothing saved", C.dim); return }
    const saved = await confirmLoop(first.entry, async (cur) => {
      const r = await fieldPicker(ctx, { ...formOpts, entry: cur })
      return r.action === "save" ? r.entry : null
    })
    if (!saved) { pushLine("[mcp] Edit cancelled — nothing saved", C.dim); return }
    await persistRaw((raw) => {
      const servers = raw.mcp?.servers
      if (!Array.isArray(servers)) return
      const idx = servers.findIndex((s) => s?.name === name)
      if (idx === -1) return
      servers[idx] = configEntry(saved) // 原位替换——数组序保持
    })
    agent.config.mcp.servers = getServers().map((s) => (s.name === name ? saved : s))
    pushLine(`[mcp] ${name} updated`, C.tool)
    await connectServer(name) // F3：自动重连
  }

  /** edit 入口：`/mcp edit [name]`——带 name 直达，否则 picker 选择。 */
  async function editFlowWithConfirm(nameArg) {
    const srv = await resolveServer(nameArg, { title: "Edit MCP Server", headerText: "Select server to edit" })
    if (!srv) return
    await editServerWithConfirm(srv)
  }

  // Direct args: /mcp list │ /mcp add │ /mcp http|ws|stdio|ai │ /mcp edit [name] │ /mcp test [name] │ /mcp remove [name] │ /mcp connect [name]
  const sub = args[0]?.toLowerCase()
  if (sub === "list") { listServers(); return }
  if (sub === "add") { await addFlow(); return }
  if (sub === "http" || sub === "ws" || sub === "stdio" || sub === "ai") { await addWithTransport(sub); return }
  if (sub === "edit") { await editFlowWithConfirm(args[1]); return }
  if (sub === "test") { await testServer(args[1]); return }
  if (sub === "remove" || sub === "connect") {
    const srv = await resolveServer(args[1], {
      title: sub === "remove" ? "Remove MCP Server" : "Reconnect MCP",
      headerText: sub === "remove" ? "Select server to remove" : "Select server to reconnect",
    })
    if (!srv) return
    if (sub === "remove") await removeServer(srv.name)
    else await connectServer(srv.name)
    return
  } else if (sub) {
    pushLine("Usage: /mcp [list|add|edit [name]|test [name]|http|ws|stdio|ai|remove [name]|connect [name]]", C.error)
    return
  }

  // F7/D-2 主菜单循环：列表即菜单（server 行 → per-server 子菜单；Esc 回主菜单），
  // 顶部固定 agent 代配提示行（F5②）+ 每轮边界磁盘重读（F5①/D-3）。
  // 主菜单 Esc 退出；Add/Refresh 动作后 continue（Refresh 显式重开菜单重读磁盘）。
  // server 行 action 用 `@name:` 命名空间——与 add/refresh 保留动作永不撞名
  //（server 可以叫 "add" 或 "refresh"）。
  for (;;) {
    await reloadFromDisk()
    const servers = getServers()
    const connected = (s) => agent.tools.some((t) => t._mcpName === s.name)
    const toolCount = (s) => agent.tools.filter((t) => t._mcpName === s.name).length
    const entries = [
      { type: "header", text: "Tip: complex configs — ask the agent to edit the mcp.servers section of ~/.thincoder/config.json directly, then Reconnect here" },
    ]
    if (diskUnreadable) entries.push({ type: "header", text: "⚠ disk config unreadable — showing in-memory state" })
    if (servers.length > 0) {
      // D-3/T23 对账：disk 删除/变更的已连接 server——连接不断，行尾 ⚠ disk changed
      const drift = (s) => (changedNames.includes(s.name) ? " — ⚠ disk changed" : "")
      entries.push(
        { type: "header", text: `${servers.length} MCP server${servers.length === 1 ? "" : "s"} configured` },
        ...servers.map((s) => ({ type: "item", text: `${serverLine(s, connected(s), toolCount(s))}${drift(s)}`, action: `@${s.name}:` })),
      )
    } else {
      entries.push({ type: "header", text: "No MCP servers configured" })
    }
    entries.push(
      { type: "item", text: "+ Add server", action: "add" },
      { type: "item", text: "↻ Refresh", action: "refresh" },
    )
    const e = await showPicker("MCP", entries)
    if (!e) return // Esc 退出
    if (e.action === "add") { await addFlow(); continue }
    if (e.action === "refresh") continue // 重开菜单即重读磁盘（reloadFromDisk 在循环顶部）
    if (!e.action.startsWith("@")) continue // 未知动作防御——回主菜单
    // 选中 server 行 → per-server 子菜单：Edit config / Test connection / Reconnect / Remove
    const name = e.action.slice(1, -1)
    const se = await showPicker(`MCP: ${name}`, [
      { type: "header", text: "Server actions" },
      { type: "item", text: "Edit config", action: "edit" },
      { type: "item", text: "Test connection", action: "test" },
      { type: "item", text: "Reconnect", action: "connect" },
      { type: "item", text: "Remove", action: "remove" },
    ])
    if (!se) continue // 子菜单 Esc → 回主菜单
    const srv = getServers().find((s) => s.name === name)
    if (se.action === "edit") await editFlowWithConfirm(name)
    else if (se.action === "test") await testServer(name)
    else if (se.action === "connect") {
      if (srv) await connectServer(name)
      else pushLine(`[mcp] no server named "${name}"`, C.error)
    } else if (se.action === "remove") {
      if (srv) await removeServer(name)
      else pushLine(`[mcp] no server named "${name}"`, C.error)
    }
    continue
  }
}
