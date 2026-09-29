/**
 * make-agent.mjs — CLI 装配面（`assembleAgent` 出档；消费面 = `command-interactive.mjs` ∕ `acp.mjs` ∕
 * `distill-command.mjs` ∕ `memory-command.mjs` ∕ `command-table.mjs`）。
 * **装配序 = 核单源**（`thincoder-core/agent/assemble.mjs` —— B5 装配序上提批）：本档 = 端壳 adapter，
 * 留面 = cwd（`process.cwd()`）· MCP 合入 + `applyToolExclusions`（入核 `toolsFinalize` 缝 —— 位次保持：
 * 工具装配后、`createAgent` 前）· `_mcpWarnings` · M1 装配钩子 `attachManifest` · 校验调用；装配序本体
 * 与团队层取值随上提归核，本档四名**同名转口**（`teamConfig` ∕ `gitAuthor` ∕ `validateProvider` ∕
 * `DEFAULT_DEPS`）——调用面 import 路径与名面零改。
 */
import { join } from "node:path"
// 装配序核单源（B5 装配序上提批）：本档 = 核调用 + MCP 缝 + 后处理。
import { assembleAgent as coreAssemble, DEFAULT_DEPS, gitAuthor, teamConfig, validateProvider } from "@thincoder/core/agent/assemble.mjs"
import { resolveEngineeringManifest, projectView } from "@thincoder/core/manifest.mjs"

// 四名转口（核单源**恒等绑定**；调用面零改 —— 枚举见档头）。
export { DEFAULT_DEPS, gitAuthor, teamConfig, validateProvider }

/** 第 27 批 §12.3⑤（R-A1.1）：装配期工具剔除——按 `name` 过滤的纯函数（机验锚）。
 *  恒等语义：空列表 / 零命中 → 原数组原样返回（零意外剔除——T15）。
 *  ACP 通道经 `assembleAgent({ excludeTools })` 传入（acp.mjs `ACP_EXCLUDED_TOOLS`）。 */
export function applyToolExclusions(tools, excludeTools = []) {
  const excluded = new Set(excludeTools ?? [])
  if (excluded.size === 0) return tools
  const kept = tools.filter((t) => !excluded.has(t?.name))
  return kept.length === tools.length ? tools : kept
}

/** Assemble an agent with memory, MCP tools, and code/doc indices attached (sync all layers, then return)
 *  = 核装配序（`thincoder-core/agent/assemble.mjs`）+ 本端留面（MCP 合入 ∕ 剔除经 `toolsFinalize` 缝 ·
 *  `_mcpWarnings` · M1 装配钩子 · 校验调用）。`deps` 逐项可注入（缺省 = 核缺省）。 */
export async function assembleAgent({ excludeTools = [], slotData, deps = {} } = {}) {
  const cwd = process.cwd()
  /** MCP 连接警告（缝体出参——装配后落 `agent._mcpWarnings`）。 */
  const warnings = []
  const agent = await coreAssemble({
    cwd,
    deps,
    // 位次保持：工具装配后、createAgent 前（旧内联序 :64 → :66-110 → :112 逐位同）。
    toolsFinalize: (baseTools, { config }) => finalizeTools(baseTools, { cwd, config, excludeTools, warnings }),
  })
  agent._mcpWarnings = warnings
  // M1 装配钩子（会话起点①——装配期）：判据 = 会话权威值（`slotData` 槽值优先 + config 回退）；
  // 附着 agent.manifest 供下游 M2–M9 读面（普通会话 = null）；非 ok 态不抛（启动零拒绝）。
  // 钩子后移的可观察后果（报明 / 建档晚于 memory sync / MCP 连接 / 工具装配——功能等价，仍在
  // 进入正常循环之前）见 docs/core/design/MANIFEST.md §2.2。
  attachManifest(agent, { cwd, slotData })
  // SESSION.md §6.8 D-S1：assembleAgent 后唯一校验点（TUI/chat 两路径同源）——不抛错不退出，
  // 标记由调用侧消费（TUI 弹重选 / headless 报错）。空 provider 由 TUI 路径在 startTUI 前清空。
  validateProvider(agent, agent.config)
  return agent
}

/** MCP 合入 + 工具剔除（核 `toolsFinalize` 缝体——CLI 专用；位次 = 工具装配后、`createAgent` 前）。
 *  连接并发（死服务器不阻塞启动），失败收集为警告（TUI alt-buffer 下 stderr 不可见——经 `agent`
 *  对象传递）；`warnings` = 出参数组（调用侧装配 `agent._mcpWarnings`）。 */
async function finalizeTools(baseTools, { cwd, config, excludeTools, warnings }) {
  // MCP servers: connect in parallel (a dead server won't block startup), collect failures as warnings (stderr invisible in TUI, passed via agent object)
  const mcpServers = config.mcp?.servers ?? []
  // Read project-level .mcp.json (standard MCP client convention) — merge into mcpServers
  // config.json servers take priority over .mcp.json entries with the same name
  try {
    const { existsSync, readFileSync } = await import("node:fs")
    const mcpJsonPath = join(cwd, ".mcp.json")
    if (existsSync(mcpJsonPath)) {
      const mcpJson = JSON.parse(readFileSync(mcpJsonPath, "utf8"))
      if (mcpJson.mcpServers && typeof mcpJson.mcpServers === "object") {
        // 2026-08-31 MCP 会诊 #10：数组型 mcpServers 不是规范形态——Object.entries 会产出
        // "0"/"1" 数字名（变成工具前缀 "0_tool"），必须跳过；server 条目嵌套数组同理。
        if (Array.isArray(mcpJson.mcpServers)) {
          console.error("[mcp] .mcp.json: mcpServers must be a plain object, got array — skipped")
        } else {
          const configNames = new Set(mcpServers.map((s) => s.name))
          for (const [name, server] of Object.entries(mcpJson.mcpServers)) {
            if (configNames.has(name)) continue // config.json takes priority
            if (!server || typeof server !== "object" || Array.isArray(server)) continue
            mcpServers.push({ name, ...server })
          }
        }
      }
    }
  } catch (e) {
    // .mcp.json parse failure — non-fatal, log and continue
    console.error(`[mcp] Failed to read .mcp.json: ${e.message}`)
  }
  let mcpTools = []
  if (mcpServers.length) {
    const { connectMcpServer } = await import("@thincoder/core/mcp.mjs")
    const results = await Promise.allSettled(mcpServers.map((srv) => connectMcpServer(srv)))
    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      if (r.status === "fulfilled") {
        mcpTools = mcpTools.concat(r.value)
      } else {
        const srv = mcpServers[i]
        const msg = `MCP server "${srv.name ?? srv.command}" failed to connect: ${r.reason?.message ?? r.reason}`
        console.error(`[mcp] ${msg}`)
        warnings.push(msg)
      }
    }
  }
  return applyToolExclusions([...baseTools, ...mcpTools], excludeTools)
}

/**
 * M1 装配钩子（docs/core/design/MANIFEST.md §2.2 两端装配钩子——CLI 端）：
 * 会话起点调用（装配期 ① + `bin` 启动恢复后重估 ②——幂等：重估即重读，无状态位）。
 *
 * 模式门（判据单源 = 会话权威值，槽优先 + config 回退——KD-M1-12 / KD-M1-13）：
 * 「恢复槽带 `engineering` 字段 ? 槽值 : `agent.config.agent.engineering`」（槽字段在场判据
 * 与 `applySession` 同款——`thincoder-core/session.mjs:314-317`）。普通会话 → **装配钩子
 * 零 manifest I/O**（不读 / 不拒 / 不建档）+ `agent.manifest = null`（清残留附着——复用
 * agent 跨模式防陈旧）。
 *
 * 工程模式分支 = 核单源决策树 `resolveEngineeringManifest`（KD-M1-20）；**非 fatal**
 * （KD-M1-25 / M1-29——**启动零拒绝**）：档合法 / 梯②④⑤ 缺档（轻动作就地建档，`writer:'main'`）
 * ⇒ 附着；歧义（≥2 候选）/ 档非法 / 建档失败 ⇒ **不抛**——`agent.manifest = null` + 记
 * `agent._projectView`（形状 = `projectView` 返回面 + `created` 建档标记——§2.2 钩子段）。
 * 需要项目参数者各自报明（情境行 §2.6 / 动作侧各自报错——§2.9 C）。
 *
 * `slotData` = 恢复槽记录，由调用方经**参数注入**（`bin` TUI 分支既有 `resumeSlot` 调用
 * 前移——KD-M1-15：钩子内不调 `resumeSlot`（该函数非纯读：GC / 认领 / 端标写）；`chat` /
 * ACP 装配无会话 ⇒ 不传 ⇒ config 回退）。重估点不传（`applySession` 已按槽订正 config）。
 * @param {object} agent — createAgent 产物（读 agent.config；写 agent.manifest / agent._projectView）
 * @param {{cwd?: string, slotData?: object|null}} [opts]
 * @returns {object|null} 附着后的 manifest / 非 ok 态与普通会话 null
 */
export function attachManifest(agent, { cwd = process.cwd(), slotData } = {}) {
  const slotEng = slotData?.engineering
  const engineering = slotEng !== undefined ? slotEng === true : agent.config?.agent?.engineering === true
  if (!engineering) {
    agent.manifest = null // 清残留附着（KD-M1-12）——普通会话不读 / 不拒 / 不建档
    return null
  }
  // 决策树（writer 显式 'main'——写门 fail-closed 缺省拒，KD-M1-3；漏传 ⇒ 缺档格退化
  // `init-failed`）。任何非 ok 态都不抛（KD-M1-25）。
  const r = resolveEngineeringManifest(cwd, { writer: "main" })
  agent._projectView = { ...projectView(cwd), created: r.ok && r.created === true }
  agent.manifest = r.ok ? r.manifest : null
  return agent.manifest
}
