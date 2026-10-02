/**
 * agent-assemble.mjs — 宿主**装配面**出档（状态栏对齐批：自 `agent-host.mjs` 装配段**逐字搬运** —— 原档
 * 触行数拉线拆档，档名 = 在册预案「装配面拆 `thincoder-desktop/src/main/agent-assemble.mjs`」落形）。
 * **装配序 = 核单源**（`thincoder-core/agent/assemble.mjs` —— B5 装配序上提批）：本档 = 端壳 adapter，
 * 留面 = cwd 注入（`projects.currentCwd()`，取值点 `agent-host.mjs`）· `_slot` · 校验调用（`agent.config`）；
 * 装配序本体与团队层取值随上提归核，本档 `assembleFor`（核调用 + 后处理）+ 四名**同名转口**。
 * **端差两项已消（2026-09-29 · 批 `docs/batches/2026-09-29-hatch-clearance-2.md` §2 · #673「消（补做）」）**：
 * ① **MCP 合入** —— 经核 `toolsFinalize` 缝（位次 = 工具装配后、`createAgent` 前；与 CLI 同位次同缝 =
 *    `thincoder-cli/src/cli/make-agent.mjs:39 ∕ :53`；核缝 = `thincoder-core/agent/assemble.mjs:61-63 ∕ :105`）；
 * ② **M1 装配钩子附着** —— `attachManifest`（形对齐 CLI `make-agent.mjs:46 ∕ :127`；决策树机制单源 = 核
 *    `resolveEngineeringManifest` ∕ `projectView`，本档 = 端薄壳，零第二实现）。
 * 取值面一项保持：`cwd` = 项目根（注入的 `projects.currentCwd()`）——**非** `process.cwd()`。
 * **R3 执行面缝（#523②）**：档尾**模块装配期一次接线** —— `installExecRunSeams()`（出档 `exec-run.mjs`：
 * `configureExecRun` ← 核上提件 `runInterruptible` ∕ `configureProcessTreeKill` ← 核 `killProcessTree` 转口；
 * VSC `tools/shared.mjs:104-105` 同形）。
 * 零宿主依赖：核函数全部经 `deps` 取值（缺省 = 核单源）⇒ 平 node 直测（零 `electron`）。
 */
import { assembleAgent as coreAssemble, DEFAULT_DEPS, gitAuthor, teamConfig, validateProvider } from "@thincoder/core/agent/assemble.mjs"
import { resolveEngineeringManifest, projectView } from "@thincoder/core/manifest.mjs"
import { loadSlotFile } from "@thincoder/core/session.mjs"
// 执行面两缝（R3 · #523② —— 核件转口，零副本；接线在本档尾）。
import { installExecRunSeams } from "./exec-run.mjs"

// 四名转口（核单源**恒等绑定**；调用面 import 路径与名面零改 —— `agent-host.mjs:55`）。
export { DEFAULT_DEPS, gitAuthor, teamConfig, validateProvider }

/** MCP 合入缝体（#673 —— 核 `toolsFinalize` 缝；位次 = 工具装配后、`createAgent` 前）。两源 = 本装配 **config**
 *  的 `mcp.servers`（优先）∥ **项目根 `.mcp.json`**（#691 第二源——对齐 CLI `make-agent.mjs:61-79`，helper 见下）⇒ 逐条核
 *  `connectMcpServer`（幂等——同 name 活连接复用 ⇒ 与 `mcp-servers.mjs` 随动面共用核件，零副本）⇒ 工具并入 `baseTools`；
 *  **失败落警告不抛**（沿 CLI `_mcpWarnings` 同形——死服务器不阻装配；下次装配自然重连）。`deps.connectMcpServer` 可注入
 *  （缺省 = 核单源动态 import）——装配序可机验（假连接器）。**非变异**——不回写 `config.mcp.servers`。 */
async function finalizeTools(baseTools, { config, cwd }, deps, warnings) {
  const servers = (Array.isArray(config?.mcp?.servers) ? config.mcp.servers : []).filter((s) => s && typeof s === "object")
  const fileServers = await projectMcpJsonServers(cwd, new Set(servers.map((s) => s.name)))
  const allServers = [...servers, ...fileServers] // 合并列表 = 新数组（KD-691-5 非变异）
  if (allServers.length === 0) return baseTools
  const connect = typeof deps?.connectMcpServer === "function"
    ? deps.connectMcpServer
    : (entry) => import("@thincoder/core/mcp.mjs").then((m) => m.connectMcpServer(entry))
  const results = await Promise.allSettled(allServers.map((srv) => connect(srv)))
  const merged = []
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    if (r.status === "fulfilled") merged.push(...(Array.isArray(r.value) ? r.value : []).filter((t) => t))
    else {
      const srv = allServers[i]
      const msg = `MCP server "${srv.name ?? srv.command}" failed to connect: ${r.reason?.message ?? r.reason}`
      console.error(`[mcp] ${msg}`)
      warnings.push(msg)
    }
  }
  return merged.length === 0 ? baseTools : [...baseTools, ...merged] // 零并入 ⇒ 原数组原样（恒等）
}

/** 项目文件第二源（#691 · 对齐 CLI `make-agent.mjs:61-79`）：`join(cwd, ".mcp.json")` 单层读取（零上溯）——
 *  `mcpServers` 须对象形（数组形 ⇒ 跳过 + 记录）；条目 = 键名注入 `{ name, ...server }`（非对象 ∕ 数组跳过）；
 *  `configNames` 同名跳过（config 优先）；读 ∕ 解析失败非致命（仅记录——`_mcpWarnings` 零增，沿 CLI 判）。 */
async function projectMcpJsonServers(cwd, configNames) {
  if (typeof cwd !== "string" || cwd === "") return []
  try {
    const { existsSync, readFileSync } = await import("node:fs")
    const { join } = await import("node:path")
    const mcpJsonPath = join(cwd, ".mcp.json")
    if (!existsSync(mcpJsonPath)) return []
    const mcpServers = JSON.parse(readFileSync(mcpJsonPath, "utf8"))?.mcpServers
    if (Array.isArray(mcpServers)) console.error("[mcp] .mcp.json: mcpServers must be a plain object, got array — skipped")
    if (!mcpServers || typeof mcpServers !== "object" || Array.isArray(mcpServers)) return []
    const out = []
    for (const [name, server] of Object.entries(mcpServers)) {
      if (configNames.has(name)) continue // config.json takes priority
      if (!server || typeof server !== "object" || Array.isArray(server)) continue
      out.push({ name, ...server })
    }
    return out
  } catch (e) {
    console.error(`[mcp] Failed to read .mcp.json: ${e.message}`)
    return []
  }
}

/** M1 装配钩子（`docs/core/design/MANIFEST.md` §2.2 两端装配钩子 —— 桌面端；形对齐 CLI
 *  `thincoder-cli/src/cli/make-agent.mjs:127`，决策树 = 核单源 `resolveEngineeringManifest`，本档零副本）：
 *  模式门 = 会话权威值（槽值优先 + config 回退）；普通会话 ⇒ **装配钩子零 manifest I/O**（不读 ∕ 不拒 ∕
 *  不建档）+ `agent.manifest = null`（清残留附着）；工程模式 ⇒ **非 fatal**（档合法 ∕ 缺档就地建档
 *  〔`writer:'main'`〕⇒ 附着；歧义 ∕ 档非法 ∕ 建档失败 ⇒ **不抛**——`agent.manifest = null` +
 *  记 `agent._projectView`（形状 = 核 `projectView` 返回面 + `created` 建档标记））。
 *  @param {object} agent — 装配产物（读 `agent.config`；写 `agent.manifest` ∕ `agent._projectView`）
 *  @param {{cwd?: string, slotData?: object|null}} [opts] — `slotData` = 本键槽记录（桌面槽面读）
 *  @returns {object|null} 附着后的 manifest / 非 ok 态与普通会话 null */
export function attachManifest(agent, { cwd, slotData } = {}) {
  const slotEng = slotData?.engineering
  const engineering = slotEng !== undefined ? slotEng === true : agent.config?.agent?.engineering === true
  if (!engineering) {
    agent.manifest = null // 清残留附着（跨模式防陈旧——同 CLI）——普通会话不读 ∕ 不拒 ∕ 不建档
    return null
  }
  const base = typeof cwd === "string" && cwd !== "" ? cwd : process.cwd()
  const r = resolveEngineeringManifest(base, { writer: "main" })
  agent._projectView = { ...projectView(base), created: r.ok && r.created === true }
  agent.manifest = r.ok ? r.manifest : null
  return agent.manifest
}

/** 本键槽记录读（M1 钩子 `slotData` 供给 = 桌面槽面 —— 核 `loadSlotFile` 单源；槽缺 ⇒ null）。
 *  纯读零副作用（`loadSlotFile` 非抛、无认领 —— 与 `session-io.mjs` 取槽同判据）。 */
function slotDataOf(cwd, slot) {
  if (typeof cwd !== "string" || cwd === "" || !Number.isFinite(slot)) return null
  return loadSlotFile(cwd, slot) ?? null
}

/** 装配一份会话代理 = 核装配序（`cwd` = 项目根）+ 端壳后处理（MCP 合入缝 ∕ `_slot` ∕ M1 钩子 ∕ 校验调用）。
 *  `deps` 逐项可注入（缺省 = 核缺省；`deps.connectMcpServer` = MCP 连接器注入缝）：装配序可机验（U79）。 */
export async function assembleFor({ cwd, slot, deps = {} }) {
  /** MCP 连接警告（缝体出参——装配后落 `agent._mcpWarnings`；沿 CLI 同形）。 */
  const warnings = []
  const agent = await coreAssemble({
    cwd,
    deps,
    toolsFinalize: (baseTools, ctx) => finalizeTools(baseTools, ctx, deps, warnings),
  })
  agent._mcpWarnings = warnings
  agent._slot = slot
  // M1 装配钩子（#673 · 消）：槽值优先 + config 回退（判据同 CLI）——槽记录 = 本键槽面读。
  attachManifest(agent, { cwd, slotData: slotDataOf(cwd, slot) })
  validateProvider(agent, agent.config)
  return agent
}

/** MCP 连接失败提醒构造（KD-70 —— 桌面消费词面；装配尾经 `agent-host.mjs` `assembleAndLoad` 入队）。
 *  首两段逐字同 CLI（`thincoder-cli/src/command-interactive.mjs:151-155`：计数 + 逐条）；末行指路
 *  **桌面可达出口**（设置面 MCP 段「重连」——CLI 的 `/mcp connect <name>` 桌面不存在，逐字照搬即误导）。
 *  零警告 ⇒ `null`（**零写** —— 调用方零入队）；纯函数、零副作用。 */
export function mcpWarningReminder(warnings) {
  const list = Array.isArray(warnings) ? warnings : []
  if (list.length === 0) return null
  return `[System reminder: ${list.length} MCP server(s) failed to connect at startup:\n` +
    list.map((w) => `  - ${w}`).join("\n") +
    "\nYou can try reconnecting from the Settings panel (MCP section → Reconnect).]"
}

// ─── 装配期缝接线（R3 · #523② —— 模块装配期一次；VSC `tools/shared.mjs:104-105` 同形）────────
installExecRunSeams()
