import { execSync } from "node:child_process"
import { isAbsolute, join } from "node:path"
import { createAgent } from "../agent.mjs"
import { loadConfig, configDir } from "../config.mjs"
import { createMemory, memoryTools, syncDir, codeSearchTool, docSearchTool } from "@thincoder/core/memory.mjs"
import { settingsTool } from "../agent-tools/settings.mjs"
import { repoOutlineTool } from "../tools/repomap.mjs"
import { builtinTools } from "../tools/index.mjs"
import { discoverRules } from "@thincoder/core/rules.mjs"
// R10 L2（MULTI-INSTANCE-COLLAB §2a.4 D-L2b）：peer_instances 只读工具——挂感知模块导出
import { peerInstancesTool } from "@thincoder/core/peer-instances.mjs"

/** 第 27 批 §12.3⑤（R-A1.1）：装配期工具剔除——按 `name` 过滤的纯函数（机验锚）。
 *  恒等语义：空列表 / 零命中 → 原数组原样返回（零意外剔除——T15）。
 *  ACP 通道经 `assembleAgent({ excludeTools })` 传入（acp.mjs `ACP_EXCLUDED_TOOLS`）。 */
export function applyToolExclusions(tools, excludeTools = []) {
  const excluded = new Set(excludeTools ?? [])
  if (excluded.size === 0) return tools
  const kept = tools.filter((t) => !excluded.has(t?.name))
  return kept.length === tools.length ? tools : kept
}

/** Assemble an agent with memory, MCP tools, and code/doc indices attached (sync all layers, then return) */
export async function assembleAgent({ excludeTools = [] } = {}) {
  const config = loadConfig()
  const provider = config.provider
  const providers = config.providersList

  // Inject proxy URI into providers (double opt-in: provider.proxy + config.proxy.model)
  const { injectProxy } = await import("../proxy.mjs")
  injectProxy(providers, config)
  // config.provider 是 loadConfig 里的独立拷贝，同步注入结果
  if (provider?.name) provider.proxyUri = providers.find((p) => p.name === provider.name)?.proxyUri

  const memory = createMemory({ dbPath: config.memory.dbPath })
  // Vector retrieval: enabled if embedding is configured (lazy vector generation, computed on first search)
  if (config.embedding?.apiKey) {
    const { createEmbedder } = await import("@thincoder/core/embedding.mjs")
    memory.embedder = createEmbedder(config.embedding)
  }
  const cwd = process.cwd()
  // Merge project-level rules (.thincoder/rules/*.md) into config; file rules take priority (first),
  // config.json rules append (deduped by pattern). Users can override with explicit config rules.
  const fileRules = discoverRules(cwd)
  if (fileRules.length) {
    const filePatterns = new Set(fileRules.map(r => r.pattern))
    const configRules = (config.agent?.streamRules || []).filter(r => !filePatterns.has(r.pattern))
    config.agent.streamRules = [...fileRules, ...configRules]
  }
  // code/doc indices isolated by origin (project root dir): search only scoped to this project
  memory.codeOrigin = cwd
  // Project layer: sync .thincoder/memory/ dir to index on startup (sync if present, skip otherwise)
  if (config.memory.projectDir) {
    memory.projectOrigin = isAbsolute(config.memory.projectDir) ? config.memory.projectDir : join(cwd, config.memory.projectDir)
    await syncDir(memory, { layer: "project", dir: memory.projectOrigin })
  }
  // Team layer (optional): auto-clone on first use; startup only indexes local dir, remote pull via explicit thincoder sync
  const team = teamConfig(config)
  if (team) {
    const { ensureClone } = await import("@thincoder/core/git/gitmem.mjs")
    await ensureClone(team)
    await syncDir(memory, { layer: "team", dir: team.dir })
  }
  const baseTools = [...builtinTools, ...memoryTools(memory, { cwd, projectDir: config.memory.projectDir, author: gitAuthor(), team }), codeSearchTool(memory), docSearchTool(memory), repoOutlineTool(memory.db, cwd), settingsTool(), peerInstancesTool]

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
  const mcpWarnings = []
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
        mcpWarnings.push(msg)
      }
    }
  }

  const agent = createAgent({
    provider,
    tools: applyToolExclusions([...baseTools, ...mcpTools], excludeTools),
    config,
    cwd,
    memory,
  })
  agent.providers = providers
  // MODEL-MERGE-SESSION：config 无 active*——会话运行时起点 = defaultModel 复合解析
  // （provider 对象带解析后 model——API/spec 消费点零改）；无效 → {} + 原因走 D-S1 标记
  agent.activeProvider = provider.name ?? ""
  agent.activeModel = provider.model ?? null
  agent._mcpWarnings = mcpWarnings
  // SESSION.md §8 D-S1：assembleAgent 后唯一校验点（TUI/chat 两路径同源）——不抛错不退出，
  // 标记由调用侧消费（TUI 弹重选 / headless 报错）。空 provider 由 TUI 路径在 startTUI 前清空。
  validateProvider(agent)
  // defaultModel 无效/未设的具体原因覆盖通用判据文案（providers 存在时更有指导性）
  if (agent._providerInvalid && config.providerInvalidReason) {
    agent._providerInvalidReason = config.providerInvalidReason
  }
  return agent
}

/**
 * SESSION.md §8 D-S1 — provider 有效性校验（assembleAgent 后唯一校验点，TUI/chat 两路径同源）。
 * 判据（评审 #1/#2）：仅 model/baseURL 缺失判 invalid——**不得用 MODEL_SPECS 成员资格判无效**
 * （未知模型 = 受支持场景：自定义端点模型不在 spec 表是常态，误判会让自定义模型用户每次恢复都弹重选）。
 * apiKey 缺失不判（既有 wizard /model 流程处理）。幂等：有效时清标记，无效时置标记 + 原因。
 * 不抛错、不退出。返回 agent 便于链式调用。
 */
export function validateProvider(agent) {
  const ok = Boolean(agent.provider?.name && agent.provider.model && agent.provider.baseURL)
  if (ok) {
    delete agent._providerInvalid
    delete agent._providerInvalidReason
  } else {
    agent._providerInvalid = true
    agent._providerInvalidReason = !agent.provider?.name
      ? "provider 不存在"
      : !agent.provider.model ? "model 缺失"
      : "缺少 baseURL"
  }
  return agent
}

/** Read team config and fill in default dir; return null if not configured */
export function teamConfig(config) {
  const team = config.memory?.team
  if (!team?.repo) return null
  const name = team.name ?? "default"
  return { name, repo: team.repo, dir: team.dir ?? join(configDir, "teams", name) }
}

/** Entry author: git config user.name, fallback "unknown" */
export function gitAuthor() {
  try {
    return execSync("git config user.name", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || "unknown"
  } catch {
    return "unknown"
  }
}
