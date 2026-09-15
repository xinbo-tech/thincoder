/**
 * config-mcp.mjs — shared config.json mcp.servers[] management (VS Code side).
 * Split out of config-io.mjs (2026-09-06: the file crossed the 500-line hard limit —
 * same pattern as the earlier config-presets.mjs / config-migrate.mjs splits).
 * W16 config-face consolidation: the VSC config-io.mjs mirror (and its re-export) is deleted —
 * this file's entry points are now the end-shell consumers (extension/settings.mjs / panel-messages.mjs).
 */

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
