/**
 * mcp-servers.mjs — MCP 六通道：`mcp:list` / `mcp:save` / `mcp:remove`（批档 §2.4 契约）+ **R7 增
 * `mcp:tools`**（连接列举 ⇒ 逐工具 `name` ∕ `description` ∕ `params`；`{ name, test: true }` 支 =
 * Test 探活 [`probeMcpServer` 一次，零副作用]）+ **B10 W3 增 `mcp:update` ∕ `mcp:reconnect`**（S8 编辑面 ∕
 * S9 行重连）。
 *
 * 纪律（§2.3 写面条款）：写面 = 核 `writeConfigAtomic`（唯一写盘执行体）改 `mcp.servers` 节；
 * 端侧零自写盘。**增径先探活后落盘**：核 `probeMcpServer`（`thincoder-core/mcp.mjs:82`，
 * `{ ok, toolCount, latencyMs }` ∥ `{ ok:false, error }`，零副作用）不通 ⇒ **零写盘**（同 CLI
 * `/mcp add` 口径）——**编辑径零探活**（B10 W3 裁「探活归属」：编辑 = 配置修正径，探活会阻断「把坏
 * 配置改好」；沿 VSC `updateMcpServer` 仅落盘口径——本裁记录见批次档 §5）。
 * 连接面随动（`connectMcpServer:225` / `removeMcpTools:285`）：由调用方经 `ctx.listAgents()`
 * 注入在装配 agent 列表（本档**不 import** 会话宿主——依赖方向单向，端侧零循环）。无在装配
 * agent 时随动为**空操作**（配置已落盘，下次装配生效——非静默降级，随动对象本就不存在）。
 * R7 工具清单面：连接列举 = 核 `connectMcpServer`（幂等——同 name 活连接复用）；**失败落回执不抛**
 * （错误串直传，沿 `mcpSave` 同批先例）。
 * B10 W3 两新面：`mcp:list` 行增 `config` 七键（**表单预填面** = 现值；沿 VSC `pushMcpStatus` 同形——
 * 列表摘要面仍是零密钥）；`mcpUpdate` 原位替换（数组序保持）；`mcpReconnect` 先断（核 `_sessions`
 * 表按名关会话）后连。
 */
import { loadConfig } from "@thincoder/core/config.mjs"
import { _configPath, writeConfigAtomic } from "@thincoder/core/config-io.mjs"
import { _sessions, connectMcpServer, probeMcpServer, removeMcpTools } from "@thincoder/core/mcp.mjs"

/** 形判（端侧）：`url` / `wsUrl` ⇒ `url` 形；`command` ⇒ `command` 形；三者皆无 ⇒ 形非法。 */
function kindOf(cfg) {
  if (typeof cfg?.url === "string" && cfg.url) return "url"
  if (typeof cfg?.wsUrl === "string" && cfg.wsUrl) return "url"
  if (typeof cfg?.command === "string" && cfg.command) return "command"
  return null
}

/** 列摘要 = 端点（url 形）∥ 命令行（command 形）——**不含** token/headers/env 值（密钥零下发）。 */
function summaryOf(cfg) {
  if (typeof cfg?.url === "string" && cfg.url) return cfg.url
  if (typeof cfg?.wsUrl === "string" && cfg.wsUrl) return cfg.wsUrl
  const args = Array.isArray(cfg?.args) ? cfg.args : []
  return [cfg?.command, ...args].filter((s) => typeof s === "string" && s).join(" ")
}

/** 落盘：按名替换（同名覆盖）∥ 追加。 */
function writeServers(name, entry) {
  return writeConfigAtomic(_configPath(), (disk) => {
    const list = Array.isArray(disk?.mcp?.servers) ? disk.mcp.servers : []
    const kept = list.filter((s) => s?.name !== name)
    disk.mcp = { ...(disk.mcp ?? {}), servers: entry ? [...kept, entry] : kept }
  })
}

/** 落盘：**原位替换**（数组序保持——S8 编辑面，沿 VSC `updateMcpServer` 同判：名 = 不变量，条目按名定位替换）。
 *  写内新鲜读名不存 ⇒ 抛本档私记号（跨进程改档微窗口 ⇒ 外层回 `unknown-server`，零写）。 */
const VANISHED = Symbol("vanished-server")
function writeServersInPlace(name, entry) {
  return writeConfigAtomic(_configPath(), (disk) => {
    const list = Array.isArray(disk?.mcp?.servers) ? disk.mcp.servers : []
    const idx = list.findIndex((s) => s?.name === name)
    if (idx === -1) throw VANISHED
    list[idx] = entry
    disk.mcp = { ...(disk.mcp ?? {}), servers: list }
  })
}

/** 在装配 agent 列表（缺省 null = 无宿主面 ⇒ 随动空操作）。 */
function agentsOf(ctx) {
  const agents = ctx?.listAgents?.()
  return Array.isArray(agents) ? agents : null
}

/**
 * `mcp:list` ⇒ `{ ok, servers:[{ name, kind, summary, config }] }`——读盘面 = 核 `loadConfig()` 的 `mcp.servers`
 * 节（不改盘、不连接——只列已配；`config` = S8 表单预填面，七键恰形）。畸形档不吞：核抛 ⇒ invoke 拒绝直传。
 */
export function mcpList() {
  const config = loadConfig()
  const servers = Array.isArray(config?.mcp?.servers) ? config.mcp.servers : []
  return {
    ok: true,
    servers: servers.filter((s) => s && typeof s === "object").map((s) => {
      const kind = kindOf(s) ?? "command"
      // S8：`config` = 表单预填面（七键恰形——沿 VSC `pushMcpStatus` 同形；token ∕ headers ∕ env 随行下发，
      // 预填 = 现值判据所需；上方 `summary` 仍是零密钥摘要）。
      return {
        name: s.name, kind, summary: summaryOf(s),
        config: {
          command: s.command, args: s.args, env: s.env,
          url: s.url, wsUrl: s.wsUrl, headers: s.headers, token: s.token,
        },
      }
    }),
  }
}

/**
 * `mcp:save(payload)` ⇒ `{ ok:true, tools }` ∥ `{ ok:false, reason, detail? }`——载荷
 * `{ name, config }`（`config` = 核条目形：`{ url? , wsUrl? , command?, args?, env?, token?, headers? }`，
 * 原样落盘）。
 * ① **探活先行**：核 `probeMcpServer(entry)` 不通 ⇒ `{ ok:false, reason:"probe-failed", detail: 核错误串 }`
 *    + **零写盘**；② 落盘（`writeConfigAtomic`）失败 ⇒ 核回执 reason 直传（`mtime-conflict`）；
 * ③ 落盘成功后随动接入在装配 agent（`connectMcpServer` + `agent.tools` 追加该服务器的工具——
 *    已持同名工具则不重复追加）。
 */
export async function mcpSave(payload, ctx = {}) {
  const name = String(payload?.name ?? "").trim()
  const raw = payload?.config
  if (!name || !raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, reason: "invalid-shape" }
  const entry = { ...raw, name }
  if (!kindOf(entry)) return { ok: false, reason: "invalid-shape" }
  const probe = await probeMcpServer(entry)
  if (!probe.ok) return { ok: false, reason: "probe-failed", detail: probe.error ?? null }
  const w = writeServers(name, entry)
  if (!w.ok) return { ok: false, reason: w.reason }
  const connected = await attach(entry, agentsOf(ctx))
  return { ok: true, tools: connected ?? probe.toolCount ?? 0 }
}

/** 随动接入：连一次，把该服务器的工具补进每个在装配 agent（补入数 = 返回值；无宿主面 ⇒ null）。 */
async function attach(entry, agents) {
  if (!agents) return null
  let tools
  try {
    tools = await connectMcpServer(entry)
  } catch {
    return 0 // 落盘已成事实；连接失败不回退写盘（下次装配自然重连）
  }
  const mine = (Array.isArray(tools) ? tools : []).filter((t) => t)
  let added = 0
  for (const agent of agents) {
    if (!Array.isArray(agent?.tools)) continue
    if (agent.tools.some((t) => t?._mcpName === entry.name)) continue
    agent.tools.push(...mine)
    added += mine.length
  }
  return added
}

/**
 * `mcp:remove(payload)` ⇒ `{ ok:true }` ∥ `{ ok:false, reason }`（写失败核回执直传）——载荷 `{ name }`：
 * 落盘摘除该服务器（幂等：名不存在 = 无操作成功）+ 随动撤除每个在装配 agent 上的同名工具
 * （核 `removeMcpTools(agent, name)`，含连接关闭）。
 */
export function mcpRemove(payload, ctx = {}) {
  const name = String(payload?.name ?? "").trim()
  if (!name) return { ok: false, reason: "invalid-shape" }
  const w = writeServers(name, null)
  if (!w.ok) return { ok: false, reason: w.reason }
  const agents = agentsOf(ctx)
  if (agents) for (const agent of agents) if (Array.isArray(agent?.tools)) removeMcpTools(agent, name)
  return { ok: true }
}

/** 关核会话（按名——`_sessions` 核导出表，VSC `panel-mcp.mjs` `closeSessionByName` 同判：`closed` 标记
 *  + transport.close + 注册表移除；名缺 ⇒ 空操作）。 */
function closeSessionByName(name) {
  const session = _sessions.get(name)
  if (!session) return
  session.closed = true
  try { session.state?.transport?.close() } catch { /* best effort */ }
  _sessions.delete(name)
}

/** 重挂（S8 编辑 ∕ S9 重连共用）：先撤陈旧工具（`removeMcpTools` 连带关核会话）⇒ 核 `connectMcpServer`
 *  全新连一次 ⇒ 逐 agent 补工具（无宿主面 ⇒ 只连不补）。连接抛 ⇒ 由调用面处置。 */
async function remount(entry, agents) {
  if (agents) for (const agent of agents) if (Array.isArray(agent?.tools)) removeMcpTools(agent, entry.name)
  const tools = await connectMcpServer(entry)
  const mine = (Array.isArray(tools) ? tools : []).filter((t) => t)
  let added = 0
  if (agents) for (const agent of agents) { if (!Array.isArray(agent?.tools)) continue; agent.tools.push(...mine); added += mine.length }
  return agents ? added : null
}

/**
 * `mcp:update(payload)` ⇒ `{ ok, tools }` ∥ `{ ok:false, reason }`——载荷 `{ name, config }`（S8 · 编辑面）：
 * **原位替换**（数组序保持）经核 `writeConfigAtomic`；**零探活**（编辑 = 配置修正径——探活会阻断「把坏配置
 * 改好」，沿 VSC `updateMcpServer` 仅落盘口径；「探活归属」一次裁记录 = 批次档 §5）。
 * 名不存（含写内消失窗口）⇒ `unknown-server` + **零写**；写后随动重挂（有宿主 ⇒ 撤陈旧再连补工具；
 * 连接失败不回退写盘——沿 `attach` 同判）；无宿主 ⇒ 随动空操作（`tools: null`）。
 */
export async function mcpUpdate(payload, ctx = {}) {
  const name = String(payload?.name ?? "").trim()
  const raw = payload?.config
  if (!name || !raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, reason: "invalid-shape" }
  const entry = { ...raw, name }
  if (!kindOf(entry)) return { ok: false, reason: "invalid-shape" }
  let w
  try {
    w = writeServersInPlace(name, entry)
  } catch (error) {
    if (error === VANISHED) return { ok: false, reason: "unknown-server" } // 写内新鲜读名不存（微窗口）
    throw error
  }
  if (!w.ok) return { ok: false, reason: w.reason }
  const agents = agentsOf(ctx)
  let connected = null
  if (agents) {
    try { connected = await remount(entry, agents) } catch { connected = null } // 写已成事实：连接失败不回退
  }
  return { ok: true, tools: connected }
}

/**
 * `mcp:reconnect(payload)` ⇒ `{ ok, tools }` ∥ `{ ok:false, reason }`——载荷 `{ name }`（S9 · 行重连）：
 * **先断后连**——按名关核会话（`_sessions`；无活会话 ⇒ 空操作）⇒ `remount` 全新连一次。
 * 名不在配置 ⇒ `unknown-server`（零连接）；连不通 ⇒ `reason` = 核错误串直传（**失败面在场**——
 * 与 `mcp:tools` 同径，不抛）；通 ⇒ `tools` = 补入数（无宿主面 ⇒ `null` —— 只连不补）。
 */
export async function mcpReconnect(payload, ctx = {}) {
  const name = String(payload?.name ?? "").trim()
  if (!name) return { ok: false, reason: "invalid-shape" }
  const config = loadConfig()
  const servers = Array.isArray(config?.mcp?.servers) ? config.mcp.servers : []
  const entry = servers.find((s) => s && s.name === name)
  if (!entry) return { ok: false, reason: "unknown-server" }
  closeSessionByName(name)
  try {
    return { ok: true, tools: await remount(entry, agentsOf(ctx)) }
  } catch (error) {
    return { ok: false, reason: error?.message ?? String(error) }
  }
}

/** 工具面参数投影（VSC `updateMcpTools` 同判据）：`parameters.properties` 键名逗号连；缺 ∕ 非对象 ⇒ 空串。 */
function paramsOf(parameters) {
  const props = parameters && typeof parameters === "object" ? parameters.properties : null
  return props && typeof props === "object" && !Array.isArray(props) ? Object.keys(props).join(", ") : ""
}

/**
 * `mcp:tools(payload)`（R7 · 桌面功能对位批 · C12 MCP 工具清单）⇒ 两支：
 *   ① `{ name }` ⇒ `{ ok, tools:[{ name, description, params }] }`——连接列举（核 `connectMcpServer`
 *      幂等；工具名 = **核构建面原形**（含 `<server>_` 前缀 —— 即 agent 实际可调名））；
 *   ② `{ name, test: true }` ⇒ `{ ok, toolCount, latencyMs }` ∥ `{ ok:false, reason:"probe-failed",
 *      detail }`——**Test 探活一次**（核 `probeMcpServer`，零副作用、不进会话幂等表）。
 * 名不在配置 ⇒ `{ ok:false, reason:"unknown-server" }`（零连接）；连接失败 ⇒ `{ ok:false, reason:
 * 错误串直传 }`（不抛）。
 */
export async function mcpTools(payload) {
  const name = String(payload?.name ?? "").trim()
  if (!name) return { ok: false, reason: "invalid-shape" }
  const config = loadConfig()
  const servers = Array.isArray(config?.mcp?.servers) ? config.mcp.servers : []
  const entry = servers.find((s) => s && s.name === name)
  if (!entry) return { ok: false, reason: "unknown-server" }
  if (payload?.test === true) {
    const probe = await probeMcpServer(entry)
    if (!probe.ok) return { ok: false, reason: "probe-failed", detail: probe.error ?? null }
    return { ok: true, toolCount: probe.toolCount, latencyMs: probe.latencyMs }
  }
  try {
    const tools = await connectMcpServer(entry)
    return {
      ok: true,
      tools: (Array.isArray(tools) ? tools : []).map((t) => ({
        name: String(t?.name ?? ""),
        description: typeof t?.description === "string" ? t.description : "",
        params: paramsOf(t?.parameters),
      })),
    }
  } catch (error) {
    return { ok: false, reason: error?.message ?? String(error) }
  }
}
