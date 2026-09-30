/**
 * config-mcp.mjs — shared config.json mcp.servers[] management (VS Code side).
 * Split out of config-io.mjs (2026-09-06: the file crossed the 500-line hard limit —
 * same pattern as the earlier config-presets.mjs / config-migrate.mjs splits).
 * W16 config-face consolidation: the VSC config-io.mjs mirror (and its re-export) is deleted —
 * this file's entry points are now the end-shell consumers (extension/settings.mjs / panel-messages.mjs).
 */

import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { loadRaw, conflictError } from "@thincoder/core/config-io.mjs"
import { vscPersistRaw } from "./extension/settings-panel-write.mjs"

/** Load MCP server configs: array of { name, command?, args?, env?, url?, wsUrl?, headers? }. */
export function loadMcpServers() {
  const raw = loadRaw()
  const servers = raw.mcp?.servers
  return Array.isArray(servers) ? servers.filter((s) => s && typeof s === "object" && s.name) : []
}

/** Add an MCP server entry. Rejects duplicates (CLI /mcp parity). Returns error string or null. */
export function addMcpServer(name, config) {
  const servers = loadMcpServers()
  if (servers.some((s) => s.name === name)) return `MCP server "${name}" already exists`
  const entry = { name }
  if (config.url) { entry.url = config.url; if (config.token) entry.token = config.token; if (config.headers) entry.headers = config.headers }
  else if (config.wsUrl) { entry.wsUrl = config.wsUrl; if (config.token) entry.token = config.token; if (config.headers) entry.headers = config.headers }
  else { entry.command = config.command; if (config.args) entry.args = config.args; if (config.env) entry.env = config.env }
  const r = vscPersistRaw((raw) => {
    raw.mcp = raw.mcp && typeof raw.mcp === "object" ? raw.mcp : {}
    raw.mcp.servers = Array.isArray(raw.mcp.servers) ? raw.mcp.servers : []
    raw.mcp.servers.push(entry)
  })
  return conflictError(r) // F5b：并发写冲突 → 同型提示串（调用方 providerError 通道展示）
}

/** Update an MCP server entry in place (F5/MCP.md §4 面板 [Edit]——CLI /mcp edit parity).
 *  Replaces the entry at its index (array order preserved); name is the immutable key.
 *  Returns error string or null. */
export function updateMcpServer(name, config) {
  const servers = loadMcpServers()
  const idx = servers.findIndex((s) => s.name === name)
  if (idx === -1) return `No MCP server named "${name}"`
  // F3 空输入保留旧值（面板惯例适配）：transport 字段被清空时回落到既有条目的类型
  // 与值——编辑表单只改 headers/token 时不得产出退化的 { name } 条目。
  const prev = servers[idx]
  const cfg = { ...config }
  if (!cfg.url && !cfg.wsUrl && !cfg.command) {
    if (prev.wsUrl) cfg.wsUrl = prev.wsUrl
    else if (prev.url) cfg.url = prev.url
    else cfg.command = prev.command
  }
  const entry = { name }
  if (cfg.url) { entry.url = cfg.url; if (cfg.token) entry.token = cfg.token; if (cfg.headers) entry.headers = cfg.headers }
  else if (cfg.wsUrl) { entry.wsUrl = cfg.wsUrl; if (cfg.token) entry.token = cfg.token; if (cfg.headers) entry.headers = cfg.headers }
  else { entry.command = cfg.command; if (cfg.args) entry.args = cfg.args; if (cfg.env) entry.env = cfg.env }
  const r = vscPersistRaw((raw) => {
    raw.mcp = raw.mcp && typeof raw.mcp === "object" ? raw.mcp : {}
    raw.mcp.servers = Array.isArray(raw.mcp.servers) ? raw.mcp.servers : []
    raw.mcp.servers[idx] = entry
  })
  return conflictError(r)
}

/** Remove an MCP server entry by name. Returns error string or null. */
export function removeMcpServer(name) {
  const servers = loadMcpServers()
  if (!servers.some((s) => s.name === name)) return `No MCP server named "${name}"`
  const r = vscPersistRaw((raw) => {
    raw.mcp = raw.mcp && typeof raw.mcp === "object" ? raw.mcp : {}
    raw.mcp.servers = (raw.mcp.servers ?? []).filter((s) => s?.name !== name)
  })
  return conflictError(r)
}

// ─── 装配面第二源（#701 · 2026-09-30 · 台账 #701——对齐 CLI `make-agent.mjs:61-79` ∕ 桌面
// `agent-assemble.mjs:58-79`；机制单源 = `docs/core/design/MCP.md` §6.4）：MCP **装配面**
// （会话 ro 载荷）另并项目根 `.mcp.json`；**管理面**（列表 ∕ 增删改 ∕ 重连 ∕ 探活）仍 config
// 单源（`loadMcpServers` 零改——文件源条目不进管理列表，沿 CLI `/mcp` 口径）。

/** 装配连接集 = config `mcp.servers`（前）＋ 项目根 `.mcp.json`（后——单层发现、零上溯）。
 *  合并 = config 同名优先 ∕ 异名追加；`mcpServers` 须对象形（数组形 ⇒ 跳过 + 记录）；条目 =
 *  `{ name, ...server }`（非对象 ∕ 数组 ⇒ 跳过）；读 ∕ 解析失败非致命（仅记录）；非变异（零回写 config）。
 *  @param {string} cwd — 会话当前项目根；空 ∕ 非串 ⇒ 零读零并入（恒等 `loadMcpServers()`） */
export async function assemblyMcpServers(cwd) {
  const servers = loadMcpServers()
  if (typeof cwd !== "string" || cwd === "") return servers
  try {
    const mcpJsonPath = join(cwd, ".mcp.json")
    if (!existsSync(mcpJsonPath)) return servers
    const mcpServers = JSON.parse(readFileSync(mcpJsonPath, "utf8"))?.mcpServers
    if (Array.isArray(mcpServers)) console.error("[mcp] .mcp.json: mcpServers must be a plain object, got array — skipped")
    if (!mcpServers || typeof mcpServers !== "object" || Array.isArray(mcpServers)) return servers
    const configNames = new Set(servers.map((s) => s.name))
    for (const [name, server] of Object.entries(mcpServers)) {
      if (configNames.has(name)) continue // config.json takes priority
      if (!server || typeof server !== "object" || Array.isArray(server)) continue
      servers.push({ name, ...server })
    }
  } catch (e) {
    console.error(`[mcp] Failed to read .mcp.json: ${e.message}`) // 非致命（沿 CLI 判——零中断）
  }
  return servers
}
