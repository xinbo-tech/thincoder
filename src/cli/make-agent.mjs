import { execSync } from "node:child_process"
import { join } from "node:path"
import { createAgent } from "../agent.mjs"
import { loadConfig, configDir } from "../config.mjs"
import { createMemory, memoryTools, syncDir, codeSearchTool, docSearchTool } from "../memory.mjs"
import { repoOutlineTool } from "../tools/repomap.mjs"
import { builtinTools } from "../tools/index.mjs"
import { discoverRules } from "../rules.mjs"

/** Assemble an agent with memory, MCP tools, and code/doc indices attached (sync all layers, then return) */
export async function assembleAgent() {
  const config = loadConfig()
  const provider = config.provider
  const providers = config.providersList

  // Inject proxy URI into providers (double opt-in: provider.proxy + config.proxy.model)
  const { injectProxy } = await import("../proxy.mjs")
  injectProxy(providers, config)
  // config.provider 是 loadConfig 里的独立拷贝，同步注入结果
  provider.proxyUri = providers.find((p) => p.name === config.activeProvider)?.proxyUri

  const memory = createMemory({ dbPath: config.memory.dbPath })
  // Vector retrieval: enabled if embedding is configured (lazy vector generation, computed on first search)
  if (config.embedding?.apiKey) {
    const { createEmbedder } = await import("../embedding.mjs")
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
    memory.projectOrigin = join(cwd, config.memory.projectDir)
    await syncDir(memory, { layer: "project", dir: memory.projectOrigin })
  }
  // Team layer (optional): auto-clone on first use; startup only indexes local dir, remote pull via explicit thincoder sync
  const team = teamConfig(config)
  if (team) {
    const { ensureClone } = await import("../git/gitmem.mjs")
    await ensureClone(team)
    await syncDir(memory, { layer: "team", dir: team.dir })
  }
  const baseTools = [...builtinTools, ...memoryTools(memory, { cwd, projectDir: config.memory.projectDir, author: gitAuthor(), team }), codeSearchTool(memory), docSearchTool(memory), repoOutlineTool(memory.db, cwd)]

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
    const { connectMcpServer } = await import("../mcp.mjs")
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
    tools: [...baseTools, ...mcpTools],
    config,
    cwd,
    memory,
  })
  agent.providers = providers
  agent.activeProvider = config.activeProvider
  agent.activeModel = config.activeModel ?? null
  agent._mcpWarnings = mcpWarnings
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
