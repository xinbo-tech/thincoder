/**
 * memory-tool.mjs — the merged `memory` agent tool (MEMORY.md §3, five actions).
 * Split out of memory.mjs (500-line hard limit) — core storage/search stays in
 * memory.mjs; this module only builds the tool surface + its action executors.
 *
 * layer terminology (2026-09-08 — 用户裁定统一成 layer): the MODEL-VISIBLE surface
 * (args param `layer`, schema field, tool description, result rows, output/error
 * strings) speaks one word — layer. The storage helpers imported from memory.mjs
 * (VALID_SCOPES / scopeDir / readAllScopeEntries / the search option) keep their
 * internal legacy "scope" vocabulary — they are implementation internals the model
 * never sees; the mapping point is only this module's args → storage boundary.
 */

import { readFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs"
import { join } from "node:path"
import { getEmbedder } from "./embed-config.mjs"
import { loadIndexManifest, searchIndex } from "./indexer.mjs"
import {
  VALID_TYPES, VALID_SCOPES, memoryDir, scopeDir, readAllEntries, readAllScopeEntries,
  entryFilename, serializeEntry, parseEntry, search, ensureDir,
} from "./memory.mjs"

// ─── tools ────────────────────────────────────────────────────


/** §3 merged memory tool — five actions on the personal/project layers (this extension has
 *  no team layer and rejects team with CLI guidance). The tool surface speaks `layer`
 *  end-to-end (param/schema/description/rows/outputs); search/list are read-only actions
 *  (isReadonlyAction — execute-tools.mjs: plan mode passes, no permission ask,
 *  readonly-parallel batches); put/delete/clear keep their side-effect gates —
 *  confirm:true is the batch-delete/clear tool-level gate (direct-delete ruling:
 *  the confirm parameter IS the gate, no second human step). */
const MEMORY_ACTIONS = ["search", "put", "list", "delete", "clear"]
const MEMORY_TOOL_DESCRIPTION =
  "Manage long-term memory in ONE tool — the action parameter picks the operation:\n" +
  "- search — find knowledge saved in previous sessions (query, optional layer/limit); every result row starts with a [layer] tag and carries the entry id — 会话消息历史不在 memory——用 read_history\n" +
  "- put — save a piece of knowledge for future sessions (type: rule = coding standards, knowledge = project facts, decision = architecture decisions, pattern = debugging/workflow patterns; title/content/tags; layer defaults to personal)\n" +
  "- list — inventory what memory holds: optional layer/type/keyword filters, limit default 50; one row per entry: [layer] id [type] title (date); a truncated list notes the full count\n" +
  "- delete — SINGLE: {id, layer} deletes one entry by the id shown in search/list output — layer is OPTIONAL: pass it to verify the entry really lives in that layer (a mismatch is refused — protection against deleting the wrong entry); omit it to route by where the id actually lives. BATCH (no id): {layer + type and/or keyword} deletes every matching entry in that layer — a call without confirm:true is refused and returns the count plus a preview (re-send with confirm:true to execute); a layer-wide wipe without filters is refused on every layer\n" +
  "- clear — {layer: \"personal\", confirm: true} wipes ALL personal memory entries. clear is personal-only: a missing layer or a project layer is refused (use delete batch filters on shared layers)\n" +
  "layer = the memory tier an entry lives in: personal (private) or project (shared via this repo's .thincoder/memory/). The [layer] tag on search/list result rows and delete's layer parameter are the same concept — pass a result row's [layer] into delete, or omit layer and delete auto-routes by the id's actual location.\n" +
  "Save bugs, conventions, and preferences here — they persist across sessions. For project-level task tracking use checklist; for reusable project instructions use skill."

/** Date display for list/preview rows: frontmatter created date; unknown → "?" */
function rowDate(created) {
  return created ? String(created).slice(0, 10) : "?"
}

/** The [layer] tag of an entry row: its physical storage layer (personal/project).
 *  Legacy entries physically at the memory root have no layer (_scope "root") → null
 *  (no tag — they predate layers and cannot be addressed by a layer parameter). */
function layerTag(entry) {
  const s = entry?._scope
  return s && VALID_SCOPES.has(s) ? `[${s}]` : null
}

/** Compact row shared by list and batch-delete preview (id = entry filename), with the
 *  standalone [layer] tag column at the front (aligned with search result rows). */
function listRow(entry) {
  const tag = layerTag(entry)
  return `${tag ? tag + " " : ""}${entry._file} [${entry.type}] ${entry.title}（${rowDate(entry.created)}）`
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

/** Layer from a searchIndex result's relative file path (.thincoder/memory/<layer>/…),
 *  or null for legacy files at the memory root. */
function layerOfFile(file) {
  const m = String(file).replaceAll("\\", "/").match(/\/memory\/([^/]+)\//)
  return m && VALID_SCOPES.has(m[1]) ? m[1] : null
}

/** Drop vector-hit rows whose memory file no longer exists on disk — the stale-index guard
 *  (deleted/cleared entries must never re-surface through the vector path, which is rebuilt
 *  wholesale on the panel's next needsRebuild check). Exported for deterministic tests
 *  (pure, no embedder needed). */
export function filterAliveFiles(cwd, rows) {
  return rows.filter((r) => {
    try { return existsSync(join(cwd, r.file)) } catch { return false }
  })
}

export const memoryTool = {
  name: "memory",
  description: MEMORY_TOOL_DESCRIPTION,
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: MEMORY_ACTIONS, description: "Operation to run (required)" },
      layer: { type: "string", enum: [...VALID_SCOPES], description: "Which layer the entry lives in: personal (private) or project (shared via this repo's .thincoder/memory/); team is managed by the CLI. put defaults to personal; search/list cover every layer when omitted; delete single: optional (omitted = auto-route by where the id actually lives); delete batch & clear: required (clear accepts only personal)" },
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
  // §3 action-level classification (execute-tools.mjs reads this): search/list are read-only
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

/** action search — read-only; optional layer filter, same output contract. */
function execSearch(args, ctx) {
  const layer = args.layer ?? null
  if (layer && !VALID_SCOPES.has(layer)) {
    if (layer === "team") return "Error: memory search: VS Code memory has no team layer — team memory is managed by the CLI"
    return `Error: memory search: invalid layer "${layer}" — layers: ${[...VALID_SCOPES].join("/")}`
  }
  const query = String(args.query ?? "").trim()
  if (!query) return "No matching memories found." // 空 query 短路——两端同语义（评审 code review #4）
  const limit = normalizeLimit(args.limit, 5)
  // Vector search first if embedder + index available (layer-restricted results only)
  try {
    const embedder = getEmbedder()
    const manifest = embedder ? loadIndexManifest(ctx.cwd) : null
    if (manifest) {
      return (async () => {
        try {
          const vecResults = await searchIndex(ctx.cwd, embedder, query, { kind: "memory", limit: limit || 5 })
          const scoped = layer
            ? vecResults.filter((r) => String(r.file).replaceAll("\\", "/").includes(`/${layer}/`))
            : vecResults
          // stale-index guard: the semantic index is whole-rebuild (needsRebuild detects a removed
          // memory file on the panel's next check), so rows whose file is already gone (deleted /
          // cleared since the last build) must never be re-surfaced here — VSC delete keeps the
          // disk as truth and this read guard is the observable cleanup boundary.
          const alive = filterAliveFiles(ctx.cwd, scoped)
          if (alive.length > 0) {
            return alive.map((r) => {
              const tag = layerOfFile(r.file)
              return `${tag ? tag + " " : ""}${r.file}:${r.startLine}-${r.endLine} (id=${r.file.split("/").pop()}, score:${r.score.toFixed(3)})\n${r.snippet}`
            }).join("\n\n")
          }
        } catch {}
        const results = search(ctx.cwd, query, { limit, scope: layer }) // memory.mjs 内部 option 保留 scope 名——工具面已统一 layer
        if (results.length === 0) return "No matching memories found."
        return formatResults(results)
      })()
    }
  } catch {}
  const results = search(ctx.cwd, query, { limit, scope: layer })
  if (results.length === 0) return "No matching memories found."
  return formatResults(results)
}

/** action put — side-effect gate, unchanged semantics; layer defaults to personal. */
function execPut(args, ctx) {
  const layer = String(args.layer ?? "personal")
  if (!VALID_SCOPES.has(layer)) {
    if (layer === "team") return "Error: memory put: VS Code memory has no team layer — team memory is managed by the CLI"
    return `Error: memory put: invalid layer "${layer}" — must be one of: ${[...VALID_SCOPES].join(", ")}`
  }
  const { type, title, content, tags } = args
  if (!VALID_TYPES.has(type)) {
    return `Error: invalid type "${type}". Must be one of: ${[...VALID_TYPES].join(", ")}`
  }
  if (!title || !content) return "Error: memory entry requires title and content"
  const dir = scopeDir(ctx.cwd, layer)
  ensureDir(dir)

  const filename = entryFilename(title)
  const filePath = join(dir, filename)
  const markdown = serializeEntry({ type, title: title.trim(), content: content.trim(), tags })
  writeFileSync(filePath, markdown, "utf8")
  return `Saved memory entry "${title.trim()}" (type: ${type}, layer: ${layer}, id=${filename})`
}

function formatResults(entries) {
  return entries.map(e => {
    const title = e.title || "(untitled)"
    const type = e.type || "unknown"
    const tags = e.tags ? ` [${e.tags}]` : ""
    const content = (e.content || "").slice(0, 200)
    const truncated = e.content && e.content.length > 200 ? "..." : ""
    const tag = layerTag(e)
    return `${tag ? tag + " " : ""}[${type}]${tags} ${title} (id=${e._file})\n  ${content}${truncated}`
  }).join("\n\n")
}

/** action list — read-only inventory action: layer/type/keyword filters + truncation note. */
function execList(args, ctx) {
  const layer = args.layer ?? null
  if (layer && !VALID_SCOPES.has(layer)) {
    if (layer === "team") return "Error: memory list: VS Code memory has no team layer — team memory is managed by the CLI"
    return `Error: memory list: invalid layer "${layer}" — layers: ${[...VALID_SCOPES].join("/")}`
  }
  const typeErr = invalidType(args.type)
  if (typeErr) return typeErr
  const typeCheck = args.type ? String(args.type) : null
  const keyword = args.keyword ? String(args.keyword).trim().toLowerCase() : null
  let entries = layer
    ? readAllEntries(scopeDir(ctx.cwd, layer)).map((e) => ({ ...e, _scope: layer }))
    : readAllScopeEntries(ctx.cwd)
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

/** action delete — single ({ id, layer? } — layer optional: validate when given, else route by
 *  the id's physical location) + batch (layer + type/keyword + confirm:true). */
function execDelete(args, ctx) {
  const hasId = args.id !== undefined && args.id !== null && String(args.id) !== ""
  if (hasId) return execDeleteSingle(args, ctx)
  // batch form
  const layer = args.layer
  if (!layer) return "Error: batch delete requires layer + type/keyword filter + confirm:true"
  if (!VALID_SCOPES.has(layer)) {
    if (layer === "team") return "Error: memory delete: VS Code memory has no team layer — team memory is managed by the CLI"
    return `Error: memory delete: invalid layer "${layer}" — must be one of: ${[...VALID_SCOPES].join(", ")}`
  }
  const typeErr = invalidType(args.type)
  if (typeErr) return typeErr
  const typeCheck = args.type ? String(args.type) : null
  const keyword = args.keyword ? String(args.keyword).trim().toLowerCase() : null
  if (!typeCheck && !keyword) {
    return "Error: batch delete requires type and/or keyword filter — a layer-wide wipe without filters is refused (personal full wipe is the clear action)"
  }
  const dir = scopeDir(ctx.cwd, layer)
  let rows = readAllEntries(dir).map((e) => ({ ...e, _scope: layer }))
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
  return `Deleted ${rows.length} entries in layer ${layer}`
}

/**
 * The physical directories an entry file may live in, in lookup order: the legacy memory
 * root first (files written before layers existed — _scope "root", no layer), then the
 * layer dirs. Delete locates an id by its ACTUAL origin here, never by assuming a layer
 * directory — that is what makes search/list rows deletable regardless of which layer
 * (or the legacy root) they came from.
 */
function originDirs(cwd) {
  return [
    { layer: null, dir: memoryDir(cwd) },
    { layer: "personal", dir: scopeDir(cwd, "personal") },
    { layer: "project", dir: scopeDir(cwd, "project") },
  ]
}

/** Find the directory an id (bare filename) physically lives in. onlyLayer restricts the
 *  lookup to one layer dir (used for the layer validation path). Missing dirs are skipped
 *  (ENOENT-tolerant); returns null when the file is not on disk anywhere. */
function locateEntry(cwd, id, onlyLayer = null) {
  const dirs = onlyLayer
    ? [{ layer: onlyLayer, dir: scopeDir(cwd, onlyLayer) }]
    : originDirs(cwd)
  for (const d of dirs) {
    try { if (existsSync(join(d.dir, id))) return d } catch { /* unreadable dir — skip */ }
  }
  return null
}

/** Read-then-delete at a located origin (F3 — auditable, recoverable). ENOENT between the
 *  locate and the unlink is tolerated (already gone — never a false success claim). */
function deleteAt(loc, id) {
  const filePath = join(loc.dir, id)
  let raw
  try {
    raw = readFileSync(filePath, "utf8")
  } catch (e) {
    if (e?.code === "ENOENT") return `Error: memory ${id} not found`
    return `Error: memory ${id}: cannot read the file (${e?.message ?? e})`
  }
  const parsed = parseEntry(raw)
  const title = parsed?.title ?? "(untitled)"
  const content = parsed?.content ?? raw
  try {
    unlinkSync(filePath)
  } catch (e) {
    if (e?.code === "ENOENT") return `Error: memory ${id} not found`
    return `Error: memory ${id}: cannot delete the file (${e?.message ?? e})`
  }
  return `Deleted ${id}: ${title}\n${content}`
}

/**
 * Single-entry delete — id (filename) + optional layer. The id locates its file by physical
 * origin (see originDirs); the layer argument is a validation gate: when given, the file
 * must live in that layer's directory, otherwise the delete is refused (anti-mistake —
 * 防误删). When omitted, the id routes straight to wherever it actually lives, so any id
 * surfaced by search/list deletes directly. Local dirs missing → not-found error
 * (ENOENT tolerance, no false success). Index cleanup is VSC-file-as-truth: no per-entry
 * DB/index row exists to remove at delete time — the optional semantic vector index is
 * whole-rebuild (needsRebuild detects the removed memory file) and its read path guards
 * stale rows (see execSearch), so a deleted entry is never re-surfaced.
 */
function execDeleteSingle(args, ctx) {
  const { id, layer } = args
  // id must be a bare filename: separators / ".." would escape the memory directory (NF3)
  const bare = id && !id.includes("/") && !id.includes("\\") && id !== "." && id !== ".."
  if (!bare) {
    return layer
      ? `Error: memory ${id ?? ""} not found in layer ${layer}`
      : `Error: memory ${id ?? ""} not found`
  }
  if (layer !== undefined && layer !== null && layer !== "") {
    if (!VALID_SCOPES.has(layer)) {
      if (layer === "team") return "Error: memory delete: VS Code memory has no team layer — team memory is managed by the CLI"
      return `Error: memory delete: invalid layer "${layer}" — must be one of: ${[...VALID_SCOPES].join(", ")}`
    }
    const inLayer = locateEntry(ctx.cwd, id, layer)
    if (inLayer) return deleteAt(inLayer, id)
    // Not in the requested layer — distinguish a mismatch (file lives elsewhere) from a miss.
    const anywhere = locateEntry(ctx.cwd, id)
    if (anywhere) {
      if (anywhere.layer) {
        return `Error: memory ${id}: 与 layer ${layer} 不匹配 — the file lives in layer ${anywhere.layer}（防误删——传 layer "${anywhere.layer}" 或省略 layer 按实际位置删除）`
      }
      return `Error: memory ${id}: 与 layer ${layer} 不匹配 — the file is a legacy entry without a layer（省略 layer 按实际位置删除）`
    }
    return `Error: memory ${id} not found in layer ${layer}`
  }
  // layer omitted → route by the id's physical origin
  const loc = locateEntry(ctx.cwd, id)
  if (!loc) return `Error: memory ${id} not found`
  return deleteAt(loc, id)
}

/** action clear — personal-only full wipe (layer + confirm:true gates; project refused with guidance). */
function execClear(args, ctx) {
  const layer = args.layer
  if (!layer) return 'Error: clear requires layer "personal" — pass layer: "personal" plus confirm: true'
  if (layer === "team") return "Error: memory clear: VS Code memory has no team layer — team memory is managed by the CLI"
  if (layer !== "personal") return `Error: clear is personal-only — layer "${layer}" doesn't support clear (use delete with type/keyword batch filters on shared layers)`
  if (args.confirm !== true) return "Error: clear requires confirm:true — this wipes ALL personal memory"
  const dir = scopeDir(ctx.cwd, "personal")
  const entries = readAllEntries(dir)
  for (const e of entries) {
    try { unlinkSync(join(dir, e._file)) } catch { /* best effort per file — count reflects found entries */ }
  }
  return `Cleared personal memory (${entries.length} entries deleted)`
}
