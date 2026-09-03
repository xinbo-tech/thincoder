/**
 * memory-tool.mjs — the merged `memory` agent tool (MEMORY.md §6, five actions).
 * Split out of memory.mjs (500-line hard limit) — core storage/search stays in
 * memory.mjs; this module only builds the tool surface + its action executors.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync, unlinkSync } from "node:fs"
import { join } from "node:path"
import { getEmbedder } from "./embed-config.mjs"
import { loadIndexManifest, searchIndex } from "./indexer.mjs"
import {
  VALID_TYPES, VALID_SCOPES, scopeDir, readAllEntries, readAllScopeEntries,
  entryFilename, serializeEntry, parseEntry, search, ensureDir,
} from "./memory.mjs"

// ─── tools ────────────────────────────────────────────────────


/** §6 merged memory tool — action enum / parameter shapes / description byte-identical with
 *  thincoder/src/memory/docs.mjs memoryTools (MEMORY.md §6 D-M1/F-M6); scope VALUES per end:
 *  this extension has no team layer and rejects team with CLI guidance.
 *  search/list are read-only actions (isReadonlyAction — execute-tools.mjs: plan mode passes,
 *  no permission ask, readonly-parallel batches); put/delete/clear keep their side-effect
 *  gates — confirm:true is the batch-delete/clear tool-level gate (direct-delete ruling:
 *  the confirm parameter IS the gate, no second human step). */
const MEMORY_ACTIONS = ["search", "put", "list", "delete", "clear"]
const MEMORY_TOOL_DESCRIPTION =
  "Manage long-term memory in ONE tool — the action parameter picks the operation:\n" +
  "- search — find knowledge saved in previous sessions (query, optional scope/limit); results include every entry's id\n" +
  "- put — save a piece of knowledge for future sessions (type: rule = coding standards, knowledge = project facts, decision = architecture decisions, pattern = debugging/workflow patterns; title/content/tags/scope)\n" +
  "- list — inventory what memory holds: optional scope/type/keyword filters, limit default 50; one row per entry: id [type] title (date); a truncated list notes the full count\n" +
  "- delete — SINGLE: {id, scope} deletes one entry by the id shown in put/search/list output. BATCH: {scope + type and/or keyword} deletes every matching entry in that scope — a call without confirm:true is refused and returns the count plus a preview (re-send with confirm:true to execute); scope-wide wipes without filters are refused on every layer\n" +
  "- clear — {scope: \"personal\", confirm: true} wipes ALL personal memory entries. clear is personal-only: a missing scope or a project/team scope is refused (use delete batch filters on shared layers)\n" +
  "Deleting project/team (CLI) entries removes the local markdown file and its index row — team deletion is local only and a later team sync may resurrect the file while the remote still has it.\n" +
  "Save bugs, conventions, and preferences here — they persist across sessions."

/** Date display for list/preview rows: frontmatter created date; unknown → "?" */
function rowDate(created) {
  return created ? String(created).slice(0, 10) : "?"
}

/** Compact row shared by list and batch-delete preview (id = entry filename). */
function listRow(entry) {
  return `${entry._file} [${entry.type}] ${entry.title}（${rowDate(entry.created)}）`
}

function normalizeLimit(limit, dflt) {
  const n = Number(limit)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : dflt
}

/** Validate an optional entry-type filter argument; returns an Error string or null. */
function invalidType(type) {
  if (type === undefined || type === null || type === "") return null
  const t = String(type)
  return VALID_TYPES.has(t) ? null : `Error: Invalid memory type "${t}"; expected one of: ${[...VALID_TYPES].join(", ")}`
}

export const memoryTool = {
  name: "memory",
  description: MEMORY_TOOL_DESCRIPTION,
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: MEMORY_ACTIONS, description: "Operation to run (required)" },
      scope: { type: "string", enum: [...VALID_SCOPES], description: "Where the memory lives: personal (private), project (shared via this repo's .thincoder/memory/), team (CLI only). put defaults to personal; search/list search every layer when omitted; delete/clear require it" },
      type: { type: "string", enum: [...VALID_TYPES], description: "Entry type: put = what to save; list/delete batch = filter by type" },
      title: { type: "string", description: "put: short title" },
      content: { type: "string", description: "put: full content to remember" },
      tags: { type: "string", description: "put: space-separated tags" },
      query: { type: "string", description: "search: natural-language query" },
      keyword: { type: "string", description: "list/delete batch: filter matching title/content" },
      id: { type: "string", description: "delete single: the entry id from put/search/list output" },
      limit: { type: "number", description: "Max rows: list 50 by default, search 5 by default" },
      confirm: { type: "boolean", description: "delete batch/clear: must be true — without it the tool refuses" },
    },
    required: ["action"],
  },
  readonly: false,
  // §6 action-level classification (execute-tools.mjs reads this): search/list are read-only
  isReadonlyAction(args) {
    const action = args?.action
    return action === "search" || action === "list"
  },
  execute(args, ctx) {
    const action = String(args?.action ?? "")
    if (!MEMORY_ACTIONS.includes(action)) {
      return `Error: memory: unknown action "${action}" — expected one of: ${MEMORY_ACTIONS.join("/")}`
    }
    switch (action) {
      case "search": return execSearch(args, ctx)
      case "put": return execPut(args, ctx)
      case "list": return execList(args, ctx)
      case "delete": return execDelete(args, ctx)
      case "clear": return execClear(args, ctx)
    }
  },
}

/** action search — the retired search tool surface (read-only; scope filter added, same output contract). */
function execSearch(args, ctx) {
  const scope = args.scope ?? null
  if (scope && !VALID_SCOPES.has(scope)) {
    if (scope === "team") return "Error: memory search: VS Code memory has no team layer — team memory is managed by the CLI"
    return `Error: memory search: invalid scope "${scope}" — scopes: ${[...VALID_SCOPES].join("/")}`
  }
  const query = String(args.query ?? "").trim()
  if (!query) return "No matching memories found." // 空 query 短路——两端同语义（评审 code review #4）
  const limit = normalizeLimit(args.limit, 5)
  // Vector search first if embedder + index available (scope-restricted results only)
  try {
    const embedder = getEmbedder()
    const manifest = embedder ? loadIndexManifest(ctx.cwd) : null
    if (manifest) {
      return (async () => {
        try {
          const vecResults = await searchIndex(ctx.cwd, embedder, query, { kind: "memory", limit: limit || 5 })
          const scoped = scope
            ? vecResults.filter((r) => String(r.file).replaceAll("\\", "/").includes(`/${scope}/`))
            : vecResults
          if (scoped.length > 0) {
            return scoped.map((r) =>
              `${r.file}:${r.startLine}-${r.endLine} (id=${r.file.split("/").pop()}, score:${r.score.toFixed(3)})\n${r.snippet}`
            ).join("\n\n")
          }
        } catch {}
        const results = search(ctx.cwd, query, { limit, scope })
        if (results.length === 0) return "No matching memories found."
        return formatResults(results)
      })()
    }
  } catch {}
  const results = search(ctx.cwd, query, { limit, scope })
  if (results.length === 0) return "No matching memories found."
  return formatResults(results)
}

/** action put — the retired put tool surface (side-effect gate, unchanged semantics + scope validation). */
function execPut(args, ctx) {
  const scope = String(args.scope ?? "personal")
  if (!VALID_SCOPES.has(scope)) {
    if (scope === "team") return "Error: memory put: VS Code memory has no team layer — team memory is managed by the CLI"
    return `Error: memory put: invalid scope "${scope}" — must be one of: ${[...VALID_SCOPES].join(", ")}`
  }
  const { type, title, content, tags } = args
  if (!VALID_TYPES.has(type)) {
    return `Error: invalid type "${type}". Must be one of: ${[...VALID_TYPES].join(", ")}`
  }
  if (!title || !content) return "Error: memory entry requires title and content"
  const dir = scopeDir(ctx.cwd, scope)
  ensureDir(dir)

  const filename = entryFilename(title)
  const filePath = join(dir, filename)
  const markdown = serializeEntry({ type, title: title.trim(), content: content.trim(), tags })
  writeFileSync(filePath, markdown, "utf8")
  return `Saved memory entry "${title.trim()}" (type: ${type}, scope: ${scope}, id=${filename})`
}

function formatResults(entries) {
  return entries.map(e => {
    const title = e.title || "(untitled)"
    const type = e.type || "unknown"
    const tags = e.tags ? ` [${e.tags}]` : ""
    const content = (e.content || "").slice(0, 200)
    const truncated = e.content && e.content.length > 200 ? "..." : ""
    return `[${type}]${tags} ${title} (id=${e._file})\n  ${content}${truncated}`
  }).join("\n\n")
}

/** action list — new inventory action (read-only): scope/type/keyword filters + truncation note. */
function execList(args, ctx) {
  const scope = args.scope ?? null
  if (scope && !VALID_SCOPES.has(scope)) {
    if (scope === "team") return "Error: memory list: VS Code memory has no team layer — team memory is managed by the CLI"
    return `Error: memory list: invalid scope "${scope}" — scopes: ${[...VALID_SCOPES].join("/")}`
  }
  const typeErr = invalidType(args.type)
  if (typeErr) return typeErr
  const typeCheck = args.type ? String(args.type) : null
  const keyword = args.keyword ? String(args.keyword).trim().toLowerCase() : null
  let entries = scope ? readAllEntries(scopeDir(ctx.cwd, scope)) : readAllScopeEntries(ctx.cwd)
  entries = entries.filter((e) =>
    (!typeCheck || e.type === typeCheck) &&
    (!keyword || String(e.title ?? "").toLowerCase().includes(keyword) || String(e.content ?? "").toLowerCase().includes(keyword))
  )
  if (entries.length === 0) return "0 条匹配"
  entries.sort((a, b) => String(b.created ?? "").localeCompare(String(a.created ?? "")))
  const limit = normalizeLimit(args.limit, 50)
  const shown = entries.slice(0, limit)
  const lines = shown.map(listRow)
  if (entries.length > shown.length) lines.unshift(`${shown.length} 条——截断前 ${entries.length}`)
  return lines.join("\n")
}

/** action delete — single ({ id, scope } — §0.1-era delete semantics) + batch (scope + type/keyword + confirm). */
function execDelete(args, ctx) {
  const hasId = args.id !== undefined && args.id !== null && String(args.id) !== ""
  if (hasId) return execDeleteSingle(args, ctx)
  // batch form
  const scope = args.scope
  if (!scope) return "Error: batch delete requires scope plus type and/or keyword filter"
  if (!VALID_SCOPES.has(scope)) {
    if (scope === "team") return "Error: memory delete: VS Code memory has no team layer — team memory is managed by the CLI"
    return `Error: memory delete: invalid scope "${scope}" — must be one of: ${[...VALID_SCOPES].join(", ")}`
  }
  const typeErr = invalidType(args.type)
  if (typeErr) return typeErr
  const typeCheck = args.type ? String(args.type) : null
  const keyword = args.keyword ? String(args.keyword).trim().toLowerCase() : null
  if (!typeCheck && !keyword) {
    return "Error: batch delete requires type and/or keyword filter — a scope-wide wipe without filters is refused (personal full wipe is the clear action)"
  }
  const dir = scopeDir(ctx.cwd, scope)
  let rows = readAllEntries(dir)
  rows = rows.filter((e) =>
    (!typeCheck || e.type === typeCheck) &&
    (!keyword || String(e.title ?? "").toLowerCase().includes(keyword) || String(e.content ?? "").toLowerCase().includes(keyword))
  )
  rows.sort((a, b) => String(b.created ?? "").localeCompare(String(a.created ?? "")))
  if (rows.length === 0) return "0 条匹配"
  if (args.confirm !== true) {
    const lines = [rows.length > 5 ? `将删 ${rows.length} 条：前 5 条预览` : `将删 ${rows.length} 条`]
    lines.push(...rows.slice(0, 5).map(listRow))
    if (rows.length > 5) lines.push(`5 条——截断前 ${rows.length}`)
    lines.push("confirm:true required — re-send with it to execute the deletion")
    return lines.join("\n")
  }
  for (const e of rows) {
    try { unlinkSync(join(dir, e._file)) } catch { /* best effort per file — count reflects matched rows */ }
  }
  return `Deleted ${rows.length} entries in scope ${scope}`
}

/**
 * Single-entry delete — id (filename) + scope; scope locates the storage directory
 * (memoryDir(cwd)/<scope>) — an id not in that scope's directory is an error (NF2/NF3).
 * Reads the entry content before deleting (F3 — auditable, recoverable).
 */
function execDeleteSingle(args, ctx) {
  const { id, scope } = args
  if (!scope) return "Error: delete requires id + scope"
  if (!VALID_SCOPES.has(scope)) {
    if (scope === "team") return "Error: memory delete: VS Code memory has no team layer — team memory is managed by the CLI"
    return `Error: invalid scope "${scope}". Must be one of: ${[...VALID_SCOPES].join(", ")}`
  }
  // id must be a bare filename: separators / ".." would escape the scope directory (NF3)
  const bare = id && !id.includes("/") && !id.includes("\\") && id !== "." && id !== ".."
  if (!bare) {
    return `Error: memory ${id ?? ""} not found in scope ${scope}`
  }
  const filePath = join(scopeDir(ctx.cwd, scope), id)
  if (!existsSync(filePath)) {
    return `Error: memory ${id} not found in scope ${scope}`
  }
  const raw = readFileSync(filePath, "utf8")
  const parsed = parseEntry(raw)
  const title = parsed?.title ?? "(untitled)"
  const content = parsed?.content ?? raw
  unlinkSync(filePath)
  return `Deleted ${id}: ${title}\n${content}`
}

/** action clear — personal-only full wipe (scope + confirm:true gates; project refused with guidance). */
function execClear(args, ctx) {
  const scope = args.scope
  if (!scope) return 'Error: clear requires scope "personal" — pass scope: "personal" plus confirm: true'
  if (scope !== "personal") {
    if (scope === "team") return "Error: memory clear: VS Code memory has no team layer — team memory is managed by the CLI"
    return "Error: shared layers don't support clear — use delete with type/keyword batch filters instead"
  }
  if (args.confirm !== true) return "Error: clear requires confirm:true — this wipes ALL personal memory"
  const dir = scopeDir(ctx.cwd, "personal")
  const entries = readAllEntries(dir)
  for (const e of entries) {
    try { unlinkSync(join(dir, e._file)) } catch { /* best effort per file — count reflects found entries */ }
  }
  return `Cleared personal memory (${entries.length} entries deleted)`
}

